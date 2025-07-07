// src/react-props-debugger.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';

interface DebugInfo {
  componentName: string;
  props: any;
  fiber: any;
  element: HTMLElement;
}

interface RenderMetrics {
  renderCount: number;
  lastRenderTime: number;
  totalRenderTime: number;
}

export class PropsDebugger {
  private longPressTimer: NodeJS.Timeout | null = null;
  private debugInfo = new WeakMap<HTMLElement, DebugInfo>();
  private renderMetrics = new WeakMap<any, RenderMetrics>();
  private popupRoot: ReactDOM.Root | null = null;
  private popupContainer: HTMLDivElement | null = null;
  private startPos = { x: 0, y: 0 };
  private moved = false;
  private isPopupOpen = false;
  private shouldPreventNextClick = false;

  constructor() {
    console.log('🔍 React Props Debugger initializing...');
    this.injectFiberWalker();
    this.setupEventListeners();
    this.createPopupContainer();
    console.log(
      '✅ React Props Debugger ready! Long-press any component to see its props.'
    );
  }

  private injectFiberWalker() {
    // Hook into React's render cycle
    const originalRender = ReactDOM.createRoot;

    ReactDOM.createRoot = (
      container: Element | DocumentFragment,
      options?: any
    ) => {
      const root = originalRender.call(ReactDOM, container, options);
      const originalRootRender = root.render;

      root.render = (children: React.ReactNode) => {
        // Wrap children to track fiber nodes
        const wrapped = React.createElement(React.Fragment, null, children);

        // Inject fiber tracking after mount
        setTimeout(() => this.walkFiberTree(), 100);

        return originalRootRender.call(root, wrapped);
      };

      return root;
    };

    // Re-walk fiber tree periodically to catch dynamic updates
    setInterval(() => this.walkFiberTree(), 2000);
  }

  private walkFiberTree() {
    const root = document.getElementById('root');
    if (!root) return;

    // Find React's internal fiber root
    const fiberRoot = this.findFiberRoot(root);
    if (!fiberRoot) return;

    this.traverseFiber(fiberRoot);
  }

  private findFiberRoot(element: Element): any {
    const key = Object.keys(element).find(
      (key) =>
        key.startsWith('__reactContainer$') ||
        key.startsWith('__reactFiber$') ||
        key.startsWith('_reactRootContainer')
    );

    if (key) {
      const container = (element as any)[key];
      return (
        container?._internalRoot?.current || container?.current || container
      );
    }

    return null;
  }

  private traverseFiber(fiber: any) {
    if (!fiber) return;

    try {
      // Track render metrics
      if (fiber.type && typeof fiber.type === 'function') {
        const currentMetrics = this.renderMetrics.get(fiber.type) || {
          renderCount: 0,
          lastRenderTime: 0,
          totalRenderTime: 0,
        };

        currentMetrics.renderCount++;
        currentMetrics.lastRenderTime = Date.now();

        this.renderMetrics.set(fiber.type, currentMetrics);
      }

      // Process current fiber
      if (fiber.stateNode && fiber.stateNode instanceof HTMLElement) {
        const element = fiber.stateNode;
        const componentName = this.getComponentName(fiber);

        if (componentName && componentName !== 'Unknown') {
          this.debugInfo.set(element, {
            componentName,
            props: fiber.memoizedProps || {},
            fiber,
            element,
          });
        }
      }

      // Traverse children
      if (fiber.child) {
        this.traverseFiber(fiber.child);
      }

      // Traverse siblings
      if (fiber.sibling) {
        this.traverseFiber(fiber.sibling);
      }
    } catch (e) {
      // Silently ignore errors in fiber traversal
    }
  }

  private getComponentName(fiber: any): string {
    const type = fiber.type || fiber.elementType;

    if (!type) return 'Unknown';
    if (typeof type === 'string') return type;
    if (type.displayName) return type.displayName;
    if (type.name) return type.name;

    // Try to get name from the return type
    if (fiber.return) {
      const parentType = fiber.return.type || fiber.return.elementType;
      if (parentType && parentType.name) {
        return `${parentType.name} > Component`;
      }
    }

    return 'Component';
  }

