/**
 * Admin desk lives under `/app`. The public SAMPLE desk is the same UI under
 * `/demo` so listing stills and the marketing site can screenshot the real
 * React desk without an Admin session.
 */
import { useLocation } from "react-router";

export const ADMIN_DESK_BASE = "/app" as const;
export const PUBLIC_DEMO_BASE = "/demo" as const;

export type DeskBase = typeof ADMIN_DESK_BASE | typeof PUBLIC_DEMO_BASE;

export function deskBaseFromPathname(pathname: string): DeskBase {
  const current = pathname.replace(/\/$/, "") || "/";
  if (current === PUBLIC_DEMO_BASE || current.startsWith(`${PUBLIC_DEMO_BASE}/`)) {
    return PUBLIC_DEMO_BASE;
  }
  return ADMIN_DESK_BASE;
}

/** Map an Admin `/app/...` path onto the current desk base. */
export function withDeskBase(adminPath: string, base: DeskBase): string {
  if (base === ADMIN_DESK_BASE) return adminPath;
  if (adminPath === ADMIN_DESK_BASE || adminPath === `${ADMIN_DESK_BASE}/`) {
    return PUBLIC_DEMO_BASE;
  }
  if (adminPath.startsWith(`${ADMIN_DESK_BASE}/`)) {
    return `${PUBLIC_DEMO_BASE}/${adminPath.slice(ADMIN_DESK_BASE.length + 1)}`;
  }
  return adminPath;
}

export function useDeskBase(): DeskBase {
  try {
    const { pathname } = useLocation();
    return deskBaseFromPathname(pathname);
  } catch {
    return ADMIN_DESK_BASE;
  }
}

export function useDeskHref(): (adminPath: string) => string {
  const base = useDeskBase();
  return (adminPath: string) => withDeskBase(adminPath, base);
}
