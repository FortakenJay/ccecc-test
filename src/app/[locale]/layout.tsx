// src/app/[locale]/layout.tsx
import "../globals.css";

import { hasLocale, NextIntlClientProvider } from "next-intl";
import { routing } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCommentDots } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// Next.js SEO metadata with Chinese version
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params; // Added await here

  const titles: Record<string, string> = {
    en: "Centro Cultural Chino CR",
    es: "Centro Cultural Chino CR",
    zh: "哥斯达黎加中华文化中心", 
  };

  const descriptions: Record<string, string> = {
    en: "Centro Cultural Chino Costa Rica – Art courses, Chinese classes and more",
    es: "Centro Cultural Chino Costa Rica – Cursos de arte, clases de chino y más",
    zh: "哥斯达黎加中华文化中心 – 艺术课程、中文课程及更多活动",
  };

  return {
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
    icons: {
      icon: "/favicon.ico",
    },
    openGraph: {
      title: titles[locale] || titles.en,
      description: descriptions[locale] || descriptions.en,
      type: "website",
      url: "https://centroculturalchinocr.com",
      images: ["/favicon.ico"], 
    },
    twitter: {
      card: "summary_large_image",
      title: titles[locale] || titles.en,
      description: descriptions[locale] || descriptions.en,
      images: ["/favicon.ico"], 
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = (await import(`@/locales/${locale}/translation`)).default;

  return (
    <html lang={locale}>
      <body>
        <div className="flex flex-col min-h-screen w-full ">
          <NextIntlClientProvider locale={locale} messages={messages}>
            <Navigation />

            <main className="grow">{children}</main>

            <Footer />

            {/* WhatsApp Floating Button */}
            <Link
              href="https://wa.me/50600000000"
              target="_blank"
              rel="noopener noreferrer"
              className="fixed bottom-6 right-6 bg-[#25D366] text-white rounded-full p-4 shadow-lg hover:scale-110 transition-transform z-50"
              aria-label="Contact us on WhatsApp"
            >
              <FontAwesomeIcon icon={faCommentDots} className="w-6 h-6" />
            </Link>
          </NextIntlClientProvider>
        </div>
      </body>
    </html>
  );
}