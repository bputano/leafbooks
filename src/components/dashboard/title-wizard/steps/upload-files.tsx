"use client";

import { useState } from "react";
import { FileDropzone } from "@/components/ui/file-dropzone";
import { useFileUpload } from "@/hooks/use-file-upload";
import { Button } from "@/components/ui/button";
import type { Book } from "@/hooks/use-title-wizard";

interface UploadFilesProps {
  wizard: {
    bookData: Book;
    updateField: (field: string, value: unknown) => void;
    saveBook: (data: Partial<Book>) => Promise<void>;
    setBookData: (data: Book | ((prev: Book) => Book)) => void;
    nextStep: () => void;
  };
}

export function UploadFiles({ wizard }: UploadFilesProps) {
  const [extracting, setExtracting] = useState(false);

  const manuscript = useFileUpload({
    bookId: wizard.bookData.id,
    fileType: "manuscript",
    onSuccess: async (key) => {
      const ext = key.split(".").pop()?.toLowerCase() || "pdf";
      await wizard.saveBook({
        manuscriptFileUrl: key,
        manuscriptFileType: ext,
      });
      // Trigger AI extraction and refresh state with extracted data
      setExtracting(true);
      try {
        const res = await fetch("/api/books/extract-metadata", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookId: wizard.bookData.id }),
        });
        if (res.ok) {
          const { metadata } = await res.json();
          if (metadata) {
            // Refresh the book data from the server to get updated fields
            const bookRes = await fetch(`/api/books/${wizard.bookData.id}`);
            if (bookRes.ok) {
              const { book: updatedBook } = await bookRes.json();
              wizard.setBookData(updatedBook);

              // Auto-create Leaf Edition if not already present
              const hasLeafEdition = updatedBook.formats?.some(
                (f: { type: string }) => f.type === "LEAF_EDITION"
              );
              if (!hasLeafEdition) {
                try {
                  const fmtRes = await fetch(
                    `/api/books/${wizard.bookData.id}/formats`,
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        type: "LEAF_EDITION",
                        price: 0,
                      }),
                    }
                  );
                  if (fmtRes.ok) {
                    const { format } = await fmtRes.json();
                    wizard.setBookData((prev) => ({
                      ...prev,
                      formats: [...prev.formats, format],
                    }));
                  }
                } catch {
                  // Non-critical — author can add manually
                }
              }
            }
          }
        }
      } finally {
        setExtracting(false);
      }
    },
  });

  const cover = useFileUpload({
    bookId: wizard.bookData.id,
    fileType: "cover",
    onSuccess: async (key, publicUrl) => {
      await wizard.saveBook({ coverFileUrl: key, coverImageUrl: publicUrl });
    },
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Upload Files</h2>
        <p className="mt-1 text-sm text-gray-600">
          Upload your manuscript and cover image. We&apos;ll extract title
          details automatically.
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="mb-2 text-sm font-medium text-gray-700">Manuscript</h3>
          <FileDropzone
            accept=".pdf,.docx,.epub"
            maxSize={100 * 1024 * 1024}
            onFileSelect={manuscript.upload}
            uploading={manuscript.uploading}
            progress={manuscript.progress}
            uploadedFileName={
              wizard.bookData.manuscriptFileUrl
                ? wizard.bookData.manuscriptFileUrl.split("/").pop()
                : null
            }
            onRemove={() =>
              wizard.saveBook({
                manuscriptFileUrl: null,
                manuscriptFileType: null,
              } as unknown as Partial<Book>)
            }
            label="Drop your manuscript here or click to browse"
            description="PDF, DOCX, or EPUB — up to 100MB"
            icon="document"
          />
          {manuscript.error && (
            <p className="mt-2 text-sm text-red-600">{manuscript.error}</p>
          )}
          {extracting && (
            <p className="mt-2 text-sm text-leaf-600">
              Extracting title details from your manuscript...
            </p>
          )}
        </div>

        <div>
          <h3 className="mb-2 text-sm font-medium text-gray-700">Cover Image</h3>
          <FileDropzone
            accept=".png,.jpg,.jpeg,.webp,.pdf"
            maxSize={20 * 1024 * 1024}
            onFileSelect={cover.upload}
            uploading={cover.uploading}
            progress={cover.progress}
            uploadedFileName={
              wizard.bookData.coverFileUrl
                ? wizard.bookData.coverFileUrl.split("/").pop()
                : null
            }
            onRemove={() =>
              wizard.saveBook({
                coverFileUrl: null,
                coverImageUrl: null,
              } as unknown as Partial<Book>)
            }
            label="Drop your cover file here or click to browse"
            description="PNG, JPG, WEBP, or PDF — up to 20MB"
            icon="image"
          />
          {cover.error && (
            <p className="mt-2 text-sm text-red-600">{cover.error}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button onClick={wizard.nextStep}>Continue</Button>
        <button
          type="button"
          onClick={wizard.nextStep}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Skip — I&apos;ll upload later
        </button>
      </div>
    </div>
  );
}
