/**
 * ZoomPanContainer Component
 *
 * Provides zoom and pan controls for SVG and Mermaid artifacts.
 * Uses react-zoom-pan-pinch for smooth transformations with glassmorphism controls.
 */

import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { useTranslation } from 'react-i18next';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw } from 'lucide-react';
import { Tooltip } from '@/components/design-system/Tooltip/Tooltip';
import styles from './ZoomPanContainer.module.css';

interface ZoomPanContainerProps {
  children: React.ReactNode;
  /** Initial scale (default: 1) */
  initialScale?: number;
  /** Minimum zoom scale (default: 0.1) */
  minScale?: number;
  /** Maximum zoom scale (default: 5) */
  maxScale?: number;
  /** Whether to center content initially (default: true) */
  centerOnInit?: boolean;
  /** Whether to hide zoom controls (for capturing clean screenshots) */
  hideControls?: boolean;
}

export function ZoomPanContainer({
  children,
  initialScale = 1,
  minScale = 0.1,
  maxScale = 5,
  centerOnInit = true,
  hideControls = false,
}: ZoomPanContainerProps) {
  const { t } = useTranslation('artifacts');
  return (
    <TransformWrapper
      initialScale={initialScale}
      minScale={minScale}
      maxScale={maxScale}
      centerOnInit={centerOnInit}
      wheel={{ step: 0.1 }}
      doubleClick={{ mode: 'reset' }}
      panning={{ velocityDisabled: false }}
      limitToBounds={false}
      centerZoomedOut={true}
    >
      {({ zoomIn, zoomOut, resetTransform, centerView }) => (
        <div className={styles.container}>
          {/* Zoom Controls Toolbar */}
          {!hideControls && (
            <div className={styles.controls}>
              <Tooltip content={t('zoomPan.zoomIn')} position="bottom">
                <button
                  className={styles.controlButton}
                  onClick={() => zoomIn()}
                  aria-label={t('zoomPan.zoomIn')}
                >
                  <ZoomIn size={18} />
                </button>
              </Tooltip>

              <Tooltip content={t('zoomPan.zoomOut')} position="bottom">
                <button
                  className={styles.controlButton}
                  onClick={() => zoomOut()}
                  aria-label={t('zoomPan.zoomOut')}
                >
                  <ZoomOut size={18} />
                </button>
              </Tooltip>

              <Tooltip content={t('zoomPan.fitToScreen')} position="bottom">
                <button
                  className={styles.controlButton}
                  onClick={() => centerView()}
                  aria-label={t('zoomPan.fitToScreen')}
                >
                  <Maximize2 size={18} />
                </button>
              </Tooltip>

              <Tooltip content={t('zoomPan.resetView')} position="bottom">
                <button
                  className={styles.controlButton}
                  onClick={() => resetTransform()}
                  aria-label={t('zoomPan.resetView')}
                >
                  <RotateCcw size={18} />
                </button>
              </Tooltip>
            </div>
          )}

          {/* Zoomable Content Area */}
          <TransformComponent wrapperClass={styles.wrapper} contentClass={styles.content}>
            {children}
          </TransformComponent>
        </div>
      )}
    </TransformWrapper>
  );
}
