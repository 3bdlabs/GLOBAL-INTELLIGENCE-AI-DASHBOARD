
/**
 * Robust polyfill for ESBuild/TypeScript class fields helper.
 * Prevents "__publicField is not defined" errors when browsers or 
 * transpilers disagree on class field handling.
 */
const poly = (obj: any, key: string | symbol, value: any) => {
  if (typeof key === 'symbol') {
    obj[key] = value;
  } else {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  }
  return value;
};

// Attach to global scopes
(window as any).__publicField = poly;
if (typeof globalThis !== 'undefined') {
  (globalThis as any).__publicField = poly;
}

// Also handle some other common helpers if they appear
(window as any).__name = (window as any).__name || function(target: any, value: string) {
  Object.defineProperty(target, 'name', { value: value, configurable: true });
  return target;
};

export {};
