import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import './dropdown-menu.css';

const DropdownMenuContext = createContext(null);

export function DropdownMenu({ children, open: controlledOpen, onOpenChange }) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const contentRef = useRef(null);

  const setOpen = useCallback((value) => {
    if (!isControlled) {
      setUncontrolledOpen(value);
    }
    onOpenChange?.(value);
  }, [isControlled, onOpenChange]);

  const toggle = useCallback(() => setOpen(!open), [open, setOpen]);
  const close = useCallback(() => setOpen(false), [setOpen]);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (e) => {
      const inTrigger = containerRef.current && containerRef.current.contains(e.target);
      const inContent = contentRef.current && contentRef.current.contains(e.target);
      if (!inTrigger && !inContent) {
        close();
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        close();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, close]);

  return (
    <DropdownMenuContext.Provider
      value={{
        open,
        setOpen,
        toggle,
        close,
        triggerRef,
        contentRef,
        containerRef,
      }}
    >
      <div className="ui-dropdown-container" ref={containerRef}>
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
}

export function DropdownMenuTrigger({
  children,
  render,
  className = '',
  asChild = false,
  ...props
}) {
  const { open, toggle, triggerRef } = useContext(DropdownMenuContext);

  if (React.isValidElement(render)) {
    return React.cloneElement(render, {
      ref: (node) => {
        triggerRef.current = node;
        const origRef = render.ref;
        if (typeof origRef === 'function') origRef(node);
        else if (origRef && typeof origRef === 'object') origRef.current = node;
      },
      onClick: (e) => {
        render.props.onClick?.(e);
        toggle();
      },
      'aria-expanded': open,
      'aria-haspopup': 'menu',
      className: `${render.props.className || ''} ${className}`.trim(),
      children: children !== undefined ? children : render.props.children,
      ...props,
    });
  }

  return (
    <button
      ref={triggerRef}
      type="button"
      className={`ui-dropdown-trigger ${className}`.trim()}
      onClick={toggle}
      aria-expanded={open}
      aria-haspopup="menu"
      {...props}
    >
      {children}
    </button>
  );
}

