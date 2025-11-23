
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { RequestStatus, Role, RedemptionType, OvertimeRecord } from '../types';
import { Check, X, FileText, Printer, Trash2, AlertCircle } from 'lucide-react';

const TeamManagement = () => {
  const { currentUser, users, departments, requests, overtime, updateRequestStatus, updateOvertimeStatus, absenceTypes, deleteRequest, deleteOvertime } = useData();

  // Detail Modal State
  const [selectedRedemption, setSelectedRedemption] = useState<OvertimeRecord | null>(null);
  
  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{show: boolean, id: string, type: 'REQUEST' | 'OVERTIME'} | null>(null);

  // Determine managed departments
  // Logic Update: If Admin, they see EVERYTHING including their own requests for self-approval.
  const isAdmin = currentUser?.role === Role.ADMIN;
  
  const managedDepartmentIds = isAdmin 
    ? departments.map(d => d.id) 
    : departments.filter(d => d.supervisorIds.includes(currentUser?.id || '')).map(d => d.id);

  const teamUserIds = isAdmin 
     ? users.map(u => u.id)
     : users.filter(u => managedDepartmentIds.includes(u.departmentId) && u.id !== currentUser?.id).map(u => u.id);

  const pendingRequests = requests.filter(r => teamUserIds.includes(r.userId));
  const pendingOvertime = overtime.filter(o => teamUserIds.includes(o.userId));

  // Helper for translating redemption type
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Absence Requests */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-700">Solicitudes de Ausencia</h3>
            <span className="text-xs bg-slate-200 px-2 py-1 rounded-full text-slate-600">{pendingRequests.filter(r => r.status === RequestStatus.PENDING).length} Pendientes</span>
          </div>
          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {pendingRequests.length === 0 ? (
                <p className="p-8 text-center text-slate-400 text-sm">No hay solicitudes.</p>
            ) : pendingRequests.sort((a,b) => a.status === 'PENDING' ? -1 : 1).map(req => {
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
                        
                        {req.status === RequestStatus.PENDING ? (
                            <div className="flex space-x-3">
                                <button onClick={() => updateRequestStatus(req.id, RequestStatus.APPROVED, currentUser!.id)} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg text-sm font-medium flex justify-center items-center transition-colors">
                                    <Check size={16} className="mr-2" /> Aprobar
                                </button>
                                <button onClick={() => updateRequestStatus(req.id, RequestStatus.REJECTED, currentUser!.id)} className="flex-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 py-2 rounded-lg text-sm font-medium flex justify-center items-center transition-colors">
                                    <X size={16} className="mr-2" /> Rechazar
                                </button>
                            </div>
                        ) : (
                            <div className="text-center pt-1 border-t border-slate-100">
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                    {req.status === 'APPROVED' ? 'Aprobada' : 'Rechazada'}
                                </span>
                            </div>
                        )}
                    </div>
                )
            })}
          </div>
        </div>

        {/* Overtime Requests */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <h3 className="font-bold text-slate-700">Horas Extras</h3>
            <span className="text-xs bg-slate-200 px-2 py-1 rounded-full text-slate-600">{pendingOvertime.filter(o => o.status === RequestStatus.PENDING).length} Pendientes</span>
          </div>
          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
             {pendingOvertime.length === 0 ? (
                <p className="p-8 text-center text-slate-400 text-sm">No hay registros.</p>
            ) : pendingOvertime.sort((a,b) => a.status === 'PENDING' ? -1 : 1).map(ot => {
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
                            <div className="mb-2 flex items-center justify-between">
                                <span className="text-xs font-bold bg-purple-100 text-purple-700 px-2 py-1 rounded-full border border-purple-200">
                                    SOLICITUD: {getRedemptionLabel(ot.redemptionType)}
                                </span>
                                {ot.status === RequestStatus.APPROVED && (
                                    <button 
                                        onClick={() => setSelectedRedemption(ot)}
                                        className="text-xs text-purple-600 hover:text-purple-800 underline flex items-center font-medium"
                                    >
                                        <FileText size={12} className="mr-1" /> Ver Detalle
                                    </button>
                                )}
                            </div>
                        )}

                        <p className="text-sm text-slate-600 bg-slate-100 p-3 rounded-lg mb-4 italic">"{ot.description}"</p>
                        
                        {ot.status === RequestStatus.PENDING ? (
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
                        ) : (
                            <div className="text-center pt-1 border-t border-slate-100">
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${ot.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                    {ot.status === 'APPROVED' ? 'Aprobada' : 'Rechazada'}
                                </span>
                            </div>
                        )}
                    </div>
                )
            })}
          </div>
        </div>
      </div>

      {/* REDEMPTION DETAIL MODAL */}
      {selectedRedemption && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col print-area">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 no-print">
                    <h3 className="font-bold text-slate-800">Detalle de Canje</h3>
                    <button onClick={() => setSelectedRedemption(null)} className="text-slate-400 hover:text-slate-600"><X /></button>
                </div>
                
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 font-bold">
                                HR
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-800">RRHH CHS</h1>
                                <p className="text-xs text-slate-500">Informe de Consumo de Horas</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm font-medium text-slate-700">Fecha Solicitud</p>
                            <p className="text-slate-500 text-sm">{new Date(selectedRedemption.date).toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mb-6">
                        <p className="text-xs text-slate-500 uppercase font-bold mb-2">Solicitante</p>
                        <p className="text-slate-800 font-medium">{users.find(u => u.id === selectedRedemption.userId)?.name}</p>
                        <p className="text-sm text-slate-500">{users.find(u => u.id === selectedRedemption.userId)?.email}</p>
                        <div className="mt-4 flex justify-between items-center">
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold">Tipo de Canje</p>
                                <p className="text-purple-600 font-bold">{getRedemptionLabel(selectedRedemption.redemptionType)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-500 uppercase font-bold">Total Solicitado</p>
                                <p className="text-xl font-bold text-slate-800">{Math.abs(selectedRedemption.hours)}h</p>
                            </div>
                        </div>
                    </div>

                    <h4 className="font-bold text-slate-700 mb-2 border-b border-slate-100 pb-2">Origen de las Horas (Trazabilidad)</h4>
                    <table className="w-full text-sm mb-6">
                        <thead>
                            <tr className="text-slate-500 text-xs uppercase text-left">
                                <th className="py-2">Fecha Origen</th>
                                <th className="py-2">Motivo</th>
                                <th className="py-2 text-right">Horas</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {selectedRedemption.linkedRecordIds?.map(id => {
                                const original = overtime.find(o => o.id === id);
                                if (!original) return null;
                                return (
                                    <tr key={id}>
                                        <td className="py-2">{new Date(original.date).toLocaleDateString()}</td>
                                        <td className="py-2 text-slate-600 truncate max-w-[150px]">{original.description}</td>
                                        <td className="py-2 text-right font-medium text-emerald-600">+{original.hours}h</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>

                    <div className="border-t-2 border-slate-800 pt-4 flex justify-between items-center">
                        <p className="text-xs text-slate-400">Documento generado por RRHH CHS.</p>
                        <p className="font-bold text-slate-800">Total: {Math.abs(selectedRedemption.hours)}h</p>
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
                      ¿Estás seguro de que quieres eliminar este registro?
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
