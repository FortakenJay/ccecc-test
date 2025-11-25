"use client";

import { useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useTeam } from '@/lib/hooks/useTeam';
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
    faHandshake
} from "@fortawesome/free-solid-svg-icons";
import Link from 'next/link';

export default function Nosotros() {
    const locale = useLocale();
    const { teamMembers, loading, error, fetchTeamMembers } = useTeam();

    useEffect(() => {
        fetchTeamMembers(true, locale); // Fetch only active members
    }, [locale]);

    // Separate team members by category
    const boardMembers = teamMembers.filter((m: any) => m.category === 'board');
    const leadershipMembers = teamMembers.filter((m: any) => m.category === 'leadership');
    const localTeachers = teamMembers.filter((m: any) => m.category === 'local_teachers');
    const volunteerTeachers = teamMembers.filter((m: any) => m.category === 'volunteer_teachers');
    const partnerInstitutions = teamMembers.filter((m: any) => m.category === 'partner_institutions');

    const values = [
        {
            icon: faBullseye,
            title: 'Misión',
            description: 'Promover el entendimiento intercultural entre Costa Rica y China a través de la ' +
                    'educación del idioma mandarín, el intercambio artístico y la celebración de trad' +
                    'iciones milenarias.'
        }, {
            icon: faLightbulb,
            title: 'Visión',
            description: 'Ser el centro cultural de referencia en América Central para el aprendizaje del ' +
                    'idioma chino y la difusión de la cultura china, fomentando lazos duraderos entre' +
                    ' ambas naciones.'
        }, {
            icon: faShieldAlt,
            title: 'Valores',
            description: 'Respeto cultural, excelencia educativa, inclusión, compromiso comunitario y pres' +
                    'ervación de tradiciones auténticas.'
        }
    ];

    const achievements = [
        {
            icon: faAward,
            title: 'Centro Oficial HSK',
            description: 'Autorizado por Hanban para administrar exámenes de certificación internacional',
            year: '2012'
        }, {
            icon: faBookOpen,
            title: '500+ Graduados',
            description: 'Estudiantes certificados en diferentes niveles de HSK',
            year: '2010-2025'
        }, {
            icon: faCalendarDays,
            title: '750+ Eventos',
            description: 'Festivales, talleres y presentaciones culturales realizados',
            year: 'Desde 2010'
        }, {
            icon: faHandshake,
            title: 'Alianzas Estratégicas',
            description: 'Colaboraciones con instituciones educativas en China y Latinoamérica',
            year: 'Continuo'
        }
    ];

    const timeline = [
        {
            year: '2010',
            title: 'Fundación',
            description: 'Apertura del Centro Cultural Chino Costarricense con apoyo de la Embajada de Chi' +
                    'na.'
        }, {
            year: '2012',
            title: 'Certificación HSK',
            description: 'Autorización oficial como centro de exámenes HSK para Costa Rica.'
        }, {
            year: '2015',
            title: 'Expansión',
            description: 'Ampliación de instalaciones y adición de programas de artes tradicionales.'
        }, {
            year: '2018',
            title: 'Reconocimiento',
            description: 'Premio a la Excelencia en Educación Cultural otorgado por el gobierno.'
        }, {
            year: '2020',
            title: 'Digitalización',
            description: 'Implementación de plataforma virtual para clases en línea.'
        }, {
            year: '2025',
            title: 'Presente',
            description: 'Más de 500 estudiantes activos y 15 años promoviendo la cultura china.'
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 pb-20">
            {/* Header */}
            <section
                className="relative bg-gradient-to-r from-[#C8102E] to-[#8B0000] text-white py-20 overflow-hidden">
                <div
                    className="absolute inset-0 opacity-10"
                    style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 20c-5.523 0-10 4.477-10 10s4.477 10 10 10 10-4.477 10-10-4.477-10-10-10z' fill='%23FFD700' fill-opacity='0.4'/%3E%3C/svg%3E")`
                }}/>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="text-center max-w-3xl mx-auto">
                        <h1 className="text-4xl lg:text-5xl mb-4">Sobre Nosotros</h1>
                        <p className="text-white/90 text-lg">
                            15 años construyendo puentes entre culturas, promoviendo el entendimiento y
                            celebrando la riqueza de la tradición china en Costa Rica
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
                            <div className="text-[#C8102E] text-sm tracking-wider mb-2">NUESTRA HISTORIA</div>
                            <h2 className="text-gray-900 mb-6">Un Sueño que Conecta Dos Mundos</h2>
                            <div className="space-y-4 text-gray-600">
                                <p>
                                    El Centro Cultural Chino Costarricense nació en 2010 del sueño compartido de
                                    educadores chinos y costarricenses que visionaron un espacio donde ambas
                                    culturas pudieran encontrarse, aprender mutuamente y crecer juntas.
                                </p>
                                <p>
                                    Desde nuestros humildes comienzos con un pequeño salón y cinco estudiantes,
                                    hemos crecido hasta convertirnos en el centro cultural chino más importante de
                                    América Central, con más de 500 estudiantes activos y una comunidad vibrante de
                                    amantes de la cultura china.
                                </p>
                                <p>
                                    Nuestro compromiso va más allá de la enseñanza del idioma. Celebramos festivales
                                    tradicionales, organizamos intercambios culturales, promovemos las artes
                                    tradicionales y creamos espacios de diálogo intercultural que enriquecen a toda
                                    nuestra comunidad.
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
                        <div className="text-[#C8102E] text-sm tracking-wider mb-2">NUESTRA TRAYECTORIA</div>
                        <h2 className="text-gray-900">15 Años de Historia</h2>
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
                        <div className="text-[#C8102E] text-sm tracking-wider mb-2">LOGROS Y RECONOCIMIENTOS</div>
                        <h2 className="text-gray-900">Nuestros Hitos</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {achievements.map((achievement, index) => {
                            const Icon = achievement.icon;
                            return (
                                <Card
                                    key={index}
                                    className="p-6 text-center hover:shadow-xl transition-all hover:-translate-y-1">
                                    <div
                                        className="w-14 h-14 bg-gradient-to-br from-[#FFD700] to-[#FFA500] rounded-lg flex items-center justify-center mx-auto mb-4">
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
                        <div className="text-[#C8102E] text-sm tracking-wider mb-2">NUESTRO EQUIPO</div>
                        <h2 className="text-gray-900">Estructura Organizacional</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto mt-4">
                            Un equipo comprometido con la excelencia en la enseñanza y la promoción cultural
                        </p>
                    </div>

                    {loading && (
                        <div className="flex justify-center items-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-8">
                            {error}
                        </div>
                    )}

                    {!loading && (
                        <div className="space-y-12">
                            {/* Board of Directors, Chairman, Principal */}
                            {boardMembers.length > 0 && (
                                <div>
                                    <div className="text-center mb-8">
                                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Junta Directiva</h3>
                                        <div className="h-1 w-24 bg-gradient-to-r from-[#C8102E] to-[#FFD700] mx-auto rounded-full"/>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
                                        {boardMembers.map((member: any) => (
                                            <Card key={member.id} className="overflow-hidden hover:shadow-xl transition-shadow group">
                                                <div className="relative h-64 overflow-hidden">
                                                    <ImageWithFallback
                                                        src={member.image_url || '/jane.jpg'}
                                                        alt={member.name}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"/>
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"/>
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
                                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Equipo Administrativo</h3>
                                        <div className="h-1 w-24 bg-gradient-to-r from-[#C8102E] to-[#FFD700] mx-auto rounded-full"/>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                        {leadershipMembers.map((member: any) => (
                                            <Card key={member.id} className="overflow-hidden hover:shadow-xl transition-shadow group">
                                                <div className="relative h-56 overflow-hidden">
                                                    <ImageWithFallback
                                                        src={member.image_url || '/jane.jpg'}
                                                        alt={member.name}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"/>
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"/>
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
                                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Profesores Locales</h3>
                                        <div className="h-1 w-24 bg-gradient-to-r from-[#C8102E] to-[#FFD700] mx-auto rounded-full"/>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                        {localTeachers.map((member: any) => (
                                            <Card key={member.id} className="overflow-hidden hover:shadow-lg transition-shadow group text-center">
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
                                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Profesores Voluntarios</h3>
                                        <div className="h-1 w-24 bg-gradient-to-r from-[#C8102E] to-[#FFD700] mx-auto rounded-full"/>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                        {volunteerTeachers.map((member: any) => (
                                            <Card key={member.id} className="overflow-hidden hover:shadow-lg transition-shadow group text-center">
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
                                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Instituciones Asociadas</h3>
                                        <div className="h-1 w-24 bg-gradient-to-r from-[#C8102E] to-[#FFD700] mx-auto rounded-full"/>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {partnerInstitutions.map((partner: any) => {
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
                                    <p className="text-gray-600">No hay miembros del equipo disponibles en este momento.</p>
                                </div>
                            )}
                        </div>
                    )}
                </section>

                {/* Contact Us Section */}
                <section className="mb-16">
                    <div className="text-center mb-12">
                        <div className="text-[#C8102E] text-sm tracking-wider mb-2">CONTÁCTANOS</div>
                        <h2 className="text-gray-900">Información de Contacto</h2>
                        <p className="text-gray-600 max-w-2xl mx-auto mt-4">
                            Estamos aquí para ayudarte. No dudes en contactarnos
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="p-6 text-center hover:shadow-xl transition-shadow">
                            <div className="w-12 h-12 bg-gradient-to-br from-[#C8102E] to-[#FFD700] rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-white text-2xl">📍</span>
                            </div>
                            <h3 className="text-gray-900 font-semibold mb-2">Dirección</h3>
                            <p className="text-gray-600 text-sm">
                                San José, Costa Rica<br/>
                                Frente al Parque Central
                            </p>
                        </Card>

                        <Card className="p-6 text-center hover:shadow-xl transition-shadow">
                            <div className="w-12 h-12 bg-gradient-to-br from-[#C8102E] to-[#FFD700] rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-white text-2xl">📞</span>
                            </div>
                            <h3 className="text-gray-900 font-semibold mb-2">Teléfono</h3>
                            <p className="text-gray-600 text-sm">
                                +506 2222-3333<br/>
                                +506 8888-9999
                            </p>
                        </Card>

                        <Card className="p-6 text-center hover:shadow-xl transition-shadow">
                            <div className="w-12 h-12 bg-gradient-to-br from-[#C8102E] to-[#FFD700] rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-white text-2xl">📧</span>
                            </div>
                            <h3 className="text-gray-900 font-semibold mb-2">Email</h3>
                            <p className="text-gray-600 text-sm">
                                <a href="mailto:info@ccecc.cr" className="hover:text-[#C8102E]">info@ccecc.cr</a><br/>
                                <a href="mailto:admision@ccecc.cr" className="hover:text-[#C8102E]">admision@ccecc.cr</a>
                            </p>
                        </Card>

                        <Card className="p-6 text-center hover:shadow-xl transition-shadow">
                            <div className="w-12 h-12 bg-gradient-to-br from-[#C8102E] to-[#FFD700] rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-white text-2xl">🕒</span>
                            </div>
                            <h3 className="text-gray-900 font-semibold mb-2">Horario</h3>
                            <p className="text-gray-600 text-sm">
                                Lunes a Viernes<br/>
                                9:00 AM - 6:00 PM<br/>
                                Sábados: 9:00 AM - 2:00 PM
                            </p>
                        </Card>
                    </div>
                </section>

                {/* Call to Action */}
                <section
                    className="bg-gradient-to-r from-[#C8102E] to-[#8B0000] rounded-2xl p-12 text-center text-white">
                    <h2 className="text-white mb-4">Únete a Nuestra Comunidad</h2>
                    <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
                        Sé parte de esta hermosa experiencia cultural. Ya sea que quieras aprender
                        mandarín, explorar las artes tradicionales o simplemente conocer más sobre la
                        cultura china, tenemos un lugar para ti.
                    </p>
                    <div className="flex flex-wrap justify-center gap-4">
                        < Link href="/clases">
                            <button
                                className="bg-white hover:cursor-pointer text-[#C8102E] px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors">
                                Ver Nuestras Clases
                            </button>
                        </Link>
                        <Link href="/eventos">
                            <button
                                className="bg-[#FFD700] hover:cursor-pointer text-[#C8102E] px-8 py-3 rounded-lg hover:bg-[#FFA500] transition-colors">
                                Próximos Eventos
                            </button>
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}
