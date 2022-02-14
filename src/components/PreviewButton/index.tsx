import styles from './previewbutton.module.scss';
import Link from 'next/link'

export default function PreviewButton() {
  return (
    <aside className={styles.previewbutton}>
    <Link href="/api/exit-preview">
      <a>Sair do modo Preview</a>
    </Link>
  </aside>
  );
}