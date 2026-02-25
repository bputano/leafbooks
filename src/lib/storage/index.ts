import { S3Client } from "@aws-sdk/client-s3";

export const storageClient = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export const BUCKET_NAME = process.env.R2_BUCKET_NAME!;
export const PUBLIC_URL = process.env.R2_PUBLIC_URL!;

export const ALLOWED_MANUSCRIPT_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/epub+zip",
];

export const ALLOWED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
];

export const MAX_MANUSCRIPT_SIZE = 100 * 1024 * 1024; // 100MB
export const MAX_COVER_SIZE = 20 * 1024 * 1024; // 20MB

export function getManuscriptKey(authorId: string, bookId: string, filename: string) {
  return `${authorId}/manuscripts/${bookId}/${filename}`;
}

export function getCoverKey(authorId: string, bookId: string, filename: string) {
  return `${authorId}/covers/${bookId}/${filename}`;
}

export function getPublicUrl(key: string) {
  return `${PUBLIC_URL}/${key}`;
}
