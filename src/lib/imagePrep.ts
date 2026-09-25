/**
 * Gets a receipt photo into a shape the OCR engine handles reliably.
 *
 * Deliberately does NOT try to "clean up" the picture (lighting flattening,
 * thresholding, sharpening): I tested those against synthetic receipts at
 * clean / phone-photo / poor-photo quality and none beat the plain image -
 * flattening drew a black frame round the receipt that wrecked layout
 * analysis. What it does do:
 *  - draws through a canvas, so the browser applies the photo's EXIF rotation
 *    (the OCR engine ignores it, so a portrait phone shot would otherwise be
 *    read sideways), and
 *  - caps the size, since a 12MP+ photo is slow and can exhaust memory on a
 *    phone while adding nothing a ~2600px image doesn't already have.
 */

const MAX_SIDE = 2600;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load the receipt image.'));
    img.src = src;
  });
}

export async function prepareForOcr(dataUrl: string): Promise<HTMLCanvasElement> {
  const img = await loadImage(dataUrl);

  const longest = Math.max(img.naturalWidth, img.naturalHeight);
  const scale = longest > MAX_SIDE ? MAX_SIDE / longest : 1;
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available in this browser.');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);
  return canvas;
}
