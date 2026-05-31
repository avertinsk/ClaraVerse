import { api } from '@/services/api';

export interface FileItem {
  fileId: string;
  filename: string;
  mimeType: string;
  size: number;
  status: string;
  error?: string;
  source: 'document' | 'secure';
  conversationId?: string;
  preview?: string;
  pageCount?: number;
  wordCount?: number;
  indexed?: boolean;
  progressDetail?: string;
  processedPages?: number;
  totalPages?: number;
  createdAt: string;
}

export interface FilesResponse {
  files: FileItem[];
  count: number;
}

export interface KnowledgeBaseItem {
  fileId: string;
  filename: string;
  mimeType: string;
  size: number;
  pageCount: number;
  wordCount: number;
  indexed: boolean;
  createdAt: string;
}

export interface KnowledgeBaseResponse {
  documents: KnowledgeBaseItem[];
  count: number;
}

export const fileService = {
  list: () => api.get<FilesResponse>('/api/files'),
  knowledgeBase: {
    list: () => api.get<KnowledgeBaseResponse>('/api/knowledge-base'),
    delete: (fileId: string) => api.delete(`/api/knowledge-base/${fileId}`),
  },
};
