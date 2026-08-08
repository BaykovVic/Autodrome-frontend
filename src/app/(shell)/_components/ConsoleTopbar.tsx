import { Button, StatusDot } from "@/components";
import styles from "./ConsoleTopbar.module.css";

/**
 * Local node identity / health cluster shown in the topbar.
 */
export type TopbarNode = {
  id: string;
  state: "online" | "degraded" | "offline";
  stateLabel?: string;
};

export type TopbarService = {
  label: string;
  state: "online" | "degraded" | "offline" | "standby" | "unknown";
};

export type TopbarOperator = {
  initials: string;
  name: string;
  role: string;
};

type Props = {
  node?: TopbarNode;
  services?: TopbarService[];
  operator?: TopbarOperator;
  /** When set, renders a Sign out action in the operator cluster. */
  onLogout?: () => void;
};

const DEFAULT_NODE: TopbarNode = {
  id: "NODE-A2",
  state: "online",
  stateLabel: "ONLINE",
};

const DEFAULT_SERVICES: TopbarService[] = [
  { label: "DB", state: "online" },
  { label: "Media", state: "online" },
  { label: "Tel", state: "degraded" },
];

const DEFAULT_OPERATOR: TopbarOperator = {
  initials: "MO",
  name: "M. Orlova",
  role: "Inspector",
};

export function ConsoleTopbar({
  node = DEFAULT_NODE,
  services = DEFAULT_SERVICES,
  operator = DEFAULT_OPERATOR,
  onLogout,
}: Props) {
  return (
    <header className={styles.topbar} aria-label="Console topbar">
      <div className={styles.left}>
        <div className={styles.brand}>
          <div className={styles.brandMark} aria-hidden="true">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
            >
              <path d="M3 17l4-8 5 3 4-7 5 6" />
            </svg>
          </div>
          <span className={styles.brandName}>AUTODROME</span>
        </div>
        <span className={styles.localChip} aria-label="Deployment scope">
          LOCAL&nbsp;NODE
        </span>
      </div>
      <div className={styles.right}>
        <div className={styles.nodeCluster}>
          <StatusDot
            variant={node.state}
            label={`Node ${node.id} ${node.stateLabel ?? node.state}`}
          />
          <span className={styles.nodeId}>{node.id}</span>
          <span className={styles.separator} aria-hidden="true">·</span>
          <span className={styles.nodeState}>
            {node.stateLabel ?? node.state.toUpperCase()}
          </span>
        </div>
        <div className={styles.servicesCluster}>
          {services.map((service) => (
            <span key={service.label} className={styles.service}>
              <span className={styles.serviceLabel}>{service.label}</span>
              <StatusDot
                variant={service.state}
                halo={false}
                label={`${service.label} ${service.state}`}
              />
            </span>
          ))}
        </div>
        <div className={styles.operator}>
          <div className={styles.operatorAvatar} aria-hidden="true">
            {operator.initials}
          </div>
          <div className={styles.operatorMeta}>
            <span className={styles.operatorName}>{operator.name}</span>
            <span className={styles.operatorRole}>{operator.role}</span>
          </div>
          {onLogout ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              aria-label="Sign out"
            >
              Sign out
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
