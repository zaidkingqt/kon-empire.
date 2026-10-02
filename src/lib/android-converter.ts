import type { AndroidOptions, ConversionResult } from './types';
import { validateAndSanitizeSvg } from './sanitizer';

export const defaultAndroidOptions: AndroidOptions = {
  drawableName: 'ic_vector_custom',
  targetApi: 24,
  vectorWidth: 24,
  vectorHeight: 24,
};

/**
 * Convert SVG to clean Android Vector Drawable XML
 */
export function convertSvgToAndroidVector(
  svgString: string,
  options: Partial<AndroidOptions> = {}
): ConversionResult {
  const opts = { ...defaultAndroidOptions, ...options };
  const drawableName = sanitizeAndroidDrawableName(opts.drawableName || 'ic_vector_custom');
  const validation = validateAndSanitizeSvg(svgString);
  const { width = 24, height = 24 } = validation.metadata;

  const paths = parseSvgElementsToAndroidPaths(svgString);

  const xmlContent = `<!-- Generated with VectorForge (https://vectorforge.dev) -->
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="${width}dp"
    android:height="${height}dp"
    android:viewportWidth="${width}"
    android:viewportHeight="${height}">
${paths.map((p) => formatAndroidPath(p)).join('\n')}
</vector>
`;

  return {
    code: xmlContent.trim(),
    language: 'xml',
    filename: `${drawableName}.xml`,
    mimeType: 'application/xml',
  };
}

interface AndroidPathNode {
  pathData: string;
  fillColor?: string;
  fillAlpha?: string;
  strokeColor?: string;
  strokeWidth?: string;
  strokeAlpha?: string;
  strokeLineCap?: string;
  strokeLineJoin?: string;
  fillType?: string;
}

