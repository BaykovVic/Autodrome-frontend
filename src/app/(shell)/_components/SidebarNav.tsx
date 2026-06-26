"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import styles from "./SidebarNav.module.css";

export type ShellRoute = {
  href: string;
  label: string;
  icon?: ReactNode;
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

function DashboardIcon() {
  return (
    <svg
      className={styles.icon}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function CandidatesIcon() {
  return (
    <svg
      className={styles.icon}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
    </svg>
  );
}

function VehiclesIcon() {
  return (
    <svg
      className={styles.icon}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <path d="M3 13l1.6-4.2A2 2 0 0 1 6.5 7.5h11a2 2 0 0 1 1.9 1.3L21 13v5h-3v-2H6v2H3z" />
      <circle cx="7" cy="16" r="1.3" />
      <circle cx="17" cy="16" r="1.3" />
    </svg>
  );
}

function ExamsIcon() {
  return (
    <svg
      className={styles.icon}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <rect x="5" y="3.5" width="14" height="17" rx="2" />
      <path d="M9 3.5h6v3H9z" />
      <path d="M8.5 12l2 2 4-4.5" />
    </svg>
  );
}

function ExercisesIcon() {
  return (
    <svg
      className={styles.icon}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <path d="M6 20l3-14 4 1.5L10 21z" />
      <path d="M13 7.5l5 1.5-1.6 7.5" />
    </svg>
  );
}

function ViolationsIcon() {
  return (
    <svg
      className={styles.icon}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <path d="M12 4l8.5 15h-17z" />
      <path d="M12 10v4" />
      <circle cx="12" cy="16.8" r=".4" />
    </svg>
  );
}

function RulesIcon() {
  return (
    <svg
      className={styles.icon}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <path d="M5 4h9l5 5v11H5z" />
      <path d="M14 4v5h5" />
      <path d="M8 13h7M8 16.5h5" />
    </svg>
  );
}

function EvidenceIcon() {
  return (
    <svg
      className={styles.icon}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <circle cx="12" cy="12.5" r="3" />
      <path d="M8 6l1.3-2h5.4L16 6" />
    </svg>
  );
}

function DevicesIcon() {
  return (
    <svg
      className={styles.icon}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <rect x="6" y="3" width="12" height="18" rx="2" />
      <path d="M10 18.5h4" />
      <path d="M9 6.5h6" />
    </svg>
  );
}

function VirtualVehiclesIcon() {
  return (
    <svg
      className={styles.icon}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <path d="M3 13l1.6-4.2A2 2 0 0 1 6.5 7.5h11a2 2 0 0 1 1.9 1.3L21 13v5h-3v-2H6v2H3z" />
      <circle cx="7" cy="16" r="1.3" />
      <circle cx="17" cy="16" r="1.3" />
      <path d="M14 4.5l1.5 3" />
      <circle cx="16" cy="3.5" r="1.1" />
    </svg>
  );
}

function OperationsIcon() {
  return (
    <svg
      className={styles.icon}
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="6" rx="1.5" />
      <rect x="3" y="14" width="18" height="6" rx="1.5" />
      <circle cx="7" cy="7" r=".5" />
      <circle cx="7" cy="17" r=".5" />
    </svg>
  );
}

export const SHELL_NAV_GROUPS: ShellNavGroup[] = [
  {
    heading: null,
    routes: [
      { href: "/dashboard", label: "Dashboard", icon: <DashboardIcon /> },
    ],
  },
  {
    heading: "REGISTRY",
    routes: [
      { href: "/candidates", label: "Candidates", icon: <CandidatesIcon /> },
      { href: "/vehicles", label: "Vehicles", icon: <VehiclesIcon /> },
      {
        href: "/virtual-vehicles",
        label: "Virtual Vehicles",
        icon: <VirtualVehiclesIcon />,
      },
      { href: "/exams", label: "Exams", icon: <ExamsIcon /> },
    ],
  },
  {
    heading: "CONFIGURATION",
    routes: [
      { href: "/exercises", label: "Exercises", icon: <ExercisesIcon /> },
      { href: "/violations", label: "Violations", icon: <ViolationsIcon /> },
      { href: "/rules", label: "Rules", icon: <RulesIcon /> },
    ],
  },
  {
    heading: "SYSTEM",
    routes: [
      { href: "/devices", label: "Android Devices", icon: <DevicesIcon /> },
      { href: "/evidence", label: "Evidence", icon: <EvidenceIcon /> },
      { href: "/operations", label: "Operations", icon: <OperationsIcon /> },
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
            {group.routes.map(({ href, label, icon }) => {
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
                    {icon}
                    <span className={styles.label}>{label}</span>
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
