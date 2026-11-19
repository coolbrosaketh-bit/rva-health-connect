/**
 * A tiny observable store. Components subscribe and re-render from state;
 * nothing mutates the DOM from another component's state directly.
 */
export function createStore(initial) {
  let state = initial;
  const listeners = new Set();
  return {
    get: () => state,
    set(patch) {
      const prev = state;
      state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) };
      const changed = new Set(Object.keys(state).filter((k) => state[k] !== prev[k]));
      if (changed.size) listeners.forEach((fn) => fn(state, prev, changed));
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}