function parseSvgElementsToAndroidPaths(svg: string): AndroidPathNode[] {
  const nodes: AndroidPathNode[] = [];

  // Match all <path> elements
  const pathMatches = svg.matchAll(/<path\b([^>]*)\/?>/gi);
  for (const match of pathMatches) {
    const attrs = match[1];
    const dMatch = attrs.match(/\bd="([^"]*)"/i);
    if (!dMatch) continue;

    const pathData = dMatch[1];
    const fillMatch = attrs.match(/\bfill="([^"]*)"/i);
    const strokeMatch = attrs.match(/\bstroke="([^"]*)"/i);
    const strokeWidthMatch = attrs.match(/\bstroke-width="([^"]*)"/i);
    const fillRuleMatch = attrs.match(/\bfill-rule="([^"]*)"/i);
    const strokeLineCapMatch = attrs.match(/\bstroke-linecap="([^"]*)"/i);
    const strokeLineJoinMatch = attrs.match(/\bstroke-linejoin="([^"]*)"/i);
    const fillOpacityMatch = attrs.match(/\bfill-opacity="([^"]*)"/i);
    const strokeOpacityMatch = attrs.match(/\bstroke-opacity="([^"]*)"/i);

    const node: AndroidPathNode = {
      pathData,
    };

    if (fillMatch) {
      const fill = fillMatch[1].trim();
      if (fill.toLowerCase() !== 'none') {
        node.fillColor = toAndroidHexColor(fill);
      }
    } else {
      // Default SVG fill is black if not specified
      node.fillColor = '#FF000000';
    }

    if (strokeMatch) {
      const stroke = strokeMatch[1].trim();
      if (stroke.toLowerCase() !== 'none') {
        node.strokeColor = toAndroidHexColor(stroke);
      }
    }

    if (strokeWidthMatch) {
      node.strokeWidth = strokeWidthMatch[1];
    }

    if (fillRuleMatch && fillRuleMatch[1].toLowerCase() === 'evenodd') {
      node.fillType = 'evenOdd';
    }

    if (strokeLineCapMatch) {
      node.strokeLineCap = strokeLineCapMatch[1];
    }

    if (strokeLineJoinMatch) {
      node.strokeLineJoin = strokeLineJoinMatch[1];
    }

    if (fillOpacityMatch) {
      node.fillAlpha = fillOpacityMatch[1];
    }

    if (strokeOpacityMatch) {
      node.strokeAlpha = strokeOpacityMatch[1];
    }

    nodes.push(node);
  }

  // Also convert basic <circle> tags to pathData
  const circleMatches = svg.matchAll(/<circle\b([^>]*)\/?>/gi);
  for (const match of circleMatches) {
    const attrs = match[1];
    const cx = parseFloat((attrs.match(/\bcx="([^"]*)"/i) || [])[1] || '0');
    const cy = parseFloat((attrs.match(/\bcy="([^"]*)"/i) || [])[1] || '0');
    const r = parseFloat((attrs.match(/\br="([^"]*)"/i) || [])[1] || '0');
    if (r > 0) {
      const d = `M ${cx - r}, ${cy} a ${r},${r} 0 1,0 ${r * 2},0 a ${r},${r} 0 1,0 -${r * 2},0`;
      const fillMatch = attrs.match(/\bfill="([^"]*)"/i);
      nodes.push({
        pathData: d,
        fillColor: fillMatch && fillMatch[1] !== 'none' ? toAndroidHexColor(fillMatch[1]) : '#FF000000',
      });
    }
  }

  // Also convert basic <rect> tags to pathData
  const rectMatches = svg.matchAll(/<rect\b([^>]*)\/?>/gi);
  for (const match of rectMatches) {
    const attrs = match[1];
    const x = parseFloat((attrs.match(/\bx="([^"]*)"/i) || [])[1] || '0');
    const y = parseFloat((attrs.match(/\by="([^"]*)"/i) || [])[1] || '0');
    const w = parseFloat((attrs.match(/\bwidth="([^"]*)"/i) || [])[1] || '0');
    const h = parseFloat((attrs.match(/\bheight="([^"]*)"/i) || [])[1] || '0');
    if (w > 0 && h > 0) {
      const d = `M ${x},${y} h ${w} v ${h} h -${w} Z`;
      const fillMatch = attrs.match(/\bfill="([^"]*)"/i);
      nodes.push({
        pathData: d,
        fillColor: fillMatch && fillMatch[1] !== 'none' ? toAndroidHexColor(fillMatch[1]) : '#FF000000',
      });
    }
  }

  return nodes.length > 0 ? nodes : [{ pathData: 'M0,0 Z', fillColor: '#FF000000' }];
}

function formatAndroidPath(node: AndroidPathNode): string {
  let xml = `    <path\n        android:pathData="${node.pathData}"`;

  if (node.fillColor) {
    xml += `\n        android:fillColor="${node.fillColor}"`;
  }
  if (node.fillAlpha) {
    xml += `\n        android:fillAlpha="${node.fillAlpha}"`;
  }
  if (node.fillType) {
    xml += `\n        android:fillType="${node.fillType}"`;
  }
  if (node.strokeColor) {
    xml += `\n        android:strokeColor="${node.strokeColor}"`;
  }
  if (node.strokeWidth) {
    xml += `\n        android:strokeWidth="${node.strokeWidth}"`;
  }
  if (node.strokeAlpha) {
    xml += `\n        android:strokeAlpha="${node.strokeAlpha}"`;
  }
  if (node.strokeLineCap) {
    xml += `\n        android:strokeLineCap="${node.strokeLineCap}"`;
  }
  if (node.strokeLineJoin) {
    xml += `\n        android:strokeLineJoin="${node.strokeLineJoin}"`;
  }

  xml += ' />';
  return xml;
}

function toAndroidHexColor(color: string): string {
  const c = color.trim().toLowerCase();
  if (c === 'black') return '#FF000000';
  if (c === 'white') return '#FFFFFFFF';
  if (c === 'red') return '#FFFF0000';
  if (c === 'green') return '#FF00FF00';
  if (c === 'blue') return '#FF0000FF';
  if (c === 'currentColor' || c === 'currentcolor') return '#FF000000';

  if (c.startsWith('#')) {
    const hex = c.slice(1);
    if (hex.length === 3) {
      // #rgb -> #FFRRGGBB
      return `#FF${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`.toUpperCase();
    }
    if (hex.length === 6) {
      // #rrggbb -> #FFRRGGBB
      return `#FF${hex}`.toUpperCase();
    }
    if (hex.length === 8) {
      // #rrggbbaa -> #AARRGGBB in Android
      const rr = hex.slice(0, 2);
      const gg = hex.slice(2, 4);
      const bb = hex.slice(4, 6);
      const aa = hex.slice(6, 8);
      return `#${aa}${rr}${gg}${bb}`.toUpperCase();
    }
  }

  // rgba(r, g, b, a) or rgb(r, g, b)
  const rgbMatch = c.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10).toString(16).padStart(2, '0');
    const g = parseInt(rgbMatch[2], 10).toString(16).padStart(2, '0');
    const b = parseInt(rgbMatch[3], 10).toString(16).padStart(2, '0');
    const a = rgbMatch[4] !== undefined
      ? Math.round(parseFloat(rgbMatch[4]) * 255).toString(16).padStart(2, '0')
      : 'ff';
    return `#${a}${r}${g}${b}`.toUpperCase();
  }

  return '#FF000000';
}

function sanitizeAndroidDrawableName(name: string): string {
  const clean = name
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/^[^a-z_]/, 'ic_$&');
  return clean || 'ic_vector_custom';
}
