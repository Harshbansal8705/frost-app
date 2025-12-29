"use server";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "@/lib/r2";

export async function getUploadUrl(fileName: string, fileType: string) {
  const attachment = `${Date.now()}-${Math.round(Math.random() * 1E9)}/${fileName}`
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: `uploads/${attachment}`,
    ContentType: fileType,
  });

  // This link expires in 60 seconds
  const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });
  return { file: attachment, signedUrl };
}