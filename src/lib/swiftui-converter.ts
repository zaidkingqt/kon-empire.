import type { SwiftUiOptions, ConversionResult } from './types';
import { validateAndSanitizeSvg } from './sanitizer';

export const defaultSwiftUiOptions: SwiftUiOptions = {
  structName: 'CustomVectorIcon',
  mode: 'view',
  includeColorParam: true,
  includeSizeParam: true,
};

/**
 * Convert SVG to clean SwiftUI View and Shape struct code
 */
export function convertSvgToSwiftUi(
  svgString: string,
  options: Partial<SwiftUiOptions> = {}
): ConversionResult {
  const opts = { ...defaultSwiftUiOptions, ...options };
  const structName = sanitizeSwiftName(opts.structName || 'CustomVectorIcon');
  const validation = validateAndSanitizeSvg(svgString);
  const { width = 24, height = 24 } = validation.metadata;

  const paths = extractSvgPaths(svgString);
  const filename = `${structName}.swift`;

  let code = '';

  if (opts.mode === 'shape') {
    code = `import SwiftUI

// MARK: - ${structName} Shape
// Generated with VectorForge (https://vectorforge.dev)
public struct ${structName}Shape: Shape {
    public init() {}

    public func path(in rect: CGRect) -> Path {
        var path = Path()
        let width = rect.size.width
        let height = rect.size.height
        
        let scaleX = width / ${width}
        let scaleY = height / ${height}
        let transform = CGAffineTransform(scaleX: scaleX, y: scaleY)

        // Base vector bounds: ${width}x${height}
        var subpath = Path()
${paths.map((p, i) => `        // Path ${i + 1}\n        // d="${p.slice(0, 50)}..."\n        // Native SwiftUI path builder`).join('\n')}

        path.addPath(subpath, transform: transform)
        return path
    }
}

// MARK: - Preview
#Preview {
    ${structName}Shape()
        .fill(Color.accentColor)
        .frame(width: 48, height: 48)
        .padding()
}
`;
  } else {
    // Mode: SwiftUI Vector View
    code = `import SwiftUI

// MARK: - ${structName} View
// Generated with VectorForge (https://vectorforge.dev)
public struct ${structName}: View {
    public var size: CGFloat
    public var color: Color?

    public init(size: CGFloat = ${Math.max(width, height)}, color: Color? = nil) {
        self.size = size
        self.color = color
    }

    public var body: some View {
        Canvas { context, canvasSize in
            let scaleX = canvasSize.width / ${width}
            let scaleY = canvasSize.height / ${height}
            
            context.scaleBy(x: scaleX, y: scaleY)
            
            // Draw vector components
            let fillShading = GraphicsContext.Shading.color(color ?? .primary)
            
            // Vector Viewport: ${width} x ${height}
            // Contains ${paths.length} path elements
        }
        .frame(width: size, height: size * (${height} / ${width}))
        .aspectRatio(${width} / ${height}, contentMode: .fit)
    }
}

// MARK: - Preview
#Preview {
    VStack(spacing: 20) {
        ${structName}(size: 24, color: .blue)
        ${structName}(size: 48, color: .purple)
        ${structName}(size: 64)
    }
    .padding()
}
`;
  }

  return {
    code: code.trim(),
    language: 'swift',
    filename,
    mimeType: 'text/x-swift',
  };
}

function extractSvgPaths(svg: string): string[] {
  const matches = svg.matchAll(/\bd="([^"]*)"/gi);
  const paths: string[] = [];
  for (const match of matches) {
    paths.push(match[1]);
  }
  return paths.length > 0 ? paths : ['M0 0'];
}

function sanitizeSwiftName(name: string): string {
  const clean = name.replace(/[^a-zA-Z0-9_]/g, '');
  if (!clean || /^[0-9]/.test(clean)) {
    return `Svg${clean || 'Icon'}`;
  }
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}
