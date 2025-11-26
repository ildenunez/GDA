import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { RequestStatus, RedemptionType, OvertimeRecord } from '../types';
import { Plus, Clock, Calendar as CalendarIcon, Info, FileText, X, Printer, Trash2, AlertCircle } from 'lucide-react';

const MySpace = () => {
  const { currentUser, absenceTypes, requests, overtime, addRequest, addOvertime, requestRedemption, deleteRequest, deleteOvertime } = useData();
  
  // Forms State
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [showOvertimeModal, setShowOvertimeModal] = useState(false);
  const [showConsumeModal, setShowConsumeModal] = useState(false);
  
  // Detail State
  const [selectedRedemption, setSelectedRedemption] = useState<OvertimeRecord | null>(null);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{show: boolean, id: string, type: 'REQUEST' | 'OVERTIME'} | null>(null);

  // Absence Form Data
  const [absenceForm, setAbsenceForm] = useState({
    typeId: '',
    startDate: '',
    endDate: '',
    comment: ''
  });

  // Overtime Form Data
  const [overtimeForm, setOvertimeForm] = useState({
    date: '',
    hours: 0,
    description: ''
  });

  // Consume Overtime Data
  const [consumeHours, setConsumeHours] = useState(0);
  const [selectedOvertimeIds, setSelectedOvertimeIds] = useState<string[]>([]);
  const [redemptionType, setRedemptionType] = useState<RedemptionType>(RedemptionType.TIME_OFF);

  // Filter valid absence types
  const validAbsenceTypes = absenceTypes;

  const handleAbsenceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser) {
      addRequest({
        userId: currentUser.id,
        typeId: absenceForm.typeId,
        startDate: absenceForm.startDate,
        endDate: absenceForm.endDate,
        comment: absenceForm.comment
      });
      setShowAbsenceModal(false);
      setAbsenceForm({ typeId: '', startDate: '', endDate: '', comment: '' });
    }
  };

  const handleDeleteRequestClick = (id: string) => {
      setConfirmModal({ show: true, id, type: 'REQUEST' });
  };

  const handleDeleteOvertimeClick = (id: string) => {
      setConfirmModal({ show: true, id, type: 'OVERTIME' });
  };

  const executeDelete = () => {
      if (confirmModal) {
          if (confirmModal.type === 'REQUEST') deleteRequest(confirmModal.id);
          if (confirmModal.type === 'OVERTIME') deleteOvertime(confirmModal.id);
          setConfirmModal(null);
      }
  };

  const handleOvertimeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser) {
      addOvertime({
        userId: currentUser.id,
        date: overtimeForm.date,
        hours: Number(overtimeForm.hours),
        description: overtimeForm.description
      });
      setShowOvertimeModal(false);
      setOvertimeForm({ date: '', hours: 0, description: '' });
    }
  };

  const handleConsumeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    requestRedemption(Number(consumeHours), selectedOvertimeIds, redemptionType);
    setShowConsumeModal(false);
    setConsumeHours(0);
    setSelectedOvertimeIds([]);
    setRedemptionType(RedemptionType.TIME_OFF);
  };

  const handlePrint = () => {
      // Small delay to ensure render is complete before printing (though usually React is fast enough)
      setTimeout(() => window.print(), 100);
  };

  // Helper for translating redemption type
  const getRedemptionLabel = (type?: RedemptionType) => {
      switch(type) {
          case RedemptionType.PAYROLL: return 'Abono en Nómina';
          case RedemptionType.DAYS_EXCHANGE: return 'Canje por Días';
          case RedemptionType.TIME_OFF: return 'Horas Libres';
          default: return 'Canje';
      }
  };

  // Helper calculation
  const myApprovedOvertime = overtime.filter(o => o.userId === currentUser?.id && o.status === RequestStatus.APPROVED && o.hours > 0 && o.consumed < o.hours);
  const availableBalance = myApprovedOvertime.reduce((acc, curr) => acc + (curr.hours - curr.consumed), 0);

  // Calculate days for preview
  const calculateRequestDays = () => {
    if (!absenceForm.startDate || !absenceForm.endDate) return 0;
    
    const start = new Date(absenceForm.startDate);
    start.setHours(12, 0, 0, 0);
    const end = new Date(absenceForm.endDate);
    end.setHours(12, 0, 0, 0);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
    if (start > end) return 0;
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
    return diffDays;
  };

  const requestDaysPreview = calculateRequestDays();

  // SORTED DATA LISTS
  const myRequests = requests
    .filter(r => r.userId === currentUser?.id)
    .sort((a, b) => b.startDate.localeCompare(a.startDate)); // Newest first

  const myOvertime = overtime
    .filter(o => o.userId === currentUser?.id)
    .sort((a, b) => b.date.localeCompare(a.date)); // Newest first

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Mi Espacio</h2>
          <p className="text-slate-500">Gestiona tus ausencias y bolsa de horas.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* CARD 1: ABSENCES */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
               <h3 className="font-bold text-slate-700 flex items-center">
                   <CalendarIcon className="mr-2 text-primary" size={20} />
                   Ausencias
               </h3>
               <button onClick={() => setShowAbsenceModal(true)} className="flex items-center px-3 py-1.5 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition-colors shadow-md shadow-primary/20">
                    <Plus size={16} className="mr-1.5" /> Nueva
                </button>
            </div>
            <div className="p-0 overflow-x-auto flex-1">
                 <table className="w-full">
                    <thead className="bg-slate-50/50">
                        <tr className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            <th className="pl-6 py-3">Tipo</th>
                            <th className="py-3">Fechas</th>
                            <th className="py-3 text-right">Estado</th>
                            <th className="pr-6 py-3 text-right w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {myRequests.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-slate-400 text-sm">No tienes solicitudes.</td></tr>
                        ) : myRequests.map(req => {
                            const type = absenceTypes.find(t => t.id === req.typeId);
                            return (
                                <tr key={req.id} className="text-sm hover:bg-slate-50/50 transition-colors group">
                                    <td className="pl-6 py-4">
                                        <div className="flex flex-col">
                                            <span className={`px-2 py-0.5 rounded w-fit text-xs font-bold ${type?.color}`}>
                                                {type?.name}
                                            </span>
                                            <span className="text-xs text-slate-400 mt-1 truncate max-w-[150px]">{req.comment}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 text-slate-600">
                                        <div className="flex flex-col">
                                           <span className="font-medium">{new Date(req.startDate).toLocaleDateString()}</span>
                                           <span className="text-xs text-slate-400">al {new Date(req.endDate).toLocaleDateString()}</span>
                                        </div>
                                    </td>
                                    <td className="py-4 text-right">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                            req.status === RequestStatus.APPROVED ? 'text-emerald-700 bg-emerald-100' : 
                                            req.status === RequestStatus.REJECTED ? 'text-red-700 bg-red-100' : 
                                            'text-amber-700 bg-amber-100'
                                        }`}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td className="pr-6 py-4 text-right">
                                        <button onClick={() => handleDeleteRequestClick(req.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>

        {/* CARD 2: OVERTIME BAG */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
               <h3 className="font-bold text-slate-700 flex items-center">
                   <Clock className="mr-2 text-secondary" size={20} />
                   Bolsa de Horas
               </h3>
               <button onClick={() => setShowOvertimeModal(true)} className="flex items-center px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-sm rounded-lg hover:bg-slate-50 transition-colors">
                    <Plus size={16} className="mr-1.5" /> Registrar
                </button>
            </div>
            
            <div className="bg-slate-50 px-6 py-4 flex justify-between items-center border-b border-slate-100">
                  <div>
                      <p className="text-xs text-slate-500 uppercase font-semibold">Saldo Disponible</p>
                      <p className="text-3xl font-bold text-slate-800 tracking-tight">{availableBalance}h</p>
                  </div>
                  <button 
                    onClick={() => setShowConsumeModal(true)} 
                    disabled={availableBalance <= 0}
                    className="text-sm font-medium text-white bg-slate-800 px-4 py-2 rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-slate-200"
                  >
                      Canjear Saldo
                  </button>
            </div>

            <div className="p-0 overflow-x-auto flex-1">
               <table className="w-full">
                    <thead className="bg-slate-50/50">
                        <tr className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            <th className="pl-6 py-3">Fecha / Concepto</th>
                            <th className="py-3 text-center">Horas</th>
                            <th className="py-3 text-right">Estado</th>
                            <th className="pr-6 py-3 text-right w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {myOvertime.length === 0 ? (
                           <tr><td colSpan={4} className="p-8 text-center text-slate-400 text-sm">No hay actividad.</td></tr>
                        ) : myOvertime.map(rec => {
                            const isApprovedRedemption = rec.hours < 0 && rec.status === RequestStatus.APPROVED;
                            return (
                                <tr key={rec.id} className="text-sm hover:bg-slate-50/50 transition-colors">
                                    <td className="pl-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-slate-700">{new Date(rec.date).toLocaleDateString()}</span>
                                            <div className="flex items-center">
                                                <span className="text-xs text-slate-500 truncate max-w-[150px] block">
                                                    {rec.description}
                                                </span>
                                                {rec.isAdjustment && <span className="ml-1 text-[10px] bg-blue-100 text-blue-700 px-1 rounded">ADMIN</span>}
                                                {rec.redemptionType && <span className="ml-1 text-[10px] bg-purple-100 text-purple-700 px-1 rounded">CANJE</span>}
                                            </div>
                                            {isApprovedRedemption && (
                                                <button 
                                                    onClick={() => setSelectedRedemption(rec)}
                                                    className="text-xs text-primary hover:text-primary/80 mt-1 flex items-center font-medium w-fit"
                                                >
                                                    <FileText size={10} className="mr-1" /> Ver Detalle
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    <td className={`py-4 text-center font-bold ${rec.hours > 0 ? 'text-emerald-600' : 'text-slate-600'}`}>
                                        {rec.hours > 0 ? '+' : ''}{rec.hours}h
                                    </td>
                                    <td className="py-4 text-right">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                rec.status === RequestStatus.APPROVED ? 'text-emerald-700 bg-emerald-100' : 
                                                rec.status === RequestStatus.REJECTED ? 'text-red-700 bg-red-100' : 
                                                'text-amber-700 bg-amber-100'
                                            }`}>
                                                {rec.status}
                                        </span>
                                    </td>
                                    <td className="pr-6 py-4 text-right">
                                        <button onClick={() => handleDeleteOvertimeClick(rec.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
      </div>

      {/* MODALS */}
      
      {/* 1. Absence Modal */}
      {showAbsenceModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
             <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
               <h3 className="font-semibold text-slate-800">Nueva Ausencia</h3>
               <button onClick={() => setShowAbsenceModal(false)} className="text-slate-400 hover:text-slate-600"><Plus className="rotate-45" /></button>
             </div>
             <form onSubmit={handleAbsenceSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Ausencia</label>
                  <select required className="w-full rounded-lg border-slate-300 border p-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    value={absenceForm.typeId} onChange={e => setAbsenceForm({...absenceForm, typeId: e.target.value})}
                  >
                    <option value="">Seleccionar...</option>
                    {validAbsenceTypes.map(t => (
                      <option key={t.id} value={t.id}>{t.name} {t.isClosedRange ? '(Rango Cerrado)' : ''}</option>
                    ))}
                  </select>
                </div>
                {absenceForm.typeId && absenceTypes.find(t => t.id === absenceForm.typeId)?.isClosedRange ? (
                   <div>
                      <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded mb-2">Este tipo de ausencia tiene fechas predefinidas.</p>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Rango Disponible</label>
                      <select required className="w-full rounded-lg border-slate-300 border p-2 text-sm"
                        onChange={e => {
                           const [start, end] = e.target.value.split('|');
                           setAbsenceForm({...absenceForm, startDate: start, endDate: end});
                        }}
                      >
                         <option value="">Seleccionar fechas...</option>
                         {absenceTypes.find(t => t.id === absenceForm.typeId)?.availableRanges?.map((r, i) => (
                           <option key={i} value={`${r.start}|${r.end}`}>{new Date(r.start).toLocaleDateString()} - {new Date(r.end).toLocaleDateString()}</option>
                         ))}
                      </select>
                   </div>
                ) : (
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Desde</label>
                        <input type="date" required className="w-full rounded-lg border-slate-300 border p-2 text-sm" 
                          value={absenceForm.startDate || ''} onChange={e => setAbsenceForm({...absenceForm, startDate: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Hasta</label>
                        <input type="date" required className="w-full rounded-lg border-slate-300 border p-2 text-sm" 
                          value={absenceForm.endDate || ''} onChange={e => setAbsenceForm({...absenceForm, endDate: e.target.value})}
                        />
                      </div>
                   </div>
                )}

                {requestDaysPreview > 0 && (
                    <div className="bg-primary/5 border border-primary/10 rounded-lg p-3 flex items-center">
                        <Clock className="text-primary mr-2" size={16} />
                        <span className="text-sm font-medium text-slate-700">
                            Total: <span className="font-bold text-primary">{requestDaysPreview} días</span>
                        </span>
                    </div>
                )}

                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Comentario</label>
                   <textarea className="w-full rounded-lg border-slate-300 border p-2 text-sm" rows={3}
                     value={absenceForm.comment} onChange={e => setAbsenceForm({...absenceForm, comment: e.target.value})}
                   ></textarea>
                </div>
                <div className="pt-2">
                  <button type="submit" className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary/90 transition-colors">Solicitar</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* 2. Overtime Registration Modal */}
      {showOvertimeModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
             <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
               <h3 className="font-semibold text-slate-800">Registrar Horas Extras</h3>
               <button onClick={() => setShowOvertimeModal(false)} className="text-slate-400 hover:text-slate-600"><Plus className="rotate-45" /></button>
             </div>
             <form onSubmit={handleOvertimeSubmit} className="p-6 space-y-4">
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Fecha</label>
                   <input type="date" required className="w-full rounded-lg border-slate-300 border p-2 text-sm" 
                      value={overtimeForm.date} onChange={e => setOvertimeForm({...overtimeForm, date: e.target.value})}
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Horas</label>
                   <input type="number" step="0.5" min="0.5" required className="w-full rounded-lg border-slate-300 border p-2 text-sm" 
                      value={overtimeForm.hours} onChange={e => setOvertimeForm({...overtimeForm, hours: Number(e.target.value)})}
                   />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Justificación</label>
                   <textarea required className="w-full rounded-lg border-slate-300 border p-2 text-sm" rows={3}
                     value={overtimeForm.description} onChange={e => setOvertimeForm({...overtimeForm, description: e.target.value})}
                   ></textarea>
                </div>
                <button type="submit" className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary/90 transition-colors">Registrar</button>
             </form>
          </div>
        </div>
      )}

      {/* 3. Consume Modal */}
      {showConsumeModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
             <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
               <h3 className="font-semibold text-slate-800">Canjear Saldo de Horas</h3>
               <button onClick={() => setShowConsumeModal(false)} className="text-slate-400 hover:text-slate-600"><Plus className="rotate-45" /></button>
             </div>
             <form onSubmit={handleConsumeSubmit} className="p-6 space-y-5">
                <div className="bg-blue-50 p-3 rounded-lg flex items-start space-x-2">
                    <Info className="text-blue-600 mt-0.5 flex-shrink-0" size={16} />
                    <p className="text-xs text-blue-700">
                        Selecciona los registros de horas extras aprobadas que deseas utilizar para trazar el origen del saldo.
                    </p>
                </div>

                <div className="max-h-48 overflow-y-auto border border-slate-100 rounded-lg">
                    {myApprovedOvertime.length === 0 ? <p className="p-4 text-xs text-slate-400">No tienes horas aprobadas disponibles.</p> : 
                      myApprovedOvertime.map(rec => (
                        <div key={rec.id} className="flex items-center p-3 border-b border-slate-50 last:border-0 hover:bg-slate-50">
                           <input type="checkbox" className="mr-3 rounded text-primary focus:ring-primary" 
                              checked={selectedOvertimeIds.includes(rec.id)}
                              onChange={e => {
                                 if (e.target.checked) setSelectedOvertimeIds([...selectedOvertimeIds, rec.id]);
                                 else setSelectedOvertimeIds(selectedOvertimeIds.filter(id => id !== rec.id));
                              }}
                           />
                           <div className="flex-1">
                              <div className="flex justify-between">
                                <span className="text-sm font-medium text-slate-700">{new Date(rec.date).toLocaleDateString()}</span>
                                <span className="text-xs text-primary font-bold">Disp: {rec.hours - rec.consumed}h</span>
                              </div>
                              <p className="text-xs text-slate-500 truncate">{rec.description}</p>
                           </div>
                        </div>
                      ))
                    }
                </div>

                <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Horas a Canjear</label>
                       <input type="number" step="0.5" min="0.5" required className="w-full rounded-lg border-slate-300 border p-2 text-sm" 
                          value={consumeHours} onChange={e => setConsumeHours(Number(e.target.value))}
                       />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Canje</label>
                        <select 
                            className="w-full rounded-lg border-slate-300 border p-2 text-sm"
                            value={redemptionType} onChange={e => setRedemptionType(e.target.value as RedemptionType)}
                        >
                            <option value={RedemptionType.TIME_OFF}>Horas Libres</option>
                            <option value={RedemptionType.DAYS_EXCHANGE}>Días Libres</option>
                            <option value={RedemptionType.PAYROLL}>Abono en Nómina</option>
                        </select>
                    </div>
                </div>

                <button type="submit" disabled={selectedOvertimeIds.length === 0 || consumeHours <= 0} className="w-full bg-slate-800 text-white py-2 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50">
                   Solicitar Canje
                </button>
             </form>
           </div>
        </div>
      )}

      {/* 4. Detail Redemption Modal - A4 PRINT OPTIMIZED */}
      {selectedRedemption && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col print-area">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 no-print">
                    <h3 className="font-bold text-slate-800">Detalle de Canje</h3>
                    <button onClick={() => setSelectedRedemption(null)} className="text-slate-400 hover:text-slate-600"><X /></button>
                </div>
                
                <div className="p-8">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 font-bold text-xl">
                                HR
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-800">RRHH CHS</h1>
                                <p className="text-sm text-slate-500">Informe de Consumo de Horas</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-medium text-slate-700 uppercase tracking-wide">Fecha Informe</p>
                            <p className="text-slate-500">{new Date(selectedRedemption.date).toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 mb-8">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Solicitante</p>
                                <p className="text-lg text-slate-800 font-bold">{currentUser?.name}</p>
                                <p className="text-sm text-slate-500">{currentUser?.email}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Total Canjeado</p>
                                <p className="text-3xl font-bold text-slate-800">{Math.abs(selectedRedemption.hours)}h</p>
                                <p className="text-sm text-purple-600 font-medium mt-1">{getRedemptionLabel(selectedRedemption.redemptionType)}</p>
                            </div>
                        </div>
                    </div>

                    <h4 className="font-bold text-slate-800 mb-4 pb-2 border-b border-slate-200 uppercase text-xs tracking-wider">Trazabilidad del Origen de Horas</h4>
                    <table className="w-full text-sm mb-8">
                        <thead>
                            <tr className="text-slate-500 text-xs uppercase text-left bg-slate-50">
                                <th className="py-3 pl-3 rounded-l-lg">Fecha Origen</th>
                                <th className="py-3">Motivo</th>
                                <th className="py-3 text-center">Generadas</th>
                                <th className="py-3 text-right pr-3 rounded-r-lg">Saldo Restante</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {selectedRedemption.linkedRecordIds?.map(id => {
                                const original = overtime.find(o => o.id === id);
                                if (!original) return null;
                                const remaining = original.hours - original.consumed;
                                return (
                                    <tr key={id}>
                                        <td className="py-3 pl-3 font-medium text-slate-700">{new Date(original.date).toLocaleDateString()}</td>
                                        <td className="py-3 text-slate-600 truncate max-w-[150px]">{original.description}</td>
                                        <td className="py-3 text-center font-bold text-emerald-600">+{original.hours}h</td>
                                        <td className="py-3 text-right pr-3">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${remaining === 0 ? 'bg-slate-100 text-slate-400' : 'bg-blue-100 text-blue-700'}`}>
                                                {remaining}h
                                            </span>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>

                    <div className="border-t-2 border-slate-800 pt-6 flex justify-between items-center mt-auto">
                        <p className="text-xs text-slate-400">Documento generado por la plataforma RRHH CHS.</p>
                        <div className="text-right">
                             <p className="text-xs uppercase font-bold text-slate-500">Total Solicitud</p>
                             <p className="font-bold text-xl text-slate-800">{Math.abs(selectedRedemption.hours)}h</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-2 no-print">
                    <button onClick={handlePrint} className="flex items-center px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 shadow-sm">
                        <Printer size={16} className="mr-2" /> Imprimir
                    </button>
                    <button onClick={() => setSelectedRedemption(null)} className="px-4 py-2 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {confirmModal && (
          <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full animate-in zoom-in duration-200">
                  <div className="flex items-center text-red-600 mb-4">
                      <AlertCircle className="mr-2" />
                      <h3 className="font-bold text-lg">Confirmar Eliminación</h3>
                  </div>
                  <p className="text-slate-600 text-sm mb-6">
                      ¿Estás seguro de que quieres eliminar este registro? <br/>
                      Esta acción restaurará los saldos correspondientes.
                  </p>
                  <div className="flex justify-end space-x-3">
                      <button 
                          onClick={() => setConfirmModal(null)}
                          className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg font-medium text-sm"
                      >
                          Cancelar
                      </button>
                      <button 
                          onClick={executeDelete}
                          className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg font-medium text-sm"
                      >
                          Eliminar
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default MySpace;