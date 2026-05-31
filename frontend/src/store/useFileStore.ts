import { create } from 'zustand';
import { fileService, type FileItem } from '@/services/fileService';

interface FileState {
  files: FileItem[];
  loading: boolean;
  error: string | null;
  loaded: boolean;
  fetchFiles: () => Promise<void>;
  updateFileStatus: (fileId: string, status: string, preview?: string) => void;
  updateFileProgress: (
    fileId: string,
    detail: string,
    processedPages?: number,
    totalPages?: number
  ) => void;
  markFileIndexed: (fileId: string) => void;
}

export const useFileStore = create<FileState>(set => ({
  files: [],
  loading: false,
  error: null,
  loaded: false,

  fetchFiles: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fileService.list();
      set({ files: res.files, loading: false, loaded: true });
    } catch {
      set({ error: 'Failed to load files', loading: false });
    }
  },

  updateFileStatus: (fileId, status, preview) => {
    set(state => ({
      files: state.files.map(f =>
        f.fileId === fileId ? { ...f, status, preview: preview ?? f.preview } : f
      ),
    }));
  },

  updateFileProgress: (fileId, detail, processedPages, totalPages) => {
    set(state => ({
      files: state.files.map(f =>
        f.fileId === fileId ? { ...f, progressDetail: detail, processedPages, totalPages } : f
      ),
    }));
  },

  markFileIndexed: fileId => {
    set(state => ({
      files: state.files.map(f => (f.fileId === fileId ? { ...f, indexed: true } : f)),
    }));
  },
}));