export function DropdownMenuContent({
  children,
  className = '',
  align = 'end',
  side = 'top',
  sideOffset = 8,
  style = {},
  ...props
}) {
  const { open, triggerRef, contentRef, containerRef } = useContext(DropdownMenuContext);
  const [coords, setCoords] = useState({ top: -9999, left: -9999, visible: false });

  useLayoutEffect(() => {
    if (!open) return;

    const computePosition = () => {
      const triggerEl =
        triggerRef.current ||
        containerRef.current?.querySelector('button') ||
        containerRef.current;
      const contentEl = contentRef.current;
      if (!triggerEl || !contentEl) return;

      const triggerRect = triggerEl.getBoundingClientRect();
      const contentRect = contentEl.getBoundingClientRect();
      const contentWidth = contentEl.offsetWidth || contentRect.width || 216;
      const contentHeight = contentEl.offsetHeight || contentRect.height || 210;
      const viewportPadding = 12;

      let top = 0;
      let left = 0;

      // Check if trigger is inside a sidebar
      const sidebarEl = triggerEl.closest('.sidebar');
      const sidebarRect = sidebarEl ? sidebarEl.getBoundingClientRect() : null;

      // ── 1. Vertical Positioning (side) ──────────────────────────
      if (side === 'top') {
        top = triggerRect.top - contentHeight - sideOffset;
        // Flip to bottom if it overflows top of screen
        if (
          top < viewportPadding &&
          triggerRect.bottom + contentHeight + sideOffset <= window.innerHeight - viewportPadding
        ) {
          top = triggerRect.bottom + sideOffset;
        }
      } else if (side === 'bottom') {
        top = triggerRect.bottom + sideOffset;
        // Flip to top if it overflows bottom of screen
        if (
          top + contentHeight > window.innerHeight - viewportPadding &&
          triggerRect.top - contentHeight - sideOffset >= viewportPadding
        ) {
          top = triggerRect.top - contentHeight - sideOffset;
        }
      } else if (side === 'right') {
        top = triggerRect.top;
        left = triggerRect.right + sideOffset;
      } else if (side === 'left') {
        top = triggerRect.top;
        left = triggerRect.left - contentWidth - sideOffset;
      }

      // ── 2. Horizontal Alignment & Collision Awareness ───────────
      if (side === 'top' || side === 'bottom') {
        if (align === 'end') {
          left = triggerRect.right - contentWidth;
        } else if (align === 'start') {
          left = triggerRect.left;
        } else {
          // center
          left = triggerRect.left + (triggerRect.width - contentWidth) / 2;
        }

        // VIEWPORT & SIDEBAR FULL-VISIBILITY AWARENESS:
        // When full visibility misses on the left (e.g. left edge is cut off by the screen),
        // or if inside a sidebar where width is cramped or narrow:
        const missesLeftVisibility = left < viewportPadding;
        const crampedInSidebar = sidebarRect && (sidebarRect.width < contentWidth + 24 || left < sidebarRect.left + viewportPadding);

        if (missesLeftVisibility || crampedInSidebar) {
          if (sidebarRect) {
            // Anchor neatly to the right side of the sidebar into the main canvas
            left = sidebarRect.right + sideOffset;
            // Vertically align bottom edge with the trigger bar
            top = triggerRect.bottom - contentHeight;
          } else {
            left = triggerRect.right + sideOffset;
          }

          // If appearing to the right overflows the screen right edge, clamp:
          if (left + contentWidth > window.innerWidth - viewportPadding) {
            left = Math.max(viewportPadding, window.innerWidth - contentWidth - viewportPadding);
          }
        }

        // Check right edge overflow
        if (left + contentWidth > window.innerWidth - viewportPadding) {
          left = Math.max(viewportPadding, window.innerWidth - contentWidth - viewportPadding);
        }
      }

      // Final viewport boundary clamps (stays 100% inside screen bounds)
      left = Math.max(viewportPadding, Math.min(left, window.innerWidth - contentWidth - viewportPadding));
      top = Math.max(viewportPadding, Math.min(top, window.innerHeight - contentHeight - viewportPadding));

      setCoords({
        top: Math.round(top),
        left: Math.round(left),
        visible: true,
      });
    };

    computePosition();

    window.addEventListener('resize', computePosition);
    window.addEventListener('scroll', computePosition, true);

    // Live ResizeObserver: auto-tracks sidebar width dragging in real time
    let resizeObserver = null;
    const triggerEl = triggerRef.current || containerRef.current;
    const sidebarEl = triggerEl?.closest('.sidebar');
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        computePosition();
      });
      if (sidebarEl) resizeObserver.observe(sidebarEl);
      if (triggerEl) resizeObserver.observe(triggerEl);
    }

    return () => {
      window.removeEventListener('resize', computePosition);
      window.removeEventListener('scroll', computePosition, true);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [open, side, align, sideOffset, triggerRef, contentRef, containerRef]);

  if (!open) return null;

  const contentElement = (
    <div
      ref={contentRef}
      role="menu"
      className={`ui-dropdown-content ${className}`.trim()}
      style={{
        ...style,
        position: 'fixed',
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        opacity: coords.visible ? 1 : 0,
        pointerEvents: coords.visible ? 'auto' : 'none',
        zIndex: 2147483647,
      }}
      {...props}
    >
      {children}
    </div>
  );

  // Render via createPortal to document.body so it is NEVER under any container, box, or stacking context
  return typeof document !== 'undefined'
    ? createPortal(contentElement, document.body)
    : contentElement;
}

export function DropdownMenuGroup({ children, className = '' }) {
  return (
    <div className={`ui-dropdown-group ${className}`.trim()}>
      {children}
    </div>
  );
}

export function DropdownMenuLabel({ children, className = '' }) {
  return (
    <div className={`ui-dropdown-label ${className}`.trim()}>
      {children}
    </div>
  );
}

export function DropdownMenuItem({
  children,
  onClick,
  disabled = false,
  variant = 'default',
  className = '',
  ...props
}) {
  const { close } = useContext(DropdownMenuContext);

  const handleClick = (e) => {
    if (disabled) return;
    onClick?.(e);
    close();
  };

  return (
    <div
      role="menuitem"
      tabIndex={disabled ? -1 : 0}
      className={`ui-dropdown-item ui-dropdown-item-${variant} ${disabled ? 'is-disabled' : ''} ${className}`.trim()}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick(e);
        }
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function DropdownMenuSeparator({ className = '' }) {
  return <div className={`ui-dropdown-separator ${className}`.trim()} />;
}
