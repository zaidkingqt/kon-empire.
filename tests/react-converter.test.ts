import { describe, it, expect } from 'vitest';
import { convertSvgToReact } from '../src/lib/react-converter';

describe('SVG to React / JSX Converter', () => {
  it('should convert kebab-case SVG attributes to React camelCase', () => {
    const rawSvg = '<svg class="icon" stroke-width="2" stroke-linecap="round" fill-rule="evenodd"><path d="M0 0"/></svg>';
    const res = convertSvgToReact(rawSvg, { typescript: true, componentName: 'ArrowIcon' });

    expect(res.code).toContain('className="icon"');
    expect(res.code).toContain('strokeWidth="2"');
    expect(res.code).toContain('strokeLinecap="round"');
    expect(res.code).toContain('fillRule="evenodd"');
    expect(res.code).toContain('export const ArrowIcon');
    expect(res.code).toContain('React.forwardRef');
    expect(res.filename).toBe('ArrowIcon.tsx');
  });

  it('should convert inline style string into JSX style object', () => {
    const rawSvg = '<svg><path style="fill: red; stroke-width: 2px" d="M0 0"/></svg>';
    const res = convertSvgToReact(rawSvg, { typescript: false, forwardRef: false });

    expect(res.code).toContain("style={{ fill: 'red', strokeWidth: '2px' }}");
  });

  it('should support React Native mode with react-native-svg components', () => {
    const rawSvg = '<svg viewBox="0 0 24 24"><path d="M0 0"/><circle cx="12" cy="12" r="5"/></svg>';
    const res = convertSvgToReact(rawSvg, { native: true, typescript: true, componentName: 'NativeIcon' });

    expect(res.code).toContain("import Svg, { Path, Rect, Circle, G, Defs, LinearGradient, RadialGradient, Stop, ClipPath } from 'react-native-svg'");
    expect(res.code).toContain('<Svg');
    expect(res.code).toContain('<Path');
    expect(res.code).toContain('<Circle');
  });
});
