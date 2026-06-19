import { StatusBadge } from "@/components";
import { SidebarNav } from "./_components/SidebarNav";
import styles from "./layout.module.css";

export default function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.shell}>
      <aside className={styles.aside} aria-label="Shell sidebar">
        <div className={styles.brand}>Autodrome</div>
        <SidebarNav />
        <div className={styles.asideFooter}>operator / admin</div>
      </aside>
      <div className={styles.column}>
        <header className={styles.topbar}>
          <div className={styles.topbarTitle}>Operator console</div>
          <StatusBadge variant="neutral" aria-label="Build status">
            skeleton
          </StatusBadge>
        </header>
        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
