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
    <>
      {/* ===== Hero ===== */}
      <section className={styles.hero}>
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
      </section>

      {/* ===== What is Digo ===== */}
      <section className={`${styles.section} ${styles.whatIsDigo}`}>
        <div className={styles.sectionInner}>
          <p className={styles.eyebrow}>What is Digo</p>
          <h2 className={styles.sectionHeading}>
            Chidigo is a Bantu language of the Mijikenda family, spoken on the
            Kenya–Tanzania coast.
          </h2>
          <div className={styles.twoColumns}>
            <div>
              <div className={styles.factLabel}>Geography</div>
              <p className={styles.bodyText}>
                South of Mombasa down to Tanga. Heartland in Kwale County, the
                village of Kinondo (home to the primary Digo kaya), and the
                coastal hinterland.
              </p>

              <div className={styles.factLabel}>Family</div>
              <p className={styles.bodyText}>
                Guthrie code <strong>E.73</strong>, North-East Coast branch.
                Sister to Giryama, Duruma, Chonyi and other Mijikenda languages.
              </p>

              <div className={styles.factLabel}>Numbers</div>
              <p className={styles.bodyText}>
                ~600,000 ethnic Digo (Kenya and Tanzania). Pan-Mijikenda: ~2.5M (2019 census).
              </p>
            </div>
            <div className={styles.culturalAnchorsCard}>
              <div className={styles.factLabel}>Cultural anchors</div>
              <p className={styles.bodyText}>
                <strong>The kayas</strong> — sacred Mijikenda forests, UNESCO
                World Heritage, with Kaya Kinondo as the primary Digo site.
              </p>
              <p className={styles.bodyText}>
                <strong>Coastal life</strong> — fishing, palm-wine tapping,
                coconut and cassava farming, mangrove and reef.
              </p>
              <p className={styles.bodyText}>
                <strong>Music</strong> — chakacha, sengenya, mwanzele.
              </p>
              <p className={styles.bodyText}>
                <strong>Dress</strong> — the{" "}
                <em lang="dig">hando</em> in white, red, blue; the kaya elder{" "}
                <em lang="dig">kitambi</em> in indigo with red bands.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== The Problem ===== */}
      <section className={`${styles.section} ${styles.theProblem}`}>
        <div className={styles.pindoMotif} />
        <div className={styles.sectionInner}>
          <p className={styles.eyebrow}>The Problem</p>
          <blockquote className={styles.pullQuote}>
            &ldquo;My parents understand Digo when their grandmother speaks.
            They reply in Swahili. My children don&rsquo;t understand at
            all.&rdquo;
          </blockquote>
          <p className={styles.bodyText}>
            This pattern — passive parents, peer-only transmission, screen lives
            in Swahili and English — is{" "}
            <strong className={styles.cliffHighlight}>a cliff</strong>, not a
            slope.
          </p>
          <p className={styles.bodyText}>
            Linguists call it the <em>missing transmission generation</em>: when
            parents stop speaking the language <em>to</em> their children, the
            language collapses in two generations even with hundreds of thousands
            of nominal speakers.
          </p>
        </div>
      </section>

      {/* ===== Our Mission ===== */}
      <section className={`${styles.section} ${styles.ourMission}`}>
        <div className={styles.sectionInner}>
          <p className={styles.eyebrow}>Our Mission</p>
          <p className={styles.missionStatement}>
            To make Chidigo a language children grow up speaking, by giving the
            Digo community the tools, content, and platforms it needs to{" "}
            <span className={styles.missionHighlight}>
              transmit, evolve, and celebrate
            </span>{" "}
            its language and culture.
          </p>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerLogo}>
            <ChidigoLogo />
          </div>
          <p className={styles.footerCopy}>
            &copy; {new Date().getFullYear()} Chi-digo
          </p>
        </div>
      </footer>
    </>
  );
}
