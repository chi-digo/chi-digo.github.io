'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useTranslations } from '@/lib/i18n/context';
import styles from './ContactPage.module.css';

const GOOGLE_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSdqHC_Hw3HVJ-fgSfCOok-Bh_jGraMpGI39SW3WXrjLHnRKAQ/formResponse';

const FIELD_NAME = 'entry.215204041';
const FIELD_EMAIL = 'entry.567114959';
const FIELD_MESSAGE = 'entry.1971610996';

export function ContactPage() {
  const t = useTranslations();
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');

    const form = e.currentTarget;
    const data = new FormData(form);
    const body = new URLSearchParams();
    body.append(FIELD_NAME, data.get('name') as string);
    body.append(FIELD_EMAIL, data.get('email') as string);
    body.append(FIELD_MESSAGE, data.get('message') as string);

    try {
      await fetch(GOOGLE_FORM_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });
      setStatus('success');
      form.reset();
    } catch {
      setStatus('error');
    }
  }

  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>{t.contact.eyebrow}</p>
          <h1 className={styles.heroTitle}>{t.contact.title}</h1>
        </div>
      </section>

      <section className={`${styles.section} ${styles.formSection}`}>
        <div className={styles.sectionInner}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.fieldGroup}>
              <label htmlFor="contact-name" className={styles.label}>
                {t.contact.form_name_label}
              </label>
              <input
                id="contact-name"
                name="name"
                type="text"
                required
                className={styles.input}
                placeholder={t.contact.form_name_placeholder}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="contact-email" className={styles.label}>
                {t.contact.form_email_label}
              </label>
              <input
                id="contact-email"
                name="email"
                type="email"
                required
                className={styles.input}
                placeholder={t.contact.form_email_placeholder}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label htmlFor="contact-message" className={styles.label}>
                {t.contact.form_message_label}
              </label>
              <textarea
                id="contact-message"
                name="message"
                required
                className={styles.textarea}
                placeholder={t.contact.form_message_placeholder}
              />
            </div>

            <button
              type="submit"
              className={styles.submitButton}
              disabled={status === 'sending'}
            >
              {status === 'sending' ? t.contact.form_sending : t.contact.form_submit}
            </button>

            {status === 'success' && (
              <p className={`${styles.formMessage} ${styles.formSuccess}`}>
                {t.contact.form_success}
              </p>
            )}
            {status === 'error' && (
              <p className={`${styles.formMessage} ${styles.formError}`}>
                {t.contact.form_error}
              </p>
            )}
          </form>

          <p className={styles.location}>{t.contact.location}</p>
        </div>
      </section>

      <section className={`${styles.section} ${styles.getInvolved}`}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionHeading}>{t.contact.get_involved_heading}</h2>
          <p className={styles.getInvolvedIntro}>{t.contact.get_involved_intro}</p>
          <div className={styles.roleGrid}>
            <div className={styles.roleCard}>
              <div className={styles.roleTitle}>{t.contact.role_word_title}</div>
              <p className={styles.bodyText}>{t.contact.role_word_body}</p>
            </div>
            <div className={styles.roleCard}>
              <div className={styles.roleTitle}>{t.contact.role_review_title}</div>
              <p className={styles.bodyText}>{t.contact.role_review_body}</p>
            </div>
            <div className={styles.roleCard}>
              <div className={styles.roleTitle}>{t.contact.role_proverb_title}</div>
              <p className={styles.bodyText}>{t.contact.role_proverb_body}</p>
            </div>
            <div className={styles.roleCard}>
              <div className={styles.roleTitle}>{t.contact.role_audio_title}</div>
              <p className={styles.bodyText}>{t.contact.role_audio_body}</p>
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.partners}`}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionHeading}>{t.contact.partners_heading}</h2>
          <p className={styles.bodyText}>{t.contact.partners_body}</p>
          <div className={styles.partnerLinks}>
            <Link href="/mission" className={styles.partnerLink}>{t.footer.mission_link} →</Link>
            <Link href="/vision" className={styles.partnerLink}>{t.footer.vision_link} →</Link>
          </div>
        </div>
      </section>
    </>
  );
}
