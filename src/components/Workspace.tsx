import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import type { ToolId, OptimizerOptions, ReactOptions, FlutterOptions, SwiftUiOptions, AndroidOptions, RasterOptions, ConversionResult } from '../lib/types';
import { validateAndSanitizeSvg } from '../lib/sanitizer';
import { optimizeSvg, defaultOptimizerOptions } from '../lib/optimizer';
import { convertSvgToReact, defaultReactOptions } from '../lib/react-converter';
import { convertSvgToFlutter, defaultFlutterOptions } from '../lib/flutter-converter';
import { convertSvgToSwiftUi, defaultSwiftUiOptions } from '../lib/swiftui-converter';
import { convertSvgToAndroidVector, defaultAndroidOptions } from '../lib/android-converter';
import { rasterizeSvg, defaultRasterOptions } from '../lib/rasterizer';
import { formatBytes, calculateSavings, downloadFile, copyToClipboard } from '../lib/format-utils';
import { SAMPLE_SVGS } from '../lib/samples';
import {
  FileCode,
  Zap,
  Code2,
  Smartphone,
  Apple,
  Bot,
  Image as ImageIcon,
  Sparkles,
  Copy,
  Check,
  Download,
  Upload,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  ShieldCheck,
  AlertTriangle,
  Sliders,
  Eye,
  Terminal,
  Grid,
} from 'lucide-react';

export interface WorkspaceProps {
  initialTool?: ToolId;
  defaultSvg?: string;
  hideAdSlots?: boolean;
}

