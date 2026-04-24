import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "Le Carnet des noces — Mariage dans le Roussillon",
  description:
    "Un carnet d'adresses de confiance, une to-do personnalisée, des paiements sécurisés. Composez votre mariage dans les Pyrénées-Orientales avec les meilleurs artisans du Roussillon.",
  keywords: ["mariage", "roussillon", "pyrénées-orientales", "prestataires mariage", "perpignan"],
  openGraph: {
    title: "Le Carnet des noces",
    description: "Votre mariage, orchestré avec délicatesse. Roussillon & Pyrénées-Orientales.",
    locale: "fr_FR",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Jost:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
