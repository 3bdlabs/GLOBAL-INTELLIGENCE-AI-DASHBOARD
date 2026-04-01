
(function() {
  /**
   * Robust polyfill for ESBuild/TypeScript class fields helper.
   * Prevents "__publicField is not defined" errors when browsers or 
   * transpilers disagree on class field handling.
   */
  var poly = function(obj, key, value) {
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
  window.__publicField = poly;
  if (typeof globalThis !== 'undefined') {
    globalThis.__publicField = poly;
  }
  
  // Also handle some other common helpers if they appear
  window.__name = window.__name || function(target, value) {
    Object.defineProperty(target, 'name', { value: value, configurable: true });
    return target;
  };
})();
