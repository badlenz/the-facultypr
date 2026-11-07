import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, QuoteData, StudioProject } from '../../types';
import { 
  Bot, 
  Send, 
  Sparkles, 
  User, 
  Loader2, 
  Lightbulb, 
  FileText, 
  Clock, 
  HelpCircle, 
  Mail, 
  Trash2,
  Copy,
  Check
} from 'lucide-react';

interface AsistenteSectionProps {
  currentQuote?: QuoteData;
  projects?: StudioProject[];
  initialPrompt?: string;
}

export const AsistenteSection: React.FC<AsistenteSectionProps> = ({
  currentQuote,
  projects = [],
  initialPrompt,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-1',
      role: 'assistant',
      content: `¡Hola! Soy tu **Asistente de Inteligencia de Negocios y Dirección Creativa** para el Estudio. 🎨🚀

Puedo ayudarte a:
- **Redactar propuestas comerciales** persuasivas a partir de tus cotizaciones.
- **Sugerir conceptos de branding**, paletas de color y dirección de arte.
- **Estimar alcances, horas y costos** para proyectos de desarrollo web, video o diseño.
- **Generar briefings** de preguntas estratégicas para nuevos clientes.
- **Redactar correos corporativos** de seguimiento o cobranza.

¿En qué proyecto o cotización te gustaría que trabajemos hoy?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputMessage, setInputMessage] = useState(initialPrompt || '');
  const [isLoading, setIsLoading] = useState(false);
  const [useQuoteContext, setUseQuoteContext] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialPrompt) {
      setInputMessage(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const quickPrompts = [
    {
      icon: <Lightbulb className="w-3.5 h-3.5 text-amber-400" />,
      label: 'Sugerir Concepto Creativo & Paleta',
      text: 'Genera un concepto creativo, dirección de arte y propuesta de paleta de colores para una marca moderna y sofisticada.',
    },
    {
      icon: <FileText className="w-3.5 h-3.5 text-neutral-300" />,
      label: 'Redactar Propuesta Comercial Persuasiva',
      text: 'Redacta una propuesta comercial persuasiva y ejecutiva para presentar la cotización activa al cliente, destacando el valor de los entregables y la inversión.',
    },
    {
      icon: <Clock className="w-3.5 h-3.5 text-amber-400" />,
      label: 'Estimar Horas & Alcance Web/Video',
      text: 'Calcula una estimación de horas de trabajo, número de revisiones recomendadas y desglose de fases para ejecutar los servicios cotizados.',
    },
    {
      icon: <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />,
      label: 'Crear Briefing para Cliente Nuevo',
      text: 'Genera un cuestionario/briefing de 8 preguntas clave que debemos enviar al cliente antes de iniciar la producción.',
    },
    {
      icon: <Mail className="w-3.5 h-3.5 text-slate-300" />,
      label: 'Redactar Email de Seguimiento',
      text: 'Redacta un correo electrónico profesional, cordial y elegante para dar seguimiento a la cotización enviada hace 3 días.',
    },
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Build request context if enabled
      let contextData = null;
      if (useQuoteContext && currentQuote) {
        contextData = {
          cotización: {
            numero: currentQuote.numeroCotizacion,
            cliente: currentQuote.cliente,
            servicios: currentQuote.servicios
              .filter(s => s.selected)
              .map(s => ({ nombre: s.name, cantidad: s.quantity, precio: s.price })),
            subtotal: currentQuote.subtotal,
            total: currentQuote.total,
            moneda: currentQuote.moneda,
          },
          proyectosActivos: projects.map(p => ({
            nombre: p.nombre,
            cliente: p.cliente,
            estado: p.estado,
            progreso: p.progreso,
          })),
        };
      }

      const formattedHistory = newMessages.map(m => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: formattedHistory,
          context: contextData,
        }),
      });

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const assistantMsg: ChatMessage = {
        id: `ast-${Date.now()}`,
        role: 'assistant',
        content: data.text || 'Sin respuesta generada.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Error in chat assistant:', err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ Ocurrió un error al consultar a Gemini: ${err.message || 'Error de conexión'}. Verifica que la API Key esté activa en los secretos.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'msg-1',
        role: 'assistant',
        content: 'Chat reiniciado. ¿En qué te ayudo hoy con la estrategia del estudio?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Banner Spatial Studio IA */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#10131e] via-[#0b0d14] to-[#07090f] p-6 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.8)] text-white">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-mono font-black bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white uppercase tracking-widest shadow flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                <span>INTELLIGENCE SUITE · BADLENZ</span>
              </span>
              <span className="text-xs text-zinc-400 font-mono">Gemini Studio Core</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-syne font-bold text-white tracking-tight">
              Asistente Creativo &amp; Estratégico IA
            </h1>
            <p className="text-zinc-300 text-xs font-dmsans max-w-2xl">
              Asesor inteligente para redactar propuestas, estructurar conceptos, calcular desgloses y optimizar sesiones.
            </p>
          </div>

          {/* Toggle Context */}
          <div className="flex items-center gap-3 bg-black/60 p-3 rounded-2xl border border-white/10 backdrop-blur-md shrink-0">
            <label className="text-xs text-zinc-300 font-semibold cursor-pointer flex items-center gap-2 font-syne">
              <input
                type="checkbox"
                checked={useQuoteContext}
                onChange={(e) => setUseQuoteContext(e.target.checked)}
                className="w-4 h-4 rounded text-red-600 focus:ring-red-500 bg-neutral-900 border-neutral-700 cursor-pointer"
              />
              <span>Contexto de Cotización Activa</span>
            </label>
          </div>
        </div>
      </div>

      {/* Preset Quick Actions */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">
          Prompts Rápidos para Estudio Creativo:
        </span>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(qp.text)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#111113] hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-neutral-300 hover:text-white transition-all whitespace-nowrap shadow-sm"
            >
              {qp.icon}
              <span>{qp.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Box Spatial Glass */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#111422] to-[#0a0c14] shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex flex-col h-[650px]">
        
        {/* Chat Header */}
        <div className="p-4 bg-neutral-950 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center">
              <Bot className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Gemini Studio Advisor</h3>
              <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-ping"></span>
                <span>En línea & listo para asesorar</span>
              </p>
            </div>
          </div>

          <button
            onClick={handleClearChat}
            className="text-neutral-400 hover:text-white text-xs flex items-center gap-1 p-2 rounded-lg hover:bg-neutral-800 transition-colors"
            title="Limpiar chat"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpiar</span>
          </button>
        </div>

        {/* Messages Stream Area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 scrollbar-thin">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-amber-400 font-bold text-xs flex-shrink-0 shadow-sm">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`space-y-1.5 max-w-2xl ${isUser ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-neutral-400">
                      {isUser ? 'Tú' : 'Asistente IA'}
                    </span>
                    <span className="text-[10px] text-neutral-500">{msg.timestamp}</span>
                  </div>

                  <div
                    className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-red-600 text-white rounded-tr-none font-medium shadow-md'
                        : 'bg-neutral-950 border border-neutral-800 text-slate-200 rounded-tl-none space-y-2'
                    }`}
                  >
                    {/* Rendered text content */}
                    <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

                    {!isUser && (
                      <div className="pt-2 flex items-center justify-end border-t border-neutral-800/80 mt-2">
                        <button
                          onClick={() => handleCopyMessage(msg.id, msg.content)}
                          className="text-[10px] text-neutral-400 hover:text-amber-400 flex items-center gap-1 font-semibold"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedId === msg.id ? 'Copiado' : 'Copiar texto'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-300 font-bold text-xs flex-shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-amber-400">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 text-xs text-amber-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4 animate-pulse text-amber-400" />
                <span>Generando respuesta estratégica con Gemini...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-neutral-950 border-t border-neutral-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-3"
          >
            <input
              type="text"
              placeholder="Escribe tu consulta sobre propuestas, precios o conceptos creativos..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={isLoading}
              className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs sm:text-sm text-white placeholder-neutral-500 outline-none focus:border-red-500 disabled:opacity-50 shadow-sm"
            />

            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="px-5 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-red-600/20"
            >
              <span>Enviar</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
