import { useEffect, useState, useCallback } from 'react';
import {
  Database,
  FileText,
  Cpu,
  RefreshCw,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import { getApiBaseUrl } from '@/lib/config';
import { toast } from '@/store/useToastStore';

const API_BASE_URL = getApiBaseUrl();

interface ServiceInfo {
  available: boolean;
  status: string;
  model?: string;
  points_count?: number;
  indexed_vectors_count?: number;
  optimizer_status?: string;
}

interface ServicesResponse {
  success: boolean;
  services: Record<string, ServiceInfo>;
}

export const ServiceMonitoring = () => {
  const [data, setData] = useState<ServicesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const resp = await apiClient.get(`${API_BASE_URL}/api/admin/service-monitoring`, {
        requiresAuth: true,
      });
      if (resp.ok) {
        setData(await resp.json());
      }
    } catch (err) {
      console.error('Failed to fetch service status:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  const handleClearRag = async () => {
    if (!confirm('Delete all indexed documents from the RAG database? This cannot be undone.')) return;
    try {
      setClearing(true);
      const resp = await apiClient.post(
        `${API_BASE_URL}/api/admin/service-monitoring/rag/clear`,
        {},
        { requiresAuth: true }
      );
      if (resp.ok) {
        toast.success('RAG index cleared', 'Service Monitoring');
        fetchStatus();
      } else {
        const err = await resp.json().catch(() => ({ error: 'Unknown error' }));
        toast.error(err.error || 'Failed to clear RAG index', 'Error');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Request failed', 'Error');
    } finally {
      setClearing(false);
    }
  };

  const StatusIcon = ({ available }: { available: boolean }) =>
    available ? <CheckCircle2 size={16} className="text-green-500" /> : <XCircle size={16} className="text-red-500" />;

  const cardClass = "border border-[var(--border-color)] rounded-xl p-5 bg-[var(--color-surface)]";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">Service Monitoring</h1>
          <p className="text-[var(--color-text-secondary)] mt-2">
            Status of backend services: Docling OCR, Qdrant vector database, and Embedding provider
          </p>
        </div>
        <button
          onClick={fetchStatus}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 border border-[var(--border-color)] rounded-lg bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] transition-colors"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-[var(--color-text-tertiary)]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Docling Card */}
          <div className={cardClass}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-lg bg-blue-500/10">
                <FileText size={20} className="text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--color-text-primary)]">Docling OCR</h3>
                <p className="text-xs text-[var(--color-text-tertiary)]">Document text extraction</p>
              </div>
              <div className="ml-auto">
                {data?.services?.docling ? (
                  <StatusIcon available={data.services.docling.available} />
                ) : (
                  <AlertTriangle size={16} className="text-yellow-500" />
                )}
              </div>
            </div>
            {data?.services?.docling && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">Status</span>
                  <span className={data.services.docling.available ? 'text-green-500' : 'text-red-500'}>
                    {data.services.docling.status}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Embedding Card */}
          <div className={cardClass}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-lg bg-purple-500/10">
                <Cpu size={20} className="text-purple-500" />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--color-text-primary)]">Embedding</h3>
                <p className="text-xs text-[var(--color-text-tertiary)]">Vector embeddings (Ollama)</p>
              </div>
              <div className="ml-auto">
                {data?.services?.embedding ? (
                  <StatusIcon available={data.services.embedding.available} />
                ) : (
                  <AlertTriangle size={16} className="text-yellow-500" />
                )}
              </div>
            </div>
            {data?.services?.embedding && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">Status</span>
                  <span className={data.services.embedding.available ? 'text-green-500' : 'text-red-500'}>
                    {data.services.embedding.status}
                  </span>
                </div>
                {data.services.embedding.model && (
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Model</span>
                    <span className="text-[var(--color-text-primary)] font-mono text-xs">
                      {data.services.embedding.model}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Qdrant Card */}
          <div className={cardClass}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-lg bg-emerald-500/10">
                <Database size={20} className="text-emerald-500" />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--color-text-primary)]">Qdrant (RAG)</h3>
                <p className="text-xs text-[var(--color-text-tertiary)]">Vector database</p>
              </div>
              <div className="ml-auto">
                {data?.services?.qdrant ? (
                  <StatusIcon available={data.services.qdrant.available} />
                ) : (
                  <AlertTriangle size={16} className="text-yellow-500" />
                )}
              </div>
            </div>
            {data?.services?.qdrant && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--color-text-secondary)]">Status</span>
                  <span className={data.services.qdrant.available ? 'text-green-500' : 'text-red-500'}>
                    {data.services.qdrant.status}
                  </span>
                </div>
                {data.services.qdrant.available && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-secondary)]">Indexed chunks</span>
                      <span className="text-[var(--color-text-primary)] font-mono text-xs">
                        {data.services.qdrant.points_count ?? 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-text-secondary)]">Optimizer</span>
                      <span className="text-[var(--color-text-primary)] font-mono text-xs">
                        {data.services.qdrant.optimizer_status ?? '-'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
            {data?.services?.qdrant?.available && (
              <button
                onClick={handleClearRag}
                disabled={clearing}
                className="mt-4 flex items-center gap-2 px-3 py-1.5 text-xs border border-red-500/30 text-red-500 rounded-lg hover:bg-red-500/10 transition-colors disabled:opacity-50"
              >
                {clearing ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                {clearing ? 'Clearing...' : 'Clear RAG Index'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
