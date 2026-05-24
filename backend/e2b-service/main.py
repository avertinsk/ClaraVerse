#!/usr/bin/env python3
"""
Local Python Code Executor for ClaraVerse
Replaces E2B cloud sandbox with local subprocess execution in isolated temp directories.
"""

import os
import re
import sys
import io
import base64
import json
import shutil
import subprocess
import tempfile
import time
import logging
import glob as glob_module
from typing import List, Optional, Dict, Any
from pathlib import Path

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Local Python Executor",
    description="Executes Python code locally in isolated temp directories",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response Models (identical to original E2B interface)

class ExecuteRequest(BaseModel):
    code: str
    timeout: Optional[int] = 30


class PlotResult(BaseModel):
    format: str
    data: str


class ExecuteResponse(BaseModel):
    success: bool
    stdout: str
    stderr: str
    error: Optional[str] = None
    plots: List[PlotResult] = []
    execution_time: Optional[float] = None


class AdvancedExecuteRequest(BaseModel):
    code: str
    timeout: Optional[int] = 30
    dependencies: List[str] = []
    output_files: List[str] = []


class FileResult(BaseModel):
    filename: str
    data: str
    size: int


class AdvancedExecuteResponse(BaseModel):
    success: bool
    stdout: str
    stderr: str
    error: Optional[str] = None
    plots: List[PlotResult] = []
    files: List[FileResult] = []
    execution_time: Optional[float] = None
    install_output: str = ""


# ---------------------------------------------------------------------------
# Local execution helpers
# ---------------------------------------------------------------------------

