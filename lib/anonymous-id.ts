export function getAnonymousId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('chidigo-anonymous-id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('chidigo-anonymous-id', id);
  }
  return id;
}
