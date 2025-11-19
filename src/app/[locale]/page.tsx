import {Button} from '@/components/ui/button';
import {Card} from '@/components/ui/Card';
import {ImageWithFallback} from '@/components/ImageWithFallback';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {
    faBookOpen,
    faAward,
    faCalendarDays,
    faMusic,
    faArrowRight,
    faUsers,
    faGlobe,
    faHeart
} from "@fortawesome/free-solid-svg-icons";

import {Link} from '@/i18n/navigation';
import {getTranslations} from 'next-intl/server';
import {setRequestLocale} from 'next-intl/server';

type Props = {
    params: Promise < {
        locale: string
    } >;
};

export default async function HomePage({params} : Props) {
    const {locale} = await params;
    setRequestLocale(locale);

    const t = await getTranslations('home');

    const quickAccessCards = [
        {
            title: t('quickAccess.chineseClasses'),
            description: t('quickAccess.chineseClassesDesc'),
            icon: faBookOpen,
            link: '/clases',
            gradient: 'from-[#C8102E] to-[#FFD700]'
        }, {
            title: t('quickAccess.hskExam'),
            description: t('quickAccess.hskExamDesc'),
            icon: faAward,
            link: '/hsk',
            gradient: 'from-[#FFD700] to-[#FFA500]'
        }, {
            title: t('quickAccess.culturalEvents'),
            description: t('quickAccess.culturalEventsDesc'),
            icon: faCalendarDays,
            link: '/eventos',
            gradient: 'from-[#C8102E] to-[#8B0000]'
        }, {
            title: t('quickAccess.artisticExchange'),
            description: t('quickAccess.artisticExchangeDesc'),
            icon: faMusic,
            link: '/clases#artistic',
            gradient: 'from-[#FFD700] to-[#C8102E]'
        }
    ];

    const upcomingEvents = [
        {
            date: 'Nov 15',
            title: 'Festival de la Luna',
            image: '/event.jpg',
            time: '18:00 hrs'
        }, {
            date: 'Nov 20',
            title: 'Taller de Caligrafía',
            image: '/event.jpg',
            time: '14:00 hrs'
        }, {
            date: 'Nov 25',
            title: 'Presentación de Danza Tradicional',
            image: '/event.jpg',
            time: '19:00 hrs'
        }, {
            date: 'Nov 30',
            title: 'Examen HSK - Inscripciones',
            image: '/event.jpg',
            time: 'Todo el día'
        }
    ];

    return (
        <div className="min-h-screen">

            {/* Hero Section */}
            <section className="relative h-[600px] overflow-hidden">
                <div className="absolute inset-0">
                    <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="absolute top-0 left-0 w-full h-full object-cover brightness-50 z-0">
                        <source src="/cceccVideoTEMP.mp4" type="video/mp4"/>
                        <div/>
                    </video>

                    <div/>
                </div>

                <div
                    className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
                    <div className="max-w-2xl">

                        <div className="text-[#FFD700] mb-4 flex items-center gap-2">
                            <div className="h-px w-12 bg-[#FFD700]"/>
                            <span className="text-sm tracking-wider">{t('welcome')}</span>
                        </div>

                        <h1 className="text-white mb-4">
                            <span className="block text-5xl lg:text-6xl mb-2">{t('title1')}</span>
                            <span className="block text-4xl lg:text-5xl text-[#FFD700]">{t('title2')}</span>
                        </h1>

                        <p className="text-white/90 text-lg mb-8 max-w-xl">
                            {t('subtitle')}
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link href="/clases">
                                <Button
                                    className="bg-red-800 text-white px-8 py-6 cursor-pointer
                 hover:bg-white hover:text-red-700 transition-colors duration-300">
                                    {t('enrollClasses')}
                                    <FontAwesomeIcon icon={faArrowRight} className="ml-2 w-5 h-5"/>
                                </Button>
                            </Link>
                            <Link href="/hsk">
                                <Button
                                    variant="outline"
                                    className="hover:cursor-pointer border-2 border-white hover:text-red-600 text-black px-8 py-6">
                                    {t('hskExam')}
                                    <FontAwesomeIcon icon={faAward} className="ml-2 w-5 h-5"/>
                                </Button>
                            </Link>
                        </div>

                    </div>
                </div>
            </section>

            {/* Quick Access Cards */}
            <section
                className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                    {quickAccessCards.map((card, index) => (
                        <Link href={card.link} key={index}>
                            <Card className="p-6 hover:shadow-2xl bg-white shadow-lg group cursor-pointer">

                                <div
                                    className={`w-14 h-14 rounded-lg bg-linear-to-br ${card.gradient} flex items-center justify-center mb-4`}>
                                    <FontAwesomeIcon icon={card.icon} className="w-7 h-7 text-white"/>
                                </div>

                                <h3 className="text-gray-900 mb-2">{card.title}</h3>
                                <p className="text-gray-600 text-sm">{card.description}</p>

                                <div className="mt-4 flex items-center text-[#C8102E] text-sm">
                                    <span>{t('quickAccess.explore')}</span>
                                    <FontAwesomeIcon icon={faArrowRight} className="ml-2 w-4 h-4"/>
                                </div>

                            </Card>
                        </Link>
                    ))}

                </div>
            </section>

            {/* Upcoming Events */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">

                <div className="text-center mb-12">
                    <div className="text-[#C8102E] text-sm tracking-wider mb-2">{t('upcomingEvents')}</div>
                    <h2 className="text-gray-900 mb-4">{t('culturalCalendar')}</h2>
                    <div
                        className="h-1 w-24 bg-linear-to-r from-[#C8102E] to-[#FFD700] mx-auto rounded-full"/>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {upcomingEvents.map((event, index) => (
                        <Card key={index} className="overflow-hidden hover:shadow-xl">

                            <div className="relative h-48 overflow-hidden">
                                <ImageWithFallback
                                    src={event.image}
                                    alt={event.title}
                                    className="w-full h-full object-cover"/>
                                <div
                                    className="absolute top-4 left-4 bg-[#C8102E] text-white px-3 py-1 rounded-lg text-sm">
                                    {event.date}
                                </div>
                            </div>

                            <div className="p-4">
                                <h3 className="text-gray-900 text-lg mb-2">{event.title}</h3>
                                <p className="text-gray-600 text-sm flex items-center gap-2">
                                    <FontAwesomeIcon icon={faCalendarDays} className="w-4 h-4 text-[#FFD700]"/> {event.time}
                                </p>
                            </div>

                        </Card>
                    ))}
                </div>

                <div className="text-center mt-8">
                    <Link href="/eventos">
                        <Button
                            variant="outline"
                            className="border-[#C8102E] text-[#C8102E] hover:bg-[#C8102E] hover:text-white hover:cursor-pointer">
                            {t('viewAllEvents')}
                            <FontAwesomeIcon icon={faArrowRight} className="ml-2 w-4 h-4"/>
                        </Button>
                    </Link>
                </div>

            </section>

            {/* About Section */}
            <section className="bg-linear-to-br from-gray-50 to-white py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

                        {/* Left content */}
                        <div>
                            <div className="text-[#C8102E] text-sm tracking-wider mb-2">{t('aboutUs')}</div>
                            <h2 className="text-gray-900 mb-6">{t('buildingBridges')}</h2>
                            <p className="text-gray-600 mb-6 leading-relaxed">{t('aboutText')}</p>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-6 mb-8">
                                <div className="text-center">
                                    <div className="text-3xl text-[#C8102E] mb-2">500+</div>
                                    <div className="text-gray-600 text-sm">{t('students')}</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl text-[#C8102E] mb-2">15+</div>
                                    <div className="text-gray-600 text-sm">{t('years')}</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl text-[#C8102E] mb-2">50+</div>
                                    <div className="text-gray-600 text-sm">{t('eventsPerYear')}</div>
                                </div>
                            </div>

                            {/* Features */}
                            <div className="space-y-4 mb-8">
                                <div className="flex items-start gap-3">
                                    <div
                                        className="w-10 h-10 rounded-full bg-[#FFD700]/20 flex items-center justify-center shrink-0">
                                        <FontAwesomeIcon icon={faUsers} className="w-5 h-5 text-[#C8102E]"/>
                                    </div>
                                    <div>
                                        <h4 className="text-gray-900 mb-1">{t('certifiedTeachers')}</h4>
                                        <p className="text-gray-600 text-sm">{t('certifiedTeachersDesc')}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div
                                        className="w-10 h-10 rounded-full bg-[#FFD700]/20 flex items-center justify-center shrink-0">
                                        <FontAwesomeIcon icon={faGlobe} className="w-5 h-5 text-[#C8102E]"/>
                                    </div>
                                    <div>
                                        <h4 className="text-gray-900 mb-1">{t('officialHSK')}</h4>
                                        <p className="text-gray-600 text-sm">{t('officialHSKDesc')}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div
                                        className="w-10 h-10 rounded-full bg-[#FFD700]/20 flex items-center justify-center shrink-0">
                                        <FontAwesomeIcon icon={faHeart} className="w-5 h-5 text-[#C8102E]"/>
                                    </div>
                                    <div>
                                        <h4 className="text-gray-900 mb-1">{t('activeCommunity')}</h4>
                                        <p className="text-gray-600 text-sm">{t('activeCommunityDesc')}</p>
                                    </div>
                                </div>
                            </div>
                            <Link  href="/nosotros">
                                <Button
                                    className="bg-linear-to-r hover:cursor-pointer from-[#C8102E] to-[#B00E29] hover:from-[#B00E29] hover:to-[#A00C26] text-white">
                                    {t('knowMore')}
                                    <FontAwesomeIcon icon={faArrowRight} className="ml-2 w-4 h-4"/>
                                </Button>
                            </Link>
                        </div>

                        {/* Right image */}
                        <div className="relative">
                            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                                <ImageWithFallback
                                    src="/portrait.webp"
                                    alt="Cultural Center"
                                    className="w-full h-[500px] object-cover"/>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

        </div>
    );
}