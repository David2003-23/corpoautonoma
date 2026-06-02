import Header from "@/components/header";
import Hero from "@/components/hero";
import About from "@/components/about";
import AcademicOffer from "@/components/academic-offer";
import EnglishPro from "@/components/english-pro";
import Courses3x1 from "@/components/courses-3x1";
import Scholarships from "@/components/scholarships";
import Contact from "@/components/contact";
import Footer from "@/components/footer";
import WhatsAppButton from "@/components/whatsapp-button";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <About />
        <AcademicOffer />
        <EnglishPro />
        <Courses3x1 />
        <Scholarships />
        <Contact />
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
