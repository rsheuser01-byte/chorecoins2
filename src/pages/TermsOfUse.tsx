import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const TermsOfUse = () => {
  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Terms of Use</CardTitle>
            <p className="text-muted-foreground">Last Updated: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
              <p>By accessing and using this financial education platform, you accept and agree to be bound by these Terms of Use. If you do not agree to these terms, please do not use our services.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
              <p>Our platform provides financial literacy education and investment simulation tools for children and families. We connect to bank accounts and investment services to provide real-world learning experiences under parental supervision.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Age Requirements</h2>
              <p>This service is designed for children under parental supervision. Parents or legal guardians must oversee all account activities and are responsible for all actions taken through the account.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Financial Services</h2>
              <p>Our platform integrates with third-party financial services including banking and investment platforms. All financial transactions are subject to the terms and conditions of those service providers. We do not provide financial advice and all investment decisions are made at your own risk.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Account Security</h2>
              <p>You are responsible for maintaining the confidentiality of your account credentials. You must notify us immediately of any unauthorized access or security breach.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. User Conduct</h2>
              <p>You agree not to misuse our services, including but not limited to: attempting unauthorized access, interfering with service operations, or violating any applicable laws or regulations.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Limitation of Liability</h2>
              <p>We provide educational tools and information but are not liable for any financial losses, investment decisions, or damages arising from the use of our service. All investments carry risk.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. Modifications to Service</h2>
              <p>We reserve the right to modify or discontinue any aspect of our service at any time without prior notice.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Termination</h2>
              <p>We may terminate or suspend access to our service immediately, without prior notice, for any breach of these Terms of Use.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Governing Law</h2>
              <p>These terms shall be governed by and construed in accordance with applicable federal and state laws.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">11. Contact Information</h2>
              <p>For questions about these Terms of Use, please contact us through our support channels.</p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsOfUse;
