"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ChevronDown, ArrowRight, Info } from "lucide-react";

export default function Hero() {
  const parallaxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (parallaxRef.current) {
        const scrollY = window.scrollY;
        parallaxRef.current.style.transform = `translateY(${scrollY * 0.3}px)`;
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section id="inicio" className="relative min-h-[70vh] sm:min-h-[80vh] flex items-center overflow-hidden pt-20">
      <div ref={parallaxRef} className="absolute inset-0 -top-32 -bottom-32">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-110"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1523050854058-8df90110c7f1?q=80&w=2070&auto=format&fit=crop')",
          }}
        />
        <div className="absolute inset-0 gradient-overlay" />
      </div>

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.08)_0%,transparent_70%)]" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8"
          >
            <span className="w-2 h-2 bg-gold rounded-full animate-pulse" />
            <span className="text-white/90 text-sm font-medium">
              Más de 15 años formando profesionales
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.7, ease: "easeOut" }}
            className="font-heading text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4"
          >
            <span className="text-white">Tu futuro laboral</span>
            <br />
            <span className="text-gradient">empieza aquí</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7, ease: "easeOut" }}
            className="text-white/80 text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-8 font-light"
          >
            Formación técnica laboral, cursos especializados e inglés.
            Aprende con los mejores y transforma tu vida profesional.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.7, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <a
              href="#contacto"
              className="group inline-flex items-center gap-2 gradient-gold text-primary-dark font-bold px-8 py-4 rounded-2xl text-lg hover:shadow-xl hover:shadow-gold/30 transition-all duration-300"
            >
              Solicitar Información
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              href="#oferta"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-lg font-medium text-white border-2 border-white/30 hover:bg-white/10 transition-all duration-300"
            >
              Ver Programas
              <ChevronDown className="w-5 h-5" />
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.7, ease: "easeOut" }}
            className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto"
          >
            {[
              { value: "+15", label: "Años" },
              { value: "+5000", label: "Estudiantes" },
              { value: "+30", label: "Programas" },
              { value: "92%", label: "Empleabilidad" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="text-center p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10"
              >
                <div className="font-heading text-2xl sm:text-3xl font-bold text-gold mb-1">
                  {stat.value}
                </div>
                <div className="text-white/70 text-sm">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className="w-6 h-6 text-white/50" />
        </motion.div>
      </motion.div>
    </section>
  );
}
