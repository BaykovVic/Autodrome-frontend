import { ConsoleSidebarFooter } from "./_components/ConsoleSidebarFooter";
import { SidebarNav } from "./_components/SidebarNav";
import { SessionGate } from "./_session/SessionGate";
import { SessionProvider } from "./_session/SessionProvider";
import { SessionTopbar } from "./_session/SessionTopbar";
import styles from "./layout.module.css";

export default function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <div className={styles.shell}>
        <SessionTopbar />
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
        <main className={styles.content}>
          <SessionGate>{children}</SessionGate>
        </main>
      </div>
    </SessionProvider>
  );
}
