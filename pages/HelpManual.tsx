
import React from 'react';
import { 
    BookOpen, LayoutDashboard, Users, Calendar, Settings, 
    Bell, Printer, Shield, Clock, FileText, CheckCircle, 
    Menu, LogOut, Megaphone, ChevronRight, AlertCircle 
} from 'lucide-react';

const ManualSection = ({ title, icon: Icon, children }: { title: string, icon: any, children?: React.ReactNode }) => (
    <div className="mb-12 break-inside-avoid">
        <div className="flex items-center space-x-3 mb-4 border-b border-slate-200 pb-2">
            <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
                <Icon size={24} />
            </div>
            <h2 className="text-xl font-bold text-slate-800">{title}</h2>
        </div>
        <div className="text-slate-600 space-y-4 leading-relaxed">
            {children}
        </div>
    </div>
);

const FeatureItem = ({ title, desc }: { title: string, desc: string }) => (
    <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
        <div className="mt-1 w-2 h-2 rounded-full bg-primary flex-shrink-0"></div>
        <div>
            <span className="font-bold text-slate-800 block text-sm">{title}</span>
            <span className="text-sm text-slate-500">{desc}</span>
        </div>
    </div>
);

const HelpManual = () => {
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header / Actions */}
            <div className="flex justify-between items-center mb-8 no-print">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Centro de Ayuda</h1>
                    <p className="text-slate-500">Manual de usuario y documentación de la plataforma.</p>
                </div>
                <button 
                    onClick={handlePrint} 
                    className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors shadow-lg"
                >
                    <Printer size={18} className="mr-2" />
                    Descargar Manual (PDF)
                </button>
            </div>

            {/* Document Container */}
            <div id="manual-content" className="bg-white p-12 rounded-2xl shadow-sm border border-slate-200 min-h-screen print:shadow-none print:border-none print:p-0">
                
                {/* Manual Cover */}
                <div className="text-center border-b-2 border-slate-100 pb-8 mb-12">
                    <div className="inline-flex p-4 bg-primary/10 rounded-2xl mb-4 text-primary">
                        <BookOpen size={48} />
                    </div>
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">Manual de Usuario</h1>
                    <p className="text-xl text-slate-500">Plataforma RRHH CHS</p>
                    <p className="text-sm text-slate-400 mt-4">Versión 2025</p>
                </div>

                {/* 1. Acceso */}
                <ManualSection title="Acceso y Perfiles" icon={Shield}>
                    <p>
                        Para ingresar a la plataforma, utilice su correo electrónico corporativo y contraseña en la pantalla de inicio. 
                        El sistema detectará automáticamente su nivel de acceso y adaptará la interfaz.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div className="p-4 border rounded-lg text-center">
                            <span className="text-xs font-bold uppercase text-blue-600 bg-blue-50 px-2 py-1 rounded">Trabajador</span>
                            <p className="text-xs text-slate-500 mt-2">Gestión personal de vacaciones, horas y turnos.</p>
                        </div>
                        <div className="p-4 border rounded-lg text-center">
                            <span className="text-xs font-bold uppercase text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Supervisor</span>
                            <p className="text-xs text-slate-500 mt-2">Gestión personal + Aprobación de equipo.</p>
                        </div>
                        <div className="p-4 border rounded-lg text-center">
                            <span className="text-xs font-bold uppercase text-purple-600 bg-purple-50 px-2 py-1 rounded">Admin</span>
                            <p className="text-xs text-slate-500 mt-2">Control total, configuración y gestión global.</p>
                        </div>
                    </div>
                </ManualSection>

                {/* 2. Interfaz */}
                <ManualSection title="Interfaz General" icon={LayoutDashboard}>
                    <ul className="space-y-4">
                        <li className="flex items-start">
                            <Menu className="mr-3 text-slate-400 mt-1" size={18} />
                            <div>
                                <strong className="text-slate-800">Barra Lateral:</strong> Navegación principal entre módulos. En dispositivos móviles se oculta automáticamente.
                            </div>
                        </li>
                        <li className="flex items-start">
                            <Megaphone className="mr-3 text-slate-400 mt-1" size={18} />
                            <div>
                                <strong className="text-slate-800">Banner de Avisos:</strong> Mensajes importantes de la empresa (ej. "Oficina cerrada por festivo") aparecen en la parte superior.
                            </div>
                        </li>
                        <li className="flex items-start">
                            <Bell className="mr-3 text-slate-400 mt-1" size={18} />
                            <div>
                                <strong className="text-slate-800">Notificaciones:</strong> El icono de campana muestra un punto rojo si tiene tareas pendientes (aprobaciones) o mensajes nuevos.
                            </div>
                        </li>
                    </ul>
                </ManualSection>

                {/* 3. Funciones Trabajador */}
                <ManualSection title="Funciones del Trabajador" icon={Users}>
                    <p className="mb-4">Funcionalidades disponibles para todos los usuarios:</p>
                    
                    <h3 className="font-bold text-slate-800 mb-2 flex items-center"><Calendar className="mr-2" size={16}/> Mi Espacio</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <FeatureItem 
                            title="Solicitar Ausencia" 
                            desc="Botón 'Nueva'. Seleccione tipo (Vacaciones, Baja, etc.) y fechas. El sistema indica si descuenta días." 
                        />
                        <FeatureItem 
                            title="Registrar Horas" 
                            desc="Anote horas extras trabajadas indicando fecha y motivo. Quedarán pendientes de aprobación." 
                        />
                        <FeatureItem 
                            title="Canjear Saldo" 
                            desc="Utilice sus horas acumuladas para solicitar días libres o abono en nómina." 
                        />
                        <FeatureItem 
                            title="Informes" 
                            desc="En el historial, pulse 'Ver Detalle' para imprimir un justificante oficial en PDF." 
                        />
                    </div>

                    <h3 className="font-bold text-slate-800 mb-2 flex items-center"><Clock className="mr-2" size={16}/> Calendario</h3>
                    <p>Visualice sus turnos asignados (Mañana/Tarde/Noche) y sus vacaciones aprobadas en una vista mensual.</p>
                </ManualSection>

                {/* 4. Funciones Supervisor */}
                <ManualSection title="Supervisores y Gestión de Equipo" icon={CheckCircle}>
                    <p>Acceso al módulo <strong>"Mi Equipo"</strong>:</p>
                    <ul className="list-disc pl-5 mt-2 space-y-2">
                        <li><strong>Panel de Pendientes:</strong> Visualice en tarjetas separadas las solicitudes de Ausencia y Horas Extras que requieren su atención.</li>
                        <li><strong>Aprobación Rápida:</strong> Botones para Aprobar o Rechazar directamente desde la lista.</li>
                        <li><strong>Historial:</strong> Consulte todos los movimientos pasados de su equipo con filtros por nombre.</li>
                    </ul>
                </ManualSection>

                {/* 5. Funciones Admin */}
                <ManualSection title="Administración Global" icon={Settings}>
                    <p className="mb-4">Panel exclusivo para usuarios con rol ADMIN.</p>
                    
                    <div className="space-y-4">
                        <div className="border-l-4 border-slate-800 pl-4 py-1">
                            <h4 className="font-bold text-slate-800">Gestión de Usuarios</h4>
                            <p className="text-sm">Cree nuevos empleados, edite perfiles, restablezca contraseñas y realice <strong>Ajustes Manuales</strong> de saldo (sumar/restar días u horas por motivos administrativos).</p>
                        </div>
                        
                        <div className="border-l-4 border-slate-800 pl-4 py-1">
                            <h4 className="font-bold text-slate-800">Gestión de Turnos (Visual)</h4>
                            <p className="text-sm">Herramienta tipo "Paint". Seleccione un turno (Mañana/Tarde) y haga clic en los días del calendario para asignarlos rápidamente a un empleado.</p>
                        </div>

                        <div className="border-l-4 border-slate-800 pl-4 py-1">
                            <h4 className="font-bold text-slate-800">Configuración</h4>
                            <p className="text-sm">Defina los Departamentos, Tipos de Ausencia (y si descuentan días), y Tipos de Turno (horarios y colores).</p>
                        </div>

                        <div className="border-l-4 border-slate-800 pl-4 py-1">
                            <h4 className="font-bold text-slate-800">Comunicaciones</h4>
                            <p className="text-sm">Edite el mensaje global (banner), configure el servidor de correo (SMTP) y personalice las plantillas de los emails automáticos.</p>
                        </div>
                    </div>
                </ManualSection>

                {/* 6. FAQ */}
                <ManualSection title="Preguntas Frecuentes" icon={AlertCircle}>
                    <div className="space-y-4">
                        <div>
                            <p className="font-bold text-slate-800 text-sm">¿Qué pasa si elimino una solicitud aprobada?</p>
                            <p className="text-sm">El sistema restaurará automáticamente los días de vacaciones o las horas consumidas a su saldo disponible.</p>
                        </div>
                        <div>
                            <p className="font-bold text-slate-800 text-sm">¿Cómo imprimo un justificante?</p>
                            <p className="text-sm">Vaya a "Mi Espacio", busque un canje aprobado, pulse "Ver Detalle" y luego el botón "Imprimir".</p>
                        </div>
                        <div>
                            <p className="font-bold text-slate-800 text-sm">No recibo los correos.</p>
                            <p className="text-sm">Verifique su carpeta de Spam o contacte con un administrador para revisar la configuración SMTP.</p>
                        </div>
                    </div>
                </ManualSection>

                <div className="text-center mt-12 pt-8 border-t border-slate-100 text-slate-400 text-sm">
                    <p>© 2025 RRHH CHS - Documentación Oficial</p>
                </div>
            </div>
        </div>
    );
};

export default HelpManual;