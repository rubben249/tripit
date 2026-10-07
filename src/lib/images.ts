/**
 * Native builds get re-encoded images straight from expo-image-picker: passing
 * `quality` makes it recompress the JPEG, and it never copies the original
 * metadata into the result (EXIF only comes back separately, and only when
 * `exif: true` is asked for). So there is nothing left to strip here.
 *
 * The web implementation in images.web.ts is a different story — see there.
 */
export async function sanitizeImage(dataUri: string): Promise<string> {
  return dataUri;
}
