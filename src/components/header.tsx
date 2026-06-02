"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { name: "Inicio", href: "#inicio" },
  { name: "Nosotros", href: "#nosotros" },
  { name: "Oferta Académica", href: "#oferta" },
  { name: "Noticias", href: "#noticias" },
  { name: "Contacto", href: "#contacto" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeLink, setActiveLink] = useState("Inicio");

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const sections = navLinks.map((l) => l.href.slice(1));
    const handleScroll = () => {
      const current = sections.find((id) => {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          return rect.top <= 150 && rect.bottom >= 150;
        }
        return false;
      });
      if (current) {
        const link = navLinks.find((l) => l.href === `#${current}`);
        if (link) setActiveLink(link.name);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        scrolled
          ? "glass shadow-lg shadow-black/5"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <a href="#inicio" className="flex items-center group">
            <img
              src="https://corpoautonoma.com/wp-content/uploads/2025/11/cropped-CORPOAUTONOMA-Logo2.png"
              alt="CORPOAUTÓNOMA"
              className="h-10 sm:h-12 w-auto transition-all duration-300"
              style={{
                filter: scrolled ? "none" : "brightness(0) invert(1)",
              }}
            />
          </a>

          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setActiveLink(link.name)}
                className={cn(
                  "relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300",
                  scrolled
                    ? "text-gray-dark hover:text-primary"
                    : "text-white/90 hover:text-white",
                  activeLink === link.name &&
                    (scrolled
                      ? "text-primary"
                      : "text-gold")
                )}
              >
                {link.name}
                {activeLink === link.name && (
                  <motion.div
                    layoutId="activeLink"
                    className={cn(
                      "absolute bottom-0 left-4 right-4 h-0.5 rounded-full",
                      scrolled ? "bg-primary" : "bg-gold"
                    )}
                  />
                )}
              </a>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <a
              href="https://wa.me/573153493730?text=Hola%2C%20estoy%20interesado%20en%20estudiar%20en%20CORPOAUTÓNOMA."
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 border",
                scrolled
                  ? "border-primary/20 text-primary hover:bg-primary/5"
                  : "border-white/30 text-white hover:bg-white/10"
              )}
            >
              <Phone className="w-4 h-4" />
              WhatsApp
            </a>
            <a
              href="#contacto"
              className="gradient-gold text-primary-dark font-bold px-6 py-2.5 rounded-xl text-sm hover:shadow-lg hover:shadow-gold/30 transition-all duration-300 animate-pulse-gold"
            >
              INSCRÍBETE AHORA
            </a>
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={cn(
              "lg:hidden p-2 rounded-lg transition-colors",
              scrolled ? "text-primary" : "text-white"
            )}
            aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-gray-100 glass"
          >
            <div className="px-4 py-6 space-y-2">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={() => {
                    setActiveLink(link.name);
                    setMobileOpen(false);
                  }}
                  className={cn(
                    "block px-4 py-3 rounded-xl text-sm font-medium transition-all",
                    activeLink === link.name
                      ? "bg-primary/10 text-primary"
                      : "text-gray-dark hover:bg-gray-50"
                  )}
                >
                  {link.name}
                </a>
              ))}
              <div className="pt-4 space-y-3">
                <a
                  href="https://wa.me/573153493730?text=Hola%2C%20estoy%20interesado%20en%20estudiar%20en%20CORPOAUTÓNOMA."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium border border-primary/20 text-primary w-full"
                >
                  <Phone className="w-4 h-4" />
                  WhatsApp
                </a>
                <a
                  href="#contacto"
                  onClick={() => setMobileOpen(false)}
                  className="gradient-gold text-primary-dark font-bold px-6 py-3 rounded-xl text-sm text-center block w-full"
                >
                  INSCRÍBETE AHORA
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
