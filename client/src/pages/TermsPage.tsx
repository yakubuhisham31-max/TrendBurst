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
          <h3 className="text-lg font-semibold">1. You Own Your Content</h3>
          <p className="text-muted-foreground">
            Anything you upload — videos, audio, images, captions — belongs to you. Trendx does not claim ownership of your content.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold">2. You Allow Trendx to Show Your Content</h3>
          <p className="text-muted-foreground">
            To run the platform, you give Trendx permission to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Display your entries inside contests</li>
            <li>Show them on leaderboards and feeds</li>
            <li>Feature them in highlights or recommendations</li>
            <li>Repost contest entries on Trendx social pages</li>
          </ul>
          <p className="text-muted-foreground text-sm">
            This permission is used only for platform and contest promotion.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold">3. Contest Brands Can Use Your Entry for the Contest</h3>
          <p className="text-muted-foreground">
            When you join a contest hosted by a brand, you give that brand permission to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Repost your entry on social platforms</li>
            <li>Use your video to promote the contest</li>
            <li>Share winners and top entries</li>
            <li>Create recap or highlight videos</li>
            <li>Make reaction or commentary videos</li>
          </ul>
          <p className="text-muted-foreground text-sm">
            This permission is only for contest-related purposes. You still own your content.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold">4. What Trendx and Brands Cannot Do</h3>
          <p className="text-muted-foreground">
            Trendx and brands are not allowed to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Claim ownership of your content</li>
            <li>Use your entry for unrelated advertisements</li>
            <li>Sell or license your content</li>
            <li>Use it in long-term commercial campaigns</li>
            <li>Edit your content in misleading ways</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold">5. Removal of Content</h3>
          <p className="text-muted-foreground">
            You may delete your content anytime, except:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>While a contest is still active</li>
            <li>If your content has already been used in a recap or highlight video</li>
          </ul>
          <p className="text-muted-foreground text-sm">
            Already-published recaps, winner posts, and highlight videos may remain online.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold">6. Community Guidelines</h3>
          <p className="text-muted-foreground">
            Do not upload:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Harmful or offensive content</li>
            <li>Stolen or copyrighted material</li>
            <li>Content that breaks the laws of your country</li>
          </ul>
          <p className="text-muted-foreground text-sm">
            Violation may lead to removal or suspension.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold">7. Your Privacy</h3>
          <p className="text-muted-foreground">
            Trendx collects only the information needed to run the platform, such as:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Username</li>
            <li>Email</li>
            <li>Profile details</li>
            <li>Contest participation history</li>
          </ul>
          <p className="text-muted-foreground text-sm">
            Trendx does not sell your information. A full Privacy Policy will be provided later.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold">8. Updates</h3>
          <p className="text-muted-foreground">
            Trendx may update these terms occasionally. You will be notified in the app when major changes are made.
          </p>
        </section>

        <section className="space-y-3">
          <h3 className="text-lg font-semibold">9. Support</h3>
          <p className="text-muted-foreground">
            For questions or support, contact us at:{" "}
            <a 
              href="mailto:trendx.social1@gmail.com" 
              className="text-primary hover:underline font-medium"
              data-testid="link-support-email"
            >
              trendx.social1@gmail.com
            </a>
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
