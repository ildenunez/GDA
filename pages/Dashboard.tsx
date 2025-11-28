
import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { RequestStatus, ShiftType } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Clock, CheckCircle, AlertCircle, Trash2, X, CalendarDays, Sun, Moon, ArrowRight, Mail, MessageSquare, ChevronRight, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, icon: Icon, color, subValue }: any) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
      </div>
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
    </div>
    {subValue && <p className="text-xs text-slate-400">{subValue}</p>}
  </div>
);

const Dashboard = () => {
  const { currentUser, requests, overtime, absenceTypes, deleteRequest, shifts, shiftTypes, internalMessages, markInternalMessageRead, deleteInternalMessage } = useData();
  
  // Confirmation Modal State (Requests)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  // Confirmation Modal State (Messages)
  const [confirmMsgDeleteId, setConfirmMsgDeleteId] = useState<string | null>(null);
  
  // Message Modal State (Auto Popup)
  const [unreadMsg, setUnreadMsg] = useState<any>(null);

  // Inbox Modal State (Full View)
  const [showInbox, setShowInbox] = useState(false);
  const [selectedInboxMsgId, setSelectedInboxMsgId] = useState<string | null>(null);

  // Logic for stats
  const myRequests = requests.filter(r => r.userId === currentUser?.id);
  const pendingRequests = myRequests.filter(r => r.status === RequestStatus.PENDING).length;
  const approvedRequests = myRequests.filter(r => r.status === RequestStatus.APPROVED).length;
  
  // CORRECTED OVERTIME CALCULATION
  const myApprovedOvertime = overtime.filter(o => o.userId === currentUser?.id && o.status === RequestStatus.APPROVED);
  const earnedRecords = myApprovedOvertime.filter(o => o.hours > 0);
  const totalGenerated = earnedRecords.reduce((acc, curr) => acc + curr.hours, 0);
  const totalConsumed = earnedRecords.reduce((acc, curr) => acc + curr.consumed, 0);
  const availableOvertime = totalGenerated - totalConsumed;

  // CORRECTED VACATION CALCULATION using deductsDays OR name fallback
  const totalVacationDays = 22 + (currentUser?.vacationAdjustment || 0);
  
  const vacationTypeIds = absenceTypes
    .filter(t => t.deductsDays === true || (t.deductsDays === undefined && t.name.toLowerCase().includes('vacacion'))) 
    .map(t => t.id);
  
  const usedVacationDays = myRequests
    .filter(r => r.status === RequestStatus.APPROVED && vacationTypeIds.includes(r.typeId))
    .reduce((acc, req) => {
        // Robust Date Calculation using local time
        const start = new Date(req.startDate);
        const end = new Date(req.endDate);
        
        // Ensure time is set to noon to avoid timezone shift issues across days
        const s = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 12, 0, 0);
        const e = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 12, 0, 0);
        
        const diffTime = Math.abs(e.getTime() - s.getTime());
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
        return acc + days;
    }, 0);

  const remainingVacationDays = totalVacationDays - usedVacationDays;

  // UPCOMING SHIFT LOGIC (Fixed for local timezone)
  const now = new Date();
  const todayStr = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toLocaleDateString('en-CA'); // YYYY-MM-DD local
  
  const myUpcomingShifts = shifts
      .filter(s => s.userId === currentUser?.id && s.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date));
  
  const nextShift = myUpcomingShifts[0];
  const nextShiftDef = nextShift ? shiftTypes.find(t => t.id === nextShift.shiftType) : null;

  // Chart Data
  const requestsByType = absenceTypes.map(type => ({
    name: type.name,
    value: myRequests.filter(r => r.typeId === type.id && r.status === RequestStatus.APPROVED).length
  })).filter(item => item.value > 0);

  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444'];

  // --- INTERNAL MESSAGES LOGIC ---
  const myMessages = internalMessages.filter(msg => {
      const isTarget = msg.targetUserIds.includes('ALL') || msg.targetUserIds.includes(currentUser?.id || '');
      const isDeleted = msg.deletedByUserIds?.includes(currentUser?.id || '');
      return isTarget && !isDeleted;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const unreadMessagesCount = myMessages.filter(m => !m.readByUserIds.includes(currentUser?.id || '')).length;
  const latestMessage = myMessages[0];

  // Auto-Popup for unread
  useEffect(() => {
      if (!currentUser) return;
      // Only show popup if there is a VERY recent unread message (or on first load logic if preferred)
      const unread = myMessages.find(m => !m.readByUserIds.includes(currentUser.id));
      if (unread && !showInbox) { // Don't popup if inbox is open
          setUnreadMsg(unread);
      } else {
          setUnreadMsg(null);
      }
  }, [internalMessages, currentUser, showInbox]);

  const handleCloseMessage = () => {
      if (unreadMsg && currentUser) {
          markInternalMessageRead(unreadMsg.id);
          setUnreadMsg(null);
      }
  };

  const handleInboxSelect = (msg: any) => {
      setSelectedInboxMsgId(msg.id);
      markInternalMessageRead(msg.id);
  };

  const handleDeleteClick = (id: string) => {
      setConfirmDeleteId(id);
  };

  const handleDeleteMessage = (id: string) => {
      setConfirmMsgDeleteId(id);
  };

  const executeMessageDelete = () => {
      if (confirmMsgDeleteId) {
          deleteInternalMessage(confirmMsgDeleteId);
          if (selectedInboxMsgId === confirmMsgDeleteId) setSelectedInboxMsgId(null);
          setConfirmMsgDeleteId(null);
      }
  };

  const confirmDelete = () => {
      if (confirmDeleteId) {
          deleteRequest(confirmDeleteId);
          setConfirmDeleteId(null);
      }
  };

  const selectedInboxMsg = myMessages.find(m => m.id === selectedInboxMsgId);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">Hola, {currentUser?.name.split(' ')[0]} 👋</h2>
        <p className="text-slate-500 mt-1">Aquí tienes un resumen de tu actividad en RRHH CHS.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Saldo Horas Extras" 
          value={`${availableOvertime}h`} 
          icon={Clock} 
          color="bg-primary" 
          subValue={`Generadas: ${totalGenerated}h | Consumidas: ${totalConsumed}h`}
        />
        <StatCard 
          title="Solicitudes Pendientes" 
          value={pendingRequests} 
          icon={AlertCircle} 
          color="bg-amber-500" 
        />
        <StatCard 
          title="Ausencias Aprobadas" 
          value={approvedRequests} 
          icon={CheckCircle} 
          color="bg-emerald-500" 
        />
        <StatCard 
          title="Días Vacaciones Restantes" 
          value={remainingVacationDays} 
          icon={CalendarIcon} // Dummy
          color="bg-blue-500"
          subValue={`De ${totalVacationDays} totales (${usedVacationDays} usados)`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* NEXT SHIFT CARD */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-10 -translate-y-10">
                        <CalendarDays size={120} />
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-lg font-bold mb-4 flex items-center">
                            <CalendarDays className="mr-2" size={20} /> Mis Turnos
                        </h3>
                        {nextShift ? (
                             <div>
                                <p className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Próximo Turno</p>
                                <div className="flex items-center space-x-3">
                                    <span className="text-3xl font-bold">
                                        {new Date(nextShift.date + 'T12:00:00').getDate()}
                                    </span>
                                    <div className="border-l border-slate-600 pl-3">
                                        <p className="font-medium text-lg capitalize leading-tight">{new Date(nextShift.date + 'T12:00:00').toLocaleString('es-ES', { month: 'long', weekday: 'long' })}</p>
                                        <p className={`text-sm font-bold text-indigo-400`}>
                                            {nextShiftDef ? nextShiftDef.name : 'Turno Asignado'}
                                        </p>
                                    </div>
                                </div>
                             </div>
                        ) : (
                            <p className="text-slate-400 text-sm py-2">No tienes turnos asignados próximamente.</p>
                        )}
                    </div>
                    <Link to="/calendar" className="mt-4 relative z-10 w-full text-center px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg text-sm font-medium transition-colors">
                        Ver Calendario
                    </Link>
                </div>

                {/* MY MESSAGES CARD */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-10 -translate-y-10">
                        <Mail size={120} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-bold flex items-center">
                                <MessageSquare className="mr-2" size={20} /> Mensajes
                            </h3>
                            {unreadMessagesCount > 0 && (
                                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                                    {unreadMessagesCount} nuevos
                                </span>
                            )}
                        </div>
                        
                        {latestMessage ? (
                             <div>
                                <p className="text-emerald-100 text-xs uppercase font-bold tracking-wider mb-1">Último Recibido</p>
                                <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm border border-white/10">
                                    <p className="font-bold text-sm truncate">{latestMessage.subject}</p>
                                    <p className="text-xs text-emerald-100 mt-1 truncate opacity-80">{latestMessage.body}</p>
                                </div>
                                <p className="text-xs text-emerald-200 mt-2 text-right">
                                    {new Date(latestMessage.createdAt).toLocaleDateString()}
                                </p>
                             </div>
                        ) : (
                            <div className="py-4 text-emerald-100 text-sm text-center">
                                No tienes mensajes en tu buzón.
                            </div>
                        )}
                    </div>
                    <button onClick={() => setShowInbox(true)} className="mt-4 relative z-10 w-full text-center px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg text-sm font-medium transition-colors flex items-center justify-center group">
                        Buzón de Entrada <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform"/>
                    </button>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Actividad Reciente</h3>
              <div className="space-y-6">
                {myRequests.slice(0, 5).map(req => {
                  const type = absenceTypes.find(t => t.id === req.typeId);
                  const deducts = type?.deductsDays || type?.name.toLowerCase().includes('vacacion');
                  return (
                    <div key={req.id} className="flex items-center justify-between pb-4 border-b border-slate-50 last:border-0 last:pb-0 group">
                       <div className="flex items-center space-x-4">
                         <div className={`w-2 h-12 rounded-full ${req.status === RequestStatus.APPROVED ? 'bg-emerald-500' : req.status === RequestStatus.REJECTED ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                         <div>
                           <div className="flex items-center gap-2">
                               <p className="font-semibold text-slate-800">{type?.name}</p>
                               {deducts ? (
                                   <span className="text-[10px] bg-red-50 text-red-600 px-1 rounded border border-red-100">Descuenta</span>
                               ) : (
                                   <span className="text-[10px] bg-slate-100 text-slate-500 px-1 rounded border border-slate-200">No descuenta</span>
                               )}
                           </div>
                           <p className="text-sm text-slate-500">{new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}</p>
                         </div>
                       </div>
                       <div className="flex items-center space-x-3">
                           <span className={`px-3 py-1 rounded-full text-xs font-medium ${req.status === RequestStatus.APPROVED ? 'bg-emerald-100 text-emerald-700' : req.status === RequestStatus.REJECTED ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                             {req.status === RequestStatus.PENDING ? 'Pendiente' : req.status === RequestStatus.APPROVED ? 'Aprobado' : 'Rechazado'}
                           </span>
                           <button 
                             onClick={() => handleDeleteClick(req.id)}
                             className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                             title="Eliminar solicitud"
                           >
                               <Trash2 size={16} />
                           </button>
                       </div>
                    </div>
                  )
                })}
                 {myRequests.length === 0 && <p className="text-slate-400 text-sm">No hay actividad reciente.</p>}
              </div>
            </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col items-center justify-center">
          <h3 className="text-lg font-bold text-slate-800 mb-4 w-full text-left">Distribución de Ausencias</h3>
          <div className="w-full h-[300px] pb-8" style={{ height: 300 }}>
            {requestsByType.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={requestsByType}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {requestsByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">Sin datos para mostrar</div>
            )}
          </div>
          <div className="flex flex-wrap gap-2 justify-center pb-4">
             {requestsByType.map((entry, index) => (
                <div key={index} className="flex items-center text-xs text-slate-600">
                  <span className="w-2 h-2 rounded-full mr-1" style={{backgroundColor: COLORS[index % COLORS.length]}}></span>
                  {entry.name}
                </div>
             ))}
          </div>
        </div>
      </div>

      {/* INBOX MODAL (FULL VIEW) */}
      {showInbox && (
          <div className="fixed inset-0 bg-black/50 z-[90] flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[80vh] flex overflow-hidden animate-in zoom-in duration-200">
                  {/* Left Sidebar: List */}
                  <div className="w-1/3 border-r border-slate-200 flex flex-col bg-slate-50">
                      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white">
                          <h3 className="font-bold text-slate-800 flex items-center">
                              <Mail className="mr-2 text-primary" size={20} /> Buzón
                          </h3>
                          <span className="text-xs font-bold text-slate-500">{myMessages.length} mensajes</span>
                      </div>
                      <div className="flex-1 overflow-y-auto">
                          {myMessages.length === 0 ? (
                              <p className="p-8 text-center text-slate-400 text-sm">Buzón vacío.</p>
                          ) : (
                              myMessages.map(msg => {
                                  const isRead = msg.readByUserIds.includes(currentUser?.id || '');
                                  const isSelected = msg.id === selectedInboxMsgId;
                                  return (
                                      <div 
                                          key={msg.id} 
                                          onClick={() => handleInboxSelect(msg)}
                                          className={`p-4 border-b border-slate-200 cursor-pointer transition-colors relative group ${isSelected ? 'bg-blue-50 border-l-4 border-l-primary' : 'hover:bg-white'} ${!isRead ? 'bg-white font-semibold' : 'text-slate-500'}`}
                                      >
                                          <div className="flex justify-between mb-1">
                                              <span className={`text-sm ${!isRead ? 'text-slate-800' : ''}`}>Admin</span>
                                              <span className="text-xs text-slate-400">{new Date(msg.createdAt).toLocaleDateString()}</span>
                                          </div>
                                          <p className={`text-sm truncate pr-6 ${!isRead ? 'text-slate-900' : ''}`}>{msg.subject}</p>
                                          <p className="text-xs text-slate-400 truncate mt-1">{msg.body}</p>
                                          {!isRead && <span className="inline-block w-2 h-2 bg-primary rounded-full mt-2"></span>}
                                          
                                          <button 
                                              onClick={(e) => { e.stopPropagation(); handleDeleteMessage(msg.id); }}
                                              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                              title="Borrar mensaje"
                                          >
                                              <Trash2 size={16} />
                                          </button>
                                      </div>
                                  )
                              })
                          )}
                      </div>
                  </div>

                  {/* Right Content: Message Detail */}
                  <div className="flex-1 flex flex-col bg-white">
                      {selectedInboxMsg ? (
                          <>
                              <div className="p-6 border-b border-slate-100 flex justify-between items-start">
                                  <div>
                                      <h2 className="text-xl font-bold text-slate-800 mb-2">{selectedInboxMsg.subject}</h2>
                                      <div className="flex items-center text-sm text-slate-500">
                                          <span className="bg-slate-100 px-2 py-1 rounded mr-2">De: Administración</span>
                                          <span>{new Date(selectedInboxMsg.createdAt).toLocaleString()}</span>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                      <button onClick={() => handleDeleteMessage(selectedInboxMsg.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Borrar">
                                          <Trash2 size={20} />
                                      </button>
                                      <button onClick={() => setShowInbox(false)} className="text-slate-400 hover:text-slate-600">
                                          <X size={24} />
                                      </button>
                                  </div>
                              </div>
                              <div className="p-8 flex-1 overflow-y-auto">
                                  <div className="prose max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap">
                                      {selectedInboxMsg.body}
                                  </div>
                              </div>
                              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                                  <button onClick={() => setSelectedInboxMsgId(null)} className="text-slate-500 hover:text-slate-700 text-sm font-medium mr-4">
                                      Cerrar Mensaje
                                  </button>
                              </div>
                          </>
                      ) : (
                          <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                              <MessageSquare size={64} className="mb-4 opacity-50" />
                              <p className="text-lg font-medium">Selecciona un mensaje para leerlo</p>
                              <button onClick={() => setShowInbox(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                                  <X size={24} />
                              </button>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* CONFIRMATION MODAL (REQUESTS) */}
      {confirmDeleteId && (
          <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full animate-in zoom-in duration-200">
                  <div className="flex items-center text-red-600 mb-4">
                      <AlertCircle className="mr-2" />
                      <h3 className="font-bold text-lg">Eliminar Solicitud</h3>
                  </div>
                  <p className="text-slate-600 text-sm mb-6">
                      ¿Estás seguro de que quieres eliminar esta solicitud? <br/>
                      Si estaba aprobada, los días se devolverán a tu saldo.
                  </p>
                  <div className="flex justify-end space-x-3">
                      <button 
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg font-medium text-sm"
                      >
                          Cancelar
                      </button>
                      <button 
                          onClick={confirmDelete}
                          className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg font-medium text-sm"
                      >
                          Confirmar Eliminar
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* CONFIRMATION MODAL (MESSAGES) */}
      {confirmMsgDeleteId && (
          <div className="fixed inset-0 bg-black/50 z-[110] flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full animate-in zoom-in duration-200">
                  <div className="flex items-center text-red-600 mb-4">
                      <AlertCircle className="mr-2" />
                      <h3 className="font-bold text-lg">Eliminar Mensaje</h3>
                  </div>
                  <p className="text-slate-600 text-sm mb-6">
                      ¿Estás seguro de que quieres eliminar este mensaje de tu buzón?
                  </p>
                  <div className="flex justify-end space-x-3">
                      <button 
                          onClick={() => setConfirmMsgDeleteId(null)}
                          className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg font-medium text-sm"
                      >
                          Cancelar
                      </button>
                      <button 
                          onClick={executeMessageDelete}
                          className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg font-medium text-sm"
                      >
                          Eliminar
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* INTERNAL MESSAGE POPUP (AUTO) */}
      {unreadMsg && (
          <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in slide-in-from-bottom-10 duration-300 overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 flex items-center">
                      <Mail className="text-white mr-3" size={24} />
                      <div>
                          <h3 className="text-white font-bold text-lg">Mensaje Importante</h3>
                          <p className="text-emerald-100 text-xs">Comunicación interna</p>
                      </div>
                  </div>
                  <div className="p-6">
                      <h4 className="font-bold text-slate-800 text-lg mb-2">{unreadMsg.subject}</h4>
                      <div className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100 max-h-60 overflow-y-auto whitespace-pre-wrap">
                          {unreadMsg.body}
                      </div>
                      <p className="text-xs text-slate-400 mt-4 text-right">
                          Recibido el {new Date(unreadMsg.createdAt).toLocaleDateString()}
                      </p>
                  </div>
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                      <button 
                          onClick={() => {
                              markInternalMessageRead(unreadMsg.id);
                              setShowInbox(true);
                              setSelectedInboxMsgId(unreadMsg.id);
                              setUnreadMsg(null);
                          }}
                          className="text-slate-600 hover:text-slate-800 text-sm font-medium px-3"
                      >
                          Ver en Buzón
                      </button>
                      <button 
                          onClick={handleCloseMessage}
                          className="bg-slate-800 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-700 transition-colors shadow-lg"
                      >
                          Entendido
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

const CalendarIcon = ({ className }: {className?: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
)

export default Dashboard;
