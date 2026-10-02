import { describe, it, expect } from 'vitest';
import { validateAndSanitizeSvg } from '../src/lib/sanitizer';

describe('SVG Sanitizer & Validator', () => {
  it('should validate and parse a clean SVG icon', () => {
    const raw = '<svg width="24" height="24" viewBox="0 0 24 24"><path d="M10 10"/></svg>';
    const result = validateAndSanitizeSvg(raw);
    expect(result.isValid).toBe(true);
    expect(result.metadata.width).toBe(24);
    expect(result.metadata.height).toBe(24);
    expect(result.metadata.pathCount).toBe(1);
    expect(result.metadata.hasScripts).toBe(false);
  });

  it('should strip dangerous <script> tags from SVG', () => {
    const malicious = '<svg width="24" height="24"><script>alert("xss")</script><circle cx="12" cy="12" r="10"/></svg>';
    const result = validateAndSanitizeSvg(malicious);
    expect(result.isValid).toBe(true);
    expect(result.metadata.hasScripts).toBe(true);
    expect(result.sanitizedSvg).not.toContain('<script');
    expect(result.sanitizedSvg).not.toContain('alert');
    expect(result.sanitizedSvg).toContain('<circle');
  });

  it('should strip dangerous inline event handlers (onclick, onload)', () => {
    const malicious = '<svg onload="alert(1)" width="24" height="24"><path onclick="stealCookies()" d="M0 0"/></svg>';
    const result = validateAndSanitizeSvg(malicious);
    expect(result.isValid).toBe(true);
    expect(result.metadata.hasScripts).toBe(true);
    expect(result.sanitizedSvg).not.toContain('onload');
    expect(result.sanitizedSvg).not.toContain('onclick');
    expect(result.sanitizedSvg).not.toContain('stealCookies');
  });

  it('should strip javascript: URIs in href and xlink:href', () => {
    const malicious = '<svg><a href="javascript:alert(1)"><text>Click</text></a></svg>';
    const result = validateAndSanitizeSvg(malicious);
    expect(result.isValid).toBe(true);
    expect(result.metadata.hasScripts).toBe(true);
    expect(result.sanitizedSvg).not.toContain('javascript:');
  });

  it('should gracefully handle empty or whitespace SVG strings', () => {
    const result = validateAndSanitizeSvg('   ');
    expect(result.isValid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should automatically add viewBox when missing if width and height exist', () => {
    const raw = '<svg width="100" height="200"><rect width="100" height="200"/></svg>';
    const result = validateAndSanitizeSvg(raw);
    expect(result.isValid).toBe(true);
    expect(result.sanitizedSvg).toContain('viewBox="0 0 100 200"');
  });
});
