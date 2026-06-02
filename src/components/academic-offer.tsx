"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Clock, Monitor, ArrowRight, Search, X } from "lucide-react";
import { categories, type Category, type Program } from "@/data/programs";

function ProgramCard({ program, index }: { program: Program; index: number }) {
  const categoryColors: Record<string, string> = {
    Salud: "from-green-500 to-emerald-600",
    Administrativo: "from-blue-500 to-indigo-600",
    Tecnología: "from-purple-500 to-violet-600",
    "Turismo y Servicios": "from-amber-500 to-orange-600",
    Industria: "from-red-500 to-rose-600",
    Justicia: "from-slate-600 to-gray-700",
    "Moda y Belleza": "from-pink-500 to-fuchsia-600",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ delay: index * 0.05, duration: 0.5 }}
      className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100"
    >
      <div className="relative h-48 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1524178232363-1fb2b075b655?q=80&w=2070&auto=format&fit=crop')",
          }}
        />
        <div className={`absolute inset-0 bg-gradient-to-t ${categoryColors[program.category] || "from-primary"} opacity-80`} />
        <div className="absolute bottom-4 left-4 right-4">
          <span className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-medium">
            {program.category}
          </span>
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-heading font-semibold text-lg text-primary mb-2 group-hover:text-primary-light transition-colors">
          {program.title}
        </h3>
        <p className="text-gray-medium text-sm leading-relaxed mb-4 line-clamp-2">
          {program.description}
        </p>
        <div className="flex items-center gap-4 mb-4 text-xs text-gray-medium">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {program.duration}
          </span>
          <span className="flex items-center gap-1">
            <Monitor className="w-3.5 h-3.5" />
            {program.modality}
          </span>
        </div>
        <a
          href="#contacto"
          className="inline-flex items-center gap-1 text-sm font-medium text-gold-dark hover:text-gold transition-colors group/link"
        >
          Solicitar Información
          <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
        </a>
      </div>
    </motion.div>
  );
}

export default function AcademicOffer() {
  const [activeCategory, setActiveCategory] = useState<string>(categories[0].id);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const allPrograms = useMemo(
    () => categories.flatMap((cat) => cat.programs),
    []
  );

  const filteredPrograms = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    return allPrograms.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }, [searchQuery, allPrograms]);

  const currentCategory = categories.find((c) => c.id === activeCategory);
  const displayPrograms = filteredPrograms ?? (currentCategory?.programs ?? []);
  const isSearching = searchQuery.trim().length > 0;

  return (
    <section id="oferta" className="py-24 bg-gray-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-block text-gold-dark font-semibold text-sm tracking-widest uppercase mb-4">
            Oferta Académica
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-primary mb-4">
            Programas Técnicos Laborales
          </h2>
          <p className="text-gray-medium text-lg max-w-2xl mx-auto mb-8">
            Más de 30 programas diseñados para impulsar tu carrera profesional
            con formación práctica y certificada.
          </p>

          <div className="max-w-lg mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar programa..."
              className="w-full pl-11 pr-10 py-3.5 rounded-2xl border border-gray-200 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold text-sm transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        </motion.div>

        {!isSearching && (
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                onMouseEnter={() => setHoveredCategory(cat.id)}
                onMouseLeave={() => setHoveredCategory(null)}
                className={`relative px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${
                  activeCategory === cat.id
                    ? "bg-primary text-white shadow-lg shadow-primary/25"
                    : "bg-white text-gray-dark hover:bg-primary/5 border border-gray-200"
                }`}
              >
                {cat.name}
                {hoveredCategory === cat.id && activeCategory !== cat.id && (
                  <motion.div
                    layoutId="categoryHover"
                    className="absolute inset-0 rounded-xl bg-primary/5"
                  />
                )}
              </button>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={isSearching ? "search" : activeCategory}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {displayPrograms.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {displayPrograms.map((program, index) => (
                  <ProgramCard key={program.id} program={program} index={index} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-medium text-lg">
                  No encontramos &quot;{searchQuery}&quot;
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  Intenta con otro término
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <a
            href="#contacto"
            className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-8 py-4 rounded-2xl hover:bg-primary-light transition-all duration-300 shadow-lg shadow-primary/20"
          >
            Quiero Más Información
            <ChevronRight className="w-5 h-5" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
