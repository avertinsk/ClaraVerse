import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Save, X, Loader2, Terminal, FileDown } from 'lucide-react';
import { executePythonCode, type E2BExecuteResponse } from '@/services/e2bService';
import { toast } from '@/store/useToastStore';
import styles from './CodeEditor.module.css';

const DEFAULT_CODE = `import matplotlib.pyplot as plt
import numpy as np

# Generate data
x = np.linspace(0, 10, 100)
y = np.sin(x)

# Create plot
plt.figure(figsize=(8, 4))
plt.plot(x, y, label='sin(x)')
plt.title('Hello from ClaraVerse!')
plt.xlabel('x')
plt.ylabel('sin(x)')
plt.legend()
plt.grid(True)
plt.show()

print("Done!")`;

interface SavedSnippet {
  id: string;
  name: string;
  code: string;
  dependencies: string[];
  createdAt: string;
}

function loadSnippets(): SavedSnippet[] {
  try {
    return JSON.parse(localStorage.getItem('claraverse_code_snippets') || '[]');
  } catch {
    return [];
  }
}

function saveSnippets(snippets: SavedSnippet[]) {
  localStorage.setItem('claraverse_code_snippets', JSON.stringify(snippets));
}

interface CodeEditorProps {
  initialCode?: string;
  snippetId?: string;
  onBack?: () => void;
}

