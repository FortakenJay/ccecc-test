// src/components/Navigation.tsx
"use client";

import {Link, usePathname, useRouter} from "@/i18n/navigation";
import {useState} from "react";
import {useTranslations, useLocale} from "next-intl";
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faBars, faXmark, faGlobe} from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";

export default function Navigation() {
    const t = useTranslations("nav");
    const pathname = usePathname();
    const router = useRouter();
    const locale = useLocale();
    const [mobileMenuOpen,
        setMobileMenuOpen] = useState(false);

    const navItems = [
        {
            href: "/",
            label: t("home")
        }, {
            href: "/clases",
            label: t("classes")
        }, {
            href: "/hsk",
            label: "HSK"
        }, {
            href: "/blog",
            label: "Blog"
        }, {
            href: "/nosotros",
            label: t("about")
        }
    ];

    const isActive = (href : string) => {
        if (href === "/") {
            return pathname === "/";
        }
        return pathname.startsWith(href);
    };

    const toggleLanguage = () => {
        const languages = ['es', 'en', 'zh']as const;
        const currentIndex = languages.indexOf(locale as typeof languages[number]);
        const nextIndex = (currentIndex + 1) % languages.length;
        router.replace(pathname, {locale: languages[nextIndex]});
    };

    const getLanguageDisplay = () => {
        switch (locale) {
            case 'es':
                return 'ES';
            case 'en':
                return 'EN';
            case 'zh':
                return '中文';
            default:
                return 'ES';
        }
    };

    return (
        <nav className="bg-white shadow-md sticky top-0 z-40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-20">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-15 h-15 relative">
                            <Image
                                src="/favicon.ico"
                                alt="CCECC Logo"
                                fill
                                className="object-contain rounded-full"/>
                        </div>
                        <div className="hidden sm:block">
                            <div className="text-[#C8102E] font-bold text-xl">CCECC</div>
                            <div className="text-xs text-gray-600 leading-tight">
                                <div>Centro Cultural y Educativo</div>
                                <div>
                                    Costarricense Chino</div>
                            </div>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`relative py-2 transition-colors ${isActive(item.href)
                                ? "text-[#C8102E]"
                                : "text-gray-700 hover:text-[#C8102E]"}`}>
                                {item.label}
                                {isActive(item.href) && (<div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#FFD700]"/>)}
                            </Link>
                        ))}
                    </div>

                    {/* Right Side - Language Switcher & CTA */}
                    <div className="hidden md:flex items-center gap-4">
                        <button
                            onClick={toggleLanguage}
                            className="flex items-center hover:cursor-pointer gap-2 px-3 py-2 rounded-lg border-2 border-[#C8102E] text-[#C8102E] hover:bg-[#C8102E] hover:text-white transition-colors"
                            aria-label="Toggle language">
                            <FontAwesomeIcon icon={faGlobe} className="w-4 h-4"/>
                            <span className="text-sm font-medium uppercase">{getLanguageDisplay()}</span>
                        </button>
                        <button
                            className="bg-linear-to-r hover:cursor-pointer from-[#C8102E] to-[#B00E29] hover:from-[#B00E29] hover:to-[#A00C26] text-white font-medium px-6 py-2.5 rounded-lg transition-all shadow-sm hover:shadow-md">
                            {t("enroll")}
                        </button>
                    </div>

                    {/* Mobile menu button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2"
                        aria-label="Toggle menu">
                        {mobileMenuOpen
                            ? (<FontAwesomeIcon icon={faXmark} className="w-6 h-6 text-gray-700"/>)
                            : (<FontAwesomeIcon icon={faBars} className="w-6 h-6 text-gray-700"/>)}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation */}
            {mobileMenuOpen && (
                <div className="md:hidden bg-white border-t">
                    <div className="px-4 py-4 space-y-3">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`block py-2 px-4 rounded font-medium ${isActive(item.href)
                                ? "bg-[#C8102E] text-white"
                                : "text-gray-700 hover:bg-gray-100"}`}>
                                {item.label}
                            </Link>
                        ))}
                        <div className="pt-3 border-t flex items-center justify-between">
                            <button
                                onClick={toggleLanguage}
                                className="flex  items-center gap-2 px-3 py-2 rounded-lg border-2 border-[#C8102E] text-[#C8102E] hover:bg-[#C8102E] hover:text-white transition-colors">
                                <FontAwesomeIcon icon={faGlobe} className="w-4 h-4"/>
                                <span className="text-sm font-medium uppercase">{getLanguageDisplay()}</span>
                            </button>
                            <button
                                className="bg-linear-to-r  from-[#C8102E] to-[#B00E29] text-white font-medium px-4 py-2 rounded-lg shadow-sm">
                                {t("enroll")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}