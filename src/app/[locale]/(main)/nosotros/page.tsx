"use client";

import {useEffect} from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {useTeam} from '@/lib/hooks/useTeam';
import {Card} from '@/components/ui/Card';
import {ImageWithFallback} from '@/components/ImageWithFallback';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {
    faAward,
    faBookOpen,
    faCalendarDays,
    faBullseye,
    faLightbulb,
    faShieldAlt,
    faHandshake,
    faMapPin
} from "@fortawesome/free-solid-svg-icons";
import Link from 'next/link';

export default function Nosotros() {
    const t = useTranslations('about');
    const locale = useLocale();
    const {teamMembers, loading, error, fetchTeamMembers} = useTeam();

    useEffect(() => {
        fetchTeamMembers(true, locale); // Fetch only active members
    }, [locale]);

    // Separate team members by category
    const boardMembers = teamMembers.filter((m : any) => m.category === 'board');
    const leadershipMembers = teamMembers.filter((m : any) => m.category === 'leadership');
    const localTeachers = teamMembers.filter((m : any) => m.category === 'local_teachers');
    const volunteerTeachers = teamMembers.filter((m : any) => m.category === 'volunteer_teachers');
    const partnerInstitutions = teamMembers.filter((m : any) => m.category === 'partner_institutions');

    const values = [
        {
            icon: faBullseye,
            title: t('mission.title'),
            description: t('mission.description')
        }, {
            icon: faLightbulb,
            title: t('vision.title'),
            description: t('vision.description')
        }, {
            icon: faShieldAlt,
            title: t('values.title'),
            description: t('values.description')
        }
    ];

    const achievements = [
        {
            icon: faAward,
            title: t('achievements.modelSchool.title'),
            description: t('achievements.modelSchool.description'),
            year: t('achievements.modelSchool.year')
        }, {
            icon: faBookOpen,
            title: t('achievements.teacherTraining.title'),
            description: t('achievements.teacherTraining.description'),
            year: t('achievements.teacherTraining.year')
        }, {
            icon: faCalendarDays,
            title: t('achievements.educationalPrograms.title'),
            description: t('achievements.educationalPrograms.description'),
            year: t('achievements.educationalPrograms.year')
        }, {
            icon: faHandshake,
            title: t('achievements.hskCenter.title'),
            description: t('achievements.hskCenter.description'),
            year: t('achievements.hskCenter.year')
        }, {
            icon: faAward,
            title: t('achievements.ministryRecognition.title'),
            description: t('achievements.ministryRecognition.description'),
            year: t('achievements.ministryRecognition.year')
        }
    ];

    const timeline = [
        {
            year: "2010",
            title: t('timeline.2010.title'),
            description: t('timeline.2010.description')
        }, {
            year: "2012",
            title: t('timeline.2012.title'),
            description: t('timeline.2012.description')
        }, {
            year: "2015",
            title: t('timeline.2015.title'),
            description: t('timeline.2015.description')
        }, {
            year: "2016",
            title: t('timeline.2016.title'),
            description: t('timeline.2016.description')
        }, {
            year: "2018",
            title: t('timeline.2018.title'),
            description: t('timeline.2018.description')
        }, {
            year: "2020",
            title: t('timeline.2020.title'),
            description: t('timeline.2020.description')
        }, {
            year: "2023",
            title: t('timeline.2020.title'),
            description: t('timeline.2020.description')
        }, {
            year: "2023",
            title: t('timeline.2023.title'),
            description: t('timeline.2023.description')
        }, {
            year: "2025",
            title: t('timeline.2025.title'),
            description: t('timeline.2025.description')
        }
    ];

    return (
        <div className="min-h-screen bg-linear-to-b from-white to-gray-50 pb-20">
            {/* Header */}
            <section
                className="relative bg-linear-to-r from-[#C8102E] to-[#8B0000] text-white py-20 overflow-hidden">
                <div
                    className="absolute inset-0 opacity-10"
                    style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 20c-5.523 0-10 4.477-10 10s4.477 10 10 10 10-4.477 10-10-4.477-10-10-10z' fill='%23FFD700' fill-opacity='0.4'/%3E%3C/svg%3E")`
                }}/>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="text-center max-w-3xl mx-auto">
                        <h1 className="text-4xl lg:text-5xl mb-4">{t('pageTitle')}</h1>
                        <p className="text-white/90 text-lg">
                            {t('pageSubtitle')}
                        </p>
                    </div>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Mission, Vision, Values */}
                <section className="mb-16">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {values.map((value, index) => {
                            const Icon = value.icon;
                            return (
                                <Card key={index} className="p-6 text-center hover:shadow-xl transition-shadow">
                                    <div
                                        className="w-16 h-16 bg-gradient-to-br from-[#C8102E] to-[#FFD700] rounded-full flex items-center justify-center mx-auto mb-4">
                                        <FontAwesomeIcon icon={Icon} className="w-8 h-8 text-white"/>
                                    </div>
                                    <h3 className="text-gray-900 mb-3">{value.title}</h3>
                                    <p className="text-gray-600">{value.description}</p>
                                </Card>
                            );
                        })}
                    </div>
                </section>

                {/* Story Section */}
                <section className="mb-16">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <div className="text-[#C8102E] text-sm tracking-wider mb-2">{t('ourStory')}</div>
                            <h2 className="text-gray-900 mb-6">{t('storyTitle')}</h2>
                            <div className="space-y-4 text-gray-600">
                                <p>
                                    {t('storyP1')}
                                </p>
                                <p>
                                    {t('storyP2')}
                                </p>

                            </div>
                        </div>
                        <div className="relative">
                            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                                <ImageWithFallback
                                    src="/portrait.webp"
                                    alt="Cultural celebration"
                                    className="w-full h-[500px] object-cover"/>
                            </div>

                        </div>
                    </div>
                </section>

                {/* Timeline */}
                <section className="mb-16">
                    <div className="text-center mb-12">
                        <div className="text-[#C8102E] text-sm tracking-wider mb-2">{t('ourJourney')}</div>
                        <h2 className="text-gray-900">{t('journeyTitle')}</h2>
                    </div>

                    <div className="relative">
                        {/* Timeline line */}
                        <div
                            className="hidden lg:block absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-[#C8102E] via-[#FFD700] to-[#C8102E]"/>

                        <div className="space-y-12">
                            {timeline.map((item, index) => (
                                <div
                                    key={index}
                                    className={`relative grid grid-cols-1 lg:grid-cols-2 gap-8 items-center ${index % 2 === 0
                                    ? ''
                                    : 'lg:flex-row-reverse'}`}>
                                    {/* Content */}
                                    <Card
                                        className={`p-6 ${index % 2 === 0
                                        ? 'lg:text-right lg:ml-auto'
                                        : 'lg:col-start-2'}`}>
                                        <div
                                            className="inline-block px-4 py-1 bg-gradient-to-r from-[#C8102E] to-[#FFD700] text-white rounded-full text-sm mb-3">
                                            {item.year}
                                        </div>
                                        <h3 className="text-gray-900 mb-2">{item.title}</h3>
                                        <p className="text-gray-600">{item.description}</p>
                                    </Card>

                                    {/* Timeline dot */}
                                    <div
                                        className={`hidden lg:block absolute left-1/2 transform -translate-x-1/2 w-6 h-6 bg-[#FFD700] border-4 border-white rounded-full shadow-lg ${index % 2 === 0
                                        ? 'lg:left-1/2'
                                        : 'lg:left-1/2'}`}/>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Achievements */}
                <section className="mb-16">
                    <div className="text-center mb-12">
                        <div className="text-[#C8102E] text-sm tracking-wider mb-2">{t('achievementsSection')}</div>
                        <h2 className="text-gray-900">{t('achievementsTitle')}</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {achievements.map((achievement, index) => {
                            const Icon = achievement.icon;
                            return (
                                <Card
                                    key={index}
                                    className="p-6 text-center hover:shadow-xl transition-all hover:-translate-y-1">
                                    <div
                                        className="w-14 h-14 bg-linear-to-br from-[#FFD700] to-[#FFA500] rounded-lg flex items-center justify-center mx-auto mb-4">
                                        <FontAwesomeIcon icon={Icon} className="w-7 h-7 text-white"/>
                                    </div>
                                    <div className="text-[#C8102E] text-sm mb-2">{achievement.year}</div>
                                    <h3 className="text-gray-900 text-lg mb-2">{achievement.title}</h3>
                                    <p className="text-gray-600 text-sm">{achievement.description}</p>
                                </Card>
                            );
                        })}
                    </div>
                </section>

                {/* Team - Hierarchical Structure */}
                <section className="mb-16">
                    <div className="text-center mb-12">
                        <div className="text-[#C8102E] text-sm tracking-wider mb-2">{t('ourTeam')}</div>
                        <h2 className="text-gray-900">{t('structure')}</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto mt-4">
                            {t('teamTitle')}
                        </p>
                    </div>

                    {loading && (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                        </div>
                    )}

                    {error && (
                        <div
                            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-8">
                            {error}
                        </div>
                    )}

                    {!loading && (
                        <div className="space-y-12">
                            {/* Board of Directors, Chairman, Principal */}
                            {boardMembers.length > 0 && (
                                <div>
                                    <div className="text-center mb-8">
                                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('Board')}</h3>
                                        <div
                                            className="h-1 w-24 bg-gradient-to-r from-[#C8102E] to-[#FFD700] mx-auto rounded-full"/>
                                    </div>
                                    <div
                                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
                                        {boardMembers.map((member : any) => (
                                            <Card
                                                key={member.id}
                                                className="overflow-hidden hover:shadow-xl transition-shadow group">
                                                <div className="relative h-64 overflow-hidden">
                                                    <ImageWithFallback
                                                        src={member.image_url || '/jane.jpg'}
                                                        alt={member.name}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"/>
                                                    <div
                                                        className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"/>
                                                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                                                        <h4 className="text-lg mb-1 font-semibold">{member.name}</h4>
                                                        <div className="text-[#FFD700] text-sm font-medium">{member.role}</div>
                                                    </div>
                                                </div>
                                                {member.bio && (
                                                    <div className="p-4">
                                                        <p className="text-gray-600 text-sm">{member.bio}</p>
                                                    </div>
                                                )}
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Leadership and Administrative Team */}
                            {leadershipMembers.length > 0 && (
                                <div>
                                    <div className="text-center mb-8">
                                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('admin')}</h3>
                                        <div
                                            className="h-1 w-24 bg-gradient-to-r from-[#C8102E] to-[#FFD700] mx-auto rounded-full"/>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                        {leadershipMembers.map((member : any) => (
                                            <Card
                                                key={member.id}
                                                className="overflow-hidden hover:shadow-xl transition-shadow group">
                                                <div className="relative h-56 overflow-hidden">
                                                    <ImageWithFallback
                                                        src={member.image_url || '/jane.jpg'}
                                                        alt={member.name}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"/>
                                                    <div
                                                        className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"/>
                                                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                                                        <h4 className="text-base mb-1 font-semibold">{member.name}</h4>
                                                        <div className="text-[#FFD700] text-xs font-medium">{member.role}</div>
                                                    </div>
                                                </div>
                                                {member.bio && (
                                                    <div className="p-3">
                                                        <p className="text-gray-600 text-xs line-clamp-3">{member.bio}</p>
                                                    </div>
                                                )}
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Local Teachers */}
                            {localTeachers.length > 0 && (
                                <div>
                                    <div className="text-center mb-8">
                                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('LocalTeachers')}</h3>
                                        <div
                                            className="h-1 w-24 bg-gradient-to-r from-[#C8102E] to-[#FFD700] mx-auto rounded-full"/>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                        {localTeachers.map((member : any) => (
                                            <Card
                                                key={member.id}
                                                className="overflow-hidden hover:shadow-lg transition-shadow group text-center">
                                                <div className="relative h-40 overflow-hidden">
                                                    <ImageWithFallback
                                                        src={member.image_url || '/jane.jpg'}
                                                        alt={member.name}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"/>
                                                </div>
                                                <div className="p-3">
                                                    <h4 className="text-sm font-semibold text-gray-900 mb-1">{member.name}</h4>
                                                    <div className="text-[#C8102E] text-xs">{member.role}</div>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Volunteer Teachers */}
                            {volunteerTeachers.length > 0 && (
                                <div>
                                    <div className="text-center mb-8">
                                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('VolunteerTeachers')}</h3>
                                        <div
                                            className="h-1 w-24 bg-gradient-to-r from-[#C8102E] to-[#FFD700] mx-auto rounded-full"/>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                        {volunteerTeachers.map((member : any) => (
                                            <Card
                                                key={member.id}
                                                className="overflow-hidden hover:shadow-lg transition-shadow group text-center">
                                                <div className="relative h-40 overflow-hidden">
                                                    <ImageWithFallback
                                                        src={member.image_url || '/jane.jpg'}
                                                        alt={member.name}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"/>
                                                </div>
                                                <div className="p-3">
                                                    <h4 className="text-sm font-semibold text-gray-900 mb-1">{member.name}</h4>
                                                    <div className="text-[#C8102E] text-xs">{member.role}</div>
                                                </div>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Partner Institutions */}
                            {partnerInstitutions.length > 0 && (
                                <div>
                                    <div className="text-center mb-8">
                                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('PartnerInstitutions')}</h3>
                                        <div
                                            className="h-1 w-24 bg-gradient-to-r from-[#C8102E] to-[#FFD700] mx-auto rounded-full"/>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {partnerInstitutions.map((partner : any) => {
                                            const metadata = partner.metadata || {};
                                            return (
                                                <Card key={partner.id} className="p-6 hover:shadow-xl transition-shadow">
                                                    <div className="flex items-start gap-4">
                                                        {partner.image_url && (
                                                            <div className="w-20 h-20 flex-shrink-0">
                                                                <ImageWithFallback
                                                                    src={partner.image_url}
                                                                    alt={partner.name}
                                                                    className="w-full h-full object-contain"/>
                                                            </div>
                                                        )}
                                                        <div className="flex-1">
                                                            <h4 className="text-lg font-semibold text-gray-900 mb-2">{partner.name}</h4>
                                                            {partner.bio && (
                                                                <p className="text-gray-600 text-sm mb-3">{partner.bio}</p>
                                                            )}
                                                            {metadata.website && (
                                                                <a
                                                                    href={metadata.website}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-[#C8102E] text-sm hover:underline inline-block mb-2">
                                                                    Visitar sitio web →
                                                                </a>
                                                            )}
                                                            {(metadata.contact_email || metadata.contact_phone) && (
                                                                <div className="text-xs text-gray-500 space-y-1">
                                                                    {metadata.contact_email && <div>📧 {metadata.contact_email}</div>}
                                                                    {metadata.contact_phone && <div>📞 {metadata.contact_phone}</div>}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {!loading && teamMembers.length === 0 && (
                                <div className="text-center py-12">
                                    <p className="text-gray-600">{t('noMember')}</p>
                                </div>
                            )}
                        </div>
                    )}
                </section>

                {/* Contact Us Section */}
                <section className="mb-16">
                    <div className="text-center mb-12">
                        <div className="text-[#C8102E] text-sm tracking-wider mb-2">{t('contact')}</div>
                        <h2 className="text-gray-900">{t('contactINFO')}</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto mt-4">
                            {t('contactDESC')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="p-6 text-center hover:shadow-xl transition-shadow">
                            <div
                                className="w-12 h-12 bg-gradient-to-br from-[#C8102E] to-[#FFD700] rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-white text-2xl">📍</span>
                            </div>
                            <h3 className="text-gray-900 font-semibold mb-2">{t('Direction')}</h3>
                            <div className="flex flex-col items-center gap-3 mt-4">
                                <Link
                                    className="flex items-center gap-3 px-4 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition group shadow-sm border border-gray-100"
                                    target="_blank"
                                    href="https://maps.app.goo.gl/ftVNMZmbY8JwnX9d8">
                                    <span className="bg-[#FFD700] text-[#C8102E] rounded-full w-8 h-8 flex items-center justify-center shadow"><FontAwesomeIcon icon={faMapPin} className="w-4 h-4"/></span>
                                    <span className="text-gray-700 group-hover:text-[#C8102E] font-medium text-base transition-colors text-left">{t('location1')}</span>
                                </Link>
                                <Link
                                    className="flex items-center gap-3 px-4 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition group shadow-sm border border-gray-100"
                                    target="_blank"
                                    href="https://maps.app.goo.gl/3K4NTrG5J7ReCecDA">
                                    <span className="bg-[#FFD700] text-[#C8102E] rounded-full w-8 h-8 flex items-center justify-center shadow"><FontAwesomeIcon icon={faMapPin} className="w-4 h-4"/></span>
                                    <span className="text-gray-700 group-hover:text-[#C8102E] font-medium text-base transition-colors text-left">{t('location2')}</span>
                                </Link>
                            </div>
                        </Card>

                        <Card className="p-6 text-center hover:shadow-xl transition-shadow">
                            <div className="w-12 h-12 bg-gradient-to-br from-[#C8102E] to-[#FFD700] rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                                <span className="text-white text-2xl">📞</span>
                            </div>
                            <h3 className="text-gray-900 font-semibold mb-2 tracking-wide uppercase">{t('phone')}</h3>
                            <div className="flex flex-col items-center gap-2 mt-4">
                                <a href="tel:+50621005188" className="flex items-center gap-2 text-gray-700 hover:text-[#C8102E] font-medium text-base transition-colors">
                                    <span className="bg-[#FFD700] text-[#C8102E] rounded-full w-7 h-7 flex items-center justify-center shadow"><svg xmlns='http://www.w3.org/2000/svg' className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 5a2 2 0 012-2h2.28a2 2 0 011.94 1.515l.3 1.2a2 2 0 01-.45 1.95l-.7.7a16.001 16.001 0 006.36 6.36l.7-.7a2 2 0 011.95-.45l1.2.3A2 2 0 0121 16.72V19a2 2 0 01-2 2h-1C9.163 21 3 14.837 3 7V5z' /></svg></span>
                                    +506 2100 5188
                                </a>
                                <a href="tel:+50687830474" className="flex items-center gap-2 text-gray-700 hover:text-[#C8102E] font-medium text-base transition-colors">
                                    <span className="bg-[#FFD700] text-[#C8102E] rounded-full w-7 h-7 flex items-center justify-center shadow"><svg xmlns='http://www.w3.org/2000/svg' className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M3 5a2 2 0 012-2h2.28a2 2 0 011.94 1.515l.3 1.2a2 2 0 01-.45 1.95l-.7.7a16.001 16.001 0 006.36 6.36l.7-.7a2 2 0 011.95-.45l1.2.3A2 2 0 0121 16.72V19a2 2 0 01-2 2h-1C9.163 21 3 14.837 3 7V5z' /></svg></span>
                                    +506 8783 0474
                                </a>
                            </div>
                        </Card>

                        <Card className="p-6 text-center hover:shadow-xl transition-shadow">
                            <div
                                className="w-12 h-12 bg-gradient-to-br from-[#C8102E] to-[#FFD700] rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-white text-2xl">📧</span>
                            </div>
                            <h3 className="text-gray-900 font-semibold mb-2">Email</h3>
                            <p className="text-gray-600 text-sm">
                                <a href="mailto:info@ccecc.cr" className="hover:text-[#C8102E]">educacrchino@gmail.com</a>
                            </p>
                        </Card>

                        <Card className="p-6 text-center hover:shadow-xl transition-shadow">
                            <div
                                className="w-12 h-12 bg-gradient-to-br from-[#C8102E] to-[#FFD700] rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-white text-2xl">🕒</span>
                            </div>
                            <h3 className="text-gray-900 font-semibold mb-2">{t('schedule')}</h3>
                            <p className="text-gray-600 text-sm">
                                {t('monday')}: 8 AM–4 PM<br/> {t('tuesday')}: 8 AM–4 PM<br/> {t('wednesday')}: 8 AM–4 PM<br/> {t('thursday')}: 8 AM–4 PM<br/> {t('friday')}: 8 AM–4 PM<br/> {t('saturday')}: 8 AM–4 PM<br/> {t('sunday')}:
                                <span className="text-red-600 font-semibold">{t('closed')}</span><br/>
                                <span className="text-xs text-gray-400">{t('hoursDiffer')}</span>
                            </p>
                        </Card>
                    </div>
                </section>

                {/* Call to Action */}
                <section
                    className="bg-linear-to-r from-[#C8102E] to-[#8B0000] rounded-2xl p-12 text-center text-white">
                    <h2 className="text-white mb-4">{t('comunityTitle')}</h2>
                    <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
                        {t('communityDesc')}
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        < Link href="/clases">
                            <button
                                className="bg-white hover:cursor-pointer text-[#C8102E] px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors">
                                {t('joinClasses')}
                            </button>
                        </Link>
                        <Link href="/blogs">
                            <button
                                className="bg-[#FFD700] hover:cursor-pointer text-[#C8102E] px-8 py-3 rounded-lg hover:bg-[#FFA500] transition-colors">
                                {t('seeBlogs')}
                            </button>
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}
