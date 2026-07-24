import "@xyflow/react/dist/style.css";
import "./globals.css";

export const metadata = {
  title: "Online AI Masterclass — Inside RAG | Moslem Ajra",
  description:
    "An interactive RAG engineering masterclass created by Moslem Ajra for a Saudi audience on July 29, 2026.",
  authors: [{ name: "Moslem Ajra" }],
  creator: "Moslem Ajra",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
