import { luluFetch } from "./client";
import type {
  LuluPrintJobRequest,
  LuluPrintJobResponse,
} from "./types";

export async function createPrintJob(
  request: LuluPrintJobRequest
): Promise<LuluPrintJobResponse> {
  const res = await luluFetch("/print-jobs/", {
    method: "POST",
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Failed to create Lulu print job: ${error}`);
  }

  return res.json();
}

export async function getPrintJobStatus(
  jobId: number
): Promise<LuluPrintJobResponse> {
  const res = await luluFetch(`/print-jobs/${jobId}/`);

  if (!res.ok) {
    throw new Error(`Failed to get print job status: ${res.status}`);
  }

  return res.json();
}

export async function cancelPrintJob(jobId: number): Promise<void> {
  const res = await luluFetch(`/print-jobs/${jobId}/`, {
    method: "DELETE",
  });

  if (!res.ok && res.status !== 204) {
    throw new Error(`Failed to cancel print job: ${res.status}`);
  }
}
