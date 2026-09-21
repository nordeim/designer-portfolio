import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { SITE } from "@/lib/site-config";
import "./globals.css";

// Self-hosted Inter (next/font/local): the reference app loads Google Fonts
// CDN Inter v20 (variable woff2, latin subset). next/font/google fetched a
// build whose weights 300/500 run ~3% wider (canvas-measured: "Matcha,
// elevated" 243px vs the source's 236px), shifting page flow and text
// wrapping. The committed file is the source's exact gstatic woff2 (48256
// bytes, covers weights 300–700; see fonts/inter-OFL-LICENSE.txt — SIL OFL 1.1).
const inter = localFont({
  src: "./fonts/inter-var-latin.woff2",
  weight: "300 700",
  style: "normal",
  variable: "--font-inter",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// The source serves one social-preview image (its logo, filled 1200×630) on
// every route — replicate the intent with this site's own icon.svg (never a
// hotlink to the source's CDN).
const OG_IMAGE = { url: "/icon.svg", width: 1200, height: 630, type: "image/svg+xml" } as const;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: SITE.title,
    template: `%s | ${SITE.title}`,
  },
  description: SITE.description,
  keywords: ["graphic design", "brand identity", "portfolio", "Berlin", "Alex Moreau"],
  openGraph: {
    title: SITE.title,
    description: SITE.description,
    url: siteUrl,
    siteName: SITE.title,
    locale: "en_US",
    type: "website",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.title,
    description: SITE.description,
    images: ["/icon.svg"],
  },
  // Root canonical (session 28 parity): the reference serves
  // <link rel="canonical"> on every route, including the landing.
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  // PWA surface (session 28 parity): the source ships /manifest.json plus
  // the mobile-web-app-capable / apple status-bar / apple title metas.
  // appleWebApp.capable emits BOTH mobile-web-app-capable and
  // apple-mobile-web-app-capable.
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black",
    title: SITE.title,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F6F6F6" },
    { media: "(prefers-color-scheme: dark)", color: "#121212" },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrains.variable} font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          {children}
          <Toaster position="bottom-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
