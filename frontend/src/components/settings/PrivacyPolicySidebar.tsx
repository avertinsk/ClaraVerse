import { useTranslation } from 'react-i18next';
import './PrivacyPolicySidebar.css';

export const PrivacyPolicySidebar = () => {
  const { t } = useTranslation('settings');

  return (
    <aside className="privacy-policy-sidebar">
      <div className="privacy-policy-sidebar-header">
        <h2>{t('privacyPolicy.title')}</h2>
        <p className="privacy-policy-updated">{t('privacyPolicy.lastUpdated')}</p>
      </div>

      <div className="privacy-policy-sidebar-content">
        {/* Quick Summary */}
        <section className="policy-summary">
          <h3>{t('privacyPolicy.shortVersion')}</h3>
          <p>{t('privacyPolicy.shortVersionDesc')}</p>
        </section>

        {/* Data We Collect */}
        <section className="policy-section">
          <h3>{t('privacyPolicy.dataCollect')}</h3>

          <h4>{t('privacyPolicy.accountInfo')}</h4>
          <p>{t('privacyPolicy.accountInfoDesc')}</p>

          <h4>{t('privacyPolicy.contentCreate')}</h4>
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

          <h4>{t('privacyPolicy.usageData')}</h4>
          <p>{t('privacyPolicy.usageDataDesc')}</p>
        </section>

        {/* How We Use Your Data */}
        <section className="policy-section">
          <h3>{t('privacyPolicy.howUse')}</h3>
          <ul>
            <li>{t('privacyPolicy.useProvide')}</li>
            <li>{t('privacyPolicy.useProcess')}</li>
            <li>{t('privacyPolicy.useSync')}</li>
            <li>{t('privacyPolicy.useAuth')}</li>
            <li>{t('privacyPolicy.useImprove')}</li>
          </ul>
          <p className="policy-legal">
            <strong>{t('privacyPolicy.legalBasis')}</strong>
          </p>
        </section>

        {/* Data Retention */}
        <section className="policy-section">
          <h3>{t('privacyPolicy.dataRetention')}</h3>
          <div className="policy-table-wrapper">
            <table className="policy-table">
              <thead>
                <tr>
                  <th>{t('privacyPolicy.dataType')}</th>
                  <th>{t('privacyPolicy.retention')}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{t('privacyPolicy.tempFiles')}</td>
                  <td>{t('privacyPolicy.tempFilesRetention')}</td>
                </tr>
                <tr>
                  <td>{t('privacyPolicy.localConv')}</td>
                  <td>{t('privacyPolicy.localConvRetention')}</td>
                </tr>
                <tr>
                  <td>{t('privacyPolicy.cloudSync')}</td>
                  <td>{t('privacyPolicy.cloudSyncRetention')}</td>
                </tr>
                <tr>
                  <td>{t('privacyPolicy.auditLogs')}</td>
                  <td>{t('privacyPolicy.auditLogsRetention')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Your Rights */}
        <section className="policy-section">
          <h3>{t('privacyPolicy.yourRights')}</h3>
          <p>{t('privacyPolicy.rightsDesc')}</p>

          <div className="policy-rights">
            <div className="policy-right">
              <h4>{t('privacyPolicy.rightAccess')}</h4>
              <p>{t('privacyPolicy.rightAccessDesc')}</p>
              <code>Article 15</code>
            </div>
            <div className="policy-right">
              <h4>{t('privacyPolicy.rightErasure')}</h4>
              <p>{t('privacyPolicy.rightErasureDesc')}</p>
              <code>Article 17</code>
            </div>
            <div className="policy-right">
              <h4>{t('privacyPolicy.rightPortability')}</h4>
              <p>{t('privacyPolicy.rightPortabilityDesc')}</p>
              <code>Article 20</code>
            </div>
          </div>
        </section>

        {/* Third Parties */}
        <section className="policy-section">
          <h3>{t('privacyPolicy.thirdParty')}</h3>

          <div className="policy-third-party">
            <h4>{t('privacyPolicy.supabase')}</h4>
            <p>{t('privacyPolicy.supabaseDesc')}</p>
            <span className="policy-data-shared">{t('privacyPolicy.dataShared')}</span>
          </div>

          <div className="policy-third-party">
            <h4>{t('privacyPolicy.aiProviders')}</h4>
            <p>{t('privacyPolicy.aiProvidersDesc')}</p>
            <span className="policy-data-shared">{t('privacyPolicy.aiDataShared')}</span>
          </div>
        </section>

        {/* Security */}
        <section className="policy-section">
          <h3>{t('privacyPolicy.security')}</h3>
          <ul>
            <li>{t('privacyPolicy.securityItem1')}</li>
            <li>{t('privacyPolicy.securityItem2')}</li>
            <li>{t('privacyPolicy.securityItem3')}</li>
            <li>{t('privacyPolicy.securityItem4')}</li>
            <li>{t('privacyPolicy.securityItem5')}</li>
            <li>{t('privacyPolicy.securityItem6')}</li>
          </ul>
        </section>

        {/* Cookies */}
        <section className="policy-section">
          <h3>{t('privacyPolicy.cookies')}</h3>
          <p>{t('privacyPolicy.cookiesDesc')}</p>
        </section>

        {/* Changes */}
        <section className="policy-section">
          <h3>{t('privacyPolicy.changes')}</h3>
          <p>{t('privacyPolicy.changesDesc')}</p>
        </section>

        {/* Contact */}
        <section className="policy-section policy-contact">
          <h3>{t('privacyPolicy.contact')}</h3>
          <p>{t('privacyPolicy.contactDesc')}</p>
          <a href="mailto:privacy@claraverse.app" className="policy-email-link">
            privacy@claraverse.app
          </a>
        </section>

        {/* Footer */}
        <footer className="policy-footer">
          <p>{t('privacyPolicy.footer')}</p>
        </footer>
      </div>
    </aside>
  );
};
