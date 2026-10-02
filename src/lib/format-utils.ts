/**
 * Format bytes into readable string (B, KB, MB)
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const idx = Math.min(i, sizes.length - 1);
  return `${parseFloat((bytes / Math.pow(k, idx)).toFixed(dm))} ${sizes[idx]}`;
}

/**
 * Calculate saved percentage accurately
 */
export function calculateSavings(originalBytes: number, optimizedBytes: number): {
  savedBytes: number;
  savedPercent: number;
  isSmaller: boolean;
} {
  if (originalBytes <= 0) {
    return { savedBytes: 0, savedPercent: 0, isSmaller: false };
  }
  const savedBytes = Math.max(0, originalBytes - optimizedBytes);
  const savedPercent = Math.max(0, parseFloat(((savedBytes / originalBytes) * 100).toFixed(1)));
  return {
    savedBytes,
    savedPercent,
    isSmaller: optimizedBytes < originalBytes,
  };
}

/**
 * Trigger client-side file download without any server roundtrip
 */
export function downloadFile(content: string | Blob, filename: string, mimeType = 'text/plain') {
  if (typeof window === 'undefined') return;

  const blob = typeof content === 'string' ? new Blob([content], { type: `${mimeType};charset=utf-8` }) : content;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Copy text to clipboard safely
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback below
    }
  }

  // Fallback for older browsers or restricted permissions
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  } catch {
    return false;
  }
}
