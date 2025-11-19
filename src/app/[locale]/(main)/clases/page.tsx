import {Card} from '@/components/ui/Card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {ImageWithFallback} from '@/components/ImageWithFallback';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import {
    faBookOpen,
    faAward,
    faClock,
    faUsers,
    faCheckCircle,
    faMusic,
    faPalette,
    faDumbbell
} from "@fortawesome/free-solid-svg-icons";

export default function ClassesPage() {
    const hskLevels = [
        {
            level: 'HSK 1',
            description: '150 palabras básicas',
            duration: '3 meses',
            schedule: 'Lun/Mié 18:00-20:00',
            price: '₡80,000/mes',
            color: 'from-green-400 to-green-600'
        }, {
            level: 'HSK 2',
            description: '300 palabras esenciales',
            duration: '3 meses',
            schedule: 'Mar/Jue 18:00-20:00',
            price: '₡85,000/mes',
            color: 'from-blue-400 to-blue-600'
        }, {
            level: 'HSK 3',
            description: '600 palabras intermedias',
            duration: '4 meses',
            schedule: 'Lun/Mié 19:00-21:00',
            price: '₡90,000/mes',
            color: 'from-purple-400 to-purple-600'
        }, {
            level: 'HSK 4',
            description: '1,200 palabras avanzadas',
            duration: '4 meses',
            schedule: 'Mar/Jue 19:00-21:00',
            price: '₡95,000/mes',
            color: 'from-orange-400 to-orange-600'
        }, {
            level: 'HSK 5',
            description: '2,500 palabras superiores',
            duration: '6 meses',
            schedule: 'Vie/Sáb 17:00-19:00',
            price: '₡100,000/mes',
            color: 'from-red-400 to-red-600'
        }, {
            level: 'HSK 6',
            description: '5,000+ palabras fluente',
            duration: '6 meses',
            schedule: 'Vie/Sáb 19:00-21:00',
            price: '₡105,000/mes',
            color: 'from-pink-400 to-pink-600'
        }
    ];

    const languageClasses = [
        {
            title: 'Chino Conversacional',
            description: 'Enfoque práctico en comunicación cotidiana y cultura china',
            level: 'Todos los niveles',
            schedule: 'Sáb 10:00-12:00',
            students: '8-12 personas',
            price: '₡75,000/mes',
            features: ['Conversación práctica', 'Cultura china', 'Materiales incluidos']
        }, {
            title: 'Chino de Negocios',
            description: 'Vocabulario y protocolo comercial para profesionales',
            level: 'HSK 3+',
            schedule: 'Jue 18:30-20:30',
            students: '6-10 personas',
            price: '₡120,000/mes',
            features: ['Negociación', 'Emails formales', 'Presentaciones']
        }, {
            title: 'Chino para Niños',
            description: 'Aprendizaje lúdico e interactivo para edades 6-12 años',
            level: 'Principiante',
            schedule: 'Sáb 14:00-15:30',
            students: '8-15 niños',
            price: '₡65,000/mes',
            features: ['Juegos didácticos', 'Canciones', 'Cuentos ilustrados']
        }
    ];

    const artisticClasses = [
        {
            title: 'Piano Clásico',
            description: 'Técnica occidental y repertorio chino con profesores certificados',
            image: "/classroom.webp",
            schedule: 'Clases individuales',
            price: '₡40,000/hora',
            icon: faMusic
        }, {
            title: 'Danza Tradicional China',
            description: 'Técnicas de danza clásica china y danza folclórica',
            image: "/classroom.webp",
            schedule: 'Mar/Jue 17:00-18:30',
            price: '₡70,000/mes',
            icon: faMusic
        }, {
            title: 'Instrumentos Tradicionales',
            description: 'Guzheng (cítara) y Erhu (violín de dos cuerdas)',
            image: "/classroom.webp",
            schedule: 'Lun/Mié 16:00-17:30',
            price: '₡85,000/mes',
            icon: faMusic
        }, {
            title: 'Tai Chi y Artes Marciales',
            description: 'Tai Chi Chuan estilo Yang y Kung Fu tradicional',
            image: "/classroom.webp",
            schedule: 'Lun/Mié/Vie 06:00-07:30',
            price: '₡60,000/mes',
            icon: faDumbbell
        }, {
            title: 'Caligrafía y Pintura',
            description: 'Arte tradicional de la caligrafía china y pintura con tinta',
            image: "/classroom.webp",
            schedule: 'Sáb 15:00-17:00',
            price: '₡55,000/mes',
            icon: faPalette
        }
    ];

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

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* HSK Preparation Section */}
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
                        {hskLevels.map((level, index) => (
                            <Card
                                key={index}
                                className="p-6 hover:shadow-xl transition-shadow border-t-4 border-t-[#C8102E]">
                                <div className="flex items-center justify-between mb-4">
                                    <div
                                        className={`px-4 py-2 bg-linear-to-r ${level.color} text-white rounded-lg`}>
                                        {level.level}
                                    </div>
                                    <Badge variant="outline" className="text-[#C8102E] border-[#C8102E]">
                                        {level.duration}
                                    </Badge>
                                </div>

                                <p className="text-gray-700 mb-4">{level.description}</p>

                                <div className="space-y-2 mb-6">
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <FontAwesomeIcon icon={faClock} className="w-4 h-4 text-[#FFD700]"/>
                                        <span>{level.schedule}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-900">
                                        <span className="text-sm text-gray-500">Precio:</span>
                                        <span>{level.price}</span>
                                    </div>
                                </div>

                                <Button
                                    className="w-full hover:cursor-pointer bg-linear-to-r from-[#C8102E] to-[#B00E29] hover:from-[#B00E29] hover:to-[#A00C26] text-white">
                                    Inscribirse
                                </Button>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* Chinese Language (Non-HSK) Section */}
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

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {languageClasses.map((course, index) => (
                            <Card key={index} className="p-6 hover:shadow-xl transition-shadow">
                                <h3 className="text-gray-900 text-xl mb-3">{course.title}</h3>
                                <p className="text-gray-600 mb-4">{course.description}</p>

                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">Nivel:</span>
                                        <Badge variant="secondary">{course.level}</Badge>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <FontAwesomeIcon icon={faClock} className="w-4 h-4 text-[#C8102E]"/>
                                        <span>{course.schedule}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                        <FontAwesomeIcon icon={faUsers} className="w-4 h-4 text-[#C8102E]"/>
                                        <span>{course.students}</span>
                                    </div>
                                </div>

                                <div className="border-t pt-4 mb-4">
                                    <div className="space-y-2">
                                        {course
                                            .features
                                            .map((feature, idx) => (
                                                <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                                                    <FontAwesomeIcon icon={faCheckCircle} className="w-4 h-4 text-[#FFD700]"/>
                                                    <span>{feature}</span>
                                                </div>
                                            ))}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-gray-900">{course.price}</span>
                                </div>

                                <Button
                                    className="w-full hover:cursor-pointer bg-linear-to-r from-[#FFD700] to-[#FFA500] hover:from-[#FFA500] hover:to-[#FF8C00] text-white">
                                    Más Información
                                </Button>
                            </Card>
                        ))}
                    </div>
                </section>

                {/* Artistic Exchange Section */}
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
                        {artisticClasses.map((course, index) => {
                            return (
                                <Card
                                    key={index}
                                    className="overflow-hidden hover:shadow-xl transition-shadow group">
                                    <div className="relative h-48 overflow-hidden">
                                        <ImageWithFallback
                                            src={course.image}
                                            alt={course.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"/>
                                        <div
                                            className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent"/>
                                        <div className="absolute bottom-4 left-4 right-4"></div>
                                    </div>

                                    <div className="p-6">
                                        <h3 className="text-gray-900 text-xl mb-2">{course.title}</h3>
                                        <p className="text-gray-600 text-sm mb-4">{course.description}</p>

                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <FontAwesomeIcon icon={faClock} className="w-4 h-4 text-[#C8102E]"/>
                                                <span>{course.schedule}</span>
                                            </div>
                                            <div className="text-gray-900">
                                                <span className="text-sm text-gray-500">Precio:
                                                </span>
                                                {course.price}
                                            </div>
                                        </div>

                                        <Button
                                            className="w-full hover:cursor-pointer bg-linear-to-r from-[#C8102E] to-[#B00E29] hover:from-[#B00E29] hover:to-[#A00C26] text-white">
                                            Consultar Disponibilidad
                                        </Button>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                </section>
            </div>
        </div>
    );
}
