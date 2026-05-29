import { Nav } from './Nav';
import { Hero } from './Hero';
import { Rules, HowItWorks, Features, ApiSection, Cta, Footer } from './Sections';

export function LandingPage() {
  return (
    <div className="landing-page">
      <Nav />
      <Hero />
      <main>
        <Rules />
        <HowItWorks />
        <Features />
        <ApiSection />
        <Cta />
      </main>
      <Footer />
    </div>
  );
}
