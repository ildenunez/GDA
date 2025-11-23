import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { User, Mail, Lock, Upload, Save, Shield } from 'lucide-react';

const Profile = () => {
    const { currentUser, updateUser } = useData();
    const [form, setForm] = useState({
        name: currentUser?.name || '',
        email: currentUser?.email || '',
        password: '', // Mock password change
    });
    
    // In a real app, this would be handled differently
    const [avatarPreview, setAvatarPreview] = useState(currentUser?.avatarUrl || '');

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setAvatarPreview(reader.result as string);
          };
          reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (currentUser) {
            updateUser(currentUser.id, {
                name: form.name,
                email: form.email,
                avatarUrl: avatarPreview
            });
            alert('Perfil actualizado correctamente');
            setForm({...form, password: ''});
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Mi Perfil</h2>
                <p className="text-slate-500">Actualiza tu información personal y seguridad.</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex flex-col items-center">
                    <div className="relative group mb-4">
                        <img src={avatarPreview} alt="Avatar" className="w-32 h-32 rounded-full object-cover border-4 border-slate-50 shadow-xl" />
                        <label className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer backdrop-blur-sm">
                            <Upload className="text-white mb-1" size={24} />
                            <span className="text-xs text-white absolute bottom-8 font-medium">Cambiar</span>
                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        </label>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800">{currentUser?.name}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold tracking-wider uppercase ${
                            currentUser?.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 
                            currentUser?.role === 'SUPERVISOR' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                            {currentUser?.role}
                        </span>
                    </div>
                </div>

                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Nombre Completo</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                                <input 
                                    type="text" 
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                                    value={form.name}
                                    onChange={e => setForm({...form, name: e.target.value})}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Email Corporativo</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                                <input 
                                    type="email" 
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                                    value={form.email}
                                    onChange={e => setForm({...form, email: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                        <h4 className="text-sm font-semibold text-slate-800 mb-4 flex items-center">
                            <Shield className="mr-2 text-slate-400" size={16}/> Seguridad
                        </h4>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Nueva Contraseña</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                                <input 
                                    type="password" 
                                    placeholder="Dejar en blanco para mantener la actual"
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                                    value={form.password}
                                    onChange={e => setForm({...form, password: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <button type="submit" className="flex items-center px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20 font-medium">
                        <Save size={18} className="mr-2" />
                        Guardar Cambios
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Profile;