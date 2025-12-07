import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default function TermsPage() {
  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-3">
          <Button
            size="icon"
            variant="ghost"
            onClick={handleBack}
            data-testid="button-back"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-bold">Terms and Conditions</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <section className="space-y-4">
          <h2 className="text-2xl font-bold">Trendx Terms and Conditions</h2>
          <p className="text-muted-foreground">Last updated: December 2025</p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold">1. Acceptance of Terms</h3>
          <p className="text-muted-foreground">
            By creating an account and using Trendx, you agree to comply with these Terms and Conditions. If you do not agree, please do not use our platform.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold">2. User Responsibilities</h3>
          <p className="text-muted-foreground">
            You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Provide accurate and truthful information during registration</li>
            <li>Use the platform in accordance with all applicable laws and regulations</li>
            <li>Not engage in any form of harassment, abuse, or hate speech</li>
            <li>Respect intellectual property rights of others</li>
            <li>Not post content that is illegal, explicit, or violates platform guidelines</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold">3. Content and Intellectual Property</h3>
          <p className="text-muted-foreground">
            You retain all rights to content you create and post on Trendx. By posting content, you grant Trendx a non-exclusive, worldwide, royalty-free license to use, reproduce, and display your content within the platform. You are solely responsible for ensuring you have the rights to post any content on Trendx.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold">4. Trends and Competitions</h3>
          <p className="text-muted-foreground">
            Trend creators are responsible for establishing and enforcing trend rules. Participants agree to follow all trend guidelines. Trendx reserves the right to remove content that violates platform policies or trend rules. Trend creators may disqualify participants for violation of trend rules.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold">5. Prohibited Conduct</h3>
          <p className="text-muted-foreground">
            You agree not to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Harass, threaten, or abuse other users</li>
            <li>Engage in hate speech or discrimination</li>
            <li>Post explicit or adult content</li>
            <li>Spam or engage in misleading activity</li>
            <li>Attempt to gain unauthorized access to platform systems</li>
            <li>Violate any applicable laws or regulations</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold">6. Limitation of Liability</h3>
          <p className="text-muted-foreground">
            Trendx is provided on an "as-is" basis. We do not guarantee uninterrupted service or the absence of errors. Trendx shall not be liable for any indirect, incidental, or consequential damages resulting from your use of the platform.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold">7. Account Termination</h3>
          <p className="text-muted-foreground">
            Trendx reserves the right to suspend or terminate accounts that violate these Terms and Conditions or engage in prohibited conduct. Users may request account deletion at any time through their account settings.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold">8. Changes to Terms</h3>
          <p className="text-muted-foreground">
            Trendx reserves the right to modify these Terms and Conditions at any time. Continued use of the platform following changes constitutes acceptance of the modified terms.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold">9. Contact</h3>
          <p className="text-muted-foreground">
            If you have questions about these Terms and Conditions, please contact us through the platform's support system.
          </p>
        </section>

        <div className="pt-8 pb-4">
          <Button onClick={handleBack} data-testid="button-back-bottom">
            Back to Sign Up
          </Button>
        </div>
      </main>
    </div>
  );
}
