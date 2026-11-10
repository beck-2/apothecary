let timer: ReturnType<typeof setTimeout> | undefined;
export function toast(message: string, kind: 'ok' | 'error' = 'ok', ms = 3500) {
  const el = document.querySelector<HTMLElement>('.toast');
  if (!el) return;
  el.textContent = message;
  el.classList.toggle('error', kind === 'error');
  el.classList.add('show');
  clearTimeout(timer);
  timer = setTimeout(() => el.classList.remove('show'), ms);
}
