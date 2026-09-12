import { Link, useLocation } from "react-router";

const LINKS = [
  { href: "/app/spend", label: "Desk" },
  { href: "/app/allocation", label: "Allocation" },
  { href: "/app/advanced", label: "Advanced" },
] as const;

export function MarketingSpendNav() {
  const { pathname } = useLocation();

  return (
    <nav className="mcfly-depth-subnav" aria-label="Marketing spend sections">
      <ul className="mcfly-depth-subnav__list">
        {LINKS.map((link) => {
          const active =
            pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <li key={link.href}>
              <Link
                to={link.href}
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
