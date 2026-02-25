import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { storageClient, BUCKET_NAME } from "./index";

interface PresignedUrlOptions {
  key: string;
  contentType: string;
  maxSize: number;
  expiresIn?: number; // seconds, default 600 (10 min)
}

export async function generatePresignedUploadUrl({
  key,
  contentType,
  maxSize,
  expiresIn = 600,
}: PresignedUrlOptions) {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const url = await getSignedUrl(storageClient, command, { expiresIn });

  return { url, key };
}
