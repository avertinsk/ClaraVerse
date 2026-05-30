import { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { Badge } from '@/components/design-system';
import { EmptyState } from '@/components/design-system';
import { useFileStore } from '@/store/useFileStore';
import { useAuthStore } from '@/store/useAuthStore';
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

  useEffect(() => {
    if (isAuthenticated && !loaded) {
      fetchFiles();
    }
  }, [isAuthenticated, loaded, fetchFiles]);

  const filtered = filter ? files.filter(f => f.status === filter) : files;

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
          <HardDrive size={24} /> Files
        </h1>
        <span className="files-count">
          {files.length} file{files.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="files-filters">
        {['all', 'processing', 'completed', 'failed', 'available'].map(s => {
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

      {filtered.length === 0 ? (
        <EmptyState
          icon={HardDrive}
          title="No files"
          description="Upload a PDF, DOCX, or PPTX document to see it here."
        />
      ) : (
        <div className="files-list">
          {filtered.map(file => {
            const Icon = mimeIcon(file.mimeType);
            const cfg = getStatusConfig(file.status);
            const StatusIcon = cfg.icon;
            return (
              <div key={file.fileId} className="file-card">
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
                  {file.error && <div className="file-card-error">{file.error}</div>}
                </div>
                <div className="file-card-status">
                  <Badge variant={cfg.variant} icon={<StatusIcon size={12} />}>
                    {cfg.label}
                  </Badge>
                  {file.status === 'completed' && file.preview && (
                    <div className="file-card-preview">{file.preview}</div>
                  )}
                  {file.conversationId && (
                    <button
                      className="file-card-chat"
                      onClick={() => navigate(`/chat/${file.conversationId}`)}
                      title="Open in chat"
                    >
                      <MessageSquare size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
