import { api } from "@/api/axiosInstance";

export interface FileMetadata {
  id: string;
  url: string;
  name: string;
  type: string;
  size: number;
}

export interface UploadOptions {
  onProgress?: (percent: number) => void;
}

export const fileService = {
  /** Upload a single file. Returns the stored file metadata (including public URL). */
  uploadFile: async (file: File, options?: UploadOptions): Promise<FileMetadata> => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await api.post<FileMetadata>("/api/file/upload", formData, {
      onUploadProgress: (e) => {
        if (e.total) {
          options?.onProgress?.(Math.round((e.loaded / e.total) * 100));
        }
      }
    });
    return res.data;
  },

  /** Upload multiple files at once. */
  uploadMultipleFiles: async (
    entityId: string,
    files: File[],
  ): Promise<FileMetadata[]> => {
    const formData = new FormData();
    formData.append("entityId", entityId);
    files.forEach((f) => formData.append("files", f));

    const res = await api.post<FileMetadata[]>(
      "/api/file/upload-multiple",
      formData
    );
    return res.data;
  },
};
