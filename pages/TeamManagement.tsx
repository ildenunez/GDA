
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { RequestStatus, Role, RedemptionType, OvertimeRecord } from '../types';
import { Check, X, FileText, Printer, Trash2, AlertCircle, Filter, Calendar, Clock, History } from 'lucide-react';

const TeamManagement = () => {
  const { currentUser, users, departments, requests, overtime, updateRequestStatus, updateOvertimeStatus, absenceTypes, deleteRequest, deleteOvertime } = useData();

  // Detail Modal State
  const [selectedRedemption, setSelectedRedemption] = useState<OvertimeRecord | null>(null);
  const [confirmModal, setConfirmModal] = useState<{show: boolean, id: string, type: 'REQUEST' | 'OVERTIME'} | null>(null);

  // History Filters
  const [filterUser, setFilterUser] = useState('all');
  const [filterDept, setFilterDept] = useState('all');
  const [historyTab, setHistoryTab] = useState<'ABSENCES' | 'OVERTIME'>('ABSENCES');

  const isAdmin = currentUser?.role === Role.ADMIN;
  
  const managedDepartmentIds = isAdmin 
    ? departments.map(d => d.id) 
    : departments.filter(d => d.supervisorIds.includes(currentUser?.id || '')).map(d => d.id);

  const teamUserIds = isAdmin 
     ? users.map(u => u.id)
     : users.filter(u => managedDepartmentIds.includes(u.departmentId) && u.id !== currentUser?.id).map(u => u.id);

  // Separate Pending Lists
  const pendingRequests = requests.filter(r => teamUserIds.includes(r.userId) && r.status === RequestStatus.PENDING);
  const pendingOvertime = overtime.filter(o => teamUserIds.includes(o.userId) && o.status === RequestStatus.PENDING);

  // History List Logic
  const filteredUsers = users.filter(u => 
      teamUserIds.includes(u.id) &&
      (filterUser === 'all' || u.id === filterUser) &&
      (filterDept === 'all' || u.departmentId === filterDept)
  );
  const filteredUserIds = filteredUsers.map(u => u.id);

  const historyRequests = requests.filter(r => filteredUserIds.includes(r.userId) && r.status !== RequestStatus.PENDING).sort((a,b) => b.startDate.localeCompare(a.startDate));
  const historyOvertime = overtime.filter(o => filteredUserIds.includes(o.userId) && o.status !== RequestStatus.PENDING).sort((a,b) => b.date.localeCompare(a.date));

  const getRedemptionLabel = (type?: RedemptionType) => {
      switch(type) {
          case RedemptionType.PAYROLL: return 'Abono en Nómina';
          case RedemptionType.DAYS_EXCHANGE: return 'Canje por Días';
          case RedemptionType.TIME_OFF: return 'Horas Libres';
          default: return 'Canje';
      }
  };

  const handleDeleteRequestClick = (id: string) => { setConfirmModal({ show: true, id, type: 'REQUEST' }); };
  const handleDeleteOvertimeClick = (id: string) => { setConfirmModal({ show: true, id, type: 'OVERTIME' }); };
  const executeDelete = () => { if (confirmModal) { if (confirmModal.type === 'REQUEST') deleteRequest(confirmModal.id); if (confirmModal.type === 'OVERTIME') deleteOvertime(confirmModal.id); setConfirmModal(null); } };
  const handlePrint = () => { setTimeout(() => window.print(), 100); };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Gestión de Equipo</h2>
        <p className="text-slate-500">{isAdmin ? 'Vista Global de Administrador' : 'Gestiona las solicitudes de tu equipo.'}</p>
      </div>

      {/* SECTION 1: PENDING REQUESTS (SPLIT) */}
      <h3 className="font-bold text-slate-700 flex items-center mt-6"><AlertCircle className="mr-2 text-amber-500" size={20}/> Pendientes de Aprobación</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Pending Absences */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                 <h4 className="font-bold text-slate-700 flex items-center"><Calendar className="mr-2 text-primary" size={16}/> Ausencias</h4>
                 <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">{pendingRequests.length}</span>
             </div>
             <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                 {pendingRequests.length === 0 ? <p className="p-8 text-center text-slate-400 text-sm">No hay ausencias pendientes.</p> : pendingRequests.map(req => {
                     const user = users.find(u => u.id === req.userId);
                     const type = absenceTypes.find(t => t.id === req.typeId);
                     return (
                         <div key={req.id} className="p-4 hover:bg-slate-50 transition-colors">
                             <div className="flex justify-between items-start mb-2">
                                 <div className="flex items-center space-x-2">
                                     <img src={user?.avatarUrl} className="w-8 h-8 rounded-full" alt=""/>
                                     <div>
                                         <p className="font-bold text-sm text-slate-800">{user?.name}</p>
                                         <span className={`text-[10px] px-1.5 py-0.5 rounded ${type?.color}`}>{type?.name}</span>
                                     </div>
                                 </div>
                                 <div className="text-right">
                                     <p className="text-xs font-medium text-slate-700">{new Date(req.startDate).toLocaleDateString()}</p>
                                     <p className="text-[10px] text-slate-400">al {new Date(req.endDate).toLocaleDateString()}</p>
                                 </div>
                             </div>
                             <p className="text-xs text-slate-600 italic bg-slate-100 p-2 rounded mb-3">"{req.comment}"</p>
                             <div className="flex gap-2">
                                 <button onClick={() => updateRequestStatus(req.id, RequestStatus.APPROVED, currentUser!.id)} className="flex-1 bg-emerald-500 text-white py-1.5 rounded text-xs font-bold hover:bg-emerald-600">Aprobar</button>
                                 <button onClick={() => updateRequestStatus(req.id, RequestStatus.REJECTED, currentUser!.id)} className="flex-1 border border-red-200 text-red-600 py-1.5 rounded text-xs font-bold hover:bg-red-50">Rechazar</button>
                             </div>
                         </div>
                     );
                 })}
             </div>
          </div>

          {/* Pending Overtime */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                 <h4 className="font-bold text-slate-700 flex items-center"><Clock className="mr-2 text-primary" size={16}/> Horas / Canjes</h4>
                 <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">{pendingOvertime.length}</span>
             </div>
             <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                 {pendingOvertime.length === 0 ? <p className="p-8 text-center text-slate-400 text-sm">No hay registros pendientes.</p> : pendingOvertime.map(ot => {
                     const user = users.find(u => u.id === ot.userId);
                     const isRedemption = ot.hours < 0;
                     return (
                         <div key={ot.id} className="p-4 hover:bg-slate-50 transition-colors">
                             <div className="flex justify-between items-start mb-2">
                                 <div className="flex items-center space-x-2">
                                     <img src={user?.avatarUrl} className="w-8 h-8 rounded-full" alt=""/>
                                     <div>
                                         <p className="font-bold text-sm text-slate-800">{user?.name}</p>
                                         <p className="text-[10px] text-slate-500">{departments.find(d=>d.id===user?.departmentId)?.name}</p>
                                     </div>
                                 </div>
                                 <div className="text-right">
                                     <p className={`font-bold text-sm ${isRedemption ? 'text-purple-600' : 'text-emerald-600'}`}>{ot.hours > 0 ? '+' : ''}{ot.hours}h</p>
                                     <p className="text-[10px] text-slate-400">{new Date(ot.date).toLocaleDateString()}</p>
                                 </div>
                             </div>
                             {isRedemption && (
                                <div className="mb-2"><span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">CANJE: {getRedemptionLabel(ot.redemptionType)}</span></div>
                             )}
                             <p className="text-xs text-slate-600 italic bg-slate-100 p-2 rounded mb-3">"{ot.description}"</p>
                             <div className="flex gap-2">
                                 <button onClick={() => updateOvertimeStatus(ot.id, RequestStatus.APPROVED, currentUser!.id)} className="flex-1 bg-emerald-500 text-white py-1.5 rounded text-xs font-bold hover:bg-emerald-600">Aprobar</button>
                                 <button onClick={() => updateOvertimeStatus(ot.id, RequestStatus.REJECTED, currentUser!.id)} className="flex-1 border border-red-200 text-red-600 py-1.5 rounded text-xs font-bold hover:bg-red-50">Rechazar</button>
                             </div>
                         </div>
                     );
                 })}
             </div>
          </div>
      </div>

      {/* SECTION 2: HISTORY */}
      <div className="mt-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
              <h3 className="font-bold text-slate-700 flex items-center"><History className="mr-2 text-slate-400" size={20}/> Historial de Solicitudes</h3>
              
              <div className="flex flex-wrap gap-2 items-center bg-white p-2 rounded-xl shadow-sm border border-slate-200">
                  <div className="flex items-center px-2 text-slate-400"><Filter size={16}/></div>
                  <select className="text-sm bg-transparent border-none outline-none text-slate-600" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
                      <option value="all">Todos Depts.</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  <div className="w-px h-4 bg-slate-300 mx-2"></div>
                  <select className="text-sm bg-transparent border-none outline-none text-slate-600" value={filterUser} onChange={e => setFilterUser(e.target.value)}>
                      <option value="all">Todos Empleados</option>
                      {users.filter(u => filterDept === 'all' || u.departmentId === filterDept).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
              </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="flex border-b border-slate-100">
                  <button onClick={() => setHistoryTab('ABSENCES')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${historyTab === 'ABSENCES' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Ausencias ({historyRequests.length})</button>
                  <button onClick={() => setHistoryTab('OVERTIME')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${historyTab === 'OVERTIME' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Horas ({historyOvertime.length})</button>
              </div>

              <div className="overflow-x-auto max-h-[500px]">
                  <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-semibold">
                          <tr>
                              <th className="px-6 py-3 text-left">Empleado</th>
                              <th className="px-6 py-3 text-left">Fecha/s</th>
                              <th className="px-6 py-3 text-left">Detalle</th>
                              <th className="px-6 py-3 text-right">Estado</th>
                              <th className="px-6 py-3"></th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {historyTab === 'ABSENCES' ? (
                              historyRequests.length === 0 ? <tr><td colSpan={5} className="text-center p-6 text-slate-400">Sin historial.</td></tr> :
                              historyRequests.map(req => (
                                  <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                                      <td className="px-6 py-4 font-medium text-slate-700">{users.find(u=>u.id===req.userId)?.name}</td>
                                      <td className="px-6 py-4 text-slate-600">{new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}</td>
                                      <td className="px-6 py-4">
                                          <span className={`text-[10px] px-2 py-0.5 rounded ${absenceTypes.find(t=>t.id===req.typeId)?.color}`}>{absenceTypes.find(t=>t.id===req.typeId)?.name}</span>
                                          <p className="text-xs text-slate-400 mt-1 truncate max-w-[200px]">{req.comment}</p>
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{req.status === 'APPROVED' ? 'Aprobada' : 'Rechazada'}</span>
                                      </td>
                                      <td className="px-6 py-4 text-right"><button onClick={()=>handleDeleteRequestClick(req.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button></td>
                                  </tr>
                              ))
                          ) : (
                              historyOvertime.length === 0 ? <tr><td colSpan={5} className="text-center p-6 text-slate-400">Sin historial.</td></tr> :
                              historyOvertime.map(ot => (
                                  <tr key={ot.id} className="hover:bg-slate-50 transition-colors">
                                      <td className="px-6 py-4 font-medium text-slate-700">{users.find(u=>u.id===ot.userId)?.name}</td>
                                      <td className="px-6 py-4 text-slate-600">{new Date(ot.date).toLocaleDateString()}</td>
                                      <td className="px-6 py-4">
                                          <p className="truncate max-w-[200px]">{ot.description}</p>
                                          {ot.redemptionType && <span className="text-[10px] text-purple-600 font-bold bg-purple-50 px-1 rounded">CANJE</span>}
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                          <span className={`font-bold ${ot.hours > 0 ? 'text-emerald-600' : 'text-purple-600'}`}>{ot.hours > 0 ? '+' : ''}{ot.hours}h</span>
                                          <div className={`text-[10px] font-bold mt-1 ${ot.status === 'APPROVED' ? 'text-emerald-700' : 'text-red-700'}`}>{ot.status === 'APPROVED' ? 'APROBADO' : 'RECHAZADO'}</div>
                                      </td>
                                      <td className="px-6 py-4 text-right flex justify-end gap-2">
                                          {ot.hours < 0 && ot.status === 'APPROVED' && <button onClick={()=>setSelectedRedemption(ot)} className="text-blue-400 hover:text-blue-600"><FileText size={16}/></button>}
                                          <button onClick={()=>handleDeleteOvertimeClick(ot.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
                                      </td>
                                  </tr>
                              ))
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      </div>

      {/* Detail Modal (Printable ID Applied) */}
      {selectedRedemption && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
            <div id="printable-section" className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 no-print">
                    <h3 className="font-bold text-slate-800">Detalle de Canje</h3>
                    <button onClick={() => setSelectedRedemption(null)} className="text-slate-400 hover:text-slate-600"><X /></button>
                </div>
                {/* Content matches MySpace/Admin */}
                <div className="p-8">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 font-bold text-xl">HR</div>
                            <div><h1 className="text-2xl font-bold text-slate-800">RRHH CHS</h1><p className="text-sm text-slate-500">Informe de Consumo de Horas</p></div>
                        </div>
                        <div className="text-right"><p className="text-sm font-medium text-slate-700 uppercase tracking-wide">Fecha Informe</p><p className="text-slate-500">{new Date(selectedRedemption.date).toLocaleDateString()}</p></div>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 mb-8">
                        <div className="grid grid-cols-2 gap-6">
                            <div><p className="text-xs text-slate-500 uppercase font-bold mb-1">Solicitante</p><p className="text-lg text-slate-800 font-bold">{users.find(u => u.id === selectedRedemption.userId)?.name}</p></div>
                            <div className="text-right"><p className="text-xs text-slate-500 uppercase font-bold mb-1">Total Canjeado</p><p className="text-3xl font-bold text-slate-800">{Math.abs(selectedRedemption.hours)}h</p><p className="text-sm text-purple-600 font-medium mt-1">{getRedemptionLabel(selectedRedemption.redemptionType)}</p></div>
                        </div>
                    </div>
                    <table className="w-full text-sm mb-8"><thead><tr className="text-left text-xs uppercase bg-slate-50"><th className="p-2">Fecha Origen</th><th className="p-2">Motivo</th><th className="p-2 text-right">Saldo Restante</th></tr></thead><tbody>{selectedRedemption.linkedRecordIds?.map(id => { const o = overtime.find(x=>x.id===id); if(!o) return null; return (<tr key={id} className="border-b"><td className="p-2">{new Date(o.date).toLocaleDateString()}</td><td className="p-2">{o.description}</td><td className="p-2 text-right font-bold">{o.hours - o.consumed}</td></tr>) })}</tbody></table>
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-2 no-print">
                    <button onClick={handlePrint} className="flex items-center px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 shadow-sm"><Printer size={16} className="mr-2" /> Imprimir</button>
                    <button onClick={() => setSelectedRedemption(null)} className="px-4 py-2 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700">Cerrar</button>
                </div>
            </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal && (
          <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full animate-in zoom-in duration-200">
                  <div className="flex items-center text-red-600 mb-4"><AlertCircle className="mr-2" /><h3 className="font-bold text-lg">Confirmar</h3></div>
                  <p className="text-slate-600 text-sm mb-6">¿Estás seguro de que deseas eliminar este registro?</p>
                  <div className="flex justify-end space-x-3"><button onClick={() => setConfirmModal(null)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg font-medium text-sm">Cancelar</button><button onClick={executeDelete} className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg font-medium text-sm">Eliminar</button></div>
              </div>
          </div>
      )}
    </div>
  );
};

export default TeamManagement;
