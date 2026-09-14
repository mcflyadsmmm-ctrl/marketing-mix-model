import { Link, useLocation } from "react-router";

/**
 * Shared depth subnav chrome — same pattern as MarketingSpendNav.
 * Keeps period query when hopping Sales ↔ Days ↔ Orders (etc.).
 */
export function DeskDepthSubnav({
  label,
  links,
}: {
  label: string;
  links: readonly { href: string; label: string }[];
}) {
  const { pathname, search } = useLocation();

  return (
    <nav className="mcfly-depth-subnav" aria-label={label}>
      <ul className="mcfly-depth-subnav__list">
        {links.map((link) => {
          const active =
            pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <li key={link.href}>
              <Link
                to={`${link.href}${search}`}
                className={
                  active
                    ? "mcfly-depth-subnav__link mcfly-depth-subnav__link--active"
                    : "mcfly-depth-subnav__link"
                }
                aria-current={active ? "page" : undefined}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
