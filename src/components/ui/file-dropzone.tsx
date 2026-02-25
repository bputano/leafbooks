"use client";

import { useCallback, useState, useRef } from "react";
import { Upload, X, FileText, Image } from "lucide-react";

interface FileDropzoneProps {
  accept: string; // e.g. ".pdf,.docx,.epub" or ".png,.jpg,.webp"
  maxSize: number; // in bytes
  onFileSelect: (file: File) => void;
  uploading?: boolean;
  progress?: number;
  uploadedFileName?: string | null;
  onRemove?: () => void;
  label: string;
  description: string;
  icon?: "document" | "image";
}

export function FileDropzone({
  accept,
  maxSize,
  onFileSelect,
  uploading = false,
  progress = 0,
  uploadedFileName,
  onRemove,
  label,
  description,
  icon = "document",
}: FileDropzoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);
      if (file.size > maxSize) {
        setError(`File too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB.`);
        return;
      }
      const acceptedTypes = accept.split(",").map((t) => t.trim());
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      if (!acceptedTypes.includes(ext)) {
        setError(`Invalid file type. Accepted: ${accept}`);
        return;
      }
      onFileSelect(file);
    },
    [accept, maxSize, onFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  if (uploadedFileName) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
        {icon === "document" ? (
          <FileText className="h-8 w-8 text-leaf-600" />
        ) : (
          <Image className="h-8 w-8 text-leaf-600" />
        )}
        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-medium text-gray-900">
            {uploadedFileName}
          </p>
          <p className="text-xs text-green-600">Uploaded successfully</p>
        </div>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
          dragOver
            ? "border-leaf-400 bg-leaf-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />
        {uploading ? (
          <div className="space-y-3">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-leaf-600 border-t-transparent" />
            <p className="text-sm text-gray-600">Uploading... {progress}%</p>
            <div className="mx-auto h-2 w-48 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-leaf-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload className="mx-auto h-8 w-8 text-gray-400" />
            <p className="text-sm font-medium text-gray-700">{label}</p>
            <p className="text-xs text-gray-500">{description}</p>
          </div>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
