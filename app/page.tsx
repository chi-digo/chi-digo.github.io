import styles from "./page.module.css";

const content = {
  proverb_digo: "Mvula igodzwa na utseru.",
  proverb_gloss: "The rain is waited for with a cleared plot.",
};

function ChidigoLogo() {
  return (
    <svg
      viewBox="0 0 480 160"
      role="img"
      aria-label="Chi-digo"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform="translate(56, 20)">
        <circle cx="40" cy="16" r="14" fill="currentColor" />
        <rect
          x="22"
          y="38"
          width="36"
          height="84"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <g fill="currentColor">
          <polygon points="22,38 58,38 40,56" />
          <polygon points="22,74 58,74 40,56" />
          <polygon points="22,74 58,74 40,92" />
          <polygon points="22,110 58,110 40,92" />
          <polygon points="22,110 58,110 40,122" />
        </g>
      </g>
      <g transform="translate(160, 0)">
        <text
          x="0"
          y="100"
          fontFamily="var(--font-fraunces), Fraunces, serif"
          fontSize="76"
          fontWeight="500"
          letterSpacing="-1"
          fill="currentColor"
        >
          Chi-digo
        </text>
      </g>
    </svg>
  );
}

export default function Home() {
  return (
    <main className={styles.hero}>
      <div className={styles.bandTop} />
      <div className={styles.bandBottom} />

      <div className={styles.backgroundImage} />
      <div className={styles.gradient} />

      <div className={styles.content}>
        <h1 className={styles.title}>Chi-digo</h1>
        <p className={styles.proverb} lang="dig">
          {content.proverb_digo}
        </p>
        <p className={styles.gloss} lang="en">
          {content.proverb_gloss}
        </p>
      </div>

      <div className={styles.logo}>
        <ChidigoLogo />
      </div>
    </main>
  );
}
