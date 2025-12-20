import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { authenticateUser } from "@/lib/auth-helper";

export async function POST(req: Request) {
  try {
    const session = await authenticateUser();
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new NextResponse("No file uploaded", { status: 400 });
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
  } catch (error) {
    console.error("[UPLOAD_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
