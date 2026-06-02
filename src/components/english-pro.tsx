"use client";

import { motion } from "framer-motion";
import { CheckCircle, ArrowRight, Clock, Zap, Calendar, Heart } from "lucide-react";
import { englishModalities } from "@/data/programs";

const iconMap: Record<string, React.ReactNode> = {
  Clock: <Clock className="w-6 h-6" />,
  Zap: <Zap className="w-6 h-6" />,
  Calendar: <Calendar className="w-6 h-6" />,
  Heart: <Heart className="w-6 h-6" />,
};

const features = [
  "Certificación internacional",
  "Conversación práctica",
  "Docentes especializados",
  "Horarios flexibles",
];

export default function EnglishPro() {
  return (
    <section className="py-24 bg-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,175,55,0.05)_0%,transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(10,42,102,0.03)_0%,transparent_70%)]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-block text-gold-dark font-semibold text-sm tracking-widest uppercase mb-4">
              English Pro
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-primary mb-6">
              Domina el inglés y abre puertas al mundo
            </h2>
            <p className="text-gray-medium text-lg mb-8 leading-relaxed">
              Programa de inglés con metodología comunicativa. Aprende de manera
              práctica con docentes nativos y bilingües certificados.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-10">
              {features.map((feat, i) => (
                <motion.div
                  key={feat}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <CheckCircle className="w-5 h-5 text-gold flex-shrink-0" />
                  <span className="text-gray-dark text-sm font-medium">{feat}</span>
                </motion.div>
              ))}
            </div>

            <a
              href="#contacto"
              className="group inline-flex items-center gap-2 gradient-gold text-primary-dark font-bold px-8 py-4 rounded-2xl text-lg hover:shadow-xl hover:shadow-gold/30 transition-all duration-300"
            >
              Quiero Aprender Inglés
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {englishModalities.map((mod, i) => (
              <motion.div
                key={mod.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group p-6 rounded-2xl border border-gray-100 bg-white hover:border-gold/30 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/5 text-primary flex items-center justify-center mb-4 group-hover:bg-gold/10 group-hover:text-gold-dark transition-colors">
                  {iconMap[mod.icon] || <Clock className="w-6 h-6" />}
                </div>
                <h3 className="font-heading font-semibold text-lg text-primary mb-2">
                  {mod.name}
                </h3>
                <p className="text-gray-medium text-sm leading-relaxed">
                  {mod.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
