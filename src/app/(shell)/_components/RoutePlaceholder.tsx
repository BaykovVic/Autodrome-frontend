import styles from "./RoutePlaceholder.module.css";

type Props = {
  title: string;
  hint: string;
};

export function RoutePlaceholder({ title, hint }: Props) {
  return (
    <section className={styles.placeholder}>
      <h1 className={styles.heading}>{title}</h1>
      <p className={styles.hint}>{hint}</p>
      <p className={styles.status}>placeholder</p>
    </section>
  );
}
