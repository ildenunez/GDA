
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { ChevronLeft, ChevronRight, Filter, Briefcase, Plus, X, Clock } from 'lucide-react';
import { Role, RequestStatus } from '../types';

const CalendarView = () => {
  const { currentUser, requests, users, departments, absenceTypes, shifts, addShift, deleteShift, shiftTypes } = useData();
  
  // --- STATE ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDeptId, setSelectedDeptId] = useState<string>('all');
  const [selectedUserId, setSelectedUserId] = useState<string>('all');
  const [managementMode, setManagementMode] = useState(false); // Toggle to edit shifts
  
  // Shift Management Modal
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [shiftForm, setShiftForm] = useState({
      userId: '',
      startDate: '',
      endDate: '', // Range assignment
      shiftTypeId: ''
  });

  // --- HELPERS ---
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; 
  };

  const isSameDay = (d1: Date, d2: Date) => 
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const isDateInRange = (date: Date, start: string, end: string) => {
      const d = new Date(date.setHours(0,0,0,0));
      const s = new Date(new Date(start).setHours(0,0,0,0));
      const e = new Date(new Date(end).setHours(0,0,0,0));
      return d >= s && d <= e;
  };

  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  // --- FILTER LOGIC ---
  const isAdmin = currentUser?.role === Role.ADMIN;
  const isWorker = currentUser?.role === Role.WORKER;
  
  const availableUsers = useMemo(() => {
      if (isAdmin) return users;
      if (isWorker && currentUser) return [currentUser]; // Worker only sees themselves
      // Supervisor
      const managedDeptIds = departments.filter(d => d.supervisorIds.includes(currentUser?.id || '')).map(d => d.id);
      return users.filter(u => managedDeptIds.includes(u.departmentId || ''));
  }, [users, isAdmin, isWorker, currentUser, departments]);


  // --- HANDLERS ---
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const handleAssignShifts = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!shiftForm.userId || !shiftForm.startDate || !shiftForm.endDate || !shiftForm.shiftTypeId) return;
      
      const start = new Date(shiftForm.startDate);
      const end = new Date(shiftForm.endDate);
      
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const dateStr = formatDate(d);
          await addShift(shiftForm.userId, dateStr, shiftForm.shiftTypeId);
      }
      setShowShiftModal(false);
      setShiftForm({ userId: '', startDate: '', endDate: '', shiftTypeId: '' });
  };

  const handleDayClick = (dateStr: string) => {
      if (managementMode && !isWorker) {
          setShiftForm({ ...shiftForm, startDate: dateStr, endDate: dateStr });
          setShowShiftModal(true);
      }
  };

  // --- RENDER GRID ---
  const renderCalendarDays = () => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const daysInMonth = getDaysInMonth(year, month);
      const firstDay = getFirstDayOfMonth(year, month);
      
      const days = [];
      
      for (let i = 0; i < firstDay; i++) {
          days.push(<div key={`empty-${i}`} className="bg-slate-50/50 min-h-[120px] border border-slate-100"></div>);
      }

      for (let d = 1; d <= daysInMonth; d++) {
          const date = new Date(year, month, d);
          const dateStr = formatDate(date);
          const isToday = isSameDay(date, new Date());
          
          // Filter data for this cell
          const dayRequests = requests.filter(r => 
              r.status === RequestStatus.APPROVED && 
              isDateInRange(date, r.startDate, r.endDate) &&
              availableUsers.some(u => u.id === r.userId) &&
              (selectedUserId === 'all' || r.userId === selectedUserId) &&
              (selectedDeptId === 'all' || users.find(u => u.id === r.userId)?.departmentId === selectedDeptId)
          );

          const dayShifts = shifts.filter(s => 
              s.date === dateStr && 
              availableUsers.some(u => u.id === s.userId) &&
              (selectedUserId === 'all' || s.userId === selectedUserId) &&
              (selectedDeptId === 'all' || users.find(u => u.id === s.userId)?.departmentId === selectedDeptId)
          );

          // Determine View Mode: "Single View" (Big Card) or "Multi View" (List)
          // Use Single View if it's a Worker OR if an Admin has filtered to a specific user
          const isSingleView = isWorker || (selectedUserId !== 'all');

          days.push(
              <div 
                  key={d} 
                  onClick={() => handleDayClick(dateStr)}
                  className={`bg-white min-h-[120px] border border-slate-100 p-1 overflow-hidden transition-colors relative group ${managementMode && !isWorker ? 'cursor-pointer hover:bg-blue-50/50' : ''} ${isToday ? 'bg-blue-50/30' : ''}`}
              >
                  <span className={`text-sm font-medium ml-1 absolute top-1 left-1 z-10 ${isToday ? 'bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center' : 'text-slate-400'}`}>{d}</span>
                  
                  {managementMode && !isWorker && (
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 z-20">
                          <Plus size={14} className="text-primary" />
                      </div>
                  )}

                  <div className="mt-6 w-full h-full">
                      {/* SHIFTS RENDER */}
                      {dayShifts.map(shift => {
                          const user = users.find(u => u.id === shift.userId);
                          const shiftDef = shiftTypes.find(t => t.id === shift.shiftType);
                          
                          if (isSingleView && shiftDef) {
                              // BIG CARD STYLE (Admin Style)
                              return (
                                  <div key={shift.id} className={`absolute inset-1 mt-6 rounded-lg flex flex-col items-center justify-center shadow-sm animate-in zoom-in duration-200 ${shiftDef.color}`}>
                                      <Clock size={24} className="mb-1 opacity-70" />
                                      <span className="text-xs font-bold text-center leading-tight uppercase px-1">{shiftDef.name}</span>
                                      <span className="text-[10px] opacity-75">{shiftDef.startTime}-{shiftDef.endTime}</span>
                                      {managementMode && !isWorker && (
                                         <button onClick={(e) => { e.stopPropagation(); deleteShift(shift.id); }} className="absolute top-1 right-1 text-red-500 hover:text-red-700 bg-white/50 rounded-full p-0.5"><X size={12} /></button>
                                      )}
                                  </div>
                              );
                          }

                          // LIST STYLE (Multi-User View)
                          let label = shiftDef ? shiftDef.name.substring(0,1) : '?';
                          if (!shiftDef && shift.shiftType === 'MORNING') label = 'M';
                          if (!shiftDef && shift.shiftType === 'AFTERNOON') label = 'T';

                          return (
                              <div key={shift.id} className="flex items-center text-[10px] px-1 py-0.5 rounded border bg-white border-slate-200 mb-1">
                                  <div className="w-1.5 h-full rounded-l absolute left-0 top-0 bottom-0" style={{ backgroundColor: user?.calendarColor || '#ccc' }}></div>
                                  <span className={`font-bold ml-1 mr-1 ${shiftDef ? '' : (shift.shiftType === 'MORNING' ? 'text-amber-600' : 'text-indigo-600')}`}>
                                      {label}
                                  </span>
                                  <span className="truncate flex-1">{user?.name.split(' ')[0]}</span>
                                  {managementMode && !isWorker && (
                                      <button onClick={(e) => { e.stopPropagation(); deleteShift(shift.id); }} className="ml-1 text-slate-400 hover:text-red-500"><X size={10} /></button>
                                  )}
                              </div>
                          )
                      })}

                      {/* ABSENCES RENDER (Overlay if Single View) */}
                      {dayRequests.map(req => {
                          const user = users.find(u => u.id === req.userId);
                          const type = absenceTypes.find(t => t.id === req.typeId);
                          
                          if (isSingleView) {
                               // If there is a shift, show absence as a small pill on top, otherwise fill
                               const hasShift = dayShifts.length > 0;
                               return (
                                   <div key={req.id} className={`absolute ${hasShift ? 'bottom-1 left-1 right-1' : 'inset-1 mt-6'} z-20 rounded border flex flex-col items-center justify-center text-center shadow-sm ${type?.color} ${hasShift ? 'h-auto py-0.5 text-[9px]' : ''}`}>
                                       {!hasShift && <Briefcase size={20} className="mb-1 opacity-50" />}
                                       <span className="font-bold text-[10px]">{type?.name}</span>
                                   </div>
                               );
                          }

                          return (
                              <div key={req.id} className="text-[10px] px-1 py-0.5 rounded bg-slate-100 text-slate-600 truncate border border-slate-200 opacity-70 mb-1">
                                  {user?.name.split(' ')[0]} - {type?.name}
                              </div>
                          )
                      })}
                  </div>
              </div>
          );
      }
      return days;
  };

  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Calendario</h2>
                <p className="text-slate-500">Visualiza turnos y ausencias.</p>
            </div>
            
            {!isWorker && (
                <div className="flex items-center space-x-3">
                    <button 
                        onClick={() => setManagementMode(!managementMode)}
                        className={`px-3 py-2 rounded-lg text-sm font-bold flex items-center transition-all ${managementMode ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-400' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        <Briefcase size={16} className="mr-2" />
                        {managementMode ? 'Modo Gestión Activo' : 'Gestionar Turnos'}
                    </button>
                    {managementMode && (
                        <button onClick={() => setShowShiftModal(true)} className="px-3 py-2 bg-primary text-white rounded-lg text-sm font-bold shadow-lg hover:bg-primary/90 flex items-center">
                            <Plus size={16} className="mr-2" /> Asignar Masivo
                        </button>
                    )}
                </div>
            )}
        </div>

        {/* FILTERS - Hide for workers to keep it simple */}
        {!isWorker && (
            <div className="flex space-x-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm w-fit">
                <div className="flex items-center px-2 text-slate-400"><Filter size={16} /></div>
                {isAdmin && (
                    <select className="bg-transparent text-sm border-r border-slate-200 pr-2 outline-none" value={selectedDeptId} onChange={e => setSelectedDeptId(e.target.value)}>
                        <option value="all">Todos Depts.</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                )}
                <select className="bg-transparent text-sm outline-none" value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}>
                    <option value="all">Todos Usuarios</option>
                    {availableUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
            </div>
        )}

        {/* CALENDAR CONTROLS */}
        <div className="bg-white rounded-t-2xl border border-slate-200 p-4 flex justify-between items-center shadow-sm z-10 relative">
            <button onClick={prevMonth} className="p-2 hover:bg-slate-100 rounded-full"><ChevronLeft /></button>
            <h3 className="text-lg font-bold text-slate-800 capitalize">{monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}</h3>
            <button onClick={nextMonth} className="p-2 hover:bg-slate-100 rounded-full"><ChevronRight /></button>
        </div>

        {/* CALENDAR GRID */}
        <div className="bg-white border-x border-b border-slate-200 shadow-sm rounded-b-2xl overflow-hidden">
            <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
                {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(day => (
                    <div key={day} className="py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">{day}</div>
                ))}
            </div>
            <div className="grid grid-cols-7">
                {renderCalendarDays()}
            </div>
        </div>

        {/* MODAL: SHIFT ASSIGNMENT */}
        {showShiftModal && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg text-slate-800">Asignar Turnos</h3>
                        <button onClick={() => setShowShiftModal(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
                    </div>
                    <form onSubmit={handleAssignShifts} className="space-y-4">
                        <div>
                            <label className="block text-xs uppercase font-bold text-slate-500 mb-1">Empleado</label>
                            <select required className="w-full border rounded p-2 text-sm" value={shiftForm.userId} onChange={e => setShiftForm({...shiftForm, userId: e.target.value})}>
                                <option value="">Seleccionar...</option>
                                {availableUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs uppercase font-bold text-slate-500 mb-1">Desde</label>
                                <input type="date" required className="w-full border rounded p-2 text-sm" value={shiftForm.startDate} onChange={e => setShiftForm({...shiftForm, startDate: e.target.value})} />
                            </div>
                            <div>
                                <label className="block text-xs uppercase font-bold text-slate-500 mb-1">Hasta</label>
                                <input type="date" required className="w-full border rounded p-2 text-sm" value={shiftForm.endDate} onChange={e => setShiftForm({...shiftForm, endDate: e.target.value})} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs uppercase font-bold text-slate-500 mb-1">Turno</label>
                            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                                {shiftTypes.map(type => (
                                    <button 
                                        type="button" 
                                        key={type.id}
                                        onClick={() => setShiftForm({...shiftForm, shiftTypeId: type.id})} 
                                        className={`p-2 rounded border text-sm font-medium flex items-center justify-center transition-colors ${shiftForm.shiftTypeId === type.id ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        <Clock size={14} className="mr-1" /> {type.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button type="submit" className="w-full bg-slate-800 text-white py-2 rounded-lg font-bold hover:bg-slate-700">Guardar Turnos</button>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default CalendarView;
