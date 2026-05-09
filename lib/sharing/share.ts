export type ShareResult = 'shared' | 'url_only' | 'downloaded' | 'cancelled';

export function canShareFiles(): boolean {
  if (!navigator.share || !navigator.canShare) return false;
  try {
    const testFile = new File([''], 'test.png', { type: 'image/png' });
    return navigator.canShare({ files: [testFile] });
  } catch {
    return false;
  }
}

export async function shareImage(
  blob: Blob,
  filename: string,
  title: string,
  text: string,
  url: string
): Promise<ShareResult> {
  const file = new File([blob], filename, { type: 'image/png' });

  if (canShareFiles()) {
    try {
      await navigator.share({ files: [file], title, text });
      return 'shared';
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled';
    }
  }

  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return 'url_only';
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled';
    }
  }

  downloadBlob(blob, filename);
  await copyToClipboard(url);
  return 'downloaded';
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function downloadBlob(blob: Blob, filename: string) {
  const a = document.createElement('a');
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
