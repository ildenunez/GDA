import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Calendar, Clock, Plus, AlertCircle, FileText, CheckCircle, XCircle } from 'lucide-react';
import { RequestStatus, RedemptionType } from '../types';

const MySpace = () => {
    const { currentUser, absenceTypes, requests, addRequest, overtime, addOvertime, requestRedemption } = useData();
    const [activeTab, setActiveTab] = useState<'absence' | 'overtime'>('absence');
    
    // Absence Form
    const [absenceForm, setAbsenceForm] = useState({
        typeId: '',
        startDate: '',
        endDate: '',
        comment: ''
    });

    // Overtime Form
    const [otForm, setOtForm] = useState({
        date: '',
        hours: 0,
        description: ''
    });

    const handleAbsenceTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newTypeId = e.target.value;
        const type = absenceTypes.find(t => t.id === newTypeId);
        
        let newStart = absenceForm.startDate;
        let newEnd = absenceForm.endDate;
        
        // Auto-fill dates if closed range type and ranges exist
        if (type?.isClosedRange && type.availableRanges && type.availableRanges.length > 0) {
            // Default to the first available range
            newStart = type.availableRanges[0].start;
            newEnd = type.availableRanges[0].end;
        }
        
        setAbsenceForm({
            ...absenceForm, 
            typeId: newTypeId, 
            startDate: newStart, 
            endDate: newEnd
        });
    };

    const submitAbsence = (e: React.FormEvent) => {
        e.preventDefault();
        if(currentUser && absenceForm.typeId && absenceForm.startDate && absenceForm.endDate) {
            addRequest({
                userId: currentUser.id,
                ...absenceForm
            });
            setAbsenceForm({ typeId: '', startDate: '', endDate: '', comment: '' });
        }
    };

    const submitOvertime = (e: React.FormEvent) => {
        e.preventDefault();
        if(currentUser && otForm.date && otForm.hours) {
            addOvertime({
                userId: currentUser.id,
                ...otForm
            });
            setOtForm({ date: '', hours: 0, description: '' });
        }
    };

    const myRequests = requests.filter(r => r.userId === currentUser?.id).sort((a,b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    const myOvertime = overtime.filter(o => o.userId === currentUser?.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="space-y-8">
            <h2 className="text-2xl font-bold text-slate-800">Mi Espacio</h2>
            
            {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Absence Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center mb-6">
                        <div className="p-3 bg-blue-100 rounded-xl mr-4 text-blue-600">
                            <Calendar size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Solicitar Ausencia</h3>
                            <p className="text-slate-500 text-sm">Vacaciones, bajas y permisos</p>
                        </div>
                    </div>
                    
                    <form onSubmit={submitAbsence} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Ausencia</label>
                            <select 
                                required 
                                className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-blue-100"
                                value={absenceForm.typeId}
                                onChange={handleAbsenceTypeChange}
                            >
                                <option value="">Seleccionar...</option>
                                {absenceTypes.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Desde</label>
                                <input 
                                    type="date" 
                                    required
                                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white outline-none"
                                    value={absenceForm.startDate}
                                    onChange={e => setAbsenceForm({...absenceForm, startDate: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Hasta</label>
                                <input 
                                    type="date" 
                                    required
                                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white outline-none"
                                    value={absenceForm.endDate}
                                    onChange={e => setAbsenceForm({...absenceForm, endDate: e.target.value})}
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Comentario</label>
                            <textarea 
                                className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white outline-none h-20 resize-none"
                                placeholder="Motivo de la solicitud..."
                                value={absenceForm.comment}
                                onChange={e => setAbsenceForm({...absenceForm, comment: e.target.value})}
                            ></textarea>
                        </div>

                        <button type="submit" className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-700 transition-colors flex justify-center items-center">
                            <Plus size={18} className="mr-2" /> Enviar Solicitud
                        </button>
                    </form>
                </div>

                {/* Overtime Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center mb-6">
                        <div className="p-3 bg-emerald-100 rounded-xl mr-4 text-emerald-600">
                            <Clock size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800">Horas Extras</h3>
                            <p className="text-slate-500 text-sm">Registro y control de horas</p>
                        </div>
                    </div>

                    <form onSubmit={submitOvertime} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
                                <input 
                                    type="date" 
                                    required
                                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white outline-none"
                                    value={otForm.date}
                                    onChange={e => setOtForm({...otForm, date: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Horas</label>
                                <input 
                                    type="number" 
                                    step="0.5"
                                    required
                                    className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white outline-none"
                                    value={otForm.hours}
                                    onChange={e => setOtForm({...otForm, hours: Number(e.target.value)})}
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
                            <textarea 
                                required
                                className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 focus:bg-white outline-none h-20 resize-none"
                                placeholder="Trabajo realizado..."
                                value={otForm.description}
                                onChange={e => setOtForm({...otForm, description: e.target.value})}
                            ></textarea>
                        </div>

                        <button type="submit" className="w-full bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-slate-700 transition-colors flex justify-center items-center">
                            <Plus size={18} className="mr-2" /> Registrar Horas
                        </button>
                    </form>
                </div>
            </div>

            {/* History Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="flex border-b border-slate-200">
                    <button 
                        onClick={() => setActiveTab('absence')}
                        className={`flex-1 py-4 text-sm font-bold text-center transition-colors ${activeTab === 'absence' ? 'bg-slate-50 text-primary border-b-2 border-primary' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        Historial Ausencias
                    </button>
                    <button 
                        onClick={() => setActiveTab('overtime')}
                        className={`flex-1 py-4 text-sm font-bold text-center transition-colors ${activeTab === 'overtime' ? 'bg-slate-50 text-primary border-b-2 border-primary' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        Historial Horas
                    </button>
                </div>
                
                <div className="max-h-[400px] overflow-y-auto">
                    {activeTab === 'absence' ? (
                        <div className="divide-y divide-slate-100">
                            {myRequests.length === 0 && <p className="p-8 text-center text-slate-400 text-sm">No hay registros.</p>}
                            {myRequests.map(req => {
                                const type = absenceTypes.find(t => t.id === req.typeId);
                                return (
                                    <div key={req.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                                        <div className="flex items-center space-x-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${req.status === RequestStatus.APPROVED ? 'bg-emerald-100 text-emerald-600' : req.status === RequestStatus.REJECTED ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                                                {req.status === RequestStatus.APPROVED ? <CheckCircle size={20} /> : req.status === RequestStatus.REJECTED ? <XCircle size={20} /> : <Clock size={20} />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800">{type?.name || 'Ausencia'}</p>
                                                <p className="text-xs text-slate-500">{new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${req.status === RequestStatus.APPROVED ? 'bg-emerald-50 text-emerald-700' : req.status === RequestStatus.REJECTED ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>
                                            {req.status === RequestStatus.PENDING ? 'Pendiente' : req.status === RequestStatus.APPROVED ? 'Aprobado' : 'Rechazado'}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                             {myOvertime.length === 0 && <p className="p-8 text-center text-slate-400 text-sm">No hay registros.</p>}
                             {myOvertime.map(ot => (
                                 <div key={ot.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                                     <div className="flex items-center space-x-4">
                                         <div className={`w-10 h-10 rounded-full flex items-center justify-center ${ot.status === RequestStatus.APPROVED ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                             <Clock size={20} />
                                         </div>
                                         <div>
                                             <p className="font-bold text-slate-800">{ot.description}</p>
                                             <p className="text-xs text-slate-500">{new Date(ot.date).toLocaleDateString()}</p>
                                         </div>
                                     </div>
                                     <div className="text-right">
                                         <span className={`font-bold block ${ot.hours > 0 ? 'text-emerald-600' : 'text-purple-600'}`}>{ot.hours > 0 ? '+' : ''}{ot.hours}h</span>
                                         <span className="text-[10px] text-slate-400">{ot.status}</span>
                                     </div>
                                 </div>
                             ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MySpace;