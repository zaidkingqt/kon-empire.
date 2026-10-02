import type { ReactOptions, ConversionResult } from './types';

export const defaultReactOptions: ReactOptions = {
  componentName: 'SvgIcon',
  typescript: true,
  forwardRef: true,
  spreadProps: true,
  memo: false,
  iconProps: true,
  exportType: 'named',
  native: false,
};

const SVG_ATTR_MAP: Record<string, string> = {
  class: 'className',
  for: 'htmlFor',
  tabindex: 'tabIndex',
  'accent-height': 'accentHeight',
  'alignment-baseline': 'alignmentBaseline',
  'allow-reorder': 'allowReorder',
  'arabic-form': 'arabicForm',
  'attribute-name': 'attributeName',
  'attribute-type': 'attributeType',
  'auto-reverse': 'autoReverse',
  'base-frequency': 'baseFrequency',
  'baseline-shift': 'baselineShift',
  'base-profile': 'baseProfile',
  'calc-mode': 'calcMode',
  'cap-height': 'capHeight',
  'clip-path': 'clipPath',
  'clip-rule': 'clipRule',
  'color-interpolation': 'colorInterpolation',
  'color-interpolation-filters': 'colorInterpolationFilters',
  'color-profile': 'colorProfile',
  'color-rendering': 'colorRendering',
  'content-script-type': 'contentScriptType',
  'content-style-type': 'contentStyleType',
  'diffuse-constant': 'diffuseConstant',
  'dominant-baseline': 'dominantBaseline',
  'edge-mode': 'edgeMode',
  'enable-background': 'enableBackground',
  'fill-opacity': 'fillOpacity',
  'fill-rule': 'fillRule',
  'filter-units': 'filterUnits',
  'flood-color': 'floodColor',
  'flood-opacity': 'floodOpacity',
  'font-family': 'fontFamily',
  'font-size': 'fontSize',
  'font-size-adjust': 'fontSizeAdjust',
  'font-stretch': 'fontStretch',
  'font-style': 'fontStyle',
  'font-variant': 'fontVariant',
  'font-weight': 'fontWeight',
  'glyph-name': 'glyphName',
  'glyph-orientation-horizontal': 'glyphOrientationHorizontal',
  'glyph-orientation-vertical': 'glyphOrientationVertical',
  'gradient-transform': 'gradientTransform',
  'gradient-units': 'gradientUnits',
  'horiz-adv-x': 'horizAdvX',
  'horiz-origin-x': 'horizOriginX',
  'image-rendering': 'imageRendering',
  'letter-spacing': 'letterSpacing',
  'lighting-color': 'lightingColor',
  'limiting-cone-angle': 'limitingConeAngle',
  'marker-end': 'markerEnd',
  'marker-mid': 'markerMid',
  'marker-start': 'markerStart',
  'marker-height': 'markerHeight',
  'marker-units': 'markerUnits',
  'marker-width': 'markerWidth',
  'mask-content-units': 'maskContentUnits',
  'mask-units': 'maskUnits',
  'overline-position': 'overlinePosition',
  'overline-thickness': 'overlineThickness',
  'paint-order': 'paintOrder',
  'panose-1': 'panose1',
  'path-length': 'pathLength',
  'pattern-content-units': 'patternContentUnits',
  'pattern-transform': 'patternTransform',
  'pattern-units': 'patternUnits',
  'pointer-events': 'pointerEvents',
  'primitive-units': 'primitiveUnits',
  'rendering-intent': 'renderingIntent',
  'repeat-count': 'repeatCount',
  'repeat-dur': 'repeatDur',
  'required-extensions': 'requiredExtensions',
  'required-features': 'requiredFeatures',
  'shape-rendering': 'shapeRendering',
  'specular-constant': 'specularConstant',
  'specular-exponent': 'specularExponent',
  'spread-method': 'spreadMethod',
  'start-offset': 'startOffset',
  'std-deviation': 'stdDeviation',
  'stitch-tiles': 'stitchTiles',
  'stop-color': 'stopColor',
  'stop-opacity': 'stopOpacity',
  'strikethrough-position': 'strikethroughPosition',
  'strikethrough-thickness': 'strikethroughThickness',
  'stroke-dasharray': 'strokeDasharray',
  'stroke-dashoffset': 'strokeDashoffset',
  'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin',
  'stroke-miterlimit': 'strokeMiterlimit',
  'stroke-opacity': 'strokeOpacity',
  'stroke-width': 'strokeWidth',
  'surface-scale': 'surfaceScale',
  'system-language': 'systemLanguage',
  'table-values': 'tableValues',
  'target-x': 'targetX',
  'target-y': 'targetY',
  'text-anchor': 'textAnchor',
  'text-decoration': 'textDecoration',
  'text-length': 'textLength',
  'text-rendering': 'textRendering',
  'underline-position': 'underlinePosition',
  'underline-thickness': 'underlineThickness',
  'unicode-bidi': 'unicodeBidi',
  'unicode-range': 'unicodeRange',
  'units-per-em': 'unitsPerEm',
  'v-alphabetic': 'vAlphabetic',
  'v-hanging': 'vHanging',
  'v-ideographic': 'vIdeographic',
  'v-mathematical': 'vMathematical',
  'vector-effect': 'vectorEffect',
  'vert-adv-y': 'vertAdvY',
  'vert-origin-x': 'vertOriginX',
  'vert-origin-y': 'vertOriginY',
  'view-box': 'viewBox',
  'view-target': 'viewTarget',
  'word-spacing': 'wordSpacing',
  'writing-mode': 'writingMode',
  'x-height': 'xHeight',
  'xlink:actuate': 'xlinkActuate',
  'xlink:arcrole': 'xlinkArcrole',
  'xlink:href': 'xlinkHref',
  'xlink:role': 'xlinkRole',
  'xlink:show': 'xlinkShow',
  'xlink:title': 'xlinkTitle',
  'xlink:type': 'xlinkType',
  'xml:base': 'xmlBase',
  'xml:lang': 'xmlLang',
  'xml:space': 'xmlSpace',
  'xmlns:xlink': 'xmlnsXlink',
};

