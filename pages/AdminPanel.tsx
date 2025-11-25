
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Settings, Calendar, Briefcase, Plus, User as UserIcon, Trash2, Edit2, Search, X, Check, Eye, Printer, Download, Upload, Database, Mail, Save, AlertCircle, Key, Server, Palette, Sun, Moon, Eraser, ChevronLeft, ChevronRight, CalendarDays, Clock } from 'lucide-react';
import { Role, RequestStatus, AbsenceType, Department, User, OvertimeRecord, RedemptionType, EmailTemplate, ShiftType, ShiftTypeDefinition } from '../types';

const AdminPanel = () => {
  const { 
      absenceTypes, createAbsenceType, deleteAbsenceType, updateAbsenceType,
      departments, addDepartment, updateDepartment, deleteDepartment,
      users, updateUser, adjustUserVacation, addUser, requests, deleteRequest, overtime, addOvertime, deleteOvertime,
      notifications, importDatabase, emailTemplates, updateEmailTemplate, saveEmailConfig, emailConfig, saveSmtpConfig, smtpConfig,
      shifts, addShift, deleteShift, shiftTypes, createShiftType, deleteShiftType
  } = useData();
  
  const [activeTab, setActiveTab] = useState<'config' | 'users' | 'comms' | 'shifts'>('config');

  // --- CONFIG TAB STATES ---
  const [newType, setNewType] = useState({ name: '', isClosedRange: false, color: 'bg-gray-100 text-gray-800', rangeStart: '', rangeEnd: '', deductsDays: false });
  const [newDept, setNewDept] = useState({ name: '', supervisorIds: [] as string[] });
  
  // New Shift Type Form
  const [newShiftType, setNewShiftType] = useState({ name: '', color: 'bg-blue-100 text-blue-800 border-blue-300', startTime: '08:00', endTime: '15:00' });
  
  // Edit States
  const [editingType, setEditingType] = useState<AbsenceType | null>(null);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  // --- COMM TAB STATES ---
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [emailConfigForm, setEmailConfigForm] = useState(emailConfig);
  const [smtpConfigForm, setSmtpConfigForm] = useState(smtpConfig);

  // --- SHIFTS TAB STATES ---
  const [shiftCurrentDate, setShiftCurrentDate] = useState(new Date());
  const [shiftSelectedUserId, setShiftSelectedUserId] = useState<string>('');
  const [paintTool, setPaintTool] = useState<string>('MORNING'); // Default to ID 'MORNING' or 'ERASE'

  // --- USER TAB STATES ---
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null); // For Modal
  const [activeUserTab, setActiveUserTab] = useState<'info' | 'absences' | 'overtime'>('info');
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  
  // Detail View State (Redemption)
  const [viewingRedemption, setViewingRedemption] = useState<OvertimeRecord | null>(null);
  
  // New User Form - Expanded
  const [newUserForm, setNewUserForm] = useState({ 
      name: '', email: '', role: Role.WORKER, departmentId: '', 
      initialVacation: 0, initialOvertime: 0, calendarColor: '#3b82f6'
  });
  
  // User Adjustment States
  const [adjustDays, setAdjustDays] = useState(0);
  const [adjustHours, setAdjustHours] = useState(0);
  const [adjustReasonDays, setAdjustReasonDays] = useState('');
  const [adjustReasonHours, setAdjustReasonHours] = useState('');
  
  // Password State
  const [newPassword, setNewPassword] = useState('');
  
  // --- CONFIRMATION MODAL STATE ---
  const [confirmModal, setConfirmModal] = useState<{
      show: boolean, 
      title: string, 
      message: string, 
      onConfirm: () => void 
  } | null>(null);

  // --- HANDLERS: CONFIG ---

  const handleCreateType = (e: React.FormEvent) => {
    e.preventDefault();
    const typePayload: any = {
        name: newType.name,
        isClosedRange: newType.isClosedRange,
        color: newType.color,
        deductsDays: newType.deductsDays
    };
    if (newType.isClosedRange && newType.rangeStart && newType.rangeEnd) {
        typePayload.availableRanges = [{ start: newType.rangeStart, end: newType.rangeEnd }];
    }
    createAbsenceType(typePayload);
    setNewType({ name: '', isClosedRange: false, color: 'bg-gray-100 text-gray-800', rangeStart: '', rangeEnd: '', deductsDays: false });
  };
  
  const handleCreateShiftType = (e: React.FormEvent) => {
      e.preventDefault();
      createShiftType(newShiftType);
      setNewShiftType({ name: '', color: 'bg-blue-100 text-blue-800 border-blue-300', startTime: '08:00', endTime: '15:00' });
  };

  const handleUpdateType = (e: React.FormEvent) => {
      e.preventDefault();
      if (editingType) {
          updateAbsenceType(editingType);
          setEditingType(null);
      }
  };

  const handleCreateDept = (e: React.FormEvent) => {
      e.preventDefault();
      if (newDept.name) {
          addDepartment(newDept.name, newDept.supervisorIds);
          setNewDept({ name: '', supervisorIds: [] });
      }
  };

  const handleUpdateDept = (e: React.FormEvent) => {
      e.preventDefault();
      if (editingDept) {
          updateDepartment(editingDept);
          setEditingDept(null);
      }
  };

  const toggleSupervisorForNew = (userId: string) => {
      setNewDept(prev => {
          const exists = prev.supervisorIds.includes(userId);
          return {
              ...prev,
              supervisorIds: exists 
                ? prev.supervisorIds.filter(id => id !== userId)
                : [...prev.supervisorIds, userId]
          };
      });
  };

  const toggleSupervisorForEdit = (userId: string) => {
      if (!editingDept) return;
      setEditingDept(prev => {
          if (!prev) return null;
          const exists = prev.supervisorIds.includes(userId);
          return {
              ...prev,
              supervisorIds: exists 
                ? prev.supervisorIds.filter(id => id !== userId)
                : [...prev.supervisorIds, userId]
          };
      });
  };
  
  const handleUpdateTemplate = (e: React.FormEvent) => {
      e.preventDefault();
      if (editingTemplate) {
          updateEmailTemplate(editingTemplate);
          setEditingTemplate(null);
      }
  };

  const toggleRecipient = (role: Role) => {
      if (!editingTemplate) return;
      setEditingTemplate(prev => {
          if (!prev) return null;
          const exists = prev.recipients.includes(role);
          return {
              ...prev,
              recipients: exists ? prev.recipients.filter(r => r !== role) : [...prev.recipients, role]
          };
      });
  };

  const handleSaveEmailConfig = (e: React.FormEvent) => {
      e.preventDefault();
      saveEmailConfig(emailConfigForm);
  };

  const handleSaveSmtpConfig = (e: React.FormEvent) => {
      e.preventDefault();
      saveSmtpConfig(smtpConfigForm);
  };

  // --- HANDLERS: BACKUP ---
  const handleExportDB = () => {
      const data = {
          users,
          departments,
          absenceTypes,
          requests,
          overtime,
          notifications,
          exportDate: new Date().toISOString()
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rrhh_chs_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleImportDB = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
              try {
                  const json = JSON.parse(event.target?.result as string);
                  setConfirmModal({
                      show: true,
                      title: 'Importar Base de Datos',
                      message: '¿Estás seguro? Esto sobrescribirá todos los datos actuales con los del archivo.',
                      onConfirm: () => {
                          importDatabase(json);
                          setConfirmModal(null);
                      }
                  });
              } catch (err) {
                  alert("Error al leer el archivo. Asegúrate de que es un JSON válido.");
              }
          };
          reader.readAsText(file);
      }
  };

  // --- HANDLERS: USER MANAGEMENT ---

  const handleCreateUser = (e: React.FormEvent) => {
      e.preventDefault();
      if (newUserForm.role !== Role.ADMIN && !newUserForm.departmentId) {
          alert("El departamento es obligatorio para Trabajadores y Supervisores.");
          return;
      }

      addUser(
          { 
            name: newUserForm.name, 
            email: newUserForm.email, 
            role: newUserForm.role, 
            departmentId: newUserForm.departmentId,
            calendarColor: newUserForm.calendarColor
          }, 
          Number(newUserForm.initialVacation), 
          Number(newUserForm.initialOvertime)
      );
      
      setShowCreateUserModal(false);
      setNewUserForm({ name: '', email: '', role: Role.WORKER, departmentId: '', initialVacation: 0, initialOvertime: 0, calendarColor: '#3b82f6' });
  };

  const handleUpdatePassword = () => {
      if(selectedUser && newPassword) {
          updateUser(selectedUser.id, { password: newPassword });
          alert('Contraseña actualizada');
          setNewPassword('');
      }
  }

  const handleAdjustDays = () => {
      if (selectedUser && adjustDays !== 0) {
          const reason = adjustReasonDays.trim() || 'Regularización Administrativa';
          adjustUserVacation(selectedUser.id, Number(adjustDays), reason);
          setAdjustDays(0);
          setAdjustReasonDays('');
          const updatedUser = users.find(u => u.id === selectedUser.id);
          if (updatedUser) {
               const currentAdj = selectedUser.vacationAdjustment || 0;
               setSelectedUser({ ...selectedUser, vacationAdjustment: currentAdj + Number(adjustDays) });
          }
      }
  };

  const handleAdjustHours = () => {
      if (selectedUser && adjustHours !== 0) {
          const reason = adjustReasonHours.trim() || 'Regularización Administrativa';
          addOvertime({
              userId: selectedUser.id,
              date: new Date().toISOString(),
              hours: Number(adjustHours),
              description: reason,
              status: RequestStatus.APPROVED 
          });
          setAdjustHours(0);
          setAdjustReasonHours('');
          alert('Horas ajustadas correctamente.');
      }
  };

  const handleDeleteRequestClick = (id: string) => {
      setConfirmModal({
          show: true,
          title: 'Eliminar Solicitud',
          message: '¿Seguro que quieres eliminar esta solicitud? Los días se restaurarán.',
          onConfirm: () => {
              deleteRequest(id);
              setConfirmModal(null);
          }
      });
  }

  const handleDeleteOvertimeClick = (id: string) => {
      setConfirmModal({
          show: true,
          title: 'Eliminar Registro',
          message: '¿Seguro que quieres eliminar este registro de horas?',
          onConfirm: () => {
              deleteOvertime(id);
              setConfirmModal(null);
          }
      });
  }

  const handlePrint = () => {
    window.print();
  };

  const getRedemptionLabel = (type?: RedemptionType) => {
    switch(type) {
        case RedemptionType.PAYROLL: return 'Abono en Nómina';
        case RedemptionType.DAYS_EXCHANGE: return 'Canje por Días';
        case RedemptionType.TIME_OFF: return 'Horas Libres';
        default: return 'Canje';
    }
  };

  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.includes(searchTerm.toLowerCase()));

  // --- SHIFT MANAGEMENT LOGIC ---
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; 
  };
  const formatDate = (d: Date) => d.toISOString().split('T')[0];
  
  const handleShiftDayClick = async (day: number) => {
      if (!shiftSelectedUserId) return;
      const date = new Date(shiftCurrentDate.getFullYear(), shiftCurrentDate.getMonth(), day);
      const dateStr = formatDate(date);
      
      const existingShift = shifts.find(s => s.userId === shiftSelectedUserId && s.date === dateStr);
      
      if (paintTool === 'ERASE') {
          if (existingShift) {
              await deleteShift(existingShift.id);
          }
      } else {
          // If different or not exists, add/update
          if (!existingShift || existingShift.shiftType !== paintTool) {
               await addShift(shiftSelectedUserId, dateStr, paintTool);
          }
      }
  };

  const renderShiftCalendar = () => {
      const year = shiftCurrentDate.getFullYear();
      const month = shiftCurrentDate.getMonth();
      const daysInMonth = getDaysInMonth(year, month);
      const firstDay = getFirstDayOfMonth(year, month);
      
      const days = [];
      for (let i = 0; i < firstDay; i++) {
          days.push(<div key={`empty-${i}`} className="min-h-[100px] bg-slate-50 border-r border-b border-slate-100"></div>);
      }
      
      for (let d = 1; d <= daysInMonth; d++) {
          const date = new Date(year, month, d);
          const dateStr = formatDate(date);
          const currentShift = shifts.find(s => s.userId === shiftSelectedUserId && s.date === dateStr);
          
          let shiftDef = null;
          if (currentShift) {
              shiftDef = shiftTypes.find(t => t.id === currentShift.shiftType);
          }
          
          // Paint Tool Preview color
          let previewColor = 'bg-slate-200';
          if (paintTool !== 'ERASE') {
               const toolDef = shiftTypes.find(t => t.id === paintTool);
               if (toolDef) previewColor = toolDef.color;
          }

          days.push(
              <div 
                key={d} 
                onClick={() => handleShiftDayClick(d)}
                className={`min-h-[100px] border-r border-b border-slate-100 relative cursor-pointer hover:bg-slate-50 transition-colors group select-none`}
              >
                  <span className="absolute top-2 left-2 text-xs font-semibold text-slate-400">{d}</span>
                  
                  {currentShift && shiftDef && (
                      <div className={`absolute inset-2 rounded-lg flex flex-col items-center justify-center shadow-sm animate-in zoom-in duration-200 ${shiftDef.color}`}>
                          <Clock size={20} className="mb-1 opacity-70" />
                          <span className="text-[10px] font-bold text-center leading-tight uppercase px-1">{shiftDef.name}</span>
                          <span className="text-[9px] opacity-75">{shiftDef.startTime}-{shiftDef.endTime}</span>
                      </div>
                  )}
                  
                  {/* Hover Preview of Paint Tool */}
                  <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 pointer-events-none flex items-center justify-center">
                       {paintTool === 'ERASE' ? (
                           <Eraser className="text-red-500/50" />
                       ) : (
                           <div className={`w-8 h-8 rounded-full opacity-50 ${previewColor}`}></div>
                       )}
                  </div>
              </div>
          );
      }
      
      return days;
  };

  return (
    <div className="space-y-6">
       {/* ... Header & Tabs ... */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Administración</h2>
                <p className="text-slate-500">Panel de control global.</p>
            </div>
            <div className="flex flex-wrap gap-2 bg-white p-1 rounded-lg border border-slate-200">
                <button onClick={() => setActiveTab('config')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'config' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Configuración</button>
                <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Usuarios</button>
                <button onClick={() => setActiveTab('shifts')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'shifts' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Turnos</button>
                <button onClick={() => setActiveTab('comms')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'comms' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Comunicaciones</button>
            </div>
       </div>

       {/* ... Config & Comms Tabs ... */}
       {activeTab === 'config' && (
           <div className="space-y-8">
               <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                      <Database className="mr-2 text-slate-500" size={20} /> Copia de Seguridad y Restauración
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">Guarda una copia local de todos los datos (usuarios, fichajes, departamentos) o restaura un estado anterior. Utiliza esto para no perder datos al cambiar de navegador.</p>
                  
                  <div className="flex items-center space-x-4">
                      <button onClick={handleExportDB} className="flex items-center px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 border border-slate-200 font-medium text-sm transition-colors">
                          <Download size={16} className="mr-2" /> Exportar Base de Datos
                      </button>
                      <div className="relative">
                          <input type="file" accept=".json" onChange={handleImportDB} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                          <button className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 font-medium text-sm transition-colors">
                             <Upload size={16} className="mr-2" /> Importar Base de Datos
                          </button>
                      </div>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* ABSENCE TYPES COMPONENT */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                      <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                          <Calendar className="mr-2 text-primary" size={20} /> Tipos de Ausencia
                      </h3>
                      <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2">
                          {absenceTypes.map(type => (
                              <div key={type.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg group">
                                  <div className="flex items-center space-x-3">
                                      <span className={`w-4 h-4 rounded-full ${type.color.split(' ')[0]}`}></span>
                                      <div>
                                          <p className="text-sm font-medium text-slate-700">{type.name}</p>
                                          <p className="text-xs text-slate-400">
                                              {type.isClosedRange ? 'Fechas Cerradas' : 'Abierto'} 
                                              {type.deductsDays ? ' • Descuenta días' : ''}
                                          </p>
                                      </div>
                                  </div>
                                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={() => setEditingType(type)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"><Edit2 size={14} /></button>
                                      <button onClick={() => deleteAbsenceType(type.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                                  </div>
                              </div>
                          ))}
                      </div>
                      <div className="border-t border-slate-100 pt-4">
                          <h4 className="text-sm font-semibold text-slate-600 mb-3">Crear Nuevo Tipo</h4>
                          <form onSubmit={handleCreateType} className="space-y-3">
                              <input 
                                type="text" 
                                placeholder="Nombre (ej. Día de Asuntos Propios)" 
                                className="w-full rounded-lg border-slate-300 border p-2 text-sm"
                                value={newType.name}
                                onChange={e => setNewType({...newType, name: e.target.value})}
                                required
                              />
                              <div className="flex items-center space-x-2">
                                  <input type="checkbox" id="closedRange" checked={newType.isClosedRange} onChange={e => setNewType({...newType, isClosedRange: e.target.checked})} />
                                  <label htmlFor="closedRange" className="text-sm text-slate-600">Rango cerrado</label>
                              </div>
                              <div className="flex items-center space-x-2">
                                  <input type="checkbox" id="deductsDays" checked={newType.deductsDays} onChange={e => setNewType({...newType, deductsDays: e.target.checked})} />
                                  <label htmlFor="deductsDays" className="text-sm text-slate-600 font-medium text-red-500">¿Descuenta de vacaciones?</label>
                              </div>
                              {newType.isClosedRange && (
                                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg">
                                      <input type="date" className="text-xs border rounded p-1" required onChange={e => setNewType({...newType, rangeStart: e.target.value})} />
                                      <input type="date" className="text-xs border rounded p-1" required onChange={e => setNewType({...newType, rangeEnd: e.target.value})} />
                                  </div>
                              )}
                              <select className="w-full rounded-lg border-slate-300 border p-2 text-sm" value={newType.color} onChange={e => setNewType({...newType, color: e.target.value})}>
                                  <option value="bg-blue-100 text-blue-800">Azul</option>
                                  <option value="bg-green-100 text-green-800">Verde</option>
                                  <option value="bg-purple-100 text-purple-800">Morado</option>
                                  <option value="bg-pink-100 text-pink-800">Rosa</option>
                                  <option value="bg-orange-100 text-orange-800">Naranja</option>
                              </select>
                              <button className="w-full bg-slate-800 text-white py-2 rounded-lg text-sm hover:bg-slate-700 flex items-center justify-center">
                                  <Plus size={16} className="mr-2" /> Crear Tipo
                              </button>
                          </form>
                      </div>
                  </div>

                  {/* DEPARTMENTS COMPONENT */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col">
                      <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                          <Briefcase className="mr-2 text-secondary" size={20} /> Departamentos
                      </h3>
                      <div className="flex-1 space-y-4 mb-6 max-h-64 overflow-y-auto pr-2">
                          {departments.map(dept => {
                              return (
                                  <div key={dept.id} className="p-3 border border-slate-100 rounded-lg group hover:bg-slate-50">
                                      <div className="flex justify-between items-center mb-1">
                                          <p className="text-sm font-bold text-slate-700">{dept.name}</p>
                                          <div className="flex items-center space-x-2">
                                              <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{dept.supervisorIds.length} Sup.</span>
                                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex">
                                                  <button onClick={() => setEditingDept(dept)} className="p-1 text-blue-500"><Edit2 size={14}/></button>
                                                  <button onClick={() => deleteDepartment(dept.id)} className="p-1 text-red-500"><Trash2 size={14}/></button>
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              );
                          })}
                      </div>
                      <div className="border-t border-slate-100 pt-4 mt-auto">
                           <h4 className="text-sm font-semibold text-slate-600 mb-3">Nuevo Departamento</h4>
                           <form onSubmit={handleCreateDept} className="space-y-3">
                                <input type="text" placeholder="Nombre" className="w-full rounded-lg border-slate-300 border p-2 text-sm" value={newDept.name} onChange={e => setNewDept({...newDept, name: e.target.value})} required />
                                <div className="border rounded-lg p-2 max-h-32 overflow-y-auto">
                                    <p className="text-xs font-semibold text-slate-500 mb-2">Seleccionar Supervisores:</p>
                                    {users.filter(u => u.role === Role.SUPERVISOR || u.role === Role.ADMIN).map(u => (
                                        <label key={u.id} className="flex items-center space-x-2 text-sm py-1 hover:bg-slate-50 cursor-pointer">
                                            <input type="checkbox" checked={newDept.supervisorIds.includes(u.id)} onChange={() => toggleSupervisorForNew(u.id)} className="rounded text-secondary focus:ring-secondary" />
                                            <span>{u.name}</span>
                                        </label>
                                    ))}
                                </div>
                                <button className="w-full bg-secondary text-white py-2 rounded-lg text-sm hover:bg-emerald-600 flex items-center justify-center">
                                    <Plus size={16} className="mr-2" /> Añadir Dept.
                                </button>
                           </form>
                      </div>
                  </div>
                  
                  {/* SHIFT TYPES CONFIG */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:col-span-2">
                      <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                          <Clock className="mr-2 text-indigo-600" size={20} /> Tipos de Turno
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                               {shiftTypes.map(type => (
                                   <div key={type.id} className={`flex items-center justify-between p-3 border rounded-lg ${type.color}`}>
                                       <div>
                                           <p className="font-bold text-sm">{type.name}</p>
                                           <p className="text-xs opacity-75">{type.startTime} - {type.endTime}</p>
                                       </div>
                                       <button onClick={() => deleteShiftType(type.id)} className="p-1 hover:bg-white/20 rounded"><Trash2 size={14} /></button>
                                   </div>
                               ))}
                           </div>
                           <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                               <h4 className="text-sm font-semibold text-slate-600 mb-3">Crear Tipo de Turno</h4>
                               <form onSubmit={handleCreateShiftType} className="space-y-3">
                                   <input type="text" placeholder="Nombre (ej. Guardia, Noche)" className="w-full border rounded p-2 text-sm" value={newShiftType.name} onChange={e => setNewShiftType({...newShiftType, name: e.target.value})} required />
                                   <div className="grid grid-cols-2 gap-2">
                                       <input type="time" className="border rounded p-2 text-sm" value={newShiftType.startTime} onChange={e => setNewShiftType({...newShiftType, startTime: e.target.value})} required />
                                       <input type="time" className="border rounded p-2 text-sm" value={newShiftType.endTime} onChange={e => setNewShiftType({...newShiftType, endTime: e.target.value})} required />
                                   </div>
                                   <select className="w-full border rounded p-2 text-sm" value={newShiftType.color} onChange={e => setNewShiftType({...newShiftType, color: e.target.value})}>
                                       <option value="bg-blue-100 text-blue-800 border-blue-300">Azul</option>
                                       <option value="bg-green-100 text-green-800 border-green-300">Verde</option>
                                       <option value="bg-amber-100 text-amber-800 border-amber-300">Ámbar (Mañana)</option>
                                       <option value="bg-indigo-100 text-indigo-800 border-indigo-300">Índigo (Tarde)</option>
                                       <option value="bg-slate-800 text-slate-200 border-slate-600">Oscuro (Noche)</option>
                                       <option value="bg-purple-100 text-purple-800 border-purple-300">Morado</option>
                                       <option value="bg-pink-100 text-pink-800 border-pink-300">Rosa</option>
                                       <option value="bg-red-100 text-red-800 border-red-300">Rojo</option>
                                   </select>
                                   <button type="submit" className="w-full bg-indigo-600 text-white py-2 rounded text-sm hover:bg-indigo-700 font-medium">Crear Turno</button>
                               </form>
                           </div>
                      </div>
                  </div>
               </div>
           </div>
       )}

       {/* ... Comms Tab ... */}
       {activeTab === 'comms' && (
           <div className="space-y-6">
                {/* ... (Existing Comms Code) ... */}
               <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                   <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                      <Mail className="mr-2 text-primary" size={20} /> Plantillas de Email
                   </h3>
                   {/* ... (Existing Email Logic) ... */}
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div className="col-span-1 border-r border-slate-100 pr-4 space-y-2">
                           {emailTemplates.map(t => (
                               <button key={t.id} onClick={() => setEditingTemplate(t)} className={`w-full text-left p-3 rounded-lg text-sm transition-colors ${editingTemplate?.id === t.id ? 'bg-primary text-white' : 'hover:bg-slate-50 text-slate-700'}`}>
                                   <div className="font-bold mb-1">{t.name}</div>
                               </button>
                           ))}
                       </div>
                       <div className="col-span-2">
                           {editingTemplate && (
                               <form onSubmit={handleUpdateTemplate} className="space-y-4">
                                   <div className="bg-slate-50 p-3 rounded-lg mb-4">
                                       <div className="flex space-x-4">
                                           <label className="flex items-center space-x-2 text-sm cursor-pointer"><input type="checkbox" checked={editingTemplate.recipients.includes(Role.WORKER)} onChange={() => toggleRecipient(Role.WORKER)} className="rounded text-primary" /><span>Trabajador</span></label>
                                           <label className="flex items-center space-x-2 text-sm cursor-pointer"><input type="checkbox" checked={editingTemplate.recipients.includes(Role.SUPERVISOR)} onChange={() => toggleRecipient(Role.SUPERVISOR)} className="rounded text-primary" /><span>Supervisor</span></label>
                                           <label className="flex items-center space-x-2 text-sm cursor-pointer"><input type="checkbox" checked={editingTemplate.recipients.includes(Role.ADMIN)} onChange={() => toggleRecipient(Role.ADMIN)} className="rounded text-primary" /><span>Admin</span></label>
                                       </div>
                                   </div>
                                   <input type="text" className="w-full border rounded-lg p-2 text-sm" value={editingTemplate.subject} onChange={e => setEditingTemplate({...editingTemplate, subject: e.target.value})} />
                                   <textarea className="w-full border rounded-lg p-2 text-sm h-32" value={editingTemplate.body} onChange={e => setEditingTemplate({...editingTemplate, body: e.target.value})} />
                                   <div className="flex justify-end pt-2"><button type="submit" className="flex items-center bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90"><Save size={16} className="mr-2" /> Guardar Cambios</button></div>
                               </form>
                           )}
                       </div>
                   </div>
               </div>
               
               {/* CONFIGURACION EMAILJS */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                   <h3 className="font-bold text-slate-800 mb-4 flex items-center text-orange-600">
                      <Mail className="mr-2" size={20} /> Configuración EmailJS (Sin Backend)
                   </h3>
                   <form onSubmit={handleSaveEmailConfig} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Service ID</label>
                            <input type="text" className="w-full border rounded-lg p-2 text-sm" value={emailConfigForm.serviceId} onChange={e => setEmailConfigForm({...emailConfigForm, serviceId: e.target.value})} placeholder="service_xxx" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Template ID</label>
                            <input type="text" className="w-full border rounded-lg p-2 text-sm" value={emailConfigForm.templateId} onChange={e => setEmailConfigForm({...emailConfigForm, templateId: e.target.value})} placeholder="template_xxx" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Public Key</label>
                            <input type="text" className="w-full border rounded-lg p-2 text-sm" value={emailConfigForm.publicKey} onChange={e => setEmailConfigForm({...emailConfigForm, publicKey: e.target.value})} placeholder="user_xxx" />
                        </div>
                        <div className="md:col-span-3">
                            <button type="submit" className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700">Guardar Credenciales EmailJS</button>
                        </div>
                   </form>
                </div>

                {/* CONFIGURACION SMTP */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                   <h3 className="font-bold text-slate-800 mb-4 flex items-center text-blue-600">
                      <Server className="mr-2" size={20} /> Configuración SMTP (Requiere Backend)
                   </h3>
                   <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4 text-xs text-blue-700">
                       Nota: Esta configuración se guardará para uso futuro. Actualmente la WebApp usa EmailJS porque se ejecuta en el navegador.
                   </div>
                   <form onSubmit={handleSaveSmtpConfig} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Host SMTP</label>
                            <input type="text" className="w-full border rounded-lg p-2 text-sm" value={smtpConfigForm.host} onChange={e => setSmtpConfigForm({...smtpConfigForm, host: e.target.value})} placeholder="smtp.office365.com" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Puerto</label>
                            <input type="text" className="w-full border rounded-lg p-2 text-sm" value={smtpConfigForm.port} onChange={e => setSmtpConfigForm({...smtpConfigForm, port: e.target.value})} placeholder="587" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Usuario</label>
                            <input type="text" className="w-full border rounded-lg p-2 text-sm" value={smtpConfigForm.user} onChange={e => setSmtpConfigForm({...smtpConfigForm, user: e.target.value})} placeholder="tu@email.com" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña</label>
                            <input type="password" className="w-full border rounded-lg p-2 text-sm" value={smtpConfigForm.pass} onChange={e => setSmtpConfigForm({...smtpConfigForm, pass: e.target.value})} placeholder="*****" />
                        </div>
                        <div className="md:col-span-2">
                             <label className="flex items-center space-x-2 text-sm cursor-pointer mb-3">
                                <input type="checkbox" checked={smtpConfigForm.secure} onChange={e => setSmtpConfigForm({...smtpConfigForm, secure: e.target.checked})} className="rounded text-blue-600" />
                                <span>Usar conexión segura (SSL/TLS)</span>
                             </label>
                            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Guardar Config SMTP</button>
                        </div>
                   </form>
                </div>
           </div>
       )}

       {/* --- SHIFTS MANAGEMENT TAB --- */}
       {activeTab === 'shifts' && (
           <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
               {/* SIDEBAR: CONTROLS */}
               <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col space-y-6 overflow-y-auto">
                   <div>
                       <h3 className="font-bold text-slate-800 mb-1">Gestión Visual</h3>
                       <p className="text-xs text-slate-500">Selecciona usuario y dibuja en el calendario.</p>
                   </div>
                   
                   <div>
                       <label className="block text-xs font-bold text-slate-500 uppercase mb-2">1. Seleccionar Trabajador</label>
                       <select 
                           className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                           value={shiftSelectedUserId}
                           onChange={e => setShiftSelectedUserId(e.target.value)}
                       >
                           <option value="">-- Elegir Empleado --</option>
                           {users.map(u => (
                               <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                           ))}
                       </select>
                   </div>
                   
                   {shiftSelectedUserId && (
                       <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                           <label className="block text-xs font-bold text-slate-500 uppercase mb-3">2. Elegir Herramienta</label>
                           <div className="space-y-3">
                               {shiftTypes.map(type => (
                                   <button 
                                       key={type.id}
                                       onClick={() => setPaintTool(type.id)}
                                       className={`w-full flex items-center p-3 rounded-xl border transition-all text-left ${paintTool === type.id ? 'bg-slate-800 text-white border-slate-800 ring-2 ring-slate-400' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                                   >
                                       <div className={`p-2 rounded-lg mr-3 shadow-sm ${type.color}`}>
                                           <Clock size={16} />
                                       </div>
                                       <div>
                                           <span className="block font-bold text-sm">{type.name}</span>
                                           <span className="text-[10px] opacity-75">{type.startTime} - {type.endTime}</span>
                                       </div>
                                       {paintTool === type.id && <Check size={16} className="ml-auto" />}
                                   </button>
                               ))}

                               <button 
                                   onClick={() => setPaintTool('ERASE')}
                                   className={`w-full flex items-center p-3 rounded-xl border transition-all ${paintTool === 'ERASE' ? 'bg-red-50 border-red-500 ring-1 ring-red-500' : 'bg-white border-slate-200 hover:border-red-300'}`}
                               >
                                   <div className={`p-2 rounded-lg mr-3 ${paintTool === 'ERASE' ? 'bg-red-500 text-white' : 'bg-red-100 text-red-600'}`}>
                                       <Eraser size={20} />
                                   </div>
                                   <div className="text-left">
                                       <span className="block font-bold text-slate-700 text-sm">Borrador</span>
                                       <span className="text-xs text-slate-500">Eliminar turno</span>
                                   </div>
                                   {paintTool === 'ERASE' && <Check size={16} className="ml-auto text-red-600" />}
                               </button>
                           </div>
                       </div>
                   )}
                   
                   <div className="mt-auto pt-6 border-t border-slate-100">
                       <div className="bg-blue-50 p-3 rounded-lg flex items-start">
                           <div className="text-blue-500 mr-2 mt-0.5"><Palette size={16} /></div>
                           <p className="text-xs text-blue-700 leading-relaxed">
                               <strong>Instrucciones:</strong> Haz clic en los días del calendario para aplicar el turno seleccionado.
                           </p>
                       </div>
                   </div>
               </div>
               
               {/* MAIN CALENDAR AREA */}
               <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden h-full">
                   {/* Calendar Header */}
                   <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50 flex-shrink-0">
                       <button onClick={() => setShiftCurrentDate(new Date(shiftCurrentDate.getFullYear(), shiftCurrentDate.getMonth() - 1, 1))} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all"><ChevronLeft /></button>
                       <h3 className="text-lg font-bold text-slate-800 capitalize">
                           {shiftCurrentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}
                       </h3>
                       <button onClick={() => setShiftCurrentDate(new Date(shiftCurrentDate.getFullYear(), shiftCurrentDate.getMonth() + 1, 1))} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all"><ChevronRight /></button>
                   </div>
                   
                   {/* Calendar Header Row */}
                   <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 flex-shrink-0">
                       {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                           <div key={day} className="py-2 text-center text-xs font-bold text-slate-500 uppercase">
                               {day}
                           </div>
                       ))}
                   </div>
                   
                   {/* Calendar Grid Container with Scroll */}
                   <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
                       {!shiftSelectedUserId ? (
                           <div className="h-full flex flex-col items-center justify-center text-slate-400">
                               <CalendarDays size={48} className="mb-4 opacity-50" />
                               <p>Selecciona un trabajador para comenzar a asignar turnos.</p>
                           </div>
                       ) : (
                           <div className="grid grid-cols-7 auto-rows-fr">
                               {renderShiftCalendar()}
                           </div>
                       )}
                   </div>
               </div>
           </div>
       )}

       {/* ... Users Tab ... */}
       {activeTab === 'users' && (
           <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
               <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                   {/* Search & Create User Button */}
                   <div className="relative w-full max-w-sm">
                       <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                       <input type="text" className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary" placeholder="Buscar usuario..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                   </div>
                   <button onClick={() => setShowCreateUserModal(true)} className="flex items-center bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-700">
                       <Plus size={16} className="mr-2" /> Nuevo Usuario
                   </button>
               </div>
               {/* Users Table */}
               <div className="overflow-x-auto">
                   <table className="w-full">
                       <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider text-left">
                           <tr>
                               <th className="px-6 py-3">Usuario</th>
                               <th className="px-6 py-3">Rol</th>
                               <th className="px-6 py-3">Dept.</th>
                               <th className="px-6 py-3">Color</th>
                               <th className="px-6 py-3">Acciones</th>
                           </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                           {filteredUsers.map(user => (
                               <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                   <td className="px-6 py-4">
                                       <div className="flex items-center">
                                           <img src={user.avatarUrl} className="w-8 h-8 rounded-full mr-3 object-cover" alt="" />
                                           <div><p className="text-sm font-semibold text-slate-800">{user.name}</p></div>
                                       </div>
                                   </td>
                                   <td className="px-6 py-4"><span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{user.role}</span></td>
                                   <td className="px-6 py-4 text-sm text-slate-600">{departments.find(d => d.id === user.departmentId)?.name || '-'}</td>
                                   <td className="px-6 py-4">
                                       <div className="w-6 h-6 rounded-full border border-slate-200" style={{backgroundColor: user.calendarColor || '#3b82f6'}}></div>
                                   </td>
                                   <td className="px-6 py-4"><button onClick={() => setSelectedUser(user)} className="text-slate-500 hover:text-primary transition-colors flex items-center text-sm font-medium"><Settings size={16} className="mr-1" /> Gestionar</button></td>
                               </tr>
                           ))}
                       </tbody>
                   </table>
               </div>
           </div>
       )}

       {/* MODAL: CREATE USER */}
       {showCreateUserModal && (
           <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
               <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                   <div className="flex justify-between items-center mb-6">
                       <h3 className="text-lg font-bold">Crear Nuevo Usuario</h3>
                       <button onClick={() => setShowCreateUserModal(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
                   </div>
                   <form onSubmit={handleCreateUser} className="space-y-4">
                       <div><label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label><input type="text" className="w-full border rounded-lg p-2 text-sm" required value={newUserForm.name} onChange={e => setNewUserForm({...newUserForm, name: e.target.value})} /></div>
                       <div><label className="block text-sm font-medium text-slate-700 mb-1">Email</label><input type="email" className="w-full border rounded-lg p-2 text-sm" required value={newUserForm.email} onChange={e => setNewUserForm({...newUserForm, email: e.target.value})} /></div>
                       <div className="grid grid-cols-2 gap-4">
                           <div>
                               <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
                               <select className="w-full border rounded-lg p-2 text-sm" value={newUserForm.role} onChange={e => setNewUserForm({...newUserForm, role: e.target.value as Role})}><option value={Role.WORKER}>Trabajador</option><option value={Role.SUPERVISOR}>Supervisor</option><option value={Role.ADMIN}>Administrador</option></select>
                           </div>
                           <div>
                               <label className="block text-sm font-medium text-slate-700 mb-1">Departamento</label>
                               <select className="w-full border rounded-lg p-2 text-sm" value={newUserForm.departmentId} onChange={e => setNewUserForm({...newUserForm, departmentId: e.target.value})} disabled={newUserForm.role === Role.ADMIN}><option value="">{newUserForm.role === Role.ADMIN ? 'N/A' : 'Seleccionar...'}</option>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
                           </div>
                       </div>
                       
                       <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">Color de Calendario</label>
                           <div className="flex items-center space-x-2">
                               <input type="color" className="w-10 h-10 p-1 rounded border cursor-pointer" value={newUserForm.calendarColor} onChange={e => setNewUserForm({...newUserForm, calendarColor: e.target.value})} />
                               <span className="text-sm text-slate-500">Para identificar sus turnos.</span>
                           </div>
                       </div>
                       
                       <div className="border-t border-slate-100 pt-4 mt-2">
                           <h4 className="text-sm font-bold text-slate-700 mb-2">Saldos Iniciales</h4>
                           <div className="grid grid-cols-2 gap-4">
                               <div><label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Ajuste Vac.</label><input type="number" className="w-full border rounded-lg p-2 text-sm" value={newUserForm.initialVacation} onChange={e => setNewUserForm({...newUserForm, initialVacation: Number(e.target.value)})} /></div>
                               <div><label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Saldo Horas</label><input type="number" className="w-full border rounded-lg p-2 text-sm" value={newUserForm.initialOvertime} onChange={e => setNewUserForm({...newUserForm, initialOvertime: Number(e.target.value)})} /></div>
                           </div>
                       </div>
                       <button type="submit" className="w-full bg-slate-800 text-white py-2 rounded-lg font-medium hover:bg-slate-700 mt-2">Crear Usuario</button>
                   </form>
               </div>
           </div>
       )}

       {/* MODAL: USER DETAIL (Same as before) */}
       {selectedUser && (
           <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
               <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                   <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                       <div className="flex items-center space-x-3"><img src={selectedUser.avatarUrl} className="w-10 h-10 rounded-full bg-slate-200" alt="" /><div><h3 className="font-bold text-slate-800">{selectedUser.name}</h3></div></div>
                       <button onClick={() => setSelectedUser(null)}><X /></button>
                   </div>
                   <div className="flex border-b border-slate-100"><button onClick={() => setActiveUserTab('info')} className={`flex-1 py-3 text-sm font-medium ${activeUserTab === 'info' ? 'text-primary border-b-2 border-primary' : 'text-slate-500'}`}>Perfil</button><button onClick={() => setActiveUserTab('absences')} className={`flex-1 py-3 text-sm font-medium ${activeUserTab === 'absences' ? 'text-primary border-b-2 border-primary' : 'text-slate-500'}`}>Ausencias</button><button onClick={() => setActiveUserTab('overtime')} className={`flex-1 py-3 text-sm font-medium ${activeUserTab === 'overtime' ? 'text-primary border-b-2 border-primary' : 'text-slate-500'}`}>Horas</button></div>

                   <div className="p-6 overflow-y-auto bg-slate-50/50 flex-1">
                       {activeUserTab === 'info' && (
                           <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
                               <h4 className="font-bold text-slate-700">Editar Perfil</h4>
                               <div><label className="text-xs uppercase text-slate-500">Nombre</label><input type="text" className="w-full border-b py-1 text-sm" value={selectedUser.name} onChange={e => updateUser(selectedUser.id, { name: e.target.value })} /></div>
                               <div><label className="text-xs uppercase text-slate-500">Color Calendario</label><div className="flex items-center mt-1"><input type="color" className="w-8 h-8 rounded border p-0.5" value={selectedUser.calendarColor || '#3b82f6'} onChange={e => updateUser(selectedUser.id, { calendarColor: e.target.value })} /></div></div>
                               <div><label className="text-xs uppercase text-slate-500">Contraseña</label><div className="flex space-x-2"><input type="text" className="w-full border-b py-1 text-sm" placeholder="Nueva contraseña" value={newPassword} onChange={e => setNewPassword(e.target.value)} /><button onClick={handleUpdatePassword} className="text-xs bg-slate-800 text-white px-3 rounded">Actualizar</button></div></div>
                               
                               <div className="mt-6 pt-4 border-t border-slate-100">
                                   <h4 className="font-bold text-slate-700 mb-2">Ajuste Manual de Vacaciones</h4>
                                   <div className="flex space-x-2 mb-2">
                                       <input type="number" className="w-20 border rounded p-1 text-sm" placeholder="Días" value={adjustDays} onChange={e => setAdjustDays(Number(e.target.value))} />
                                       <input type="text" className="flex-1 border rounded p-1 text-sm" placeholder="Motivo (Opcional)" value={adjustReasonDays} onChange={e => setAdjustReasonDays(e.target.value)} />
                                       <button onClick={handleAdjustDays} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">Ajustar</button>
                                   </div>
                                   <p className="text-xs text-slate-500">Saldo Actual: {22 + (selectedUser.vacationAdjustment || 0)} días</p>
                                   
                                   {selectedUser.vacationHistory && selectedUser.vacationHistory.length > 0 && (
                                       <div className="mt-4">
                                           <p className="text-xs font-bold text-slate-500 uppercase mb-2">Historial de Ajustes</p>
                                           <div className="bg-slate-50 border rounded-lg max-h-32 overflow-y-auto">
                                               {selectedUser.vacationHistory.map(log => (
                                                   <div key={log.id} className="flex justify-between p-2 text-xs border-b last:border-0">
                                                       <span>{new Date(log.date).toLocaleDateString()}</span>
                                                       <span className="flex-1 mx-2 text-slate-600 truncate">{log.reason}</span>
                                                       <span className={`font-bold ${log.days > 0 ? 'text-green-600' : 'text-red-600'}`}>{log.days > 0 ? '+' : ''}{log.days}</span>
                                                   </div>
                                               ))}
                                           </div>
                                       </div>
                                   )}
                               </div>
                           </div>
                       )}
                       {activeUserTab === 'absences' && (
                           <div className="bg-white rounded-xl border border-slate-200 p-0 overflow-hidden">
                               <table className="w-full text-sm">
                                   <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                                       <tr><th className="px-4 py-2 text-left">Fechas</th><th className="px-4 py-2 text-left">Tipo</th><th className="px-4 py-2 text-right">Estado</th><th className="px-4 py-2"></th></tr>
                                   </thead>
                                   <tbody className="divide-y divide-slate-100">
                                       {requests.filter(r => r.userId === selectedUser.id).map(r => (
                                           <tr key={r.id}>
                                               <td className="px-4 py-3">{new Date(r.startDate).toLocaleDateString()} - {new Date(r.endDate).toLocaleDateString()}</td>
                                               <td className="px-4 py-3">{absenceTypes.find(t => t.id === r.typeId)?.name}</td>
                                               <td className="px-4 py-3 text-right"><span className={`px-2 py-0.5 rounded text-xs ${r.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{r.status}</span></td>
                                               <td className="px-4 py-3 text-right"><button onClick={() => handleDeleteRequestClick(r.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={14}/></button></td>
                                           </tr>
                                       ))}
                                   </tbody>
                               </table>
                           </div>
                       )}
                       {activeUserTab === 'overtime' && (
                           <div className="space-y-4">
                                <div className="bg-white p-4 rounded-xl border border-slate-200">
                                    <h4 className="font-bold text-slate-700 mb-2">Añadir/Restar Horas (Ajuste)</h4>
                                    <div className="flex space-x-2">
                                       <input type="number" className="w-20 border rounded p-1 text-sm" placeholder="Horas" value={adjustHours} onChange={e => setAdjustHours(Number(e.target.value))} />
                                       <input type="text" className="flex-1 border rounded p-1 text-sm" placeholder="Motivo (Opcional)" value={adjustReasonHours} onChange={e => setAdjustReasonHours(e.target.value)} />
                                       <button onClick={handleAdjustHours} className="bg-purple-600 text-white px-3 py-1 rounded text-sm">Guardar</button>
                                   </div>
                                </div>
                               <div className="bg-white rounded-xl border border-slate-200 p-0 overflow-hidden">
                                   <table className="w-full text-sm">
                                       <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                                           <tr><th className="px-4 py-2 text-left">Fecha</th><th className="px-4 py-2 text-left">Concepto</th><th className="px-4 py-2 text-right">Horas</th><th className="px-4 py-2"></th></tr>
                                       </thead>
                                       <tbody className="divide-y divide-slate-100">
                                           {overtime.filter(o => o.userId === selectedUser.id).map(o => (
                                               <tr key={o.id}>
                                                   <td className="px-4 py-3">{new Date(o.date).toLocaleDateString()}</td>
                                                   <td className="px-4 py-3">
                                                       {o.description}
                                                       {o.redemptionType && <span className="ml-1 text-[10px] bg-purple-100 text-purple-700 px-1 rounded">CANJE</span>}
                                                   </td>
                                                   <td className="px-4 py-3 text-right font-bold">{o.hours > 0 ? `+${o.hours}` : o.hours}</td>
                                                   <td className="px-4 py-3 text-right">
                                                       <div className="flex justify-end space-x-2">
                                                            {o.hours < 0 && o.status === RequestStatus.APPROVED && (
                                                                <button onClick={() => setViewingRedemption(o)} className="text-blue-500 hover:text-blue-700"><Eye size={14} /></button>
                                                            )}
                                                            <button onClick={() => handleDeleteOvertimeClick(o.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={14}/></button>
                                                       </div>
                                                   </td>
                                               </tr>
                                           ))}
                                       </tbody>
                                   </table>
                               </div>
                           </div>
                       )}
                   </div>
               </div>
           </div>
       )}
       {/* ... Confirmation Modals ... */}
        {confirmModal && (
          <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full animate-in zoom-in duration-200">
                  <div className="flex items-center text-slate-800 mb-4">
                      <AlertCircle className="mr-2 text-slate-800" />
                      <h3 className="font-bold text-lg">{confirmModal.title}</h3>
                  </div>
                  <p className="text-slate-600 text-sm mb-6">{confirmModal.message}</p>
                  <div className="flex justify-end space-x-3">
                      <button onClick={() => setConfirmModal(null)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg font-medium text-sm">Cancelar</button>
                      <button onClick={confirmModal.onConfirm} className="px-4 py-2 bg-slate-800 text-white hover:bg-slate-700 rounded-lg font-medium text-sm">Confirmar</button>
                  </div>
              </div>
          </div>
      )}
      
      {/* REDEMPTION DETAIL MODAL (ADMIN VIEW) */}
      {viewingRedemption && (
        <div className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col print-area">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 no-print">
                    <h3 className="font-bold text-slate-800">Detalle de Canje</h3>
                    <button onClick={() => setViewingRedemption(null)} className="text-slate-400 hover:text-slate-600"><X /></button>
                </div>
                
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 font-bold">HR</div>
                            <div><h1 className="text-xl font-bold text-slate-800">RRHH CHS</h1><p className="text-xs text-slate-500">Informe de Consumo</p></div>
                        </div>
                        <div className="text-right"><p className="text-sm font-medium text-slate-700">Fecha</p><p className="text-slate-500 text-sm">{new Date(viewingRedemption.date).toLocaleDateString()}</p></div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mb-6">
                        <p className="text-xs text-slate-500 uppercase font-bold mb-2">Solicitante</p>
                        <p className="text-slate-800 font-medium">{users.find(u => u.id === viewingRedemption.userId)?.name}</p>
                        <div className="mt-4 flex justify-between items-center">
                            <div><p className="text-xs text-slate-500 uppercase font-bold">Tipo</p><p className="text-purple-600 font-bold">{getRedemptionLabel(viewingRedemption.redemptionType)}</p></div>
                            <div className="text-right"><p className="text-xs text-slate-500 uppercase font-bold">Total</p><p className="text-xl font-bold text-slate-800">{Math.abs(viewingRedemption.hours)}h</p></div>
                        </div>
                    </div>

                    <h4 className="font-bold text-slate-700 mb-2 border-b border-slate-100 pb-2">Trazabilidad</h4>
                    <table className="w-full text-sm mb-6">
                        <thead><tr className="text-slate-500 text-xs uppercase text-left"><th className="py-2">Fecha Origen</th><th className="py-2">Motivo</th><th className="py-2 text-right">Horas</th></tr></thead>
                        <tbody className="divide-y divide-slate-100">
                            {viewingRedemption.linkedRecordIds?.map(id => {
                                const original = overtime.find(o => o.id === id);
                                if (!original) return null;
                                return (
                                    <tr key={id}><td className="py-2">{new Date(original.date).toLocaleDateString()}</td><td className="py-2 text-slate-600 truncate max-w-[150px]">{original.description}</td><td className="py-2 text-right font-medium text-emerald-600">+{original.hours}h</td></tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-2 no-print">
                    <button onClick={handlePrint} className="flex items-center px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 shadow-sm"><Printer size={16} className="mr-2" /> Imprimir</button>
                    <button onClick={() => setViewingRedemption(null)} className="px-4 py-2 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700">Cerrar</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
