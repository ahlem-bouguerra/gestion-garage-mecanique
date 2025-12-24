import Layout from '@/components/Layout';
import { 
  HeroSection, 
  IntroSection, 
  Featured
} from '@/components/UI';

export default function LandingPage() {
  return (
    <Layout>
      <main>
        <HeroSection />
        <Featured />
        <IntroSection />
      </main>
    </Layout>
  );
}