  private getComponentPath(fiber: any): string[] {
    const path: string[] = [];
    let current = fiber;

    while (current) {
      const name = this.getComponentName(current);
      if (name && name !== 'Unknown') {
        path.unshift(name);
      }
      current = current.return;
    }

    return path;
  }

  private setupEventListeners() {
    // Touch events
    document.addEventListener('touchstart', this.handleTouchStart.bind(this), {
      passive: false,
    });
    document.addEventListener('touchend', this.handleTouchEnd.bind(this), {
      passive: false,
    });
    document.addEventListener('touchmove', this.handleTouchMove.bind(this), {
      passive: false,
    });

    // Mouse events
    document.addEventListener('mousedown', this.handleMouseDown.bind(this), {
      passive: false,
    });
    document.addEventListener('mouseup', this.handleMouseUp.bind(this), {
      passive: false,
    });
    document.addEventListener('mousemove', this.handleMouseMove.bind(this), {
      passive: false,
    });

    // Click event for closing popup
    document.addEventListener(
      'click',
      this.handleDocumentClick.bind(this),
      true
    );

    // Prevent context menu during long press
    document.addEventListener('contextmenu', this.handleContextMenu.bind(this));
  }

  private createPopupContainer() {
    this.popupContainer = document.createElement('div');
    this.popupContainer.id = 'react-props-debugger-popup';
    document.body.appendChild(this.popupContainer);
    this.popupRoot = ReactDOM.createRoot(this.popupContainer);
  }

  private handleTouchStart(e: TouchEvent) {
    if (this.isPopupOpen) return;

    this.startPos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    this.moved = false;
    this.startLongPress(
      e.target as HTMLElement,
      e.touches[0].clientX,
      e.touches[0].clientY
    );
  }

  private handleMouseDown(e: MouseEvent) {
    if (this.isPopupOpen) return;

    if (e.button === 0) {
      // Left click only
      this.startPos = { x: e.clientX, y: e.clientY };
      this.moved = false;
      this.startLongPress(e.target as HTMLElement, e.clientX, e.clientY);
    }
  }

  private handleTouchMove(e: TouchEvent) {
    const moveThreshold = 10;
    const dx = Math.abs(e.touches[0].clientX - this.startPos.x);
    const dy = Math.abs(e.touches[0].clientY - this.startPos.y);

    if (dx > moveThreshold || dy > moveThreshold) {
      this.moved = true;
      this.cancelLongPress();
    }
  }

  private handleMouseMove(e: MouseEvent) {
    if (this.longPressTimer) {
      const moveThreshold = 10;
      const dx = Math.abs(e.clientX - this.startPos.x);
      const dy = Math.abs(e.clientY - this.startPos.y);

      if (dx > moveThreshold || dy > moveThreshold) {
        this.moved = true;
        this.cancelLongPress();
      }
    }
  }

  private handleTouchEnd(e: TouchEvent) {
    if (this.longPressTimer) {
      this.cancelLongPress();
    }

    // Prevent the next click if we just showed the popup
    if (this.shouldPreventNextClick) {
      e.preventDefault();
      this.shouldPreventNextClick = false;
    }
  }

  private handleMouseUp(e: MouseEvent) {
    if (this.longPressTimer) {
      this.cancelLongPress();
    }
  }

  private handleDocumentClick(e: MouseEvent) {
    // Prevent the click that triggered the long press from closing the popup
    if (this.shouldPreventNextClick) {
      e.stopPropagation();
      e.preventDefault();
      this.shouldPreventNextClick = false;
      return;
    }

    // Close popup if clicking outside
    if (this.isPopupOpen) {
      const popup = document.querySelector('#debug-popup');
      if (popup && !popup.contains(e.target as Node)) {
        this.hidePopup();
      }
    }
  }

  private handleContextMenu(e: Event) {
    if (this.longPressTimer && !this.moved) {
      e.preventDefault();
    }
  }

