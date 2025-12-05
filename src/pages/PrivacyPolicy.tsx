import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Privacy Policy</CardTitle>
            <p className="text-muted-foreground">Last Updated: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
              <p>We collect information that you provide directly to us, including:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Account information (name, email, age)</li>
                <li>Financial account connections (via secure third-party services)</li>
                <li>Usage data and learning progress</li>
                <li>Device and browser information</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide and improve our educational services</li>
                <li>Connect to banking and investment platforms</li>
                <li>Track learning progress and achievements</li>
                <li>Communicate important updates and information</li>
                <li>Ensure platform security and prevent fraud</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Financial Data Protection</h2>
              <p>We use industry-leading security providers (Plaid for banking, Alpaca for investments) to connect to financial services. We do not store your banking credentials directly. All financial data is encrypted and transmitted securely.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Information Sharing</h2>
              <p>We do not sell your personal information. We may share information with:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Service providers who assist in our operations (e.g., Plaid, Alpaca)</li>
                <li>Legal authorities when required by law</li>
                <li>Parents or legal guardians overseeing child accounts</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Children's Privacy</h2>
              <p>Our service is designed for use by children under parental supervision. We comply with applicable children's privacy laws and require parental consent for accounts created by minors. Parents have the right to review, modify, or delete their child's information.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Data Security</h2>
              <p>We implement appropriate technical and organizational measures to protect your personal information. However, no method of transmission over the internet is 100% secure, and we cannot guarantee absolute security.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Data Retention</h2>
              <p>We retain your information for as long as necessary to provide our services and comply with legal obligations. You may request deletion of your account and associated data at any time.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Cookies and Tracking</h2>
              <p>We use cookies and similar technologies to enhance user experience, analyze usage patterns, and maintain security. You can control cookie settings through your browser.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Third-Party Services</h2>
              <p>Our platform integrates with third-party services (Plaid, Alpaca, Coinbase) that have their own privacy policies. We encourage you to review their policies as well.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access your personal information</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Opt out of certain data collection</li>
                <li>Withdraw consent at any time</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">11. Changes to Privacy Policy</h2>
              <p>We may update this Privacy Policy from time to time. We will notify users of any material changes through our platform or via email.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">12. Contact Us</h2>
              <p>If you have questions about this Privacy Policy or wish to exercise your privacy rights, please contact us through our support channels.</p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
