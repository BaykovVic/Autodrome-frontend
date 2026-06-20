import { Button, StatusBadge } from "@/components";
import type { Candidate } from "./useCandidatesData";
import styles from "./CandidateDetail.module.css";

type Props = {
  candidate: Candidate;
  onClose: () => void;
};

export function CandidateDetail({ candidate, onClose }: Props) {
  return (
    <aside
      className={styles.panel}
      aria-label={`Candidate ${candidate.firstName} ${candidate.lastName}`}
    >
      <header className={styles.header}>
        <div>
          <h3 className={styles.heading}>
            {candidate.lastName} {candidate.firstName}
            {candidate.middleName ? ` ${candidate.middleName}` : ""}
          </h3>
          <p className={styles.subtitle}>
            <span className={styles.mono}>{candidate.candidateId}</span>
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close detail">
          Close
        </Button>
      </header>

      <dl className={styles.list}>
        <Row label="Status">
          <StatusBadge>{candidate.status}</StatusBadge>
        </Row>
        <Row label="Birth date">
          <span className={styles.mono}>{candidate.birthDate}</span>
        </Row>
        <Row label="Document">
          <span className={styles.mono}>
            {candidate.identityDocument.documentType} ·{" "}
            {candidate.identityDocument.documentNumber}
          </span>
        </Row>
        {candidate.identityDocument.issuedOn ? (
          <Row label="Issued on">
            <span className={styles.mono}>
              {candidate.identityDocument.issuedOn}
            </span>
          </Row>
        ) : null}
        {candidate.identityDocument.expiresOn ? (
          <Row label="Expires on">
            <span className={styles.mono}>
              {candidate.identityDocument.expiresOn}
            </span>
          </Row>
        ) : null}
        {candidate.externalRegistryId ? (
          <Row label="External id">
            <span className={styles.mono}>
              {candidate.externalRegistryId}
            </span>
          </Row>
        ) : null}
        <Row label="Created at">
          <span className={styles.mono}>{candidate.createdAt}</span>
        </Row>
      </dl>
    </aside>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.row}>
      <dt className={styles.label}>{label}</dt>
      <dd className={styles.value}>{children}</dd>
    </div>
  );
}
