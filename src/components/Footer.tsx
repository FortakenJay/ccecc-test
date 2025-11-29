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
            className="bg-gradient-to-br from-gray-900 to-gray-800 text-white mt-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                                <div className="text-xs text-gray-300 leading-tight">
                                    <div>Centro Cultural y Educativo </div>
                                    <div>Costarricense Chino</div>
                                </div>
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
                            <Link
                                className="flex items-start gap-2 underline"
                                target="_blank"
                                href="https://maps.app.goo.gl/ftVNMZmbY8JwnX9d8">

                                <FontAwesomeIcon
                                    icon={faMapPin}
                                    className="w-4 h-4 mt-1 text-[#FFD700] flex-shrink-0"/>
                                <span className="text-gray-300">{t('location1')}</span>

                            </Link>
                            <Link
                                className="flex items-start gap-2 underline"
                                target="_blank"
                                href="https://maps.app.goo.gl/3K4NTrG5J7ReCecDA">
                                <FontAwesomeIcon
                                    icon={faMapPin}
                                    className="w-4 h-4 mt-1 text-[#FFD700] flex-shrink-0"/>
                                <span className="text-gray-300">{t('location2')}</span>
                            </Link>
                            <div className="flex items-center gap-2 underline">
                                <FontAwesomeIcon icon={faPhone} className="w-4 h-4 text-[#FFD700] "/>
                                <a href="tel:+50621005188" className="text-gray-300">+506 2100 5188</a>
                                <a href="tel:+50687830474" className="text-gray-300">+506 8783 0474</a>
                            </div>
                            <div className="flex items-center gap-2 underline">
                                <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4 text-[#FFD700]"/>
                                <a href="mailto:educacrchino@gmail.com" className="text-gray-300">educacrchino@gmail.com</a>
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

                 
                </div>

                {/* Bottom Bar */}
                <div
                    className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
                    <p>{t('copyright')}</p>
                    <Link href="/login">
                        <Button 
                            variant="outline" 
                            className="bg-transparent cursor-pointer border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700] hover:text-gray-900 transition-colors"
                        >
                            {t('login')}
                        </Button>
                    </Link>
                </div>
            </div>
        </footer>
    );
}