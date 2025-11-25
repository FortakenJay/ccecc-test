"use client";

import { useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useClasses } from '@/lib/hooks/useClasses';
import {Card} from '@/components/ui/Card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {
    faBookOpen,
    faAward,
    faMusic,
    faPalette
} from "@fortawesome/free-solid-svg-icons";

export default function ClassesPage() {
    const locale = useLocale();
    const { classes, loading, error, fetchClasses } = useClasses(locale);

    useEffect(() => {
        fetchClasses(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Separate classes by type
    const hskClasses = classes.filter((c: any) => c.type === 'hsk');
    const languageClasses = classes.filter((c: any) => c.type === 'language');
    const culturalClasses = classes.filter((c: any) => c.type === 'cultural');
    const talleresClasses = classes.filter((c: any) => c.type === 'talleres');

    const getColorByLevel = (level: string) => {
        const colors: Record<string, string> = {
            '1': 'from-green-400 to-green-600',
            '2': 'from-blue-400 to-blue-600',
            '3': 'from-purple-400 to-purple-600',
            '4': 'from-orange-400 to-orange-600',
            '5': 'from-red-400 to-red-600',
            '6': 'from-pink-400 to-pink-600'
        };
        const levelNum = level?.match(/\d+/)?.[0] || '1';
        return colors[levelNum] || 'from-gray-400 to-gray-600';
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-linear-to-b from-white to-gray-50 pb-20">
            {/* Header */}
            <section
                className="bg-linear-to-r from-[#C8102E] to-[#8B0000] text-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h1 className="text-4xl lg:text-5xl mb-4">Nuestras Clases</h1>
                        <p className="text-white/90 text-lg max-w-2xl mx-auto">
                            Programas diseñados para todos los niveles, desde principiantes hasta avanzados.
                            Descubre el camino perfecto para tu aprendizaje.
                        </p>
                    </div>
                </div>
            </section>

            {error && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                        {error}
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* HSK Preparation Section */}
                {hskClasses.length > 0 && (
                    <section className="mb-16">
                        <div className="flex items-center gap-3 mb-8">
                            <div
                                className="w-12 h-12 bg-linear-to-br from-[#C8102E] to-[#FFD700] rounded-lg flex items-center justify-center">
                                <FontAwesomeIcon icon={faAward} className="w-6 h-6 text-white"/>
                            </div>
                            <div>
                                <h2 className="text-gray-900">Preparación HSK</h2>
                                <p className="text-gray-600">Certificación oficial de competencia en chino mandarín</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {hskClasses.map((classItem: any) => (
                                <Card
                                    key={classItem.id}
                                    className="p-6 hover:shadow-xl transition-shadow border-t-4 border-t-[#C8102E]">
                                    <div className="mb-4">
                                        <div
                                            className={`inline-block px-4 py-2 bg-linear-to-r ${getColorByLevel(classItem.level || '')} text-white rounded-lg mb-3`}>
                                            {classItem.level || 'HSK'}
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-900 mb-4">{classItem.title}</h3>

                                    {classItem.price_colones && (
                                        <div className="text-2xl font-bold text-[#C8102E] mb-6">
                                            ₡{classItem.price_colones.toLocaleString()}
                                            <span className="text-sm text-gray-500 font-normal">/mes</span>
                                        </div>
                                    )}

                                    <Button
                                        className="w-full hover:cursor-pointer bg-linear-to-r from-[#C8102E] to-[#B00E29] hover:from-[#B00E29] hover:to-[#A00C26] text-white">
                                        Consultar WhatsApp
                                    </Button>
                                </Card>
                            ))}
                        </div>
                    </section>
                )}

                {/* Chinese Language (Non-HSK) Section */}
                {languageClasses.length > 0 && (
                    <section className="mb-16">
                        <div className="flex items-center gap-3 mb-8">
                            <div
                                className="w-12 h-12 bg-linear-to-br from-[#FFD700] to-[#FFA500] rounded-lg flex items-center justify-center">
                                <FontAwesomeIcon icon={faBookOpen} className="w-6 h-6 text-white"/>
                            </div>
                            <div>
                                <h2 className="text-gray-900">Clases de Chino</h2>
                                <p className="text-gray-600">Programas especializados sin orientación HSK</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {languageClasses.map((classItem: any) => (
                                <Card key={classItem.id} className="p-6 hover:shadow-xl transition-shadow border-t-4 border-t-[#FFD700]">
                                    {classItem.level && (
                                        <div className="mb-4">
                                            <Badge variant="secondary" className="text-base px-3 py-1">{classItem.level}</Badge>
                                        </div>
                                    )}

                                    <h3 className="text-xl font-bold text-gray-900 mb-4">{classItem.title}</h3>

                                    {classItem.price_colones && (
                                        <div className="text-2xl font-bold text-[#FFD700] mb-6">
                                            ₡{classItem.price_colones.toLocaleString()}
                                            <span className="text-sm text-gray-500 font-normal">/mes</span>
                                        </div>
                                    )}

                                    <Button
                                        className="w-full hover:cursor-pointer bg-linear-to-r from-[#FFD700] to-[#FFA500] hover:from-[#FFA500] hover:to-[#FF8C00] text-white">
                                        Consultar WhatsApp
                                    </Button>
                                </Card>
                            ))}
                        </div>
                    </section>
                )}

                {/* Artistic Exchange Section */}
                {culturalClasses.length > 0 && (
                    <section id="artistic">
                        <div className="flex items-center gap-3 mb-8">
                            <div
                                className="w-12 h-12 bg-linear-to-br from-[#C8102E] to-[#8B0000] rounded-lg flex items-center justify-center">
                                <FontAwesomeIcon icon={faMusic} className="w-6 h-6 text-white"/>
                            </div>
                            <div>
                                <h2 className="text-gray-900">Intercambio Artístico</h2>
                                <p className="text-gray-600">Artes tradicionales chinas y expresión cultural</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {culturalClasses.map((classItem: any) => (
                                <Card
                                    key={classItem.id}
                                    className="p-6 hover:shadow-xl transition-shadow border-t-4 border-t-[#8B0000]">
                                    {classItem.level && (
                                        <div className="mb-4">
                                            <Badge variant="secondary" className="text-base px-3 py-1">{classItem.level}</Badge>
                                        </div>
                                    )}

                                    <h3 className="text-xl font-bold text-gray-900 mb-4">{classItem.title}</h3>

                                    {classItem.price_colones && (
                                        <div className="text-2xl font-bold text-[#8B0000] mb-6">
                                            ₡{classItem.price_colones.toLocaleString()}
                                            <span className="text-sm text-gray-500 font-normal">/mes</span>
                                        </div>
                                    )}

                                    <Button
                                        className="w-full hover:cursor-pointer bg-linear-to-r from-[#C8102E] to-[#B00E29] hover:from-[#B00E29] hover:to-[#A00C26] text-white">
                                        Consultar WhatsApp
                                    </Button>
                                </Card>
                            ))}
                        </div>
                    </section>
                )}

                {/* Talleres (Workshops) Section */}
                {talleresClasses.length > 0 && (
                    <section className="mb-16">
                        <div className="flex items-center gap-3 mb-8">
                            <div
                                className="w-12 h-12 bg-linear-to-br from-[#FFD700] to-[#C8102E] rounded-lg flex items-center justify-center">
                                <FontAwesomeIcon icon={faPalette} className="w-6 h-6 text-white"/>
                            </div>
                            <div>
                                <h2 className="text-gray-900">Talleres Culturales</h2>
                                <p className="text-gray-600">Experiencias prácticas de cultura china</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {talleresClasses.map((classItem: any) => (
                                <Card
                                    key={classItem.id}
                                    className="p-6 hover:shadow-xl transition-shadow border-t-4 border-t-[#FFA500]">
                                    {classItem.level && (
                                        <div className="mb-4">
                                            <Badge variant="outline" className="text-[#FFA500] border-[#FFA500] text-sm px-2 py-1">
                                                {classItem.level}
                                            </Badge>
                                        </div>
                                    )}

                                    <h3 className="text-lg font-bold text-gray-900 mb-4">{classItem.title}</h3>

                                    {classItem.price_colones && (
                                        <div className="text-2xl font-bold text-[#FFA500] mb-6">
                                            ₡{classItem.price_colones.toLocaleString()}
                                            <span className="text-sm text-gray-500 font-normal">/taller</span>
                                        </div>
                                    )}

                                    <Button
                                        className="w-full hover:cursor-pointer bg-linear-to-r from-[#FFD700] to-[#FFA500] hover:from-[#FFA500] hover:to-[#FF8C00] text-white">
                                        Consultar WhatsApp
                                    </Button>
                                </Card>
                            ))}
                        </div>
                    </section>
                )}

                {/* Empty state */}
                {!loading && hskClasses.length === 0 && languageClasses.length === 0 && culturalClasses.length === 0 && talleresClasses.length === 0 && (
                    <div className="text-center py-16">
                        <FontAwesomeIcon icon={faBookOpen} className="w-16 h-16 text-gray-300 mb-4"/>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">No hay clases disponibles</h3>
                        <p className="text-gray-600">Vuelve pronto para ver nuestras próximas ofertas.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
