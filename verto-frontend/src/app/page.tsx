import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";
import WalletHydrator from "@/components/auth/WalletHydrator";
import MobileWalletModal from "@/components/auth/MobileWalletModal";

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <WalletHydrator />
      <MobileWalletModal />
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <CTA />
      <Footer />
    </div>
  );
}
