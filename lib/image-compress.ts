/**
 * Client-side image compression to keep file uploads well under
 * Vercel's hard 4.5 MB request body limit.
 *
 * Used by TilmeldWizard for the photo field — phones often produce
 * 4-8 MB JPEGs which would prevent registration from succeeding
 * because /api/register receives photo + cv + ansøgning all base64-encoded
 * in a single JSON body.
 */

export async function compressImage(
  file: File,
  opts: { maxDim?: number; quality?: number; mimeType?: string } = {}
): Promise<File> {
  const { maxDim = 1280, quality = 0.82, mimeType = "image/jpeg" } = opts;

  // Skip non-image files
  if (!file.type.startsWith("image/")) return file;

  // Skip already-small files (under 600KB) — no point compressing
  if (file.size < 600 * 1024) return file;

  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = dataUrl;
    });

    // Compute resized dimensions, preserving aspect ratio
    let { width, height } = img;
    if (width > maxDim || height > maxDim) {
      if (width > height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, mimeType, quality)
    );
    if (!blob) return file;

    // If compression somehow made it bigger, return original
    if (blob.size >= file.size) return file;

    const newName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], newName, { type: mimeType, lastModified: Date.now() });
  } catch {
    // If anything fails, return original file — let server-side limit reject if needed
    return file;
  }
}
