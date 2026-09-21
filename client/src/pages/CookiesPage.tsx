import { AppShell } from "@/components/AppShell";

export default function CookiesPage() {
  return (
    <AppShell>
      <div className="page-shell legal-page-shell">
        <div className="workspace-heading feature-heading">
          <div>
            <div className="breadcrumb">
              <span>Legal</span>
              <span>/</span>
              <strong>Cookies Policy</strong>
            </div>
            <h1>Cookies Policy</h1>
          </div>
        </div>

        <section className="section-card legal-card">
          <p>Northstar Markets uses cookies and similar tracking technologies to provide a secure, efficient, and personalized experience across our platform. This Cookies Policy explains what cookies are, how we use them, and the options available to you.</p>

          <h2>1. What Are Cookies?</h2>
          <p>Cookies are small text files stored on your device when you visit a website. They help sites recognize returning users, remember preferences, and support secure and efficient operation.</p>

          <h2>2. Why We Use Cookies</h2>
          <p>We use cookies to:</p>
          <ul>
            <li>Keep you signed in securely during your session.</li>
            <li>Remember your display preferences, theme choices, and account settings.</li>
            <li>Support key features such as market dashboards, wallet flows, and portfolio tools.</li>
            <li>Protect the platform from fraud, abuse, and unauthorized access.</li>
            <li>Understand how users engage with our site so we can improve performance and reliability.</li>
          </ul>

          <h2>3. Types of Cookies We Use</h2>
          <ul>
            <li><strong>Essential cookies:</strong> required for authentication, security, and the proper functioning of the platform.</li>
            <li><strong>Preference cookies:</strong> remember settings such as theme, language, or layout choices.</li>
            <li><strong>Analytics cookies:</strong> help us analyze aggregate usage and improve product quality.</li>
            <li><strong>Third-party cookies:</strong> may be used by providers supporting authentication, analytics, or wallet-integrated services.</li>
          </ul>

          <h2>4. Third-Party Services</h2>
          <p>We may use third-party services to provide hosting, analytics, authentication, and wallet functionality. These services may place cookies on your device and process information in accordance with their own policies.</p>

          <h2>5. Managing Cookies</h2>
          <p>You can manage cookies through your browser settings. You may delete or block cookies at any time, but doing so may affect the functionality of certain features, including authentication and dashboard personalization.</p>

          <h2>6. Consent</h2>
          <p>By continuing to use Northstar Markets, you agree to the use of cookies as described in this policy. We may update this Cookies Policy from time to time to reflect changes in technology or legal requirements.</p>

          <h2>7. Contact</h2>
          <p>If you have questions about our cookie practices or would like to exercise a preference, please contact the Northstar Markets team through the support channels available on the platform.</p>
        </section>
      </div>
    </AppShell>
  );
}
