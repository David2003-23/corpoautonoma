"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Send,
  Phone,
  Mail,
  MapPin,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { categories } from "@/data/programs";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    city: "",
    program: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const whatsappMessage = `Hola, soy ${formData.name}. Estoy interesado en el programa de ${formData.program || "información general"}. Mi correo es ${formData.email} y mi teléfono ${formData.phone}. Ciudad: ${formData.city}.`;

    await new Promise((r) => setTimeout(r, 1000));

    window.open(
      `https://wa.me/573153493730?text=${encodeURIComponent(whatsappMessage)}`,
      "_blank"
    );

    setLoading(false);
    setSubmitted(true);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const inputClasses =
    "w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white text-gray-dark placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all duration-300 text-sm";

  return (
    <section id="contacto" className="py-24 bg-white relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(ellipse_at_top_right,rgba(212,175,55,0.04)_0%,transparent_70%)]" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block text-gold-dark font-semibold text-sm tracking-widest uppercase mb-4">
            Contacto
          </span>
          <h2 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-bold text-primary mb-4">
            ¿Listo para iniciar tu futuro?
          </h2>
          <p className="text-gray-medium text-lg max-w-2xl mx-auto">
            Déjanos tus datos y un asesor se comunicará contigo para brindarte
            toda la información que necesitas.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center p-12 rounded-2xl bg-gray-light"
              >
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="font-heading font-semibold text-2xl text-primary mb-3">
                  ¡Mensaje enviado!
                </h3>
                <p className="text-gray-medium mb-6">
                  Gracias por contactarnos. Te estamos redirigiendo a WhatsApp
                  para continuar la conversación.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-gold-dark font-medium hover:text-gold transition-colors"
                >
                  Enviar otro mensaje
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-dark mb-1.5">
                      Nombre completo *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Tu nombre"
                      className={inputClasses}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-dark mb-1.5">
                      Correo electrónico *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="tu@correo.com"
                      className={inputClasses}
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-dark mb-1.5">
                      Teléfono *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+57 300 000 0000"
                      className={inputClasses}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-dark mb-1.5">
                      Ciudad
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      placeholder="Tu ciudad"
                      className={inputClasses}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-dark mb-1.5">
                    Programa de interés
                  </label>
                  <select
                    name="program"
                    value={formData.program}
                    onChange={handleChange}
                    className={inputClasses}
                  >
                    <option value="">Selecciona un programa</option>
                    {categories.map((cat) =>
                      cat.programs.map((prog) => (
                        <option key={prog.id} value={prog.title}>
                          {prog.title}
                        </option>
                      ))
                    )}
                    <option value="Inglés">Inglés</option>
                    <option value="Curso 3x1">Curso 3x1</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-dark mb-1.5">
                    Mensaje (opcional)
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Escribe tu mensaje aquí..."
                    rows={3}
                    className={`${inputClasses} resize-none`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex items-center justify-center gap-2 bg-primary text-white font-semibold px-8 py-4 rounded-2xl hover:bg-primary-light transition-all duration-300 shadow-lg shadow-primary/20 disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Enviar mensaje
                    </>
                  )}
                </button>
              </form>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="bg-gray-light rounded-2xl p-8">
              <h3 className="font-heading font-semibold text-xl text-primary mb-6">
                Información de contacto
              </h3>

              <div className="space-y-5">
                <a
                  href="https://wa.me/573153493730"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-4 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Phone className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-dark text-sm">WhatsApp</p>
                    <p className="text-gray-medium">+57 315 349 3730</p>
                  </div>
                </a>

                <a
                  href="mailto:info@corpoautonoma.edu.co"
                  className="flex items-start gap-4 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-dark text-sm">Correo</p>
                    <p className="text-gray-medium">info@corpoautonoma.edu.co</p>
                  </div>
                </a>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-dark text-sm">Dirección</p>
                    <p className="text-gray-medium">
                      Cartagena de Indias, Colombia
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-primary rounded-2xl p-8 text-center">
              <h3 className="font-heading font-semibold text-2xl text-white mb-3">
                ¿Prefieres una llamada?
              </h3>
              <p className="text-white/70 mb-6">
                Déjanos tu número y te contactamos
              </p>
              <a
                href="https://wa.me/573153493730?text=Hola%2C%20quiero%20recibir%20una%20llamada%20de%20información%20sobre%20CORPOAUTÓNOMA."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white text-primary font-semibold px-6 py-3 rounded-xl hover:shadow-lg transition-all"
              >
                <Phone className="w-4 h-4" />
                Solicitar llamada
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
