"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Award } from "lucide-react";
import { courses3x1 } from "@/data/programs";

export default function Courses3x1() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);

  return (
    <section className="py-24 gradient-primary relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.06)_0%,transparent_70%)]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gold/10 border border-gold/20 mb-6"
          >
            <Award className="w-5 h-5 text-gold" />
            <span className="text-gold font-bold font-heading text-lg">
              Aprende 3 habilidades por el precio de 1
            </span>
          </motion.div>

          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Cursos Cortos 3x1
          </h2>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            Especialízate en múltiples áreas con nuestra promoción exclusiva.
            Tres cursos, un solo precio.
          </p>
        </motion.div>
      </div>

      <div ref={containerRef} className="relative overflow-hidden">
        <motion.div style={{ x }} className="flex gap-6 px-4 sm:px-8 w-max">
          {[...courses3x1, ...courses3x1].map((course, i) => (
            <motion.div
              key={`${course.id}-${i}`}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group flex-shrink-0 w-48 sm:w-56"
            >
              <div className="relative rounded-2xl overflow-hidden bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
                <div className="h-40 overflow-hidden">
                  <div
                    className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-110"
                    style={{
                      backgroundImage:
                        "url('https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=2070&auto=format&fit=crop')",
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent" />
                </div>
                <div className="p-4">
                  <h3 className="font-heading font-semibold text-white text-sm text-center">
                    {course.name}
                  </h3>
                </div>
                <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/10 group-hover:ring-gold/30 transition-all" />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mt-12"
      >
        <a
          href="#contacto"
          className="group inline-flex items-center gap-2 gradient-gold text-primary-dark font-bold px-8 py-4 rounded-2xl text-lg hover:shadow-xl hover:shadow-gold/30 transition-all duration-300"
        >
          Ver Todos los Cursos
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </a>
      </motion.div>
    </section>
  );
}
