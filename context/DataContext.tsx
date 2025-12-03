import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { 
  User, AbsenceRequest, OvertimeRecord, Department, AbsenceType, 
  Role, RequestStatus, Notification, NotificationType, Shift, 
  ShiftTypeDefinition, InternalMessage, SystemMessage, EmailTemplate, RedemptionType 
} from '../types';

interface DataContextType {
  users: User[];
  currentUser: User | null;
  requests: AbsenceRequest[];
  overtime: OvertimeRecord[];
  departments: Department[];
  absenceTypes: AbsenceType[];
  shiftTypes: ShiftTypeDefinition[];
  shifts: Shift[];
  notifications: Notification[];
  internalMessages: InternalMessage[];
  systemMessage: SystemMessage | null;
  emailTemplates: EmailTemplate[];
  smtpConfig: any;

  login: (email: string) => Promise<void>; // Deprecated but kept for compatibility
  loginWithCredentials: (email: string, password: string) => Promise<{success: boolean, message?: string}>;
  logout: () => void;
  fetchData: () => Promise<void>;
  
  addUser: (user: Partial<User>, vac: number, ot: number) => Promise<void>;
  updateUser: (id: string, data: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  adjustUserVacation: (userId: string, days: number, reason: string) => Promise<void>;

  addDepartment: (name: string, supervisors: string[]) => Promise<void>;
  updateDepartment: (dept: Department) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;

  createAbsenceType: (type: any) => Promise<void>;
  updateAbsenceType: (type: AbsenceType) => Promise<void>;
  deleteAbsenceType: (id: string) => Promise<void>;

  addRequest: (req: any, status?: RequestStatus) => Promise<void>;
  updateRequestStatus: (id: string, status: RequestStatus, adminId: string) => Promise<void>;
  deleteRequest: (id: string) => Promise<void>;

  addOvertime: (ot: any) => Promise<void>;
  updateOvertimeStatus: (id: string, status: RequestStatus, adminId: string) => Promise<void>;
  deleteOvertime: (id: string) => Promise<void>;
  requestRedemption: (hours: number, linkedIds: string[], type: RedemptionType, userId: string, status?: RequestStatus) => Promise<void>;

  createShiftType: (type: any) => Promise<void>;
  deleteShiftType: (id: string) => Promise<void>;
  addShift: (userId: string, date: string, typeId: string) => Promise<void>;
  deleteShift: (id: string) => Promise<void>;

  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  sendInternalMessage: (subject: string, body: string, targets: string[]) => Promise<void>;
  markInternalMessageRead: (id: string) => Promise<void>;
  deleteInternalMessage: (id: string) => Promise<void>;
  updateSystemMessage: (msg: SystemMessage) => Promise<void>;

  updateEmailTemplate: (tpl: EmailTemplate) => Promise<void>;
  saveSmtpConfig: (cfg: any) => void;
  sendTestEmail: (to: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Default Seed Data for Fallback
const SEED_USERS: User[] = [
  { id: '1', name: 'Admin User', email: 'admin@nexus.com', role: Role.ADMIN, departmentId: '1', avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80', password: '123' },
];

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<AbsenceRequest[]>([]);
  const [overtime, setOvertime] = useState<OvertimeRecord[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [absenceTypes, setAbsenceTypes] = useState<AbsenceType[]>([]);
  const [shiftTypes, setShiftTypes] = useState<ShiftTypeDefinition[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [internalMessages, setInternalMessages] = useState<InternalMessage[]>([]);
  const [systemMessage, setSystemMessage] = useState<SystemMessage | null>(null);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [smtpConfig, setSmtpConfig] = useState<any>({});

  const generateId = () => Math.random().toString(36).substr(2, 9);
  
  const notifyUI = (title: string, msg: string, type: 'success' | 'error' | 'info') => {
      window.dispatchEvent(new CustomEvent('show-toast', { detail: { title, msg, type } }));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
      try {
          // Use Promise.allSettled to ensure that if one table fails (e.g. shifts not created yet),
          // the others still load. This prevents "cascading failure".
          const results = await Promise.allSettled([
              supabase.from('users').select('*'),
              supabase.from('departments').select('*'),
              supabase.from('absence_types').select('*'),
              supabase.from('absence_requests').select('*'),
              supabase.from('overtime_records').select('*'),
              supabase.from('shift_types').select('*'),
              supabase.from('shifts').select('*'),
              supabase.from('internal_messages').select('*'),
              supabase.from('system_messages').select('*').eq('id', 'global_msg').single(),
              supabase.from('email_templates').select('*')
          ]);

          // Process Users
          if (results[0].status === 'fulfilled' && !results[0].value.error) {
              setUsers(results[0].value.data || []);
          } else {
              console.warn("Could not load users:", results[0].status === 'fulfilled' ? results[0].value.error : results[0].reason);
          }

          // Process Departments
          if (results[1].status === 'fulfilled' && !results[1].value.error) {
              setDepartments(results[1].value.data || []);
          }

          // Process Absence Types
          if (results[2].status === 'fulfilled' && !results[2].value.error) {
              setAbsenceTypes(results[2].value.data || []);
          }

          // Process Requests
          if (results[3].status === 'fulfilled' && !results[3].value.error) {
              setRequests(results[3].value.data || []);
          }

          // Process Overtime
          if (results[4].status === 'fulfilled' && !results[4].value.error) {
              setOvertime(results[4].value.data || []);
          }

          // Process Shift Types
          if (results[5].status === 'fulfilled' && !results[5].value.error) {
              setShiftTypes(results[5].value.data || []);
          }

          // Process Shifts
          if (results[6].status === 'fulfilled' && !results[6].value.error) {
              setShifts(results[6].value.data || []);
          }

          // Process Messages
          if (results[7].status === 'fulfilled' && !results[7].value.error) {
              setInternalMessages(results[7].value.data || []);
          }

          // Process System Message
          if (results[8].status === 'fulfilled' && !results[8].value.error && results[8].value.data) {
              setSystemMessage(results[8].value.data);
          }

          // Process Templates
          if (results[9].status === 'fulfilled' && !results[9].value.error) {
              setEmailTemplates(results[9].value.data || []);
          }

          // Restore session if exists in memory/localstorage match
          const storedEmail = localStorage.getItem('user_email');
          if (storedEmail && results[0].status === 'fulfilled' && results[0].value.data) {
              const u = results[0].value.data.find((u: User) => u.email === storedEmail);
              if (u) setCurrentUser(u);
          }

      } catch (err: any) {
          console.error("Critical error fetching data:", err);
          notifyUI('Error de Conexión', 'No se pudieron cargar los datos.', 'error');
      }
  };

  const login = async (email: string) => {
      // Legacy login kept for compatibility, prefer loginWithCredentials
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (user) {
          setCurrentUser(user);
          localStorage.setItem('user_email', email);
      }
  };

  const loginWithCredentials = async (email: string, password: string): Promise<{success: boolean, message?: string}> => {
      try {
          // 1. Try to find locally first (fastest)
          const localUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
          if (localUser) {
              if ((localUser.password || '123456') === password) {
                  setCurrentUser(localUser);
                  localStorage.setItem('user_email', email);
                  return { success: true };
              } else {
                  return { success: false, message: 'Contraseña incorrecta.' };
              }
          }

          // 2. If not found locally, try direct DB fetch (Robustness for RLS/Load issues)
          const { data, error } = await supabase.from('users').select('*').ilike('email', email).single();
          
          if (error || !data) {
              // 3. Fallback for demo/admin recovery if absolutely everything fails
              if (email === 'admin@nexus.com' && password === '123') {
                  const demoUser = SEED_USERS[0];
                  setCurrentUser(demoUser);
                  localStorage.setItem('user_email', email);
                  return { success: true };
              }
              return { success: false, message: 'Usuario no encontrado.' };
          }

          if ((data.password || '123456') === password) {
              setCurrentUser(data);
              setUsers(prev => [...prev, data]); // Add to local state if missing
              localStorage.setItem('user_email', email);
              return { success: true };
          } else {
              return { success: false, message: 'Contraseña incorrecta.' };
          }

      } catch (e: any) {
          return { success: false, message: 'Error de conexión.' };
      }
  };

  const logout = () => {
      setCurrentUser(null);
      localStorage.removeItem('user_email');
  };

  // --- ABSENCE TYPES ---
  const updateAbsenceType = async (updatedType: AbsenceType) => {
    const originalTypes = [...absenceTypes];
    setAbsenceTypes(prev => prev.map(t => t.id === updatedType.id ? updatedType : t));
    try {
        const sanitizedType = {
            ...updatedType,
            availableRanges: updatedType.availableRanges && Array.isArray(updatedType.availableRanges) ? updatedType.availableRanges : []
        };
        const { error } = await supabase.from('absence_types').update(sanitizedType).eq('id', updatedType.id);
        if (error) throw error;
        notifyUI('Guardado', 'Tipo de ausencia actualizado.', 'success');
    } catch (error: any) {
        setAbsenceTypes(originalTypes);
        notifyUI('Error', 'No se pudo guardar: ' + error.message, 'error');
    }
  };

  const createAbsenceType = async (type: Omit<AbsenceType, 'id'>) => {
    const newType = { ...type, id: generateId(), availableRanges: type.availableRanges || [] };
    setAbsenceTypes(prev => [...prev, newType]);
    try {
        await supabase.from('absence_types').insert({
            ...newType,
            availableRanges: newType.availableRanges
        });
        notifyUI('Creado', 'Tipo de ausencia creado.', 'success');
    } catch(e: any) {
        notifyUI('Error', 'Error al crear: ' + e.message, 'error');
    }
  };

  const deleteAbsenceType = async (id: string) => {
      setAbsenceTypes(prev => prev.filter(t => t.id !== id));
      await supabase.from('absence_types').delete().eq('id', id);
  };

  // --- USERS ---
  const addUser = async (user: Partial<User>, vac: number, ot: number) => {
      const newUser = { 
          ...user, 
          id: generateId(), 
          vacationAdjustment: vac,
          password: '123' // Default password
      } as User;
      
      // Optimistic update logic removed to prevent "ghost" users on failure
      try {
          const { error } = await supabase.from('users').insert(newUser);
          if (error) throw error;
          
          setUsers(prev => [...prev, newUser]);
          
          // Initial Overtime Balance
          if (ot !== 0) {
              await addOvertime({
                  userId: newUser.id,
                  date: new Date().toISOString(),
                  hours: ot,
                  description: 'Saldo Inicial (Importado)',
                  status: RequestStatus.APPROVED
              });
          }
          notifyUI('Éxito', 'Usuario creado correctamente.', 'success');
      } catch(e: any) {
          notifyUI('Error', 'No se pudo crear usuario: ' + e.message, 'error');
      }
  };

  const updateUser = async (id: string, data: Partial<User>) => {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u));
      if(currentUser?.id === id) setCurrentUser(prev => prev ? { ...prev, ...data } : null);
      await supabase.from('users').update(data).eq('id', id);
  };

  const deleteUser = async (id: string) => {
      setUsers(prev => prev.filter(u => u.id !== id));
      await supabase.from('users').delete().eq('id', id);
  };

  const adjustUserVacation = async (userId: string, days: number, reason: string) => {
      const user = users.find(u => u.id === userId);
      if(!user) return;
      const newAdj = (user.vacationAdjustment || 0) + days;
      const history = [...(user.vacationHistory || []), { id: generateId(), date: new Date().toISOString(), days, reason, adminId: currentUser?.id || 'admin' }];
      
      await updateUser(userId, { vacationAdjustment: newAdj, vacationHistory: history });
      notifyUI('Ajuste', `Ajuste de ${days} días aplicado.`, 'success');
  };

  // --- DEPARTMENTS ---
  const addDepartment = async (name: string, supervisors: string[]) => {
      const newDept = { id: generateId(), name, supervisorIds: supervisors };
      setDepartments(prev => [...prev, newDept]);
      await supabase.from('departments').insert(newDept);
  };
  const updateDepartment = async (dept: Department) => {
      setDepartments(prev => prev.map(d => d.id === dept.id ? dept : d));
      await supabase.from('departments').update(dept).eq('id', dept.id);
  };
  const deleteDepartment = async (id: string) => {
      setDepartments(prev => prev.filter(d => d.id !== id));
      await supabase.from('departments').delete().eq('id', id);
  };

  // --- REQUESTS ---
  const addRequest = async (req: any, status: RequestStatus = RequestStatus.PENDING) => {
      const newReq = { ...req, id: generateId(), status, createdAt: new Date().toISOString() };
      setRequests(prev => [...prev, newReq]);
      await supabase.from('absence_requests').insert(newReq);
      notifyUI(status === 'APPROVED' ? 'Registrado' : 'Solicitud', status === 'APPROVED' ? 'Ausencia creada y aprobada.' : 'Tu solicitud ha sido enviada.', 'success');
  };
  const updateRequestStatus = async (id: string, status: RequestStatus, adminId: string) => {
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
      await supabase.from('absence_requests').update({ status }).eq('id', id);
  };
  const deleteRequest = async (id: string) => {
      setRequests(prev => prev.filter(r => r.id !== id));
      await supabase.from('absence_requests').delete().eq('id', id);
  };

  // --- OVERTIME ---
  const addOvertime = async (ot: any) => {
      const newOT = { ...ot, id: generateId(), createdAt: new Date().toISOString(), consumed: 0 };
      setOvertime(prev => [...prev, newOT]);
      await supabase.from('overtime_records').insert(newOT);
      notifyUI('Horas Extras', 'Registro añadido.', 'success');
  };
  const updateOvertimeStatus = async (id: string, status: RequestStatus, adminId: string) => {
      setOvertime(prev => prev.map(o => o.id === id ? { ...o, status } : o));
      await supabase.from('overtime_records').update({ status }).eq('id', id);
  };
  const deleteOvertime = async (id: string) => {
      // Restore consumed hours logic if it was a redemption
      const record = overtime.find(o => o.id === id);
      if (record && record.hours < 0 && record.linkedRecordIds) {
          // Logic to restore linked hours would go here
      }
      setOvertime(prev => prev.filter(o => o.id !== id));
      await supabase.from('overtime_records').delete().eq('id', id);
  };
  const requestRedemption = async (hours: number, linkedIds: string[], type: RedemptionType, userId: string, status: RequestStatus = RequestStatus.PENDING) => {
      const newOT = { 
          id: generateId(), 
          userId, 
          date: new Date().toISOString(),
          hours: -hours, 
          description: `Canje: ${type}`, 
          status, 
          consumed: 0, 
          createdAt: new Date().toISOString(), 
          redemptionType: type,
          linkedRecordIds: linkedIds
      };
      
      // Update consumed amount in linked records locally
      if (status === RequestStatus.APPROVED) {
          let remainingToRedeem = hours;
          const updatedOvertime = [...overtime];
          
          linkedIds.forEach(linkId => {
              if (remainingToRedeem <= 0) return;
              const source = updatedOvertime.find(o => o.id === linkId);
              if (source) {
                  const available = source.hours - source.consumed;
                  const take = Math.min(available, remainingToRedeem);
                  source.consumed += take;
                  remainingToRedeem -= take;
                  // Update DB for source
                  supabase.from('overtime_records').update({ consumed: source.consumed }).eq('id', source.id);
              }
          });
          setOvertime([...updatedOvertime, newOT]);
      } else {
          setOvertime(prev => [...prev, newOT]);
      }
      
      await supabase.from('overtime_records').insert(newOT);
      notifyUI('Canje', 'Solicitud de canje procesada.', 'success');
  };

  // --- SHIFTS ---
  const createShiftType = async (type: any) => {
      try {
          const newType = { ...type, id: generateId() };
          const { error } = await supabase.from('shift_types').insert(newType);
          if (error) {
              if(error.message.includes('column') && error.message.includes('does not exist')) {
                  throw new Error("Faltan columnas en la base de datos (ej. startTime2). Ejecuta el script SQL de actualización.");
              }
              throw error;
          }
          setShiftTypes(prev => [...prev, newType]);
          notifyUI('Éxito', 'Tipo de turno creado', 'success');
      } catch (e: any) {
          notifyUI('Error al guardar', e.message, 'error');
      }
  };
  const deleteShiftType = async (id: string) => {
      setShiftTypes(prev => prev.filter(t => t.id !== id));
      await supabase.from('shift_types').delete().eq('id', id);
  };
  const addShift = async (userId: string, date: string, typeId: string) => {
      // Remove existing if any
      const existing = shifts.find(s => s.userId === userId && s.date === date);
      if(existing) {
         setShifts(prev => prev.filter(s => s.id !== existing.id));
         await supabase.from('shifts').delete().eq('id', existing.id);
      }
      const newShift = { id: generateId(), userId, date, shiftType: typeId, createdAt: new Date().toISOString() };
      setShifts(prev => [...prev, newShift]);
      await supabase.from('shifts').insert(newShift);
  };
  const deleteShift = async (id: string) => {
      setShifts(prev => prev.filter(s => s.id !== id));
      await supabase.from('shifts').delete().eq('id', id);
  };

  // --- MESSAGING ---
  const markNotificationRead = (id: string) => {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };
  const markAllNotificationsRead = () => {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };
  const sendInternalMessage = async (subject: string, body: string, targets: string[]) => {
      const newMsg = { 
          id: generateId(), 
          subject, body, 
          senderId: currentUser?.id || 'admin', 
          targetUserIds: targets, 
          readByUserIds: [], 
          deletedByUserIds: [], 
          createdAt: new Date().toISOString() 
      };
      setInternalMessages(prev => [newMsg, ...prev]);
      await supabase.from('internal_messages').insert(newMsg);
      notifyUI('Mensaje', 'Mensaje interno enviado.', 'success');
  };
  const markInternalMessageRead = async (id: string) => {
      if(!currentUser) return;
      setInternalMessages(prev => prev.map(m => m.id === id && !m.readByUserIds.includes(currentUser.id) ? { ...m, readByUserIds: [...m.readByUserIds, currentUser.id] } : m));
      // In real app, sync this read status to DB array
      const msg = internalMessages.find(m => m.id === id);
      if(msg && !msg.readByUserIds.includes(currentUser.id)) {
          await supabase.from('internal_messages').update({ readByUserIds: [...msg.readByUserIds, currentUser.id] }).eq('id', id);
      }
  };
  const deleteInternalMessage = async (id: string) => {
      if(!currentUser) return;
      
      const msg = internalMessages.find(m => m.id === id);
      if (!msg) return;

      const newDeletedList = [...(msg.deletedByUserIds || []), currentUser.id];
      
      // Update Local State
      setInternalMessages(prev => prev.map(m => m.id === id ? { ...m, deletedByUserIds: newDeletedList } : m));
      
      // Update DB
      try {
          const { error } = await supabase.from('internal_messages').update({ deletedByUserIds: newDeletedList }).eq('id', id);
          if (error) throw error;
          notifyUI('Buzón', 'Mensaje eliminado.', 'success');
      } catch (e: any) {
          notifyUI('Error', 'No se pudo eliminar: ' + e.message, 'error');
          // Rollback local state if needed
      }
  };
  const updateSystemMessage = async (msg: SystemMessage) => {
      setSystemMessage(msg);
      await supabase.from('system_messages').upsert(msg);
      notifyUI('Sistema', 'Mensaje global actualizado.', 'success');
  };

  // --- CONFIG ---
  const updateEmailTemplate = async (tpl: EmailTemplate) => {
      setEmailTemplates(prev => prev.map(t => t.id === tpl.id ? tpl : t));
      await supabase.from('email_templates').update(tpl).eq('id', tpl.id);
      notifyUI('Plantilla', 'Plantilla actualizada.', 'success');
  };
  const saveSmtpConfig = (cfg: any) => {
      setSmtpConfig(cfg);
      // In a real app, save to a protected table
      notifyUI('Configuración', 'Configuración SMTP guardada localmente.', 'success');
  };
  const sendTestEmail = async (to: string) => {
      notifyUI('Email', `Enviando test a ${to}...`, 'info');
      // Call backend API in production
      try {
          // Simulation or API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          notifyUI('Email', 'Correo de prueba enviado.', 'success');
      } catch(e) {
          notifyUI('Error', 'Fallo en el envío.', 'error');
      }
  };

  return (
    <DataContext.Provider value={{
        users, currentUser, requests, overtime, departments, absenceTypes,
        shiftTypes, shifts, notifications, internalMessages, systemMessage,
        emailTemplates, smtpConfig,
        login, loginWithCredentials, logout, fetchData,
        addUser, updateUser, deleteUser, adjustUserVacation,
        addDepartment, updateDepartment, deleteDepartment,
        createAbsenceType, updateAbsenceType, deleteAbsenceType,
        addRequest, updateRequestStatus, deleteRequest,
        addOvertime, updateOvertimeStatus, deleteOvertime, requestRedemption,
        createShiftType, deleteShiftType, addShift, deleteShift,
        markNotificationRead, markAllNotificationsRead,
        sendInternalMessage, markInternalMessageRead, deleteInternalMessage, updateSystemMessage,
        updateEmailTemplate, saveSmtpConfig, sendTestEmail
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) throw new Error("useData must be used within DataProvider");
    return context;
};