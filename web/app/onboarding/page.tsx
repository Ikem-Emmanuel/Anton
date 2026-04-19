import Onboarding from '@/components/modules/onboarding';

// /onboarding — first-run flow. Lives outside the (app) route group so it
// renders without ShellChrome.

export default function OnboardingPage() {
  return <Onboarding />;
}
