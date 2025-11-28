
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Settings, Calendar, Briefcase, Plus, User as UserIcon, Trash2, Edit2, Search, X, Check, Eye, Printer, Download, Upload, Database, Mail, Save, AlertCircle, Key, Server, Palette, Sun, Moon, Eraser, ChevronLeft, ChevronRight, CalendarDays, Clock, FileText, LayoutList, Megaphone, Send, MessageSquare, RefreshCw } from 'lucide-react';
import { Role, RequestStatus, AbsenceType, Department, User, OvertimeRecord, RedemptionType, EmailTemplate, ShiftType, ShiftTypeDefinition } from '../types';

const AdminPanel = () => {
  const { 
      absenceTypes, createAbsenceType, deleteAbsenceType, updateAbsenceType,
      departments, addDepartment, updateDepartment, deleteDepartment,
      users, updateUser, adjustUserVacation, addUser, deleteUser, 
      notifications, emailTemplates, updateEmailTemplate, saveEmailConfig, emailConfig, saveSmtpConfig, smtpConfig, sendTestEmail, systemMessage, updateSystemMessage,
      shiftTypes, createShiftType, updateShiftType, deleteShiftType,
      addRequest, deleteRequest, addOvertime, deleteOvertime, requestRedemption,
      fetchData
  } = useData();

  const [activeTab, setActiveTab] = useState<'users' | 'depts' | 'absences' | 'shifts' | 'config'>('users');

  // --- SUB-COMPONENTS ---

  const UsersTab = () => {
      const [showAddModal, setShowAddModal] = useState(false);
      const [editingUser, setEditingUser] = useState<User | null>(null);
      const [searchTerm, setSearchTerm] = useState('');
      
      // New User State
      const [newUser, setNewUser] = useState({ name: '', email: '', role: Role.WORKER, departmentId: '', initialVacation: 0, initialOvertime: 0 });

      // Edit User Modal State
      const [editTab, setEditTab] = useState<'profile'|'absences'|'overtime'|'adjustments'>('profile');
      const [userForm, setUserForm] = useState<Partial<User>>({});
      
      // Adjustment State
      const [adjDays, setAdjDays] = useState(0);
      const [adjReason, setAdjReason] = useState('');
      const [adjHours, setAdjHours] = useState(0);
      const [adjHoursDesc, setAdjHoursDesc] = useState('');

      const filteredUsers = users.filter(u => 
          u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
          u.email.toLowerCase().includes(searchTerm.toLowerCase())
      );

      const handleAddUser = (e: React.FormEvent) => {
          e.preventDefault();
          addUser(
              { name: newUser.name, email: newUser.email, role: newUser.role, departmentId: newUser.departmentId }, 
              newUser.initialVacation, 
              newUser.initialOvertime
          );
          setShowAddModal(false);
          setNewUser({ name: '', email: '', role: Role.WORKER, departmentId: '', initialVacation: 0, initialOvertime: 0 });
      };

      const openEditModal = (user: User) => {
          setEditingUser(user);
          setUserForm({ ...user, password: '' }); // Clear password for security
          setEditTab('profile');
      };

      const handleUpdateProfile = (e: React.FormEvent) => {
          e.preventDefault();
          if (editingUser) {
              const updates: any = {
                  name: userForm.name,
                  email: userForm.email,
                  role: userForm.role,
                  departmentId: userForm.departmentId,
                  calendarColor: userForm.calendarColor
              };
              if (userForm.password) updates.password = userForm.password;
              
              updateUser(editingUser.id, updates);
              setEditingUser(null);
          }
      };

      const handleVacationAdjustment = (e: React.FormEvent) => {
          e.preventDefault();
          if (editingUser) {
              adjustUserVacation(editingUser.id, Number(adjDays), adjReason || 'Ajuste Manual Admin');
              setAdjDays(0);
              setAdjReason('');
          }
      };

      const handleHoursAdjustment = (e: React.FormEvent) => {
          e.preventDefault();
          if (editingUser) {
              addOvertime({
                  userId: editingUser.id,
                  date: new Date().toISOString(),
                  hours: Number(adjHours),
                  description: adjHoursDesc || 'Ajuste Manual Admin',
                  status: RequestStatus.APPROVED
              });
              setAdjHours(0);
              setAdjHoursDesc('');
          }
      };

      // Helper to calculate balances for the table
      const getUserStats = (userId: string) => {
          // Vacation
          const userRequests = useData().requests.filter(r => r.userId === userId && r.status === RequestStatus.APPROVED);
          const usedDays = userRequests.reduce((acc, req) => {
             // Basic calc, assumes standard week
             const s = new Date(req.startDate);
             const e = new Date(req.endDate);
             const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
             return acc + diff;
          }, 0);
          
          // Overtime
          const userOvertime = useData().overtime.filter(o => o.userId === userId && o.status === RequestStatus.APPROVED);
          const balance = userOvertime.reduce((acc, curr) => acc + (curr.hours - curr.consumed), 0);
          
          return { usedDays, balance };
      };

      return (
          <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="relative w-full md:w-96">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                          type="text" 
                          placeholder="Buscar usuario..." 
                          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                      />
                  </div>
                  <button onClick={() => setShowAddModal(true)} className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
                      <Plus size={18} className="mr-2" /> Nuevo Usuario
                  </button>
              </div>
              
              {/* TABLE VIEW */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <table className="w-full text-left border-collapse">
                      <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                              <th className="px-6 py-4">Usuario</th>
                              <th className="px-6 py-4">Rol</th>
                              <th className="px-6 py-4">Departamento</th>
                              <th className="px-6 py-4 text-right">Acciones</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {filteredUsers.map(u => (
                              <tr key={u.id} className="hover:bg-slate-50 transition-colors group">
                                  <td className="px-6 py-4">
                                      <div className="flex items-center space-x-3">
                                          <img 
                                              src={u.avatarUrl || `https://ui-avatars.com/api/?name=${u.name}&background=random`} 
                                              alt="" 
                                              className="w-10 h-10 rounded-full bg-slate-200 object-cover"
                                          />
                                          <div>
                                              <p className="text-sm font-bold text-slate-800">{u.name}</p>
                                              <p className="text-xs text-slate-500">{u.email}</p>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="px-6 py-4">
                                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                                          u.role === Role.ADMIN ? 'bg-purple-100 text-purple-700' :
                                          u.role === Role.SUPERVISOR ? 'bg-emerald-100 text-emerald-700' :
                                          'bg-blue-100 text-blue-700'
                                      }`}>
                                          {u.role}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4 text-sm text-slate-600">
                                      {departments.find(d => d.id === u.departmentId)?.name || <span className="text-slate-400 italic">Sin asignar</span>}
                                  </td>
                                  <td className="px-6 py-4 text-right space-x-2">
                                      <button 
                                          onClick={() => openEditModal(u)} 
                                          className="p-2 text-slate-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors"
                                          title="Editar"
                                      >
                                          <Edit2 size={18} />
                                      </button>
                                      <button 
                                          onClick={() => { if(confirm('¿Seguro que quieres eliminar este usuario?')) deleteUser(u.id); }} 
                                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                          title="Eliminar"
                                      >
                                          <Trash2 size={18} />
                                      </button>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
                  {filteredUsers.length === 0 && (
                      <div className="p-8 text-center text-slate-400">No se encontraron usuarios.</div>
                  )}
              </div>

              {/* NEW USER MODAL */}
              {showAddModal && (
                  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                      <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl animate-in zoom-in duration-200">
                          <div className="flex justify-between items-center mb-6">
                              <h3 className="font-bold text-xl text-slate-800">Añadir Usuario</h3>
                              <button onClick={() => setShowAddModal(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
                          </div>
                          <form onSubmit={handleAddUser} className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                                      <input type="text" required className="w-full border p-2 rounded-lg" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
                                  </div>
                                  <div>
                                      <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                      <input type="email" required className="w-full border p-2 rounded-lg" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
                                  </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                  <div>
                                      <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
                                      <select className="w-full border p-2 rounded-lg" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as Role})}>
                                          <option value={Role.WORKER}>Trabajador</option>
                                          <option value={Role.SUPERVISOR}>Supervisor</option>
                                          <option value={Role.ADMIN}>Administrador</option>
                                      </select>
                                  </div>
                                  <div>
                                      <label className="block text-sm font-medium text-slate-700 mb-1">Departamento</label>
                                      <select className="w-full border p-2 rounded-lg" value={newUser.departmentId} onChange={e => setNewUser({...newUser, departmentId: e.target.value})}>
                                          <option value="">Sin Departamento</option>
                                          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                      </select>
                                  </div>
                              </div>

                              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                                  <h4 className="font-semibold text-sm text-slate-700 mb-3">Saldos Iniciales (Opcional)</h4>
                                  <div className="grid grid-cols-2 gap-4">
                                      <div>
                                          <label className="block text-xs uppercase font-bold text-slate-500 mb-1">Días Vacaciones</label>
                                          <input type="number" className="w-full border p-2 rounded-lg text-sm" value={newUser.initialVacation} onChange={e => setNewUser({...newUser, initialVacation: Number(e.target.value)})} />
                                      </div>
                                      <div>
                                          <label className="block text-xs uppercase font-bold text-slate-500 mb-1">Horas Extras</label>
                                          <input type="number" step="0.5" className="w-full border p-2 rounded-lg text-sm" value={newUser.initialOvertime} onChange={e => setNewUser({...newUser, initialOvertime: Number(e.target.value)})} />
                                      </div>
                                  </div>
                              </div>

                              <div className="flex justify-end gap-2 mt-4">
                                  <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-lg">Cancelar</button>
                                  <button type="submit" className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700">Crear Usuario</button>
                              </div>
                          </form>
                      </div>
                  </div>
              )}

              {/* EDIT USER MODAL */}
              {editingUser && (
                  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                      <div className="bg-white rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl animate-in zoom-in duration-200 overflow-hidden">
                          {/* Header */}
                          <div className="px-8 py-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                              <div className="flex items-center space-x-4">
                                  <img src={editingUser.avatarUrl} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" alt=""/>
                                  <div>
                                      <h2 className="text-xl font-bold text-slate-800">{editingUser.name}</h2>
                                      <p className="text-sm text-slate-500">{editingUser.email}</p>
                                  </div>
                              </div>
                              <button onClick={() => setEditingUser(null)} className="p-2 hover:bg-slate-200 rounded-full text-slate-500"><X /></button>
                          </div>

                          {/* Tabs */}
                          <div className="flex border-b border-slate-200 px-8">
                              <button onClick={() => setEditTab('profile')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${editTab === 'profile' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Perfil</button>
                              <button onClick={() => setEditTab('absences')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${editTab === 'absences' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Ausencias</button>
                              <button onClick={() => setEditTab('overtime')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${editTab === 'overtime' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Bolsa Horas</button>
                              <button onClick={() => setEditTab('adjustments')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${editTab === 'adjustments' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Ajustes</button>
                          </div>

                          {/* Content */}
                          <div className="flex-1 overflow-y-auto p-8 bg-white">
                              {editTab === 'profile' && (
                                  <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-2xl">
                                      <div className="grid grid-cols-2 gap-6">
                                          <div>
                                              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
                                              <input type="text" className="w-full border p-2 rounded-lg" value={userForm.name || ''} onChange={e => setUserForm({...userForm, name: e.target.value})} />
                                          </div>
                                          <div>
                                              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                              <input type="email" className="w-full border p-2 rounded-lg" value={userForm.email || ''} onChange={e => setUserForm({...userForm, email: e.target.value})} />
                                          </div>
                                          <div>
                                              <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
                                              <select className="w-full border p-2 rounded-lg" value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value as Role})}>
                                                  <option value={Role.WORKER}>Trabajador</option>
                                                  <option value={Role.SUPERVISOR}>Supervisor</option>
                                                  <option value={Role.ADMIN}>Administrador</option>
                                              </select>
                                          </div>
                                          <div>
                                              <label className="block text-sm font-medium text-slate-700 mb-1">Departamento</label>
                                              <select className="w-full border p-2 rounded-lg" value={userForm.departmentId || ''} onChange={e => setUserForm({...userForm, departmentId: e.target.value})}>
                                                  <option value="">Sin Departamento</option>
                                                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                              </select>
                                          </div>
                                          <div>
                                              <label className="block text-sm font-medium text-slate-700 mb-1">Color Calendario</label>
                                              <div className="flex gap-2">
                                                  {['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1'].map(c => (
                                                      <button 
                                                          key={c}
                                                          type="button"
                                                          onClick={() => setUserForm({...userForm, calendarColor: c})}
                                                          className={`w-6 h-6 rounded-full border-2 ${userForm.calendarColor === c ? 'border-slate-800' : 'border-transparent'}`}
                                                          style={{ backgroundColor: c }}
                                                      />
                                                  ))}
                                              </div>
                                          </div>
                                          <div>
                                              <label className="block text-sm font-medium text-slate-700 mb-1">Nueva Contraseña</label>
                                              <div className="relative">
                                                  <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                  <input 
                                                      type="password" 
                                                      placeholder="Cambiar contraseña..."
                                                      className="w-full border pl-9 p-2 rounded-lg" 
                                                      value={userForm.password || ''} 
                                                      onChange={e => setUserForm({...userForm, password: e.target.value})} 
                                                  />
                                              </div>
                                          </div>
                                      </div>
                                      <div className="pt-4 border-t">
                                          <button type="submit" className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">Guardar Cambios</button>
                                      </div>
                                  </form>
                              )}

                              {editTab === 'absences' && (
                                  <div className="space-y-6">
                                      <div className="flex justify-between">
                                          <h4 className="font-bold text-slate-700">Historial de Ausencias</h4>
                                          {/* Add Absence Button Logic could go here */}
                                      </div>
                                      <div className="border rounded-lg overflow-hidden">
                                          <table className="w-full text-sm">
                                              <thead className="bg-slate-50">
                                                  <tr>
                                                      <th className="px-4 py-2 text-left">Fechas</th>
                                                      <th className="px-4 py-2 text-left">Tipo</th>
                                                      <th className="px-4 py-2 text-left">Estado</th>
                                                      <th className="px-4 py-2 text-right">Acción</th>
                                                  </tr>
                                              </thead>
                                              <tbody className="divide-y">
                                                  {useData().requests.filter(r => r.userId === editingUser.id).map(r => (
                                                      <tr key={r.id}>
                                                          <td className="px-4 py-2">{new Date(r.startDate).toLocaleDateString()} - {new Date(r.endDate).toLocaleDateString()}</td>
                                                          <td className="px-4 py-2">{absenceTypes.find(t => t.id === r.typeId)?.name}</td>
                                                          <td className="px-4 py-2"><span className="bg-slate-100 px-2 py-0.5 rounded text-xs">{r.status}</span></td>
                                                          <td className="px-4 py-2 text-right">
                                                              <button onClick={() => deleteRequest(r.id)} className="text-red-500 hover:underline">Eliminar</button>
                                                          </td>
                                                      </tr>
                                                  ))}
                                              </tbody>
                                          </table>
                                      </div>
                                  </div>
                              )}

                              {editTab === 'overtime' && (
                                  <div className="space-y-6">
                                      <div className="flex justify-between">
                                          <h4 className="font-bold text-slate-700">Registro de Horas</h4>
                                      </div>
                                      <div className="border rounded-lg overflow-hidden">
                                          <table className="w-full text-sm">
                                              <thead className="bg-slate-50">
                                                  <tr>
                                                      <th className="px-4 py-2 text-left">Fecha</th>
                                                      <th className="px-4 py-2 text-center">Horas</th>
                                                      <th className="px-4 py-2 text-left">Concepto</th>
                                                      <th className="px-4 py-2 text-right">Acción</th>
                                                  </tr>
                                              </thead>
                                              <tbody className="divide-y">
                                                  {useData().overtime.filter(o => o.userId === editingUser.id).map(o => (
                                                      <tr key={o.id}>
                                                          <td className="px-4 py-2">{new Date(o.date).toLocaleDateString()}</td>
                                                          <td className={`px-4 py-2 text-center font-bold ${o.hours > 0 ? 'text-emerald-600' : 'text-purple-600'}`}>{o.hours > 0 ? '+' : ''}{o.hours}h</td>
                                                          <td className="px-4 py-2 truncate max-w-[200px]">{o.description}</td>
                                                          <td className="px-4 py-2 text-right">
                                                              <button onClick={() => deleteOvertime(o.id)} className="text-red-500 hover:underline">Eliminar</button>
                                                          </td>
                                                      </tr>
                                                  ))}
                                              </tbody>
                                          </table>
                                      </div>
                                  </div>
                              )}

                              {editTab === 'adjustments' && (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                      <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
                                          <h4 className="font-bold text-slate-800 mb-4 flex items-center"><CalendarDays size={18} className="mr-2"/> Ajuste Vacaciones</h4>
                                          <p className="text-sm text-slate-500 mb-4">Añade o resta días al saldo anual.</p>
                                          <form onSubmit={handleVacationAdjustment} className="space-y-3">
                                              <input type="number" placeholder="Días (+/-)" className="w-full border p-2 rounded" value={adjDays} onChange={e => setAdjDays(Number(e.target.value))} />
                                              <input type="text" placeholder="Motivo (ej: Antigüedad)" className="w-full border p-2 rounded" value={adjReason} onChange={e => setAdjReason(e.target.value)} />
                                              <button type="submit" className="w-full bg-slate-800 text-white py-2 rounded hover:bg-slate-700">Aplicar Ajuste</button>
                                          </form>
                                      </div>

                                      <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
                                          <h4 className="font-bold text-slate-800 mb-4 flex items-center"><Clock size={18} className="mr-2"/> Ajuste Horas</h4>
                                          <p className="text-sm text-slate-500 mb-4">Añade o resta horas a la bolsa.</p>
                                          <form onSubmit={handleHoursAdjustment} className="space-y-3">
                                              <input type="number" step="0.5" placeholder="Horas (+/-)" className="w-full border p-2 rounded" value={adjHours} onChange={e => setAdjHours(Number(e.target.value))} />
                                              <input type="text" placeholder="Motivo" className="w-full border p-2 rounded" value={adjHoursDesc} onChange={e => setAdjHoursDesc(e.target.value)} />
                                              <button type="submit" className="w-full bg-slate-800 text-white py-2 rounded hover:bg-slate-700">Aplicar Ajuste</button>
                                          </form>
                                      </div>
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>
              )}
          </div>
      );
  };

  const DeptsTab = () => {
      const [newDept, setNewDept] = useState('');
      return (
          <div className="space-y-6">
              <h3 className="text-lg font-bold text-slate-800">Departamentos</h3>
              <div className="flex gap-2">
                  <input type="text" placeholder="Nuevo Departamento" className="border p-2 rounded flex-1" value={newDept} onChange={e => setNewDept(e.target.value)} />
                  <button onClick={() => { if(newDept) { addDepartment(newDept); setNewDept(''); } }} className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700">Añadir</button>
              </div>
              <ul className="space-y-2">
                  {departments.map(d => (
                      <li key={d.id} className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-lg">
                          <span>{d.name}</span>
                          <button onClick={() => { if(confirm('¿Eliminar departamento?')) deleteDepartment(d.id) }} className="text-red-500 hover:text-red-700"><Trash2 size={16} /></button>
                      </li>
                  ))}
              </ul>
          </div>
      );
  };

  const ConfigTab = () => {
    // Config sub-state
    const [localSmtp, setLocalSmtp] = useState(smtpConfig);
    const [localMsg, setLocalMsg] = useState(systemMessage || { id: 'global_msg', text: '', active: false, color: 'bg-blue-600 text-white' });
    const [testEmail, setTestEmail] = useState('');

    const handleSaveSmtp = (e: React.FormEvent) => {
        e.preventDefault();
        saveSmtpConfig(localSmtp);
    };

    const handleSaveMsg = () => {
        updateSystemMessage(localMsg);
    };

    return (
        <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center"><Database className="mr-2" size={20}/> Datos</h3>
                    <button onClick={fetchData} className="flex items-center px-4 py-2 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 text-sm">
                        <RefreshCw size={16} className="mr-2"/> Recargar Datos
                    </button>
                </div>
            </div>

            {/* System Message */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center"><Megaphone className="mr-2" size={20}/> Mensaje Global</h3>
                <div className="space-y-4">
                    <input 
                        type="text" 
                        placeholder="Mensaje del banner (ej: Oficina cerrada por festivo)" 
                        className="w-full border p-2 rounded" 
                        value={localMsg.text} 
                        onChange={e => setLocalMsg({...localMsg, text: e.target.value})} 
                    />
                    <div className="flex items-center gap-4">
                        <label className="flex items-center space-x-2 text-sm text-slate-700">
                            <input type="checkbox" checked={localMsg.active} onChange={e => setLocalMsg({...localMsg, active: e.target.checked})} className="rounded text-primary focus:ring-primary" />
                            <span>Activar Banner</span>
                        </label>
                        <select 
                            className="border p-1 rounded text-sm" 
                            value={localMsg.color} 
                            onChange={e => setLocalMsg({...localMsg, color: e.target.value})}
                        >
                            <option value="bg-blue-600 text-white">Azul</option>
                            <option value="bg-red-600 text-white">Rojo (Alerta)</option>
                            <option value="bg-amber-500 text-white">Ámbar (Aviso)</option>
                            <option value="bg-emerald-600 text-white">Verde (Info)</option>
                        </select>
                        <button onClick={handleSaveMsg} className="px-4 py-1.5 bg-slate-800 text-white rounded text-sm hover:bg-slate-700">Guardar</button>
                    </div>
                </div>
            </div>

            {/* SMTP Config */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center"><Mail className="mr-2" size={20}/> Configuración SMTP (Email)</h3>
                <form onSubmit={handleSaveSmtp} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="Host (ej: smtp.gmail.com)" className="border p-2 rounded" value={localSmtp.host} onChange={e => setLocalSmtp({...localSmtp, host: e.target.value})} />
                    <input type="text" placeholder="Puerto (ej: 587)" className="border p-2 rounded" value={localSmtp.port} onChange={e => setLocalSmtp({...localSmtp, port: e.target.value})} />
                    <input type="text" placeholder="Usuario" className="border p-2 rounded" value={localSmtp.user} onChange={e => setLocalSmtp({...localSmtp, user: e.target.value})} />
                    <input type="password" placeholder="Contraseña" className="border p-2 rounded" value={localSmtp.pass} onChange={e => setLocalSmtp({...localSmtp, pass: e.target.value})} />
                    <div className="md:col-span-2 flex justify-between items-center mt-2">
                        <label className="flex items-center space-x-2 text-sm text-slate-600">
                             <input type="checkbox" checked={localSmtp.secure} onChange={e => setLocalSmtp({...localSmtp, secure: e.target.checked})} />
                             <span>Conexión Segura (SSL/TLS)</span>
                        </label>
                        <button type="submit" className="px-6 py-2 bg-slate-800 text-white rounded hover:bg-slate-700">Guardar Configuración</button>
                    </div>
                </form>
                
                <div className="mt-6 pt-6 border-t border-slate-100">
                    <h4 className="font-bold text-sm text-slate-700 mb-2">Prueba de Envío</h4>
                    <div className="flex gap-2">
                        <input type="email" placeholder="Email para prueba" className="border p-2 rounded flex-1 max-w-xs" value={testEmail} onChange={e => setTestEmail(e.target.value)} />
                        <button onClick={() => sendTestEmail(testEmail)} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded hover:bg-slate-50">Enviar Test</button>
                    </div>
                </div>
            </div>
        </div>
    );
  };

  const ShiftsTab = () => {
      const [paintTool, setPaintTool] = useState<{type: 'SHIFT' | 'ERASER', shiftTypeId?: string}>({ type: 'SHIFT' });
      const [selectedUser, setSelectedUser] = useState<string>('');
      const [currentDate, setCurrentDate] = useState(new Date());
      const { shifts, addShift, deleteShift } = useData();

      // Calendar Logic simplified for Admin Painting... 
      // Reusing CalendarView logic or a simplified grid would be best.
      // For brevity in this large file, assuming CalendarView is used for robust shift mgmt.
      
      const [newShiftType, setNewShiftType] = useState<Partial<ShiftTypeDefinition>>({ name: '', startTime: '', endTime: '', color: 'bg-blue-100 text-blue-800 border-blue-300' });

      return (
          <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left: Configuration */}
                  <div className="space-y-6">
                      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                          <h3 className="font-bold text-slate-800 mb-4">Tipos de Turno</h3>
                          <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                              {shiftTypes.map(t => (
                                  <div key={t.id} className="flex justify-between items-center p-3 bg-slate-50 rounded border border-slate-100">
                                      <div>
                                          <div className="flex items-center gap-2">
                                              <span className={`w-3 h-3 rounded-full ${t.color.split(' ')[0].replace('bg-', 'bg-')}`}></span>
                                              <span className="font-bold text-sm">{t.name}</span>
                                          </div>
                                          <p className="text-xs text-slate-500 pl-5">{t.startTime} - {t.endTime}</p>
                                      </div>
                                      <button onClick={() => deleteShiftType(t.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={14}/></button>
                                  </div>
                              ))}
                          </div>
                          
                          <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                              <input type="text" placeholder="Nombre (ej: Mañana)" className="w-full border p-2 rounded text-sm" value={newShiftType.name} onChange={e => setNewShiftType({...newShiftType, name: e.target.value})} />
                              <div className="flex gap-2">
                                  <input type="time" className="w-1/2 border p-2 rounded text-sm" value={newShiftType.startTime} onChange={e => setNewShiftType({...newShiftType, startTime: e.target.value})} />
                                  <input type="time" className="w-1/2 border p-2 rounded text-sm" value={newShiftType.endTime} onChange={e => setNewShiftType({...newShiftType, endTime: e.target.value})} />
                              </div>
                              <div className="flex gap-2">
                                  <input type="time" className="w-1/2 border p-2 rounded text-sm" placeholder="Inicio 2" value={newShiftType.startTime2 || ''} onChange={e => setNewShiftType({...newShiftType, startTime2: e.target.value})} />
                                  <input type="time" className="w-1/2 border p-2 rounded text-sm" placeholder="Fin 2" value={newShiftType.endTime2 || ''} onChange={e => setNewShiftType({...newShiftType, endTime2: e.target.value})} />
                              </div>
                              <select className="w-full border p-2 rounded text-sm" value={newShiftType.color} onChange={e => setNewShiftType({...newShiftType, color: e.target.value})}>
                                  <option value="bg-amber-100 text-amber-800 border-amber-300">Amarillo</option>
                                  <option value="bg-indigo-100 text-indigo-800 border-indigo-300">Azul Indigo</option>
                                  <option value="bg-emerald-100 text-emerald-800 border-emerald-300">Verde</option>
                                  <option value="bg-red-100 text-red-800 border-red-300">Rojo</option>
                                  <option value="bg-slate-800 text-slate-200 border-slate-600">Oscuro (Noche)</option>
                                  <option value="bg-purple-100 text-purple-800 border-purple-300">Morado</option>
                                  <option value="bg-pink-100 text-pink-800 border-pink-300">Rosa</option>
                                  <option value="bg-teal-100 text-teal-800 border-teal-300">Turquesa</option>
                              </select>
                              <button 
                                  onClick={() => {
                                      if(newShiftType.name && newShiftType.startTime && newShiftType.endTime) {
                                          createShiftType(newShiftType as any);
                                          setNewShiftType({ name: '', startTime: '', endTime: '', color: 'bg-blue-100 text-blue-800 border-blue-300' });
                                      }
                                  }} 
                                  className="w-full py-2 bg-slate-800 text-white rounded text-sm hover:bg-slate-700"
                              >
                                  Crear Turno
                              </button>
                          </div>
                      </div>
                  </div>

                  {/* Right: Visual Planner (Placeholder for simplicity, referring to Calendar page) */}
                  <div className="lg:col-span-2 bg-white p-8 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                      <CalendarDays size={64} className="text-slate-300 mb-4" />
                      <h3 className="text-xl font-bold text-slate-800">Gestor Visual de Turnos</h3>
                      <p className="text-slate-500 max-w-md mt-2 mb-6">
                          Utiliza la vista de Calendario completa para asignar turnos de forma visual, pintar días y gestionar cuadrantes.
                      </p>
                      <a href="#/calendar" className="px-6 py-3 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors shadow-lg">
                          Ir al Calendario de Gestión
                      </a>
                  </div>
              </div>
          </div>
      );
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Panel de Administración</h2>
      
      {/* Tabs Navigation */}
      <div className="flex space-x-1 border-b border-slate-200 overflow-x-auto">
          <button onClick={() => setActiveTab('users')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'users' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              Usuarios
          </button>
          <button onClick={() => setActiveTab('depts')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'depts' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              Departamentos
          </button>
          <button onClick={() => setActiveTab('absences')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'absences' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              Tipos Ausencia
          </button>
          <button onClick={() => setActiveTab('shifts')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'shifts' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              Turnos
          </button>
          <button onClick={() => setActiveTab('config')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'config' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              Comunicaciones
          </button>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'depts' && <DeptsTab />}
          {activeTab === 'config' && <ConfigTab />}
          {activeTab === 'shifts' && <ShiftsTab />}
          
          {activeTab === 'absences' && (
              <div className="space-y-4">
                  <div className="flex justify-between items-center">
                      <h3 className="text-lg font-bold">Tipos de Ausencia</h3>
                      <button onClick={() => createAbsenceType({ name: 'Nueva Ausencia', color: 'bg-gray-100 text-gray-800', isClosedRange: false })} className="px-4 py-2 bg-slate-800 text-white rounded flex items-center"><Plus size={16} className="mr-2"/> Crear</button>
                  </div>
                  <div className="grid gap-4">
                      {absenceTypes.map(t => (
                          <div key={t.id} className="p-4 bg-white border rounded flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                  <span className={`px-2 py-1 rounded text-xs font-bold ${t.color}`}>{t.name}</span>
                                  {t.deductsDays && <span className="text-xs text-red-500 font-bold border border-red-100 bg-red-50 px-1 rounded">Descuenta</span>}
                              </div>
                              <button onClick={() => deleteAbsenceType(t.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                          </div>
                      ))}
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};

export default AdminPanel;
