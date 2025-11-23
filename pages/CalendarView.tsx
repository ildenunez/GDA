import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { ChevronLeft, ChevronRight, Filter, AlertTriangle } from 'lucide-react';
import { Role, RequestStatus } from '../types';

const CalendarView = () => {
  const { currentUser, requests, users, departments, absenceTypes } = useData();
  
  // --- STATE ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDeptId, setSelectedDeptId] = useState<string>('all');
  const [selectedUserId, setSelectedUserId] = useState<string>('all');

  // --- HELPERS ---
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Adjust to make Monday 0, Sunday 6
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

  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  // --- FILTER LOGIC ---
  const isAdmin = currentUser?.role === Role.ADMIN;
  
  // 1. Determine which users to show based on Role
  const availableUsers = useMemo(() => {
      if (isAdmin) return users;
      // Supervisors only see their managed departments
      const managedDeptIds = departments.filter(d => d.supervisorIds.includes(currentUser?.id || '')).map(d => d.id);
      return users.filter(u => managedDeptIds.includes(u.departmentId || ''));
  }, [users, isAdmin, currentUser, departments]);

  // 2. Filter Requests based on UI Filters + Role Constraints
  const filteredRequests = useMemo(() => {
      return requests.filter(req => {
          // Status Filter: Only Approved or Pending
          if (req.status === RequestStatus.REJECTED) return false;
          
          const user = users.find(u => u.id === req.userId);
          if (!user) return false;

          // Role Constraint
          const isManaged = availableUsers.some(u => u.id === user.id);
          if (!isManaged) return false;

          // UI Filters
          if (selectedDeptId !== 'all' && user.departmentId !== selectedDeptId) return false;
          if (selectedUserId !== 'all' && user.id !== selectedUserId) return false;

          return true;
      });
  }, [requests, availableUsers, selectedDeptId, selectedUserId, users]);

  // --- CONFLICT DETECTION LOGIC ---
  const conflicts = useMemo(() => {
      const detectedConflicts: { date: string, users: string[], deptName: string }[] = [];
      
      // Get all dates involved in the current month view (approx)
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const daysInMonth = getDaysInMonth(year, month);

      for (let d = 1; d <= daysInMonth; d++) {
          const checkDate = new Date(year, month, d);
          
          // Find requests active on this date
          const activeReqs = filteredRequests.filter(r => isDateInRange(checkDate, r.startDate, r.endDate));
          
          if (activeReqs.length > 1) {
             // Group by Department to find conflicts
             const byDept: Record<string, string[]> = {};
             
             activeReqs.forEach(req => {
                 const u = users.find(usr => usr.id === req.userId);
                 if (u && u.departmentId) {
                     if (!byDept[u.departmentId]) byDept[u.departmentId] = [];
                     byDept[u.departmentId].push(u.name);
                 }
             });

             // If a department has > 1 person absent
             Object.keys(byDept).forEach(deptId => {
                 if (byDept[deptId].length > 1) {
                     detectedConflicts.push({
                         date: checkDate.toLocaleDateString(),
                         users: byDept[deptId],
                         deptName: departments.find(dp => dp.id === deptId)?.name || 'General'
                     });
                 }
             });
          }
      }
      return detectedConflicts;
  }, [filteredRequests, currentDate, users, departments]);


  // --- NAVIGATION ---
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));


  // --- RENDER GRID ---
  const renderCalendarDays = () => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const daysInMonth = getDaysInMonth(year, month);
      const firstDay = getFirstDayOfMonth(year, month);
      
      const days = [];
      
      // Empty slots
      for (let i = 0; i < firstDay; i++) {
          days.push(<div key={`empty-${i}`} className="bg-slate-50/50 h-32 border border-slate-100"></div>);
      }

      // Days
      for (let d = 1; d <= daysInMonth; d++) {
          const date = new Date(year, month, d);
          const isToday = isSameDay(date, new Date());
          
          const dayRequests = filteredRequests.filter(r => isDateInRange(date, r.startDate, r.endDate));

          days.push(
              <div key={d} className={`bg-white h-32 border border-slate-100 p-2 overflow-hidden hover:bg-slate-50 transition-colors relative ${isToday ? 'bg-blue-50/30' : ''}`}>
                  <span className={`text-sm font-medium ${isToday ? 'bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center' : 'text-slate-700'}`}>{d}</span>
                  
                  <div className="mt-1 space-y-1 overflow-y-auto max-h-[calc(100%-24px)] custom-scrollbar">
                      {dayRequests.map(req => {
                          const user = users.find(u => u.id === req.userId);
                          const type = absenceTypes.find(t => t.id === req.typeId);
                          const isPending = req.status === RequestStatus.PENDING;
                          
                          return (
                              <div key={req.id} className={`text-[10px] p-1 rounded border truncate cursor-pointer flex items-center ${isPending ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}
                                title={`${user?.name} - ${type?.name} (${req.status})`}
                              >
                                  <span className={`w-1.5 h-1.5 rounded-full mr-1 ${type?.color.split(' ')[0]}`}></span>
                                  <span className="font-semibold mr-1">{user?.name.split(' ')[0]}</span>
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
                <h2 className="text-2xl font-bold text-slate-800">Calendario de Equipo</h2>
                <p className="text-slate-500">Visualiza ausencias y detecta conflictos.</p>
            </div>
            
            {/* FILTERS */}
            <div className="flex space-x-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex items-center px-2 text-slate-400"><Filter size={16} /></div>
                
                {isAdmin && (
                    <select 
                        className="bg-transparent text-sm border-r border-slate-200 pr-2 outline-none"
                        value={selectedDeptId} onChange={e => setSelectedDeptId(e.target.value)}
                    >
                        <option value="all">Todos Depts.</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                )}
                
                <select 
                    className="bg-transparent text-sm outline-none"
                    value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}
                >
                    <option value="all">Todos Usuarios</option>
                    {availableUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
            </div>
        </div>

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

        {/* CONFLICTS SECTION */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
             <h4 className="font-bold text-amber-800 flex items-center mb-4">
                 <AlertTriangle className="mr-2" size={20} /> Conflictos Detectados ({conflicts.length})
             </h4>
             {conflicts.length === 0 ? (
                 <p className="text-sm text-amber-700/70">No hay coincidencias de ausencias en el mismo departamento para este mes.</p>
             ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {conflicts.map((c, i) => (
                         <div key={i} className="bg-white p-3 rounded-lg border border-amber-100 shadow-sm">
                             <p className="text-xs font-bold text-slate-500 uppercase mb-1">{c.date}</p>
                             <p className="text-sm font-semibold text-slate-800">{c.deptName}</p>
                             <div className="mt-2 flex flex-wrap gap-1">
                                 {c.users.map((u, idx) => (
                                     <span key={idx} className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">{u}</span>
                                 ))}
                             </div>
                         </div>
                     ))}
                 </div>
             )}
        </div>
    </div>
  );
};

export default CalendarView;
