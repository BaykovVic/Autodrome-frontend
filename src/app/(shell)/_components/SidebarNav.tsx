"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./SidebarNav.module.css";

export type ShellRoute = {
  href: string;
  label: string;
};

export const SHELL_ROUTES: ShellRoute[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/candidates", label: "Candidates" },
  { href: "/vehicles", label: "Vehicles" },
  { href: "/exams", label: "Exams" },
  { href: "/exercises", label: "Exercises" },
  { href: "/violations", label: "Violations" },
  { href: "/rules", label: "Rules" },
  { href: "/evidence", label: "Evidence" },
  { href: "/operations", label: "Operations" },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label="Primary">
      <ul className={styles.list}>
        {SHELL_ROUTES.map(({ href, label }) => {
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
    </nav>
  );
}
