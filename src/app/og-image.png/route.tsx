import { createPreProOgImage } from "../og-image-renderer";

export const runtime = "edge";

export function GET() {
  return createPreProOgImage();
}
