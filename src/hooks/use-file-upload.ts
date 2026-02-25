"use client";

import { useState, useCallback } from "react";

interface UploadOptions {
  bookId: string;
  fileType: "manuscript" | "cover";
  onSuccess?: (key: string, publicUrl: string) => void;
  onError?: (error: string) => void;
}

interface UploadState {
  progress: number;
  uploading: boolean;
  error: string | null;
  key: string | null;
}

export function useFileUpload({ bookId, fileType, onSuccess, onError }: UploadOptions) {
  const [state, setState] = useState<UploadState>({
    progress: 0,
    uploading: false,
    error: null,
    key: null,
  });

  const upload = useCallback(
    async (file: File) => {
      setState({ progress: 0, uploading: true, error: null, key: null });

      try {
        // 1. Get presigned URL
        const presignedRes = await fetch("/api/upload/presigned", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookId,
            fileType,
            contentType: file.type,
            filename: file.name,
          }),
        });

        if (!presignedRes.ok) {
          const data = await presignedRes.json();
          throw new Error(data.error || "Failed to get upload URL");
        }

        const { url, key, publicUrl } = await presignedRes.json();

        // 2. Upload directly to R2
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", url);
          xhr.setRequestHeader("Content-Type", file.type);

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const progress = Math.round((e.loaded / e.total) * 100);
              setState((prev) => ({ ...prev, progress }));
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error("Upload failed"));
            }
          };

          xhr.onerror = () => reject(new Error("Upload failed"));
          xhr.send(file);
        });

        setState({ progress: 100, uploading: false, error: null, key });
        onSuccess?.(key, publicUrl);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        setState({ progress: 0, uploading: false, error: message, key: null });
        onError?.(message);
      }
    },
    [bookId, fileType, onSuccess, onError]
  );

  const reset = useCallback(() => {
    setState({ progress: 0, uploading: false, error: null, key: null });
  }, []);

  return { ...state, upload, reset };
}
