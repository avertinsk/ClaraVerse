import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  FileSpreadsheet,
  FileImage,
  File,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  MessageSquare,
  ChevronLeft,
  HardDrive,
  BookOpen,
  Database,
} from 'lucide-react';
import { Badge } from '@/components/design-system';
import { EmptyState } from '@/components/design-system';
import { useFileStore } from '@/store/useFileStore';
import { useAuthStore } from '@/store/useAuthStore';
import { fileService } from '@/services/fileService';
import './Files.css';

const statusConfig: Record<
  string,
  { label: string; variant: 'default' | 'success' | 'warning' | 'error'; icon: typeof Clock }
> = {
  pending: { label: 'Pending', variant: 'default', icon: Clock },
  processing: { label: 'Processing', variant: 'warning', icon: Loader2 },
  completed: { label: 'Ready', variant: 'success', icon: CheckCircle2 },
  failed: { label: 'Failed', variant: 'error', icon: XCircle },
  available: { label: 'Available', variant: 'success', icon: CheckCircle2 },
};

function getStatusConfig(status: string) {
  return statusConfig[status] ?? { label: status, variant: 'default' as const, icon: AlertCircle };
}

function mimeIcon(mimeType: string) {
  if (mimeType.includes('pdf')) return FileText;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv'))
    return FileSpreadsheet;
  if (mimeType.includes('image')) return FileImage;
  if (mimeType.includes('presentation') || mimeType.includes('document')) return FileText;
  return File;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const Files = () => {
  const navigate = useNavigate();
  const { files, loading, loaded, fetchFiles } = useFileStore();
  const { isAuthenticated } = useAuthStore();
  const [filter, setFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'knowledge'>('all');

  useEffect(() => {
    if (isAuthenticated && !loaded) {
      fetchFiles();
    }
  }, [isAuthenticated, loaded, fetchFiles]);

  const displayed = useMemo(() => {
    let items = files;
    if (viewMode === 'knowledge') {
      items = items.filter(f => f.status === 'completed' && f.indexed);
    }
    if (filter) {
      items = items.filter(f => f.status === filter);
    }
    return items;
  }, [files, viewMode, filter]);

  const statusCounts = files.reduce<Record<string, number>>((acc, f) => {
    acc[f.status] = (acc[f.status] || 0) + 1;
    return acc;
  }, {});

  if (loading && !loaded) {
    return (
      <div className="files-page">
        <div className="files-header">
          <h1>
            <HardDrive size={24} /> Files
          </h1>
        </div>
        <div className="files-loading">
          <Loader2 className="spin" size={32} />
          <span>Loading files...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="files-page">
      <div className="files-header">
        <button className="files-back" onClick={() => navigate(-1)}>
          <ChevronLeft size={20} />
        </button>
        <h1>
          {viewMode === 'knowledge' ? <Database size={24} /> : <HardDrive size={24} />}
          {viewMode === 'knowledge' ? 'База знаний' : 'Files'}
        </h1>
        <span className="files-count">
          {viewMode === 'knowledge'
            ? `${files.filter(f => f.indexed).length} documents`
            : `${files.length} file${files.length !== 1 ? 's' : ''}`}
        </span>
        <button
          className="files-kb-toggle"
          onClick={() => setViewMode(v => (v === 'all' ? 'knowledge' : 'all'))}
          title={viewMode === 'all' ? 'View knowledge base' : 'View all files'}
        >
          <BookOpen size={16} />
          {viewMode === 'all' ? 'Knowledge Base' : 'All Files'}
        </button>
      </div>

      <div className="files-filters">
        {viewMode === 'all' &&
          ['all', 'processing', 'completed', 'failed', 'available'].map(s => {
            const key = s === 'all' ? null : s;
            const count = s === 'all' ? files.length : (statusCounts[s] ?? 0);
            return (
              <button
                key={s}
                className={`files-filter-btn ${filter === key ? 'active' : ''}`}
                onClick={() => setFilter(key)}
              >
                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                <span className="files-filter-count">{count}</span>
              </button>
            );
          })}
      </div>

      {displayed.length === 0 ? (
        <EmptyState
          icon={viewMode === 'knowledge' ? Database : HardDrive}
          title={viewMode === 'knowledge' ? 'База знаний пуста' : 'No files'}
          description={
            viewMode === 'knowledge'
              ? 'Загрузите документ и дождитесь его обработки. Обработанные документы индексируются в базу знаний для поиска.'
              : 'Upload a PDF, DOCX, or PPTX document to see it here.'
          }
        />
      ) : (
        <div className="files-list">
          {displayed.map(file => {
            const Icon = mimeIcon(file.mimeType);
            const cfg = getStatusConfig(file.status);
            const StatusIcon = cfg.icon;
            return (
              <div
                key={file.fileId}
                className={`file-card ${file.status === 'processing' ? 'file-card-processing' : ''}`}
              >
                <div className="file-card-icon">
                  <Icon size={24} />
                </div>
                <div className="file-card-body">
                  <div className="file-card-name">{file.filename}</div>
                  <div className="file-card-meta">
                    <span>{formatSize(file.size)}</span>
                    <span className="file-card-dot">·</span>
                    <span>{file.mimeType}</span>
                    <span className="file-card-dot">·</span>
                    <span>{formatDate(file.createdAt)}</span>
                  </div>
                  {file.progressDetail && file.status === 'processing' && (
                    <div className="file-card-progress">
                      <Loader2 size={12} className="spin" />
                      <span>{file.progressDetail}</span>
                      {file.totalPages !== undefined && file.totalPages > 0 && (
                        <span className="file-card-pages">
                          {file.processedPages ?? 0}/{file.totalPages}
                        </span>
                      )}
                    </div>
                  )}
                  {file.error && <div className="file-card-error">{file.error}</div>}
                  {viewMode === 'knowledge' &&
                    file.status === 'completed' &&
                    file.pageCount !== undefined && (
                      <div className="file-card-stats">
                        <span>{file.pageCount} pages</span>
                        {file.wordCount !== undefined && (
                          <>
                            <span className="file-card-dot">·</span>
                            <span>{file.wordCount.toLocaleString()} words</span>
                          </>
                        )}
                      </div>
                    )}
                </div>
                <div className="file-card-status">
                  <Badge
                    variant={cfg.variant}
                    icon={
                      file.status === 'processing' ? (
                        <Loader2 size={12} className="spin" />
                      ) : (
                        <StatusIcon size={12} />
                      )
                    }
                  >
                    {cfg.label}
                  </Badge>
                  {file.status === 'completed' && file.preview && (
                    <div className="file-card-preview">{file.preview}</div>
                  )}
                  <div className="file-card-actions">
                    {file.status === 'completed' && file.conversationId && (
                      <button
                        className="file-card-action-btn"
                        onClick={() => navigate(`/chat/${file.conversationId}`)}
                        title="Open in chat"
                      >
                        <MessageSquare size={14} />
                      </button>
                    )}
                    {file.status === 'completed' && (
                      <button
                        className={`file-card-action-btn ${file.indexed ? 'active' : ''}`}
                        onClick={async () => {
                          if (file.indexed) {
                            await fileService.knowledgeBase.delete(file.fileId);
                          } else {
                            // Re-index: just trigger a re-fetch for now
                          }
                          fetchFiles();
                        }}
                        title={
                          file.indexed ? 'Remove from knowledge base' : 'Add to knowledge base'
                        }
                      >
                        <Database size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
