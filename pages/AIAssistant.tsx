import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User as UserIcon, Loader2 } from 'lucide-react';
import { askHRAssistant } from '../services/geminiService';
import { useData } from '../context/DataContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const AIAssistant = () => {
  const { currentUser, absenceTypes, requests } = useData();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: `Hola ${currentUser?.name.split(' ')[0]}, soy tu Copiloto de RRHH. ¿En qué puedo ayudarte hoy? Puedes preguntarme sobre políticas, estado de tus solicitudes o cómo registrar horas extras.` }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    // Construct context
    const context = `
      Usuario: ${currentUser?.name}
      Rol: ${currentUser?.role}
      Tipos de Ausencia disponibles: ${absenceTypes.map(t => t.name).join(', ')}
      Mis solicitudes recientes: ${requests.filter(r => r.userId === currentUser?.id).slice(0,3).map(r => `${r.startDate} (${r.status})`).join(', ')}
    `;

    try {
      const response = await askHRAssistant(userMessage, context);
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Lo siento, tuve un problema técnico." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 bg-primary/5 border-b border-primary/10 flex items-center justify-between">
         <div className="flex items-center">
             <div className="p-2 bg-primary/10 rounded-lg mr-3">
                 <Bot className="text-primary" size={24} />
             </div>
             <div>
                 <h3 className="font-bold text-slate-800">Copiloto RRHH</h3>
                 <p className="text-xs text-slate-500">Impulsado por Gemini 2.5</p>
             </div>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
              msg.role === 'user' 
                ? 'bg-primary text-white rounded-br-none' 
                : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'
            }`}>
              <div className="flex items-center gap-2 mb-1 opacity-70 text-xs">
                 {msg.role === 'user' ? <UserIcon size={12} /> : <Bot size={12} />}
                 <span>{msg.role === 'user' ? 'Tú' : 'Copiloto'}</span>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
           <div className="flex justify-start">
              <div className="bg-white p-4 rounded-2xl rounded-bl-none border border-slate-100 flex items-center space-x-2">
                 <Loader2 className="animate-spin text-primary" size={16} />
                 <span className="text-xs text-slate-500">Pensando...</span>
              </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-slate-100">
        <form onSubmit={handleSend} className="relative">
          <input
            type="text"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            placeholder="Escribe tu consulta sobre políticas o estado..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button 
            type="submit" 
            disabled={loading || !input.trim()}
            className="absolute right-2 top-2 p-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIAssistant;
