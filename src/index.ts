// src/index.ts
export { PropsDebugger } from './react-props-debugger';
console.log('[react-props-debugger] Module loaded');

// Manual init for users who have issues with auto-init
export function initReactPropsDebugger() {
  import('./react-props-debugger').then(({ PropsDebugger }) => {
    new PropsDebugger();
  });
}

// Try auto-init
try {
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const script = document.createElement('script');
    script.textContent = `
      if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
        console.log('[react-props-debugger] Will initialize after imports');
      }
    `;
    document.head.appendChild(script);

    // Use a different approach for auto-init
    Promise.resolve().then(() => {
      if (process?.env?.NODE_ENV === 'development') {
        import('./auto-init');
      }
    });
  }
} catch (e) {
  // Silently fail
}
