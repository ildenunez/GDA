import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, Department, AbsenceType, AbsenceRequest, OvertimeRecord, Notification, Role, RequestStatus, NotificationType, RedemptionType, VacationLogEntry, EmailTemplate, Shift, ShiftType, ShiftTypeDefinition, SystemMessage } from '../types';
import { supabase } from '../services/supabaseClient';

// Helper generators
const generateId = () => Math.random().toString(36).substr(2, 9);

interface EmailConfig {
    serviceId: string;
    templateId: string;
    publicKey: string;
}

interface SMTPConfig {
    host: string;
    port: string;
    user: string;
    pass: string;
    secure: boolean;
}

interface DataContextType {
  currentUser: User | null;
  users: User[];
  departments: Department[];
  absenceTypes: AbsenceType[];
  shiftTypes: ShiftTypeDefinition[];
  requests: AbsenceRequest[];
  overtime: OvertimeRecord[];
  notifications: Notification[];
  emailTemplates: EmailTemplate[];
  shifts: Shift[];
  systemMessage: SystemMessage | null;
  emailConfig: EmailConfig;
  smtpConfig: SMTPConfig;
  isLoading: boolean;
  login: (email: string) => void;
  logout: () => void;
  updateUser: (id: string, data: Partial<User>) => void;
  adjustUserVacation: (userId: string, days: number, reason: string) => void;
  addUser: (user: Omit<User, 'id' | 'vacationAdjustment'>, initialVacation?: number, initialOvertime?: number) => void;
  deleteUser: (id: string) => void;
  addRequest: (req: Omit<AbsenceRequest, 'id' | 'status' | 'createdAt'>, initialStatus?: RequestStatus) => void;
  updateRequestStatus: (id: string, status: RequestStatus, reviewerId: string) => void;
  deleteRequest: (id: string) => void; 
  addOvertime: (rec: Omit<OvertimeRecord, 'id' | 'status' | 'consumed' | 'createdAt'> & { status?: RequestStatus }) => void;
  updateOvertimeStatus: (id: string, status: RequestStatus, reviewerId: string) => void;
  deleteOvertime: (id: string) => void; 
  requestRedemption: (hours: number, recordIds: string[], type: RedemptionType, userId?: string, initialStatus?: RequestStatus) => void;
  sendNotification: (userId: string, title: string, message: string, type: NotificationType) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  
  // Shift Management
  addShift: (userId: string, date: string, typeId: string) => void;
  deleteShift: (id: string) => void;
  createShiftType: (type: Omit<ShiftTypeDefinition, 'id'>) => void;
  updateShiftType: (type: ShiftTypeDefinition) => void;
  deleteShiftType: (id: string) => void;
  
  // Admin Functions
  updateAbsenceType: (type: AbsenceType) => void;
  createAbsenceType: (type: Omit<AbsenceType, 'id'>) => void;
  deleteAbsenceType: (id: string) => void;
  addDepartment: (name: string, supervisorIds?: string[]) => void;
  updateDepartment: (dept: Department) => void;
  deleteDepartment: (id: string) => void;
  updateEmailTemplate: (template: EmailTemplate) => void;
  saveEmailConfig: (config: EmailConfig) => void;
  saveSmtpConfig: (config: SMTPConfig) => void;
  sendTestEmail: (toEmail: string) => void;
  updateSystemMessage: (msg: SystemMessage) => void;
  
