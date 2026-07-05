import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import PlatformSection from "@/components/landing/PlatformSection";
import PricingSection from "@/components/landing/PricingSection";
import RoadmapSection from "@/components/landing/RoadmapSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white overflow-x-clip">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <PlatformSection />
      <PricingSection />
      <RoadmapSection />
      <CTASection />
      <Footer />
    </main>
  );
}
