import { NextResponse } from "next/server";
import { safeAPI } from "@/lib/utils";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { FrostError } from "@/types";

export const POST = safeAPI(async (req: Request) => {
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) {
    throw new FrostError("No file uploaded", 400);
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Create unique directory for this upload
  const uniqueDir = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
  const uploadDir = join(process.cwd(), "public/uploads", uniqueDir);
  await mkdir(uploadDir, { recursive: true });

  // Sanitize filename but preserve readability for the recipient
  const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filepath = join(uploadDir, sanitizedFilename);

  await writeFile(filepath, buffer);

  // Return the public URL
  const url = `/uploads/${uniqueDir}/${sanitizedFilename}`;

  return NextResponse.json({ url });
});
