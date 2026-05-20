import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export const PrivacyPolicy = () => {
  const { t } = useTranslation('privacy');
  return (
    <div className="privacy-policy-page">
      <header className="privacy-policy-header">
        <Link to="/" className="privacy-policy-back-link">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="privacy-policy-title">{t('privacyPolicy.title')}</h1>
      </header>

      <main className="privacy-policy-container">
        <article className="privacy-policy-content">
          {/* Hero Section */}
          <div className="privacy-hero">
            <h1>{t('privacyPolicy.title')}</h1>
            <p className="privacy-tagline">{t('privacyPolicy.tagline')}</p>
            <p className="privacy-updated">{t('privacyPolicy.lastUpdated')}</p>
          </div>

          {/* Quick Summary */}
          <section className="privacy-summary">
            <h2>{t('privacyPolicy.shortVersion')}</h2>
            <p>{t('privacyPolicy.shortVersionText')}</p>
          </section>

          {/* Data We Collect */}
          <section className="privacy-section">
            <h2>{t('privacyPolicy.dataCollect')}</h2>

            <h3>{t('privacyPolicy.accountInfo')}</h3>
            <p>{t('privacyPolicy.accountInfoDesc')}</p>

            <h3>{t('privacyPolicy.contentCreate')}</h3>
            <ul>
              <li>
                <strong>{t('privacyPolicy.conversations')}</strong> —{' '}
                {t('privacyPolicy.conversationsDesc')}
              </li>
              <li>
                <strong>{t('privacyPolicy.uploadedFiles')}</strong> —{' '}
                {t('privacyPolicy.uploadedFilesDesc')}
              </li>
              <li>
                <strong>{t('privacyPolicy.agentsWorkflows')}</strong> —{' '}
                {t('privacyPolicy.agentsWorkflowsDesc')}
              </li>
              <li>
                <strong>{t('privacyPolicy.credentials')}</strong> —{' '}
                {t('privacyPolicy.credentialsDesc')}
              </li>
            </ul>

            <h3>{t('privacyPolicy.usageData')}</h3>
            <p>{t('privacyPolicy.usageDataDesc')}</p>
          </section>

          {/* How We Use Your Data */}
          <section className="privacy-section">
            <h2>{t('privacyPolicy.howUse')}</h2>
            <ul>
              <li>{t('privacyPolicy.howUse.operate')}</li>
              <li>{t('privacyPolicy.howUse.process')}</li>
              <li>{t('privacyPolicy.howUse.sync')}</li>
              <li>{t('privacyPolicy.howUse.auth')}</li>
              <li>{t('privacyPolicy.howUse.improve')}</li>
            </ul>
            <p className="privacy-legal">
              <strong>{t('privacyPolicy.legalBasis')}</strong> {t('privacyPolicy.legalBasisText')}
            </p>
          </section>

          {/* Data Retention */}
          <section className="privacy-section">
            <h2>{t('privacyPolicy.dataRetention')}</h2>
            <table className="privacy-table">
              <thead>
                <tr>
                  <th>{t('privacyPolicy.table.dataType')}</th>
                  <th>{t('privacyPolicy.table.retentionPeriod')}</th>
                  <th>{t('privacyPolicy.table.notes')}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{t('privacyPolicy.tempFiles')}</td>
                  <td>{t('privacyPolicy.retention.tempPeriod')}</td>
                  <td>{t('privacyPolicy.retention.tempNotes')}</td>
                </tr>
                <tr>
                  <td>{t('privacyPolicy.localConversations')}</td>
                  <td>{t('privacyPolicy.retention.localPeriod')}</td>
                  <td>{t('privacyPolicy.retention.localNotes')}</td>
                </tr>
                <tr>
                  <td>{t('privacyPolicy.cloudData')}</td>
                  <td>{t('privacyPolicy.retention.cloudPeriod')}</td>
                  <td>{t('privacyPolicy.retention.cloudNotes')}</td>
                </tr>
                <tr>
                  <td>{t('privacyPolicy.auditLogs')}</td>
                  <td>{t('privacyPolicy.retention.auditPeriod')}</td>
                  <td>{t('privacyPolicy.retention.auditNotes')}</td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Your Rights */}
          <section className="privacy-section">
            <h2>{t('privacyPolicy.yourRights')}</h2>
            <p>{t('privacyPolicy.yourRightsDesc')}</p>

            <div className="privacy-rights">
              <div className="privacy-right">
                <h4>{t('privacyPolicy.accessData')}</h4>
                <p>{t('privacyPolicy.accessDataDesc')}</p>
                <code>{t('privacyPolicy.gdpr.article15')}</code>
              </div>
              <div className="privacy-right">
                <h4>{t('privacyPolicy.deleteData')}</h4>
                <p>{t('privacyPolicy.deleteDataDesc')}</p>
                <code>{t('privacyPolicy.gdpr.article17')}</code>
              </div>
              <div className="privacy-right">
                <h4>{t('privacyPolicy.portability')}</h4>
                <p>{t('privacyPolicy.portabilityDesc')}</p>
                <code>{t('privacyPolicy.gdpr.article20')}</code>
              </div>
            </div>
          </section>

          {/* Third Parties */}
          <section className="privacy-section">
            <h2>{t('privacyPolicy.thirdParty')}</h2>

            <div className="privacy-third-party">
              <h4>{t('privacyPolicy.thirdParty.supabase')}</h4>
              <p>{t('privacyPolicy.thirdParty.supabaseDesc')}</p>
              <span className="privacy-data-shared">
                {t('privacyPolicy.thirdParty.supabaseShared')}
              </span>
            </div>

            <div className="privacy-third-party">
              <h4>{t('privacyPolicy.thirdParty.aiProviders')}</h4>
              <p>{t('privacyPolicy.thirdParty.aiProvidersDesc')}</p>
              <span className="privacy-data-shared">
                {t('privacyPolicy.thirdParty.aiProvidersShared')}
              </span>
            </div>
          </section>

          {/* Security */}
          <section className="privacy-section">
            <h2>{t('privacyPolicy.security')}</h2>
            <ul>
              <li>{t('privacyPolicy.security.encryption')}</li>
              <li>{t('privacyPolicy.security.bcrypt')}</li>
              <li>{t('privacyPolicy.security.jwt')}</li>
              <li>{t('privacyPolicy.security.https')}</li>
              <li>{t('privacyPolicy.security.rateLimit')}</li>
              <li>{t('privacyPolicy.security.expiration')}</li>
            </ul>
          </section>

          {/* Cookies */}
          <section className="privacy-section">
            <h2>{t('privacyPolicy.cookies')}</h2>
            <p>{t('privacyPolicy.cookiesDesc')}</p>
          </section>

          {/* Changes */}
          <section className="privacy-section">
            <h2>{t('privacyPolicy.changes')}</h2>
            <p>
              We'll notify you of significant changes via email or in-app notification. Continued
              use after changes constitutes acceptance.
            </p>
          </section>

          {/* Contact */}
          <section className="privacy-section privacy-contact">
            <h2>{t('privacyPolicy.contact')}</h2>
            <p>{t('privacyPolicy.contactDesc')}</p>
            <a href="mailto:privacy@claraverse.app" className="privacy-email-link">
              privacy@claraverse.app
            </a>
          </section>

          {/* Footer */}
          <footer className="privacy-footer">
            <p>{t('privacyPolicy.footer')}</p>
          </footer>
        </article>
      </main>

      <style>{`
        .privacy-policy-page {
          min-height: 100vh;
          background: #0a0a0a;
          color: #e4e4e7;
        }

        .privacy-policy-header {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.25rem 2rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(10px);
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .privacy-policy-back-link {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.05);
          color: #a1a1aa;
          transition: all 0.2s;
        }

        .privacy-policy-back-link:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #fff;
        }

        .privacy-policy-title {
          font-size: 1.125rem;
          font-weight: 500;
          color: #fff;
        }

        .privacy-policy-container {
          max-width: 720px;
          margin: 0 auto;
          padding: 3rem 1.5rem 4rem;
        }

        .privacy-policy-content {
          font-size: 1rem;
          line-height: 1.7;
        }

        /* Hero */
        .privacy-hero {
          margin-bottom: 3rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .privacy-hero h1 {
          font-size: 2.5rem;
          font-weight: 700;
          color: #fff;
          margin: 0 0 0.75rem;
          letter-spacing: -0.02em;
        }

        .privacy-tagline {
          font-size: 1.25rem;
          color: #a1a1aa;
          margin: 0 0 1rem;
        }

        .privacy-updated {
          font-size: 0.875rem;
          color: #71717a;
          margin: 0;
        }

        /* Summary */
        .privacy-summary {
          background: rgba(233, 30, 99, 0.05);
          border: 1px solid rgba(233, 30, 99, 0.15);
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 3rem;
        }

        .privacy-summary h2 {
          font-size: 1rem;
          font-weight: 600;
          color: #e91e63;
          margin: 0 0 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .privacy-summary p {
          margin: 0;
          color: #d4d4d8;
        }

        /* Sections */
        .privacy-section {
          margin-bottom: 2.5rem;
        }

        .privacy-section h2 {
          font-size: 1.375rem;
          font-weight: 600;
          color: #fff;
          margin: 0 0 1.25rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .privacy-section h3 {
          font-size: 1rem;
          font-weight: 600;
          color: #e4e4e7;
          margin: 1.5rem 0 0.5rem;
        }

        .privacy-section h3:first-of-type {
          margin-top: 0;
        }

        .privacy-section h4 {
          font-size: 0.9375rem;
          font-weight: 600;
          color: #e4e4e7;
          margin: 0 0 0.25rem;
        }

        .privacy-section p {
          color: #a1a1aa;
          margin: 0 0 1rem;
        }

        .privacy-section ul {
          list-style: none;
          padding: 0;
          margin: 0 0 1rem;
        }

        .privacy-section ul li {
          position: relative;
          padding-left: 1.25rem;
          margin-bottom: 0.5rem;
          color: #a1a1aa;
        }

        .privacy-section ul li::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0.6em;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #e91e63;
        }

        .privacy-section ul li strong {
          color: #e4e4e7;
        }

        .privacy-legal {
          font-size: 0.875rem;
          padding: 0.75rem 1rem;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 8px;
          margin-top: 1rem;
        }

        .privacy-legal strong {
          color: #e91e63;
        }

        /* Table */
        .privacy-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
          margin: 1rem 0;
        }

        .privacy-table th,
        .privacy-table td {
          text-align: left;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }

        .privacy-table th {
          font-weight: 500;
          color: #71717a;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .privacy-table td {
          color: #a1a1aa;
        }

        .privacy-table td:first-child {
          color: #e4e4e7;
          font-weight: 500;
        }

        .privacy-table tr:last-child td {
          border-bottom: none;
        }

        /* Rights */
        .privacy-rights {
          display: grid;
          gap: 1rem;
          margin-top: 1rem;
        }

        .privacy-right {
          padding: 1rem 1.25rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
        }

        .privacy-right p {
          font-size: 0.875rem;
          margin: 0.25rem 0 0.75rem;
        }

        .privacy-right code {
          display: inline-block;
          font-family: ui-monospace, monospace;
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
          background: rgba(233, 30, 99, 0.1);
          border-radius: 4px;
          color: #e91e63;
        }

        /* Third Party */
        .privacy-third-party {
          padding: 1rem 1.25rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          margin-bottom: 0.75rem;
        }

        .privacy-third-party h4 {
          margin-bottom: 0.25rem;
        }

        .privacy-third-party p {
          font-size: 0.875rem;
          margin: 0 0 0.5rem;
        }

        .privacy-data-shared {
          display: block;
          font-size: 0.8125rem;
          color: #71717a;
        }

        /* Contact */
        .privacy-contact {
          text-align: center;
          padding: 2rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
        }

        .privacy-contact h2 {
          border-bottom: none;
          padding-bottom: 0;
        }

        .privacy-email-link {
          display: inline-block;
          padding: 0.75rem 1.5rem;
          background: #e91e63;
          color: #fff;
          font-weight: 500;
          border-radius: 8px;
          text-decoration: none;
          transition: background 0.2s;
        }

        .privacy-email-link:hover {
          background: #d81b60;
        }

        /* Footer */
        .privacy-footer {
          margin-top: 3rem;
          padding-top: 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          text-align: center;
        }

        .privacy-footer p {
          font-size: 0.875rem;
          color: #52525b;
          font-style: italic;
        }

        @media (max-width: 640px) {
          .privacy-policy-container {
            padding: 2rem 1rem 3rem;
          }

          .privacy-hero h1 {
            font-size: 2rem;
          }

          .privacy-tagline {
            font-size: 1.125rem;
          }

          .privacy-table {
            font-size: 0.8125rem;
          }

          .privacy-table th,
          .privacy-table td {
            padding: 0.625rem 0.75rem;
          }
        }
      `}</style>
    </div>
  );
};
