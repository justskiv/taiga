/* localStorage wrappers that never throw (private mode, quota, etc). */
export function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
export function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
