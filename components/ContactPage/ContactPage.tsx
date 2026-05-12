'use client';

import { useState, useRef, type FormEvent } from 'react';
import Link from 'next/link';
import { useTranslations } from '@/lib/i18n/context';
import { track } from '@/lib/analytics/track';
import styles from './ContactPage.module.css';

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className={styles.socialSvg}>
      <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17.5" cy="6.5" r="1.25" fill="currentColor" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className={styles.socialSvg}>
      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
    </svg>
  );
}

const SOCIAL_LINKS = [
  { platform: 'instagram', handle: '@chidigo_org', href: 'https://instagram.com/chidigo_org', Icon: InstagramIcon },
  { platform: 'facebook', handle: 'chidigo.org', href: 'https://facebook.com/chidigo.org', Icon: FacebookIcon },
] as const;

const GOOGLE_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSdqHC_Hw3HVJ-fgSfCOok-Bh_jGraMpGI39SW3WXrjLHnRKAQ/formResponse';

const FIELD_NAME = 'entry.215204041';
const FIELD_EMAIL = 'entry.567114959';
const FIELD_MESSAGE = 'entry.1971610996';

export function ContactPage() {
  const t = useTranslations();
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const formStarted = useRef(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    track('contact', 'form', 'submit');

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
      track('contact', 'form', 'submit_success');
      form.reset();
    } catch {
      setStatus('error');
      track('contact', 'form', 'submit_error');
    }
  }

  function handleFieldFocus() {
    if (!formStarted.current) {
      formStarted.current = true;
      track('contact', 'form', 'start');
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
          <form className={styles.form} onSubmit={handleSubmit} data-clarity-mask>
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
                onFocus={handleFieldFocus}
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
                onFocus={handleFieldFocus}
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
                onFocus={handleFieldFocus}
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

      <section className={`${styles.section} ${styles.findUs}`}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionHeading}>{t.social.find_us}</h2>
          <div className={styles.socialLinks}>
            {SOCIAL_LINKS.map(({ platform, handle, href, Icon }) => (
              <a
                key={platform}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
                aria-label={t.social[`${platform}_label` as keyof typeof t.social]}
                onClick={() => track('contact', 'social', 'click', { platform, href })}
              >
                <Icon />
                <span className={styles.socialPlatform}>{platform.charAt(0).toUpperCase() + platform.slice(1)}</span>
                <span className={styles.socialHandle}>{handle}</span>
              </a>
            ))}
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
