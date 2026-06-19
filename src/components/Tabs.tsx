"use client";

import { useId, useState } from "react";
import type { ReactNode } from "react";
import styles from "./Tabs.module.css";

export type TabItem = {
  id: string;
  label: ReactNode;
  content: ReactNode;
};

type Props = {
  items: TabItem[];
  defaultActiveId?: string;
  ariaLabel: string;
};

export function Tabs({ items, defaultActiveId, ariaLabel }: Props) {
  const fallbackId = items[0]?.id ?? "";
  const [activeId, setActiveId] = useState<string>(
    defaultActiveId ?? fallbackId,
  );
  const groupId = useId();

  return (
    <div className={styles.tabs}>
      <div role="tablist" aria-label={ariaLabel} className={styles.tablist}>
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`${groupId}-tab-${item.id}`}
              aria-selected={isActive}
              aria-controls={`${groupId}-panel-${item.id}`}
              tabIndex={isActive ? 0 : -1}
              className={
                isActive
                  ? `${styles.tab} ${styles.tabActive}`
                  : styles.tab
              }
              onClick={() => setActiveId(item.id)}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {items.map((item) => {
        const isActive = item.id === activeId;
        return (
          <div
            key={item.id}
            role="tabpanel"
            id={`${groupId}-panel-${item.id}`}
            aria-labelledby={`${groupId}-tab-${item.id}`}
            hidden={!isActive}
            className={styles.panel}
          >
            {item.content}
          </div>
        );
      })}
    </div>
  );
}
