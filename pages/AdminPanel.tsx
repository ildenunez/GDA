
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Settings, Calendar, Briefcase, Plus, User as UserIcon, Trash2, Edit2, Search, X, Check, Eye, Printer, Download, Upload, Database, Mail, Save, AlertCircle, Key, Server, Palette, Sun, Moon, Eraser, ChevronLeft, ChevronRight, CalendarDays, Clock, FileText, LayoutList, Megaphone, Send, MessageSquare } from 'lucide-react';
import { Role, RequestStatus, AbsenceType, Department, User, OvertimeRecord, RedemptionType, EmailTemplate, ShiftType, ShiftTypeDefinition } from '../types';

const AdminPanel = () => {
  const { 
      absenceTypes, createAbsenceType, deleteAbsenceType, updateAbsenceType,
      departments, addDepartment, updateDepartment, deleteDepartment,
      users, updateUser, adjustUserVacation, addUser, deleteUser, requests, addRequest, deleteRequest, overtime, addOvertime, deleteOvertime, requestRedemption,
      notifications, importDatabase, emailTemplates, updateEmailTemplate, saveEmailConfig, emailConfig, saveSmtpConfig, smtpConfig, sendTestEmail, systemMessage, updateSystemMessage,
      shifts, addShift, deleteShift, shiftTypes, createShiftType, updateShiftType, deleteShiftType,
      sendInternalMessage
  } = useData();
  
  const [activeTab, setActiveTab] = useState<'config' | 'users' | 'comms' | 'shifts'>('config');

  // --- CONFIG TAB STATES ---
  const [newType, setNewType] = useState({ name: '', isClosedRange: false, color: 'bg-gray-100 text-gray-800', rangeStart: '', rangeEnd: '', deductsDays: false });
  const [newDept, setNewDept] = useState({ name: '', supervisorIds: [] as string[] });
  
  // New Shift Type Form
  const [newShiftType, setNewShiftType] = useState({ 
      name: '', color: 'bg-blue-100 text-blue-800 border-blue-300', 
      startTime: '08:00', endTime: '15:00',
      startTime2: '', endTime2: ''
  });
  const [editingShiftType, setEditingShiftType] = useState<ShiftTypeDefinition | null>(null);
  
  // Edit States (Modals)
  const [editingType, setEditingType] = useState<AbsenceType | null>(null);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  // --- COMM TAB STATES ---
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [emailConfigForm, setEmailConfigForm] = useState(emailConfig);
  const [smtpConfigForm, setSmtpConfigForm] = useState(smtpConfig);
  const [testEmailAddress, setTestEmailAddress] = useState('');
  
  // System Message State
  const [sysMsgForm, setSysMsgForm] = useState({
      text: systemMessage?.text || '',
      active: systemMessage?.active || false,
      color: systemMessage?.color || 'bg-blue-100 text-blue-800 border-blue-200'
  });
  
  // Internal Messaging State
  const [internalMsgForm, setInternalMsgForm] = useState({
      subject: '',
      body: '',
      target: 'ALL', // 'ALL' or 'SELECT'
      selectedUserIds: [] as string[]
  });

  // --- SHIFTS TAB STATES ---
  const [shiftCurrentDate, setShiftCurrentDate] = useState(new Date());
  const [shiftSelectedUserId, setShiftSelectedUserId] = useState<string>('');
  const [paintTool, setPaintTool] = useState<string>('MORNING'); // Default to ID 'MORNING' or 'ERASE'

  // --- USER TAB STATES ---
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null); // For Modal
  const [activeUserTab, setActiveUserTab] = useState<'info' | 'absences' | 'overtime' | 'adjustments'>('info');
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  
  // Detail Modal State (Admin view of redemptions)
  const [selectedRedemption, setSelectedRedemption] = useState<OvertimeRecord | null>(null);
  
  // New User Form
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
  
  // --- ADMIN CREATION MODALS STATE ---
  const [showAdminAbsenceModal, setShowAdminAbsenceModal] = useState(false);
  const [showAdminOvertimeModal, setShowAdminOvertimeModal] = useState(false);
  const [showAdminRedeemModal, setShowAdminRedeemModal] = useState(false);
  
  const [adminAbsenceForm, setAdminAbsenceForm] = useState({ typeId: '', startDate: '', endDate: '', comment: '' });
  const [adminOvertimeForm, setAdminOvertimeForm] = useState({ date: '', hours: 0, description: '' });
  const [adminRedeemForm, setAdminRedeemForm] = useState({ hours: 0, type: RedemptionType.TIME_OFF, selectedIds: [] as string[] });

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
      if (editingShiftType) {
          updateShiftType({ ...editingShiftType, ...newShiftType, id: editingShiftType.id });
          setEditingShiftType(null);
      } else {
          createShiftType(newShiftType);
      }
      setNewShiftType({ name: '', color: 'bg-blue-100 text-blue-800 border-blue-300', startTime: '08:00', endTime: '15:00', startTime2: '', endTime2: '' });
  };
  
  const handleEditShiftTypeClick = (type: ShiftTypeDefinition) => {
      setEditingShiftType(type);
      setNewShiftType({ 
          name: type.name, color: type.color, 
          startTime: type.startTime, endTime: type.endTime,
          startTime2: type.startTime2 || '', endTime2: type.endTime2 || ''
      });
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
  
  const handleUpdateSystemMessage = (e: React.FormEvent) => {
      e.preventDefault();
      updateSystemMessage({
          id: 'global_msg',
          text: sysMsgForm.text,
          active: sysMsgForm.active,
          color: sysMsgForm.color
      });
  };
  
  const handleSendInternalMessage = (e: React.FormEvent) => {
      e.preventDefault();
      const targets = internalMsgForm.target === 'ALL' ? ['ALL'] : internalMsgForm.selectedUserIds;
      if (targets.length === 0) return;
      
      sendInternalMessage(internalMsgForm.subject, internalMsgForm.body, targets);
      setInternalMsgForm({ subject: '', body: '', target: 'ALL', selectedUserIds: [] });
  };

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

  const handleDeleteUserClick = (user: User) => {
      setConfirmModal({
          show: true,
          title: 'Eliminar Usuario',
          message: `¿Estás seguro de que quieres eliminar a ${user.name}? Se borrarán todas sus solicitudes, horas y turnos.`,
          onConfirm: () => {
              deleteUser(user.id);
              setConfirmModal(null);
          }
      });
  };

  const handleDeleteRequestClick = (id: string) => {
      setConfirmModal({
          show: true,
          title: 'Eliminar Solicitud',
          message: '¿Estás seguro de que quieres eliminar esta solicitud? Los días se restaurarán.',
          onConfirm: () => {
              deleteRequest(id);
              setConfirmModal(null);
          }
      });
  };

  const handleDeleteOvertimeClick = (id: string) => {
      setConfirmModal({
          show: true,
          title: 'Eliminar Registro',
          message: '¿Estás seguro de que quieres eliminar este registro de horas?',
          onConfirm: () => {
              deleteOvertime(id);
              setConfirmModal(null);
          }
      });
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
  
  // --- ADMIN ACTIONS HANDLERS ---
  const handleAdminCreateAbsence = (e: React.FormEvent) => {
      e.preventDefault();
      if (selectedUser) {
          addRequest({
              userId: selectedUser.id,
              typeId: adminAbsenceForm.typeId,
              startDate: adminAbsenceForm.startDate,
              endDate: adminAbsenceForm.endDate,
              comment: adminAbsenceForm.comment + " (Creado por Admin)"
          }, RequestStatus.APPROVED);
          setShowAdminAbsenceModal(false);
          setAdminAbsenceForm({ typeId: '', startDate: '', endDate: '', comment: '' });
      }
  };

  const handleAdminCreateOvertime = (e: React.FormEvent) => {
      e.preventDefault();
      if (selectedUser) {
          addOvertime({
              userId: selectedUser.id,
              date: adminOvertimeForm.date,
              hours: Number(adminOvertimeForm.hours),
              description: adminOvertimeForm.description + " (Creado por Admin)",
              status: RequestStatus.APPROVED
          });
          setShowAdminOvertimeModal(false);
          setAdminOvertimeForm({ date: '', hours: 0, description: '' });
      }
  };

  const handleAdminRedeemOvertime = (e: React.FormEvent) => {
      e.preventDefault();
      if (selectedUser) {
          requestRedemption(
              Number(adminRedeemForm.hours), 
              adminRedeemForm.selectedIds, 
              adminRedeemForm.type, 
              selectedUser.id, 
              RequestStatus.APPROVED
          );
          setShowAdminRedeemModal(false);
          setAdminRedeemForm({ hours: 0, type: RedemptionType.TIME_OFF, selectedIds: [] });
      }
  };

  // Helper for redemption label
  const getRedemptionLabel = (type?: RedemptionType) => {
      switch(type) {
          case RedemptionType.PAYROLL: return 'Abono en Nómina';
          case RedemptionType.DAYS_EXCHANGE: return 'Canje por Días';
          case RedemptionType.TIME_OFF: return 'Horas Libres';
          default: return 'Canje';
      }
  };

  const handlePrint = () => {
      window.print();
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
                          {shiftDef.startTime2 && <span className="text-[9px] opacity-75">{shiftDef.startTime2}-{shiftDef.endTime2}</span>}
                      </div>
                  )}
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
       {/* Header & Tabs */}
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

       {/* Config Tab Content */}
       {activeTab === 'config' && (
           <div className="space-y-8">
               <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                      <Database className="mr-2 text-slate-500" size={20} /> Copia de Seguridad y Restauración
                  </h3>
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
                                          <p className="text-xs text-slate-400">{type.isClosedRange ? 'Fechas Cerradas' : 'Abierto'} {type.deductsDays ? '• Descuenta' : ''}</p>
                                      </div>
                                  </div>
                                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={() => setEditingType(type)} className="p-2 text-slate-400 hover:text-primary"><Edit2 size={16} /></button>
                                      <button onClick={() => deleteAbsenceType(type.id)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                                  </div>
                              </div>
                          ))}
                      </div>
                      
                      <form onSubmit={handleCreateType} className="space-y-4 border-t border-slate-100 pt-4">
                          <input required type="text" placeholder="Nombre (ej. Vacaciones)" className="w-full border rounded p-2 text-sm" value={newType.name} onChange={e => setNewType({...newType, name: e.target.value})} />
                          <div className="flex gap-4">
                                <label className="flex items-center text-sm text-slate-600"><input type="checkbox" className="mr-2" checked={newType.isClosedRange} onChange={e => setNewType({...newType, isClosedRange: e.target.checked})} /> Rango Cerrado</label>
                                <label className="flex items-center text-sm text-slate-600"><input type="checkbox" className="mr-2" checked={newType.deductsDays} onChange={e => setNewType({...newType, deductsDays: e.target.checked})} /> Descuenta Días</label>
                          </div>
                          {newType.isClosedRange && (
                             <div className="flex gap-2">
                                 <input type="date" required className="w-1/2 border rounded p-2 text-sm" value={newType.rangeStart} onChange={e => setNewType({...newType, rangeStart: e.target.value})} />
                                 <input type="date" required className="w-1/2 border rounded p-2 text-sm" value={newType.rangeEnd} onChange={e => setNewType({...newType, rangeEnd: e.target.value})} />
                             </div>
                          )}
                          <select className="w-full border rounded p-2 text-sm" value={newType.color} onChange={e => setNewType({...newType, color: e.target.value})}>
                               <option value="bg-gray-100 text-gray-800">Gris</option>
                               <option value="bg-blue-100 text-blue-800">Azul</option>
                               <option value="bg-green-100 text-green-800">Verde</option>
                               <option value="bg-yellow-100 text-yellow-800">Amarillo</option>
                               <option value="bg-red-100 text-red-800">Rojo</option>
                               <option value="bg-purple-100 text-purple-800">Morado</option>
                          </select>
                          <button type="submit" className="w-full bg-slate-800 text-white py-2 rounded-lg text-sm hover:bg-slate-700">Añadir Tipo</button>
                      </form>
                  </div>

                  {/* DEPARTMENTS COMPONENT */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                      <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                          <Briefcase className="mr-2 text-secondary" size={20} /> Departamentos
                      </h3>
                      <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2">
                          {departments.map(dept => (
                              <div key={dept.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg group">
                                  <div>
                                      <p className="text-sm font-medium text-slate-700">{dept.name}</p>
                                      <p className="text-xs text-slate-400">{dept.supervisorIds.length} Supervisores</p>
                                  </div>
                                  <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={() => setEditingDept(dept)} className="p-2 text-slate-400 hover:text-primary"><Edit2 size={16} /></button>
                                      <button onClick={() => deleteDepartment(dept.id)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                                  </div>
                              </div>
                          ))}
                      </div>
                      
                      <form onSubmit={handleCreateDept} className="space-y-4 border-t border-slate-100 pt-4">
                          <input required type="text" placeholder="Nombre" className="w-full border rounded p-2 text-sm" value={newDept.name} onChange={e => setNewDept({...newDept, name: e.target.value})} />
                          <div>
                              <p className="text-xs text-slate-500 mb-2">Asignar Supervisores:</p>
                              <div className="max-h-24 overflow-y-auto border rounded p-2 space-y-1">
                                  {users.filter(u => u.role !== Role.WORKER).map(u => (
                                      <label key={u.id} className="flex items-center text-xs">
                                          <input type="checkbox" className="mr-2" checked={newDept.supervisorIds.includes(u.id)} onChange={() => toggleSupervisorForNew(u.id)} />
                                          {u.name}
                                      </label>
                                  ))}
                              </div>
                          </div>
                          <button type="submit" className="w-full bg-slate-800 text-white py-2 rounded-lg text-sm hover:bg-slate-700">Añadir Dept.</button>
                      </form>
                  </div>
               </div>

               {/* Shift Types Config */}
               <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                   <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                       <Clock className="mr-2 text-indigo-500" size={20} /> Tipos de Turno
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-3">
                           {shiftTypes.map(type => (
                               <div key={type.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg group">
                                   <div className="flex items-center gap-3">
                                       <div className={`w-8 h-8 rounded flex items-center justify-center text-[10px] font-bold ${type.color}`}>
                                           {type.name.substring(0, 1)}
                                       </div>
                                       <div>
                                           <p className="text-sm font-bold text-slate-700">{type.name}</p>
                                           <p className="text-xs text-slate-500">{type.startTime}-{type.endTime}</p>
                                       </div>
                                   </div>
                                   <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                       <button onClick={() => handleEditShiftTypeClick(type)} className="p-2 text-slate-400 hover:text-primary"><Edit2 size={16} /></button>
                                       <button onClick={() => deleteShiftType(type.id)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={16} /></button>
                                   </div>
                               </div>
                           ))}
                       </div>
                       
                       <form onSubmit={handleCreateShiftType} className="space-y-4 bg-slate-50 p-4 rounded-xl">
                            <h4 className="text-sm font-semibold text-slate-700">{editingShiftType ? 'Editar Turno' : 'Crear Nuevo Turno'}</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2">
                                    <label className="text-xs font-bold text-slate-500">Nombre</label>
                                    <input required type="text" className="w-full border rounded p-2 text-sm" value={newShiftType.name} onChange={e => setNewShiftType({...newShiftType, name: e.target.value})} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500">Inicio 1</label>
                                    <input required type="time" className="w-full border rounded p-2 text-sm" value={newShiftType.startTime} onChange={e => setNewShiftType({...newShiftType, startTime: e.target.value})} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500">Fin 1</label>
                                    <input required type="time" className="w-full border rounded p-2 text-sm" value={newShiftType.endTime} onChange={e => setNewShiftType({...newShiftType, endTime: e.target.value})} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500">Inicio 2</label>
                                    <input type="time" className="w-full border rounded p-2 text-sm" value={newShiftType.startTime2} onChange={e => setNewShiftType({...newShiftType, startTime2: e.target.value})} />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500">Fin 2</label>
                                    <input type="time" className="w-full border rounded p-2 text-sm" value={newShiftType.endTime2} onChange={e => setNewShiftType({...newShiftType, endTime2: e.target.value})} />
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs font-bold text-slate-500">Color</label>
                                    <select className="w-full border rounded p-2 text-sm" value={newShiftType.color} onChange={e => setNewShiftType({...newShiftType, color: e.target.value})}>
                                        <option value="bg-blue-100 text-blue-800 border-blue-300">Azul</option>
                                        <option value="bg-amber-100 text-amber-800 border-amber-300">Naranja (Mañana)</option>
                                        <option value="bg-indigo-100 text-indigo-800 border-indigo-300">Indigo (Tarde)</option>
                                        <option value="bg-slate-800 text-slate-200 border-slate-600">Oscuro (Noche)</option>
                                    </select>
                                </div>
                            </div>
                            <button type="submit" className="flex-1 bg-slate-800 text-white py-2 rounded-lg text-sm hover:bg-slate-700 w-full">{editingShiftType ? 'Guardar' : 'Crear'}</button>
                       </form>
                   </div>
               </div>
           </div>
       )}

       {/* Users Tab */}
       {activeTab === 'users' && (
           <div className="space-y-6">
                <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="relative w-64">
                         <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                         <input type="text" placeholder="Buscar usuario..." className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <button onClick={() => setShowCreateUserModal(true)} className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                         <Plus size={18} className="mr-2" /> Nuevo Usuario
                    </button>
                </div>
                
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4">Usuario</th>
                                <th className="px-6 py-4">Rol</th>
                                <th className="px-6 py-4">Departamento</th>
                                <th className="px-6 py-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4 flex items-center gap-3">
                                        <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full bg-slate-200" />
                                        <div>
                                            <p className="font-medium text-slate-800">{user.name}</p>
                                            <p className="text-xs text-slate-500">{user.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${user.role === Role.ADMIN ? 'bg-purple-100 text-purple-700' : user.role === Role.SUPERVISOR ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>{user.role}</span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {departments.find(d => d.id === user.departmentId)?.name || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-right space-x-2">
                                        <button onClick={() => setSelectedUser(user)} className="text-slate-400 hover:text-primary"><Edit2 size={18} /></button>
                                        <button onClick={() => handleDeleteUserClick(user)} className="text-slate-400 hover:text-red-500"><Trash2 size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
           </div>
       )}

       {/* Shifts Tab content */}
       {activeTab === 'shifts' && (
           <div className="space-y-6">
               <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                         <h3 className="font-bold text-slate-800 mb-2">Editor de Turnos</h3>
                         <div className="flex gap-4 items-end">
                             <div>
                                 <label className="text-xs font-bold text-slate-500 block mb-1">Usuario</label>
                                 <select className="border rounded p-2 text-sm w-48" value={shiftSelectedUserId} onChange={e => setShiftSelectedUserId(e.target.value)}>
                                     <option value="">Seleccionar Usuario...</option>
                                     {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                 </select>
                             </div>
                             <div>
                                 <label className="text-xs font-bold text-slate-500 block mb-1">Mes</label>
                                 <div className="flex items-center border rounded">
                                     <button onClick={() => setShiftCurrentDate(new Date(shiftCurrentDate.getFullYear(), shiftCurrentDate.getMonth()-1, 1))} className="p-2 hover:bg-slate-100"><ChevronLeft size={16}/></button>
                                     <span className="px-4 text-sm font-medium w-32 text-center capitalize">{shiftCurrentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</span>
                                     <button onClick={() => setShiftCurrentDate(new Date(shiftCurrentDate.getFullYear(), shiftCurrentDate.getMonth()+1, 1))} className="p-2 hover:bg-slate-100"><ChevronRight size={16}/></button>
                                 </div>
                             </div>
                         </div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <label className="text-xs font-bold text-slate-500 block mb-2">Herramienta</label>
                        <div className="flex flex-wrap gap-2 max-w-md">
                            {shiftTypes.map(t => (
                                <button key={t.id} onClick={() => setPaintTool(t.id)} className={`w-8 h-8 rounded flex items-center justify-center transition-all ring-2 ring-offset-1 ${paintTool === t.id ? 'ring-slate-800 scale-110' : 'ring-transparent opacity-80 hover:opacity-100'} ${t.color}`} title={t.name}><span className="text-[10px] font-bold">{t.name.substring(0,1)}</span></button>
                            ))}
                            <button onClick={() => setPaintTool('ERASE')} className={`w-8 h-8 rounded flex items-center justify-center transition-all ring-2 ring-offset-1 bg-white border border-slate-300 text-red-500 ${paintTool === 'ERASE' ? 'ring-red-500 scale-110' : 'ring-transparent'}`} title="Borrar"><Eraser size={16} /></button>
                        </div>
                    </div>
               </div>
               <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden select-none">
                    <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
                        {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(day => (
                            <div key={day} className="py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">{day}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7">
                        {renderShiftCalendar()}
                    </div>
               </div>
           </div>
       )}
       
       {activeTab === 'comms' && (
           <div className="space-y-8">
               <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center"><Megaphone className="mr-2 text-rose-500" size={20} /> Mensaje Global</h3>
                    <form onSubmit={handleUpdateSystemMessage} className="space-y-4">
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="text-xs font-bold text-slate-500 block mb-1">Texto</label>
                                <input type="text" className="w-full border rounded p-2 text-sm" value={sysMsgForm.text} onChange={e => setSysMsgForm({...sysMsgForm, text: e.target.value})} />
                            </div>
                            <div className="w-48">
                                <label className="text-xs font-bold text-slate-500 block mb-1">Color</label>
                                <select className="w-full border rounded p-2 text-sm" value={sysMsgForm.color} onChange={e => setSysMsgForm({...sysMsgForm, color: e.target.value})}>
                                    <option value="bg-blue-100 text-blue-800 border-blue-200">Azul</option>
                                    <option value="bg-amber-100 text-amber-800 border-amber-200">Alerta</option>
                                    <option value="bg-red-100 text-red-800 border-red-200">Urgente</option>
                                    <option value="bg-slate-800 text-white border-slate-600">Oscuro</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                             <label className="flex items-center text-sm"><input type="checkbox" className="mr-2" checked={sysMsgForm.active} onChange={e => setSysMsgForm({...sysMsgForm, active: e.target.checked})} /> Activar</label>
                             <button type="submit" className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm">Actualizar</button>
                        </div>
                    </form>
               </div>
               
               {/* INTERNAL MESSAGING SYSTEM (NEW) */}
               <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                   <h3 className="font-bold text-slate-800 mb-4 flex items-center"><MessageSquare className="mr-2 text-emerald-600" size={20} /> Mensajería Interna</h3>
                   <form onSubmit={handleSendInternalMessage} className="space-y-4">
                       <div>
                           <label className="text-xs font-bold text-slate-500 block mb-1">Asunto</label>
                           <input required type="text" className="w-full border rounded p-2 text-sm" value={internalMsgForm.subject} onChange={e => setInternalMsgForm({...internalMsgForm, subject: e.target.value})} />
                       </div>
                       <div>
                           <label className="text-xs font-bold text-slate-500 block mb-1">Mensaje</label>
                           <textarea required className="w-full border rounded p-2 text-sm h-24" value={internalMsgForm.body} onChange={e => setInternalMsgForm({...internalMsgForm, body: e.target.value})}></textarea>
                       </div>
                       <div>
                           <label className="text-xs font-bold text-slate-500 block mb-2">Destinatarios</label>
                           <div className="flex items-center gap-4 mb-2">
                               <label className="flex items-center text-sm font-medium"><input type="radio" className="mr-2" name="target" checked={internalMsgForm.target === 'ALL'} onChange={() => setInternalMsgForm({...internalMsgForm, target: 'ALL'})} /> Todos los empleados</label>
                               <label className="flex items-center text-sm font-medium"><input type="radio" className="mr-2" name="target" checked={internalMsgForm.target === 'SELECT'} onChange={() => setInternalMsgForm({...internalMsgForm, target: 'SELECT'})} /> Selección manual</label>
                           </div>
                           
                           {internalMsgForm.target === 'SELECT' && (
                               <div className="border rounded-lg p-2 max-h-40 overflow-y-auto grid grid-cols-2 md:grid-cols-3 gap-2 bg-slate-50">
                                   {users.map(u => (
                                       <label key={u.id} className="flex items-center text-xs p-1 hover:bg-slate-100 rounded cursor-pointer">
                                           <input type="checkbox" className="mr-2" 
                                               checked={internalMsgForm.selectedUserIds.includes(u.id)}
                                               onChange={e => {
                                                   if (e.target.checked) setInternalMsgForm({...internalMsgForm, selectedUserIds: [...internalMsgForm.selectedUserIds, u.id]});
                                                   else setInternalMsgForm({...internalMsgForm, selectedUserIds: internalMsgForm.selectedUserIds.filter(id => id !== u.id)});
                                               }}
                                           />
                                           {u.name}
                                       </label>
                                   ))}
                               </div>
                           )}
                       </div>
                       <div className="flex justify-end">
                           <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg text-sm font-bold flex items-center">
                               <Send size={16} className="mr-2" /> Enviar Mensaje
                           </button>
                       </div>
                   </form>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center"><Server className="mr-2 text-blue-600" size={20} /> Configuración SMTP</h3>
                        <form onSubmit={handleSaveSmtpConfig} className="space-y-3">
                            <div><label className="text-xs font-bold text-slate-500">Host</label><input className="w-full border rounded p-2 text-sm" value={smtpConfigForm.host} onChange={e => setSmtpConfigForm({...smtpConfigForm, host: e.target.value})} /></div>
                            <div className="flex gap-2">
                                <div className="flex-1"><label className="text-xs font-bold text-slate-500">Port</label><input className="w-full border rounded p-2 text-sm" value={smtpConfigForm.port} onChange={e => setSmtpConfigForm({...smtpConfigForm, port: e.target.value})} /></div>
                                <div className="flex items-end pb-2"><label className="text-xs flex items-center"><input type="checkbox" className="mr-1" checked={smtpConfigForm.secure} onChange={e => setSmtpConfigForm({...smtpConfigForm, secure: e.target.checked})} /> SSL</label></div>
                            </div>
                            <div><label className="text-xs font-bold text-slate-500">User</label><input className="w-full border rounded p-2 text-sm" value={smtpConfigForm.user} onChange={e => setSmtpConfigForm({...smtpConfigForm, user: e.target.value})} /></div>
                            <div><label className="text-xs font-bold text-slate-500">Pass</label><input type="password" className="w-full border rounded p-2 text-sm" value={smtpConfigForm.pass} onChange={e => setSmtpConfigForm({...smtpConfigForm, pass: e.target.value})} /></div>
                            <button type="submit" className="w-full bg-slate-100 text-slate-700 py-2 rounded-lg text-sm hover:bg-slate-200">Guardar</button>
                        </form>
                        <div className="mt-4 pt-4 border-t border-slate-100">
                             <h4 className="text-xs font-bold text-slate-700 mb-2">Probar SMTP</h4>
                             <div className="flex gap-2">
                                 <input className="flex-1 border rounded p-2 text-sm" placeholder="email@test.com" value={testEmailAddress} onChange={e => setTestEmailAddress(e.target.value)} />
                                 <button onClick={() => sendTestEmail(testEmailAddress)} className="bg-slate-800 text-white px-3 py-2 rounded-lg text-sm hover:bg-slate-700"><Send size={16}/></button>
                             </div>
                        </div>
                   </div>
                   <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center"><Mail className="mr-2 text-orange-500" size={20} /> Configuración EmailJS</h3>
                        <form onSubmit={handleSaveEmailConfig} className="space-y-3">
                            <div><label className="text-xs font-bold text-slate-500">Service ID</label><input className="w-full border rounded p-2 text-sm" value={emailConfigForm.serviceId} onChange={e => setEmailConfigForm({...emailConfigForm, serviceId: e.target.value})} /></div>
                            <div><label className="text-xs font-bold text-slate-500">Template ID</label><input className="w-full border rounded p-2 text-sm" value={emailConfigForm.templateId} onChange={e => setEmailConfigForm({...emailConfigForm, templateId: e.target.value})} /></div>
                            <div><label className="text-xs font-bold text-slate-500">Public Key</label><input className="w-full border rounded p-2 text-sm" value={emailConfigForm.publicKey} onChange={e => setEmailConfigForm({...emailConfigForm, publicKey: e.target.value})} /></div>
                            <button type="submit" className="w-full bg-slate-100 text-slate-700 py-2 rounded-lg text-sm hover:bg-slate-200">Guardar</button>
                        </form>
                   </div>
               </div>
               
               <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                   <h3 className="font-bold text-slate-800 mb-4">Plantillas de Correo</h3>
                   <div className="grid grid-cols-3 gap-4">
                       {emailTemplates.map(tpl => (
                           <div key={tpl.id} className="border p-4 rounded-xl cursor-pointer hover:border-primary" onClick={() => setEditingTemplate(tpl)}>
                               <span className="text-xs bg-slate-100 px-2 py-1 rounded font-bold">{tpl.eventType}</span>
                               <p className="font-bold text-sm mt-2">{tpl.name}</p>
                           </div>
                       ))}
                   </div>
               </div>
           </div>
       )}

       {/* USER DETAIL MODAL (Admin View) */}
       {selectedUser && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                 <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                           <div className="flex items-center gap-4">
                               <img src={selectedUser.avatarUrl} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
                               <div>
                                   <h3 className="font-bold text-lg text-slate-800">{selectedUser.name}</h3>
                                   <p className="text-sm text-slate-500">{selectedUser.email}</p>
                               </div>
                           </div>
                           <button onClick={() => setSelectedUser(null)}><X className="text-slate-400 hover:text-slate-600" /></button>
                      </div>
                      
                      <div className="flex border-b border-slate-200">
                           <button onClick={() => setActiveUserTab('info')} className={`px-6 py-3 text-sm font-medium ${activeUserTab === 'info' ? 'border-b-2 border-slate-800 text-slate-800' : 'text-slate-500 hover:bg-slate-50'}`}>Información</button>
                           <button onClick={() => setActiveUserTab('absences')} className={`px-6 py-3 text-sm font-medium ${activeUserTab === 'absences' ? 'border-b-2 border-slate-800 text-slate-800' : 'text-slate-500 hover:bg-slate-50'}`}>Ausencias</button>
                           <button onClick={() => setActiveUserTab('overtime')} className={`px-6 py-3 text-sm font-medium ${activeUserTab === 'overtime' ? 'border-b-2 border-slate-800 text-slate-800' : 'text-slate-500 hover:bg-slate-50'}`}>Bolsa Horas</button>
                           <button onClick={() => setActiveUserTab('adjustments')} className={`px-6 py-3 text-sm font-medium ${activeUserTab === 'adjustments' ? 'border-b-2 border-slate-800 text-slate-800' : 'text-slate-500 hover:bg-slate-50'}`}>Ajustes</button>
                      </div>

                      <div className="p-6 overflow-y-auto bg-slate-50/50 flex-1">
                           {activeUserTab === 'info' && (
                               <div className="space-y-6">
                                   <div className="grid grid-cols-2 gap-6">
                                       <div><label className="text-xs font-bold text-slate-500">Nombre</label><input className="w-full border rounded p-2 bg-white" value={selectedUser.name} onChange={e => updateUser(selectedUser.id, { name: e.target.value })} /></div>
                                       <div><label className="text-xs font-bold text-slate-500">Email</label><input className="w-full border rounded p-2 bg-white" value={selectedUser.email} onChange={e => updateUser(selectedUser.id, { email: e.target.value })} /></div>
                                       <div><label className="text-xs font-bold text-slate-500">Rol</label>
                                           <select className="w-full border rounded p-2 bg-white" value={selectedUser.role} onChange={e => updateUser(selectedUser.id, { role: e.target.value as Role })}>
                                                <option value={Role.WORKER}>Trabajador</option>
                                                <option value={Role.SUPERVISOR}>Supervisor</option>
                                                <option value={Role.ADMIN}>Administrador</option>
                                           </select>
                                       </div>
                                       <div><label className="text-xs font-bold text-slate-500">Departamento</label>
                                           <select className="w-full border rounded p-2 bg-white" value={selectedUser.departmentId || ''} onChange={e => updateUser(selectedUser.id, { departmentId: e.target.value })}>
                                                <option value="">Sin Departamento</option>
                                                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                           </select>
                                       </div>
                                       <div>
                                           <label className="text-xs font-bold text-slate-500">Color Calendario</label>
                                           <input type="color" className="w-full h-10 border rounded bg-white cursor-pointer" value={selectedUser.calendarColor || '#3b82f6'} onChange={e => updateUser(selectedUser.id, { calendarColor: e.target.value })} />
                                       </div>
                                   </div>
                                   <div className="bg-white p-4 rounded-xl border border-slate-200">
                                       <h4 className="font-bold text-slate-800 mb-3 flex items-center"><Key size={16} className="mr-2"/> Seguridad</h4>
                                       <div className="flex gap-4">
                                           <input type="password" placeholder="Nueva contraseña" className="flex-1 border rounded p-2" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                                           <button onClick={handleUpdatePassword} disabled={!newPassword} className="bg-slate-800 text-white px-4 py-2 rounded text-sm disabled:opacity-50">Actualizar</button>
                                       </div>
                                   </div>
                               </div>
                           )}

                           {activeUserTab === 'absences' && (
                               <div className="space-y-4">
                                   <div className="flex justify-end">
                                       <button onClick={() => setShowAdminAbsenceModal(true)} className="flex items-center px-3 py-1.5 bg-primary text-white text-xs rounded-lg hover:bg-primary/90 transition-colors">
                                           <Plus size={14} className="mr-1" /> Nueva Ausencia
                                       </button>
                                   </div>
                                   <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                       <table className="w-full text-sm">
                                           <thead className="bg-slate-50 text-slate-500 text-left">
                                               <tr><th className="p-3 pl-4">Tipo</th><th className="p-3">Fechas</th><th className="p-3">Estado</th><th className="p-3 text-right">Acción</th></tr>
                                           </thead>
                                           <tbody className="divide-y divide-slate-100">
                                               {requests.filter(r => r.userId === selectedUser.id).map(r => (
                                                   <tr key={r.id}>
                                                       <td className="p-3 pl-4">{absenceTypes.find(t => t.id === r.typeId)?.name}</td>
                                                       <td className="p-3 text-slate-500">{new Date(r.startDate).toLocaleDateString()} - {new Date(r.endDate).toLocaleDateString()}</td>
                                                       <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs ${r.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{r.status}</span></td>
                                                       <td className="p-3 text-right"><button onClick={() => handleDeleteRequestClick(r.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button></td>
                                                   </tr>
                                               ))}
                                           </tbody>
                                       </table>
                                   </div>
                               </div>
                           )}

                           {activeUserTab === 'overtime' && (
                               <div className="space-y-4">
                                   <div className="flex justify-end space-x-2">
                                       <button onClick={() => setShowAdminOvertimeModal(true)} className="flex items-center px-3 py-1.5 bg-white border border-slate-300 text-slate-700 text-xs rounded-lg hover:bg-slate-50 transition-colors">
                                           <Plus size={14} className="mr-1" /> Registrar Horas
                                       </button>
                                       <button onClick={() => setShowAdminRedeemModal(true)} className="flex items-center px-3 py-1.5 bg-slate-800 text-white text-xs rounded-lg hover:bg-slate-700 transition-colors">
                                           Canjear Horas
                                       </button>
                                   </div>
                                   <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                       <table className="w-full text-sm">
                                           <thead className="bg-slate-50 text-slate-500 text-left">
                                               <tr><th className="p-3 pl-4">Fecha</th><th className="p-3">Horas</th><th className="p-3">Descripción</th><th className="p-3">Estado</th><th className="p-3 text-right">Acción</th></tr>
                                           </thead>
                                           <tbody className="divide-y divide-slate-100">
                                               {overtime.filter(o => o.userId === selectedUser.id).map(o => (
                                                   <tr key={o.id}>
                                                       <td className="p-3 pl-4">{new Date(o.date).toLocaleDateString()}</td>
                                                       <td className={`p-3 font-bold ${o.hours > 0 ? 'text-green-600' : 'text-slate-600'}`}>{o.hours}h</td>
                                                       <td className="p-3 text-slate-500 truncate max-w-[150px]">{o.description}</td>
                                                       <td className="p-3">
                                                           <span className={`px-2 py-0.5 rounded text-xs ${o.status === 'APPROVED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{o.status}</span>
                                                           {o.hours < 0 && o.status === RequestStatus.APPROVED && (
                                                                <button onClick={() => setSelectedRedemption(o)} className="ml-2 text-xs text-purple-600 underline"><FileText size={12}/></button>
                                                           )}
                                                       </td>
                                                       <td className="p-3 text-right"><button onClick={() => handleDeleteOvertimeClick(o.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button></td>
                                                   </tr>
                                               ))}
                                           </tbody>
                                       </table>
                                   </div>
                               </div>
                           )}
                           
                           {activeUserTab === 'adjustments' && (
                               <div className="space-y-6">
                                   <div className="bg-white p-4 rounded-xl border border-slate-200">
                                       <h4 className="font-bold text-slate-800 mb-4 flex items-center"><Calendar className="mr-2 text-primary" size={18}/> Ajuste de Vacaciones</h4>
                                       <div className="flex gap-4 mb-4">
                                           <div className="w-24"><label className="text-xs font-bold text-slate-500">Días</label><input type="number" className="w-full border rounded p-2" value={adjustDays} onChange={e => setAdjustDays(Number(e.target.value))} /></div>
                                           <div className="flex-1"><label className="text-xs font-bold text-slate-500">Motivo</label><input type="text" className="w-full border rounded p-2" value={adjustReasonDays} onChange={e => setAdjustReasonDays(e.target.value)} placeholder="Ej: Error sistema anterior" /></div>
                                       </div>
                                       <button onClick={handleAdjustDays} disabled={adjustDays === 0} className="bg-primary text-white px-4 py-2 rounded text-sm disabled:opacity-50">Aplicar Ajuste</button>
                                       <div className="mt-4 pt-4 border-t border-slate-100">
                                           <p className="text-xs font-bold text-slate-500 mb-2">Historial</p>
                                           <div className="bg-slate-50 rounded p-2 max-h-32 overflow-y-auto text-xs space-y-1">
                                                {selectedUser.vacationHistory?.map(h => (
                                                    <div key={h.id} className="flex justify-between text-slate-600"><span>{new Date(h.date).toLocaleDateString()}: {h.days > 0 ? '+' : ''}{h.days} días</span><span className="opacity-70">{h.reason}</span></div>
                                                ))}
                                           </div>
                                       </div>
                                   </div>
                                   <div className="bg-white p-4 rounded-xl border border-slate-200">
                                       <h4 className="font-bold text-slate-800 mb-4 flex items-center"><Clock className="mr-2 text-primary" size={18}/> Ajuste Bolsa de Horas</h4>
                                       <div className="flex gap-4 mb-4">
                                           <div className="w-24"><label className="text-xs font-bold text-slate-500">Horas</label><input type="number" className="w-full border rounded p-2" value={adjustHours} onChange={e => setAdjustHours(Number(e.target.value))} /></div>
                                           <div className="flex-1"><label className="text-xs font-bold text-slate-500">Motivo</label><input type="text" className="w-full border rounded p-2" value={adjustReasonHours} onChange={e => setAdjustReasonHours(e.target.value)} placeholder="Ej: Saldo migrado" /></div>
                                       </div>
                                       <button onClick={handleAdjustHours} disabled={adjustHours === 0} className="bg-primary text-white px-4 py-2 rounded text-sm disabled:opacity-50">Crear Registro</button>
                                   </div>
                               </div>
                           )}
                      </div>
                 </div>
            </div>
       )}

       {/* ADMIN CREATION MODALS */}
       
       {/* Admin Absence Modal */}
       {showAdminAbsenceModal && (
           <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
               <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
                   <div className="flex justify-between items-center mb-4">
                       <h3 className="font-bold text-lg text-slate-800">Nueva Ausencia (Admin)</h3>
                       <button onClick={() => setShowAdminAbsenceModal(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
                   </div>
                   <form onSubmit={handleAdminCreateAbsence} className="space-y-4">
                       <div>
                           <label className="block text-xs font-bold text-slate-500 mb-1">Tipo</label>
                           <select required className="w-full border rounded p-2 text-sm" value={adminAbsenceForm.typeId} onChange={e => setAdminAbsenceForm({...adminAbsenceForm, typeId: e.target.value})}>
                               <option value="">Seleccionar...</option>
                               {absenceTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                           </select>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                           <div>
                               <label className="block text-xs font-bold text-slate-500 mb-1">Inicio</label>
                               <input type="date" required className="w-full border rounded p-2 text-sm" value={adminAbsenceForm.startDate} onChange={e => setAdminAbsenceForm({...adminAbsenceForm, startDate: e.target.value})} />
                           </div>
                           <div>
                               <label className="block text-xs font-bold text-slate-500 mb-1">Fin</label>
                               <input type="date" required className="w-full border rounded p-2 text-sm" value={adminAbsenceForm.endDate} onChange={e => setAdminAbsenceForm({...adminAbsenceForm, endDate: e.target.value})} />
                           </div>
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-slate-500 mb-1">Comentario</label>
                           <textarea className="w-full border rounded p-2 text-sm" rows={2} value={adminAbsenceForm.comment} onChange={e => setAdminAbsenceForm({...adminAbsenceForm, comment: e.target.value})}></textarea>
                       </div>
                       <div className="bg-blue-50 text-blue-700 text-xs p-2 rounded">
                           ⚠️ Se creará como APROBADA y se notificará al usuario.
                       </div>
                       <button type="submit" className="w-full bg-primary text-white py-2 rounded-lg font-bold">Crear Ausencia</button>
                   </form>
               </div>
           </div>
       )}

       {/* Admin Overtime Modal */}
       {showAdminOvertimeModal && (
           <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
               <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
                   <div className="flex justify-between items-center mb-4">
                       <h3 className="font-bold text-lg text-slate-800">Registrar Horas (Admin)</h3>
                       <button onClick={() => setShowAdminOvertimeModal(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
                   </div>
                   <form onSubmit={handleAdminCreateOvertime} className="space-y-4">
                       <div>
                           <label className="block text-xs font-bold text-slate-500 mb-1">Fecha</label>
                           <input type="date" required className="w-full border rounded p-2 text-sm" value={adminOvertimeForm.date} onChange={e => setAdminOvertimeForm({...adminOvertimeForm, date: e.target.value})} />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-slate-500 mb-1">Horas</label>
                           <input type="number" step="0.5" required className="w-full border rounded p-2 text-sm" value={adminOvertimeForm.hours} onChange={e => setAdminOvertimeForm({...adminOvertimeForm, hours: Number(e.target.value)})} />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-slate-500 mb-1">Descripción</label>
                           <textarea className="w-full border rounded p-2 text-sm" rows={2} value={adminOvertimeForm.description} onChange={e => setAdminOvertimeForm({...adminOvertimeForm, description: e.target.value})}></textarea>
                       </div>
                       <button type="submit" className="w-full bg-primary text-white py-2 rounded-lg font-bold">Registrar</button>
                   </form>
               </div>
           </div>
       )}

       {/* Admin Redeem Modal */}
       {showAdminRedeemModal && selectedUser && (
           <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
               <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
                   <div className="flex justify-between items-center mb-4">
                       <h3 className="font-bold text-lg text-slate-800">Canjear Horas (Admin)</h3>
                       <button onClick={() => setShowAdminRedeemModal(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
                   </div>
                   <form onSubmit={handleAdminRedeemOvertime} className="space-y-4">
                       <div className="max-h-40 overflow-y-auto border rounded p-2 text-xs space-y-1">
                           <p className="font-bold text-slate-500 mb-1">Seleccionar Origen:</p>
                           {overtime.filter(o => o.userId === selectedUser.id && o.hours > 0 && o.consumed < o.hours && o.status === RequestStatus.APPROVED).map(o => (
                               <label key={o.id} className="flex items-center space-x-2 p-1 hover:bg-slate-50">
                                   <input type="checkbox" checked={adminRedeemForm.selectedIds.includes(o.id)} 
                                       onChange={e => {
                                           if (e.target.checked) setAdminRedeemForm({...adminRedeemForm, selectedIds: [...adminRedeemForm.selectedIds, o.id]});
                                           else setAdminRedeemForm({...adminRedeemForm, selectedIds: adminRedeemForm.selectedIds.filter(id => id !== o.id)});
                                       }} 
                                   />
                                   <span>{new Date(o.date).toLocaleDateString()} - {o.hours - o.consumed}h disp. ({o.description})</span>
                               </label>
                           ))}
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-slate-500 mb-1">Horas a Canjear</label>
                           <input type="number" step="0.5" required className="w-full border rounded p-2 text-sm" value={adminRedeemForm.hours} onChange={e => setAdminRedeemForm({...adminRedeemForm, hours: Number(e.target.value)})} />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-slate-500 mb-1">Tipo</label>
                           <select className="w-full border rounded p-2 text-sm" value={adminRedeemForm.type} onChange={e => setAdminRedeemForm({...adminRedeemForm, type: e.target.value as RedemptionType})}>
                               <option value={RedemptionType.TIME_OFF}>Horas Libres</option>
                               <option value={RedemptionType.DAYS_EXCHANGE}>Días Libres</option>
                               <option value={RedemptionType.PAYROLL}>Abono en Nómina</option>
                           </select>
                       </div>
                       <button type="submit" disabled={adminRedeemForm.hours <= 0 || adminRedeemForm.selectedIds.length === 0} className="w-full bg-slate-800 text-white py-2 rounded-lg font-bold disabled:opacity-50">Procesar Canje</button>
                   </form>
               </div>
           </div>
       )}

      {/* CONFIRMATION MODAL */}
      {confirmModal && (
          <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-xl p-6 max-w-sm w-full">
                  <div className="flex items-center text-red-600 mb-4">
                      <AlertCircle className="mr-2" />
                      <h3 className="font-bold text-lg">{confirmModal.title}</h3>
                  </div>
                  <p className="text-slate-600 text-sm mb-6">{confirmModal.message}</p>
                  <div className="flex justify-end space-x-3">
                      <button onClick={() => setConfirmModal(null)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg font-medium text-sm">Cancelar</button>
                      <button onClick={confirmModal.onConfirm} className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg font-medium text-sm">Confirmar</button>
                  </div>
              </div>
          </div>
      )}

      {/* REDEMPTION DETAIL MODAL (ADMIN VIEW) - A4 PRINT OPTIMIZED */}
      {selectedRedemption && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            {/* Added 'print-area' class for isolation */}
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col print-area">
                {/* Header with Close Button - Hidden on Print */}
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

                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-100 mb-8 print:bg-white print:border-none print:p-0">
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
                    <table className="w-full text-sm mb-8 print:w-full">
                        <thead>
                            <tr className="text-slate-500 text-xs uppercase text-left bg-slate-50 print:bg-white print:border-b-2 print:border-black">
                                <th className="py-3 pl-3 rounded-l-lg print:rounded-none">Fecha Origen</th>
                                <th className="py-3">Motivo</th>
                                <th className="py-3 text-center">Generadas</th>
                                <th className="py-3 text-right pr-3 rounded-r-lg print:rounded-none">Saldo Restante</th>
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
                                        <td className="py-3 text-slate-600 print:whitespace-normal print:overflow-visible print:text-black">{original.description}</td>
                                        <td className="py-3 text-center font-bold text-emerald-600 print:text-black">+{original.hours}h</td>
                                        <td className="py-3 text-right pr-3">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${remaining === 0 ? 'bg-slate-100 text-slate-400 print:bg-transparent print:text-black' : 'bg-blue-100 text-blue-700 print:bg-transparent print:text-black'}`}>
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

      {/* EDIT TEMPLATE MODAL */}
      {editingTemplate && (
          <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
              <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                  <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h3 className="font-bold text-lg text-slate-800">Editar Plantilla: {editingTemplate.name}</h3>
                      <button onClick={() => setEditingTemplate(null)}><X className="text-slate-400 hover:text-slate-600" /></button>
                  </div>
                  <form onSubmit={handleUpdateTemplate} className="p-6 overflow-y-auto space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Nombre (Interno)</label>
                          <input required className="w-full border rounded p-2 text-sm" value={editingTemplate.name} onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})} />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Asunto</label>
                          <input required className="w-full border rounded p-2 text-sm" value={editingTemplate.subject} onChange={e => setEditingTemplate({...editingTemplate, subject: e.target.value})} />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Cuerpo del Mensaje</label>
                          <div className="bg-blue-50 text-blue-700 text-xs p-2 rounded mb-2">
                              Variables: {`{{name}}, {{startDate}}, {{endDate}}, {{days}}, {{hours}}, {{date}}, {{description}}, {{comment}}, {{type}}, {{details}}`}
                          </div>
                          <textarea required className="w-full border rounded p-2 text-sm h-40 font-mono" value={editingTemplate.body} onChange={e => setEditingTemplate({...editingTemplate, body: e.target.value})}></textarea>
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-2">Destinatarios</label>
                          <div className="flex gap-4">
                              <label className="flex items-center text-sm"><input type="checkbox" className="mr-2" checked={editingTemplate.recipients.includes(Role.WORKER)} onChange={() => toggleRecipient(Role.WORKER)} /> Trabajador</label>
                              <label className="flex items-center text-sm"><input type="checkbox" className="mr-2" checked={editingTemplate.recipients.includes(Role.SUPERVISOR)} onChange={() => toggleRecipient(Role.SUPERVISOR)} /> Supervisor</label>
                              <label className="flex items-center text-sm"><input type="checkbox" className="mr-2" checked={editingTemplate.recipients.includes(Role.ADMIN)} onChange={() => toggleRecipient(Role.ADMIN)} /> Admin</label>
                          </div>
                      </div>
                      <div className="pt-2 border-t flex justify-end">
                          <button type="submit" className="bg-slate-800 text-white px-6 py-2 rounded-lg font-bold">Guardar Cambios</button>
                      </div>
                  </form>
              </div>
          </div>
      )}

       {/* Create User Modal */}
       {showCreateUserModal && (
           <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
               <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
                   <div className="flex justify-between items-center mb-4">
                       <h3 className="font-bold text-lg text-slate-800">Nuevo Usuario</h3>
                       <button onClick={() => setShowCreateUserModal(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
                   </div>
                   <form onSubmit={handleCreateUser} className="space-y-4">
                       <div>
                           <label className="block text-xs font-bold text-slate-500 mb-1">Nombre</label>
                           <input required type="text" className="w-full border rounded p-2 text-sm" value={newUserForm.name} onChange={e => setNewUserForm({...newUserForm, name: e.target.value})} placeholder="Nombre Apellido" />
                       </div>
                       <div>
                           <label className="block text-xs font-bold text-slate-500 mb-1">Email</label>
                           <input required type="email" className="w-full border rounded p-2 text-sm" value={newUserForm.email} onChange={e => setNewUserForm({...newUserForm, email: e.target.value})} placeholder="usuario@empresa.com" />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                           <div>
                               <label className="block text-xs font-bold text-slate-500 mb-1">Rol</label>
                               <select className="w-full border rounded p-2 text-sm" value={newUserForm.role} onChange={e => setNewUserForm({...newUserForm, role: e.target.value as Role})}>
                                   <option value={Role.WORKER}>Trabajador</option>
                                   <option value={Role.SUPERVISOR}>Supervisor</option>
                                   <option value={Role.ADMIN}>Administrador</option>
                               </select>
                           </div>
                           <div>
                               <label className="block text-xs font-bold text-slate-500 mb-1">Departamento</label>
                               <select className="w-full border rounded p-2 text-sm" value={newUserForm.departmentId} onChange={e => setNewUserForm({...newUserForm, departmentId: e.target.value})}>
                                   <option value="">Seleccionar...</option>
                                   {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                               </select>
                           </div>
                       </div>
                       
                       <div className="pt-2 border-t border-slate-100">
                           <p className="text-xs font-bold text-slate-800 mb-2">Saldos Iniciales (Opcional)</p>
                           <div className="grid grid-cols-2 gap-4">
                               <div>
                                   <label className="block text-xs text-slate-500 mb-1">Vacaciones (Días)</label>
                                   <input type="number" className="w-full border rounded p-2 text-sm" value={newUserForm.initialVacation} onChange={e => setNewUserForm({...newUserForm, initialVacation: Number(e.target.value)})} placeholder="0" />
                               </div>
                               <div>
                                   <label className="block text-xs text-slate-500 mb-1">Horas Extra (Saldo)</label>
                                   <input type="number" className="w-full border rounded p-2 text-sm" value={newUserForm.initialOvertime} onChange={e => setNewUserForm({...newUserForm, initialOvertime: Number(e.target.value)})} placeholder="0" />
                               </div>
                           </div>
                       </div>

                       <div>
                           <label className="block text-xs font-bold text-slate-500 mb-1">Color Calendario</label>
                           <div className="flex gap-2 items-center">
                               <input type="color" className="w-8 h-8 rounded cursor-pointer border-0 p-0" value={newUserForm.calendarColor} onChange={e => setNewUserForm({...newUserForm, calendarColor: e.target.value})} />
                               <span className="text-xs text-slate-400">Color distintivo para turnos</span>
                           </div>
                       </div>

                       <button type="submit" className="w-full bg-primary text-white py-2 rounded-lg font-bold hover:bg-primary/90">Crear Usuario</button>
                   </form>
               </div>
           </div>
       )}
    </div>
  );
};

export default AdminPanel;