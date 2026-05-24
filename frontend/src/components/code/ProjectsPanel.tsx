import { useState, useEffect, useCallback } from 'react';
import { Code2, Trash2, Clock } from 'lucide-react';
import { toast } from '@/store/useToastStore';
import styles from './ProjectsPanel.module.css';

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

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface ProjectsPanelProps {
  onLoadSnippet: (snippet: SavedSnippet) => void;
}

export function ProjectsPanel({ onLoadSnippet }: ProjectsPanelProps) {
  const [snippets, setSnippets] = useState<SavedSnippet[]>([]);

  useEffect(() => {
    setSnippets(loadSnippets());
  }, []);

  const refresh = useCallback(() => {
    setSnippets(loadSnippets());
  }, []);

  const handleDelete = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const updated = loadSnippets().filter(s => s.id !== id);
    saveSnippets(updated);
    setSnippets(updated);
    toast.success('Snippet deleted', 'Projects');
  }, []);

  const handleLoad = useCallback((snippet: SavedSnippet) => {
    onLoadSnippet(snippet);
    toast.success(`Loaded "${snippet.name}"`, 'Projects');
  }, [onLoadSnippet]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Code2 size={18} />
        <h2 className={styles.headerTitle}>Code Snippets</h2>
        <span className={styles.headerCount}>
          {snippets.length} {snippets.length === 1 ? 'snippet' : 'snippets'}
        </span>
      </div>

      {snippets.length === 0 ? (
        <div className={styles.empty}>
          <Code2 size={48} className={styles.emptyIcon} />
          <div className={styles.emptyText}>
            No saved snippets yet. Write code in the Code tab and save it.
          </div>
        </div>
      ) : (
        <div className={styles.grid}>
          {[...snippets].reverse().map(snippet => (
            <div
              key={snippet.id}
              className={styles.card}
              onClick={() => handleLoad(snippet)}
            >
              <h3 className={styles.cardTitle}>{snippet.name}</h3>
              <div className={styles.cardDate}>
                <Clock size={10} style={{marginRight:4,verticalAlign:'middle'}} />
                {formatDate(snippet.createdAt)}
              </div>
              <div className={styles.cardPreview}>
                {snippet.code.slice(0, 200)}
                {snippet.code.length > 200 ? '...' : ''}
              </div>
              {snippet.dependencies.length > 0 && (
                <div style={{fontSize:11,color:'var(--text-tertiary)',marginTop:8}}>
                  deps: {snippet.dependencies.join(', ')}
                </div>
              )}
              <div className={styles.cardActions}>
                <button
                  className={styles.actionButton}
                  onClick={e => handleDelete(e, snippet.id)}
                  title="Delete snippet"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
