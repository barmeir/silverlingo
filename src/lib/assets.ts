/**
 * Prepends NEXT_PUBLIC_BASE_PATH (e.g. "/silverlingo" on GitHub Pages)
 * to static public asset URLs like "/avatars/arthur.png".
 */
export function withBasePath(path: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  if (!path.startsWith("/")) return path;
  if (base && path.startsWith(base)) return path;
  return `${base}${path}`;
}
