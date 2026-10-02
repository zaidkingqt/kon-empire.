import { optimize as svgoOptimize } from 'svgo';
import type { OptimizerOptions, ConversionResult } from './types';
import { calculateSavings } from './format-utils';

export const defaultOptimizerOptions: OptimizerOptions = {
  multipass: true,
  removeComments: true,
  removeMetadata: true,
  removeEditorsNSData: true,
  cleanupIds: true,
  removeEmptyAttrs: true,
  removeEmptyContainers: true,
  removeHiddenElems: true,
  convertColors: true,
  collapseGroups: true,
  precision: 2,
  minifyStyles: true,
};

/**
 * Optimize SVG client-side using SVGO with configurable options.
 */
export function optimizeSvg(
  svgString: string,
  options: Partial<OptimizerOptions> = {}
): ConversionResult {
  const mergedOptions = { ...defaultOptimizerOptions, ...options };
  const originalBytes = new TextEncoder().encode(svgString).length;

  try {
    const svgoPlugins: any[] = [
      { name: 'removeDoctype', active: true },
      { name: 'removeXMLProcInst', active: true },
      { name: 'removeComments', active: mergedOptions.removeComments },
      { name: 'removeMetadata', active: mergedOptions.removeMetadata },
      { name: 'removeEditorsNSData', active: mergedOptions.removeEditorsNSData },
      { name: 'cleanupAttrs', active: true },
      { name: 'mergeStyles', active: true },
      { name: 'inlineStyles', active: true },
      { name: 'minifyStyles', active: mergedOptions.minifyStyles },
      { name: 'cleanupIds', active: mergedOptions.cleanupIds },
      { name: 'removeUselessDefs', active: true },
      {
        name: 'cleanupNumericValues',
        active: true,
        params: {
          floatPrecision: mergedOptions.precision,
        },
      },
      { name: 'convertColors', active: mergedOptions.convertColors },
      { name: 'removeUnknownsAndDefaults', active: true },
      { name: 'removeNonInheritableGroupAttrs', active: true },
      { name: 'removeUselessStrokeAndFill', active: true },
      { name: 'removeUnusedNS', active: true },
      { name: 'collapseGroups', active: mergedOptions.collapseGroups },
      { name: 'removeEmptyAttrs', active: mergedOptions.removeEmptyAttrs },
      { name: 'removeEmptyContainers', active: mergedOptions.removeEmptyContainers },
      { name: 'removeHiddenElems', active: mergedOptions.removeHiddenElems },
    ];

    const result = svgoOptimize(svgString, {
      multipass: mergedOptions.multipass,
      plugins: svgoPlugins,
    });

    const optimizedSvg = result.data || svgString;
    const optimizedBytes = new TextEncoder().encode(optimizedSvg).length;
    const { savedPercent } = calculateSavings(originalBytes, optimizedBytes);

    return {
      code: optimizedSvg,
      language: 'xml',
      filename: 'optimized.svg',
      mimeType: 'image/svg+xml',
      byteSize: optimizedBytes,
      savedPercentage: savedPercent,
    };
  } catch (err) {
    // If SVGO encounters complex or unusual constructs, use resilient fallback optimization
    const fallbackSvg = domFallbackOptimize(svgString, mergedOptions);
    const fallbackBytes = new TextEncoder().encode(fallbackSvg).length;
    const { savedPercent } = calculateSavings(originalBytes, fallbackBytes);

    return {
      code: fallbackSvg,
      language: 'xml',
      filename: 'optimized.svg',
      mimeType: 'image/svg+xml',
      byteSize: fallbackBytes,
      savedPercentage: savedPercent,
      warnings: [`SVGO parser notice: Standard optimization applied. (${err instanceof Error ? err.message : ''})`],
    };
  }
}

/**
 * Resilient DOM-based fallback optimizer
 */
function domFallbackOptimize(svgString: string, options: OptimizerOptions): string {
  let cleaned = svgString;

  if (options.removeComments) {
    cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');
  }

  if (options.removeMetadata) {
    cleaned = cleaned.replace(/<metadata[\s\S]*?<\/metadata>/gi, '');
  }

  // Strip editor namespace declarations
  if (options.removeEditorsNSData) {
    cleaned = cleaned.replace(/\sxmlns:(?:sodipodi|inkscape|sketch|adobe|i|illustrator)="[^"]*"/gi, '');
    cleaned = cleaned.replace(/\s(?:sodipodi|inkscape|sketch|adobe|i):[a-z0-9_-]+="[^"]*"/gi, '');
    cleaned = cleaned.replace(/<sodipodi:[^>]*>[\s\S]*?<\/sodipodi:[^>]*>/gi, '');
  }

  // Trim whitespace
  cleaned = cleaned.replace(/>\s+</g, '><').trim();

  return cleaned;
}
