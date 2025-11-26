
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { DataProvider, useData } from './context/DataContext';
import { LayoutDashboard, Users, Calendar, Settings, Bell, Menu, LogOut, ChevronRight, UserCircle, CalendarDays, CheckCheck, Megaphone } from 'lucide-react';
import { Role, RequestStatus } from './types';

// Pages
import Dashboard from './pages/Dashboard';
import MySpace from './pages/MySpace';
import TeamManagement from './pages/TeamManagement';
import AdminPanel from './pages/AdminPanel';
import Login from './pages/Login';
import Profile from './pages/Profile';
import CalendarView from './pages/CalendarView';

const LOGO_URL = "https://img.evbuc.com/https%3A%2F%2Fcdn.evbuc.com%2Fimages%2F677236879%2F73808960223%2F1%2Foriginal.20240118-071537?w=284&auto=format%2Ccompress&q=75&sharp=10&rect=0%2C0%2C284%2C284&s=138022d792466dd1773752da55468b5b";

const ProtectedRoute = ({ children, allowedRoles }: { children?: React.ReactNode, allowedRoles?: Role[] }) => {
  const { currentUser } = useData();
  if (!currentUser) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) return <Navigate to="/" />;
  return <>{children}</>;
};

const SidebarItem = ({ to, icon: Icon, label, active, onClick }: any) => (
  <Link 
    to={to} 
    onClick={onClick}
    className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group ${active ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
  >
    <Icon size={20} className={active ? 'text-white' : 'text-slate-400 group-hover:text-primary'} />
    <span className="font-medium">{label}</span>
  </Link>
);

const Layout = ({ children }: { children?: React.ReactNode }) => {
  const { currentUser, logout, notifications, markNotificationRead, markAllNotificationsRead, requests, departments, overtime, systemMessage } = useData();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  // Generic Toast State
  const [toast, setToast] = useState<{title: string, msg: string, type: 'success' | 'error' | 'info'} | null>(null);

  useEffect(() => {
    // Listen for custom event 'show-toast' from DataContext
    const handleToastEvent = (e: any) => {
        setToast(e.detail);
        setTimeout(() => setToast(null), 4000);
    };
    
    window.addEventListener('show-toast', handleToastEvent);
    
    return () => {
        window.removeEventListener('show-toast', handleToastEvent);
    };
  }, []);

  const isSupervisorOrAdmin = currentUser?.role === Role.SUPERVISOR || currentUser?.role === Role.ADMIN;
  const isAdmin = currentUser?.role === Role.ADMIN;

  // Calculate pending tasks for Red Dot
  let pendingTasksCount = 0;
  if (isSupervisorOrAdmin && currentUser) {
      if (isAdmin) {
          pendingTasksCount += requests.filter(r => r.status === RequestStatus.PENDING).length;
          pendingTasksCount += overtime.filter(o => o.status === RequestStatus.PENDING).length;
      } else {
           // Basic logic for supervisors: pending requests from managed users
           pendingTasksCount += requests.filter(r => r.status === RequestStatus.PENDING).length > 0 ? 1 : 0; 
      }
  }

  const unreadNotifsCount = notifications.filter(n => n.userId === currentUser?.id && !n.read).length;
  const totalAlerts = unreadNotifsCount + (isAdmin ? pendingTasksCount : 0); 
  
  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed z-30 inset-y-0 left-0 w-64 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-full flex flex-col">
          <div className="h-20 flex items-center px-6 border-b border-slate-100">
            <img src={LOGO_URL} alt="Logo" className="w-10 h-10 rounded-lg mr-3 object-contain" />
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">RRHH CHS</h1>
          </div>
          
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" active={location.pathname === '/'} onClick={closeMenu} />
            <SidebarItem to="/myspace" icon={Calendar} label="Mi Espacio" active={location.pathname === '/myspace'} onClick={closeMenu} />
            
            <SidebarItem to="/calendar" icon={CalendarDays} label="Calendario" active={location.pathname === '/calendar'} onClick={closeMenu} />
            
            {isSupervisorOrAdmin && (
              <SidebarItem to="/team" icon={Users} label="Mi Equipo" active={location.pathname === '/team'} onClick={closeMenu} />
            )}
            
            {isAdmin && (
              <SidebarItem to="/admin" icon={Settings} label="Administración" active={location.pathname === '/admin'} onClick={closeMenu} />
            )}
            
            <div className="pt-4 border-t border-slate-100 mt-4">
                 <SidebarItem to="/profile" icon={UserCircle} label="Mi Perfil" active={location.pathname === '/profile'} onClick={closeMenu} />
            </div>
          </nav>

          <div className="p-4 border-t border-slate-100">
             <div className="flex items-center space-x-3 px-4 py-3 bg-slate-50 rounded-xl mb-2">
                <img src={currentUser?.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover bg-slate-200" />
                <div className="overflow-hidden">
                  <p className="text-sm font-semibold text-slate-700 truncate">{currentUser?.name}</p>
                  <p className="text-xs text-slate-500 truncate capitalize">{currentUser?.role.toLowerCase()}</p>
                </div>
             </div>
             <button onClick={logout} className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
               <LogOut size={16} />
               <span>Cerrar Sesión</span>
             </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-20">
          <div className="px-6 py-4 flex items-center justify-between">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100">
              <Menu size={24} />
            </button>
            <div className="flex-1"></div>
            
            {/* SYSTEM MESSAGE (BANNER) - SCROLLING */}
            {systemMessage && systemMessage.active && (
                <div className={`hidden sm:flex items-center px-3 py-1.5 rounded-lg mr-4 shadow-sm border overflow-hidden w-64 md:w-96 relative group ${systemMessage.color}`}>
                    <div className="relative z-10 bg-inherit pr-2">
                         <Megaphone size={14} className="flex-shrink-0" />
                    </div>
                    <div className="flex-1 overflow-hidden relative h-5 flex items-center">
                         <span className="whitespace-nowrap animate-marquee absolute text-xs font-semibold">
                             {systemMessage.text} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {systemMessage.text}
                         </span>
                    </div>
                </div>
            )}
            
            <div className="relative">
              <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="p-2 rounded-full text-slate-500 hover:bg-slate-100 relative transition-colors">
                <Bell size={20} />
                {totalAlerts > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                )}
              </button>
              
              {/* Notifications Dropdown */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-slate-50 bg-slate-50 flex justify-between items-center">
                    <div>
                       <h3 className="text-sm font-semibold text-slate-700">Notificaciones</h3>
                       <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{unreadNotifsCount} nuevas</span>
                    </div>
                    {unreadNotifsCount > 0 && (
                        <button onClick={markAllNotificationsRead} className="text-xs text-primary hover:underline flex items-center" title="Marcar todas como leídas">
                           <CheckCheck size={14} className="mr-1" /> Leídas
                        </button>
                    )}
                  </div>
                  
                  {isSupervisorOrAdmin && pendingTasksCount > 0 && (
                      <Link to="/team" onClick={() => setIsNotifOpen(false)} className="block bg-amber-50 px-4 py-3 border-b border-amber-100 hover:bg-amber-100 transition-colors group">
                          <p className="text-xs text-amber-800 font-bold mb-1 flex items-center">
                             ⚠️ Acción Requerida
                          </p>
                          <div className="flex justify-between items-center">
                             <p className="text-xs text-amber-700">Tienes {pendingTasksCount} solicitudes pendientes.</p>
                             <ChevronRight size={14} className="text-amber-600 group-hover:translate-x-1 transition-transform" />
                          </div>
                      </Link>
                  )}

                  <div className="max-h-80 overflow-y-auto">
                    {notifications.filter(n => n.userId === currentUser?.id && !n.read).length === 0 ? (
                      <p className="text-center py-8 text-sm text-slate-400">No tienes mensajes nuevos.</p>
                    ) : (
                      notifications.filter(n => n.userId === currentUser?.id && !n.read).map(n => (
                        <div key={n.id} className="px-4 py-3 border-b border-slate-50 hover:bg-slate-50 cursor-pointer bg-blue-50/50" onClick={() => markNotificationRead(n.id)}>
                          <div className="flex justify-between items-start mb-1">
                            <p className="text-sm font-medium text-slate-800">{n.title}</p>
                            <span className="text-xs text-slate-400">{new Date(n.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-2">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* MOBILE ONLY: SYSTEM MESSAGE BANNER (BELOW HEADER) - SCROLLING */}
          {systemMessage && systemMessage.active && (
             <div className={`sm:hidden border-t flex items-center ${systemMessage.color} overflow-hidden relative h-8`}>
                 <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center px-3 bg-inherit">
                     <Megaphone size={14} />
                 </div>
                 <div className="w-full overflow-hidden relative h-full flex items-center pl-10">
                     <span className="whitespace-nowrap animate-marquee text-xs font-semibold inline-block">
                         {systemMessage.text} &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; {systemMessage.text}
                     </span>
                 </div>
             </div>
          )}
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>

        {/* Generic Toast System */}
        {toast && (
            <div className={`absolute bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-bottom-5 fade-in z-[100] ${
                toast.type === 'error' ? 'bg-red-600 text-white' : 
                toast.type === 'success' ? 'bg-emerald-600 text-white' : 
                'bg-slate-800 text-white'
            }`}>
                <p className="font-bold text-sm">{toast.title}</p>
                <p className="text-xs opacity-90">{toast.msg}</p>
            </div>
        )}

      </div>
      
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 md:hidden" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}
    </div>
  );
};

const App = () => {
  return (
    <DataProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
          <Route path="/myspace" element={<ProtectedRoute><Layout><MySpace /></Layout></ProtectedRoute>} />
          <Route path="/team" element={<ProtectedRoute allowedRoles={[Role.SUPERVISOR, Role.ADMIN]}><Layout><TeamManagement /></Layout></ProtectedRoute>} />
          
          {/* UPDATED: Calendar accessible to all authenticated roles */}
          <Route path="/calendar" element={<ProtectedRoute allowedRoles={[Role.WORKER, Role.SUPERVISOR, Role.ADMIN]}><Layout><CalendarView /></Layout></ProtectedRoute>} />
          
          <Route path="/admin" element={<ProtectedRoute allowedRoles={[Role.ADMIN]}><Layout><AdminPanel /></Layout></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
        </Routes>
      </Router>
    </DataProvider>
  );
};

export default App;