/**
 * Convert style string to React style object literal
 */
function styleStringToJsx(styleStr: string): string {
  const rules = styleStr.split(';').filter((r) => r.trim());
  const entries = rules.map((rule) => {
    const [prop, ...valParts] = rule.split(':');
    const val = valParts.join(':').trim();
    if (!prop || !val) return '';
    const camelProp = prop.trim().replace(/-([a-z])/g, (_, g) => g.toUpperCase());
    return `${camelProp}: '${val.replace(/'/g, "\\'")}'`;
  }).filter(Boolean);

  return `{{ ${entries.join(', ')} }}`;
}

/**
 * Transform raw SVG markup into JSX-safe tags and attributes
 */
function svgToJsxMarkup(svgString: string, spreadProps = true, native = false): string {
  let jsx = svgString;

  // Replace style attributes
  jsx = jsx.replace(/\sstyle="([^"]*)"/gi, (_, styleVal) => {
    return ` style=${styleStringToJsx(styleVal)}`;
  });

  // Replace standard and hyphenated attributes
  for (const [svgAttr, jsxAttr] of Object.entries(SVG_ATTR_MAP)) {
    const regex = new RegExp(`\\s${svgAttr}=`, 'gi');
    jsx = jsx.replace(regex, ` ${jsxAttr}=`);
  }

  // Handle generic kebab-case attributes that may not be in map (e.g. data-* or aria-* remain as is, other custom to camelCase)
  jsx = jsx.replace(/\s([a-z0-9]+)-([a-z0-9]+)=/gi, (match, p1, p2) => {
    if (p1 === 'data' || p1 === 'aria') return match;
    return ` ${p1}${p2.charAt(0).toUpperCase() + p2.slice(1)}=`;
  });

  if (spreadProps) {
    // Inject {...props} into the root <svg> element
    jsx = jsx.replace(/<svg\b([^>]*)>/i, '<svg$1 {...props}>');
  }

  // React Native transformation
  if (native) {
    // Map standard SVG tags to capitalized react-native-svg components
    const tags = ['svg', 'path', 'g', 'circle', 'rect', 'line', 'polygon', 'polyline', 'ellipse', 'text', 'defs', 'lineargradient', 'radialgradient', 'stop', 'clipPath', 'mask'];
    for (const tag of tags) {
      const capTag = tag.charAt(0).toUpperCase() + tag.slice(1);
      const openRegex = new RegExp(`<${tag}\\b`, 'gi');
      const closeRegex = new RegExp(`</${tag}>`, 'gi');
      jsx = jsx.replace(openRegex, `<${capTag}`).replace(closeRegex, `</${capTag}>`);
    }
  }

  return jsx;
}

