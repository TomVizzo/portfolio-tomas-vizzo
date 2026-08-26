import type { Metadata } from "next";
import "./globals.css";

const siteUrl = "https://tomas-vizzo.tomasvizzo-re.chatgpt.site";
const siteDescription =
  "Asesor técnico comercial en Rosario, con experiencia en ventas B2B, desarrollo de cuentas, compras e inventarios industriales. Conocé mi trayectoria.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Tomás Vizzo | Asesor técnico comercial B2B en Rosario",
  description: siteDescription,
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Tomás Vizzo | Asesor técnico comercial B2B en Rosario",
    description: siteDescription,
    type: "website",
    url: "/",
    locale: "es_AR",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Tomás Vizzo — Asesor técnico comercial y Ventas B2B" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tomás Vizzo | Asesor técnico comercial B2B en Rosario",
    description: siteDescription,
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: `${siteUrl}/`,
      name: "Portfolio profesional de Tomás Vizzo",
      description: siteDescription,
      inLanguage: "es-AR",
      author: { "@id": `${siteUrl}/#person` },
    },
    {
      "@type": "ProfilePage",
      "@id": `${siteUrl}/#profile-page`,
      url: `${siteUrl}/`,
      name: "Perfil profesional de Tomás Vizzo",
      description: siteDescription,
      inLanguage: "es-AR",
      isPartOf: { "@id": `${siteUrl}/#website` },
      mainEntity: { "@id": `${siteUrl}/#person` },
    },
    {
      "@type": "Person",
      "@id": `${siteUrl}/#person`,
      name: "Tomás Vizzo",
      url: `${siteUrl}/`,
      image: `${siteUrl}/hero/tomas-vizzo-card-960.webp`,
      jobTitle: "Asesor técnico comercial B2B",
      mainEntityOfPage: { "@id": `${siteUrl}/#profile-page` },
      description:
        "Profesional de ventas B2B y desarrollo comercial con experiencia en asesoramiento técnico, compras e inventarios industriales.",
      homeLocation: {
        "@type": "Place",
        name: "Rosario, Santa Fe, Argentina",
      },
      sameAs: [
        "https://www.linkedin.com/in/tomasvizzo/",
        "https://www.instagram.com/tomivzz_/",
      ],
      knowsAbout: [
        "Ventas B2B industriales",
        "Desarrollo comercial",
        "Asesoramiento técnico industrial",
        "Gestión de cuentas",
        "Compras e inventarios industriales",
        "CRM",
        "KPIs",
        "Negociación",
      ],
      worksFor: {
        "@type": "Organization",
        name: "Ledesma Rodamientos SRL",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {children}
      </body>
    </html>
  );
}