def _execute_in_subprocess(
    code: str,
    timeout: int,
    workdir: Path,
    env: Optional[Dict[str, str]] = None,
) -> tuple[str, str, Optional[str], List[PlotResult]]:
    """Run Python code in workdir, return (stdout, stderr, error, plots)."""
    code_path = workdir / "code.py"

    # Inject plot capture: redirect matplotlib/pyplot to savefig before show
    # so any generated plots are preserved as PNG in workdir.
    preamble = """\
import sys, os, base64, json
os.chdir(os.path.dirname(os.path.abspath(__file__)))
_saved_plot_paths = []

# -- intercept matplotlib --
try:
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as _plt
    _original_show = _plt.show
    _plot_counter = [0]
    def _capture_show(*args, **kwargs):
        path = os.path.join(os.getcwd(), f"_plot_{_plot_counter[0]:04d}.png")
        _plt.savefig(path, dpi=100, bbox_inches='tight')
        _plt.close()
        _saved_plot_paths.append(path)
        _plot_counter[0] += 1
    _plt.show = _capture_show
except ImportError:
    pass

# -- intercept PIL Image.show() --
try:
    from PIL import Image as _PILImage
    _original_image_show = _PILImage.Image.show
    _plot_counter_pil = [0]
    def _capture_pil_show(self):
        path = os.path.join(os.getcwd(), f"_plot_pil_{_plot_counter_pil[0]:04d}.png")
        self.save(path)
        _saved_plot_paths.append(path)
        _plot_counter_pil[0] += 1
    _PILImage.Image.show = _capture_pil_show
except ImportError:
    pass

# -- intercept plotnine --
try:
    import plotnine as _p9
    _original_save = _p9.ggplot.save
    _plot_counter_p9 = [0]
    def _capture_plotnine_save(self, filename=None, **kwargs):
        if filename is None:
            path = os.path.join(os.getcwd(), f"_plot_p9_{_plot_counter_p9[0]:04d}.png")
            _original_save(self, path, **kwargs)
            _saved_plot_paths.append(path)
            _plot_counter_p9[0] += 1
        else:
            _original_save(self, filename, **kwargs)
    _p9.ggplot.save = _capture_plotnine_save
except ImportError:
    pass

# -- intercept altair --
try:
    import altair as _alt
    _original_alt_save = _alt.Chart.save
    _plot_counter_alt = [0]
    def _capture_altair_save(self, fp, **kwargs):
        _original_alt_save(self, fp, **kwargs)
        path = os.path.join(os.getcwd(), f"_plot_alt_{_plot_counter_alt[0]:04d}.png")
        _saved_plot_paths.append(path)
        _plot_counter_alt[0] += 1
    _alt.Chart.save = _capture_altair_save
except ImportError:
    pass

# -- intercept bokeh --
try:
    from bokeh.io import export_png as _bokeh_export
    import bokeh.plotting as _bokeh_plot
    _original_bokeh_show = _bokeh_plot.show
    _plot_counter_bk = [0]
    def _capture_bokeh_show(obj, **kwargs):
        if hasattr(obj, 'figure'):
            fig = obj.figure
        else:
            fig = obj
        path = os.path.join(os.getcwd(), f"_plot_bk_{_plot_counter_bk[0]:04d}.png")
        _bokeh_export(fig, filename=path)
        _saved_plot_paths.append(path)
        _plot_counter_bk[0] += 1
    _bokeh_plot.show = _capture_bokeh_show
except ImportError:
    pass

# -- intercept seaborn (uses matplotlib under the hood, already handled) --
"""

    # Epilogue: dump plot paths as JSON so the parent can read them
    epilogue = """\
_plot_data = []
for _p in _saved_plot_paths:
    if os.path.exists(_p):
        with open(_p, 'rb') as _fh:
            _b64 = base64.b64encode(_fh.read()).decode('utf-8')
        _plot_data.append({"format": _p.rsplit('.', 1)[-1], "data": _b64})
print("__PLOTS__" + json.dumps(_plot_data))
"""

    full_code = preamble + "\n# --- user code ---\n" + code + "\n# --- end user code ---\n" + epilogue

    code_path.write_text(full_code, encoding="utf-8")

    merged_env = os.environ.copy()
    if env:
        merged_env.update(env)
    merged_env.setdefault("PYTHONUNBUFFERED", "1")
    merged_env.setdefault("PYTHONDONTWRITEBYTECODE", "1")
    merged_env.setdefault("MPLBACKEND", "Agg")

    start = time.perf_counter()
    try:
        proc = subprocess.run(
            [sys.executable, str(code_path)],
            cwd=str(workdir),
            env=merged_env,
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        elapsed = time.perf_counter() - start
        stdout = proc.stdout or ""
        stderr = proc.stderr or ""
    except subprocess.TimeoutExpired:
        elapsed = time.perf_counter() - start
        return (
            "",
            "",
            f"Execution timed out after {timeout} seconds",
            [],
        )
    except Exception as exc:
        elapsed = time.perf_counter() - start
        return ("", "", str(exc), [])

    # Separate plot JSON from stdout
    plots: List[PlotResult] = []
    cleaned_stdout = stdout
    match = re.search(r'__PLOTS__(\[.*\])\s*$', stdout, re.DOTALL)
    if match:
        try:
            plot_list = json.loads(match.group(1))
            for p in plot_list:
                plots.append(PlotResult(format=p.get("format", "png"), data=p.get("data", "")))
        except (json.JSONDecodeError, KeyError):
            pass
        cleaned_stdout = stdout[: match.start()].rstrip()

    # Also scan workdir for any PNG files not already captured
    existing_paths = {p.data[:50] for p in plots}  # rough dedup
    for png_path in sorted(glob_module.glob(str(workdir / "_plot_*.png"))):
        with open(png_path, "rb") as fh:
            b64 = base64.b64encode(fh.read()).decode("utf-8")
        if b64[:50] not in existing_paths:
            plots.append(PlotResult(format="png", data=b64))
            existing_paths.add(b64[:50])

    # If proc returned non-zero but we still have stdout, treat as partial success
    error: Optional[str] = None
    if proc.returncode != 0:
        error = f"Process exited with code {proc.returncode}"
        if stderr:
            error += f": {stderr.strip()[:500]}"

    return cleaned_stdout, stderr, error, plots


def _detect_files(workdir: Path, requested: List[str]) -> List[FileResult]:
    """Collect output files from workdir."""
    results: List[FileResult] = []
    seen = set()

    for pattern in requested:
        for path in sorted(glob_module.glob(str(workdir / pattern))):
            p = Path(path)
            if not p.is_file():
                continue
            if p.name in seen:
                continue
            seen.add(p.name)
            data = p.read_bytes()
            results.append(FileResult(
                filename=p.name,
                data=base64.b64encode(data).decode("utf-8"),
                size=len(data),
            ))

    # Also collect auto-detected PNG/SVG files not in requested
    for ext in ("*.png", "*.svg", "*.jpg", "*.jpeg", "*.gif", "*.csv", "*.json", "*.txt", "*.html", "*.pdf"):
        for path in sorted(glob_module.glob(str(workdir / ext))):
            p = Path(path)
            if not p.is_file() or p.name.startswith("_plot_") or p.name == "code.py":
                continue
            if p.name in seen:
                continue
            seen.add(p.name)
            data = p.read_bytes()
            results.append(FileResult(
                filename=p.name,
                data=base64.b64encode(data).decode("utf-8"),
                size=len(data),
            ))

    return results


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "local-python-executor",
        "mode": "local",
    }