export function CodeEditor({ initialCode, snippetId, onBack }: CodeEditorProps) {
  const [code, setCode] = useState(initialCode || DEFAULT_CODE);
  const [deps, setDeps] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<E2BExecuteResponse | null>(null);
  const [outputTab, setOutputTab] = useState<'output' | 'plots' | 'files'>('output');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [snippetName, setSnippetName] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const runCode = useCallback(async () => {
    setRunning(true);
    setResult(null);
    try {
      const depsList = deps
        .split(',')
        .map(d => d.trim())
        .filter(Boolean);
      const res = await executePythonCode(code, {
        timeout: 30,
        dependencies: depsList,
      });
      setResult(res);
      if (!res.success) {
        toast.error(res.error || 'Execution failed', 'Code');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setResult({
        success: false,
        stdout: '',
        stderr: msg,
        error: msg,
        plots: [],
        files: [],
        execution_time: null,
      });
      toast.error(msg, 'Code');
    } finally {
      setRunning(false);
    }
  }, [code, deps]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!running) runCode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [runCode, running]);

  const handleSave = () => {
    if (!snippetName.trim()) return;
    const snippets = loadSnippets();
    snippets.push({
      id: Date.now().toString(),
      name: snippetName.trim(),
      code,
      dependencies: deps
        .split(',')
        .map(d => d.trim())
        .filter(Boolean),
      createdAt: new Date().toISOString(),
    });
    saveSnippets(snippets);
    setShowSaveDialog(false);
    setSnippetName('');
    toast.success('Snippet saved', 'Code');
  };

  const handleLoadSnippet = (snippet: SavedSnippet) => {
    setCode(snippet.code);
    setDeps(snippet.dependencies.join(', '));
  };

  return (
    <div className={styles.editorContainer}>
      <div className={styles.toolbar}>
        <span className={styles.toolbarTitle}>
          Python {result?.execution_time != null && `— ${result.execution_time.toFixed(2)}s`}
        </span>
        <input
          className={styles.depsInput}
          placeholder="Dependencies (comma-separated, e.g. numpy, pandas)"
          value={deps}
          onChange={e => setDeps(e.target.value)}
        />
        <button
          className={styles.saveButton}
          onClick={() => setShowSaveDialog(true)}
          title="Save snippet"
        >
          <Save size={14} />
          Save
        </button>
        <button className={styles.runButton} onClick={runCode} disabled={running || !code.trim()}>
          {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
          {running ? 'Running...' : 'Run'}{' '}
          <span style={{ fontSize: 11, opacity: 0.6 }}>Ctrl+Enter</span>
        </button>
      </div>

      <div className={styles.splitPane}>
        <div className={styles.editorPane}>
          <textarea
            ref={textareaRef}
            className={styles.codeEditor}
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="# Write Python code here..."
            spellCheck={false}
          />
        </div>

        <div className={styles.outputPane}>
          <div className={styles.tabBar}>
            <button
              className={outputTab === 'output' ? styles.tabActive : styles.tab}
              onClick={() => setOutputTab('output')}
            >
              <Terminal size={12} style={{ marginRight: 4 }} />
              Output
            </button>
            <button
              className={outputTab === 'plots' ? styles.tabActive : styles.tab}
              onClick={() => setOutputTab('plots')}
            >
              Plots {result && result.plots.length > 0 && `(${result.plots.length})`}
            </button>
            <button
              className={outputTab === 'files' ? styles.tabActive : styles.tab}
              onClick={() => setOutputTab('files')}
            >
              <FileDown size={12} style={{ marginRight: 4 }} />
              Files {result && result.files.length > 0 && `(${result.files.length})`}
            </button>
          </div>

          <div className={styles.outputContent}>
            {outputTab === 'output' && (
              <>
                {result ? (
                  <>
                    {result.install_output && (
                      <div className={styles.installOutput}>
                        $ pip install ...
                        <br />
                        {result.install_output}
                        <br />
                        <br />
                      </div>
                    )}
                    {result.stdout ? (
                      <div className={styles.stdoutText}>{result.stdout}</div>
                    ) : (
                      <div className={styles.emptyOutput}>No stdout output</div>
                    )}
                    {result.stderr && (
                      <div className={styles.stderrText}>
                        <br />
                        {result.stderr}
                      </div>
                    )}
                    {result.error && (
                      <div className={styles.stderrText}>
                        <br />
                        Error: {result.error}
                      </div>
                    )}
                  </>
                ) : (
                  <div className={styles.emptyOutput}>Press Run or Ctrl+Enter to execute code</div>
                )}
              </>
            )}

            {outputTab === 'plots' && result && (
              <div className={styles.plotGrid}>
                {result.plots.length > 0 ? (
                  result.plots.map((plot, i) => (
                    <div key={i} className={styles.plotCard}>
                      <img
                        className={styles.plotImage}
                        src={`data:image/${plot.format};base64,${plot.data}`}
                        alt={`Plot ${i + 1}`}
                      />
                    </div>
                  ))
                ) : (
                  <div className={styles.emptyOutput}>No plots generated</div>
                )}
              </div>
            )}

            {outputTab === 'files' && result && (
              <div className={styles.fileList}>
                {result.files.length > 0 ? (
                  result.files.map((file, i) => (
                    <div key={i} className={styles.fileItem}>
                      <FileDown size={14} />
                      {file.filename} — {(file.size / 1024).toFixed(1)} KB
                      <a
                        href={`data:application/octet-stream;base64,${file.data}`}
                        download={file.filename}
                        style={{
                          marginLeft: 'auto',
                          color: 'var(--accent)',
                          textDecoration: 'none',
                          fontSize: 11,
                        }}
                      >
                        Download
                      </a>
                    </div>
                  ))
                ) : (
                  <div className={styles.emptyOutput}>No files generated</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showSaveDialog && (
        <div className={styles.saveDialog} onClick={() => setShowSaveDialog(false)}>
          <div className={styles.saveDialogContent} onClick={e => e.stopPropagation()}>
            <h3 className={styles.saveDialogTitle}>Save Code Snippet</h3>
            <input
              className={styles.saveDialogInput}
              placeholder="Snippet name..."
              value={snippetName}
              onChange={e => setSnippetName(e.target.value)}
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
            <div className={styles.saveDialogActions}>
              <button className={styles.saveDialogCancel} onClick={() => setShowSaveDialog(false)}>
                <X size={14} style={{ marginRight: 4 }} />
                Cancel
              </button>
              <button
                className={styles.saveDialogConfirm}
                onClick={handleSave}
                disabled={!snippetName.trim()}
              >
                <Save size={14} style={{ marginRight: 4 }} />
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
