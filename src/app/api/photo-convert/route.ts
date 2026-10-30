import { NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import os from "os";
import crypto from "crypto";

const execFileAsync = promisify(execFile);

/**
 * Converts uploaded HEIC / HEIF / TIFF / RAW images into standard JPEG
 * using macOS native `sips` image engine when running locally.
 */
export async function POST(request: Request) {
  let inputPath = "";
  let outputPath = "";

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const id = crypto.randomBytes(6).toString("hex");
    const ext = path.extname(file.name) || ".heic";
    inputPath = path.join(os.tmpdir(), `slv-in-${id}${ext}`);
    outputPath = path.join(os.tmpdir(), `slv-out-${id}.jpg`);

    await fs.writeFile(inputPath, buffer);

    // Use macOS native `sips` to convert any Apple HEIC/HEIF/TIFF to JPEG
    await execFileAsync("sips", [
      "-s",
      "format",
      "jpeg",
      "-Z",
      "600",
      inputPath,
      "--out",
      outputPath,
    ]);

    const outBuffer = await fs.readFile(outputPath);
    const base64 = `data:image/jpeg;base64,${outBuffer.toString("base64")}`;

    return NextResponse.json({ dataUrl: base64 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Conversion failed" },
      { status: 500 }
    );
  } finally {
    if (inputPath) await fs.unlink(inputPath).catch(() => {});
    if (outputPath) await fs.unlink(outputPath).catch(() => {});
  }
}
