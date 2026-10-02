import { describe, it, expect } from 'vitest';
import { optimizeSvg } from '../src/lib/optimizer';

describe('SVG Optimizer (SVGO)', () => {
  it('should optimize and reduce size of bloated SVG', () => {
    const bloated = `
      <!-- Editor Comment -->
      <svg xmlns="http://www.w3.org/2000/svg" width="100.000000" height="100.000000" viewBox="0 0 100 100">
        <metadata><rdf>Unused metadata</rdf></metadata>
        <g id="empty_layer"></g>
        <path d="M 10.000000 10.000000 L 90.000000 90.000000" stroke="#ff0000" stroke-width="2.000000" />
      </svg>
    `;

    const res = optimizeSvg(bloated, {
      removeComments: true,
      removeMetadata: true,
      removeEmptyContainers: true,
      precision: 1,
    });

    expect(res.code).toBeDefined();
    expect(res.code).not.toContain('Editor Comment');
    expect(res.code).not.toContain('metadata');
    expect(res.savedPercentage).toBeGreaterThan(0);
    expect(res.byteSize).toBeLessThan(new TextEncoder().encode(bloated).length);
  });

  it('should preserve essential visual paths and viewbox', () => {
    const input = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="blue"/></svg>';
    const res = optimizeSvg(input);
    expect(res.code).toContain('viewBox="0 0 24 24"');
    expect(res.code).toContain('circle');
  });
});