/**
 * Convert SVG to clean React / JSX / TypeScript component code
 */
export function convertSvgToReact(
  svgString: string,
  options: Partial<ReactOptions> = {}
): ConversionResult {
  const opts = { ...defaultReactOptions, ...options };
  const compName = sanitizeComponentName(opts.componentName || 'SvgIcon');
  const jsxMarkup = svgToJsxMarkup(svgString, opts.spreadProps, opts.native);

  let code = '';
  const ext = opts.typescript ? (opts.native ? '.tsx' : '.tsx') : (opts.native ? '.jsx' : '.jsx');
  const filename = `${compName}${ext}`;

  if (opts.native) {
    // React Native SVG template
    if (opts.typescript) {
      code = `import * as React from 'react';
import Svg, { Path, Rect, Circle, G, Defs, LinearGradient, RadialGradient, Stop, ClipPath } from 'react-native-svg';
import type { SvgProps } from 'react-native-svg';

export interface ${compName}Props extends SvgProps {
  size?: number;
}

export function ${compName}({ size = 24, ...props }: ${compName}Props) {
  return (
    ${indentCode(jsxMarkup, 4)}
  );
}

export default ${compName};
`;
    } else {
      code = `import * as React from 'react';
import Svg, { Path, Rect, Circle, G, Defs, LinearGradient, RadialGradient, Stop, ClipPath } from 'react-native-svg';

export function ${compName}({ size = 24, ...props }) {
  return (
    ${indentCode(jsxMarkup, 4)}
  );
}

export default ${compName};
`;
    }
  } else {
    // Standard Web React
    if (opts.typescript) {
      if (opts.forwardRef) {
        code = `import * as React from 'react';

export interface ${compName}Props extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

export const ${compName} = React.forwardRef<SVGSVGElement, ${compName}Props>(
  ({ size = 24, width, height, ...props }, ref) => {
    return (
      ${indentCode(injectRef(jsxMarkup), 6)}
    );
  }
);

${compName}.displayName = '${compName}';

${opts.exportType === 'default' ? `export default ${compName};` : ''}
`;
      } else {
        code = `import * as React from 'react';

export interface ${compNameProps(compName)} extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
}

export function ${compName}({ size = 24, width, height, ...props }: ${compNameProps(compName)}) {
  return (
    ${indentCode(jsxMarkup, 4)}
  );
}

${opts.exportType === 'default' ? `export default ${compName};` : ''}
`;
      }
    } else {
      // JavaScript
      if (opts.forwardRef) {
        code = `import * as React from 'react';

export const ${compName} = React.forwardRef(({ size = 24, width, height, ...props }, ref) => {
  return (
    ${indentCode(injectRef(jsxMarkup), 4)}
  );
});

${compName}.displayName = '${compName}';

${opts.exportType === 'default' ? `export default ${compName};` : ''}
`;
      } else {
        code = `import * as React from 'react';

export function ${compName}({ size = 24, width, height, ...props }) {
  return (
    ${indentCode(jsxMarkup, 4)}
  );
}

${opts.exportType === 'default' ? `export default ${compName};` : ''}
`;
      }
    }
  }

  return {
    code: code.trim(),
    language: opts.typescript ? 'typescript' : 'javascript',
    filename,
    mimeType: 'text/javascript',
  };
}

function compNameProps(name: string): string {
  return `${name}Props`;
}

function sanitizeComponentName(name: string): string {
  const clean = name.replace(/[^a-zA-Z0-9_]/g, '');
  if (!clean || /^[0-9]/.test(clean)) {
    return `Svg${clean || 'Icon'}`;
  }
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function injectRef(jsx: string): string {
  return jsx.replace(/<svg\b/i, '<svg ref={ref}');
}

function indentCode(str: string, spaces: number): string {
  const pad = ' '.repeat(spaces);
  return str.split('\n').map((line, idx) => (idx === 0 ? line : pad + line)).join('\n');
}