@app.post("/execute", response_model=ExecuteResponse)
async def execute_code(request: ExecuteRequest):
    logger.info(f"Executing code (length: {len(request.code)} chars, timeout: {request.timeout}s)")
    workdir = None
    try:
        workdir = Path(tempfile.mkdtemp(prefix="claraverse_exec_"))
        stdout, stderr, error, plots = _execute_in_subprocess(
            request.code, request.timeout, workdir
        )
        elapsed = time.perf_counter()
        return ExecuteResponse(
            success=error is None,
            stdout=stdout,
            stderr=stderr,
            error=error,
            plots=plots,
        )
    except Exception as e:
        logger.error(f"Execution failed: {e}")
        raise HTTPException(status_code=500, detail=f"Execution failed: {str(e)}")
    finally:
        if workdir and workdir.exists():
            shutil.rmtree(workdir, ignore_errors=True)


@app.post("/execute-with-files", response_model=ExecuteResponse)
async def execute_with_files(
    code: str = Form(...),
    files: List[UploadFile] = File(...),
    timeout: int = Form(30),
):
    logger.info(f"Executing code with {len(files)} files (timeout: {timeout}s)")
    workdir = None
    try:
        workdir = Path(tempfile.mkdtemp(prefix="claraverse_exec_"))

        # Write uploaded files to workdir
        for file in files:
            content = await file.read()
            dest = workdir / (file.filename or "upload.bin")
            dest.write_bytes(content)
            logger.info(f"Uploaded file: {dest.name} ({len(content)} bytes)")

        stdout, stderr, error, plots = _execute_in_subprocess(
            code, timeout, workdir
        )
        return ExecuteResponse(
            success=error is None,
            stdout=stdout,
            stderr=stderr,
            error=error,
            plots=plots,
        )
    except Exception as e:
        logger.error(f"Execution with files failed: {e}")
        raise HTTPException(status_code=500, detail=f"Execution failed: {str(e)}")
    finally:
        if workdir and workdir.exists():
            shutil.rmtree(workdir, ignore_errors=True)


@app.post("/execute-advanced", response_model=AdvancedExecuteResponse)
async def execute_advanced(request: AdvancedExecuteRequest):
    logger.info(
        f"Advanced execution: code={len(request.code)} chars, "
        f"deps={request.dependencies}, output_files={request.output_files}, "
        f"timeout={request.timeout}s"
    )
    workdir = None
    install_output = ""
    start_time = time.perf_counter()

    try:
        workdir = Path(tempfile.mkdtemp(prefix="claraverse_exec_"))

        # Install dependencies
        if request.dependencies:
            deps_str = " ".join(request.dependencies)
            logger.info(f"Installing dependencies: {deps_str}")
            try:
                result = subprocess.run(
                    [sys.executable, "-m", "pip", "install", "-q"] + request.dependencies,
                    capture_output=True,
                    text=True,
                    timeout=120,
                )
                install_output = (result.stdout or "") + (result.stderr or "")
                if result.returncode != 0:
                    logger.warning(f"Dependency install had issues: {install_output[:200]}")
                else:
                    logger.info(f"Dependencies installed")

                # Also write requirements.txt for reproducibility
                (workdir / "requirements.txt").write_text("\n".join(request.dependencies))
            except subprocess.TimeoutExpired:
                install_output = "Dependency installation timed out after 120s"
                logger.error(install_output)
                return AdvancedExecuteResponse(
                    success=False,
                    stdout="",
                    stderr="",
                    error="Dependency installation timed out",
                    execution_time=time.perf_counter() - start_time,
                    install_output=install_output,
                )

        stdout, stderr, error, plots = _execute_in_subprocess(
            request.code, request.timeout, workdir
        )

        # Collect output files
        files = _detect_files(workdir, request.output_files)

        elapsed = time.perf_counter() - start_time
        return AdvancedExecuteResponse(
            success=error is None,
            stdout=stdout,
            stderr=stderr,
            error=error,
            plots=plots,
            files=files,
            execution_time=elapsed,
            install_output=install_output,
        )
    except Exception as e:
        logger.error(f"Advanced execution failed: {e}")
        raise HTTPException(status_code=500, detail=f"Execution failed: {str(e)}")
    finally:
        if workdir and workdir.exists():
            shutil.rmtree(workdir, ignore_errors=True)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")
