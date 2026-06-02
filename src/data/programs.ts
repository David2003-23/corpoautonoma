export interface Program {
  id: string;
  title: string;
  description: string;
  duration: string;
  modality: string;
  category: string;
  image: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  programs: Program[];
}

export const categories: Category[] = [
  {
    id: "salud",
    name: "Salud",
    icon: "/placeholder.svg",
    programs: [
      {
        id: "aux-enfermeria",
        title: "Auxiliar en Enfermería",
        description: "Formación integral para brindar cuidados básicos de enfermería en instituciones de salud, con énfasis en atención humanizada y procedimientos clínicos.",
        duration: "12 meses",
        modality: "Presencial",
        category: "Salud",
        image: "/placeholder.svg",
      },
      {
        id: "aux-admin-salud",
        title: "Auxiliar Administrativo en Salud",
        description: "Capacitación en gestión administrativa del sector salud, incluyendo facturación, archivo clínico y atención al usuario.",
        duration: "6 meses",
        modality: "Presencial",
        category: "Salud",
        image: "/placeholder.svg",
      },
      {
        id: "salud-oral",
        title: "Salud Oral",
        description: "Formación en promoción de salud oral, asistencia en odontología general y especializada, y educación preventiva.",
        duration: "12 meses",
        modality: "Presencial",
        category: "Salud",
        image: "/placeholder.svg",
      },
      {
        id: "serv-farmaceuticos",
        title: "Servicios Farmacéuticos",
        description: "Preparación para la gestión y dispensación de medicamentos, atención farmacéutica básica y control de inventarios.",
        duration: "6 meses",
        modality: "Presencial",
        category: "Salud",
        image: "/placeholder.svg",
      },
    ],
  },
  {
    id: "administrativo",
    name: "Administrativo",
    icon: "/placeholder.svg",
    programs: [
      {
        id: "aux-contable",
        title: "Auxiliar Contable y Financiero",
        description: "Formación en procesos contables, registro de operaciones financieras, liquidación de impuestos y herramientas contables digitales.",
        duration: "12 meses",
        modality: "Presencial / Virtual",
        category: "Administrativo",
        image: "/placeholder.svg",
      },
      {
        id: "asis-administrativa",
        title: "Asistencia Administrativa",
        description: "Desarrollo de competencias en gestión documental, atención al cliente, organización de eventos y soporte administrativo integral.",
        duration: "6 meses",
        modality: "Presencial / Virtual",
        category: "Administrativo",
        image: "/placeholder.svg",
      },
      {
        id: "gestion-documental",
        title: "Gestión Documental",
        description: "Capacitación en organización, clasificación y archivo de documentos físicos y digitales, con normativa actualizada.",
        duration: "6 meses",
        modality: "Presencial / Virtual",
        category: "Administrativo",
        image: "/placeholder.svg",
      },
    ],
  },
  {
    id: "tecnologia",
    name: "Tecnología",
    icon: "/placeholder.svg",
    programs: [
      {
        id: "sistemas",
        title: "Sistemas",
        description: "Formación en soporte técnico, mantenimiento de equipos, redes básicas y herramientas ofimáticas avanzadas.",
        duration: "12 meses",
        modality: "Presencial",
        category: "Tecnología",
        image: "/placeholder.svg",
      },
      {
        id: "marketing-redes",
        title: "Marketing y Redes Sociales",
        description: "Estrategias de marketing digital, creación de contenido, community management y publicidad en redes sociales.",
        duration: "6 meses",
        modality: "Virtual",
        category: "Tecnología",
        image: "/placeholder.svg",
      },
      {
        id: "mercadeo-ventas",
        title: "Mercadeo y Ventas",
        description: "Técnicas de ventas, negociación, atención al cliente y estrategias de mercadeo para el entorno empresarial actual.",
        duration: "6 meses",
        modality: "Presencial / Virtual",
        category: "Tecnología",
        image: "/placeholder.svg",
      },
    ],
  },
  {
    id: "turismo",
    name: "Turismo y Servicios",
    icon: "/placeholder.svg",
    programs: [
      {
        id: "guia-turistico",
        title: "Guía Turístico",
        description: "Formación en atención al turista, historia y cultura local, idiomas y manejo de grupos turísticos.",
        duration: "6 meses",
        modality: "Presencial",
        category: "Turismo y Servicios",
        image: "/placeholder.svg",
      },
      {
        id: "hoteleria",
        title: "Hotelería",
        description: "Gestión hotelera, recepción, reservas, atención al huésped y operaciones de alojamiento.",
        duration: "6 meses",
        modality: "Presencial",
        category: "Turismo y Servicios",
        image: "/placeholder.svg",
      },
      {
        id: "mesa-bar",
        title: "Mesa y Bar",
        description: "Técnicas de servicio en restaurante, coctelería, etiqueta y atención al comensal de alto nivel.",
        duration: "6 meses",
        modality: "Presencial",
        category: "Turismo y Servicios",
        image: "/placeholder.svg",
      },
      {
        id: "atencion-cliente",
        title: "Atención al Cliente",
        description: "Habilidades en servicio al cliente, comunicación efectiva, resolución de conflictos y experiencia del usuario.",
        duration: "3 meses",
        modality: "Presencial / Virtual",
        category: "Turismo y Servicios",
        image: "/placeholder.svg",
      },
    ],
  },
  {
    id: "industria",
    name: "Industria",
    icon: "/placeholder.svg",
    programs: [
      {
        id: "logistica",
        title: "Logística y Transporte",
        description: "Gestión de cadenas de suministro, inventarios, transporte y distribución de mercancías.",
        duration: "6 meses",
        modality: "Presencial",
        category: "Industria",
        image: "/placeholder.svg",
      },
      {
        id: "instrumentacion",
        title: "Instrumentación Industrial",
        description: "Formación en medición, control de procesos industriales, automatización básica y mantenimiento instrumental.",
        duration: "12 meses",
        modality: "Presencial",
        category: "Industria",
        image: "/placeholder.svg",
      },
      {
        id: "sst",
        title: "Seguridad y Salud en el Trabajo",
        description: "Prevención de riesgos laborales, normativa SST, elaboración de planes de emergencia y promoción de la salud ocupacional.",
        duration: "12 meses",
        modality: "Presencial / Virtual",
        category: "Industria",
        image: "/placeholder.svg",
      },
    ],
  },
  {
    id: "justicia",
    name: "Justicia",
    icon: "/placeholder.svg",
    programs: [
      {
        id: "criminalistica",
        title: "Criminalística e Investigación Judicial",
        description: "Técnicas de investigación criminal, análisis de escenas del crimen, recolección de evidencia y procedimientos judiciales.",
        duration: "12 meses",
        modality: "Presencial",
        category: "Justicia",
        image: "/placeholder.svg",
      },
    ],
  },
  {
    id: "moda",
    name: "Moda y Belleza",
    icon: "/placeholder.svg",
    programs: [
      {
        id: "diseno-moda",
        title: "Diseño de Modas",
        description: "Creación de colecciones, patronaje, confección, tendencias de moda y gestión de marca personal.",
        duration: "12 meses",
        modality: "Presencial",
        category: "Moda y Belleza",
        image: "/placeholder.svg",
      },
      {
        id: "belleza-estilo",
        title: "Belleza y Estilo",
        description: "Servicios de estética integral, maquillaje profesional, cuidado capilar, facial y corporal.",
        duration: "6 meses",
        modality: "Presencial",
        category: "Moda y Belleza",
        image: "/placeholder.svg",
      },
    ],
  },
];

