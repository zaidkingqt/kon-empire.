export type ToolId =
  | 'optimize'
  | 'react'
  | 'flutter'
  | 'swiftui'
  | 'android'
  | 'png'
  | 'webp';

export interface SvgMetadata {
  width: number;
  height: number;
  viewBox: string;
  hasViewBox: boolean;
  elementCount: number;
  pathCount: number;
  originalBytes: number;
  hasScripts: boolean;
  warnings: string[];
}

export interface OptimizerOptions {
  multipass: boolean;
  removeComments: boolean;
  removeMetadata: boolean;
  removeEditorsNSData: boolean;
  cleanupIds: boolean;
  removeEmptyAttrs: boolean;
  removeEmptyContainers: boolean;
  removeHiddenElems: boolean;
  convertColors: boolean;
  collapseGroups: boolean;
  precision: number; // Decimal precision (1-5)
  minifyStyles: boolean;
}

export interface ReactOptions {
  componentName: string;
  typescript: boolean;
  forwardRef: boolean;
  spreadProps: boolean;
  memo: boolean;
  iconProps: boolean; // default width/height from props
  exportType: 'named' | 'default';
  native: boolean; // React Native
}

export interface FlutterOptions {
  widgetName: string;
  mode: 'custom-painter' | 'svg-picture' | 'vector-graphics';
  includeColorProp: boolean;
  includeSizeProp: boolean;
}

export interface SwiftUiOptions {
  structName: string;
  mode: 'shape' | 'view';
  includeColorParam: boolean;
  includeSizeParam: boolean;
}

export interface AndroidOptions {
  drawableName: string;
  targetApi: number;
  tintColor?: string;
  vectorWidth: number;
  vectorHeight: number;
}

export interface RasterOptions {
  scale: 1 | 2 | 3 | 4 | 8;
  customWidth?: number;
  customHeight?: number;
  lockAspectRatio: boolean;
  backgroundColor: string; // 'transparent' or hex
  quality: number; // 0.1 - 1.0 (for WebP)
  format: 'png' | 'webp';
}

export interface ConversionResult {
  code: string;
  language: string;
  filename: string;
  mimeType: string;
  byteSize?: number;
  savedPercentage?: number;
  warnings?: string[];
  dataUrl?: string;
  blob?: Blob;
}

export interface ValidationResult {
  isValid: boolean;
  sanitizedSvg: string;
  metadata: SvgMetadata;
  error?: string;
}
