"use client";

import { motion } from "framer-motion";
import { Shield, GraduationCap, Briefcase, Target } from "lucide-react";

const values = [
  {
    icon: <GraduationCap className="w-6 h-6" />,
    title: "Excelencia Académica",
    description:
      "Formación de calidad con docentes especializados y planes de estudio actualizados.",
  },
  {
    icon: <Briefcase className="w-6 h-6" />,
    title: "Enfoque Laboral",
    description:
      "Programas diseñados para insertarte rápidamente en el mercado laboral.",
  },
  {
    icon: <Target className="w-6 h-6" />,
    title: "Formación Práctica",
    description:
      "Aprendizaje basado en prácticas reales y convenios empresariales.",
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "Certificación Oficial",
    description:
      "Títulos con validez oficial que abren puertas en el mundo laboral.",
  },
];

export default function About() {
  return (
    <section id="nosotros" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-block text-gold-dark font-semibold text-sm tracking-widest uppercase mb-4">
              Sobre Nosotros
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-primary mb-6">
              Más de 15 años formando profesionales para el trabajo
            </h2>
            <p className="text-gray-medium text-lg leading-relaxed mb-6">
              En CORPOAUTÓNOMA creemos en el poder transformador de la
              educación. Desde Cartagena, hemos formado a más de 5,000
              estudiantes que hoy son profesionales exitosos en diferentes
              sectores productivos del país.
            </p>
            <p className="text-gray-medium text-lg leading-relaxed mb-8">
              Nuestro compromiso es ofrecer una educación accesible, práctica y
              de calidad, que responda a las necesidades reales del mercado
              laboral colombiano.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="#contacto"
                className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-light transition-all"
              >
                Conoce más
              </a>
              <a
                href="https://wa.me/573153493730?text=Hola%2C%20quiero%20información%20sobre%20CORPOAUTÓNOMA."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border-2 border-primary text-primary font-semibold px-6 py-3 rounded-xl hover:bg-primary/5 transition-all"
              >
                Habla con nosotros
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-xl">
              <img
                src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070&auto=format&fit=crop"
                alt="CORPOAUTÓNOMA"
                className="w-full h-80 sm:h-96 object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/30 to-transparent" />
            </div>
            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-gold/10 rounded-2xl -z-10" />
            <div className="absolute -top-6 -right-6 w-32 h-32 bg-primary/5 rounded-2xl -z-10" />
          </motion.div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((val, i) => (
            <motion.div
              key={val.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-6 rounded-2xl bg-gray-light hover:bg-white hover:shadow-md border border-gray-100 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/5 text-primary flex items-center justify-center mb-4 group-hover:bg-gold/10 group-hover:text-gold-dark transition-colors">
                {val.icon}
              </div>
              <h3 className="font-heading font-semibold text-lg text-primary mb-2">
                {val.title}
              </h3>
              <p className="text-gray-medium text-sm leading-relaxed">
                {val.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
