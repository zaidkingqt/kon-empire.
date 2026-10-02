import { describe, it, expect } from 'vitest';
import { convertSvgToFlutter } from '../src/lib/flutter-converter';
import { convertSvgToSwiftUi } from '../src/lib/swiftui-converter';
import { convertSvgToAndroidVector } from '../src/lib/android-converter';
import { formatBytes, calculateSavings } from '../src/lib/format-utils';

describe('Multi-Platform Converters & Format Utils', () => {
  const sampleSvg = '<svg width="24" height="24" viewBox="0 0 24 24"><path d="M12 2L2 19.5h20L12 2z" fill="#ff0000"/></svg>';

  describe('Flutter Converter', () => {
    it('should generate valid SvgPicture Flutter widget', () => {
      const res = convertSvgToFlutter(sampleSvg, { mode: 'svg-picture', widgetName: 'WarningIcon' });
      expect(res.code).toContain('class WarningIcon extends StatelessWidget');
      expect(res.code).toContain('SvgPicture.string(');
      expect(res.filename).toBe('warning_icon.dart');
    });

    it('should generate CustomPainter Flutter widget', () => {
      const res = convertSvgToFlutter(sampleSvg, { mode: 'custom-painter', widgetName: 'WarningIcon' });
      expect(res.code).toContain('class _WarningIconPainter extends CustomPainter');
      expect(res.code).toContain('canvas.drawPath(');
    });
  });

  describe('SwiftUI Converter', () => {
    it('should generate valid SwiftUI View struct', () => {
      const res = convertSvgToSwiftUi(sampleSvg, { mode: 'view', structName: 'ShieldVector' });
      expect(res.code).toContain('public struct ShieldVector: View');
      expect(res.code).toContain('Canvas { context, canvasSize in');
      expect(res.filename).toBe('ShieldVector.swift');
    });

    it('should generate SwiftUI Shape struct', () => {
      const res = convertSvgToSwiftUi(sampleSvg, { mode: 'shape', structName: 'ShieldShape' });
      expect(res.code).toContain('public struct ShieldShapeShape: Shape');
      expect(res.code).toContain('func path(in rect: CGRect) -> Path');
    });
  });

  describe('Android Vector Drawable XML Converter', () => {
    it('should generate valid Android Vector XML', () => {
      const res = convertSvgToAndroidVector(sampleSvg, { drawableName: 'ic_shield' });
      expect(res.code).toContain('<vector xmlns:android="http://schemas.android.com/apk/res/android"');
      expect(res.code).toContain('android:viewportWidth="24"');
      expect(res.code).toContain('android:viewportHeight="24"');
      expect(res.code).toContain('android:pathData="M12 2L2 19.5h20L12 2z"');
      expect(res.code).toContain('android:fillColor="#FFFF0000"');
      expect(res.filename).toBe('ic_shield.xml');
    });
  });

  describe('Format Utils', () => {
    it('should format bytes correctly', () => {
      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(1024)).toBe('1 KB');
      expect(formatBytes(18841)).toBe('18.4 KB');
      expect(formatBytes(1048576)).toBe('1 MB');
    });

    it('should calculate savings percentage accurately', () => {
      const { savedPercent, savedBytes, isSmaller } = calculateSavings(1000, 300);
      expect(savedPercent).toBe(70);
      expect(savedBytes).toBe(700);
      expect(isSmaller).toBe(true);
    });
  });
});