  private startLongPress(target: HTMLElement, x: number, y: number) {
    this.cancelLongPress();

    this.longPressTimer = setTimeout(() => {
      if (!this.moved) {
        // Re-walk fiber tree to ensure we have latest data
        this.walkFiberTree();

        const debugData = this.findDebugInfo(target);
        if (debugData) {
          console.log('🔍 Debug info found for:', debugData.componentName);
          this.showPopup(debugData, x, y);
          this.shouldPreventNextClick = true;
        } else {
          console.log('⚠️ No debug info found for element:', target);
        }
      }
    }, 500);
  }

  private cancelLongPress() {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  private findDebugInfo(target: HTMLElement): DebugInfo | null {
    let current: HTMLElement | null = target;

    while (current) {
      const info = this.debugInfo.get(current);
      if (info) return info;
      current = current.parentElement;
    }

    return null;
  }

  private showPopup(info: DebugInfo, x: number, y: number) {
    if (!this.popupRoot) return;

    this.isPopupOpen = true;

    const Popup = () => {
      const [position, setPosition] = React.useState({ x, y });
      const [activeTab, setActiveTab] = React.useState<
        'props' | 'dom' | 'perf'
      >('props');

      React.useEffect(() => {
        const rect = document
          .querySelector('#debug-popup')
          ?.getBoundingClientRect();
        if (rect) {
          const newX = Math.min(x, window.innerWidth - rect.width - 10);
          const newY = Math.min(y, window.innerHeight - rect.height - 10);
          setPosition({ x: Math.max(10, newX), y: Math.max(10, newY) });
        }
      }, []);

      const componentPath = this.getComponentPath(info.fiber);
      const parentComponent = componentPath[componentPath.length - 2] || 'Root';
      const metrics =
        info.fiber.type && this.renderMetrics.get(info.fiber.type);

      // Get DOM metrics
      const rect = info.element.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(info.element);

      return (
        <div
          id="debug-popup"
          style={{
            position: 'fixed',
            left: position.x,
            top: position.y,
            backgroundColor: '#1a1a1a',
            color: '#fff',
            padding: '0',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            width: '420px',
            maxHeight: '600px',
            overflow: 'hidden',
            zIndex: 999999,
            fontFamily: 'monospace',
            fontSize: '12px',
            border: '1px solid #333',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #333',
              background: '#262626',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#4ade80',
                }}
              >
                🔍 {info.componentName}
              </h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  this.hidePopup();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#888',
                  cursor: 'pointer',
                  fontSize: '18px',
                  padding: '0 4px',
                  lineHeight: 1,
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#888')}
              >
                ✕
              </button>
            </div>
            <div style={{ marginTop: '4px', fontSize: '11px', color: '#888' }}>
              Parent:{' '}
              <span style={{ color: '#60a5fa' }}>{parentComponent}</span>
            </div>
            {componentPath.length > 1 && (
              <div
                style={{ marginTop: '2px', fontSize: '10px', color: '#666' }}
              >
                Path: {componentPath.slice(0, -1).join(' > ')}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid #333',
              background: '#1f1f1f',
            }}
          >
            {(['props', 'dom', 'perf'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: '8px',
                  background: activeTab === tab ? '#262626' : 'transparent',
                  border: 'none',
                  color: activeTab === tab ? '#4ade80' : '#888',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: activeTab === tab ? 'bold' : 'normal',
                  transition: 'all 0.2s',
                }}
              >
                {tab === 'props' && '📦 Props'}
                {tab === 'dom' && '🎨 DOM'}
                {tab === 'perf' && '⚡ Performance'}
              </button>
            ))}
          </div>

          {/* Content */}
          <div
            style={{ padding: '16px', maxHeight: '400px', overflow: 'auto' }}
          >
            {activeTab === 'props' && (
              <pre
                style={{
                  margin: 0,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  lineHeight: 1.5,
                }}
              >
                {JSON.stringify(
                  info.props,
                  (key, value) => {
                    if (typeof value === 'function') {
                      return `[Function: ${value.name || 'anonymous'}]`;
                    }
                    if (value instanceof HTMLElement) {
                      return `[HTMLElement: ${value.tagName}]`;
                    }
                    if (React.isValidElement(value)) {
                      return `[React.Element: ${value.type}]`;
                    }
                    return value;
                  },
                  2
                )}
              </pre>
            )}

            {activeTab === 'dom' && (
              <div style={{ lineHeight: 1.8 }}>
                <div>
                  <strong style={{ color: '#60a5fa' }}>Element:</strong>{' '}
                  {info.element.tagName.toLowerCase()}
                </div>
                <div>
                  <strong style={{ color: '#60a5fa' }}>Classes:</strong>{' '}
                  {info.element.className || '(none)'}
                </div>
                <div>
                  <strong style={{ color: '#60a5fa' }}>ID:</strong>{' '}
                  {info.element.id || '(none)'}
                </div>
                <hr
                  style={{
                    border: 'none',
                    borderTop: '1px solid #333',
                    margin: '12px 0',
                  }}
                />
                <div>
                  <strong style={{ color: '#60a5fa' }}>Position:</strong>{' '}
                  {Math.round(rect.left)}x, {Math.round(rect.top)}y
                </div>
                <div>
                  <strong style={{ color: '#60a5fa' }}>Size:</strong>{' '}
                  {Math.round(rect.width)}w × {Math.round(rect.height)}h
                </div>
                <div>
                  <strong style={{ color: '#60a5fa' }}>Display:</strong>{' '}
                  {computedStyle.display}
                </div>
                <div>
                  <strong style={{ color: '#60a5fa' }}>Z-Index:</strong>{' '}
                  {computedStyle.zIndex || 'auto'}
                </div>
                <hr
                  style={{
                    border: 'none',
                    borderTop: '1px solid #333',
                    margin: '12px 0',
                  }}
                />
                <div>
                  <strong style={{ color: '#60a5fa' }}>Margin:</strong>{' '}
                  {computedStyle.margin}
                </div>
                <div>
                  <strong style={{ color: '#60a5fa' }}>Padding:</strong>{' '}
                  {computedStyle.padding}
                </div>
                <div>
                  <strong style={{ color: '#60a5fa' }}>Border:</strong>{' '}
                  {computedStyle.border}
                </div>
              </div>
            )}

            {activeTab === 'perf' && (
              <div style={{ lineHeight: 1.8 }}>
                {metrics ? (
                  <>
                    <div>
                      <strong style={{ color: '#60a5fa' }}>
                        Render Count:
                      </strong>{' '}
                      {metrics.renderCount}
                    </div>
                    <div>
                      <strong style={{ color: '#60a5fa' }}>Last Render:</strong>{' '}
                      {new Date(metrics.lastRenderTime).toLocaleTimeString()}
                    </div>
                  </>
                ) : (
                  <div style={{ color: '#888' }}>
                    No performance metrics available for this element
                  </div>
                )}
                <hr
                  style={{
                    border: 'none',
                    borderTop: '1px solid #333',
                    margin: '12px 0',
                  }}
                />
                <div>
                  <strong style={{ color: '#60a5fa' }}>Fiber Type:</strong>{' '}
                  {info.fiber.tag}
                </div>
                <div>
                  <strong style={{ color: '#60a5fa' }}>Has State:</strong>{' '}
                  {info.fiber.memoizedState ? 'Yes' : 'No'}
                </div>
                <div>
                  <strong style={{ color: '#60a5fa' }}>Has Hooks:</strong>{' '}
                  {info.fiber.hooks ? 'Yes' : 'No'}
                </div>
                <div>
                  <strong style={{ color: '#60a5fa' }}>Key:</strong>{' '}
                  {info.fiber.key || '(none)'}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    };

    this.popupRoot.render(<Popup />);
  }

  private hidePopup() {
    if (this.popupRoot) {
      this.popupRoot.render(<></>);
      this.isPopupOpen = false;
    }
  }
}

// // Auto-initialize when imported
// if (process.env.NODE_ENV === 'development' || import.meta.env?.DEV) {
//   // Wait for React to be ready
//   if (document.readyState === 'loading') {
//     document.addEventListener('DOMContentLoaded', () => new PropsDebugger());
//   } else {
//     setTimeout(() => new PropsDebugger(), 0);
//   }
// }
