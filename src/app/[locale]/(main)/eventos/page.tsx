"use client";
import {useState} from 'react';
import {Card} from '@/components/ui/Card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textArea';
import {ImageWithFallback} from '@/components/ImageWithFallback';
import {Badge} from '@/components/ui/badge';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";

import {
    faCalendar,
    faLocationDot,
    faUsers,
    faClock,
    faBuilding,
    faMusic,
    faWandSparkles,
    faFilter,
    faChevronLeft,
    faChevronRight
} from "@fortawesome/free-solid-svg-icons";

export default function EventsPage() {
    const [currentMonth,
        setCurrentMonth] = useState(11); // November
    const [selectedEventType,
        setSelectedEventType] = useState('all');
    const [rentalForm,
        setRentalForm] = useState({
        name: '',
        email: '',
        phone: '',
        eventType: '',
        date: '',
        guests: '',
        message: ''
    });

    const eventSpaces = [
        {
            name: 'Salón Principal',
            capacity: '100 personas',
            features: [
                'Proyector', 'Sistema de sonido', 'Escenario', 'Iluminación'
            ],
            image: '/event.jpg'
        }, {
            name: 'Sala de Conferencias',
            capacity: '50 personas',
            features: [
                'Pantalla LED', 'WiFi', 'Pizarra', 'Aire acondicionado'
            ],
            image: '/event.jpg'
        }, {
            name: 'Patio Cultural',
            capacity: '150 personas',
            features: [
                'Espacio al aire libre', 'Iluminación decorativa', 'Acceso a cocina'
            ],
            image: '/event.jpg'
        }
    ];

    const upcomingEvents = [
        {
            title: 'Festival de la Luna',
            date: '15 Noviembre 2025',
            time: '18:00 - 22:00 hrs',
            location: 'Patio Cultural',
            type: 'Festival',
            image: '/event.jpg',
            description: 'Celebración tradicional del Festival de la Luna con linternas, música en vivo y ' +
                    'gastronomía china.',
            spots: 45,
            price: 'Gratis'
        }, {
            title: 'Taller de Caligrafía',
            date: '20 Noviembre 2025',
            time: '14:00 - 16:00 hrs',
            location: 'Sala de Conferencias',
            type: 'Taller',
            image: '/event.jpg',
            description: 'Aprende el arte tradicional de la caligrafía china. Materiales incluidos.',
            spots: 12,
            price: '₡8,000'
        }, {
            title: 'Presentación de Danza Tradicional',
            date: '25 Noviembre 2025',
            time: '19:00 - 21:00 hrs',
            location: 'Salón Principal',
            type: 'Presentación',
            image: '/event.jpg',
            description: 'Nuestros estudiantes presentan un espectáculo de danzas tradicionales chinas.',
            spots: 80,
            price: '₡5,000'
        }, {
            title: 'Degustación de Té Chino',
            date: '2 Diciembre 2025',
            time: '16:00 - 18:00 hrs',
            location: 'Sala de Conferencias',
            type: 'Taller',
            image: '/event.jpg',
            description: 'Descubre la milenaria cultura del té chino con un experto sommelier.',
            spots: 20,
            price: '₡12,000'
        }, {
            title: 'Concierto de Música Tradicional',
            date: '10 Diciembre 2025',
            time: '19:30 - 21:30 hrs',
            location: 'Salón Principal',
            type: 'Concierto',
            image: '/event.jpg',
            description: 'Velada musical con instrumentos tradicionales: Guzheng, Erhu y Pipa.',
            spots: 60,
            price: '₡10,000'
        }, {
            title: 'Año Nuevo Chino 2026',
            date: '29 Enero 2026',
            time: '17:00 - 23:00 hrs',
            location: 'Todo el Centro',
            type: 'Festival',
            image: '/event.jpg',
            description: 'Gran celebración del Año Nuevo Lunar con danzas de león, fuegos artificiales y b' +
                    'anquete.',
            spots: 200,
            price: '₡15,000'
        }
    ];

    const eventTypes = [
        {
            value: 'all',
            label: 'Todos',
            icon: faWandSparkles
        }, {
            value: 'Festival',
            label: 'Festivales',
            icon: faMusic
        }, {
            value: 'Taller',
            label: 'Talleres',
            icon: faUsers
        }, {
            value: 'Presentación',
            label: 'Presentaciones',
            icon: faWandSparkles
        }, {
            value: 'Concierto',
            label: 'Conciertos',
            icon: faMusic
        }
    ];

    const filteredEvents = selectedEventType === 'all'
        ? upcomingEvents
        : upcomingEvents.filter(event => event.type === selectedEventType);

    const handleRentalInputChange = (e : React.ChangeEvent < HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement >) => {
        setRentalForm({
            ...rentalForm,
            [e.target.name]: e.target.value
        });
    };

    const handleRentalSubmit = (e : React.FormEvent) => {
        e.preventDefault();
        alert('¡Solicitud enviada! Nos pondremos en contacto contigo pronto.');
    };

    return (
        <div className="min-h-screen bg-linear-to-b from-white to-gray-50 pb-20">
            {/* Header */}
            <section
                className="bg-linear-to-r from-[#C8102E] to-[#8B0000] text-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center">
                        <h1 className="text-4xl lg:text-5xl mb-4">Eventos y Espacios</h1>
                        <p className="text-white/90 text-lg max-w-2xl mx-auto">
                            Celebra la cultura china con nosotros o alquila nuestros espacios para tu evento
                            especial
                        </p>
                    </div>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

                    <div className="lg:col-span-2">
                       <Card className="p-6 sticky top-24">
                          <div className="flex items-center gap-2 mb-6">
                                <FontAwesomeIcon icon={faBuilding} className="w-6 h-6 text-[#C8102E]"/>
                                <h2 className="text-gray-900">Consulta sobre Eventos</h2>
                            </div>

                            <p className="text-gray-600 mb-6">
                                ¿Estás interesado en alguno de nuestros eventos? Envíanos tus consultas y nos pondremos en contacto contigo.
                            </p>

                            <form onSubmit={handleRentalSubmit} className="space-y-4">
                                <h3 className="text-gray-900">Formulario de Consulta</h3>

                                <div>
                                    <Label htmlFor="name">Nombre completo</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        value={rentalForm.name}
                                        onChange={handleRentalInputChange}
                                        required/>
                                </div>

                                <div>
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={rentalForm.email}
                                        onChange={handleRentalInputChange}
                                        required/>
                                </div>

                                <div>
                                    <Label htmlFor="phone">Teléfono</Label>
                                    <Input
                                        id="phone"
                                        name="phone"
                                        value={rentalForm.phone}
                                        onChange={handleRentalInputChange}
                                        required/>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className='hover:cursor-pointer'>
                                        <Label htmlFor="date">Fecha deseada</Label>
                                        <Input
                                            id="date"
                                            name="date"
                                            type="date"
                        
                                            value={rentalForm.date}
                                            onChange={handleRentalInputChange}
                                            required/>
                                    </div>
                                    <div>
                                        <Label htmlFor="guests">Nº de invitados</Label>
                                        <Input
                                            id="guests"
                                            name="guests"
                                            type="number"
                                            value={rentalForm.guests}
                                            onChange={handleRentalInputChange}
                                            required/>
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="message">Mensaje (opcional)</Label>
                                    <Textarea
                                        id="message"
                                        name="message"
                                        value={rentalForm.message}
                                        onChange={handleRentalInputChange}
                                        rows={3}
                                        placeholder="Cuéntanos más sobre tu evento..."/>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full  hover:cursor-pointer bg-gradient-to-r from-[#C8102E] to-[#B00E29] hover:from-[#B00E29] hover:to-[#A00C26] text-white">
                                    Enviar Consulta
                                </Button>
                            </form>
                        </Card>
                    </div>

                    {/* Right Side - Cultural Events Calendar */}
                    <div className="lg:col-span-3">
                        <div className="mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <FontAwesomeIcon icon={faCalendar} className="w-6 h-6 text-[#C8102E]"/>
                                    <h2 className="text-gray-900">Eventos Culturales</h2>
                                </div>

                                {/* Month Navigation */}
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentMonth(prev => prev - 1)}>
                                        <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4"/>
                                    </Button>
                                    <span className="text-gray-700 px-4">
                                        {new Date(2025, currentMonth).toLocaleDateString('es-ES', {
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentMonth(prev => prev + 1)}>
                                        <FontAwesomeIcon icon={faChevronRight} className="w-4 h-4"/>
                                    </Button>
                                </div>
                            </div>

                            {/* Filter by Event Type */}
                            <div className="flex flex-wrap gap-2">
                                {eventTypes.map((type) => {
                                    const Icon = type.icon;
                                    return (
                                        <button
                                            key={type.value}
                                            onClick={() => setSelectedEventType(type.value)}
                                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${selectedEventType === type.value
                                            ? 'border-[#C8102E] bg-[#C8102E] text-white'
                                            : 'border-gray-200 bg-white text-gray-700 hover:border-[#C8102E]'}`}>
                                            <FontAwesomeIcon icon={Icon} className="w-4 h-4"/>
                                            <span>{type.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Event List */}
                        <div className="space-y-6">
                            {filteredEvents.map((event, index) => (
                                <Card key={index} className="overflow-hidden hover:shadow-xl transition-shadow">
                                    <div className="grid grid-cols-1 md:grid-cols-3">
                                        {/* Event Image */}
                                        <div className="relative h-64 md:h-auto">
                                            <ImageWithFallback
                                                src={event.image}
                                                alt={event.title}
                                                className="w-full h-full object-cover"/>
                                            <div className="absolute top-4 left-4">
                                                <Badge className="bg-[#C8102E] text-white">
                                                    {event.type}
                                                </Badge>
                                            </div>
                                        </div>

                                        {/* Event Details */}
                                        <div className="md:col-span-2 p-6">
                                            <h3 className="text-gray-900 text-2xl mb-3">{event.title}</h3>
                                            <p className="text-gray-600 mb-4">{event.description}</p>

                                            <div className="grid grid-cols-2 gap-4 mb-4">
                                                <div className="flex items-center gap-2 text-gray-700">
                                                    <FontAwesomeIcon icon={faCalendar} className="w-4 h-4 text-[#C8102E]"/>
                                                    <span className="text-sm">{event.date}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-700">
                                                    <FontAwesomeIcon icon={faClock} className="w-4 h-4 text-[#C8102E]"/>
                                                    <span className="text-sm">{event.time}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-700">
                                                    <FontAwesomeIcon icon={faLocationDot} className="w-4 h-4 text-[#C8102E]"/>
                                                    <span className="text-sm">{event.location}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-700">
                                                    <FontAwesomeIcon icon={faUsers} className="w-4 h-4 text-[#C8102E]"/>
                                                    <span className="text-sm">{event.spots}
                                                        espacios disponibles</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="text-gray-900">
                                                    <span className="text-sm text-gray-500">Precio:
                                                    </span>
                                                    <span className="text-xl">{event.price}</span>
                                                </div>
                                                <Button
                                                    className="bg-gradient-to-r hover:cursor-pointer from-[#C8102E] to-[#B00E29] hover:from-[#B00E29] hover:to-[#A00C26] text-white">
                                                    Inscribirse
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>

                        {filteredEvents.length === 0 && (
                            <Card className="p-12 text-center">
                                <FontAwesomeIcon
                                    icon={faFilter}
                                    className="w-12 h-12 text-gray-300 mx-auto mb-4"/>
                                <p className="text-gray-500">No hay eventos de este tipo en el período seleccionado.</p>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
