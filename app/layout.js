import { Analytics } from "@vercel/analytics/react";

import "../styles.css";
import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://www.ai-skills.xyz"),
  title: "AI Skills Hub",
  description: "Discover, filter, and compare curated AI skills from multiple sources.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
