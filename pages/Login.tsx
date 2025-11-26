
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';

const LOGO_URL = "https://img.evbuc.com/https%3A%2F%2Fcdn.evbuc.com%2Fimages%2F677236879%2F73808960223%2F1%2Foriginal.20240118-071537?w=284&auto=format%2Ccompress&q=75&sharp=10&rect=0%2C0%2C284%2C284&s=138022d792466dd1773752da55468b5b";

const Login = () => {
  const { login, users } = useData();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate network delay for effect
    setTimeout(() => {
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (user) {
            // Check password (default is '123' if not set, or the one in DB)
            if (user.password === password) {
                login(user.email);
                navigate('/');
            } else {
                setError('Contraseña incorrecta.');
            }
        } else {
            setError('Usuario no encontrado.');
        }
        setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Visual & Branding (Visible only on Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900 overflow-hidden flex-col justify-between p-12">
          {/* Animated Background Elements */}
          <div className="absolute top-0 left-0 w-full h-full z-0">
             <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/30 rounded-full blur-[100px] animate-pulse"></div>
             <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-secondary/20 rounded-full blur-[120px]"></div>
             <div className="absolute top-[40%] right-[10%] w-[300px] h-[300px] bg-accent/10 rounded-full blur-[80px]"></div>
          </div>

          <div className="relative z-10">
              <img src={LOGO_URL} alt="Company Logo" className="w-24 h-24 mb-6 rounded-xl object-contain bg-white/10 p-2 backdrop-blur-sm border border-white/10" />
              <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
                  Gestión de Talento <br/> 
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Simplificada.</span>
              </h1>
              <p className="text-slate-400 text-lg max-w-md">
                  Optimiza procesos, gestiona ausencias y potencia a tu equipo con la plataforma integral RRHH CHS.
              </p>
          </div>

          <div className="relative z-10 bg-white/5 backdrop-blur-md rounded-2xl p-6 border border-white/10 max-w-md">
              <p className="text-slate-300 italic mb-4">"La eficiencia no es un acto, es un hábito. Esta plataforma transforma la gestión diaria en una ventaja estratégica."</p>
          </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50">
          <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-3xl shadow-xl border border-slate-100">
              
              {/* Mobile Logo (Hidden on Desktop) */}
              <div className="lg:hidden flex justify-center mb-6">
                  <img src={LOGO_URL} alt="Company Logo" className="w-24 h-24 object-contain" />
              </div>

              <div className="text-center lg:text-left">
                  <h2 className="text-3xl font-bold text-slate-800">Bienvenido</h2>
                  <p className="text-slate-500 mt-2">Introduce tus credenciales para acceder.</p>
              </div>

              <form onSubmit={handleManualLogin} className="space-y-6">
                  <div className="space-y-4">
                      <div className="relative group">
                          <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                          <input 
                            type="email" 
                            placeholder="correo@empresa.com" 
                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-slate-700"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                      </div>
                      <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={20} />
                          <input 
                            type="password" 
                            placeholder="••••••••" 
                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-slate-700"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                          />
                      </div>
                  </div>

                  {error && (
                      <div className="flex items-center text-red-600 bg-red-50 p-3 rounded-lg text-sm">
                          <AlertCircle size={16} className="mr-2 flex-shrink-0" />
                          {error}
                      </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-slate-800 focus:ring-4 focus:ring-slate-200 transition-all flex items-center justify-center shadow-lg shadow-slate-900/20"
                  >
                      {loading ? (
                          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                          <>
                            Iniciar Sesión <ArrowRight className="ml-2" size={20} />
                          </>
                      )}
                  </button>
              </form>

              <div className="text-center pt-8">
                  <p className="text-xs text-slate-400">© 2024 RRHH CHS. Todos los derechos reservados.</p>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Login;
