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
  createdAt: string;
}

export interface FilesResponse {
  files: FileItem[];
  count: number;
}

export const fileService = {
  list: () => api.get<FilesResponse>('/api/files'),
};