export const courses3x1 = [
  { id: "barberia", name: "Barbería", image: "/placeholder.svg" },
  { id: "excel", name: "Excel", image: "/placeholder.svg" },
  { id: "panaderia", name: "Panadería", image: "/placeholder.svg" },
  { id: "montacargas", name: "Montacargas", image: "/placeholder.svg" },
  { id: "tatuaje", name: "Tatuaje", image: "/placeholder.svg" },
  { id: "fotografia", name: "Fotografía", image: "/placeholder.svg" },
  { id: "facturacion", name: "Facturación Hospitalaria", image: "/placeholder.svg" },
  { id: "gestion-doc", name: "Gestión Documental", image: "/placeholder.svg" },
  { id: "belleza", name: "Belleza", image: "/placeholder.svg" },
  { id: "peluqueria", name: "Peluquería Canina", image: "/placeholder.svg" },
];

export const englishModalities = [
  { name: "Semi Intensivo", description: "2 horas diarias, 3 días a la semana. Perfecto para quienes tienen horarios ocupados.", icon: "Clock" },
  { name: "Intensivo", description: "4 horas diarias, 5 días a la semana. Aprendizaje acelerado con inmersión total.", icon: "Zap" },
  { name: "Sabatino", description: "Clases los sábados. Ideal para quienes trabajan o estudian entre semana.", icon: "Calendar" },
  { name: "Sabatino Niños", description: "Programa especializado para niños los sábados. Aprendizaje lúdico y dinámico.", icon: "Heart" },
];

export const testimonials = [
  {
    id: 1,
    name: "María Fernanda López",
    program: "Auxiliar en Enfermería",
    opinion: "CORPOAUTÓNOMA me dio las herramientas y la confianza para iniciar mi carrera en el sector salud. Los profesores son excelentes y las prácticas profesionales fueron clave.",
    image: "/placeholder.svg",
    rating: 5,
  },
  {
    id: 2,
    name: "Carlos Andrés Pérez",
    program: "Marketing y Redes Sociales",
    opinion: "Gracias a la formación en marketing digital pude emprender mi propio negocio. La modalidad virtual me permitió estudiar mientras trabajaba.",
    image: "/placeholder.svg",
    rating: 5,
  },
  {
    id: 3,
    name: "Ana Sofía Martínez",
    program: "Inglés Intensivo",
    opinion: "El programa de inglés transformó mi vida laboral. En menos de 6 meses pude comunicarme fluidamente y conseguí un mejor empleo.",
    image: "/placeholder.svg",
    rating: 5,
  },
  {
    id: 4,
    name: "Jorge Luis Torres",
    program: "Diseño de Modas",
    opinion: "La formación en diseño de modas superó mis expectativas. Los talleres prácticos y la pasarela de graduación fueron experiencias inolvidables.",
    image: "/placeholder.svg",
    rating: 5,
  },
];

export const stats = [
  { value: "+15", label: "Años de experiencia" },
  { value: "+5000", label: "Estudiantes formados" },
  { value: "+30", label: "Programas académicos" },
  { value: "92%", label: "Empleabilidad" },
];
