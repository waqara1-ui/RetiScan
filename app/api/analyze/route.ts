/**
 * Will use this document to extract image, process it, and send to ML
 * This is the backend of our app. The frontend never touches the ML directly, it only talks to this API
 * Retinal analysis API — GPT-4o Vision (primary) or RETFound via HF
 * Diabetic retinopathy grade: 0=none, 1=mild, 2=moderate, 3=severe, 4=proliferative
 * Note: HF legacy api-inference.huggingface.co returns 410 Gone (retired).
 */

const RETFOUND_MODEL = "bitfount/RETFound_DR_IDRID"
//base url for hugging face serverless interface API (calling model for predictions) 
//The model we use "RETFOUND MODEL"
//using a pretrained Hugging Face model called RETFound (for diabetic retinopathy grading).
import { NextResponse } from "next/server";
import path from "path";
import os from "os";
import { promises as fs } from "fs";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    // Frontend might send "image" or "file"
    const file =
      (formData.get("image") as File | null) ??
      (formData.get("file") as File | null);

    if (!file) {
      return NextResponse.json({ error: "No image uploaded" }, { status: 400 });
    }

    // Save upload to a temp file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const tmpPath = path.join(os.tmpdir(), `retina_${Date.now()}.jpg`);
    await fs.writeFile(tmpPath, buffer);

    // Use the ML venv python so torch/transformers are available
    const projectRoot = process.cwd();
    const pythonExe = path.join(projectRoot, "ml", ".venv", "Scripts", "python.exe");
    const scriptPath = path.join(projectRoot, "ml", "infer.py");

    const { stdout, stderr } = await execFileAsync(pythonExe, [scriptPath, tmpPath], {
      timeout: 120000,
      windowsHide: true,
    });

    // Clean up temp file
    await fs.unlink(tmpPath).catch(() => {});

    // Note: stderr may contain HF progress/warnings; not always fatal
    if (stderr && stderr.trim().length > 0) {
      console.warn("Python stderr:", stderr);
    }

    const result = JSON.parse(stdout.trim());

    return NextResponse.json({
      ok: true,
      source: "local-ml",
      model: result.model,
      label: result.label,
      confidence: result.confidence,
      class_index: result.class_index,
      probabilities: result.probabilities,
      labels: result.labels
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: "Local ML analysis failed", detail: err?.message ?? String(err), code: "LOCAL_ML_ERROR" },
      { status: 500 }
    );
  }
}