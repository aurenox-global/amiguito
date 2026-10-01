// Persistencia local del Amiguito (localStorage) + exportar/importar JSON.
const KEY = 'amiguito.save.v1';

export function save(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ v: 1, t: Date.now(), data }));
    return true;
  } catch (e) { return false; }
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && parsed.data ? parsed.data : null;
  } catch (e) { return null; }
}

export function wipe() {
  try { localStorage.removeItem(KEY); } catch (e) {}
}

export function download(data, name = 'amiguito-save.json') {
  try {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (e) {}
}

export function upload() {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = () => {
      const file = input.files && input.files[0];
      if (!file) { resolve(null); return; }
      const fr = new FileReader();
      fr.onload = () => { try { resolve(JSON.parse(fr.result)); } catch (e) { resolve(null); } };
      fr.onerror = () => resolve(null);
      fr.readAsText(file);
    };
    input.click();
  });
}
