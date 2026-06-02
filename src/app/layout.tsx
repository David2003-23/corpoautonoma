import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CORPOAUTÓNOMA | Corporación Educativa Autónoma de Cartagena",
  description:
    "Formación técnica laboral, cursos especializados e inglés en Cartagena. Más de 15 años formando profesionales para el trabajo. ¡Inscríbete ahora!",
  keywords: [
    "educación para el trabajo",
    "formación técnica laboral",
    "cursos en Cartagena",
    "inglés en Cartagena",
    "CORPOAUTÓNOMA",
    "auxiliar enfermería",
    "cursos certificados",
  ],
  openGraph: {
    title: "CORPOAUTÓNOMA | Tu futuro laboral empieza aquí",
    description:
      "Formación técnica laboral, cursos especializados e inglés en Cartagena.",
    type: "website",
    locale: "es_CO",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${poppins.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
