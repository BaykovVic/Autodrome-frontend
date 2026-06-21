import { ConsoleSidebarFooter } from "./_components/ConsoleSidebarFooter";
import { ConsoleTopbar } from "./_components/ConsoleTopbar";
import { SidebarNav } from "./_components/SidebarNav";
import styles from "./layout.module.css";

export default function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.shell}>
      <ConsoleTopbar />
      <aside className={styles.aside} aria-label="Shell sidebar">
        <div className={styles.navColumn}>
          <SidebarNav />
        </div>
        <ConsoleSidebarFooter
          storageLabel="588 / 1000 GB"
          storageProgress={0.59}
          buildLabel="Build 0.7.0 · offline"
          versionLabel="v0.7.0"
        />
      </aside>
      <main className={styles.content}>{children}</main>
    </div>
  );
}
