import type { RasterOptions, ConversionResult } from './types';
import { validateAndSanitizeSvg } from './sanitizer';

export const defaultRasterOptions: RasterOptions = {
  scale: 2,
  lockAspectRatio: true,
  backgroundColor: 'transparent',
  quality: 0.92,
  format: 'png',
};

/**
 * Render SVG to PNG or WebP entirely client-side using Canvas.
 * No file is ever sent to any remote server.
 */
export async function rasterizeSvg(
  svgString: string,
  options: Partial<RasterOptions> = {}
): Promise<ConversionResult> {
  const opts = { ...defaultRasterOptions, ...options };
  const validation = validateAndSanitizeSvg(svgString);

  if (!validation.isValid) {
    throw new Error(validation.error || 'Invalid SVG content.');
  }

  const { width: origWidth, height: origHeight } = validation.metadata;
  const baseWidth = origWidth > 0 ? origWidth : 512;
  const baseHeight = origHeight > 0 ? origHeight : 512;

  let targetWidth: number;
  let targetHeight: number;

  if (opts.customWidth && opts.customWidth > 0) {
    targetWidth = opts.customWidth;
    targetHeight = opts.lockAspectRatio
      ? Math.round((targetWidth * baseHeight) / baseWidth)
      : (opts.customHeight || baseHeight);
  } else if (opts.customHeight && opts.customHeight > 0) {
    targetHeight = opts.customHeight;
    targetWidth = opts.lockAspectRatio
      ? Math.round((targetHeight * baseWidth) / baseHeight)
      : baseWidth;
  } else {
    targetWidth = Math.round(baseWidth * opts.scale);
    targetHeight = Math.round(baseHeight * opts.scale);
  }

  // Cap dimensions to prevent browser memory crashes
  const MAX_DIMENSION = 8192;
  if (targetWidth > MAX_DIMENSION || targetHeight > MAX_DIMENSION) {
    const ratio = Math.min(MAX_DIMENSION / targetWidth, MAX_DIMENSION / targetHeight);
    targetWidth = Math.round(targetWidth * ratio);
    targetHeight = Math.round(targetHeight * ratio);
  }

  if (typeof window === 'undefined') {
    // SSR / Node stub
    return {
      code: '',
      language: opts.format,
      filename: `vectorforge-export.${opts.format}`,
      mimeType: opts.format === 'webp' ? 'image/webp' : 'image/png',
      dataUrl: '',
    };
  }

  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to create HTML5 2D canvas context.'));
        return;
      }

      // Draw background if not transparent
      if (opts.backgroundColor && opts.backgroundColor !== 'transparent') {
        ctx.fillStyle = opts.backgroundColor;
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      } else {
        ctx.clearRect(0, 0, targetWidth, targetHeight);
      }

      const img = new Image();
      const svgBlob = new Blob([validation.sanitizedSvg], {
        type: 'image/svg+xml;charset=utf-8',
      });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        try {
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
          URL.revokeObjectURL(url);

          const mimeType = opts.format === 'webp' ? 'image/webp' : 'image/png';
          const quality = opts.format === 'webp' ? opts.quality : undefined;

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error(`Failed to generate ${opts.format.toUpperCase()} blob.`));
                return;
              }

              const dataUrl = canvas.toDataURL(mimeType, quality);
              const filename = `vectorforge-${targetWidth}x${targetHeight}.${opts.format}`;

              resolve({
                code: dataUrl,
                language: opts.format,
                filename,
                mimeType,
                byteSize: blob.size,
                dataUrl,
                blob,
              });
            },
            mimeType,
            quality
          );
        } catch (drawErr) {
          URL.revokeObjectURL(url);
          reject(new Error(`Canvas render error: ${drawErr instanceof Error ? drawErr.message : 'Unknown'}`));
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Browser failed to load SVG image into canvas for rasterization.'));
      };

      img.src = url;
    } catch (err) {
      reject(err instanceof Error ? err : new Error('Rasterization initialization failed.'));
    }
  });
}
