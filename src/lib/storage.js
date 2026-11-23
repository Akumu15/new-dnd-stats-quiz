// Saves the character in this browser only (localStorage). Every access is guarded,
// because storage can be blocked (private windows, disabled site data).

const KEY = "roll-for-real:save:v1";

export function loadSave() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data !== "object" || !data.base) return null;
    return { name: "", xp: {}, history: [], ...data };
  } catch {
    return null;
  }
}

export function writeSave(save) {
  try {
    if (save) window.localStorage.setItem(KEY, JSON.stringify(save));
    else window.localStorage.removeItem(KEY);
  } catch {
    // Storage unavailable: the app still works for this visit.
  }
}
