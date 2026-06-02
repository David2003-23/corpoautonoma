"use client";

import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";

export default function WhatsAppButton() {
  return (
    <motion.a
      href="https://wa.me/573153493730?text=Hola%2C%20estoy%20interesado%20en%20estudiar%20en%20CORPOAUTÓNOMA."
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, type: "spring", stiffness: 200 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-green-500 text-white px-5 py-3.5 rounded-2xl shadow-xl hover:shadow-green-500/30 hover:bg-green-600 transition-all duration-300 group"
      aria-label="Contactar por WhatsApp"
    >
      <MessageCircle className="w-6 h-6" />
      <span className="hidden sm:inline text-sm font-medium max-w-0 group-hover:max-w-[200px] overflow-hidden transition-all duration-300 whitespace-nowrap">
        ¿Hablamos?
      </span>
    </motion.a>
  );
}
