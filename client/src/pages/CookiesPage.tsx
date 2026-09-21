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
          <p>Northstar Markets uses cookies and similar technologies to provide a secure and reliable experience for our users. This Cookies Policy explains what cookies are, how we use them, and how you can manage them.</p>

          <h2>What Are Cookies?</h2>
          <p>Cookies are small text files stored on your device when you visit a website. They help websites remember preferences, improve performance, and support essential functions such as authentication and session management.</p>

          <h2>How We Use Cookies</h2>
          <p>We use cookies to:</p>
          <ul>
            <li>Keep you signed in during a secure browsing session.</li>
            <li>Remember language, theme, and interface preferences.</li>
            <li>Support wallet, portfolio, and dashboard functionality.</li>
            <li>Detect and prevent abuse, fraud, and security incidents.</li>
            <li>Understand how users interact with our platform so we can improve performance and reliability.</li>
          </ul>

          <h2>Types of Cookies We Use</h2>
          <p>We may use:</p>
          <ul>
            <li><strong>Essential cookies:</strong> required for security, authentication, and core app functionality.</li>
            <li><strong>Preference cookies:</strong> remember user settings such as theme or dashboard configuration.</li>
            <li><strong>Analytics cookies:</strong> help us understand usage trends and improve the platform.</li>
            <li><strong>Third-party cookies:</strong> used by services such as authentication, analytics, or wallet integrations where applicable.</li>
          </ul>

          <h2>Managing Cookies</h2>
          <p>You can control or delete cookies through your browser settings. Please note that disabling essential cookies may prevent you from signing in or using parts of the platform.</p>

          <h2>Consent</h2>
          <p>By continuing to use Northstar Markets, you consent to the use of cookies as described in this policy, unless you choose to disable them in your browser settings. We may update this policy over time as our services evolve.</p>

          <h2>Contact</h2>
          <p>If you have questions about our cookie practices, please contact our team using the support methods available on the platform.</p>
        </section>
      </div>
    </AppShell>
  );
}
