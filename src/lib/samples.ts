export interface SampleSvg {
  id: string;
  name: string;
  category: string;
  description: string;
  svg: string;
}

export const SAMPLE_SVGS: SampleSvg[] = [
  {
    id: 'shield-security',
    name: 'Security Shield',
    category: 'Icons',
    description: 'Clean modern security shield icon with strokes and gradients',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  <path d="m9 12 2 2 4-4"/>
</svg>`,
  },
  {
    id: 'bloated-editor-export',
    name: 'Bloated Figma/Inkscape Export',
    category: 'Optimization Test',
    description: 'SVG with editor metadata, comments, and redundant namespaces to test SVGO compression',
    svg: `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!-- Created with Inkscape (http://www.inkscape.org/) -->
<!-- Generator: Adobe Illustrator 25.0.0, SVG Export Plug-In -->
<svg xmlns:dc="http://purl.org/dc/elements/1.1/" 
     xmlns:cc="http://creativecommons.org/ns#" 
     xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" 
     xmlns:svg="http://www.w3.org/2000/svg" 
     xmlns="http://www.w3.org/2000/svg" 
     xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd" 
     xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" 
     width="48.000000pt" 
     height="48.000000pt" 
     viewBox="0 0 48.000000 48.000000" 
     id="svg_root_layer_main" 
     version="1.1" 
     inkscape:version="1.0.2 (e86c870879, 2021-01-15)" 
     sodipodi:docname="sparkles_icon_raw.svg">
  <metadata id="metadata5544">
    <rdf:RDF>
      <cc:Work rdf:about="">
        <dc:format>image/svg+xml</dc:format>
        <dc:type rdf:resource="http://purl.org/dc/dcmitype/StillImage" />
        <dc:title>Unoptimized Vector Asset</dc:title>
      </cc:Work>
    </rdf:RDF>
  </metadata>
  <sodipodi:namedview id="base" pagecolor="#ffffff" bordercolor="#666666" borderopacity="1.0" />
  <g id="layer_main_group_unused" inkscape:label="Layer 1" inkscape:groupmode="layer">
    <g id="sub_group_empty"></g>
    <path id="path_vector_core" 
          style="fill:#6366f1;fill-opacity:1.0000000;stroke:none;stroke-width:1.0000000" 
          d="M 24.000000,4.0000000 L 29.500000,18.500000 L 44.000000,24.000000 L 29.500000,29.500000 L 24.000000,44.000000 L 18.500000,29.500000 L 4.0000000,24.000000 L 18.500000,18.500000 Z" />
    <!-- Secondary decorative sparkle -->
    <path id="path_sparkle_small" 
          fill="#a855f7" 
          d="M 38.000000,6.000000 L 40.000000,11.000000 L 45.000000,13.000000 L 40.000000,15.000000 L 38.000000,20.000000 L 36.000000,15.000000 L 31.000000,13.000000 L 36.000000,11.000000 Z" />
  </g>
</svg>`,
  },
  {
    id: 'rocket-launch',
    name: 'Rocket Launch',
    category: 'Illustrations',
    description: 'Multi-layer rocket vector with gradients and paths',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
  <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
  <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
  <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
</svg>`,
  },
  {
    id: 'gradient-sphere',
    name: 'Gradient Orb',
    category: 'Gradients',
    description: 'Complex SVG with radial gradient definition and nested groups',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
  <defs>
    <radialGradient id="sphereGrad" cx="30%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="50%" stop-color="#3b82f6"/>
      <stop offset="100%" stop-color="#1e1b4b"/>
    </radialGradient>
  </defs>
  <circle cx="32" cy="32" r="28" fill="url(#sphereGrad)"/>
  <circle cx="22" cy="20" r="4" fill="#ffffff" fill-opacity="0.4"/>
</svg>`,
  },
];
