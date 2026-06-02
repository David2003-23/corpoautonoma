"use client";

import { motion } from "framer-motion";
import { BadgePercent, Award, Gift, ArrowRight } from "lucide-react";

const offers = [
  {
    icon: <Award className="w-8 h-8" />,
    title: "Becas Institucionales",
    description:
      "Becas por excelencia académica para estudiantes destacados. Hasta el 50% de descuento en tu programa.",
    color: "from-amber-400 to-yellow-500",
    bgColor: "bg-amber-50",
    textColor: "text-amber-700",
  },
  {
    icon: <BadgePercent className="w-8 h-8" />,
    title: "Descuentos Especiales",
    description:
      "Descuentos por pronto pago, convenios empresariales y grupos familiares. Pregunta por nuestras promociones.",
    color: "from-blue-400 to-indigo-500",
    bgColor: "bg-blue-50",
    textColor: "text-blue-700",
  },
  {
    icon: <Gift className="w-8 h-8" />,
    title: "Promociones Exclusivas",
    description:
      "3x1 en cursos cortos, financiación sin intereses y matrícula gratis en programas seleccionados.",
    color: "from-emerald-400 to-green-500",
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-700",
  },
];

export default function Scholarships() {
  return (
    <section className="py-24 bg-gray-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block text-gold-dark font-semibold text-sm tracking-widest uppercase mb-4">
            Becas y Ofertas
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-primary mb-4">
            Tu inversión en educación
          </h2>
          <p className="text-gray-medium text-lg max-w-2xl mx-auto">
            Hacemos la educación accesible con becas, descuentos y promociones
            especiales para ti.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {offers.map((offer, i) => (
            <motion.div
              key={offer.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
            >
              <div
                className={`w-16 h-16 rounded-2xl ${offer.bgColor} flex items-center justify-center mb-6 ${offer.textColor} group-hover:scale-110 transition-transform duration-300`}
              >
                {offer.icon}
              </div>
              <h3 className="font-heading font-semibold text-xl text-primary mb-3">
                {offer.title}
              </h3>
              <p className="text-gray-medium leading-relaxed mb-6">
                {offer.description}
              </p>
              <a
                href="#contacto"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-light transition-colors"
              >
                Conocer más
                <ArrowRight className="w-4 h-4" />
              </a>
              <div
                className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${offer.color} opacity-0 group-hover:opacity-5 rounded-bl-[4rem] transition-opacity`}
              />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <a
            href="#contacto"
            className="group inline-flex items-center gap-2 bg-primary text-white font-semibold px-8 py-4 rounded-2xl hover:bg-primary-light transition-all duration-300 shadow-lg shadow-primary/20"
          >
            Solicitar Información de Becas
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
