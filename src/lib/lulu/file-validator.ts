import { luluFetch } from "./client";
import type { FileValidation } from "./types";

export async function validateFile(
  fileUrl: string,
  fileType: "cover" | "interior"
): Promise<FileValidation> {
  const res = await luluFetch("/print-jobs/file-validations/", {
    method: "POST",
    body: JSON.stringify({
      file_url: fileUrl,
      file_type: fileType,
    }),
  });

  if (!res.ok) {
    return {
      valid: false,
      errors: ["Failed to validate file with Lulu API"],
      warnings: [],
    };
  }

  const data = await res.json();

  return {
    valid: !data.errors || data.errors.length === 0,
    errors: data.errors?.map((e: { message: string }) => e.message) || [],
    warnings: data.warnings?.map((w: { message: string }) => w.message) || [],
  };
}
