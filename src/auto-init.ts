// src/auto-init.ts
import { PropsDebugger } from './react-props-debugger';

console.log('[react-props-debugger] Auto-init script running');
console.log('[react-props-debugger] Environment:', {
  nodeEnv: process?.env?.NODE_ENV,
  isDev: process?.env?.NODE_ENV === 'development',
  hasWindow: typeof window !== 'undefined',
  hasDocument: typeof document !== 'undefined',
});

// Auto-initialize in development
const isDev = process?.env?.NODE_ENV === 'development';

if (isDev && typeof window !== 'undefined' && typeof document !== 'undefined') {
  console.log(
    '[react-props-debugger] Development mode detected, initializing...'
  );

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('[react-props-debugger] DOM loaded, creating instance');
      new PropsDebugger();
    });
  } else {
    setTimeout(() => {
      console.log('[react-props-debugger] Creating instance immediately');
      new PropsDebugger();
    }, 0);
  }
} else {
  console.log('[react-props-debugger] Skipping initialization:', {
    isDev,
    hasWindow: typeof window !== 'undefined',
    hasDocument: typeof document !== 'undefined',
  });
}
