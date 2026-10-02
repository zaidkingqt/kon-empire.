import type { SvgMetadata, ValidationResult } from './types';

/**
 * Dangerous tags that must never be rendered in an SVG preview
 */
const DANGEROUS_TAGS = new Set([
  'script',
  'iframe',
  'object',
  'embed',
  'applet',
  'meta',
  'link',
  'base',
  'form',
  'input',
  'button',
]);

/**
 * Dangerous attributes (event handlers, javascript uris)
 */
const DANGEROUS_ATTR_PREFIXES = ['on'];

/**
 * Safely parse and sanitize an SVG string, extracting its metadata.
 * Works both in client-side browsers and test environments without bundling heavy Node libs.
 */
export function validateAndSanitizeSvg(rawSvg: string): ValidationResult {
  const originalBytes = new TextEncoder().encode(rawSvg).length;
  const warnings: string[] = [];

  if (!rawSvg || !rawSvg.trim()) {
    return {
      isValid: false,
      sanitizedSvg: '',
      metadata: createEmptyMetadata(originalBytes),
      error: 'SVG content is empty. Please paste or upload valid SVG markup.',
    };
  }

  // Pre-check for XXE / Entity injection
  if (/<!ENTITY/i.test(rawSvg)) {
    warnings.push('XML external entity declarations were detected and stripped for security.');
  }

  // Obtain DOMParser instance
  let parser: DOMParser;
  if (typeof window !== 'undefined' && typeof window.DOMParser !== 'undefined') {
    parser = new window.DOMParser();
  } else if (typeof globalThis !== 'undefined' && (globalThis as any).DOMParser) {
    parser = new (globalThis as any).DOMParser();
  } else {
    try {
      // Dynamic import or require only in Node/test environments
      const jsdom = (globalThis as any).__jsdom || null;
      if (jsdom) {
        parser = new jsdom.window.DOMParser();
      } else {
        return {
          isValid: false,
          sanitizedSvg: '',
          metadata: createEmptyMetadata(originalBytes),
          error: 'DOMParser is not available in the current environment.',
        };
      }
    } catch {
      return {
        isValid: false,
        sanitizedSvg: '',
        metadata: createEmptyMetadata(originalBytes),
        error: 'DOMParser is not available.',
      };
    }
  }

  // Clean DOCTYPE before XML parsing
  const preProcessed = rawSvg.replace(/<!DOCTYPE[^>]*>/gi, '').trim();

  let doc: Document;
  try {
    doc = parser.parseFromString(preProcessed, 'image/svg+xml');
  } catch (err) {
    return {
      isValid: false,
      sanitizedSvg: '',
      metadata: createEmptyMetadata(originalBytes),
      error: `Failed to parse SVG: ${err instanceof Error ? err.message : 'Invalid XML format.'}`,
    };
  }

  // Check for parsererror tag
  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    try {
      const htmlDoc = parser.parseFromString(preProcessed, 'text/html');
      const svgEl = htmlDoc.querySelector('svg');
      if (svgEl) {
        doc = parser.parseFromString(svgEl.outerHTML, 'image/svg+xml');
        if (doc.querySelector('parsererror')) {
          return {
            isValid: false,
            sanitizedSvg: '',
            metadata: createEmptyMetadata(originalBytes),
            error: 'Malformed SVG structure. Please verify your SVG markup syntax.',
          };
        }
      } else {
        return {
          isValid: false,
          sanitizedSvg: '',
          metadata: createEmptyMetadata(originalBytes),
          error: 'No valid <svg> root element found in the provided markup.',
        };
      }
    } catch {
      return {
        isValid: false,
        sanitizedSvg: '',
        metadata: createEmptyMetadata(originalBytes),
        error: 'Malformed SVG markup. Please check for unclosed tags or syntax errors.',
      };
    }
  }

  const svgElement = doc.querySelector('svg');
  if (!svgElement) {
    return {
      isValid: false,
      sanitizedSvg: '',
      metadata: createEmptyMetadata(originalBytes),
      error: 'No root <svg> element found. Make sure the input starts with <svg>.',
    };
  }

  let hasScripts = false;

  // Sanitize all elements inside SVG
  const allElements = Array.from(svgElement.querySelectorAll('*'));
  for (const el of allElements) {
    const tagName = el.tagName.toLowerCase();

    // Remove dangerous tags
    if (DANGEROUS_TAGS.has(tagName)) {
      hasScripts = true;
      warnings.push(`Removed potentially unsafe <${tagName}> element.`);
      el.remove();
      continue;
    }

    // Check foreignObject contents
    if (tagName === 'foreignobject') {
      const dangerousChildren = el.querySelectorAll('script, iframe, object, embed');
      if (dangerousChildren.length > 0) {
        hasScripts = true;
        warnings.push('Removed script or embed inside <foreignObject>.');
        dangerousChildren.forEach((c) => c.remove());
      }
    }

    // Remove inline event handlers & javascript: attributes
    const attrs = Array.from(el.attributes);
    for (const attr of attrs) {
      const attrName = attr.name.toLowerCase();
      const attrValue = attr.value.trim().toLowerCase();

      // Event handlers (onclick, onload, onerror...)
      if (DANGEROUS_ATTR_PREFIXES.some((prefix) => attrName.startsWith(prefix))) {
        hasScripts = true;
        warnings.push(`Stripped unsafe event handler '${attr.name}' from <${tagName}>.`);
        el.removeAttribute(attr.name);
        continue;
      }

      // javascript: URLs in href, xlink:href, src, etc.
      if (
        (attrName === 'href' || attrName === 'xlink:href' || attrName === 'src') &&
        (attrValue.startsWith('javascript:') ||
          attrValue.startsWith('vbscript:') ||
          attrValue.startsWith('data:text/html'))
      ) {
        hasScripts = true;
        warnings.push(`Stripped unsafe '${attr.name}' containing executable code.`);
        el.removeAttribute(attr.name);
        continue;
      }
    }
  }

  // Also sanitize root <svg> attributes
  const rootAttrs = Array.from(svgElement.attributes);
  for (const attr of rootAttrs) {
    const attrName = attr.name.toLowerCase();
    if (DANGEROUS_ATTR_PREFIXES.some((prefix) => attrName.startsWith(prefix))) {
      hasScripts = true;
      warnings.push(`Stripped unsafe root event handler '${attr.name}'.`);
      svgElement.removeAttribute(attr.name);
    }
  }

  // Extract dimensions and viewBox
  const viewBoxAttr = svgElement.getAttribute('viewBox') || '';
  const widthAttr = svgElement.getAttribute('width');
  const heightAttr = svgElement.getAttribute('height');

  let width = 24;
  let height = 24;
  let hasViewBox = false;

  if (viewBoxAttr) {
    hasViewBox = true;
    const parts = viewBoxAttr.trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4 && !isNaN(parts[2]) && !isNaN(parts[3]) && parts[2] > 0 && parts[3] > 0) {
      width = parts[2];
      height = parts[3];
    }
  }

  if (widthAttr) {
    const parsedWidth = parseFloat(widthAttr.replace(/[^0-9.]/g, ''));
    if (!isNaN(parsedWidth) && parsedWidth > 0) {
      width = parsedWidth;
    }
  }

  if (heightAttr) {
    const parsedHeight = parseFloat(heightAttr.replace(/[^0-9.]/g, ''));
    if (!isNaN(parsedHeight) && parsedHeight > 0) {
      height = parsedHeight;
    }
  }

  // If no viewBox exists, automatically add one to ensure responsive scaling
  if (!viewBoxAttr && width > 0 && height > 0) {
    svgElement.setAttribute('viewBox', `0 0 ${width} ${height}`);
  }

  // Count elements and paths
  const elementCount = svgElement.querySelectorAll('*').length;
  const pathCount = svgElement.querySelectorAll('path').length;

  const sanitizedSvg = svgElement.outerHTML;

  const metadata: SvgMetadata = {
    width: Math.round(width * 100) / 100,
    height: Math.round(height * 100) / 100,
    viewBox: svgElement.getAttribute('viewBox') || `0 0 ${width} ${height}`,
    hasViewBox,
    elementCount,
    pathCount,
    originalBytes,
    hasScripts,
    warnings,
  };

  return {
    isValid: true,
    sanitizedSvg,
    metadata,
  };
}

function createEmptyMetadata(originalBytes: number): SvgMetadata {
  return {
    width: 0,
    height: 0,
    viewBox: '',
    hasViewBox: false,
    elementCount: 0,
    pathCount: 0,
    originalBytes,
    hasScripts: false,
    warnings: [],
  };
}
