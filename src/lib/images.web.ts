/**
 * Re-encodes a picked photo so it carries no metadata.
 *
 * On web, expo-image-picker ignores `quality` and hands back
 * `FileReader.readAsDataURL(file)` — the original file, byte for byte. A photo
 * taken with a phone normally carries an EXIF block with the GPS coordinates
 * and the exact time it was shot, and these photos are stored in the trip and
 * travel to whoever receives a shared copy. Someone sharing an itinerary would
 * be handing over the precise location of every photo in it without ever being
 * told.
 *
 * Drawing the image onto a canvas and re-encoding drops every metadata block
 * (EXIF, GPS, XMP, thumbnails) because the canvas only ever held pixels. It
 * also bounds the result, which keeps SQLite rows and the 8 MB share limit
 * manageable — a modern phone photo is otherwise several megabytes of base64.
 */

const MAX_EDGE = 2048;
const JPEG_QUALITY = 0.72;

export async function sanitizeImage(dataUri: string): Promise<string> {
  const bitmap = await decode(dataUri);
  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return dataUri;
    context.drawImage(bitmap, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  } finally {
    if ('close' in bitmap) bitmap.close();
  }
}

/** `imageOrientation: 'from-image'` applies the EXIF rotation before we throw the
 * tag away, so a portrait photo doesn't come out on its side. */
async function decode(dataUri: string): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === 'function') {
    const blob = await (await fetch(dataUri)).blob();
    return createImageBitmap(blob, { imageOrientation: 'from-image' });
  }
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('That image could not be read.'));
    image.src = dataUri;
  });
}
