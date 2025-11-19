"use client";

import {useState, useRef, useEffect} from 'react';
import {Card} from '@/components/ui/Card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Badge} from '@/components/ui/badge';
import {Accordion, AccordionContent, AccordionItem, AccordionTrigger} from '@/components/ui/accordion';
import {FontAwesomeIcon} from "@fortawesome/react-fontawesome";
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3';

// Solid icons
import {
    faAward,
    faCalendar,
    faCheckCircle,
    faDollarSign,
    faFileLines,
    faUser,
    faEnvelope,
    faPhone,
    faCircleExclamation
} from "@fortawesome/free-solid-svg-icons";

function HSKTestingPageContent() {
    const [step,
        setStep] = useState(1);
    const [formData,
        setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        level: '',
        testDate: '',
        previousLevel: '',
        examSessionId: ''
    });
    const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [validationError, setValidationError] = useState<string | null>(null);
    const { executeRecaptcha } = useGoogleReCaptcha();

    const testDates = [
        {
            date: '15 Diciembre 2025',
            available: true,
            slots: 15
        }, {
            date: '20 Enero 2026',
            available: true,
            slots: 20
        }, {
            date: '18 Marzo 2026',
            available: true,
            slots: 18
        }, {
            date: '15 Mayo 2026',
            available: true,
            slots: 22
        }, {
            date: '17 Julio 2026',
            available: true,
            slots: 25
        }, {
            date: '19 Septiembre 2026',
            available: true,
            slots: 20
        }
    ];

    const requirements = ['Pasaporte o cédula de identidad vigente', 'Fotografía tamaño pasaporte reciente', 'Comprobante de pago del examen', 'Formulario de inscripción completo', 'Haber completado el nivel anterior (HSK 2+)'];

    const feeStructure = [
        {
            level: 'HSK 1',
            writtenFee: '$30',
            oralFee: '$25',
            total: '$55'
        }, {
            level: 'HSK 2',
            writtenFee: '$35',
            oralFee: '$25',
            total: '$60'
        }, {
            level: 'HSK 3',
            writtenFee: '$40',
            oralFee: '$30',
            total: '$70'
        }, {
            level: 'HSK 4',
            writtenFee: '$50',
            oralFee: '$30',
            total: '$80'
        }, {
            level: 'HSK 5',
            writtenFee: '$60',
            oralFee: '$35',
            total: '$95'
        }, {
            level: 'HSK 6',
            writtenFee: '$70',
            oralFee: '$35',
            total: '$105'
        }
    ];

    const faqs = [
        {
            question: '¿Qué es el examen HSK?',
            answer: 'El Hanyu Shuiping Kaoshi (HSK) es el examen internacional estandarizado de chino' +
                    ' mandarín. Es la certificación oficial de competencia lingüística para hablantes' +
                    ' no nativos, reconocida globalmente por instituciones educativas y empresas.'
        }, {
            question: '¿Cuánto tiempo tengo que estudiar para cada nivel?',
            answer: 'HSK 1-2: 3-6 meses de estudio. HSK 3-4: 6-12 meses adicionales. HSK 5-6: 12-24 m' +
                    'eses más. Esto varía según dedicación, experiencia previa y horas de estudio sem' +
                    'anales.'
        }, {
            question: '¿Cuándo recibo mis resultados?',
            answer: 'Los resultados oficiales se publican aproximadamente 1 mes después del examen. R' +
                    'ecibirás una notificación por email cuando estén disponibles. El certificado fís' +
                    'ico llega 2-3 meses después.'
        }, {
            question: '¿El certificado HSK tiene vencimiento?',
            answer: 'Los certificados HSK son válidos por 2 años desde la fecha del examen. Después d' +
                    'e este período, se recomienda volver a certificar para demostrar tu nivel actual' +
                    '.'
        }, {
            question: '¿Puedo presentar varios niveles el mismo día?',
            answer: 'Sí, puedes inscribirte en múltiples niveles (escrito y/u oral) en la misma fecha' +
                    ' de examen, siempre que los horarios no se superpongan.'
        }, {
            question: '¿Qué debo llevar el día del examen?',
            answer: 'Debes traer tu documento de identidad original, 2 lápices HB, borrador, y tu con' +
                    'firmación de inscripción. No se permiten diccionarios, teléfonos ni dispositivos' +
                    ' electrónicos.'
        }
    ];

    // Validation functions
    const isValidEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const isValidPhone = (phone: string): boolean => {
        // Accepts formats: +506 1234-5678, 1234-5678, 12345678, +50612345678
        const phoneRegex = /^(\+?\d{1,3}[\s-]?)?\d{4}[\s-]?\d{4}$/;
        return phoneRegex.test(phone.trim());
    };

    const sanitizeInput = (input: string): string => {
        // Remove potentially dangerous characters
        return input.trim().replace(/[<>"'`]/g, '');
    };

    const isValidName = (name: string): boolean => {
        // Only allow letters, spaces, hyphens, and accented characters
        const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s-]+$/;
        return name.length >= 2 && name.length <= 50 && nameRegex.test(name);
    };

    const validateStep1 = (): boolean => {
        setValidationError(null);
        
        if (!formData.firstName || !isValidName(formData.firstName)) {
            setValidationError('Por favor ingresa un nombre válido (solo letras, 2-50 caracteres)');
            return false;
        }
        
        if (!formData.lastName || !isValidName(formData.lastName)) {
            setValidationError('Por favor ingresa apellidos válidos (solo letras, 2-50 caracteres)');
            return false;
        }
        
        if (!formData.email || !isValidEmail(formData.email)) {
            setValidationError('Por favor ingresa un email válido');
            return false;
        }
        
        if (!formData.phone || !isValidPhone(formData.phone)) {
            setValidationError('Por favor ingresa un teléfono válido (ej: +506 1234-5678)');
            return false;
        }
        
        return true;
    };

    const validateStep2 = (): boolean => {
        setValidationError(null);
        
        if (!formData.level) {
            setValidationError('Por favor selecciona un nivel de examen');
            return false;
        }
        
        if (!formData.testDate) {
            setValidationError('Por favor selecciona una fecha de examen');
            return false;
        }
        
        if (!formData.previousLevel) {
            setValidationError('Por favor indica si has tomado el HSK anteriormente');
            return false;
        }
        
        return true;
    };

    const handleInputChange = (e : React.ChangeEvent < HTMLInputElement | HTMLSelectElement >) => {
        const { name, value } = e.target;
        const sanitizedValue = sanitizeInput(value);
        
        setFormData({
            ...formData,
            [name]: sanitizedValue
        });
        
        // Clear validation error when user starts typing
        if (validationError) {
            setValidationError(null);
        }
    };

    const handleNextStep = () => {
        // Validate current step before advancing
        if (step === 1 && !validateStep1()) {
            return;
        }
        
        if (step === 2 && !validateStep2()) {
            return;
        }
        
        if (step < 3) {
            setStep(step + 1);
        }
    };
    
    const handlePrevStep = () => {
        if (step > 1) 
            setStep(step - 1);
        };
    
    const handleSubmitRegistration = async () => {
        setSubmitError(null);
        setValidationError(null);
        
        // Validate all steps again before submission
        if (!validateStep1() || !validateStep2()) {
            setSubmitError('Por favor verifica que todos los campos sean válidos');
            return;
        }

        // Execute reCAPTCHA v3
        if (!executeRecaptcha) {
            setSubmitError('reCAPTCHA no está listo. Por favor intenta nuevamente.');
            return;
        }

        let recaptchaToken: string;
        try {
            recaptchaToken = await executeRecaptcha('submit_registration');
        } catch (error) {
            setSubmitError('Error al verificar reCAPTCHA. Por favor intenta nuevamente.');
            return;
        }

        // Additional email validation
        if (formData.email.length > 255) {
            setSubmitError('El email es demasiado largo');
            return;
        }

        // Additional phone validation
        if (formData.phone.length > 20) {
            setSubmitError('El teléfono es demasiado largo');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('/api/hsk/registration', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    email: formData.email,
                    phone: formData.phone,
                    level: formData.level,
                    previous_level: formData.previousLevel || 'no',
                    exam_session_id: formData.examSessionId || null,
                    recaptcha_token: recaptchaToken,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Error al enviar la inscripción');
            }

            // Success - show success message
            alert('¡Inscripción enviada exitosamente! Recibirás un email de confirmación.');
            
            // Reset form
            setFormData({
                firstName: '',
                lastName: '',
                email: '',
                phone: '',
                level: '',
                testDate: '',
                previousLevel: '',
                examSessionId: ''
            });
            setStep(1);
        } catch (error: any) {
            setSubmitError(error.message || 'Error al enviar la inscripción. Por favor intenta nuevamente.');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <div className="min-h-screen bg-linear-to-b from-white to-gray-50 pb-20">
            {/* Header */}
            <section
                className="bg-linear-to-r from-[#C8102E] to-[#8B0000] text-white py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                                <div
                                    className="w-16 h-16 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center">
                                    <FontAwesomeIcon icon={faAward} className="w-8 h-8 text-[#FFD700]"/>
                                </div>
                                <div>
                                    <h1 className="text-4xl lg:text-5xl">Examen HSK</h1>
                                    <p className="text-white/90 text-lg">汉语水平考试</p>
                                </div>
                            </div>
                            <p className="text-white/90 text-lg max-w-2xl">
                                Centro oficial autorizado para la administración del examen HSK. Certifica tu
                                nivel de chino mandarín con reconocimiento internacional.
                            </p>
                        </div>
                        <div className="bg-white/10 backdrop-blur rounded-2xl p-6 text-center">
                            <div className="text-[#FFD700] mb-2">Próximo Examen</div>
                            <div className="text-3xl mb-1">15 DIC</div>
                            <div className="text-white/80 text-sm">2025</div>
                            <Button className="mt-4 hover:cursor-pointer bg-[#FFD700] text-[#C8102E] hover:bg-[#FFA500] w-full">
                                Inscribirse Ahora
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Information Grid */}
                <section className="mb-16">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Test Dates Calendar */}
                        <Card className="p-6">
                            <div className="flex items-center gap-2 mb-6">
                                <FontAwesomeIcon icon={faCalendar} className="w-6 h-6 text-[#C8102E]"/>
                                <h3 className="text-gray-900">Fechas de Examen 2025-2026</h3>
                            </div>
                            <div className="space-y-3">
                                {testDates.map((date, index) => (
                                    <div
                                        key={index}
                                        className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${date.available
                                        ? 'border-[#FFD700] bg-[#FFD700]/5 hover:bg-[#FFD700]/10'
                                        : 'border-gray-200 bg-gray-50'}`}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-gray-900">{date.date}</span>
                                            {date.available && (
                                                <Badge className="bg-green-500 text-white">Disponible</Badge>
                                            )}
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            {date.slots}
                                            espacios disponibles
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>

                        {/* Requirements Checklist */}
                        <Card className="p-6">
                            <div className="flex items-center gap-2 mb-6">
                                <FontAwesomeIcon icon={faFileLines} className="w-6 h-6 text-[#C8102E]"/>
                                <h3 className="text-gray-900">Requisitos de Inscripción</h3>
                            </div>
                            <div className="space-y-4">
                                {requirements.map((req, index) => (
                                    <div key={index} className="flex items-start gap-3">
                                        <FontAwesomeIcon
                                            icon={faCheckCircle}
                                            className="w-5 h-5 text-[#FFD700] shrink-0 mt-0.5"/>
                                        <span className="text-gray-700 text-sm">{req}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <div className="flex items-start gap-2">
                                    <FontAwesomeIcon
                                        icon={faCircleExclamation}
                                        className="w-5 h-5 text-blue-600 shrink-0 mt-0.5"/>
                                    <p className="text-sm text-blue-900">
                                        Los documentos deben presentarse al menos 2 semanas antes de la fecha del
                                        examen.
                                    </p>
                                </div>
                            </div>
                        </Card>

                        {/* Fee Structure */}
                        <Card className="p-6">
                            <div className="flex items-center gap-2 mb-6">
                                <FontAwesomeIcon icon={faDollarSign} className="w-6 h-6 text-[#C8102E]"/>
                                <h3 className="text-gray-900">Tarifas del Examen</h3>
                            </div>
                            <div className="space-y-2">
                                {feeStructure.map((fee, index) => (
                                    <div key={index} className="p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-gray-900">{fee.level}</span>
                                            <span className="text-[#C8102E]">{fee.total}</span>
                                        </div>
                                        <div className="flex gap-4 text-xs text-gray-600">
                                            <span>Escrito: {fee.writtenFee}</span>
                                            <span>Oral: {fee.oralFee}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-6 p-4 bg-[#FFD700]/10 rounded-lg border border-[#FFD700]">
                                <p className="text-sm text-gray-700">
                                    💳 Métodos de pago: Transferencia bancaria, SINPE Móvil, efectivo
                                </p>
                            </div>
                        </Card>
                    </div>
                </section>

                {/* Registration Form Section */}
                <section className="mb-16">
                    <div className="text-center mb-8">
                        <h2 className="text-gray-900 mb-2">Formulario de Inscripción</h2>
                        <p className="text-gray-600">Complete el proceso en 3 simples pasos</p>
                    </div>

                    <Card className="max-w-3xl mx-auto p-8">
                        {/* Progress Indicator */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-2">
                                {[1, 2, 3].map((s) => (<div
                                    key={s}
                                    className={`flex-1 h-2 rounded-full mx-1 transition-colors ${s <= step
                                    ? 'bg-[#C8102E]'
                                    : 'bg-gray-200'}`}/>))}
                            </div>
                            <div className="flex justify-between text-sm">
                                <span
                                    className={step >= 1
                                    ? 'text-[#C8102E]'
                                    : 'text-gray-400'}>
                                    Datos Personales
                                </span>
                                <span
                                    className={step >= 2
                                    ? 'text-[#C8102E]'
                                    : 'text-gray-400'}>
                                    Nivel y Fecha
                                </span>
                                <span
                                    className={step >= 3
                                    ? 'text-[#C8102E]'
                                    : 'text-gray-400'}>
                                    Confirmación
                                </span>
                            </div>
                        </div>

                        {/* Step 1: Personal Information */}
                        {step === 1 && (
                            <div className="space-y-6">
                                {validationError && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <div className="flex items-start gap-2">
                                            <FontAwesomeIcon icon={faCircleExclamation} className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"/>
                                            <p className="text-sm text-red-900">{validationError}</p>
                                        </div>
                                    </div>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="firstName">Nombre</Label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <FontAwesomeIcon icon={faUser} className="w-4 h-4 text-gray-400"/>
                                            <Input
                                                id="firstName"
                                                name="firstName"
                                                value={formData.firstName}
                                                onChange={handleInputChange}
                                                placeholder="Tu nombre"
                                                required
                                                maxLength={50}/>
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="lastName">Apellidos</Label>
                                        <div className="flex items-center gap-2 mt-1">
                                            <FontAwesomeIcon icon={faUser} className="w-4 h-4 text-gray-400"/>
                                            <Input
                                                id="lastName"
                                                name="lastName"
                                                value={formData.lastName}
                                                onChange={handleInputChange}
                                                placeholder="Tus apellidos"
                                                required
                                                maxLength={50}/>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="email">Email</Label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4 text-gray-400"/>
                                        <Input
                                            id="email"
                                            name="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            placeholder="tu@email.com"
                                            required
                                            maxLength={255}/>
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="phone">Teléfono</Label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <FontAwesomeIcon icon={faPhone} className="w-4 h-4 text-gray-400"/>
                                        <Input
                                            id="phone"
                                            name="phone"
                                            type="tel"
                                            value={formData.phone}
                                            onChange={handleInputChange}
                                            placeholder="+506 0000-0000"
                                            required
                                            maxLength={20}/>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Level and Date Selection */}
                        {step === 2 && (
                            <div className="space-y-6">
                                {validationError && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <div className="flex items-start gap-2">
                                            <FontAwesomeIcon icon={faCircleExclamation} className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"/>
                                            <p className="text-sm text-red-900">{validationError}</p>
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <Label htmlFor="level">Nivel del Examen</Label>
                                    <select
                                        id="level"
                                        name="level"
                                        value={formData.level}
                                        onChange={handleInputChange}
                                        className="w-full mt-1 p-2 border rounded-md"
                                        required>
                                        <option value="">Selecciona un nivel</option>
                                        <option value="hsk1">HSK 1 - Principiante</option>
                                        <option value="hsk2">HSK 2 - Elemental</option>
                                        <option value="hsk3">HSK 3 - Intermedio</option>
                                        <option value="hsk4">HSK 4 - Intermedio Alto</option>
                                        <option value="hsk5">HSK 5 - Avanzado</option>
                                        <option value="hsk6">HSK 6 - Superior</option>
                                    </select>
                                </div>

                                <div>
                                    <Label htmlFor="testDate">Fecha del Examen</Label>
                                    <select
                                        id="testDate"
                                        name="testDate"
                                        value={formData.testDate}
                                        onChange={handleInputChange}
                                        className="w-full mt-1 p-2 border rounded-md"
                                        required>
                                        <option value="">Selecciona una fecha</option>
                                        {testDates.map((date, index) => (
                                            <option key={index} value={date.date}>
                                                {date.date}
                                                - {date.slots}
                                                espacios disponibles
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <Label htmlFor="previousLevel">¿Has tomado el HSK anteriormente?</Label>
                                    <select
                                        id="previousLevel"
                                        name="previousLevel"
                                        value={formData.previousLevel}
                                        onChange={handleInputChange}
                                        className="w-full mt-1 p-2 border rounded-md"
                                        required>
                                        <option value="">Selecciona</option>
                                        <option value="no">No, es mi primer examen HSK</option>
                                        <option value="hsk1">Sí, HSK 1</option>
                                        <option value="hsk2">Sí, HSK 2</option>
                                        <option value="hsk3">Sí, HSK 3</option>
                                        <option value="hsk4">Sí, HSK 4</option>
                                        <option value="hsk5">Sí, HSK 5</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Confirmation */}
                        {step === 3 && (
                            <div className="space-y-6">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <FontAwesomeIcon icon={faCheckCircle} className="w-8 h-8 text-green-600"/>
                                        <h3 className="text-gray-900">Resumen de Inscripción</h3>
                                    </div>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Nombre completo:</span>
                                            <span className="text-gray-900">{formData.firstName} {formData.lastName}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Email:</span>
                                            <span className="text-gray-900">{formData.email}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Teléfono:</span>
                                            <span className="text-gray-900">{formData.phone}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Nivel:</span>
                                            <span className="text-gray-900">{formData
                                                    .level
                                                    .toUpperCase()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Fecha del examen:</span>
                                            <span className="text-gray-900">{formData.testDate}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-start gap-2">
                                        <FontAwesomeIcon icon={faCircleExclamation} className="w-5 h-5 text-blue-600 shrink-0 mt-0.5"/>
                                        <div className="text-sm text-blue-900">
                                            <p className="mb-2">
                                                Al confirmar tu inscripción, recibirás un email con:
                                            </p>
                                            <ul className="list-disc list-inside space-y-1">
                                                <li>Instrucciones de pago</li>
                                                <li>Lista de documentos requeridos</li>
                                                <li>Ubicación y horario del examen</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                {submitError && (
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <p className="text-sm text-red-900">{submitError}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex justify-between mt-8">
                            {step > 1 && (
                                <Button
                                    variant="outline"
                                    onClick={handlePrevStep}
                                    className="border-[#C8102E] text-[#C8102E] hover:bg-[#C8102E] hover:text-white">
                                    Anterior
                                </Button>
                            )}
                            {step < 3
                                ? (
                                    <Button
                                        onClick={handleNextStep}
                                        className="ml-auto bg-linear-to-r from-[#C8102E] to-[#B00E29] hover:from-[#B00E29] hover:to-[#A00C26] text-white">
                                        Siguiente
                                    </Button>
                                )
                                : (
                                    <Button
                                        onClick={handleSubmitRegistration}
                                        disabled={isSubmitting}
                                        className="ml-auto bg-linear-to-r from-[#C8102E] to-[#B00E29] hover:from-[#B00E29] hover:to-[#A00C26] text-white disabled:opacity-50 disabled:cursor-not-allowed">
                                        {isSubmitting ? 'Enviando...' : 'Confirmar Inscripción'}
                                    </Button>
                                )}
                        </div>
                    </Card>
                </section>

                {/* FAQ Section */}
                <section>
                    <div className="text-center mb-8">
                        <h2 className="text-gray-900 mb-2">Preguntas Frecuentes</h2>
                        <p className="text-gray-600">Todo lo que necesitas saber sobre el examen HSK</p>
                    </div>

                    <Card className="max-w-4xl mx-auto p-6">
                        <Accordion type="single" collapsible className="w-full">
                            {faqs.map((faq, index) => (
                                <AccordionItem key={index} value={`item-${index}`}>
                                    <AccordionTrigger className="text-left text-gray-900">
                                        {faq.question}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-gray-600">
                                        {faq.answer}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </Card>
                </section>
            </div>
        </div>
    );
}

export default function HSKTestingPage() {
    return (
        <GoogleReCaptchaProvider reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ''}>
            <HSKTestingPageContent />
        </GoogleReCaptchaProvider>
    );
}
