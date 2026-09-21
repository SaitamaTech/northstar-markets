import { AppShell } from "@/components/AppShell";

export default function PrivacyPolicyPage() {
  return (
    <AppShell>
      <div className="page-shell legal-page-shell">
        <div className="workspace-heading feature-heading">
          <div>
            <div className="breadcrumb">
              <span>Legal</span>
              <span>/</span>
              <strong>Privacy Policy</strong>
            </div>
            <h1>Privacy Policy</h1>
          </div>
        </div>

        <section className="section-card legal-card">
          <p>Northstar Markets (“we”, “our”, or “us”) respects your privacy and is committed to protecting the personal information you share with us. This Privacy Policy explains how we collect, use, disclose, and protect information when you access or use our website, mobile experience, and related services.</p>

          <h2>1. Information We Collect</h2>
          <p>We may collect information that identifies you or relates to you, including:</p>
          <ul>
            <li>Account details such as name, email address, and profile preferences.</li>
            <li>Authentication data used to access our services, such as Supabase and OAuth session information.</li>
            <li>Wallet and blockchain-related metadata when you connect a wallet or complete a transaction.</li>
            <li>Usage data, including page views, feature access, session activity, and device/browser information.</li>
            <li>Support messages, feedback submissions, and communication content.</li>
          </ul>

          <h2>2. How We Use Information</h2>
          <p>We use your information to:</p>
          <ul>
            <li>Provide and improve the Northstar Markets platform.</li>
            <li>Authenticate your account and protect against fraud or abuse.</li>
            <li>Process wallet connections, deposits, transaction history, and related portfolio features.</li>
            <li>Personalize your dashboard, notifications, and market experience.</li>
            <li>Communicate with you about product updates, security alerts, or account-related matters.</li>
            <li>Comply with legal obligations and enforce our terms.</li>
          </ul>

          <h2>3. Cookies and Tracking Technologies</h2>
          <p>We use cookies and similar technologies to remember your preferences, maintain secure sessions, support login persistence, and understand usage patterns. Cookies may also help us keep authentication sessions stable and improve site performance. You can manage your cookie preferences through your browser settings, though disabling certain cookies may limit some platform functionality.</p>

          <h2>4. Information Sharing</h2>
          <p>We do not sell your personal information. We may share information with trusted service providers that support our platform operations, including hosting, authentication, analytics, and security services. We may also disclose information when required by law, to protect rights or safety, or to investigate misuse of the platform.</p>

          <h2>5. Data Security</h2>
          <p>We use reasonable administrative, technical, and organizational measures to protect personal information from unauthorized access, loss, or misuse. However, no method of transmission over the Internet or method of electronic storage is completely secure, and we cannot guarantee absolute security.</p>

          <h2>6. Retention</h2>
          <p>We retain personal information only for as long as necessary to provide services, maintain security, fulfill legal obligations, resolve disputes, and enforce agreements.</p>

          <h2>7. Your Rights</h2>
          <p>You may have rights to access, correct, delete, or restrict the processing of your personal information depending on your jurisdiction. If you would like to exercise those rights, contact us through the support or contact methods available on the platform.</p>

          <h2>8. Third-Party Services</h2>
          <p>Our platform may integrate with third-party providers such as Supabase, cloud infrastructure vendors, market data providers, and wallet services. Their own privacy practices apply to the information they collect and process.</p>

          <h2>9. Children’s Privacy</h2>
          <p>Our services are not directed to children under the age of 13, and we do not knowingly collect personal information from children without valid parental consent where required by applicable law.</p>

          <h2>10. Changes to This Policy</h2>
          <p>We may update this Privacy Policy from time to time. If material changes are made, we will notify you through the website or by other appropriate means. Your continued use of the platform after changes are posted means you accept the updated policy.</p>

          <h2>11. Contact</h2>
          <p>If you have questions about this Privacy Policy or how your information is handled, please contact the Northstar Markets team through the support channels made available on the platform.</p>
        </section>
      </div>
    </AppShell>
  );
}
