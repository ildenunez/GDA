
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { RequestStatus, Role, RedemptionType, OvertimeRecord, AbsenceRequest } from '../types';
import { Check, X, FileText, Printer, Trash2, AlertCircle, Search, Calendar, Clock } from 'lucide-react';

const TeamManagement = () => {
  const { currentUser, users, departments, requests, overtime, updateRequestStatus, updateOvertimeStatus, absenceTypes, deleteRequest, deleteOvertime } = useData();

  // Detail Modal State
  const [selectedRedemption, setSelectedRedemption] = useState<OvertimeRecord | null>(null);
  
  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{show: boolean, id: string, type: 'REQUEST' | 'OVERTIME'} | null>(null);

  // Filter State
  const [historyFilter, setHistoryFilter] = useState('');

  // Determine managed departments
  const isAdmin = currentUser?.role === Role.ADMIN;
  
  const managedDepartmentIds = isAdmin 
    ? departments.map(d => d.id) 
    : departments.filter(d => d.supervisorIds.includes(currentUser?.id || '')).map(d => d.id);

  const teamUserIds = isAdmin 
     ? users.map(u => u.id)
     : users.filter(u => managedDepartmentIds.includes(u.departmentId) && u.id !== currentUser?.id).map(u => u.id);

  // --- DATA FILTERING ---
  
  // 1. Pending Items (Top Section)
  const pendingRequests = requests.filter(r => teamUserIds.includes(r.userId) && r.status === RequestStatus.PENDING);
  const pendingOvertime = overtime.filter(o => teamUserIds.includes(o.userId) && o.status === RequestStatus.PENDING);

  // 2. History Items (Bottom Section - Unified)
  const historyRequests = requests.filter(r => teamUserIds.includes(r.userId) && r.status !== RequestStatus.PENDING);
  const historyOvertime = overtime.filter(o => teamUserIds.includes(o.userId) && o.status !== RequestStatus.PENDING);

  // Combine and Sort History
  type HistoryItem = { type: 'ABSENCE', data: AbsenceRequest } | { type: 'OVERTIME', data: OvertimeRecord };
  
  const combinedHistory: HistoryItem[] = [
      ...historyRequests.map(r => ({ type: 'ABSENCE' as const, data: r })),
      ...historyOvertime.map(o => ({ type: 'OVERTIME' as const, data: o }))
  ].sort((a, b) => {
      const dateA = a.type === 'ABSENCE' ? a.data.startDate : a.data.date;
      const dateB = b.type === 'ABSENCE' ? b.data.startDate : b.data.date;
      return dateB.localeCompare(dateA); // Newest first
  });

  // Apply Name Filter
  const filteredHistory = combinedHistory.filter(item => {
      const user = users.find(u => u.id === item.data.userId);
      return user?.name.toLowerCase().includes(historyFilter.toLowerCase());
  });

  // --- HELPERS ---

  const getRedemptionLabel = (type?: RedemptionType) => {
      switch(type) {
          case RedemptionType.PAYROLL: return 'Abono en Nómina';
          case RedemptionType.DAYS_EXCHANGE: return 'Canje por Días';
          case RedemptionType.TIME_OFF: return 'Horas Libres';
          default: return 'Canje';
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

  const handlePrint = () => {
      window.print();
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Gestión de Equipo</h2>
        <p className="text-slate-500">
            {isAdmin ? 'Vista Global de Administrador: Todas las solicitudes.' : 'Gestiona las solicitudes de tu equipo.'}
        </p>
      </div>

      {/* --- TOP SECTION: PENDING REQUESTS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Absence Requests (Pending) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-700 flex items-center">
                <Calendar className="mr-2 text-primary" size={18} /> 
                Ausencias Pendientes
            </h3>
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-bold">{pendingRequests.length}</span>
          </div>
          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {pendingRequests.length === 0 ? (
                <p className="p-8 text-center text-slate-400 text-sm">No hay ausencias pendientes.</p>
            ) : pendingRequests.map(req => {
                const user = users.find(u => u.id === req.userId);
                const type = absenceTypes.find(t => t.id === req.typeId);
                const dept = departments.find(d => d.id === user?.departmentId);
                
                return (
                    <div key={req.id} className="p-6 hover:bg-slate-50 transition-colors relative group">
                        <button onClick={() => handleDeleteRequestClick(req.id)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                            <Trash2 size={16} />
                        </button>
                        <div className="flex justify-between items-start mb-2 pr-6">
                           <div className="flex items-center space-x-3">
                               <img src={user?.avatarUrl} className="w-10 h-10 rounded-full bg-slate-200 object-cover" alt="" />
                               <div>
                                   <p className="font-semibold text-slate-800">{user?.name} {user?.id === currentUser?.id && '(Tú)'}</p>
                                   <div className="flex flex-col">
                                     <p className="text-xs text-slate-500">{dept?.name || 'Sin Dept.'}</p>
                                     <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded w-fit mt-0.5 ${type?.color}`}>{type?.name}</span>
                                   </div>
                               </div>
                           </div>
                           <div className="text-right">
                               <p className="text-sm font-medium text-slate-700">{new Date(req.startDate).toLocaleDateString()}</p>
                               <p className="text-xs text-slate-400">al {new Date(req.endDate).toLocaleDateString()}</p>
                           </div>
                        </div>
                        <p className="text-sm text-slate-600 bg-slate-100 p-3 rounded-lg mb-4 italic">"{req.comment}"</p>
                        
                        <div className="flex space-x-3">
                            <button onClick={() => updateRequestStatus(req.id, RequestStatus.APPROVED, currentUser!.id)} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg text-sm font-medium flex justify-center items-center transition-colors">
                                <Check size={16} className="mr-2" /> Aprobar
                            </button>
                            <button onClick={() => updateRequestStatus(req.id, RequestStatus.REJECTED, currentUser!.id)} className="flex-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 py-2 rounded-lg text-sm font-medium flex justify-center items-center transition-colors">
                                <X size={16} className="mr-2" /> Rechazar
                            </button>
                        </div>
                    </div>
                )
            })}
          </div>
        </div>

        {/* Overtime Requests (Pending) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-700 flex items-center">
                <Clock className="mr-2 text-primary" size={18} /> 
                Horas Extras Pendientes
            </h3>
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-bold">{pendingOvertime.length}</span>
          </div>
          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
             {pendingOvertime.length === 0 ? (
                <p className="p-8 text-center text-slate-400 text-sm">No hay registros pendientes.</p>
            ) : pendingOvertime.map(ot => {
                const user = users.find(u => u.id === ot.userId);
                const dept = departments.find(d => d.id === user?.departmentId);
                const isRedemption = ot.hours < 0;

                return (
                    <div key={ot.id} className="p-6 hover:bg-slate-50 transition-colors relative group">
                        <button onClick={() => handleDeleteOvertimeClick(ot.id)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                            <Trash2 size={16} />
                        </button>
                        <div className="flex justify-between items-start mb-2 pr-6">
                           <div className="flex items-center space-x-3">
                               <img src={user?.avatarUrl} className="w-10 h-10 rounded-full bg-slate-200 object-cover" alt="" />
                               <div>
                                   <p className="font-semibold text-slate-800">{user?.name} {user?.id === currentUser?.id && '(Tú)'}</p>
                                   <p className="text-xs text-slate-500">{dept?.name || 'Sin Dept.'}</p>
                               </div>
                           </div>
                           <div className="text-right">
                               <p className={`text-lg font-bold ${isRedemption ? 'text-purple-600' : 'text-primary'}`}>{isRedemption ? ot.hours : '+' + ot.hours}h</p>
                               <p className="text-xs text-slate-400">{new Date(ot.date).toLocaleDateString()}</p>
                           </div>
                        </div>
                        
                        {isRedemption && (
                            <div className="mb-2">
                                <span className="text-xs font-bold bg-purple-100 text-purple-700 px-2 py-1 rounded-full border border-purple-200">
                                    SOLICITUD: {getRedemptionLabel(ot.redemptionType)}
                                </span>
                            </div>
                        )}

                        <p className="text-sm text-slate-600 bg-slate-100 p-3 rounded-lg mb-4 italic">"{ot.description}"</p>
                        
                        <div className="flex space-x-3">
                            <button 
                                onClick={() => updateOvertimeStatus(ot.id, RequestStatus.APPROVED, currentUser!.id)}
                                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg text-sm font-medium flex justify-center items-center transition-colors"
                            >
                                <Check size={16} className="mr-2" /> Aprobar
                            </button>
                            <button 
                                onClick={() => updateOvertimeStatus(ot.id, RequestStatus.REJECTED, currentUser!.id)}
                                className="flex-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 py-2 rounded-lg text-sm font-medium flex justify-center items-center transition-colors"
                            >
                                <X size={16} className="mr-2" /> Rechazar
                            </button>
                        </div>
                    </div>
                )
            })}
          </div>
        </div>
      </div>

      {/* --- BOTTOM SECTION: UNIFIED HISTORY --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
            <h3 className="font-bold text-slate-700 flex items-center">
                Historial de Movimientos
            </h3>
            
            {/* EMPLOYEE SEARCH FILTER */}
            <div className="relative w-full md:w-64">
                 <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
                 <input 
                    type="text" 
                    placeholder="Buscar empleado..." 
                    className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-primary"
                    value={historyFilter}
                    onChange={(e) => setHistoryFilter(e.target.value)}
                 />
            </div>
        </div>

        <div className="divide-y divide-slate-100">
            {filteredHistory.length === 0 ? (
                <p className="p-8 text-center text-slate-400 text-sm">No hay movimientos registrados.</p>
            ) : filteredHistory.map((item, index) => {
                const isAbsence = item.type === 'ABSENCE';
                const data = item.data;
                const user = users.find(u => u.id === data.userId);
                
                // Specific data extraction based on type
                const absenceData = isAbsence ? (data as AbsenceRequest) : null;
                const overtimeData = !isAbsence ? (data as OvertimeRecord) : null;
                
                const absenceType = isAbsence && absenceData ? absenceTypes.find(t => t.id === absenceData.typeId) : null;
                const isRedemption = !isAbsence && overtimeData && overtimeData.hours < 0;

                return (
                    <div key={isAbsence ? absenceData!.id : overtimeData!.id} className="p-4 hover:bg-slate-50 transition-colors flex flex-col md:flex-row justify-between items-center gap-4 relative group">
                        {/* Delete Button (Generic) */}
                        <button 
                            onClick={() => isAbsence ? handleDeleteRequestClick(absenceData!.id) : handleDeleteOvertimeClick(overtimeData!.id)} 
                            className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                            <Trash2 size={16} />
                        </button>

                        {/* User Info */}
                        <div className="flex items-center space-x-3 w-full md:w-1/3">
                            <img src={user?.avatarUrl} className="w-10 h-10 rounded-full bg-slate-200 object-cover" alt="" />
                            <div>
                                <p className="font-semibold text-slate-800 text-sm">{user?.name} {user?.id === currentUser?.id && '(Tú)'}</p>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isAbsence ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                                    {isAbsence ? 'AUSENCIA' : 'HORAS'}
                                </span>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="w-full md:w-1/3">
                            {isAbsence ? (
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                         <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${absenceType?.color}`}>
                                             {absenceType?.name}
                                         </span>
                                    </div>
                                    <p className="text-xs text-slate-500 truncate">{absenceData!.comment}</p>
                                </div>
                            ) : (
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-sm font-bold ${isRedemption ? 'text-purple-600' : 'text-emerald-600'}`}>
                                            {isRedemption ? overtimeData!.hours : '+' + overtimeData!.hours}h
                                        </span>
                                        {isRedemption && (
                                            <span className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded border border-purple-100">
                                                {getRedemptionLabel(overtimeData!.redemptionType)}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 truncate">{overtimeData!.description}</p>
                                </div>
                            )}
                        </div>

                        {/* Date & Status */}
                        <div className="w-full md:w-1/3 flex justify-between md:justify-end items-center gap-6">
                            <div className="text-right">
                                {isAbsence ? (
                                    <>
                                        <p className="text-sm font-medium text-slate-700">{new Date(absenceData!.startDate).toLocaleDateString()}</p>
                                        <p className="text-xs text-slate-400">al {new Date(absenceData!.endDate).toLocaleDateString()}</p>
                                    </>
                                ) : (
                                    <p className="text-sm font-medium text-slate-700">{new Date(overtimeData!.date).toLocaleDateString()}</p>
                                )}
                            </div>
                            
                            <div className="flex flex-col items-end gap-1">
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${data.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                    {data.status === 'APPROVED' ? 'Aprobada' : 'Rechazada'}
                                </span>
                                {isRedemption && data.status === RequestStatus.APPROVED && (
                                    <button 
                                        onClick={() => setSelectedRedemption(overtimeData!)}
                                        className="text-xs text-purple-600 hover:text-purple-800 underline flex items-center"
                                    >
                                        <FileText size={10} className="mr-1" /> Detalle
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
      </div>

      {/* REDEMPTION DETAIL MODAL - A4 PRINT OPTIMIZED */}
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
                                <p className="text-lg text-slate-800 font-bold">{users.find(u => u.id === selectedRedemption.userId)?.name}</p>
                                <p className="text-sm text-slate-500">{users.find(u => u.id === selectedRedemption.userId)?.email}</p>
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

export default TeamManagement;
