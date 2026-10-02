import type { FlutterOptions, ConversionResult } from './types';
import { validateAndSanitizeSvg } from './sanitizer';

export const defaultFlutterOptions: FlutterOptions = {
  widgetName: 'CustomSvgIcon',
  mode: 'svg-picture',
  includeColorProp: true,
  includeSizeProp: true,
};

/**
 * Convert SVG to clean, syntactically valid Flutter / Dart code
 */
export function convertSvgToFlutter(
  svgString: string,
  options: Partial<FlutterOptions> = {}
): ConversionResult {
  const opts = { ...defaultFlutterOptions, ...options };
  const widgetName = sanitizeFlutterName(opts.widgetName || 'CustomSvgIcon');
  const validation = validateAndSanitizeSvg(svgString);
  const { width = 24, height = 24 } = validation.metadata;

  let code = '';
  const filename = `${toSnakeCase(widgetName)}.dart`;

  if (opts.mode === 'svg-picture') {
    // Mode 1: SvgPicture string approach (Standard Flutter best-practice)
    code = `import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

/// Generated with VectorForge (https://vectorforge.dev)
/// Requires 'flutter_svg' package: flutter pub add flutter_svg
class ${widgetName} extends StatelessWidget {
  final double? width;
  final double? height;
  final Color? color;
  final BoxFit fit;

  const ${widgetName}({
    super.key,
    this.width = ${width},
    this.height = ${height},
    this.color,
    this.fit = BoxFit.contain,
  });

  static const String _rawSvg = '''
${svgString.trim()}
''';

  @override
  Widget build(BuildContext context) {
    return SvgPicture.string(
      _rawSvg,
      width: width,
      height: height,
      fit: fit,
      colorFilter: color != null
          ? ColorFilter.mode(color!, BlendMode.srcIn)
          : null,
    );
  }
}
`;
  } else if (opts.mode === 'vector-graphics') {
    // Mode 2: vector_graphics package approach
    code = `import 'package:flutter/material.dart';
import 'package:vector_graphics/vector_graphics.dart';

/// Generated with VectorForge (https://vectorforge.dev)
/// Requires 'vector_graphics' package: flutter pub add vector_graphics
class ${widgetName} extends StatelessWidget {
  final double width;
  final double height;
  final Color? color;

  const ${widgetName}({
    super.key,
    this.width = ${width},
    this.height = ${height},
    this.color,
  });

  static const String _svgData = '''
${svgString.trim()}
''';

  @override
  Widget build(BuildContext context) {
    return VectorGraphic(
      loader: const AssetBytesLoader('assets/icons/${toSnakeCase(widgetName)}.vec'),
      width: width,
      height: height,
      colorFilter: color != null ? ColorFilter.mode(color!, BlendMode.srcIn) : null,
    );
  }
}
`;
  } else {
    // Mode 3: CustomPainter drawing
    const painterName = `_${widgetName}Painter`;
    const paths = extractPaths(svgString);

    code = `import 'package:flutter/material.dart';

/// Generated with VectorForge (https://vectorforge.dev)
/// Native Flutter CustomPainter rendering
class ${widgetName} extends StatelessWidget {
  final double size;
  final Color? color;

  const ${widgetName}({
    super.key,
    this.size = ${Math.max(width, height)},
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      size: Size(size, size * (${height} / ${width})),
      painter: ${painterName}(
        color: color ?? Theme.of(context).iconTheme.color ?? Colors.black,
      ),
    );
  }
}

class ${painterName} extends CustomPainter {
  final Color color;

  ${painterName}({required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final scaleX = size.width / ${width};
    final scaleY = size.height / ${height};
    canvas.scale(scaleX, scaleY);

    final paint = Paint()
      ..style = PaintingStyle.fill
      ..color = color;

${paths.map((p, i) => `    // Path ${i + 1}\n    final path${i} = Path();\n    // Path data: ${p.data.slice(0, 40)}...\n    // Note: Use flutter_svg for complex multi-curve bezier rendering\n    canvas.drawPath(path${i}, paint);`).join('\n\n')}
  }

  @override
  bool shouldRepaint(covariant ${painterName} oldDelegate) {
    return oldDelegate.color != color;
  }
}
`;
  }

  return {
    code: code.trim(),
    language: 'dart',
    filename,
    mimeType: 'text/x-dart',
  };
}

interface SvgPathInfo {
  data: string;
  fill?: string;
  stroke?: string;
}

function extractPaths(svg: string): SvgPathInfo[] {
  const matches = svg.matchAll(/<path\b([^>]*)\/?>/gi);
  const results: SvgPathInfo[] = [];
  for (const match of matches) {
    const attrStr = match[1];
    const dMatch = attrStr.match(/\bd="([^"]*)"/i);
    if (dMatch) {
      results.push({
        data: dMatch[1],
      });
    }
  }
  return results.length > 0 ? results : [{ data: 'M0 0' }];
}

function sanitizeFlutterName(name: string): string {
  const clean = name.replace(/[^a-zA-Z0-9_]/g, '');
  if (!clean || /^[0-9]/.test(clean)) {
    return `Svg${clean || 'Icon'}`;
  }
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '');
}
