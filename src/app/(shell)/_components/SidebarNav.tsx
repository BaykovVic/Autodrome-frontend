"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./SidebarNav.module.css";

export type ShellRoute = {
  href: string;
  label: string;
};

export type ShellNavGroup = {
  /**
   * Section heading shown above the group. Use `null` for the
   * top-level (ungrouped) section — Dashboard sits there by
   * convention.
   */
  heading: string | null;
  routes: ShellRoute[];
};

export const SHELL_NAV_GROUPS: ShellNavGroup[] = [
  {
    heading: null,
    routes: [{ href: "/dashboard", label: "Dashboard" }],
  },
  {
    heading: "REGISTRY",
    routes: [
      { href: "/candidates", label: "Candidates" },
      { href: "/vehicles", label: "Vehicles" },
      { href: "/exams", label: "Exams" },
    ],
  },
  {
    heading: "CONFIGURATION",
    routes: [
      { href: "/exercises", label: "Exercises" },
      { href: "/violations", label: "Violations" },
      { href: "/rules", label: "Rules" },
    ],
  },
  {
    heading: "SYSTEM",
    routes: [
      { href: "/evidence", label: "Evidence" },
      { href: "/operations", label: "Operations" },
    ],
  },
];

/**
 * Flat list of every shell route. Kept for tests and consumers
 * that need the full set without the grouping.
 */
export const SHELL_ROUTES: ShellRoute[] = SHELL_NAV_GROUPS.flatMap(
  (group) => group.routes,
);

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label="Primary">
      {SHELL_NAV_GROUPS.map((group, groupIndex) => (
        <div
          key={group.heading ?? `group-${groupIndex}`}
          className={styles.group}
        >
          {group.heading ? (
            <div className={styles.groupHeading}>{group.heading}</div>
          ) : null}
          <ul className={styles.list}>
            {group.routes.map(({ href, label }) => {
              const isActive =
                pathname === href || pathname.startsWith(`${href}/`);
              const className = isActive
                ? `${styles.link} ${styles.linkActive}`
                : styles.link;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={className}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
