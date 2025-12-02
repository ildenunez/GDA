
import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext';
import { Settings, Calendar, Briefcase, Plus, User as UserIcon, Trash2, Edit2, Search, X, Check, Eye, Printer, Download, Upload, Database, Mail, Save, AlertCircle, Key, Server, Palette, Sun, Moon, Eraser, ChevronLeft, ChevronRight, CalendarDays, Clock, FileText, LayoutList, Megaphone, Send, MessageSquare, RefreshCw, Paintbrush } from 'lucide-react';
import { Role, RequestStatus, AbsenceType, Department, User, OvertimeRecord, RedemptionType, EmailTemplate, ShiftType, ShiftTypeDefinition } from '../types';

// --- SUB-COMPONENTS DEFINED OUTSIDE TO PREVENT RE-RENDERS ---

const UsersTab = ({ onAddUser, onEditUser }: { onAddUser: () => void, onEditUser: (u: User) => void }) => {
    const { users, departments, requests, absenceTypes, overtime, deleteUser } = useData();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getUserBalances = (userId: string) => {
        const user = users.find(u => u.id === userId);
        if(!user) return { vacation: 0, overtime: 0, totalVacation: 0 };

        const userRequests = requests.filter(r => r.userId === userId && r.status === RequestStatus.APPROVED);
        const vacationTypeIds = absenceTypes
          .filter(t => t.deductsDays === true || (t.deductsDays === undefined && t.name.toLowerCase().includes('vacacion'))) 
          .map(t => t.id);

        const usedDays = userRequests.filter(r => vacationTypeIds.includes(r.typeId)).reduce((acc, req) => {
           const s = new Date(req.startDate);
           const e = new Date(req.endDate);
           s.setHours(12,0,0,0);
           e.setHours(12,0,0,0);
           const diff = Math.ceil(Math.abs(e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
           return acc + diff;
        }, 0);
        
        const totalVacation = 22 + (user.vacationAdjustment || 0);
        const remainingVacation = totalVacation - usedDays;
        
        const userOvertime = overtime.filter(o => o.userId === userId && o.status === RequestStatus.APPROVED);
        const positiveRecords = userOvertime.filter(o => o.hours > 0);
        const balance = positiveRecords.reduce((acc, curr) => acc + (curr.hours - curr.consumed), 0);
        
        return { vacation: remainingVacation, overtime: balance, totalVacation };
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                    <input type="text" placeholder="Buscar usuario..." className="w-full pl-10 pr-4 py-2 border rounded-lg" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <button onClick={onAddUser} className="flex items-center px-4 py-2 bg-primary text-white rounded-lg shadow-lg">
                    <Plus size={18} className="mr-2" /> Nuevo Usuario
                </button>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            <th className="px-6 py-4">Usuario</th>
                            <th className="px-6 py-4">Rol</th>
                            <th className="px-6 py-4">Departamento</th>
                            <th className="px-6 py-4 text-center">Vacaciones</th>
                            <th className="px-6 py-4 text-center">Horas Extras</th>
                            <th className="px-6 py-4 text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredUsers.map(u => {
                            const stats = getUserBalances(u.id);
                            return (
                                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                            <img src={u.avatarUrl} alt="" className="w-10 h-10 rounded-full bg-slate-200 object-cover" />
                                            <div>
                                                <p className="text-sm font-bold text-slate-800">{u.name}</p>
                                                <p className="text-xs text-slate-500">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${u.role === Role.ADMIN ? 'bg-purple-100 text-purple-700' : u.role === Role.SUPERVISOR ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {u.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {departments.find(d => d.id === u.departmentId)?.name || <span className="text-slate-400 italic">Sin asignar</span>}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`font-bold ${stats.vacation < 5 ? 'text-amber-600' : 'text-slate-700'}`}>{stats.vacation}</span>
                                        <span className="text-xs text-slate-400"> / {stats.totalVacation}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="font-bold text-primary">{stats.overtime}h</span>
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button onClick={() => onEditUser(u)} className="p-2 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-lg">
                                            <Edit2 size={18} />
                                        </button>
                                        <button 
                                            onClick={() => {
                                                // Custom confirmation dialog replacement for "window.confirm"
                                                if(confirm('¿Estás seguro de eliminar este usuario?')) {
                                                    deleteUser(u.id);
                                                }
                                            }} 
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const DeptsTab = ({ onAddDept, onEditDept }: { onAddDept: () => void, onEditDept: (d: Department) => void }) => {
    const { departments, users, deleteDepartment } = useData();
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800">Departamentos</h3>
                <button onClick={onAddDept} className="px-4 py-2 bg-slate-800 text-white rounded-lg flex items-center shadow-lg">
                    <Plus size={16} className="mr-2"/> Añadir Departamento
                </button>
            </div>
            <div className="grid gap-4">
                {departments.map(d => (
                    <div key={d.id} className="flex justify-between items-center p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                        <div>
                            <span className="font-bold text-slate-800 text-lg">{d.name}</span>
                            <div className="mt-1 flex items-center text-sm text-slate-500">
                                <UserIcon size={14} className="mr-1"/>
                                {d.supervisorIds && d.supervisorIds.length > 0 ? (
                                    <span>{d.supervisorIds.map(sid => users.find(u => u.id === sid)?.name).filter(Boolean).join(', ')}</span>
                                ) : (
                                    <span className="italic text-slate-400">Sin supervisores asignados</span>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => onEditDept(d)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={18}/></button>
                            <button onClick={() => { if(confirm('¿Eliminar departamento?')) deleteDepartment(d.id) }} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18}/></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const AbsencesTab = ({ onAddAbsence, onEditAbsence }: { onAddAbsence: () => void, onEditAbsence: (t: AbsenceType) => void }) => {
    const { absenceTypes, deleteAbsenceType } = useData();
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800">Tipos de Ausencia</h3>
                <button onClick={onAddAbsence} className="px-4 py-2 bg-slate-800 text-white rounded-lg flex items-center shadow-lg">
                    <Plus size={16} className="mr-2"/> Crear Tipo
                </button>
            </div>
            <div className="grid gap-4">
                {absenceTypes.map(t => (
                    <div key={t.id} className="p-4 bg-white border border-slate-200 rounded-xl flex justify-between items-center shadow-sm">
                        <div className="flex items-center gap-4">
                            <span className={`px-3 py-1 rounded text-sm font-bold ${t.color}`}>{t.name}</span>
                            <div className="flex gap-2">
                                {t.deductsDays ? (
                                    <span className="text-[10px] bg-red-50 text-red-600 font-bold px-2 py-0.5 rounded border border-red-100">Descuenta Días</span>
                                ) : (
                                    <span className="text-[10px] bg-emerald-50 text-emerald-600 font-bold px-2 py-0.5 rounded border border-emerald-100">No Descuenta</span>
                                )}
                                {t.isClosedRange && <span className="text-[10px] bg-amber-50 text-amber-600 font-bold px-2 py-0.5 rounded border border-amber-100">Rango Cerrado</span>}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => onEditAbsence(t)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={18}/></button>
                            <button onClick={() => deleteAbsenceType(t.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={18}/></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ConfigTab = () => {
    const { 
        emailTemplates, updateEmailTemplate, saveSmtpConfig, smtpConfig, sendTestEmail, systemMessage, updateSystemMessage,
        users, sendInternalMessage, fetchData
    } = useData();

    const [localSmtp, setLocalSmtp] = useState(smtpConfig);
    const [localMsg, setLocalMsg] = useState(systemMessage || { id: 'global_msg', text: '', active: false, color: 'bg-blue-600 text-white' });
    const [testEmail, setTestEmail] = useState('');
    const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
    
    // Internal Message State
    const [intMsgSubject, setIntMsgSubject] = useState('');
    const [intMsgBody, setIntMsgBody] = useState('');
    const [intMsgTarget, setIntMsgTarget] = useState<string[]>(['ALL']);

    const handleSaveSmtp = (e: React.FormEvent) => {
        e.preventDefault();
        saveSmtpConfig(localSmtp);
    };

    const handleSaveMsg = () => {
        updateSystemMessage(localMsg);
    };
    
    const handleUpdateTemplate = () => {
        if(editingTemplate) {
            updateEmailTemplate(editingTemplate);
            setEditingTemplate(null);
        }
    };

    const toggleRecipient = (role: Role) => {
        if (!editingTemplate) return;
        const current = editingTemplate.recipients || [];
        if (current.includes(role)) {
            setEditingTemplate({...editingTemplate, recipients: current.filter(r => r !== role)});
        } else {
            setEditingTemplate({...editingTemplate, recipients: [...current, role]});
        }
    };
    
    const handleSendInternal = (e: React.FormEvent) => {
        e.preventDefault();
        if(!intMsgSubject || !intMsgBody) return;
        sendInternalMessage(intMsgSubject, intMsgBody, intMsgTarget);
        setIntMsgSubject('');
        setIntMsgBody('');
        setIntMsgTarget(['ALL']);
    };

    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center"><Database className="mr-2" size={20}/> Datos</h3>
                    <button onClick={fetchData} className="flex items-center px-4 py-2 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 text-sm">
                        <RefreshCw size={16} className="mr-2"/> Recargar Datos
                    </button>
                </div>
            </div>
            {/* System Message */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center"><Megaphone className="mr-2" size={20}/> Mensaje Global</h3>
                <div className="space-y-4">
                    <input type="text" placeholder="Mensaje del banner" className="w-full border p-2 rounded" value={localMsg.text} onChange={e => setLocalMsg({...localMsg, text: e.target.value})} />
                    <div className="flex items-center gap-4">
                        <label className="flex items-center space-x-2 text-sm text-slate-700">
                            <input type="checkbox" checked={localMsg.active} onChange={e => setLocalMsg({...localMsg, active: e.target.checked})} className="rounded text-primary focus:ring-primary" />
                            <span>Activar Banner</span>
                        </label>
                        <select className="border p-1 rounded text-sm" value={localMsg.color} onChange={e => setLocalMsg({...localMsg, color: e.target.value})}>
                            <option value="bg-blue-600 text-white">Azul</option>
                            <option value="bg-red-600 text-white">Rojo</option>
                            <option value="bg-amber-500 text-white">Ámbar</option>
                            <option value="bg-emerald-600 text-white">Verde</option>
                        </select>
                        <button onClick={handleSaveMsg} className="px-4 py-1.5 bg-slate-800 text-white rounded text-sm hover:bg-slate-700">Guardar</button>
                    </div>
                </div>
            </div>
            
            {/* Internal Messaging */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center"><MessageSquare className="mr-2" size={20}/> Mensajería Interna (Buzón)</h3>
                <form onSubmit={handleSendInternal} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" required placeholder="Asunto del mensaje" className="w-full border p-2 rounded text-sm" value={intMsgSubject} onChange={e => setIntMsgSubject(e.target.value)} />
                        <select 
                            className="w-full border p-2 rounded text-sm"
                            value={intMsgTarget[0] === 'ALL' ? 'ALL' : 'SELECT'}
                            onChange={(e) => {
                                if (e.target.value === 'ALL') setIntMsgTarget(['ALL']);
                                else setIntMsgTarget([]);
                            }}
                        >
                            <option value="ALL">Enviar a Todos</option>
                            <option value="SELECT">Seleccionar Usuarios</option>
                        </select>
                    </div>
                    
                    {intMsgTarget[0] !== 'ALL' && (
                        <div className="border rounded p-2 max-h-32 overflow-y-auto bg-slate-50 text-sm">
                            {users.map(u => (
                                <label key={u.id} className="flex items-center space-x-2 p-1 hover:bg-white cursor-pointer">
                                    <input 
                                        type="checkbox"
                                        className="rounded text-primary"
                                        checked={intMsgTarget.includes(u.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) setIntMsgTarget([...intMsgTarget, u.id]);
                                            else setIntMsgTarget(intMsgTarget.filter(id => id !== u.id));
                                        }}
                                    />
                                    <span>{u.name}</span>
                                </label>
                            ))}
                        </div>
                    )}

                    <textarea required placeholder="Escribe el mensaje..." className="w-full border p-2 rounded h-24 text-sm" value={intMsgBody} onChange={e => setIntMsgBody(e.target.value)}></textarea>
                    <div className="flex justify-end">
                        <button type="submit" className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 text-sm font-bold shadow-md">
                            <Send size={16} className="mr-2"/> Enviar Mensaje
                        </button>
                    </div>
                </form>
            </div>

            {/* SMTP */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center"><Mail className="mr-2" size={20}/> Configuración SMTP</h3>
                <form onSubmit={handleSaveSmtp} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="Host" className="border p-2 rounded" value={localSmtp.host} onChange={e => setLocalSmtp({...localSmtp, host: e.target.value})} />
                    <input type="text" placeholder="Puerto" className="border p-2 rounded" value={localSmtp.port} onChange={e => setLocalSmtp({...localSmtp, port: e.target.value})} />
                    <input type="text" placeholder="Usuario" className="border p-2 rounded" value={localSmtp.user} onChange={e => setLocalSmtp({...localSmtp, user: e.target.value})} />
                    <input type="password" placeholder="Contraseña" className="border p-2 rounded" value={localSmtp.pass} onChange={e => setLocalSmtp({...localSmtp, pass: e.target.value})} />
                    <div className="md:col-span-2 flex justify-between items-center mt-2">
                        <label className="flex items-center space-x-2 text-sm text-slate-600">
                             <input type="checkbox" checked={localSmtp.secure} onChange={e => setLocalSmtp({...localSmtp, secure: e.target.checked})} />
                             <span>SSL/TLS</span>
                        </label>
                        <button type="submit" className="px-6 py-2 bg-slate-800 text-white rounded hover:bg-slate-700">Guardar</button>
                    </div>
                </form>
                <div className="mt-6 pt-6 border-t border-slate-100">
                    <div className="flex gap-2">
                        <input type="email" placeholder="Email prueba" className="border p-2 rounded flex-1 max-w-xs" value={testEmail} onChange={e => setTestEmail(e.target.value)} />
                        <button onClick={() => sendTestEmail(testEmail)} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded hover:bg-slate-50">Enviar Test</button>
                    </div>
                </div>
            </div>
            {/* Email Templates */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center"><FileText className="mr-2" size={20}/> Plantillas de Email</h3>
                <div className="grid gap-3">
                    {emailTemplates.map(t => (
                        <div key={t.id} onClick={() => setEditingTemplate(t)} className="p-3 border rounded hover:bg-slate-50 cursor-pointer flex justify-between items-center">
                            <div>
                                <p className="font-bold text-sm text-slate-800">{t.name}</p>
                                <p className="text-xs text-slate-500">{t.subject}</p>
                            </div>
                            <div className="flex gap-1">
                                {t.recipients?.map(r => (
                                    <span key={r} className="text-[10px] bg-slate-200 px-1 rounded">{r}</span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Template Edit Modal */}
            {editingTemplate && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl">
                        <h3 className="font-bold text-lg mb-4">Editar Plantilla: {editingTemplate.name}</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Asunto</label>
                                <input type="text" className="w-full border p-2 rounded" value={editingTemplate.subject} onChange={e => setEditingTemplate({...editingTemplate, subject: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Cuerpo (Variables: {'{{name}}, {{hours}}, {{date}}, etc.'})</label>
                                <textarea className="w-full border p-2 rounded h-32 text-sm" value={editingTemplate.body} onChange={e => setEditingTemplate({...editingTemplate, body: e.target.value})}></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Destinatarios</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center space-x-2 text-sm">
                                        <input type="checkbox" checked={editingTemplate.recipients?.includes(Role.WORKER)} onChange={() => toggleRecipient(Role.WORKER)} />
                                        <span>Trabajador</span>
                                    </label>
                                    <label className="flex items-center space-x-2 text-sm">
                                        <input type="checkbox" checked={editingTemplate.recipients?.includes(Role.SUPERVISOR)} onChange={() => toggleRecipient(Role.SUPERVISOR)} />
                                        <span>Supervisor</span>
                                    </label>
                                    <label className="flex items-center space-x-2 text-sm">
                                        <input type="checkbox" checked={editingTemplate.recipients?.includes(Role.ADMIN)} onChange={() => toggleRecipient(Role.ADMIN)} />
                                        <span>Admin</span>
                                    </label>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button onClick={() => setEditingTemplate(null)} className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded">Cancelar</button>
                                <button onClick={handleUpdateTemplate} className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700">Guardar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const ShiftsTab = () => {
    const { 
        users, shiftTypes, createShiftType, deleteShiftType, 
        shifts, addShift, deleteShift
    } = useData();

    const [viewMode, setViewMode] = useState<'visual' | 'config'>('visual');
    const [newShiftType, setNewShiftType] = useState<Partial<ShiftTypeDefinition>>({ name: '', startTime: '', endTime: '', color: 'bg-blue-100 text-blue-800 border-blue-300' });
    
    // Visual Manager State (NOW PERSISTENT ACROSS PARENT RENDERS)
    const [selectedUserForShifts, setSelectedUserForShifts] = useState('');
    const [selectedTool, setSelectedTool] = useState<string>(''); // ShiftType ID or 'eraser'
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [clicks, setClicks] = useState<{id: number, x: number, y: number, color: string}[]>([]); // For splash effects
    
    // DRAG STATE
    const [isDragging, setIsDragging] = useState(false);

    // Helpers for Calendar
    const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const getFirstDayOfMonth = (date: Date) => {
        const day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
        return day === 0 ? 6 : day - 1;
    };
    
    const handleMonthChange = (increment: number) => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + increment, 1));
    };

    const applyShift = async (day: number, clientX: number, clientY: number) => {
        if (!selectedUserForShifts || !selectedTool) return;
        
        const dateStr = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day, 12).toISOString().split('T')[0];
        
        // Visual Splash Logic
        const splashColor = selectedTool === 'eraser' ? 'bg-red-500' : shiftTypes.find(t => t.id === selectedTool)?.color.split(' ')[0].replace('bg-', 'bg-') || 'bg-blue-500';
        const newClick = { id: Date.now() + Math.random(), x: clientX, y: clientY, color: splashColor };
        setClicks(prev => [...prev, newClick]);
        setTimeout(() => setClicks(prev => prev.filter(c => c.id !== newClick.id)), 600); // Remove splash after animation

        if (selectedTool === 'eraser') {
            const shiftToDelete = shifts.find(s => s.userId === selectedUserForShifts && s.date === dateStr);
            if (shiftToDelete) deleteShift(shiftToDelete.id);
        } else {
            // Avoid duplicate calls if same day and type
            const exists = shifts.find(s => s.userId === selectedUserForShifts && s.date === dateStr && s.shiftType === selectedTool);
            if (!exists) {
                await addShift(selectedUserForShifts, dateStr, selectedTool);
            }
        }
    }

    const handleMouseDown = (day: number, e: React.MouseEvent) => {
        setIsDragging(true);
        applyShift(day, e.clientX, e.clientY);
    };

    const handleMouseEnter = (day: number, e: React.MouseEvent) => {
        if (isDragging) {
            applyShift(day, e.clientX, e.clientY);
        }
    };

    const handleMouseUp = () => setIsDragging(false);

    // Custom Cursor Logic
    const calendarRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (calendarRef.current && calendarRef.current.contains(e.target as Node)) {
                setMousePos({ x: e.clientX, y: e.clientY });
            }
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp); // Global mouse up
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, []);

    const activeToolDef = shiftTypes.find(t => t.id === selectedTool);

    return (
        <div className="space-y-6">
            <div className="flex space-x-4 mb-4">
                <button onClick={() => setViewMode('visual')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center transition-colors ${viewMode === 'visual' ? 'bg-slate-800 text-white shadow-lg' : 'bg-white text-slate-600 border hover:bg-slate-50'}`}>
                    <Paintbrush size={16} className="mr-2" /> Asignación Visual
                </button>
                <button onClick={() => setViewMode('config')} className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center transition-colors ${viewMode === 'config' ? 'bg-slate-800 text-white shadow-lg' : 'bg-white text-slate-600 border hover:bg-slate-50'}`}>
                    <Settings size={16} className="mr-2" /> Configuración Tipos
                </button>
            </div>

            {viewMode === 'config' ? (
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-in fade-in">
                    <h3 className="font-bold text-slate-800 mb-4">Gestión de Tipos de Turno</h3>
                    <div className="space-y-3 mb-6">
                        {shiftTypes.map(t => (
                            <div key={t.id} className="flex justify-between items-center p-3 bg-slate-50 rounded border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <span className={`w-4 h-4 rounded-full ${t.color.split(' ')[0]}`}></span>
                                    <div>
                                        <p className="font-bold text-sm">{t.name}</p>
                                        <p className="text-xs text-slate-500">{t.startTime} - {t.endTime} {t.startTime2 && `/ ${t.startTime2} - ${t.endTime2}`}</p>
                                    </div>
                                </div>
                                <button onClick={() => deleteShiftType(t.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-4 border-t">
                        <input type="text" placeholder="Nombre" className="border p-2 rounded text-sm" value={newShiftType.name} onChange={e => setNewShiftType({...newShiftType, name: e.target.value})} />
                        <select className="border p-2 rounded text-sm" value={newShiftType.color} onChange={e => setNewShiftType({...newShiftType, color: e.target.value})}>
                            <option value="bg-blue-100 text-blue-800 border-blue-300">Azul</option>
                            <option value="bg-emerald-100 text-emerald-800 border-emerald-300">Verde</option>
                            <option value="bg-amber-100 text-amber-800 border-amber-300">Amarillo</option>
                            <option value="bg-red-100 text-red-800 border-red-300">Rojo</option>
                            <option value="bg-purple-100 text-purple-800 border-purple-300">Morado</option>
                            <option value="bg-pink-100 text-pink-800 border-pink-300">Rosa</option>
                            <option value="bg-teal-100 text-teal-800 border-teal-300">Turquesa</option>
                            <option value="bg-slate-800 text-slate-200 border-slate-600">Noche (Oscuro)</option>
                        </select>
                        <input type="time" className="border p-2 rounded text-sm" value={newShiftType.startTime} onChange={e => setNewShiftType({...newShiftType, startTime: e.target.value})} />
                        <input type="time" className="border p-2 rounded text-sm" value={newShiftType.endTime} onChange={e => setNewShiftType({...newShiftType, endTime: e.target.value})} />
                        <input type="time" className="border p-2 rounded text-sm" placeholder="Inicio 2" value={newShiftType.startTime2 || ''} onChange={e => setNewShiftType({...newShiftType, startTime2: e.target.value})} />
                        <input type="time" className="border p-2 rounded text-sm" placeholder="Fin 2" value={newShiftType.endTime2 || ''} onChange={e => setNewShiftType({...newShiftType, endTime2: e.target.value})} />
                        <button onClick={() => { if(newShiftType.name) { createShiftType(newShiftType as any); setNewShiftType({name:'', startTime:'', endTime:''}); } }} className="col-span-2 bg-slate-800 text-white py-2 rounded text-sm hover:bg-slate-700">Crear Turno</button>
                    </div>
                </div>
            ) : (
                <div className="flex gap-6 h-[600px] animate-in fade-in">
                    {/* TOOLBAR */}
                    <div className="w-64 bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col h-full">
                        <h4 className="font-bold text-slate-800 mb-1">Gestión Visual</h4>
                        <p className="text-xs text-slate-500 mb-4">Selecciona usuario y arrastra para pintar.</p>
                        
                        <div className="mb-6">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">1. Seleccionar Trabajador</label>
                            <select className="w-full border p-2 rounded text-sm bg-slate-50 outline-none focus:ring-2 focus:ring-primary" value={selectedUserForShifts} onChange={e => setSelectedUserForShifts(e.target.value)}>
                                <option value="">Seleccionar...</option>
                                {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                            </select>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-1">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">2. Elegir Herramienta</label>
                            <div className="space-y-2">
                                {shiftTypes.map(t => (
                                    <button 
                                        key={t.id}
                                        onClick={() => setSelectedTool(t.id)}
                                        className={`w-full p-3 rounded-xl border flex items-center transition-all ${selectedTool === t.id ? 'ring-2 ring-offset-1 ring-slate-400 shadow-md transform scale-[1.02]' : 'border-slate-100 hover:bg-slate-50'}`}
                                    >
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${t.color.split(' ')[0]} ${t.color.split(' ')[2] || 'border-transparent'} border`}>
                                            <Clock size={16} className={t.color.includes('text-white') || t.color.includes('text-slate-200') ? 'text-white' : 'text-slate-600'} />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-bold text-slate-700">{t.name}</p>
                                            <p className="text-[10px] text-slate-400">{t.startTime} - {t.endTime}</p>
                                        </div>
                                    </button>
                                ))}
                                
                                <button 
                                    onClick={() => setSelectedTool('eraser')}
                                    className={`w-full p-3 rounded-xl border border-red-100 bg-red-50 flex items-center transition-all mt-4 ${selectedTool === 'eraser' ? 'ring-2 ring-offset-1 ring-red-300 shadow-md' : 'hover:bg-red-100'}`}
                                >
                                    <div className="w-8 h-8 rounded-full bg-red-200 flex items-center justify-center mr-3">
                                        <Eraser size={16} className="text-red-600" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-bold text-red-700">Borrador</p>
                                        <p className="text-[10px] text-red-400">Eliminar turno</p>
                                    </div>
                                </button>
                            </div>
                        </div>
                        
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-700 border border-blue-100 flex items-start">
                            <Paintbrush size={14} className="mr-2 mt-0.5 flex-shrink-0" />
                            <p><strong>Instrucciones:</strong> Mantén pulsado y arrastra sobre los días para pintar.</p>
                        </div>
                    </div>

                    {/* CALENDAR */}
                    <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden relative select-none">
                        <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
                            <button onClick={() => handleMonthChange(-1)} className="p-1 hover:bg-slate-200 rounded"><ChevronLeft /></button>
                            <span className="font-bold text-slate-800 capitalize">{currentMonth.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</span>
                            <button onClick={() => handleMonthChange(1)} className="p-1 hover:bg-slate-200 rounded"><ChevronRight /></button>
                        </div>
                        
                        {/* Calendar Grid Container */}
                        <div 
                            className={`flex-1 overflow-auto p-4 cursor-default relative ${selectedTool && selectedUserForShifts ? 'cursor-none' : ''}`}
                            ref={calendarRef}
                        >
                            {/* Header Days */}
                            <div className="grid grid-cols-7 mb-2">
                                {['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'].map(d => (
                                    <div key={d} className="text-center text-xs font-bold text-slate-400">{d}</div>
                                ))}
                            </div>
                            
                            {/* Days Grid */}
                            <div className="grid grid-cols-7 auto-rows-fr gap-1 min-h-[400px]">
                                {Array.from({ length: getFirstDayOfMonth(currentMonth) }).map((_, i) => <div key={`e-${i}`} />)}
                                
                                {Array.from({ length: getDaysInMonth(currentMonth) }).map((_, i) => {
                                    const day = i + 1;
                                    const dateStr = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day, 12).toISOString().split('T')[0];
                                    const shift = shifts.find(s => s.userId === selectedUserForShifts && s.date === dateStr);
                                    const shiftDef = shift ? shiftTypes.find(t => t.id === shift.shiftType) : null;

                                    return (
                                        <div 
                                            key={day} 
                                            onMouseDown={(e) => handleMouseDown(day, e)}
                                            onMouseEnter={(e) => handleMouseEnter(day, e)}
                                            className={`
                                                min-h-[80px] border rounded-lg p-1 relative transition-all group hover:border-slate-400
                                                ${shiftDef ? shiftDef.color + ' border-transparent' : 'bg-slate-50 border-slate-100'}
                                            `}
                                        >
                                            <span className={`text-xs font-bold ${shiftDef ? 'opacity-80' : 'text-slate-400'}`}>{day}</span>
                                            {shiftDef && (
                                                <div className="flex flex-col items-center justify-center h-full pb-4 pointer-events-none">
                                                    <Clock size={16} className="opacity-50 mb-1" />
                                                    <span className="text-[10px] font-bold text-center leading-none">{shiftDef.name}</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* CLICK ANIMATIONS (SPLASH) */}
                            {clicks.map(c => (
                                <div 
                                    key={c.id}
                                    className={`fixed rounded-full pointer-events-none animate-ping ${c.color.includes('bg-') ? c.color : 'bg-blue-500'}`}
                                    style={{ left: c.x - 20, top: c.y - 20, width: 40, height: 40, opacity: 0.5, zIndex: 9999 }}
                                />
                            ))}

                            {/* CUSTOM CURSOR FOLLOWER */}
                            {selectedTool && selectedUserForShifts && (
                                <div 
                                    className="fixed pointer-events-none z-50 flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2"
                                    style={{ left: mousePos.x, top: mousePos.y }}
                                >
                                    {selectedTool === 'eraser' ? (
                                        <div className="bg-red-500 text-white p-2 rounded-full shadow-lg border-2 border-white">
                                            <Eraser size={20} />
                                        </div>
                                    ) : activeToolDef ? (
                                        <div className={`p-2 rounded-full shadow-xl border-2 border-white flex flex-col items-center ${activeToolDef.color.split(' ')[0]}`}>
                                            <Clock size={20} className={activeToolDef.color.includes('text-white') ? 'text-white' : 'text-slate-800'} />
                                            <span className="absolute top-full mt-1 bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded whitespace-nowrap">
                                                {activeToolDef.name}
                                            </span>
                                        </div>
                                    ) : null}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const AdminPanel = () => {
  const { 
      createAbsenceType, deleteAbsenceType, updateAbsenceType,
      addDepartment, updateDepartment, deleteDepartment,
      updateUser, adjustUserVacation, addUser, 
      addRequest, deleteRequest, addOvertime, deleteOvertime, requestRedemption,
      requests, overtime
  } = useData();

  const [activeTab, setActiveTab] = useState<'users' | 'depts' | 'absences' | 'shifts' | 'config'>('users');

  // --- MODAL STATES ---
  // Users
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // Departments
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [deptForm, setDeptForm] = useState<Partial<Department>>({ name: '', supervisorIds: [] });
  
  // Absence Types
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [absenceForm, setAbsenceForm] = useState<Partial<AbsenceType>>({ name: '', color: 'bg-blue-100 text-blue-800', deductsDays: false, isClosedRange: false });

  // --- USER FORM LOGIC ---
  const [newUser, setNewUser] = useState({ name: '', email: '', role: Role.WORKER, departmentId: '', initialVacation: 0, initialOvertime: 0 });
  const [editTab, setEditTab] = useState<'profile'|'absences'|'overtime'|'adjustments'>('profile');
  const [userForm, setUserForm] = useState<Partial<User>>({});
  
  // Adjustment States
  const [adjDays, setAdjDays] = useState(0);
  const [adjReason, setAdjReason] = useState('');
  const [adjHours, setAdjHours] = useState(0);
  const [adjHoursDesc, setAdjHoursDesc] = useState('');
  const [adminReqForm, setAdminReqForm] = useState({ typeId: '', startDate: '', endDate: '', comment: '' });
  const [adminRedeemForm, setAdminRedeemForm] = useState({ hours: 0, type: RedemptionType.PAYROLL });

  const { departments, absenceTypes } = useData(); // Needed for forms

  const handleAddUser = (e: React.FormEvent) => {
      e.preventDefault();
      addUser(
          { name: newUser.name, email: newUser.email, role: newUser.role, departmentId: newUser.departmentId }, 
          newUser.initialVacation, 
          newUser.initialOvertime
      );
      setShowAddUserModal(false);
      setNewUser({ name: '', email: '', role: Role.WORKER, departmentId: '', initialVacation: 0, initialOvertime: 0 });
  };

  const openEditUserModal = (user: User) => {
      setEditingUser(user);
      setUserForm({ ...user, password: '' });
      setEditTab('profile');
      setAdminReqForm({ typeId: '', startDate: '', endDate: '', comment: '' });
      setAdminRedeemForm({ hours: 0, type: RedemptionType.PAYROLL });
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
      e.preventDefault();
      if (editingUser) {
          const updates: any = {
              name: userForm.name,
              email: userForm.email,
              role: userForm.role,
              departmentId: userForm.departmentId,
              calendarColor: userForm.calendarColor
          };
          if (userForm.password) updates.password = userForm.password;
          updateUser(editingUser.id, updates);
          setEditingUser(null);
      }
  };

  // --- DEPARTMENT LOGIC ---
  const handleOpenDeptModal = (dept?: Department) => {
      if (dept) {
          setDeptForm(dept);
      } else {
          setDeptForm({ name: '', supervisorIds: [] });
      }
      setShowDeptModal(true);
  };

  const handleSaveDepartment = (e: React.FormEvent) => {
      e.preventDefault();
      if (deptForm.id) {
          updateDepartment(deptForm as Department);
      } else {
          addDepartment(deptForm.name!, deptForm.supervisorIds);
      }
      setShowDeptModal(false);
  };

  const toggleSupervisor = (userId: string) => {
      const currentIds = deptForm.supervisorIds || [];
      if (currentIds.includes(userId)) {
          setDeptForm({ ...deptForm, supervisorIds: currentIds.filter(id => id !== userId) });
      } else {
          setDeptForm({ ...deptForm, supervisorIds: [...currentIds, userId] });
      }
  };

  // --- ABSENCE TYPE LOGIC ---
  const handleOpenAbsenceModal = (type?: AbsenceType) => {
      if (type) {
          setAbsenceForm(type);
      } else {
          setAbsenceForm({ name: '', color: 'bg-blue-100 text-blue-800', deductsDays: false, isClosedRange: false });
      }
      setShowAbsenceModal(true);
  };

  const handleSaveAbsenceType = (e: React.FormEvent) => {
      e.preventDefault();
      if (absenceForm.id) {
          updateAbsenceType(absenceForm as AbsenceType);
      } else {
          createAbsenceType(absenceForm as any);
      }
      setShowAbsenceModal(false);
  };

  const { users } = useData();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Panel de Administración</h2>
      
      <div className="flex space-x-1 border-b border-slate-200 overflow-x-auto">
          <button onClick={() => setActiveTab('users')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'users' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Usuarios</button>
          <button onClick={() => setActiveTab('depts')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'depts' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Departamentos</button>
          <button onClick={() => setActiveTab('absences')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'absences' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Tipos Ausencia</button>
          <button onClick={() => setActiveTab('shifts')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'shifts' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Turnos</button>
          <button onClick={() => setActiveTab('config')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'config' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Comunicaciones</button>
      </div>

      <div className="min-h-[400px]">
          {activeTab === 'users' && <UsersTab onAddUser={() => setShowAddUserModal(true)} onEditUser={openEditUserModal} />}
          {activeTab === 'depts' && <DeptsTab onAddDept={() => handleOpenDeptModal()} onEditDept={handleOpenDeptModal} />}
          {activeTab === 'absences' && <AbsencesTab onAddAbsence={() => handleOpenAbsenceModal()} onEditAbsence={handleOpenAbsenceModal} />}
          {activeTab === 'shifts' && <ShiftsTab />}
          {activeTab === 'config' && <ConfigTab />}
      </div>

      {/* --- MODALS --- */}
      {/* 1. Add/Edit Department Modal */}
      {showDeptModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-lg text-slate-800">{deptForm.id ? 'Editar Departamento' : 'Nuevo Departamento'}</h3>
                      <button onClick={() => setShowDeptModal(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
                  </div>
                  <form onSubmit={handleSaveDepartment} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                          <input type="text" required className="w-full border p-2 rounded-lg" value={deptForm.name} onChange={e => setDeptForm({...deptForm, name: e.target.value})} />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-2">Supervisores Asignados</label>
                          <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-1 bg-slate-50">
                              {users.filter(u => u.role === Role.ADMIN || u.role === Role.SUPERVISOR).map(u => (
                                  <label key={u.id} className="flex items-center space-x-2 p-1 hover:bg-white rounded cursor-pointer">
                                      <input 
                                          type="checkbox" 
                                          className="rounded text-primary focus:ring-primary"
                                          checked={deptForm.supervisorIds?.includes(u.id)}
                                          onChange={() => toggleSupervisor(u.id)}
                                      />
                                      <span className="text-sm text-slate-700">{u.name}</span>
                                  </label>
                              ))}
                          </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                          <button type="button" onClick={() => setShowDeptModal(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-lg">Cancelar</button>
                          <button type="submit" className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700">Guardar</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* 2. Add/Edit Absence Type Modal */}
      {showAbsenceModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-lg text-slate-800">{absenceForm.id ? 'Editar Tipo' : 'Nuevo Tipo Ausencia'}</h3>
                      <button onClick={() => setShowAbsenceModal(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
                  </div>
                  <form onSubmit={handleSaveAbsenceType} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                          <input type="text" required className="w-full border p-2 rounded-lg" value={absenceForm.name} onChange={e => setAbsenceForm({...absenceForm, name: e.target.value})} />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Color (Estilo)</label>
                          <select className="w-full border p-2 rounded-lg" value={absenceForm.color} onChange={e => setAbsenceForm({...absenceForm, color: e.target.value})}>
                              <option value="bg-blue-100 text-blue-800">Azul</option>
                              <option value="bg-emerald-100 text-emerald-800">Verde</option>
                              <option value="bg-amber-100 text-amber-800">Ámbar</option>
                              <option value="bg-red-100 text-red-800">Rojo</option>
                              <option value="bg-purple-100 text-purple-800">Morado</option>
                              <option value="bg-gray-100 text-gray-800">Gris</option>
                          </select>
                      </div>
                      <div className="flex items-center space-x-4">
                          <label className="flex items-center space-x-2 text-sm text-slate-700">
                              <input type="checkbox" checked={absenceForm.deductsDays} onChange={e => setAbsenceForm({...absenceForm, deductsDays: e.target.checked})} className="rounded text-primary focus:ring-primary" />
                              <span>Descuenta de Vacaciones</span>
                          </label>
                      </div>
                      <div className="flex items-center space-x-4">
                          <label className="flex items-center space-x-2 text-sm text-slate-700">
                              <input type="checkbox" checked={absenceForm.isClosedRange} onChange={e => setAbsenceForm({...absenceForm, isClosedRange: e.target.checked})} className="rounded text-primary focus:ring-primary" />
                              <span>Rango Cerrado (Fechas fijas)</span>
                          </label>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                          <button type="button" onClick={() => setShowAbsenceModal(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-lg">Cancelar</button>
                          <button type="submit" className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700">Guardar</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* 3. Add User Modal */}
      {showAddUserModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl animate-in zoom-in duration-200">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-bold text-xl text-slate-800">Añadir Usuario</h3>
                      <button onClick={() => setShowAddUserModal(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
                  </div>
                  <form onSubmit={handleAddUser} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                              <input type="text" required className="w-full border p-2 rounded-lg" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                              <input type="email" required className="w-full border p-2 rounded-lg" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
                          </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
                              <select className="w-full border p-2 rounded-lg" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as Role})}>
                                  <option value={Role.WORKER}>Trabajador</option>
                                  <option value={Role.SUPERVISOR}>Supervisor</option>
                                  <option value={Role.ADMIN}>Administrador</option>
                              </select>
                          </div>
                          <div>
                              <label className="block text-sm font-medium text-slate-700 mb-1">Departamento</label>
                              <select className="w-full border p-2 rounded-lg" value={newUser.departmentId} onChange={e => setNewUser({...newUser, departmentId: e.target.value})}>
                                  <option value="">Sin Departamento</option>
                                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                              </select>
                          </div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                          <h4 className="font-semibold text-sm text-slate-700 mb-3">Saldos Iniciales (Opcional)</h4>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="block text-xs uppercase font-bold text-slate-500 mb-1">Días Vacaciones</label>
                                  <input type="number" className="w-full border p-2 rounded-lg text-sm" value={newUser.initialVacation} onChange={e => setNewUser({...newUser, initialVacation: Number(e.target.value)})} />
                              </div>
                              <div>
                                  <label className="block text-xs uppercase font-bold text-slate-500 mb-1">Horas Extras</label>
                                  <input type="number" step="0.5" className="w-full border p-2 rounded-lg text-sm" value={newUser.initialOvertime} onChange={e => setNewUser({...newUser, initialOvertime: Number(e.target.value)})} />
                              </div>
                          </div>
                      </div>
                      <div className="flex justify-end gap-2 mt-4">
                          <button type="button" onClick={() => setShowAddUserModal(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-lg">Cancelar</button>
                          <button type="submit" className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700">Crear Usuario</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* 4. Edit User Modal (Detailed) */}
      {editingUser && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl animate-in zoom-in duration-200 overflow-hidden">
                  <div className="px-8 py-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                      <div className="flex items-center space-x-4">
                          <img src={editingUser.avatarUrl} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" alt=""/>
                          <div>
                              <h2 className="text-xl font-bold text-slate-800">{editingUser.name}</h2>
                              <p className="text-sm text-slate-500">{editingUser.email}</p>
                          </div>
                      </div>
                      <button onClick={() => setEditingUser(null)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500"><X /></button>
                  </div>
                  <div className="flex border-b border-slate-200 px-8">
                      <button onClick={() => setEditTab('profile')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${editTab === 'profile' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Perfil</button>
                      <button onClick={() => setEditTab('absences')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${editTab === 'absences' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Ausencias</button>
                      <button onClick={() => setEditTab('overtime')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${editTab === 'overtime' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Bolsa Horas</button>
                      <button onClick={() => setEditTab('adjustments')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${editTab === 'adjustments' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Ajustes</button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-8 bg-white">
                      {editTab === 'profile' && (
                          <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-2xl">
                              <div className="grid grid-cols-2 gap-6">
                                  <div>
                                      <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                                      <input type="text" className="w-full border p-2 rounded-lg" value={userForm.name || ''} onChange={e => setUserForm({...userForm, name: e.target.value})} />
                                  </div>
                                  <div>
                                      <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                      <input type="email" className="w-full border p-2 rounded-lg" value={userForm.email || ''} onChange={e => setUserForm({...userForm, email: e.target.value})} />
                                  </div>
                                  <div>
                                      <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
                                      <select className="w-full border p-2 rounded-lg" value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value as Role})}>
                                          <option value={Role.WORKER}>Trabajador</option>
                                          <option value={Role.SUPERVISOR}>Supervisor</option>
                                          <option value={Role.ADMIN}>Administrador</option>
                                      </select>
                                  </div>
                                  <div>
                                      <label className="block text-sm font-medium text-slate-700 mb-1">Departamento</label>
                                      <select className="w-full border p-2 rounded-lg" value={userForm.departmentId || ''} onChange={e => setUserForm({...userForm, departmentId: e.target.value})}>
                                          <option value="">Sin Departamento</option>
                                          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                      </select>
                                  </div>
                                  <div>
                                      <label className="block text-sm font-medium text-slate-700 mb-1">Color Calendario</label>
                                      <div className="flex gap-2">
                                          {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1'].map(c => (
                                              <button key={c} type="button" onClick={() => setUserForm({...userForm, calendarColor: c})} className={`w-6 h-6 rounded-full border-2 ${userForm.calendarColor === c ? 'border-slate-800' : 'border-transparent'}`} style={{ backgroundColor: c }} />
                                          ))}
                                      </div>
                                  </div>
                                  <div>
                                      <label className="block text-sm font-medium text-slate-700 mb-1">Nueva Contraseña</label>
                                      <div className="relative">
                                          <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                          <input type="password" placeholder="Cambiar contraseña..." className="w-full border pl-9 p-2 rounded-lg" value={userForm.password || ''} onChange={e => setUserForm({...userForm, password: e.target.value})} />
                                      </div>
                                  </div>
                              </div>
                              <div className="pt-4 border-t">
                                  <button type="submit" className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">Guardar Cambios</button>
                              </div>
                          </form>
                      )}
                      {editTab === 'absences' && (
                          <div className="space-y-6">
                              <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
                                  <h5 className="font-bold text-slate-800 text-sm mb-3">Registrar Nueva Ausencia (Aprobación Automática)</h5>
                                  <form onSubmit={(e) => { e.preventDefault(); if(editingUser && adminReqForm.typeId && adminReqForm.startDate && adminReqForm.endDate) { addRequest({ userId: editingUser.id, typeId: adminReqForm.typeId, startDate: adminReqForm.startDate, endDate: adminReqForm.endDate, comment: adminReqForm.comment || 'Creado por Administración' }, RequestStatus.APPROVED); setAdminReqForm({ typeId: '', startDate: '', endDate: '', comment: '' }); alert('Ausencia creada y aprobada.'); } }} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                                      <div className="md:col-span-1">
                                          <select required className="w-full border p-2 rounded text-sm" value={adminReqForm.typeId} onChange={e => setAdminReqForm({...adminReqForm, typeId: e.target.value})}>
                                              <option value="">Tipo...</option>
                                              {absenceTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                          </select>
                                      </div>
                                      <div><input type="date" required className="w-full border p-2 rounded text-sm" value={adminReqForm.startDate} onChange={e => setAdminReqForm({...adminReqForm, startDate: e.target.value})} /></div>
                                      <div><input type="date" required className="w-full border p-2 rounded text-sm" value={adminReqForm.endDate} onChange={e => setAdminReqForm({...adminReqForm, endDate: e.target.value})} /></div>
                                      <button type="submit" className="bg-emerald-600 text-white p-2 rounded text-sm font-medium hover:bg-emerald-700">Crear</button>
                                  </form>
                              </div>
                              <div className="border rounded-lg overflow-hidden">
                                  <table className="w-full text-sm">
                                      <thead className="bg-slate-50"><tr><th className="px-4 py-2 text-left">Fechas</th><th className="px-4 py-2 text-left">Tipo</th><th className="px-4 py-2 text-left">Estado</th><th className="px-4 py-2 text-right">Acción</th></tr></thead>
                                      <tbody className="divide-y">{requests.filter(r => r.userId === editingUser.id).map(r => (<tr key={r.id}><td className="px-4 py-2">{new Date(r.startDate).toLocaleDateString()} - {new Date(r.endDate).toLocaleDateString()}</td><td className="px-4 py-2">{absenceTypes.find(t => t.id === r.typeId)?.name}</td><td className="px-4 py-2"><span className="bg-slate-100 px-2 py-0.5 rounded text-xs">{r.status}</span></td><td className="px-4 py-2 text-right"><button onClick={() => deleteRequest(r.id)} className="text-red-500 hover:underline">Eliminar</button></td></tr>))}</tbody>
                                  </table>
                              </div>
                          </div>
                      )}
                      {editTab === 'overtime' && (
                          <div className="space-y-6">
                              <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                                  <h5 className="font-bold text-purple-900 text-sm mb-3">Canjear Horas (Consumo Administrativo)</h5>
                                  <form onSubmit={(e) => { e.preventDefault(); if(editingUser && adminRedeemForm.hours > 0) { const userOvertime = overtime.filter(o => o.userId === editingUser.id && o.status === RequestStatus.APPROVED && o.hours > 0 && o.consumed < o.hours); const linkedIds = userOvertime.map(o => o.id); requestRedemption(adminRedeemForm.hours, linkedIds, adminRedeemForm.type, editingUser.id, RequestStatus.APPROVED); setAdminRedeemForm({ hours: 0, type: RedemptionType.PAYROLL }); alert('Canje procesado.'); } }} className="flex gap-3 items-end">
                                      <div><label className="block text-xs font-bold text-purple-700 mb-1">Horas</label><input type="number" step="0.5" required className="w-32 border p-2 rounded text-sm" value={adminRedeemForm.hours} onChange={e => setAdminRedeemForm({...adminRedeemForm, hours: Number(e.target.value)})} /></div>
                                      <div className="flex-1"><label className="block text-xs font-bold text-purple-700 mb-1">Motivo</label><select className="w-full border p-2 rounded text-sm" value={adminRedeemForm.type} onChange={e => setAdminRedeemForm({...adminRedeemForm, type: e.target.value as RedemptionType})}><option value={RedemptionType.PAYROLL}>Abono en Nómina</option><option value={RedemptionType.TIME_OFF}>Horas Libres</option><option value={RedemptionType.DAYS_EXCHANGE}>Días Libres</option></select></div>
                                      <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-purple-700">Canjear</button>
                                  </form>
                              </div>
                              <div className="border rounded-lg overflow-hidden">
                                  <table className="w-full text-sm">
                                      <thead className="bg-slate-50"><tr><th className="px-4 py-2 text-left">Fecha</th><th className="px-4 py-2 text-center">Horas</th><th className="px-4 py-2 text-left">Concepto</th><th className="px-4 py-2 text-right">Acción</th></tr></thead>
                                      <tbody className="divide-y">{overtime.filter(o => o.userId === editingUser.id).map(o => (<tr key={o.id}><td className="px-4 py-2">{new Date(o.date).toLocaleDateString()}</td><td className={`px-4 py-2 text-center font-bold ${o.hours > 0 ? 'text-emerald-600' : 'text-purple-600'}`}>{o.hours > 0 ? '+' : ''}{o.hours}h</td><td className="px-4 py-2 truncate max-w-[200px]">{o.description}</td><td className="px-4 py-2 text-right"><button onClick={() => deleteOvertime(o.id)} className="text-red-500 hover:underline">Eliminar</button></td></tr>))}</tbody>
                                  </table>
                              </div>
                          </div>
                      )}
                      {editTab === 'adjustments' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
                                  <h4 className="font-bold text-slate-800 mb-4 flex items-center"><CalendarDays size={18} className="mr-2"/> Ajuste Vacaciones</h4>
                                  <form onSubmit={(e) => { e.preventDefault(); if(editingUser) { adjustUserVacation(editingUser.id, Number(adjDays), adjReason || 'Ajuste Manual Admin'); setAdjDays(0); setAdjReason(''); } }} className="space-y-3">
                                      <input type="number" placeholder="Días (+/-)" className="w-full border p-2 rounded" value={adjDays} onChange={e => setAdjDays(Number(e.target.value))} />
                                      <input type="text" placeholder="Motivo" className="w-full border p-2 rounded" value={adjReason} onChange={e => setAdjReason(e.target.value)} />
                                      <button type="submit" className="w-full bg-slate-800 text-white py-2 rounded hover:bg-slate-700">Aplicar Ajuste</button>
                                  </form>
                              </div>
                              <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
                                  <h4 className="font-bold text-slate-800 mb-4 flex items-center"><Clock size={18} className="mr-2"/> Ajuste Horas</h4>
                                  <form onSubmit={(e) => { e.preventDefault(); if(editingUser) { addOvertime({ userId: editingUser.id, date: new Date().toISOString(), hours: Number(adjHours), description: adjHoursDesc || 'Ajuste Manual Admin', status: RequestStatus.APPROVED }); setAdjHours(0); setAdjHoursDesc(''); } }} className="space-y-3">
                                      <input type="number" step="0.5" placeholder="Horas (+/-)" className="w-full border p-2 rounded" value={adjHours} onChange={e => setAdjHours(Number(e.target.value))} />
                                      <input type="text" placeholder="Motivo" className="w-full border p-2 rounded" value={adjHoursDesc} onChange={e => setAdjHoursDesc(e.target.value)} />
                                      <button type="submit" className="w-full bg-slate-800 text-white py-2 rounded hover:bg-slate-700">Aplicar Ajuste</button>
                                  </form>
                              </div>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default AdminPanel;