export const Workspace: React.FC<WorkspaceProps> = ({
  initialTool = 'optimize',
  defaultSvg,
}) => {
  // Main State
  const [activeTool, setActiveTool] = useState<ToolId>(initialTool);
  const [rawSvgInput, setRawSvgInput] = useState<string>(
    defaultSvg || SAMPLE_SVGS[0].svg
  );
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [previewZoom, setPreviewZoom] = useState<number>(1);
  const [previewBg, setPreviewBg] = useState<'grid-dark' | 'grid-light' | 'dark' | 'white'>('grid-dark');
  const [previewMode, setPreviewMode] = useState<'visual' | 'code'>('visual');

  // Tool Specific Configurations
  const [optOptions, setOptOptions] = useState<OptimizerOptions>(defaultOptimizerOptions);
  const [reactOpts, setReactOpts] = useState<ReactOptions>(defaultReactOptions);
  const [flutterOpts, setFlutterOpts] = useState<FlutterOptions>(defaultFlutterOptions);
  const [swiftOpts, setSwiftOpts] = useState<SwiftUiOptions>(defaultSwiftUiOptions);
  const [androidOpts, setAndroidOpts] = useState<AndroidOptions>(defaultAndroidOptions);
  const [rasterOpts, setRasterOpts] = useState<RasterOptions>(defaultRasterOptions);

  // Raster output cache
  const [rasterResult, setRasterResult] = useState<ConversionResult | null>(null);
  const [rasterLoading, setRasterLoading] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate and sanitize current SVG
  const validation = useMemo(() => {
    return validateAndSanitizeSvg(rawSvgInput);
  }, [rawSvgInput]);

  // Execute conversion based on active tool
  const currentResult = useMemo<ConversionResult>(() => {
    if (!validation.isValid) {
      return {
        code: `// ${validation.error || 'Please provide a valid SVG file.'}`,
        language: 'text',
        filename: 'error.txt',
        mimeType: 'text/plain',
      };
    }

    const svg = validation.sanitizedSvg;

    switch (activeTool) {
      case 'optimize':
        return optimizeSvg(svg, optOptions);
      case 'react':
        return convertSvgToReact(svg, reactOpts);
      case 'flutter':
        return convertSvgToFlutter(svg, flutterOpts);
      case 'swiftui':
        return convertSvgToSwiftUi(svg, swiftOpts);
      case 'android':
        return convertSvgToAndroidVector(svg, androidOpts);
      case 'png':
      case 'webp':
        return rasterResult || {
          code: '',
          language: activeTool,
          filename: `vectorforge.${activeTool}`,
          mimeType: activeTool === 'webp' ? 'image/webp' : 'image/png',
          dataUrl: '',
        };
      default:
        return optimizeSvg(svg, optOptions);
    }
  }, [validation, activeTool, optOptions, reactOpts, flutterOpts, swiftOpts, androidOpts, rasterResult]);

  // Handle Rasterization when active tool is PNG or WebP or raster options change
  const runRasterizer = useCallback(async () => {
    if (!validation.isValid || (activeTool !== 'png' && activeTool !== 'webp')) {
      return;
    }
    setRasterLoading(true);
    try {
      const res = await rasterizeSvg(validation.sanitizedSvg, {
        ...rasterOpts,
        format: activeTool,
      });
      setRasterResult(res);
      setErrorMessage(null);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Rasterization failed.');
    } finally {
      setRasterLoading(false);
    }
  }, [validation, activeTool, rasterOpts]);

  useEffect(() => {
    if (activeTool === 'png' || activeTool === 'webp') {
      runRasterizer();
    }
  }, [activeTool, validation.sanitizedSvg, rasterOpts.scale, rasterOpts.backgroundColor, rasterOpts.quality, rasterOpts.customWidth, rasterOpts.customHeight, runRasterizer]);

  // File Upload Handlers
  const handleFileUpload = (file: File) => {
    if (!file) return;
    if (file.type && !file.type.includes('svg') && !file.name.endsWith('.svg')) {
      setErrorMessage('Please select a valid .svg file.');
      return;
    }
    setIsProcessing(true);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setRawSvgInput(content);
        // Auto set component / struct name from file name
        const cleanBaseName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_]/g, '');
        if (cleanBaseName) {
          const capitalized = cleanBaseName.charAt(0).toUpperCase() + cleanBaseName.slice(1);
          setReactOpts((prev) => ({ ...prev, componentName: `${capitalized}Icon` }));
          setFlutterOpts((prev) => ({ ...prev, widgetName: `${capitalized}Icon` }));
          setSwiftOpts((prev) => ({ ...prev, structName: `${capitalized}Icon` }));
          setAndroidOpts((prev) => ({ ...prev, drawableName: `ic_${cleanBaseName.toLowerCase()}` }));
        }
      }
      setIsProcessing(false);
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read file from your device.');
      setIsProcessing(false);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleCopy = async () => {
    const textToCopy = currentResult.code;
    if (!textToCopy) return;
    const ok = await copyToClipboard(textToCopy);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (activeTool === 'png' || activeTool === 'webp') {
      if (rasterResult?.blob) {
        downloadFile(rasterResult.blob, rasterResult.filename, rasterResult.mimeType);
      }
    } else {
      downloadFile(currentResult.code, currentResult.filename, currentResult.mimeType);
    }
  };

  // Savings calculation for optimizer
  const savings = useMemo(() => {
    if (activeTool === 'optimize' && currentResult.byteSize) {
      return calculateSavings(validation.metadata.originalBytes, currentResult.byteSize);
    }
    return null;
  }, [activeTool, validation.metadata.originalBytes, currentResult.byteSize]);

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 py-4 flex flex-col gap-6">
      {/* Privacy Guarantee Pill */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 px-4 rounded-xl bg-forge-surface border border-forge-border/80 text-xs text-forge-textMuted">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium text-forge-text flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            100% Client-Side Processing
          </span>
          <span className="hidden sm:inline text-forge-textMuted/60">•</span>
          <span className="hidden sm:inline">Your SVG files never leave your device.</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span className="text-forge-textMuted">Memory Safe</span>
          <span>•</span>
          <span className="text-forge-textMuted">Zero Server Uploads</span>
        </div>
      </div>

      {/* Drop Zone & Input Bar */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative rounded-2xl border-2 border-dashed transition-all duration-200 p-6 flex flex-col items-center justify-center text-center gap-4 ${
          isDragging
            ? 'border-brand-500 bg-brand-500/10 scale-[1.005]'
            : 'border-forge-border hover:border-forge-borderLight bg-forge-surface/60'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          accept=".svg,image/svg+xml"
          onChange={(e) => {
            if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
          }}
          className="hidden"
        />

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 shadow-inner">
            <Upload className="w-6 h-6" />
          </div>
          <div className="text-left">
            <h3 className="text-base sm:text-lg font-semibold text-forge-text">
              Drop your SVG file here, or{' '}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-brand-400 hover:text-brand-300 underline font-medium cursor-pointer"
              >
                browse files
              </button>
            </h3>
            <p className="text-xs sm:text-sm text-forge-textMuted mt-0.5">
              Supports Figma clipboard paste (Ctrl+V), raw XML, or .svg files
            </p>
          </div>
        </div>

        {/* Quick Sample Selector */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-forge-border/40 w-full max-w-2xl">
          <span className="text-xs text-forge-textMuted flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Quick Test Samples:
          </span>
          {SAMPLE_SVGS.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => {
                setRawSvgInput(sample.svg);
                setErrorMessage(null);
              }}
              className="px-2.5 py-1 text-xs rounded-lg bg-forge-surfaceHover/80 hover:bg-forge-surfaceHover text-forge-text border border-forge-border hover:border-brand-500/40 transition-colors cursor-pointer"
            >
              {sample.name}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setRawSvgInput('');
              setErrorMessage(null);
            }}
            className="px-2 py-1 text-xs rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors ml-auto cursor-pointer"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Error & Warning Banners */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Notice</p>
            <p className="text-xs opacity-90">{errorMessage}</p>
          </div>
        </div>
      )}

      {validation.metadata.warnings.length > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
          <div className="flex-1">
            <span className="font-medium">Sanitization Notice: </span>
            {validation.metadata.warnings.join(' ')}
          </div>
        </div>
      )}

      {/* Main Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 p-3.5 rounded-xl bg-forge-surface border border-forge-border text-xs">
        <div className="flex flex-col">
          <span className="text-forge-textMuted text-[11px]">Original Size</span>
          <span className="font-mono font-medium text-forge-text text-sm">
            {formatBytes(validation.metadata.originalBytes)}
          </span>
        </div>

        {activeTool === 'optimize' && savings && (
          <>
            <div className="flex flex-col">
              <span className="text-forge-textMuted text-[11px]">Optimized Size</span>
              <span className="font-mono font-medium text-emerald-400 text-sm">
                {formatBytes(currentResult.byteSize || 0)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-forge-textMuted text-[11px]">Saved</span>
              <span className="font-mono font-bold text-emerald-400 text-sm flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" />
                {savings.savedPercent}%
              </span>
            </div>
          </>
        )}

        <div className="flex flex-col">
          <span className="text-forge-textMuted text-[11px]">Dimensions</span>
          <span className="font-mono font-medium text-forge-text text-sm">
            {validation.metadata.width} × {validation.metadata.height} px
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-forge-textMuted text-[11px]">Paths / Elements</span>
          <span className="font-mono font-medium text-forge-text text-sm">
            {validation.metadata.pathCount} paths · {validation.metadata.elementCount} elements
          </span>
        </div>
      </div>

      {/* Main Dual Workspace: Left = Live Visual Preview, Right = Code & Tool Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT PANEL: Live SVG Visual Preview (5 Columns on Desktop) */}
        <div className="lg:col-span-5 flex flex-col rounded-2xl bg-forge-surface border border-forge-border overflow-hidden shadow-xl">
          {/* Preview Toolbar */}
          <div className="flex items-center justify-between p-3 border-b border-forge-border bg-forge-surfaceHover/40">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewMode('visual')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                  previewMode === 'visual'
                    ? 'bg-forge-borderLight text-forge-text shadow-sm'
                    : 'text-forge-textMuted hover:text-forge-text'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Live Preview
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('code')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                  previewMode === 'code'
                    ? 'bg-forge-borderLight text-forge-text shadow-sm'
                    : 'text-forge-textMuted hover:text-forge-text'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                Raw SVG
              </button>
            </div>

            {/* Visual Controls */}
            {previewMode === 'visual' && (
              <div className="flex items-center gap-1 text-forge-textMuted">
                {/* Background Selector */}
                <button
                  type="button"
                  title="Toggle Background Mode"
                  onClick={() => {
                    const modes: Array<'grid-dark' | 'grid-light' | 'dark' | 'white'> = ['grid-dark', 'grid-light', 'dark', 'white'];
                    const next = modes[(modes.indexOf(previewBg) + 1) % modes.length];
                    setPreviewBg(next);
                  }}
                  className="p-1.5 rounded-lg hover:bg-forge-surfaceHover hover:text-forge-text transition-colors cursor-pointer"
                >
                  <Grid className="w-3.5 h-3.5" />
                </button>

                {/* Zoom Out */}
                <button
                  type="button"
                  title="Zoom Out"
                  onClick={() => setPreviewZoom((z) => Math.max(0.25, z - 0.25))}
                  className="p-1.5 rounded-lg hover:bg-forge-surfaceHover hover:text-forge-text transition-colors cursor-pointer"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] font-mono px-1">
                  {Math.round(previewZoom * 100)}%
                </span>
                {/* Zoom In */}
                <button
                  type="button"
                  title="Zoom In"
                  onClick={() => setPreviewZoom((z) => Math.min(4, z + 0.25))}
                  className="p-1.5 rounded-lg hover:bg-forge-surfaceHover hover:text-forge-text transition-colors cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                {/* Reset Zoom */}
                <button
                  type="button"
                  title="Reset Zoom"
                  onClick={() => setPreviewZoom(1)}
                  className="p-1.5 rounded-lg hover:bg-forge-surfaceHover hover:text-forge-text transition-colors cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Canvas Display Body */}
          <div className="relative min-h-[380px] sm:min-h-[460px] flex items-center justify-center p-6 overflow-hidden">
            {previewMode === 'visual' ? (
              <div
                className={`w-full h-full min-h-[360px] rounded-xl flex items-center justify-center p-6 transition-all duration-150 overflow-auto border border-forge-border/40 ${
                  previewBg === 'grid-dark'
                    ? 'bg-[#0f141c] bg-transparency-grid'
                    : previewBg === 'grid-light'
                    ? 'bg-[#f1f5f9] bg-transparency-grid text-black'
                    : previewBg === 'dark'
                    ? 'bg-black'
                    : 'bg-white text-black'
                }`}
              >
                {validation.isValid ? (
                  <div
                    style={{ transform: `scale(${previewZoom})`, transformOrigin: 'center' }}
                    className="transition-transform duration-100 flex items-center justify-center max-w-full max-h-full"
                    dangerouslySetInnerHTML={{ __html: validation.sanitizedSvg }}
                  />
                ) : (
                  <div className="text-center text-forge-textMuted text-xs flex flex-col items-center gap-2">
                    <FileCode className="w-8 h-8 opacity-40" />
                    <span>No valid SVG to preview</span>
                  </div>
                )}
              </div>
            ) : (
              <textarea
                value={rawSvgInput}
                onChange={(e) => setRawSvgInput(e.target.value)}
                placeholder="Paste raw SVG markup here..."
                aria-label="Raw SVG markup editor"
                className="w-full h-[360px] bg-black/40 text-forge-text font-mono text-xs p-4 rounded-xl border border-forge-border focus:border-brand-500 focus:outline-none resize-none"
              />
            )}
          </div>

          {/* Quick ViewBox & Dimension Footer */}
          <div className="p-3 border-t border-forge-border bg-forge-surfaceHover/20 flex items-center justify-between text-[11px] font-mono text-forge-textMuted">
            <span>ViewBox: {validation.metadata.viewBox || 'None'}</span>
            <span>Target: {activeTool.toUpperCase()}</span>
          </div>
        </div>

        {/* RIGHT PANEL: Tool Tabs & Code / Export Workspace (7 Columns on Desktop) */}
        <div className="lg:col-span-7 flex flex-col rounded-2xl bg-forge-surface border border-forge-border overflow-hidden shadow-xl">
          {/* Horizontal Tool Tabs Bar */}
          <div className="flex items-center overflow-x-auto border-b border-forge-border bg-forge-surfaceHover/30 p-2 gap-1.5 scrollbar-thin">
            {[
              { id: 'optimize' as ToolId, label: 'Optimize', icon: Zap },
              { id: 'react' as ToolId, label: 'React / JSX', icon: Code2 },
              { id: 'flutter' as ToolId, label: 'Flutter', icon: Smartphone },
              { id: 'swiftui' as ToolId, label: 'SwiftUI', icon: Apple },
              { id: 'android' as ToolId, label: 'Android XML', icon: Bot },
              { id: 'png' as ToolId, label: 'PNG Export', icon: ImageIcon },
              { id: 'webp' as ToolId, label: 'WebP Export', icon: Sparkles },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTool === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTool(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all duration-150 cursor-pointer ${
                    isActive
                      ? 'bg-brand-500/15 text-brand-400 border border-brand-500/30 shadow-sm'
                      : 'text-forge-textMuted hover:text-forge-text hover:bg-forge-surfaceHover border border-transparent'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tool Options Configuration Ribbon */}
          <div className="p-3.5 border-b border-forge-border bg-forge-surfaceHover/10">
            {activeTool === 'optimize' && (
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer text-forge-text">
                  <input
                    type="checkbox"
                    checked={optOptions.removeComments}
                    onChange={(e) => setOptOptions({ ...optOptions, removeComments: e.target.checked })}
                    className="rounded border-forge-border text-brand-500 focus:ring-brand-500"
                  />
                  Comments
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-forge-text">
                  <input
                    type="checkbox"
                    checked={optOptions.removeMetadata}
                    onChange={(e) => setOptOptions({ ...optOptions, removeMetadata: e.target.checked })}
                    className="rounded border-forge-border text-brand-500 focus:ring-brand-500"
                  />
                  Metadata
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-forge-text">
                  <input
                    type="checkbox"
                    checked={optOptions.cleanupIds}
                    onChange={(e) => setOptOptions({ ...optOptions, cleanupIds: e.target.checked })}
                    className="rounded border-forge-border text-brand-500 focus:ring-brand-500"
                  />
                  Clean IDs
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-forge-text">
                  <input
                    type="checkbox"
                    checked={optOptions.collapseGroups}
                    onChange={(e) => setOptOptions({ ...optOptions, collapseGroups: e.target.checked })}
                    className="rounded border-forge-border text-brand-500 focus:ring-brand-500"
                  />
                  Collapse Groups
                </label>
                <div className="flex items-center gap-1.5 ml-auto text-forge-textMuted">
                  <span>Precision:</span>
                  <select
                    value={optOptions.precision}
                    onChange={(e) => setOptOptions({ ...optOptions, precision: Number(e.target.value) })}
                    className="bg-forge-surface border border-forge-border text-forge-text rounded px-1.5 py-0.5 text-xs font-mono"
                  >
                    <option value={1}>1 dec</option>
                    <option value={2}>2 dec</option>
                    <option value={3}>3 dec</option>
                  </select>
                </div>
              </div>
            )}

            {activeTool === 'react' && (
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-forge-textMuted">Component:</span>
                  <input
                    type="text"
                    value={reactOpts.componentName}
                    onChange={(e) => setReactOpts({ ...reactOpts, componentName: e.target.value })}
                    className="bg-forge-surface border border-forge-border text-forge-text rounded px-2 py-0.5 text-xs font-mono w-28 focus:border-brand-500 focus:outline-none"
                    placeholder="SvgIcon"
                  />
                </div>
                <label className="flex items-center gap-1.5 cursor-pointer text-forge-text">
                  <input
                    type="checkbox"
                    checked={reactOpts.typescript}
                    onChange={(e) => setReactOpts({ ...reactOpts, typescript: e.target.checked })}
                    className="rounded border-forge-border text-brand-500"
                  />
                  TypeScript
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-forge-text">
                  <input
                    type="checkbox"
                    checked={reactOpts.forwardRef}
                    onChange={(e) => setReactOpts({ ...reactOpts, forwardRef: e.target.checked })}
                    className="rounded border-forge-border text-brand-500"
                  />
                  forwardRef
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-forge-text">
                  <input
                    type="checkbox"
                    checked={reactOpts.native}
                    onChange={(e) => setReactOpts({ ...reactOpts, native: e.target.checked })}
                    className="rounded border-forge-border text-brand-500"
                  />
                  React Native
                </label>
              </div>
            )}

            {activeTool === 'flutter' && (
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-forge-textMuted">Widget Name:</span>
                  <input
                    type="text"
                    value={flutterOpts.widgetName}
                    onChange={(e) => setFlutterOpts({ ...flutterOpts, widgetName: e.target.value })}
                    className="bg-forge-surface border border-forge-border text-forge-text rounded px-2 py-0.5 text-xs font-mono w-32 focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-1.5 ml-auto">
                  <span className="text-forge-textMuted">Mode:</span>
                  <select
                    value={flutterOpts.mode}
                    onChange={(e) => setFlutterOpts({ ...flutterOpts, mode: e.target.value as any })}
                    className="bg-forge-surface border border-forge-border text-forge-text rounded px-2 py-0.5 text-xs font-mono"
                  >
                    <option value="svg-picture">SvgPicture (Standard)</option>
                    <option value="custom-painter">CustomPainter (Native)</option>
                    <option value="vector-graphics">vector_graphics</option>
                  </select>
                </div>
              </div>
            )}

            {activeTool === 'swiftui' && (
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-forge-textMuted">Struct Name:</span>
                  <input
                    type="text"
                    value={swiftOpts.structName}
                    onChange={(e) => setSwiftOpts({ ...swiftOpts, structName: e.target.value })}
                    className="bg-forge-surface border border-forge-border text-forge-text rounded px-2 py-0.5 text-xs font-mono w-32 focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-1.5 ml-auto">
                  <span className="text-forge-textMuted">Mode:</span>
                  <select
                    value={swiftOpts.mode}
                    onChange={(e) => setSwiftOpts({ ...swiftOpts, mode: e.target.value as any })}
                    className="bg-forge-surface border border-forge-border text-forge-text rounded px-2 py-0.5 text-xs font-mono"
                  >
                    <option value="view">SwiftUI View (Scalable)</option>
                    <option value="shape">SwiftUI Shape (Path)</option>
                  </select>
                </div>
              </div>
            )}

            {activeTool === 'android' && (
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-forge-textMuted">Drawable Name:</span>
                  <input
                    type="text"
                    value={androidOpts.drawableName}
                    onChange={(e) => setAndroidOpts({ ...androidOpts, drawableName: e.target.value })}
                    className="bg-forge-surface border border-forge-border text-forge-text rounded px-2 py-0.5 text-xs font-mono w-36 focus:border-brand-500 focus:outline-none"
                  />
                </div>
                <span className="text-forge-textMuted text-[11px] ml-auto">Target: VectorDrawable API 21+</span>
              </div>
            )}

            {(activeTool === 'png' || activeTool === 'webp') && (
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-forge-textMuted">Scale:</span>
                  {[1, 2, 3, 4, 8].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRasterOpts({ ...rasterOpts, scale: s as any, customWidth: undefined, customHeight: undefined })}
                      className={`px-2 py-0.5 rounded text-xs font-mono transition-colors cursor-pointer ${
                        rasterOpts.scale === s && !rasterOpts.customWidth
                          ? 'bg-brand-500 text-black font-bold'
                          : 'bg-forge-surface border border-forge-border text-forge-text hover:bg-forge-surfaceHover'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-forge-textMuted">Background:</span>
                  <select
                    value={rasterOpts.backgroundColor}
                    onChange={(e) => setRasterOpts({ ...rasterOpts, backgroundColor: e.target.value })}
                    className="bg-forge-surface border border-forge-border text-forge-text rounded px-2 py-0.5 text-xs font-mono"
                  >
                    <option value="transparent">Transparent</option>
                    <option value="#ffffff">White (#fff)</option>
                    <option value="#000000">Black (#000)</option>
                    <option value="#10b981">Brand Green</option>
                  </select>
                </div>

                {activeTool === 'webp' && (
                  <div className="flex items-center gap-1.5 ml-auto">
                    <span className="text-forge-textMuted">Quality: {Math.round(rasterOpts.quality * 100)}%</span>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={rasterOpts.quality}
                      onChange={(e) => setRasterOpts({ ...rasterOpts, quality: parseFloat(e.target.value) })}
                      className="w-20 accent-brand-500 cursor-pointer"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Header: Filename, Copy Code, Download File */}
          <div className="flex items-center justify-between p-3 border-b border-forge-border bg-forge-surfaceHover/30">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-forge-textMuted" />
              <span className="font-mono text-xs text-forge-text font-medium">
                {currentResult.filename}
              </span>
              {currentResult.byteSize ? (
                <span className="text-[11px] font-mono text-forge-textMuted">
                  ({formatBytes(currentResult.byteSize)})
                </span>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              {activeTool !== 'png' && activeTool !== 'webp' && (
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-forge-surfaceHover hover:bg-forge-borderLight text-forge-text border border-forge-border transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-brand-500 hover:bg-brand-400 text-black font-semibold shadow-md transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>
                  {activeTool === 'png'
                    ? 'Download PNG'
                    : activeTool === 'webp'
                    ? 'Download WebP'
                    : `Download ${currentResult.filename.split('.').pop()?.toUpperCase()}`}
                </span>
              </button>
            </div>
          </div>

          {/* Code Output Area / Raster Preview Area */}
          <div className="relative min-h-[360px] max-h-[440px] overflow-auto bg-[#0a0d14] p-4 font-mono text-xs text-forge-text leading-relaxed">
            {activeTool === 'png' || activeTool === 'webp' ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[320px] gap-4 text-center">
                {rasterLoading ? (
                  <div className="flex flex-col items-center gap-2 text-forge-textMuted">
                    <RefreshCw className="w-6 h-6 animate-spin text-brand-400" />
                    <span>Rendering high-resolution bitmap client-side...</span>
                  </div>
                ) : rasterResult?.dataUrl ? (
                  <div className="flex flex-col items-center gap-3">
                    <div
                      className={`p-4 rounded-xl border border-forge-border/60 max-w-[260px] max-h-[220px] flex items-center justify-center overflow-hidden ${
                        rasterOpts.backgroundColor === 'transparent' ? 'bg-transparency-grid bg-[#11161f]' : ''
                      }`}
                      style={{ backgroundColor: rasterOpts.backgroundColor !== 'transparent' ? rasterOpts.backgroundColor : undefined }}
                    >
                      <img
                        src={rasterResult.dataUrl}
                        alt="Exported bitmap raster preview"
                        className="max-h-[180px] object-contain shadow-lg"
                      />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-forge-textMuted">
                      <span>Dimensions: {rasterResult.filename.split('-')[1]?.split('.')[0] || 'Auto'}</span>
                      <span>•</span>
                      <span>Size: {formatBytes(rasterResult.byteSize || 0)}</span>
                    </div>
                  </div>
                ) : (
                  <span className="text-forge-textMuted">Generating raster preview...</span>
                )}
              </div>
            ) : (
              <pre className="overflow-x-auto whitespace-pre font-mono">
                <code>{currentResult.code}</code>
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
