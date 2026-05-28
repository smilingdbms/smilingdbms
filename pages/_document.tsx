// pages/_document.tsx
// ═══════════════════════════════════════════════════════
// Critical: inline script runs BEFORE React hydration
// Prevents theme flash on page load/reload
// ═══════════════════════════════════════════════════════
import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html suppressHydrationWarning>
      <Head />
      <body>
        {/*
          This inline script runs synchronously before ANY CSS or React renders.
          It reads localStorage and applies data-theme to <html> immediately.
          Result: zero flash, correct theme on first paint.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function() {
  try {
    var theme = localStorage.getItem('rbp_theme') || 'dark';
    var valid = ['dark','light','gradient','glass','neon','aurora'];
    if (valid.indexOf(theme) === -1) theme = 'dark';
    document.documentElement.setAttribute('data-theme', theme);
  } catch(e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
            `.trim(),
          }}
        />
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