  // Data Management
  importDatabase: (data: any) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// --- INITIAL DATA FOR SEEDING ---
const SEED_DEPARTMENTS: Department[] = [
  { id: 'd1', name: 'Desarrollo', supervisorIds: ['u2'] },
  { id: 'd2', name: 'Marketing', supervisorIds: ['u2'] },
  { id: 'd3', name: 'Recursos Humanos', supervisorIds: [] }
];

const SEED_USERS: User[] = [
  { 
    id: 'u1', 
    name: 'Juan Perez', 
    email: 'juan@nexus.com', 
    role: Role.WORKER, 
    departmentId: 'd1', 
    avatarUrl: 'https://ui-avatars.com/api/?name=Juan+Perez&background=0D8ABC&color=fff',
    vacationAdjustment: 0,
    vacationHistory: [],
    password: '123',
    calendarColor: '#3b82f6' // Blue
  },
  { 
    id: 'u2', 
    name: 'Laura Gomez', 
    email: 'laura@nexus.com', 
    role: Role.SUPERVISOR, 
    departmentId: 'd1', 
    avatarUrl: 'https://ui-avatars.com/api/?name=Laura+Gomez&background=10B981&color=fff',
    vacationAdjustment: 0,
    vacationHistory: [],
    password: '123',
    calendarColor: '#10b981' // Green
  },
  { 
    id: 'u3', 
    name: 'Carlos Admin', 
    email: 'admin@nexus.com', 
    role: Role.ADMIN, 
    departmentId: 'd3', 
    avatarUrl: 'https://ui-avatars.com/api/?name=Carlos+Admin&background=8B5CF6&color=fff',
    vacationAdjustment: 0,
    vacationHistory: [],
    password: '123',
    calendarColor: '#8b5cf6' // Purple
  }
];

const SEED_ABSENCE_TYPES: AbsenceType[] = [
  { id: 't1', name: 'Vacaciones', isClosedRange: false, color: 'bg-blue-100 text-blue-800', deductsDays: true },
  { id: 't2', name: 'Baja Médica', isClosedRange: false, color: 'bg-green-100 text-green-800', deductsDays: false },
  { id: 't3', name: 'Asuntos Propios', isClosedRange: false, color: 'bg-purple-100 text-purple-800', allowanceDays: 2, deductsDays: true },
  { id: 't4', name: 'Navidad (Cerrado)', isClosedRange: true, availableRanges: [{ start: '2023-12-24', end: '2023-12-31' }], color: 'bg-red-100 text-red-800', deductsDays: false }
];

const SEED_SHIFT_TYPES: ShiftTypeDefinition[] = [
    { id: 'MORNING', name: 'Mañana', color: 'bg-amber-100 text-amber-800 border-amber-300', startTime: '08:00', endTime: '15:00' },
    { id: 'AFTERNOON', name: 'Tarde', color: 'bg-indigo-100 text-indigo-800 border-indigo-300', startTime: '15:00', endTime: '22:00' },
    { id: 'NIGHT', name: 'Noche', color: 'bg-slate-800 text-slate-200 border-slate-600', startTime: '22:00', endTime: '06:00' }
];

const SEED_EMAIL_TEMPLATES: EmailTemplate[] = [
    { id: 'et1', eventType: 'WELCOME', name: 'Bienvenida Usuario', subject: 'Bienvenido a RRHH CHS', body: 'Hola {{name}}, tu cuenta ha sido creada correctamente. Accede para gestionar tus turnos y vacaciones.', recipients: [Role.WORKER, Role.SUPERVISOR, Role.ADMIN] },
    { id: 'et2', eventType: 'REQUEST_CREATED', name: 'Nueva Solicitud Ausencia (Aviso)', subject: 'Nueva Solicitud de {{name}}', body: 'El usuario {{name}} ha creado una solicitud de ausencia.\n\nFechas: del {{startDate}} al {{endDate}}\nTotal: {{days}} días\nMotivo: {{comment}}', recipients: [Role.SUPERVISOR, Role.ADMIN] },
    { id: 'et3', eventType: 'REQUEST_APPROVED', name: 'Ausencia Aprobada', subject: 'Solicitud Aprobada', body: 'Hola {{name}}, tu solicitud de ausencia ha sido APROBADA.\n\nFechas: {{startDate}} al {{endDate}}\nDuración: {{days}} días.', recipients: [Role.WORKER, Role.SUPERVISOR, Role.ADMIN] },
    { id: 'et4', eventType: 'REQUEST_REJECTED', name: 'Ausencia Rechazada', subject: 'Solicitud Rechazada', body: 'Hola {{name}}, tu solicitud de ausencia ha sido RECHAZADA.\n\nFechas: {{startDate}} al {{endDate}}\nDuración: {{days}} días.', recipients: [Role.WORKER, Role.SUPERVISOR, Role.ADMIN] },
    { id: 'et5', eventType: 'OVERTIME_CREATED', name: 'Registro Horas (Aviso)', subject: 'Registro Horas: {{name}}', body: '{{name}} ha registrado horas extras.\n\nFecha: {{date}}\nCantidad: {{hours}} horas\nMotivo: {{description}}', recipients: [Role.SUPERVISOR, Role.ADMIN] },
    { id: 'et6', eventType: 'REDEMPTION_CREATED', name: 'Consumo Horas (Aviso)', subject: 'Solicitud Canje: {{name}}', body: '{{name}} solicita canjear horas.\n\nCantidad: {{hours}} horas\nTipo: {{type}}', recipients: [Role.SUPERVISOR, Role.ADMIN] },
    { id: 'et7', eventType: 'OVERTIME_APPROVED', name: 'Horas/Canje Aprobado', subject: 'Registro Aprobado', body: 'Tu registro de horas/canje ha sido APROBADO.\n\nFecha: {{date}}\nCantidad: {{hours}}h\nConcepto: {{description}}', recipients: [Role.WORKER, Role.SUPERVISOR, Role.ADMIN] },
    { id: 'et8', eventType: 'OVERTIME_REJECTED', name: 'Horas/Canje Rechazado', subject: 'Registro Rechazado', body: 'Tu registro de horas/canje ha sido RECHAZADO.\n\nFecha: {{date}}\nCantidad: {{hours}}h\nConcepto: {{description}}', recipients: [Role.WORKER, Role.SUPERVISOR, Role.ADMIN] },
    { id: 'et9', eventType: 'REQUEST_RECEIVED', name: 'Confirmación Solicitud', subject: 'Solicitud Recibida', body: 'Hola {{name}}, hemos recibido tu solicitud.\n\nDetalle: {{details}}\nQueda pendiente de aprobación.', recipients: [Role.WORKER, Role.SUPERVISOR, Role.ADMIN] },
    { id: 'et10', eventType: 'REQUEST_CANCELLED', name: 'Solicitud Cancelada', subject: 'Solicitud Cancelada', body: 'Hola {{name}}, has eliminado correctamente tu solicitud.', recipients: [Role.WORKER, Role.SUPERVISOR, Role.ADMIN] },
];

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [absenceTypes, setAbsenceTypes] = useState<AbsenceType[]>([]);
  const [shiftTypes, setShiftTypes] = useState<ShiftTypeDefinition[]>([]);
  const [requests, setRequests] = useState<AbsenceRequest[]>([]);
  const [overtime, setOvertime] = useState<OvertimeRecord[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [systemMessage, setSystemMessage] = useState<SystemMessage | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Email Configuration
  const [emailConfig, setEmailConfig] = useState<EmailConfig>({
      serviceId: localStorage.getItem('emailjs_service_id') || '',
      templateId: localStorage.getItem('emailjs_template_id') || '',
      publicKey: localStorage.getItem('emailjs_public_key') || ''
  });

  // SMTP Configuration
  const [smtpConfig, setSmtpConfig] = useState<SMTPConfig>({
      host: localStorage.getItem('smtp_host') || '',
      port: localStorage.getItem('smtp_port') || '587',
      user: localStorage.getItem('smtp_user') || '',
      pass: localStorage.getItem('smtp_pass') || '',
      secure: localStorage.getItem('smtp_secure') === 'true'
  });

  const notifyUI = (title: string, msg: string, type: 'success' | 'error' | 'info' = 'info') => {
      const event = new CustomEvent('show-toast', { detail: { title, msg, type } });
      window.dispatchEvent(event);
  };

  // --- SUPABASE FETCHING ---
  const fetchData = async () => {
    setIsLoading(true);
    try {
        const { data: usersData } = await supabase.from('users').select('*');
        const { data: deptsData } = await supabase.from('departments').select('*');
        const { data: typesData } = await supabase.from('absence_types').select('*');
        const { data: shiftTypesData } = await supabase.from('shift_types').select('*');
        const { data: reqsData } = await supabase.from('requests').select('*');
        const { data: otData } = await supabase.from('overtime').select('*');
        const { data: notifData } = await supabase.from('notifications').select('*');
        const { data: templData } = await supabase.from('email_templates').select('*');
        const { data: shiftsData } = await supabase.from('shifts').select('*');
        const { data: msgData } = await supabase.from('system_messages').select('*').eq('id', 'global_msg').single();

        if ((!usersData || usersData.length === 0) && (!deptsData || deptsData.length === 0)) {
            console.log("Database empty. Seeding initial data...");
            await seedDatabase();
            return; 
        }

        if (usersData) setUsers(usersData);
        if (deptsData) setDepartments(deptsData);
        if (typesData) setAbsenceTypes(typesData);
        
        if (!shiftTypesData || shiftTypesData.length === 0) {
            await supabase.from('shift_types').insert(SEED_SHIFT_TYPES);
            setShiftTypes(SEED_SHIFT_TYPES);
        } else {
            setShiftTypes(shiftTypesData);
        }
        
        if (reqsData) setRequests(reqsData);
        if (otData) setOvertime(otData);
        if (notifData) setNotifications(notifData);
        if (shiftsData) setShifts(shiftsData);
        if (msgData) setSystemMessage(msgData);
        
        if (!templData || templData.length === 0) {
             await supabase.from('email_templates').insert(SEED_EMAIL_TEMPLATES);
             setEmailTemplates(SEED_EMAIL_TEMPLATES);
        } else {
             // AUTO-PATCH: Check for templates with missing recipients OR new templates OR outdated bodies
             const updates: Partial<EmailTemplate>[] = [];
             const inserts: EmailTemplate[] = [];

             for (const t of templData) {
                 const seed = SEED_EMAIL_TEMPLATES.find(s => s.eventType === t.eventType);
                 if (seed) {
                     let needsUpdate = false;
                     let updatedTemplate = { ...t };

                     // 1. Check Roles
                     const missingRoles = seed.recipients.filter(r => !t.recipients?.includes(r));
                     if (missingRoles.length > 0 || !t.recipients) {
                         updatedTemplate.recipients = Array.from(new Set([...(t.recipients || []), ...seed.recipients]));
                         needsUpdate = true;
                     }

                     // 2. Check Body Content (Simple check: if it's too short or missing keywords like 'Fechas', replace with seed)
                     // This ensures old simple templates get updated to detailed ones automatically
                     if (t.body && seed.body.length > t.body.length + 20) {
                         updatedTemplate.body = seed.body;
                         needsUpdate = true;
                     }

                     if (needsUpdate) {
                         updates.push(updatedTemplate);
                     }
                 }
             }

             const existingTypes = templData.map(t => t.eventType);
             const missingTemplates = SEED_EMAIL_TEMPLATES.filter(t => !existingTypes.includes(t.eventType));
             if (missingTemplates.length > 0) {
                 inserts.push(...missingTemplates);
             }

             // Apply patches
             if (updates.length > 0) {
                 console.log(`[AUTO-PATCH] Updating ${updates.length} templates...`);
                 for (const u of updates) {
                     await supabase.from('email_templates').update({ 
                         recipients: u.recipients,
                         body: u.body 
                     }).eq('id', u.id);
                 }
             }
             
             if (inserts.length > 0) {
                 console.log(`[AUTO-PATCH] Inserting ${inserts.length} new templates...`);
                 await supabase.from('email_templates').insert(inserts);
             }

             if (updates.length > 0 || inserts.length > 0) {
                 const { data: refreshedTemplates } = await supabase.from('email_templates').select('*');
                 if (refreshedTemplates) setEmailTemplates(refreshedTemplates);
             } else {
                 setEmailTemplates(templData);
             }
        }

    } catch (error) {
        console.error("Error fetching data from Supabase:", error);
    } finally {
        setIsLoading(false);
    }
  };

  const seedDatabase = async () => {
      try {
          await supabase.from('departments').insert(SEED_DEPARTMENTS);
          await supabase.from('users').insert(SEED_USERS);
          await supabase.from('absence_types').insert(SEED_ABSENCE_TYPES);
          await supabase.from('shift_types').insert(SEED_SHIFT_TYPES);
          await supabase.from('email_templates').insert(SEED_EMAIL_TEMPLATES);
          // Initial System Message
          await supabase.from('system_messages').insert({
              id: 'global_msg', 
              text: 'Bienvenido a RRHH CHS', 
              active: true, 
              color: 'bg-blue-100 text-blue-800 border-blue-200'
          });
          fetchData();
      } catch (e) {
          console.error("Error seeding database:", e);
      }
  };

  useEffect(() => {
    fetchData();
    const channels = [
        supabase.channel('public:users').on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => fetchData()).subscribe(),
        supabase.channel('public:departments').on('postgres_changes', { event: '*', schema: 'public', table: 'departments' }, () => fetchData()).subscribe(),
        supabase.channel('public:absence_types').on('postgres_changes', { event: '*', schema: 'public', table: 'absence_types' }, () => fetchData()).subscribe(),
        supabase.channel('public:shift_types').on('postgres_changes', { event: '*', schema: 'public', table: 'shift_types' }, () => fetchData()).subscribe(),
        supabase.channel('public:requests').on('postgres_changes', { event: '*', schema: 'public', table: 'requests' }, () => fetchData()).subscribe(),
        supabase.channel('public:overtime').on('postgres_changes', { event: '*', schema: 'public', table: 'overtime' }, () => fetchData()).subscribe(),
        supabase.channel('public:notifications').on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => fetchData()).subscribe(),
        supabase.channel('public:email_templates').on('postgres_changes', { event: '*', schema: 'public', table: 'email_templates' }, () => fetchData()).subscribe(),
        supabase.channel('public:shifts').on('postgres_changes', { event: '*', schema: 'public', table: 'shifts' }, () => fetchData()).subscribe(),
        supabase.channel('public:system_messages').on('postgres_changes', { event: '*', schema: 'public', table: 'system_messages' }, () => fetchData()).subscribe(),
    ];
    return () => { channels.forEach(ch => supabase.removeChannel(ch)); };
  }, []);

  const parseTemplate = (text: string, vars: Record<string, string>) => {
      let result = text;
      Object.keys(vars).forEach(key => {
          result = result.replace(new RegExp(`{{${key}}}`, 'g'), vars[key]);
      });
      return result;
  };

  // Helper to calculate days between two dates
  const calculateDaysCount = (start: string, end: string) => {
      const s = new Date(start); s.setHours(12,0,0,0);
      const e = new Date(end); e.setHours(12,0,0,0);
      if (isNaN(s.getTime()) || isNaN(e.getTime())) return '0';
      const diff = Math.abs(e.getTime() - s.getTime());
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
      return String(days);
  };

  const sendEmailWithTemplate = async (eventType: string, toUser: User, variables: Record<string, string>) => {
      console.log(`[EMAIL] Attempting to send ${eventType} to ${toUser.email} (${toUser.role})`);
      const template = emailTemplates.find(t => t.eventType === eventType);
      
      if (!template) {
          console.warn(`[EMAIL] Template ${eventType} not found.`);
          return;
      }
      
      if (!template.recipients || !template.recipients.includes(toUser.role)) {
          console.warn(`[EMAIL] User role ${toUser.role} is not in recipient list for ${eventType}:`, template.recipients);
          return;
      }

      const subject = parseTemplate(template.subject, variables);
      const body = parseTemplate(template.body, variables);

      // PRIORITY 1: SMTP via Vercel API
      if (smtpConfig.host && smtpConfig.user && smtpConfig.pass) {
          try {
              console.log("[EMAIL] Sending via SMTP...");
              const response = await fetch('/api/send-email', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      to: toUser.email,
                      subject: subject,
                      html: body.replace(/\n/g, '<br>'),
                      config: smtpConfig
                  })
              });
              
              const result = await response.json();
              if (response.ok) {
                  if (eventType === 'WELCOME') notifyUI('Email Enviado', `Bienvenida enviada a ${toUser.email} (SMTP)`, 'success');
                  console.log("[EMAIL] SMTP Success");
                  return; // Successfully sent via SMTP
              } else {
                  console.warn("SMTP send failed, falling back if available:", result.error);
              }
          } catch (error) {
              console.error("SMTP API Error:", error);
          }
      }

      // PRIORITY 2: EmailJS Fallback
      if (emailConfig.serviceId && emailConfig.templateId && emailConfig.publicKey) {
          try {
             console.log("[EMAIL] Sending via EmailJS...");
             // @ts-ignore
             if (window.emailjs) {
                 // @ts-ignore
                 await window.emailjs.send(
                     emailConfig.serviceId,
                     emailConfig.templateId,
                     { to_email: toUser.email, subject: subject, message: body, to_name: toUser.name },
                     { publicKey: emailConfig.publicKey }
                 );
                 if (eventType === 'WELCOME') notifyUI('Email Enviado', `Bienvenida enviada a ${toUser.email}`, 'success');
                 console.log("[EMAIL] EmailJS Success");
             }
          } catch (error: any) {
              notifyUI('Error Email', `No se pudo enviar el correo: ${error.text || 'Error desconocido'}`, 'error');
              console.error("[EMAIL] EmailJS Error:", error);
          }
      }
  };

  const saveEmailConfig = (config: EmailConfig) => {
      localStorage.setItem('emailjs_service_id', config.serviceId);
      localStorage.setItem('emailjs_template_id', config.templateId);
      localStorage.setItem('emailjs_public_key', config.publicKey);
      setEmailConfig(config);
      notifyUI('Configuración Guardada', 'Las credenciales de EmailJS se han actualizado.', 'success');
  };

  const saveSmtpConfig = (config: SMTPConfig) => {
      localStorage.setItem('smtp_host', config.host);
      localStorage.setItem('smtp_port', config.port);
      localStorage.setItem('smtp_user', config.user);
      localStorage.setItem('smtp_pass', config.pass);
      localStorage.setItem('smtp_secure', String(config.secure));
      setSmtpConfig(config);
      notifyUI('Configuración SMTP Guardada', 'Los datos del servidor SMTP se han guardado localmente.', 'success');
  };
  
  const sendTestEmail = async (toEmail: string) => {
      if (!toEmail) {
          notifyUI('Error', 'Introduce un email para la prueba.', 'error');
          return;
      }

      const subject = "Prueba de Conexión RRHH CHS";
      const message = "Si estás leyendo esto, la integración de email funciona correctamente.";
      
      notifyUI('Enviando...', 'Iniciando prueba de envío...', 'info');

      // PRIORITY 1: SMTP
      if (smtpConfig.host && smtpConfig.user && smtpConfig.pass) {
          try {
              const response = await fetch('/api/send-email', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      to: toEmail,
                      subject: subject,
                      html: `<p>${message}</p><p>Enviado via SMTP</p>`,
                      config: smtpConfig
                  })
              });
              
              const result = await response.json();
              if (response.ok) {
                  notifyUI('Éxito SMTP', `Correo enviado a ${toEmail} usando tu servidor SMTP.`, 'success');
                  return;
              } else {
                  notifyUI('Error SMTP', `Falló SMTP: ${result.error}. Intentando EmailJS...`, 'error');
              }
          } catch (error: any) {
              notifyUI('Error API', `Error conectando con API de envío: ${error.message}`, 'error');
          }
      }
      
      // PRIORITY 2: EmailJS
      if (emailConfig.serviceId && emailConfig.templateId && emailConfig.publicKey) {
          try {
               // @ts-ignore
               if (window.emailjs) {
                   // @ts-ignore
                   await window.emailjs.send(
                       emailConfig.serviceId,
                       emailConfig.templateId,
                       { 
                           to_email: toEmail, 
                           subject: subject, 
                           message: message + " (Vía EmailJS)", 
                           to_name: "Administrador" 
                       },
                       { publicKey: emailConfig.publicKey }
                   );
                   notifyUI('Éxito EmailJS', `Correo de prueba enviado a ${toEmail}.`, 'success');
               }
          } catch (error: any) {
               console.error("EmailJS Error:", error);
               notifyUI('Error Envío', `EmailJS falló: ${error.text || error.message}`, 'error');
          }
      } else {
          notifyUI('Sin Configuración', 'No hay configuración SMTP ni EmailJS válida.', 'error');
      }
  };
  
  const updateSystemMessage = async (msg: SystemMessage) => {
      setSystemMessage(msg);
      await supabase.from('system_messages').upsert(msg);
      notifyUI('Mensaje Actualizado', 'El mensaje global se ha actualizado.', 'success');
  };

  const sendNotification = async (userId: string, title: string, message: string, type: NotificationType) => {
    const newNotif = {
      id: generateId(),
      userId,
      title,
      message,
      type,
      read: false,
      timestamp: new Date().toISOString()
    };
    setNotifications(prev => [newNotif, ...prev]);
    await supabase.from('notifications').insert(newNotif);
  };

  const login = (email: string) => {
    const user = users.find(u => u.email === email);
    if (user) setCurrentUser(user);
    else notifyUI('Error Login', 'Usuario no encontrado. Si acabas de conectar la BD, recarga.', 'error');
  };

  const logout = () => setCurrentUser(null);

  const updateUser = async (id: string, data: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u));
    if (currentUser?.id === id) setCurrentUser(prev => prev ? { ...prev, ...data } : null);
    await supabase.from('users').update(data).eq('id', id);
  };

  const adjustUserVacation = async (userId: string, days: number, reason: string) => {
      const user = users.find(u => u.id === userId);
      if (!user) return;
      const currentAdj = user.vacationAdjustment || 0;
      const newHistory: VacationLogEntry = {
          id: generateId(),
          date: new Date().toISOString(),
          days,
          reason,
          adminId: currentUser?.id || 'system'
      };
      const updatedHistory = [newHistory, ...(user.vacationHistory || [])];
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, vacationAdjustment: currentAdj + days, vacationHistory: updatedHistory } : u));
      await supabase.from('users').update({
          vacationAdjustment: currentAdj + days,
          vacationHistory: updatedHistory
      }).eq('id', userId);
      sendNotification(userId, 'Ajuste de Vacaciones', `Se han ${days > 0 ? 'añadido' : 'restado'} ${Math.abs(days)} días. Motivo: ${reason}`, NotificationType.INFO);
  };

  const addUser = async (user: Omit<User, 'id' | 'vacationAdjustment'>, initialVacation: number = 0, initialOvertime: number = 0) => {
    const newUserId = generateId();
    const newUser: User = {
        ...user,
        id: newUserId,
        password: '123',
        vacationAdjustment: initialVacation,
        vacationHistory: initialVacation !== 0 ? [{ id: generateId(), date: new Date().toISOString(), days: initialVacation, reason: 'Saldo Inicial', adminId: currentUser?.id || 'system' }] : [],
        avatarUrl: user.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`,
        calendarColor: user.calendarColor || '#3b82f6'
    };
    setUsers(prev => [...prev, newUser]);
    await supabase.from('users').insert(newUser);
    sendEmailWithTemplate('WELCOME', newUser, { name: newUser.name });
    if (initialOvertime > 0) {
        const overtimeRec = { id: generateId(), userId: newUserId, date: new Date().toISOString(), hours: initialOvertime, description: 'Saldo Inicial (Carga Admin)', status: RequestStatus.APPROVED, consumed: 0, createdAt: new Date().toISOString(), isAdjustment: true };
        setOvertime(prev => [...prev, overtimeRec]);
        await supabase.from('overtime').insert(overtimeRec);
    }
  };
  
  const deleteUser = async (id: string) => {
      console.log(`[DELETE USER] Deleting ID: ${id}`);
      const originalUsers = [...users];
      setUsers(prev => prev.filter(u => u.id !== id));
      
      try {
          await supabase.from('requests').delete().eq('userId', id);
          await supabase.from('overtime').delete().eq('userId', id);
          await supabase.from('notifications').delete().eq('userId', id);
          await supabase.from('shifts').delete().eq('userId', id);
          
          const relatedDepts = departments.filter(d => d.supervisorIds.includes(id));
          for (const dept of relatedDepts) {
              const newSupIds = dept.supervisorIds.filter(supId => supId !== id);
              await updateDepartment({ ...dept, supervisorIds: newSupIds });
          }

          const { error } = await supabase.from('users').delete().eq('id', id);
          if (error) throw error;
          
          notifyUI('Usuario Eliminado', 'El usuario y sus datos relacionados han sido eliminados.', 'success');
      } catch (error: any) {
          setUsers(originalUsers);
          notifyUI('Error', `No se pudo eliminar el usuario: ${error.message}`, 'error');
      }
  };

  const addRequest = async (req: Omit<AbsenceRequest, 'id' | 'status' | 'createdAt'>, initialStatus: RequestStatus = RequestStatus.PENDING) => {
    const newReq = { ...req, id: generateId(), status: initialStatus, createdAt: new Date().toISOString() };
    setRequests(prev => [newReq, ...prev]);
    await supabase.from('requests').insert(newReq);
    
    const user = users.find(u => u.id === req.userId);
    if (user) {
        const sDate = new Date(req.startDate).toLocaleDateString();
        const eDate = new Date(req.endDate).toLocaleDateString();
        const daysCount = calculateDaysCount(req.startDate, req.endDate);
        const details = `Ausencia del ${sDate} al ${eDate} (${daysCount} días). Motivo: ${req.comment}`;

        // Confirm creation
        sendEmailWithTemplate('REQUEST_RECEIVED', user, { name: user.name, details: details });

        if (initialStatus === RequestStatus.APPROVED) {
             // Admin created logic: Notify approval immediately
             sendNotification(req.userId, 'Solicitud Aprobada', `Tu solicitud de ausencia creada por administración ha sido aprobada.`, NotificationType.SUCCESS);
             sendEmailWithTemplate('REQUEST_APPROVED', user, { 
                 name: user.name, 
                 startDate: sDate, 
                 endDate: eDate, 
                 days: daysCount 
             });
        } else {
             // Normal logic
             const adminUsers = users.filter(u => u.role === Role.ADMIN);
             const supervisorIds = user.departmentId ? departments.find(d => d.id === user.departmentId)?.supervisorIds || [] : [];
             const supervisorUsers = users.filter(u => supervisorIds.includes(u.id));
             const allRecipients = [...adminUsers, ...supervisorUsers].filter((v,i,a)=>a.findIndex(t=>(t.id===v.id))===i);
             allRecipients.forEach(recipient => {
                 if (recipient.id !== req.userId) {
                     sendNotification(recipient.id, 'Nueva Solicitud', `${user.name} ha solicitado ausencia.`, NotificationType.INFO);
                     sendEmailWithTemplate('REQUEST_CREATED', recipient, { 
                         name: user.name, 
                         startDate: sDate,
                         endDate: eDate,
                         days: daysCount,
                         comment: req.comment
                     });
                 }
             });
        }
    }
  };

  const updateRequestStatus = async (id: string, status: RequestStatus, reviewerId: string) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    await supabase.from('requests').update({ status }).eq('id', id);
    
    const req = requests.find(r => r.id === id);
    if (req) {
      const user = users.find(u => u.id === req.userId);
      if (user) {
          const sDate = new Date(req.startDate).toLocaleDateString();
          const eDate = new Date(req.endDate).toLocaleDateString();
          const daysCount = calculateDaysCount(req.startDate, req.endDate);

          sendNotification(req.userId, `Solicitud ${status === RequestStatus.APPROVED ? 'Aprobada' : 'Rechazada'}`, `Tu solicitud de ausencia ha sido ${status.toLowerCase()}.`, status === RequestStatus.APPROVED ? NotificationType.SUCCESS : NotificationType.ERROR);
          
          const vars = { 
              name: user.name, 
              startDate: sDate, 
              endDate: eDate, 
              days: daysCount 
          };

          if (status === RequestStatus.APPROVED) sendEmailWithTemplate('REQUEST_APPROVED', user, vars);
          if (status === RequestStatus.REJECTED) sendEmailWithTemplate('REQUEST_REJECTED', user, vars);
      }
    }
  };

  const deleteRequest = async (id: string) => {
      console.log(`[DELETE REQUEST] Deleting ID: ${id}`);
      const req = requests.find(r => r.id === id);
      const originalRequests = [...requests];
      setRequests(prev => prev.filter(r => r.id !== id));
      try {
          const { error } = await supabase.from('requests').delete().eq('id', id);
          if (error) throw error;
          
          if (req) {
              const user = users.find(u => u.id === req.userId);
              if (user) sendEmailWithTemplate('REQUEST_CANCELLED', user, { name: user.name });
          }

          notifyUI('Eliminado', 'Solicitud eliminada. Los días se han restaurado.', 'success');
          await fetchData();
      } catch (error: any) {
          setRequests(originalRequests);
          notifyUI('Error', `No se pudo eliminar: ${error.message || error.error_description}`, 'error');
      }
  };

  const addOvertime = async (rec: Omit<OvertimeRecord, 'id' | 'status' | 'consumed' | 'createdAt'> & { status?: RequestStatus }) => {
    const isAutoApproved = rec.status === RequestStatus.APPROVED;
    const newRec = { ...rec, id: generateId(), status: rec.status || RequestStatus.PENDING, consumed: 0, createdAt: new Date().toISOString(), isAdjustment: isAutoApproved };
    setOvertime(prev => [newRec, ...prev]);
    await supabase.from('overtime').insert(newRec);
    
    const user = users.find(u => u.id === rec.userId);
    const dateStr = new Date(rec.date).toLocaleDateString();

     if (!isAutoApproved) {
        if (user) {
            sendEmailWithTemplate('REQUEST_RECEIVED', user, { name: user.name, details: `Registro de ${rec.hours}h el ${dateStr}` }); 
            sendNotification(user.id, 'Registro de Horas', `Has registrado ${rec.hours} horas extras.`, NotificationType.INFO);
            
            const adminUsers = users.filter(u => u.role === Role.ADMIN);
            const supervisorIds = user.departmentId ? departments.find(d => d.id === user.departmentId)?.supervisorIds || [] : [];
            const supervisorUsers = users.filter(u => supervisorIds.includes(u.id));
            const allRecipients = [...adminUsers, ...supervisorUsers].filter((v,i,a)=>a.findIndex(t=>(t.id===v.id))===i);
            
            allRecipients.forEach(recipient => {
                if (recipient.id !== rec.userId) {
                    sendEmailWithTemplate('OVERTIME_CREATED', recipient, { 
                        name: user.name, 
                        hours: String(rec.hours), 
                        description: rec.description,
                        date: dateStr
                    });
                }
            });
        }
     } else {
         // Auto-approved (Admin)
         if (user) {
             const title = rec.hours < 0 ? 'Canje Aprobado (Admin)' : 'Horas Aprobadas (Admin)';
             sendNotification(rec.userId, title, `Se han ${rec.hours < 0 ? 'descontado' : 'añadido'} ${Math.abs(rec.hours)}h por administración.`, NotificationType.SUCCESS);
             
             // Send standard approved template
             sendEmailWithTemplate('OVERTIME_APPROVED', user, { 
                 name: user.name, 
                 hours: String(Math.abs(rec.hours)), 
                 date: dateStr,
                 description: rec.description
             });
         }
     }
  };

  const updateOvertimeStatus = async (id: string, status: RequestStatus, reviewerId: string) => {
    const rec = overtime.find(o => o.id === id);
    let updatedOvertime = [...overtime];
    updatedOvertime = updatedOvertime.map(o => o.id === id ? { ...o, status } : o);
    if (rec && status === RequestStatus.APPROVED && rec.hours < 0 && rec.linkedRecordIds) {
        let remainingToConsume = Math.abs(rec.hours);
        for (let i = 0; i < updatedOvertime.length; i++) {
             const o = updatedOvertime[i];
             if (rec.linkedRecordIds?.includes(o.id) && remainingToConsume > 0) {
                 const available = o.hours - o.consumed;
                 const take = Math.min(available, remainingToConsume);
                 remainingToConsume -= take;
                 const newConsumed = o.consumed + take;
                 updatedOvertime[i] = { ...o, consumed: newConsumed };
                 await supabase.from('overtime').update({ consumed: newConsumed }).eq('id', o.id);
             }
        }
    }
    setOvertime(updatedOvertime);
    await supabase.from('overtime').update({ status }).eq('id', id);
    if (rec) {
      const user = users.find(u => u.id === rec.userId);
      sendNotification(rec.userId, `Solicitud ${status === RequestStatus.APPROVED ? 'Aprobada' : 'Rechazada'}`, `El registro de horas (${rec.hours}h) ha sido ${status.toLowerCase()}.`, status === RequestStatus.APPROVED ? NotificationType.SUCCESS : NotificationType.ERROR);
      if(user) {
          const dateStr = new Date(rec.date).toLocaleDateString();
          const templateType = status === RequestStatus.APPROVED ? 'OVERTIME_APPROVED' : 'OVERTIME_REJECTED';
          sendEmailWithTemplate(templateType, user, { 
              name: user.name, 
              hours: String(Math.abs(rec.hours)),
              date: dateStr,
              description: rec.description
          });
      }
    }
  };

  const deleteOvertime = async (id: string) => {
      console.log(`[DELETE OVERTIME] Deleting ID: ${id}`);
      const rec = overtime.find(o => o.id === id);
      if (!rec) return;
      if (rec.hours > 0 && rec.consumed > 0) {
          notifyUI('Acción Bloqueada', 'No puedes eliminar estas horas porque ya han sido consumidas o canjeadas parcialmente.', 'error');
          return;
      }
      const originalOvertime = [...overtime];
      setOvertime(prev => prev.filter(o => o.id !== id)); 
      
      try {
          if (rec.hours < 0 && rec.status === RequestStatus.APPROVED && rec.linkedRecordIds && rec.linkedRecordIds.length > 0) {
              // RESTORE LOGIC
              let remainingToRestore = Math.abs(rec.hours);
              const { data: freshData } = await supabase.from('overtime').select('*');
              const currentDbState = freshData || overtime;
              
              for (const linkedId of rec.linkedRecordIds) {
                  if (remainingToRestore <= 0) break;
                  const originalRec = currentDbState.find(o => o.id === linkedId);
                  if (originalRec) {
                      const restoreAmount = Math.min(originalRec.consumed, remainingToRestore);
                      if (restoreAmount > 0) {
                          const newConsumed = originalRec.consumed - restoreAmount;
                          const { error: updateError } = await supabase.from('overtime').update({ consumed: newConsumed }).eq('id', linkedId);
                          if (updateError) throw updateError;
                          remainingToRestore -= restoreAmount;
                      }
                  }
              }
              notifyUI('Saldo Restaurado', `Se han devuelto ${Math.abs(rec.hours)}h a tu bolsa de horas.`, 'success');
          }
          const { error } = await supabase.from('overtime').delete().eq('id', id);
          if (error) throw error;
          
          if (rec) {
              const user = users.find(u => u.id === rec.userId);
              if (user) sendEmailWithTemplate('REQUEST_CANCELLED', user, { name: user.name });
          }

          await fetchData();
      } catch (error: any) {
          setOvertime(originalOvertime);
          notifyUI('Error', `No se pudo eliminar: ${error.message}`, 'error');
      }
  };

  const requestRedemption = async (hours: number, recordIds: string[], type: RedemptionType, userId?: string, initialStatus: RequestStatus = RequestStatus.PENDING) => {
      const targetUserId = userId || currentUser?.id;
      if (!targetUserId) return;
      
      const user = users.find(u => u.id === targetUserId);
      if(!user) return;

      const newRec = {
          id: generateId(),
          userId: targetUserId,
          date: new Date().toISOString(),
          hours: -Math.abs(hours),
          description: `Solicitud de Canje: ${type} ${initialStatus === RequestStatus.APPROVED ? '(Admin)' : ''}`,
          status: initialStatus,
          consumed: 0,
          createdAt: new Date().toISOString(),
          redemptionType: type,
          linkedRecordIds: recordIds
      };
      
      setOvertime(prev => [newRec, ...prev]);
      await supabase.from('overtime').insert(newRec);

      // If created as APPROVED (Admin action), immediately consume hours
      if (initialStatus === RequestStatus.APPROVED) {
          let remainingToConsume = Math.abs(hours);
          // We need to update the records in state AND DB
          const updatedOvertime = [...overtime, newRec]; // Include the new one for context although it's not a source
          
          // Loop through recordIds to deduct balance
          for (const linkedId of recordIds) {
              if (remainingToConsume <= 0) break;
              const sourceRec = overtime.find(o => o.id === linkedId);
              if (sourceRec) {
                  const available = sourceRec.hours - sourceRec.consumed;
                  const take = Math.min(available, remainingToConsume);
                  if (take > 0) {
                      remainingToConsume -= take;
                      const newConsumed = sourceRec.consumed + take;
                      
                      // Update State
                      const index = updatedOvertime.findIndex(o => o.id === linkedId);
                      if (index !== -1) updatedOvertime[index] = { ...updatedOvertime[index], consumed: newConsumed };
                      setOvertime(prev => prev.map(o => o.id === linkedId ? { ...o, consumed: newConsumed } : o));

                      // Update DB
                      await supabase.from('overtime').update({ consumed: newConsumed }).eq('id', linkedId);
                  }
              }
          }
          
          sendNotification(targetUserId, 'Canje Aprobado', `Administración ha procesado un canje de ${hours}h.`, NotificationType.SUCCESS);
          sendEmailWithTemplate('OVERTIME_APPROVED', user, { 
              name: user.name, 
              hours: String(hours),
              date: new Date().toLocaleDateString(),
              description: 'Canje procesado por administración'
          });

      } else {
          // Standard Flow
          sendNotification(targetUserId, 'Canje Solicitado', `Solicitud de canje de ${hours}h enviada correctamente.`, NotificationType.INFO);
          sendEmailWithTemplate('REQUEST_RECEIVED', user, { name: user.name, details: `Canje de ${hours}h` });

          const adminUsers = users.filter(u => u.role === Role.ADMIN);
          const supervisorIds = user.departmentId ? departments.find(d => d.id === user.departmentId)?.supervisorIds || [] : [];
          const supervisorUsers = users.filter(u => supervisorIds.includes(u.id));
          const allRecipients = [...adminUsers, ...supervisorUsers].filter((v,i,a)=>a.findIndex(t=>(t.id===v.id))===i);
          allRecipients.forEach(recipient => {
              if (recipient.id !== targetUserId) {
                  sendEmailWithTemplate('REDEMPTION_CREATED', recipient, { name: user.name, hours: String(hours), type: type });
              }
          });
      }
  };

  const markNotificationRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    await supabase.from('notifications').update({ read: true }).eq('id', id);
  };

  const markAllNotificationsRead = async () => {
      if (!currentUser) return;
      setNotifications(prev => prev.map(n => n.userId === currentUser.id ? { ...n, read: true } : n));
      await supabase.from('notifications').update({ read: true }).eq('userId', currentUser.id);
  };

  const updateAbsenceType = async (updatedType: AbsenceType) => {
    const originalTypes = [...absenceTypes];
    setAbsenceTypes(prev => prev.map(t => t.id === updatedType.id ? updatedType : t));
    try {
        const { error } = await supabase.from('absence_types').update(updatedType).eq('id', updatedType.id);
        if (error) throw error;
        notifyUI('Guardado', 'Tipo de ausencia actualizado.', 'success');
    } catch (error: any) {
        setAbsenceTypes(originalTypes);
        if (error.code === '42501' || error.message?.includes('policy')) {
             notifyUI('Error Permisos', 'Ejecuta en Supabase: "ALTER TABLE public.absence_types DISABLE ROW LEVEL SECURITY;"', 'error');
        } else {
             notifyUI('Error', 'No se pudo guardar los cambios.', 'error');
        }
    }
  };

  const createAbsenceType = async (type: Omit<AbsenceType, 'id'>) => {
    const newType = { ...type, id: generateId() };
    setAbsenceTypes(prev => [...prev, newType]);
    await supabase.from('absence_types').insert(newType);
  };

  const deleteAbsenceType = async (id: string) => {
    setAbsenceTypes(prev => prev.filter(t => t.id !== id));
    await supabase.from('absence_types').delete().eq('id', id);
  };

  const addDepartment = async (name: string, supervisorIds?: string[]) => {
    const newDept: Department = { id: generateId(), name, supervisorIds: supervisorIds || [] };
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

  const updateEmailTemplate = async (template: EmailTemplate) => {
      setEmailTemplates(prev => prev.map(t => t.id === template.id ? template : t));
      await supabase.from('email_templates').update(template).eq('id', template.id);
  };

  // --- SHIFT MANAGEMENT ---
  const addShift = async (userId: string, date: string, typeId: string) => {
      // Check if shift already exists
      const exists = shifts.find(s => s.userId === userId && s.date === date);
      if (exists) {
          await deleteShift(exists.id); 
      }
      
      const newShift: Shift = {
          id: generateId(),
          userId,
          date,
          shiftType: typeId,
          createdAt: new Date().toISOString()
      };
      setShifts(prev => [...prev, newShift]);
      await supabase.from('shifts').insert(newShift);
  };

  const deleteShift = async (id: string) => {
      setShifts(prev => prev.filter(s => s.id !== id));
      await supabase.from('shifts').delete().eq('id', id);
  };

  const createShiftType = async (type: Omit<ShiftTypeDefinition, 'id'>) => {
    const newType = { ...type, id: generateId() };
    setShiftTypes(prev => [...prev, newType]);
    await supabase.from('shift_types').insert(newType);
  };
  
  const updateShiftType = async (type: ShiftTypeDefinition) => {
      setShiftTypes(prev => prev.map(t => t.id === type.id ? type : t));
      await supabase.from('shift_types').update(type).eq('id', type.id);
      notifyUI('Turno Actualizado', 'El tipo de turno ha sido modificado.', 'success');
  };

  const deleteShiftType = async (id: string) => {
    setShiftTypes(prev => prev.filter(t => t.id !== id));
    await supabase.from('shift_types').delete().eq('id', id);
  };
  
  const importDatabase = (data: any) => {
      console.log("Database import is deprecated with Supabase integration.");
  };

  return (
    <DataContext.Provider value={{
      currentUser, users, departments, absenceTypes, shiftTypes, requests, overtime, notifications, emailTemplates, emailConfig, smtpConfig, shifts, systemMessage, isLoading,
      login, logout, updateUser, adjustUserVacation, addUser, deleteUser, addRequest, updateRequestStatus, deleteRequest, addOvertime, updateOvertimeStatus, deleteOvertime, requestRedemption, 
      sendNotification, markNotificationRead, markAllNotificationsRead, updateAbsenceType, createAbsenceType, deleteAbsenceType,
      addDepartment, updateDepartment, deleteDepartment, updateEmailTemplate, saveEmailConfig, saveSmtpConfig, sendTestEmail, importDatabase, updateSystemMessage,
      addShift, deleteShift, createShiftType, updateShiftType, deleteShiftType
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within a DataProvider");
  return context;
};