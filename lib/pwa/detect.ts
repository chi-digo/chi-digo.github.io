export type InstallPlatform = 'android' | 'ios-safari' | 'ios-chrome' | 'webview' | 'desktop';

export function detectPlatform(): InstallPlatform {
  if (typeof navigator === 'undefined') return 'desktop';
  const ua = navigator.userAgent;

  if (/FBAN|FBAV|Instagram|WhatsApp|Line|Snapchat/i.test(ua)) {
    return 'webview';
  }

  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  if (isIOS) {
    if (/CriOS/.test(ua)) return 'ios-chrome';
    return 'ios-safari';
  }

  if (/Android/.test(ua)) return 'android';

  return 'desktop';
}
