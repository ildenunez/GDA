
import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { RequestStatus, ShiftType } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Clock, CheckCircle, AlertCircle, Trash2, X, CalendarDays, Sun, Moon, ArrowRight, Mail } from 'lucide-react';
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
  const { currentUser, requests, overtime, absenceTypes, deleteRequest, shifts, shiftTypes, internalMessages, markInternalMessageRead } = useData();
  
  // Confirmation Modal State
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  // Message Modal State
  const [unreadMsg, setUnreadMsg] = useState<any>(null);

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
  useEffect(() => {
      if (!currentUser) return;
      
      const unreadMessages = internalMessages.filter(msg => {
          const isTarget = msg.targetUserIds.includes('ALL') || msg.targetUserIds.includes(currentUser.id);
          const isRead = msg.readByUserIds.includes(currentUser.id);
          return isTarget && !isRead;
      });
      
      // If there are unread messages, show the first one
      if (unreadMessages.length > 0) {
          setUnreadMsg(unreadMessages[0]);
      } else {
          setUnreadMsg(null);
      }
  }, [internalMessages, currentUser]);

  const handleCloseMessage = () => {
      if (unreadMsg && currentUser) {
          markInternalMessageRead(unreadMsg.id);
          setUnreadMsg(null);
      }
  };

  const handleDeleteClick = (id: string) => {
      setConfirmDeleteId(id);
  };

  const confirmDelete = () => {
      if (confirmDeleteId) {
          deleteRequest(confirmDeleteId);
          setConfirmDeleteId(null);
      }
  };

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
            {/* NEXT SHIFT CARD (NEW) */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl shadow-lg p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-10 -translate-y-10">
                    <CalendarDays size={120} />
                </div>
                <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                    <div>
                        <h3 className="text-lg font-bold mb-1 flex items-center">
                            <CalendarDays className="mr-2" size={20} /> Mis Turnos
                        </h3>
                        {nextShift ? (
                             <div className="mt-4">
                                <p className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-1">Próximo Turno</p>
                                <div className="flex items-center space-x-4">
                                    <span className="text-3xl font-bold">
                                        {new Date(nextShift.date + 'T12:00:00').getDate()}
                                    </span>
                                    <div className="border-l border-slate-600 pl-4">
                                        <p className="font-medium text-lg capitalize">{new Date(nextShift.date + 'T12:00:00').toLocaleString('es-ES', { month: 'long', weekday: 'long' })}</p>
                                        <div className={`flex items-center text-sm font-bold mt-1 text-indigo-400`}>
                                            <Clock size={16} className="mr-1.5" />
                                            {nextShiftDef ? (
                                                <span>
                                                    {nextShiftDef.name.toUpperCase()} ({nextShiftDef.startTime}-{nextShiftDef.endTime}
                                                    {nextShiftDef.startTime2 ? ` / ${nextShiftDef.startTime2}-${nextShiftDef.endTime2}` : ''})
                                                </span>
                                            ) : (
                                                <span>{nextShift.shiftType === 'MORNING' ? 'MAÑANA' : nextShift.shiftType === 'AFTERNOON' ? 'TARDE' : 'TURNO'}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                             </div>
                        ) : (
                            <p className="mt-4 text-slate-400 text-sm">No tienes turnos asignados próximamente.</p>
                        )}
                    </div>
                    <Link to="/calendar" className="mt-6 sm:mt-0 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg text-sm font-medium transition-colors flex items-center group">
                        Ver Calendario Completo <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </Link>
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

      {/* CUSTOM CONFIRMATION MODAL */}
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

      {/* INTERNAL MESSAGE MODAL */}
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
                      <div className="text-slate-600 text-sm leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
                          {unreadMsg.body.split('\n').map((line: string, i: number) => (
                              <p key={i} className="mb-2 last:mb-0">{line}</p>
                          ))}
                      </div>
                      <p className="text-xs text-slate-400 mt-4 text-right">
                          Recibido el {new Date(unreadMsg.createdAt).toLocaleDateString()} a las {new Date(unreadMsg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                  </div>
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
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
