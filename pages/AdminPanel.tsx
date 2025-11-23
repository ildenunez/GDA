
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Settings, Calendar, Briefcase, Plus, User as UserIcon, Trash2, Edit2, Search, X, Check, Eye, Printer, Download, Upload, Database, Mail, Save, AlertCircle, Key, Server } from 'lucide-react';
import { Role, RequestStatus, AbsenceType, Department, User, OvertimeRecord, RedemptionType, EmailTemplate } from '../types';

const AdminPanel = () => {
  const { 
      absenceTypes, createAbsenceType, deleteAbsenceType, updateAbsenceType,
      departments, addDepartment, updateDepartment, deleteDepartment,
      users, updateUser, adjustUserVacation, addUser, requests, deleteRequest, overtime, addOvertime, deleteOvertime,
      notifications, importDatabase, emailTemplates, updateEmailTemplate, saveEmailConfig, emailConfig, saveSmtpConfig, smtpConfig
  } = useData();
  
  const [activeTab, setActiveTab] = useState<'config' | 'users' | 'comms'>('config');

  // --- CONFIG TAB STATES ---
  const [newType, setNewType] = useState({ name: '', isClosedRange: false, color: 'bg-gray-100 text-gray-800', rangeStart: '', rangeEnd: '', deductsDays: false });
  const [newDept, setNewDept] = useState({ name: '', supervisorIds: [] as string[] });
  
  // Edit States
  const [editingType, setEditingType] = useState<AbsenceType | null>(null);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  // --- COMM TAB STATES ---
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [emailConfigForm, setEmailConfigForm] = useState(emailConfig);
  const [smtpConfigForm, setSmtpConfigForm] = useState(smtpConfig);

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
      initialVacation: 0, initialOvertime: 0 
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
      // Department logic: Required if not Admin.
      if (newUserForm.role !== Role.ADMIN && !newUserForm.departmentId) {
          alert("El departamento es obligatorio para Trabajadores y Supervisores.");
          return;
      }

      addUser(
          { 
            name: newUserForm.name, 
            email: newUserForm.email, 
            role: newUserForm.role, 
            departmentId: newUserForm.departmentId 
          }, 
          Number(newUserForm.initialVacation), 
          Number(newUserForm.initialOvertime)
      );
      
      setShowCreateUserModal(false);
      setNewUserForm({ name: '', email: '', role: Role.WORKER, departmentId: '', initialVacation: 0, initialOvertime: 0 });
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
          
          // Refresh local selectedUser data by finding it in global users list
          const updatedUser = users.find(u => u.id === selectedUser.id);
          if (updatedUser) {
              // We manually update the local state because users array is updated in context but selectedUser is local
               const currentAdj = selectedUser.vacationAdjustment || 0;
               setSelectedUser({ ...selectedUser, vacationAdjustment: currentAdj + Number(adjustDays) });
          }
      }
  };

  const handleAdjustHours = () => {
      if (selectedUser && adjustHours !== 0) {
          const reason = adjustReasonHours.trim() || 'Regularización Administrativa';
          // Create an overtime record
          addOvertime({
              userId: selectedUser.id,
              date: new Date().toISOString(),
              hours: Number(adjustHours),
              description: reason,
              status: RequestStatus.APPROVED // This will trigger the auto-approve logic in context
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

  // Helper for translating redemption type
  const getRedemptionLabel = (type?: RedemptionType) => {
    switch(type) {
        case RedemptionType.PAYROLL: return 'Abono en Nómina';
        case RedemptionType.DAYS_EXCHANGE: return 'Canje por Días';
        case RedemptionType.TIME_OFF: return 'Horas Libres';
        default: return 'Canje';
    }
  };

  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.includes(searchTerm.toLowerCase()));

  // Helpers for user stats
  const getUserOvertimeBalance = (userId: string) => {
      const recs = overtime.filter(o => o.userId === userId && o.status === RequestStatus.APPROVED);
      const generated = recs.filter(o => o.hours > 0).reduce((acc, curr) => acc + curr.hours, 0);
      const consumed = recs.filter(o => o.hours > 0).reduce((acc, curr) => acc + curr.consumed, 0);
      return generated - consumed;
  };

  const getUserVacationBalance = (userId: string, currentAdjustment: number) => {
      const totalAllowance = 22 + (currentAdjustment || 0);
      
      const vacationTypeIds = absenceTypes
        .filter(t => t.deductsDays === true || (t.deductsDays === undefined && t.name.toLowerCase().includes('vacacion'))) // ROBUST FALLBACK
        .map(t => t.id);
      
      const usedDays = requests
        .filter(r => r.userId === userId && r.status === RequestStatus.APPROVED && vacationTypeIds.includes(r.typeId))
        .reduce((acc, req) => {
            // Robust Date Calculation
            const start = new Date(req.startDate);
            start.setHours(12, 0, 0, 0);
            
            const end = new Date(req.endDate);
            end.setHours(12, 0, 0, 0);
            
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
            return acc + days;
        }, 0);
        
      return totalAllowance - usedDays;
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Administración</h2>
                <p className="text-slate-500">Panel de control global.</p>
            </div>
            <div className="flex space-x-2 bg-white p-1 rounded-lg border border-slate-200">
                <button onClick={() => setActiveTab('config')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'config' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Configuración</button>
                <button onClick={() => setActiveTab('comms')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'comms' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Comunicaciones</button>
                <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>Usuarios</button>
            </div>
       </div>

       {activeTab === 'config' && (
           <div className="space-y-8">
               
               {/* DATABASE BACKUP SECTION */}
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
                  {/* ABSENCE TYPES */}
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
                                  <input 
                                    type="checkbox" 
                                    id="closedRange"
                                    checked={newType.isClosedRange}
                                    onChange={e => setNewType({...newType, isClosedRange: e.target.checked})}
                                  />
                                  <label htmlFor="closedRange" className="text-sm text-slate-600">Rango cerrado (Admin define)</label>
                              </div>
                              <div className="flex items-center space-x-2">
                                  <input 
                                    type="checkbox" 
                                    id="deductsDays"
                                    checked={newType.deductsDays}
                                    onChange={e => setNewType({...newType, deductsDays: e.target.checked})}
                                  />
                                  <label htmlFor="deductsDays" className="text-sm text-slate-600 font-medium text-red-500">¿Descuenta de vacaciones?</label>
                              </div>
                              {newType.isClosedRange && (
                                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg">
                                      <input type="date" className="text-xs border rounded p-1" required onChange={e => setNewType({...newType, rangeStart: e.target.value})} />
                                      <input type="date" className="text-xs border rounded p-1" required onChange={e => setNewType({...newType, rangeEnd: e.target.value})} />
                                  </div>
                              )}
                              <select 
                                 className="w-full rounded-lg border-slate-300 border p-2 text-sm"
                                 value={newType.color}
                                 onChange={e => setNewType({...newType, color: e.target.value})}
                              >
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

                  {/* DEPARTMENTS */}
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
                                      <div className="flex flex-wrap gap-1">
                                          {dept.supervisorIds.length === 0 ? (
                                              <span className="text-xs text-slate-400 italic">Sin supervisores</span>
                                          ) : (
                                              dept.supervisorIds.map(sid => {
                                                  const s = users.find(u => u.id === sid);
                                                  return (
                                                      <div key={sid} className="flex items-center text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                                                        <UserIcon size={10} className="mr-1" />
                                                        <span>{s?.name || 'Desconocido'}</span>
                                                      </div>
                                                  )
                                              })
                                          )}
                                      </div>
                                  </div>
                              );
                          })}
                      </div>

                      <div className="border-t border-slate-100 pt-4 mt-auto">
                           <h4 className="text-sm font-semibold text-slate-600 mb-3">Nuevo Departamento</h4>
                           <form onSubmit={handleCreateDept} className="space-y-3">
                                <input 
                                    type="text" 
                                    placeholder="Nombre del Departamento" 
                                    className="w-full rounded-lg border-slate-300 border p-2 text-sm"
                                    value={newDept.name}
                                    onChange={e => setNewDept({...newDept, name: e.target.value})}
                                    required
                                />
                                <div className="border rounded-lg p-2 max-h-32 overflow-y-auto">
                                    <p className="text-xs font-semibold text-slate-500 mb-2">Seleccionar Supervisores:</p>
                                    {users.filter(u => u.role === Role.SUPERVISOR || u.role === Role.ADMIN).map(u => (
                                        <label key={u.id} className="flex items-center space-x-2 text-sm py-1 hover:bg-slate-50 cursor-pointer">
                                            <input 
                                                type="checkbox"
                                                checked={newDept.supervisorIds.includes(u.id)}
                                                onChange={() => toggleSupervisorForNew(u.id)}
                                                className="rounded text-secondary focus:ring-secondary"
                                            />
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
               </div>
           </div>
       )}

       {activeTab === 'comms' && (
           <div className="space-y-6">
               <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                   <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                      <Mail className="mr-2 text-primary" size={20} /> Plantillas de Email
                   </h3>
                   <p className="text-sm text-slate-500 mb-6">Personaliza los mensajes automáticos que envía la plataforma y selecciona quién debe recibirlos.</p>

                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div className="col-span-1 border-r border-slate-100 pr-4 space-y-2">
                           {emailTemplates.map(t => (
                               <button 
                                  key={t.id}
                                  onClick={() => setEditingTemplate(t)}
                                  className={`w-full text-left p-3 rounded-lg text-sm transition-colors ${editingTemplate?.id === t.id ? 'bg-primary text-white shadow-md shadow-primary/30' : 'hover:bg-slate-50 text-slate-700'}`}
                               >
                                   <div className="font-bold mb-1">{t.name}</div>
                                   <div className={`text-xs ${editingTemplate?.id === t.id ? 'text-blue-200' : 'text-slate-400'}`}>Asunto: {t.subject}</div>
                               </button>
                           ))}
                       </div>
                       
                       <div className="col-span-2">
                           {editingTemplate ? (
                               <form onSubmit={handleUpdateTemplate} className="space-y-4">
                                   <div className="bg-slate-50 p-3 rounded-lg mb-4">
                                       <p className="text-xs font-bold text-slate-500 uppercase mb-2">Destinatarios</p>
                                       <div className="flex space-x-4">
                                           <label className="flex items-center space-x-2 text-sm cursor-pointer">
                                               <input type="checkbox" checked={editingTemplate.recipients.includes(Role.WORKER)} onChange={() => toggleRecipient(Role.WORKER)} className="rounded text-primary focus:ring-primary" />
                                               <span>Trabajador</span>
                                           </label>
                                           <label className="flex items-center space-x-2 text-sm cursor-pointer">
                                               <input type="checkbox" checked={editingTemplate.recipients.includes(Role.SUPERVISOR)} onChange={() => toggleRecipient(Role.SUPERVISOR)} className="rounded text-primary focus:ring-primary" />
                                               <span>Supervisor</span>
                                           </label>
                                           <label className="flex items-center space-x-2 text-sm cursor-pointer">
                                               <input type="checkbox" checked={editingTemplate.recipients.includes(Role.ADMIN)} onChange={() => toggleRecipient(Role.ADMIN)} className="rounded text-primary focus:ring-primary" />
                                               <span>Administrador</span>
                                           </label>
                                       </div>
                                   </div>

                                   <div>
                                       <label className="block text-sm font-medium text-slate-700 mb-1">Asunto</label>
                                       <input type="text" className="w-full border rounded-lg p-2 text-sm" 
                                          value={editingTemplate.subject} onChange={e => setEditingTemplate({...editingTemplate, subject: e.target.value})}
                                       />
                                   </div>
                                   
                                   <div>
                                       <label className="block text-sm font-medium text-slate-700 mb-1">Cuerpo del Mensaje</label>
                                       <p className="text-xs text-slate-400 mb-1">Variables disponibles: {`{{name}}`}</p>
                                       <textarea className="w-full border rounded-lg p-2 text-sm h-32" 
                                          value={editingTemplate.body} onChange={e => setEditingTemplate({...editingTemplate, body: e.target.value})}
                                       />
                                   </div>

                                   <div className="flex justify-end pt-2">
                                       <button type="submit" className="flex items-center bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90">
                                           <Save size={16} className="mr-2" /> Guardar Cambios
                                       </button>
                                   </div>
                               </form>
                           ) : (
                               <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
                                   Selecciona una plantilla para editar.
                               </div>
                           )}
                       </div>
                   </div>
               </div>
               
               {/* EMAILJS CONFIGURATION */}
               <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                      <Key className="mr-2 text-slate-500" size={20} /> Integración EmailJS (Frontend)
                  </h3>
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
                      <p className="text-sm text-blue-700">Para enviar correos directamente desde el navegador (sin servidor), regístrate gratis en <a href="https://www.emailjs.com/" target="_blank" className="underline font-bold">EmailJS.com</a> y copia tus credenciales aquí. <span className="font-bold">Este es el método activo actualmente.</span></p>
                  </div>
                  <form onSubmit={handleSaveEmailConfig} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <div>
                           <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Service ID</label>
                           <input type="text" className="w-full border rounded-lg p-2 text-sm" placeholder="ej. service_xyz123"
                              value={emailConfigForm.serviceId} onChange={e => setEmailConfigForm({...emailConfigForm, serviceId: e.target.value})}
                           />
                       </div>
                       <div>
                           <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Template ID</label>
                           <input type="text" className="w-full border rounded-lg p-2 text-sm" placeholder="ej. template_abc456"
                              value={emailConfigForm.templateId} onChange={e => setEmailConfigForm({...emailConfigForm, templateId: e.target.value})}
                           />
                       </div>
                       <div>
                           <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Public Key</label>
                           <input type="text" className="w-full border rounded-lg p-2 text-sm" placeholder="ej. user_12345"
                              value={emailConfigForm.publicKey} onChange={e => setEmailConfigForm({...emailConfigForm, publicKey: e.target.value})}
                           />
                       </div>
                       <div className="md:col-span-3 flex justify-end">
                           <button type="submit" className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-700">
                               Guardar Credenciales EmailJS
                           </button>
                       </div>
                  </form>
               </div>

               {/* GENERIC SMTP CONFIGURATION (NEW SECTION) */}
               <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <h3 className="font-bold text-slate-800 mb-4 flex items-center">
                      <Server className="mr-2 text-slate-500" size={20} /> Configuración Servidor SMTP (Backend)
                  </h3>
                  <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-4">
                      <p className="text-sm text-amber-700">Esta configuración se almacena para ser utilizada por una integración futura con un servidor backend. Los navegadores web no permiten conexiones SMTP directas por seguridad.</p>
                  </div>
                  <form onSubmit={handleSaveSmtpConfig} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                       <div className="md:col-span-2 lg:col-span-3">
                           <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Servidor SMTP (Host)</label>
                           <input type="text" className="w-full border rounded-lg p-2 text-sm" placeholder="ej. smtp.gmail.com"
                              value={smtpConfigForm.host} onChange={e => setSmtpConfigForm({...smtpConfigForm, host: e.target.value})}
                           />
                       </div>
                       <div>
                           <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Puerto</label>
                           <input type="number" className="w-full border rounded-lg p-2 text-sm" placeholder="587"
                              value={smtpConfigForm.port} onChange={e => setSmtpConfigForm({...smtpConfigForm, port: e.target.value})}
                           />
                       </div>
                       <div className="md:col-span-1 lg:col-span-2">
                           <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Usuario</label>
                           <input type="text" className="w-full border rounded-lg p-2 text-sm" placeholder="usuario@dominio.com"
                              value={smtpConfigForm.user} onChange={e => setSmtpConfigForm({...smtpConfigForm, user: e.target.value})}
                           />
                       </div>
                       <div className="md:col-span-1 lg:col-span-2">
                           <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Contraseña</label>
                           <input type="password" className="w-full border rounded-lg p-2 text-sm" placeholder="••••••••"
                              value={smtpConfigForm.pass} onChange={e => setSmtpConfigForm({...smtpConfigForm, pass: e.target.value})}
                           />
                       </div>
                       <div className="md:col-span-2 flex items-center pt-4">
                           <label className="flex items-center space-x-2 text-sm cursor-pointer">
                               <input 
                                   type="checkbox" 
                                   checked={smtpConfigForm.secure}
                                   onChange={e => setSmtpConfigForm({...smtpConfigForm, secure: e.target.checked})}
                                   className="rounded text-primary focus:ring-primary" 
                                />
                               <span className="text-slate-700">Usar conexión segura (SSL/TLS)</span>
                           </label>
                       </div>
                       <div className="md:col-span-2 lg:col-span-4 flex justify-end">
                           <button type="submit" className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-700">
                               Guardar Configuración SMTP
                           </button>
                       </div>
                  </form>
               </div>
           </div>
       )}

       {activeTab === 'users' && (
           <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
               <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                   <div className="relative w-full max-w-sm">
                       <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                       <input 
                         type="text" 
                         className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary" 
                         placeholder="Buscar usuario..."
                         value={searchTerm}
                         onChange={e => setSearchTerm(e.target.value)}
                       />
                   </div>
                   <button onClick={() => setShowCreateUserModal(true)} className="flex items-center bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-700">
                       <Plus size={16} className="mr-2" /> Nuevo Usuario
                   </button>
               </div>
               <div className="overflow-x-auto">
                   <table className="w-full">
                       <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider text-left">
                           <tr>
                               <th className="px-6 py-3">Usuario</th>
                               <th className="px-6 py-3">Rol</th>
                               <th className="px-6 py-3">Departamento</th>
                               <th className="px-6 py-3">Días Vac. Restantes</th>
                               <th className="px-6 py-3">Saldo Horas</th>
                               <th className="px-6 py-3">Acciones</th>
                           </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                           {filteredUsers.map(user => {
                               const dept = departments.find(d => d.id === user.departmentId);
                               const vacationBalance = getUserVacationBalance(user.id, user.vacationAdjustment || 0);
                               const overtimeBalance = getUserOvertimeBalance(user.id);
                               
                               return (
                                   <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                       <td className="px-6 py-4">
                                           <div className="flex items-center">
                                               <img src={user.avatarUrl} className="w-8 h-8 rounded-full mr-3 object-cover" alt="" />
                                               <div>
                                                   <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                                                   <p className="text-xs text-slate-400">{user.email}</p>
                                               </div>
                                           </div>
                                       </td>
                                       <td className="px-6 py-4">
                                           <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                                               user.role === Role.ADMIN ? 'bg-purple-100 text-purple-700' :
                                               user.role === Role.SUPERVISOR ? 'bg-emerald-100 text-emerald-700' :
                                               'bg-blue-100 text-blue-700'
                                           }`}>
                                               {user.role}
                                           </span>
                                       </td>
                                       <td className="px-6 py-4 text-sm text-slate-600">{dept?.name || '-'}</td>
                                       <td className="px-6 py-4 text-sm font-medium text-slate-700">
                                            <span className={vacationBalance < 5 ? 'text-red-600 font-bold' : ''}>{vacationBalance}</span>
                                       </td>
                                       <td className="px-6 py-4 text-sm font-medium text-primary">{overtimeBalance}h</td>
                                       <td className="px-6 py-4">
                                           <button onClick={() => setSelectedUser(user)} className="text-slate-500 hover:text-primary transition-colors flex items-center text-sm font-medium">
                                               <Settings size={16} className="mr-1" /> Gestionar
                                           </button>
                                       </td>
                                   </tr>
                               )
                           })}
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
                       <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                           <input type="text" className="w-full border rounded-lg p-2 text-sm" required 
                              value={newUserForm.name} onChange={e => setNewUserForm({...newUserForm, name: e.target.value})}
                           />
                       </div>
                       <div>
                           <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                           <input type="email" className="w-full border rounded-lg p-2 text-sm" required 
                              value={newUserForm.email} onChange={e => setNewUserForm({...newUserForm, email: e.target.value})}
                           />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                           <div>
                               <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
                               <select className="w-full border rounded-lg p-2 text-sm" 
                                  value={newUserForm.role} onChange={e => setNewUserForm({...newUserForm, role: e.target.value as Role})}
                               >
                                   <option value={Role.WORKER}>Trabajador</option>
                                   <option value={Role.SUPERVISOR}>Supervisor</option>
                                   <option value={Role.ADMIN}>Administrador</option>
                               </select>
                           </div>
                           <div>
                               <label className="block text-sm font-medium text-slate-700 mb-1">Departamento</label>
                               <select className="w-full border rounded-lg p-2 text-sm" 
                                  value={newUserForm.departmentId} onChange={e => setNewUserForm({...newUserForm, departmentId: e.target.value})}
                                  disabled={newUserForm.role === Role.ADMIN}
                               >
                                   <option value="">{newUserForm.role === Role.ADMIN ? 'N/A (Admin Global)' : 'Seleccionar...'}</option>
                                   {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                               </select>
                           </div>
                       </div>
                       
                       <div className="border-t border-slate-100 pt-4 mt-2">
                           <h4 className="text-sm font-bold text-slate-700 mb-2">Saldos Iniciales</h4>
                           <div className="grid grid-cols-2 gap-4">
                               <div>
                                   <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Ajuste Vacaciones (Días)</label>
                                   <input type="number" className="w-full border rounded-lg p-2 text-sm" 
                                      placeholder="+/- Días"
                                      value={newUserForm.initialVacation} onChange={e => setNewUserForm({...newUserForm, initialVacation: Number(e.target.value)})}
                                   />
                               </div>
                               <div>
                                   <label className="block text-xs font-medium text-slate-500 mb-1 uppercase">Saldo Horas (Inicial)</label>
                                   <input type="number" className="w-full border rounded-lg p-2 text-sm" 
                                      placeholder="Horas"
                                      value={newUserForm.initialOvertime} onChange={e => setNewUserForm({...newUserForm, initialOvertime: Number(e.target.value)})}
                                   />
                               </div>
                           </div>
                       </div>

                       <button type="submit" className="w-full bg-slate-800 text-white py-2 rounded-lg font-medium hover:bg-slate-700 mt-2">Crear Usuario</button>
                   </form>
               </div>
           </div>
       )}

       {/* MODAL: EDIT ABSENCE TYPE */}
       {editingType && (
           <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
               <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6">
                   <h3 className="text-lg font-bold mb-4">Editar Tipo de Ausencia</h3>
                   <form onSubmit={handleUpdateType} className="space-y-4">
                       <div>
                           <label className="block text-xs font-medium text-slate-500 mb-1">Nombre</label>
                           <input type="text" className="w-full border rounded p-2 text-sm" value={editingType.name} onChange={e => setEditingType({...editingType, name: e.target.value})} />
                       </div>
                       <div className="flex items-center space-x-2">
                            <input 
                              type="checkbox" 
                              id="editDeductsDays"
                              checked={editingType.deductsDays || false}
                              onChange={e => setEditingType({...editingType, deductsDays: e.target.checked})}
                            />
                            <label htmlFor="editDeductsDays" className="text-sm text-slate-600 font-medium text-red-500">¿Descuenta de vacaciones?</label>
                       </div>
                       <div className="flex justify-end space-x-2 pt-2">
                           <button type="button" onClick={() => setEditingType(null)} className="px-4 py-2 text-slate-500 text-sm">Cancelar</button>
                           <button type="submit" className="px-4 py-2 bg-primary text-white rounded text-sm">Guardar</button>
                       </div>
                   </form>
               </div>
           </div>
       )}

        {/* MODAL: EDIT DEPARTMENT */}
        {editingDept && (
           <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
               <div className="bg-white rounded-xl shadow-lg w-full max-w-sm p-6">
                   <h3 className="text-lg font-bold mb-4">Editar Departamento</h3>
                   <form onSubmit={handleUpdateDept} className="space-y-4">
                       <input type="text" className="w-full border rounded p-2" value={editingDept.name} onChange={e => setEditingDept({...editingDept, name: e.target.value})} />
                       
                       <div className="border rounded-lg p-2 max-h-40 overflow-y-auto">
                           <p className="text-xs font-semibold text-slate-500 mb-2">Supervisores:</p>
                           {users.filter(u => u.role === Role.SUPERVISOR || u.role === Role.ADMIN).map(u => (
                               <label key={u.id} className="flex items-center space-x-2 text-sm py-1 hover:bg-slate-50 cursor-pointer">
                                   <input 
                                       type="checkbox"
                                       checked={editingDept.supervisorIds.includes(u.id)}
                                       onChange={() => toggleSupervisorForEdit(u.id)}
                                       className="rounded text-primary focus:ring-primary"
                                   />
                                   <span>{u.name}</span>
                               </label>
                           ))}
                       </div>

                       <div className="flex justify-end space-x-2">
                           <button type="button" onClick={() => setEditingDept(null)} className="px-4 py-2 text-slate-500">Cancelar</button>
                           <button type="submit" className="px-4 py-2 bg-primary text-white rounded">Guardar</button>
                       </div>
                   </form>
               </div>
           </div>
       )}

       {/* MODAL: USER MANAGEMENT (DETAIL) */}
       {selectedUser && (
           <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
               <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                   <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                       <div className="flex items-center space-x-3">
                           <img src={selectedUser.avatarUrl} className="w-10 h-10 rounded-full bg-slate-200" alt="" />
                           <div>
                               <h3 className="font-bold text-slate-800">{selectedUser.name}</h3>
                               <p className="text-xs text-slate-500">{selectedUser.email}</p>
                           </div>
                       </div>
                       <button onClick={() => setSelectedUser(null)} className="text-slate-400 hover:text-slate-600"><X /></button>
                   </div>
                   
                   <div className="flex border-b border-slate-100">
                       <button onClick={() => setActiveUserTab('info')} className={`flex-1 py-3 text-sm font-medium ${activeUserTab === 'info' ? 'border-b-2 border-primary text-primary' : 'text-slate-500'}`}>Perfil y Ajustes</button>
                       <button onClick={() => setActiveUserTab('absences')} className={`flex-1 py-3 text-sm font-medium ${activeUserTab === 'absences' ? 'border-b-2 border-primary text-primary' : 'text-slate-500'}`}>Historial Ausencias</button>
                       <button onClick={() => setActiveUserTab('overtime')} className={`flex-1 py-3 text-sm font-medium ${activeUserTab === 'overtime' ? 'border-b-2 border-primary text-primary' : 'text-slate-500'}`}>Historial Horas</button>
                   </div>

                   <div className="p-6 overflow-y-auto bg-slate-50/50 flex-1">
                       {activeUserTab === 'info' && (
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                               {/* PROFILE EDIT */}
                               <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                   <h4 className="font-bold text-slate-700 mb-4">Editar Perfil</h4>
                                   <div className="space-y-4">
                                       <div>
                                           <label className="text-xs font-semibold text-slate-500 uppercase">Nombre</label>
                                           <input type="text" className="w-full border-b border-slate-200 py-1 focus:outline-none focus:border-primary text-sm" 
                                              value={selectedUser.name} onChange={e => updateUser(selectedUser.id, { name: e.target.value })} 
                                           />
                                       </div>
                                       <div>
                                           <label className="text-xs font-semibold text-slate-500 uppercase">Email</label>
                                           <input type="text" className="w-full border-b border-slate-200 py-1 focus:outline-none focus:border-primary text-sm" 
                                              value={selectedUser.email} onChange={e => updateUser(selectedUser.id, { email: e.target.value })} 
                                           />
                                       </div>
                                       <div>
                                           <label className="text-xs font-semibold text-slate-500 uppercase">Contraseña</label>
                                           <div className="flex space-x-2">
                                               <input type="text" className="w-full border-b border-slate-200 py-1 focus:outline-none focus:border-primary text-sm" 
                                                  placeholder="Nueva contraseña"
                                                  value={newPassword} onChange={e => setNewPassword(e.target.value)} 
                                               />
                                               <button onClick={handleUpdatePassword} className="text-xs bg-slate-800 text-white px-3 rounded hover:bg-slate-700">Actualizar</button>
                                           </div>
                                       </div>
                                       <div>
                                           <label className="text-xs font-semibold text-slate-500 uppercase">Rol</label>
                                           <select className="w-full border-b border-slate-200 py-1 focus:outline-none text-sm bg-transparent"
                                              value={selectedUser.role} onChange={e => updateUser(selectedUser.id, { role: e.target.value as Role })}
                                           >
                                               <option value={Role.WORKER}>Trabajador</option>
                                               <option value={Role.SUPERVISOR}>Supervisor</option>
                                               <option value={Role.ADMIN}>Administrador</option>
                                           </select>
                                       </div>
                                       <div>
                                           <label className="text-xs font-semibold text-slate-500 uppercase">Departamento</label>
                                           <select className="w-full border-b border-slate-200 py-1 focus:outline-none text-sm bg-transparent"
                                              value={selectedUser.departmentId || ''} onChange={e => updateUser(selectedUser.id, { departmentId: e.target.value })}
                                           >
                                               <option value="">Sin Departamento</option>
                                               {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                           </select>
                                       </div>
                                   </div>
                               </div>

                               {/* ADJUSTMENTS */}
                               <div className="space-y-6">
                                   <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                       <h4 className="font-bold text-slate-700 mb-2">Ajuste de Vacaciones</h4>
                                       <p className="text-sm text-slate-500 mb-4">Añadir o restar días al saldo anual (22 días).</p>
                                       <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg mb-4">
                                           <span className="text-sm font-medium text-slate-600">Saldo Actual:</span>
                                           <span className="text-xl font-bold text-slate-800">{getUserVacationBalance(selectedUser.id, selectedUser.vacationAdjustment || 0)} días</span>
                                       </div>
                                       
                                       <div className="space-y-2">
                                           <input type="text" className="w-full border rounded px-3 py-2 text-sm" 
                                             placeholder="Motivo (Opcional)" 
                                             value={adjustReasonDays} onChange={e => setAdjustReasonDays(e.target.value)}
                                           />
                                           <div className="flex space-x-2">
                                               <input type="number" className="flex-1 border rounded px-3 py-2 text-sm" placeholder="+/- Días" value={adjustDays} onChange={e => setAdjustDays(Number(e.target.value))} />
                                               <button onClick={handleAdjustDays} className="bg-slate-800 text-white px-4 py-2 rounded text-sm hover:bg-slate-700">Aplicar</button>
                                           </div>
                                       </div>
                                       
                                       {/* VACATION HISTORY */}
                                       <div className="mt-4 border-t border-slate-100 pt-3">
                                            <p className="text-xs font-bold text-slate-500 uppercase mb-2">Historial de Ajustes</p>
                                            <div className="max-h-32 overflow-y-auto text-xs space-y-2">
                                                {(users.find(u => u.id === selectedUser.id)?.vacationHistory || []).length === 0 ? (
                                                    <p className="text-slate-400">Sin historial.</p>
                                                ) : (users.find(u => u.id === selectedUser.id)?.vacationHistory || []).map(log => (
                                                    <div key={log.id} className="flex justify-between border-b border-slate-50 pb-1">
                                                        <span>{new Date(log.date).toLocaleDateString()}</span>
                                                        <span className="font-medium text-slate-700">{log.days > 0 ? '+' : ''}{log.days}</span>
                                                        <span className="text-slate-500 truncate max-w-[100px]" title={log.reason}>{log.reason}</span>
                                                    </div>
                                                ))}
                                            </div>
                                       </div>
                                   </div>

                                   <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                       <h4 className="font-bold text-slate-700 mb-2">Ajuste de Horas Extras</h4>
                                       <p className="text-sm text-slate-500 mb-4">Añadir horas (positivas) o restar (negativas) manualmente.</p>
                                       <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg mb-4">
                                           <span className="text-sm font-medium text-slate-600">Saldo Actual:</span>
                                           <span className="text-xl font-bold text-primary">{getUserOvertimeBalance(selectedUser.id)}h</span>
                                       </div>
                                       <div className="space-y-2">
                                           <input type="text" className="w-full border rounded px-3 py-2 text-sm" 
                                             placeholder="Motivo (Opcional)" 
                                             value={adjustReasonHours} onChange={e => setAdjustReasonHours(e.target.value)}
                                           />
                                           <div className="flex space-x-2">
                                               <input type="number" className="flex-1 border rounded px-3 py-2 text-sm" placeholder="+/- Horas" value={adjustHours} onChange={e => setAdjustHours(Number(e.target.value))} />
                                               <button onClick={handleAdjustHours} className="bg-secondary text-white px-4 py-2 rounded text-sm hover:bg-emerald-600">Registrar</button>
                                           </div>
                                       </div>
                                   </div>
                               </div>
                           </div>
                       )}

                       {activeUserTab === 'absences' && (
                           <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                               <table className="w-full text-sm">
                                   <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
                                       <tr>
                                           <th className="px-4 py-3 text-left">Tipo</th>
                                           <th className="px-4 py-3 text-left">Fechas</th>
                                           <th className="px-4 py-3 text-left">Estado</th>
                                           <th className="px-4 py-3 text-center">Acción</th>
                                       </tr>
                                   </thead>
                                   <tbody className="divide-y divide-slate-100">
                                       {requests.filter(r => r.userId === selectedUser.id).map(r => {
                                           const t = absenceTypes.find(at => at.id === r.typeId);
                                           return (
                                               <tr key={r.id}>
                                                   <td className="px-4 py-3">{t?.name}</td>
                                                   <td className="px-4 py-3">{new Date(r.startDate).toLocaleDateString()} - {new Date(r.endDate).toLocaleDateString()}</td>
                                                   <td className="px-4 py-3">
                                                       <span className={`px-2 py-1 rounded-full text-xs font-bold ${r.status === 'APPROVED' ? 'bg-green-100 text-green-700' : r.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                           {r.status}
                                                       </span>
                                                   </td>
                                                   <td className="px-4 py-3 text-center">
                                                       <button onClick={() => handleDeleteRequestClick(r.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                                                            <Trash2 size={16} />
                                                       </button>
                                                   </td>
                                               </tr>
                                           )
                                       })}
                                   </tbody>
                               </table>
                           </div>
                       )}

                       {activeUserTab === 'overtime' && (
                           <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                               <table className="w-full text-sm">
                                   <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-xs">
                                       <tr>
                                           <th className="px-4 py-3 text-left">Fecha</th>
                                           <th className="px-4 py-3 text-left">Descripción</th>
                                           <th className="px-4 py-3 text-left">Horas</th>
                                           <th className="px-4 py-3 text-left">Estado</th>
                                           <th className="px-4 py-3 text-center">Acción</th>
                                       </tr>
                                   </thead>
                                   <tbody className="divide-y divide-slate-100">
                                       {overtime.filter(o => o.userId === selectedUser.id).map(o => {
                                           const isApprovedRedemption = o.hours < 0 && o.status === RequestStatus.APPROVED;
                                           return (
                                               <tr key={o.id}>
                                                   <td className="px-4 py-3">{new Date(o.date).toLocaleDateString()}</td>
                                                   <td className="px-4 py-3">
                                                       {o.description} 
                                                       {o.isAdjustment && <span className="text-[10px] bg-blue-100 text-blue-600 px-1 rounded ml-1">ADMIN</span>}
                                                       {o.redemptionType && <span className="text-[10px] bg-purple-100 text-purple-600 px-1 rounded ml-1">CANJE</span>}
                                                   </td>
                                                   <td className="px-4 py-3">{o.hours}h</td>
                                                   <td className="px-4 py-3">
                                                       <span className={`px-2 py-1 rounded-full text-xs font-bold ${o.status === 'APPROVED' ? 'bg-green-100 text-green-700' : o.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                            {o.status}
                                                       </span>
                                                   </td>
                                                   <td className="px-4 py-3 text-center flex justify-center space-x-2">
                                                       {isApprovedRedemption && (
                                                           <button onClick={() => setViewingRedemption(o)} className="text-slate-400 hover:text-primary transition-colors">
                                                               <Eye size={16} />
                                                           </button>
                                                       )}
                                                       <button onClick={() => handleDeleteOvertimeClick(o.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                                                            <Trash2 size={16} />
                                                       </button>
                                                   </td>
                                               </tr>
                                           );
                                       })}
                                   </tbody>
                               </table>
                           </div>
                       )}
                   </div>
               </div>
           </div>
       )}

       {/* ADMIN REDEMPTION DETAIL MODAL */}
       {viewingRedemption && selectedUser && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col print-area">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 no-print">
                    <h3 className="font-bold text-slate-800">Detalle de Canje (Admin View)</h3>
                    <button onClick={() => setViewingRedemption(null)} className="text-slate-400 hover:text-slate-600"><X /></button>
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
                            <p className="text-sm font-medium text-slate-700">Fecha</p>
                            <p className="text-slate-500 text-sm">{new Date(viewingRedemption.date).toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mb-6">
                        <p className="text-xs text-slate-500 uppercase font-bold mb-2">Usuario</p>
                        <p className="text-slate-800 font-medium">{selectedUser.name}</p>
                        <p className="text-sm text-slate-500">{selectedUser.email}</p>
                        <div className="mt-4 flex justify-between items-center">
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold">Tipo de Canje</p>
                                <p className="text-purple-600 font-bold">{getRedemptionLabel(viewingRedemption.redemptionType)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-slate-500 uppercase font-bold">Total Canjeado</p>
                                <p className="text-xl font-bold text-slate-800">{Math.abs(viewingRedemption.hours)}h</p>
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
                            {viewingRedemption.linkedRecordIds?.map(id => {
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
                        <p className="font-bold text-slate-800">Total: {Math.abs(viewingRedemption.hours)}h</p>
                    </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-2 no-print">
                    <button onClick={handlePrint} className="flex items-center px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 shadow-sm">
                        <Printer size={16} className="mr-2" /> Imprimir
                    </button>
                    <button onClick={() => setViewingRedemption(null)} className="px-4 py-2 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700">
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
                  <div className="flex items-center text-slate-800 mb-4">
                      <AlertCircle className="mr-2 text-slate-500" />
                      <h3 className="font-bold text-lg">{confirmModal.title}</h3>
                  </div>
                  <p className="text-slate-600 text-sm mb-6">
                      {confirmModal.message}
                  </p>
                  <div className="flex justify-end space-x-3">
                      <button 
                          onClick={() => setConfirmModal(null)}
                          className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg font-medium text-sm"
                      >
                          Cancelar
                      </button>
                      <button 
                          onClick={confirmModal.onConfirm}
                          className="px-4 py-2 bg-slate-800 text-white hover:bg-slate-700 rounded-lg font-medium text-sm"
                      >
                          Confirmar
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default AdminPanel;
