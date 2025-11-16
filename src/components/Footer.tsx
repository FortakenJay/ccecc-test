import {Input} from './ui/input';
import {Button} from './ui/button';
import {useTranslations} from "next-intl";

import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {faFacebookF, faInstagram} from "@fortawesome/free-brands-svg-icons";

import {faEnvelope, faMapPin, faPhone} from "@fortawesome/free-solid-svg-icons";
import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
    const t = useTranslations("footer");

    return (
        <footer
            className="bg-linear-to-br from-gray-900 to-gray-800 text-white ">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* About */}
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-15 h-15 relative">
                                <Image
                                    src="/favicon.ico"
                                    alt="CCECC Logo"
                                    fill
                                    className="object-contain rounded-full"/>
                            </div>
                            <div className="hidden sm:block">
                                <div className="text-yellow-400 font-bold text-xl">CCECC</div>
                                <div className="text-xs text-gray-300">Centro Cultural Chino</div>
                            </div>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed">
                            {t('description')}
                        </p>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-[#FFD700] mb-4">{t('contact')}</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex items-start gap-2">
                                <FontAwesomeIcon
                                    icon={faMapPin}
                                    className="w-4 h-4 mt-1 text-[#FFD700] flex-shrink-0"/>
                                <span className="text-gray-300">{t('location')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FontAwesomeIcon icon={faPhone} className="w-4 h-4 text-[#FFD700]"/>
                                <span className="text-gray-300">+506 2222-3333</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4 text-[#FFD700]"/>
                                <span className="text-gray-300">info@ccecc.cr</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-[#FFD700] mb-4">{t('quickLinks')}</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link
                                    href="/clases"
                                    className="text-gray-300 hover:text-[#FFD700] transition-colors">
                                    {t('chineseClasses')}
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/hsk"
                                    className="text-gray-300 hover:text-[#FFD700] transition-colors">
                                    {t('hskExam')}
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/eventos"
                                    className="text-gray-300 hover:text-[#FFD700] transition-colors">
                                    {t('culturalEvents')}
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/nosotros"
                                    className="text-gray-300 hover:text-[#FFD700] transition-colors">
                                    {t('aboutUs')}
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div>
                        <h3 className="text-[#FFD700] mb-4">{t('newsletter')}</h3>
                        <p className="text-gray-300 text-sm mb-4">
                            {t('newsletterDesc')}
                        </p>
                        <div className="flex gap-2">
                            <Input
                                type="email"
                                placeholder={t('emailPlaceholder')}
                                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"/>
                            <Button
                                className="bg-[#C8102E] hover:cursor-pointer hover:bg-[#B00E29] text-white flex-shrink-0">
                                <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4"/>
                            </Button>
                        </div>

                        {/* Social Media */}
                        <div className="mt-6">
                            <div className="flex gap-3">
                                <Link
                                    href="#"
                                    className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#C8102E] transition-colors"
                                    aria-label="Facebook">
                                    <FontAwesomeIcon icon={faFacebookF} className="w-5 h-5"/>
                                </Link>
                                <Link
                                    href="#"
                                    className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#C8102E] transition-colors"
                                    aria-label="Instagram">
                                    <FontAwesomeIcon icon={faInstagram} className="w-5 h-5"/>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div
                    className="mt-12 pt-8 border-t border-white/10 text-center text-sm text-gray-400">
                    <p>{t('copyright')}
                    </p>
                </div>
            </div>
        </footer>
    );
}