import '@testing-library/jest-dom/vitest';

// antd's popups (Popconfirm, Select, Modal) observe their trigger for resizes.
// jsdom ships no ResizeObserver, so stub one that never fires.
if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// antd components read window.matchMedia for responsive behavior, which jsdom
// does not implement.
if (!window.matchMedia) {
  window.matchMedia = query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}
