import { Globe, ExternalLink, Heart, MessageCircle, Share2 } from "lucide-react";

const footerLinks = [
  {
    title: "Oferta Académica",
    links: [
      { name: "Salud", href: "#oferta" },
      { name: "Administrativo", href: "#oferta" },
      { name: "Tecnología", href: "#oferta" },
      { name: "Turismo", href: "#oferta" },
      { name: "Industria", href: "#oferta" },
      { name: "Inglés", href: "#ingles" },
    ],
  },
  {
    title: "Enlaces Rápidos",
    links: [
      { name: "Inicio", href: "#inicio" },
      { name: "Nosotros", href: "#nosotros" },
      { name: "Oferta Académica", href: "#oferta" },
      { name: "Noticias", href: "#noticias" },
      { name: "Contacto", href: "#contacto" },
      { name: "Trabaja con nosotros", href: "#" },
    ],
  },
  {
    title: "Contacto",
    links: [
      { name: "+57 315 349 3730", href: "https://wa.me/573153493730" },
      { name: "info@corpoautonoma.edu.co", href: "mailto:info@corpoautonoma.edu.co" },
      { name: "Cartagena, Colombia", href: "#" },
    ],
  },
];

const socialLinks = [
  { icon: Globe, href: "#", label: "Facebook" },
  { icon: MessageCircle, href: "#", label: "Instagram" },
  { icon: Share2, href: "#", label: "YouTube" },
  { icon: ExternalLink, href: "#", label: "LinkedIn" },
];

export default function Footer() {
  return (
    <footer className="bg-primary text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <div className="mb-4">
              <img
                src="https://corpoautonoma.com/wp-content/uploads/2025/11/cropped-CORPOAUTONOMA-Logo2.png"
                alt="CORPOAUTÓNOMA"
                className="h-12 w-auto brightness-0 invert"
              />
            </div>
            <p className="text-white/60 text-sm leading-relaxed mb-6">
              Formación técnica laboral, cursos especializados e inglés.
              Más de 15 años transformando vidas a través de la educación.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-gold/20 hover:text-gold transition-all"
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {footerLinks.map((col) => (
            <div key={col.title}>
              <h4 className="font-heading font-semibold text-gold mb-4">
                {col.title}
              </h4>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-white/60 hover:text-gold text-sm transition-colors"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/40 text-xs text-center sm:text-left">
            &copy; {new Date().getFullYear()} CORPOAUTÓNOMA. Todos los derechos reservados.
          </p>
          <p className="text-white/40 text-xs flex items-center gap-1">
            Hecho con <Heart className="w-3 h-3 text-gold" /> en Cartagena
          </p>
        </div>
      </div>
    </footer>
  );
}
