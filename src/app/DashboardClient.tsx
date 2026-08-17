'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  LayoutDashboard, 
  BarChart3, 
  PenTool, 
  MessageSquareText, 
  Settings,
  Plus,
  Image as ImageIcon,
  Send,
  Trash2,
  Clock,
  CalendarDays,
  CalendarIcon,
  Play,
  RefreshCw,
  LogOut,
  CheckCircle2,
  Users,
  X
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export const getSecureVideoUrl = (url: string) => {
  if (!url) return url;
  if (url.includes('209.50.229.10:3005/videos')) {
    return url.replace('http://209.50.229.10:3005/videos', '/vps-videos');
  }
  return url;
};

export default function DashboardClient({ initialPosts }: { initialPosts: any[] }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [posts, setPosts] = useState(initialPosts);

  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    type: 'alert' | 'confirm' | 'prompt';
    title: string;
    message: string;
    value?: string;
    resolve?: (val: any) => void;
  } | null>(null);

  const showDialog = (type: 'alert' | 'confirm' | 'prompt', title: string, message: string, defaultValue?: string): Promise<any> => {
    return new Promise((resolve) => {
      setDialog({ isOpen: true, type, title, message, value: defaultValue || '', resolve });
    });
  };

  return (
    <div className="flex h-screen bg-[#09090b] text-slate-300 font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#111116] border-r border-slate-800 flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-bold text-xl">
            D
          </div>
          <div>
            <h1 className="font-bold text-white text-lg leading-tight">Diário do Céu</h1>
            <p className="text-xs text-amber-500 font-medium tracking-wider">COMMAND CENTER</p>
          </div>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-2">
          <NavItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={PenTool} label="Criador (Post & Story)" active={activeTab === 'creator'} onClick={() => setActiveTab('creator')} />
          <NavItem icon={BarChart3} label="Analytics & Horários" active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
          <NavItem icon={MessageSquareText} label="Inbox (CRM)" active={activeTab === 'inbox'} onClick={() => setActiveTab('inbox')} />
          <NavItem icon={Plus} label="Automações (Robô)" active={activeTab === 'automations'} onClick={() => setActiveTab('automations')} />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <NavItem icon={Settings} label="Configurações" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto bg-gradient-to-br from-[#09090b] to-[#12121a]">
        {activeTab === 'dashboard' && <TabDashboard posts={posts} setPosts={setPosts} showDialog={showDialog} />}
        {activeTab === 'creator' && <TabCreator />}
        {activeTab === 'analytics' && <TabAnalytics />}
        {activeTab === 'inbox' && <TabInbox />}
        {activeTab === 'automations' && <TabAutomations showDialog={showDialog} />}
      </main>

      {/* CUSTOM DIALOG */}
      {dialog && dialog.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-[#111116] border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h3 className="text-white font-bold flex items-center gap-2">
                {dialog.title}
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-slate-300 text-sm leading-relaxed">{dialog.message}</p>
              {dialog.type === 'prompt' && (
                <textarea 
                  rows={4}
                  value={dialog.value}
                  onChange={(e) => setDialog({ ...dialog, value: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-3 outline-none focus:border-amber-500 transition-colors resize-none mt-2"
                />
              )}
            </div>
            
            <div className="p-4 border-t border-slate-800 bg-slate-900/30 flex gap-3 justify-end">
              {dialog.type !== 'alert' && (
                <button 
                  onClick={() => {
                    dialog.resolve?.(dialog.type === 'prompt' ? null : false);
                    setDialog(null);
                  }}
                  className="px-4 py-2 text-slate-400 font-bold hover:text-white transition-colors text-sm"
                >
                  Cancelar
                </button>
              )}
              <button 
                onClick={() => {
                  dialog.resolve?.(dialog.type === 'prompt' ? dialog.value : true);
                  setDialog(null);
                }}
                className={`px-6 py-2 font-bold rounded-lg transition-colors shadow-lg text-sm ${dialog.type === 'alert' ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20' : 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20'}`}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// --- TAB COMPONENTS ---

function TabDashboard({ posts, setPosts, showDialog }: { posts: any[], setPosts: any, showDialog: any }) {
  // Polling automático para atualizar posts que estão renderizando na VPS
  useEffect(() => {
    const hasPending = posts.some((p: any) => p.status === 'pending' || (p.media_type === 'REEL' && !p.video_url));
    if (!hasPending) return;
    
    const interval = setInterval(async () => {
      const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
      if (data) setPosts(data);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [posts, setPosts]);

  // Estado para controlar a semana atual do calendário (Começa na segunda-feira atual)
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date();
    const day = d.getDay(); // 0 é domingo, 1 é segunda
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [isGenerating, setIsGenerating] = useState(false);

  // Estado do Modal de Agendamento
  const [scheduleModal, setScheduleModal] = useState<{isOpen: boolean, post: any, dateVal: string}>({
    isOpen: false,
    post: null,
    dateVal: ''
  });

  // Estado do Modal de Visualização (Zoom)
  const [previewModal, setPreviewModal] = useState<any>(null);

  const handleDelete = async (id: string) => {
    const ok = await showDialog('confirm', 'Excluir Post', 'Tem certeza que deseja excluir esta postagem?');
    if (ok) {
      const { error } = await supabase.from('posts').delete().eq('id', id);
      if (!error) {
        setPosts(posts.filter((p: any) => p.id !== id));
      } else {
        showDialog('alert', 'Erro', 'Erro ao excluir: ' + error.message);
      }
    }
  };

  const handleEdit = async (post: any) => {
    const newText = await showDialog('prompt', 'Editar Texto', 'Edite o texto da postagem:', post.text);
    if (newText && newText !== post.text) {
      const { error } = await supabase.from('posts').update({ text: newText }).eq('id', post.id);
      if (!error) {
        setPosts(posts.map((p: any) => p.id === post.id ? { ...p, text: newText } : p));
      } else {
        showDialog('alert', 'Erro', 'Erro ao editar: ' + error.message);
      }
    }
  };

  const handleScheduleClick = (post: any, defaultDateStr?: string) => {
    let defaultPrompt = '';
    if (defaultDateStr) {
      defaultPrompt = defaultDateStr + "T10:00";
    } else if (post.scheduled_for) {
      const d = new Date(post.scheduled_for);
      const offset = d.getTimezoneOffset() * 60000;
      defaultPrompt = new Date(d.getTime() - offset).toISOString().slice(0, 16);
    } else {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const offset = tomorrow.getTimezoneOffset() * 60000;
      defaultPrompt = new Date(tomorrow.getTime() - offset).toISOString().slice(0, 16);
    }
    
    // Abre o Modal em vez do prompt feio
    setScheduleModal({ isOpen: true, post, dateVal: defaultPrompt });
  };

  const confirmSchedule = async () => {
    if (!scheduleModal.post || !scheduleModal.dateVal) return;
    const newDate = new Date(scheduleModal.dateVal);
    
    if (isNaN(newDate.getTime())) {
      showDialog('alert', 'Aviso', 'Data inválida.');
      return;
    }
    
    const { error } = await supabase.from('posts').update({ scheduled_for: newDate.toISOString() }).eq('id', scheduleModal.post.id);
    if (!error) {
      setPosts(posts.map((p: any) => p.id === scheduleModal.post.id ? { ...p, scheduled_for: newDate.toISOString() } : p));
      setScheduleModal({ isOpen: false, post: null, dateVal: '' }); // Fechar modal
    } else {
      showDialog('alert', 'Erro', 'Erro ao agendar: ' + error.message);
    }
  };

  const handleUnschedule = async (post: any) => {
    const { error } = await supabase.from('posts').update({ scheduled_for: null }).eq('id', post.id);
    if (!error) {
      setPosts(posts.map((p: any) => p.id === post.id ? { ...p, scheduled_for: null } : p));
    }
  };

  const handleGenerateBatch = async () => {
    // We use a prompt dialog to choose the type. 
    // Wait, the showDialog doesn't support multiple buttons easily. Let's use a native prompt or a confirm where "OK"=Reel, "Cancel"=Image?
    // Better: let's just make it simpler.
    const typeStr = await showDialog('prompt', 'Escolha o Formato', 'Digite REEL para gerar um lote de vídeos narrados, ou deixe em branco para IMAGENS (Feed):', '');
    const mediaType = (typeStr && typeStr.toUpperCase() === 'REEL') ? 'REEL' : 'IMAGE';

    setIsGenerating(true);
    let generatedCount = 0;
    
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'auto', mediaType, isAuto: false, hourIndex: Math.floor(Math.random() * 8) })
      });
      
      // Verifica se a Vercel retornou um HTML de erro (ex: 504 Gateway Timeout)
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const textError = await res.text();
        console.error("Vercel error:", res.status, textError);
        showDialog('alert', 'Servidor Sobrecarregado', 'A Vercel ou o Google demoraram muito para responder (Erro ' + res.status + '). Tente novamente em alguns instantes.');
        setIsGenerating(false);
        return;
      }

      const data = await res.json();
      
      if (data.success && data.posts && data.posts.length > 0) {
        generatedCount++;
        // Atualiza a tela na hora com o post recém gerado!
        setPosts((prev: any[]) => [data.posts[0], ...prev]);
      } else {
        console.error("Erro no post", data.error);
        
        // Se for erro de cota (429) ou sobrecarga do Google (503)
        if (data.error && (data.error.includes('503') || data.error.includes('429') || data.error.includes('Too Many Requests'))) {
          showDialog('alert', 'Aviso do Google', 'O robô de Inteligência Artificial do Google (Gemini) atingiu o limite de requisições gratuitas por minuto. Aguarde cerca de 1 minuto e tente novamente!');
        } else {
          showDialog('alert', 'Erro', 'Falha ao gerar o conteúdo: ' + data.error);
        }
      }
      
      if (generatedCount > 0) {
        showDialog('alert', 'Sucesso', `Novo ${mediaType} gerado com sucesso e adicionado aos Rascunhos!`);
      }
    } catch (e: any) {
      showDialog('alert', 'Erro', 'Erro fatal: ' + e.message);
    }
    setIsGenerating(false);
  };

  const handlePublishNow = async (post: any) => {
    const ok = await showDialog('confirm', 'Publicar Agora', 'Deseja realmente publicar essa arte no seu Instagram agora? Isso pode demorar até 1 minuto.');
    if (ok) {
      try {
        const res = await fetch('/api/publish-now', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ postId: post.id })
        });
        
        const data = await res.json();
        
        if (data.success) {
          await showDialog('alert', 'Sucesso', 'Post publicado com sucesso no Instagram!');
          setPosts(posts.map((p: any) => p.id === post.id ? { ...p, status: 'published', scheduled_for: null } : p));
        } else {
          await showDialog('alert', 'Erro', 'Erro ao publicar: ' + data.error);
        }
      } catch (e: any) {
        await showDialog('alert', 'Erro', 'Erro ao chamar a API de publicação: ' + e.message);
      }
    }
  };

  const prevWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() - 7);
    setCurrentWeekStart(d);
  };

  const nextWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + 7);
    setCurrentWeekStart(d);
  };

  // Separar os posts
  const unscheduledPosts = posts.filter(p => p.status === 'pending' && !p.scheduled_for);
  
  // Gerar os dias da semana
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const monthName = currentWeekStart.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();

  return (
    <div className="p-8 h-full flex flex-col space-y-6">
      <header className="flex justify-between items-end shrink-0">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Planner Calendário</h2>
          <p className="text-slate-400">Arraste a visão geral para o nível profissional. Agende o que vai ao ar.</p>
        </div>
        <button 
          onClick={handleGenerateBatch}
          disabled={isGenerating}
          className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold py-2 px-6 rounded-lg shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all flex items-center gap-2"
        >
          <CalendarDays size={18} />
          {isGenerating ? 'Gerando...' : 'Gerar Novo Vídeo/Post'}
        </button>
      </header>

      <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
        
        {/* COLUNA ESQUERDA: RASCUNHOS / NÃO AGENDADOS */}
        <div className="w-72 shrink-0 bg-[#111116] border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
            <h3 className="font-bold text-white">Não Agendados</h3>
            <span className="bg-amber-500/20 text-amber-500 text-xs px-2 py-1 rounded-full font-bold">{unscheduledPosts.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {unscheduledPosts.length === 0 ? (
              <p className="text-slate-500 text-sm text-center mt-4">Nenhum post de rascunho.</p>
            ) : (
              unscheduledPosts.map(post => (
                <div key={post.id} className="bg-slate-900 border border-slate-700 hover:border-amber-500/50 rounded-xl overflow-hidden transition-all group cursor-pointer" onClick={() => setPreviewModal(post)}>
                  {post.media_type === 'REEL' ? (
                    post.video_url ? (
                      <video src={getSecureVideoUrl(post.video_url)} className="w-full aspect-square object-cover opacity-80 group-hover:opacity-100 transition-opacity" controls controlsList="nodownload" />
                    ) : (
                      <div className="w-full aspect-square bg-slate-800 flex flex-col items-center justify-center opacity-80">
                        <RefreshCw className="animate-spin text-amber-500 mb-2" size={24} />
                        <span className="text-xs text-amber-500 font-bold">Gerando Vídeo...</span>
                      </div>
                    )
                  ) : (
                    <img src={post.image_url} className="w-full aspect-square object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  )}
                  <div className="p-3 bg-slate-900">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold uppercase text-amber-500">{post.type}</span>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(post.id); }} className="text-slate-500 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                    </div>
                    <div className="flex gap-2 w-full">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleScheduleClick(post); }}
                        className="flex-1 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded text-xs font-bold transition-colors flex items-center justify-center gap-1"
                      >
                        <CalendarDays size={12} /> Agendar
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handlePublishNow(post); }}
                        className="flex-1 py-1.5 bg-green-500/10 hover:bg-green-500/20 text-green-500 rounded text-xs font-bold transition-colors flex items-center justify-center gap-1"
                      >
                        <Send size={12} /> Publicar
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* COLUNA DIREITA: CALENDÁRIO */}
        <div className="flex-1 bg-[#111116] border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
          
          {/* Calendar Header */}
          <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
            <h3 className="font-bold text-white text-lg capitalize">{monthName}</h3>
            <div className="flex gap-2">
              <button onClick={prevWeek} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                &larr; Semana Ant.
              </button>
              <button onClick={nextWeek} className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
                Próx. Semana &rarr;
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="flex-1 grid grid-cols-7 overflow-y-auto">
            {weekDays.map((day, index) => {
              // Obter o YYYY-MM-DD local, para não ter conflito de fuso horário UTC
              const localDateStr = day.toLocaleDateString('en-CA');
              const dayName = day.toLocaleDateString('pt-BR', { weekday: 'short' });
              
              // Encontrar posts agendados para este dia (comparando no tempo local)
              // Se o post já estiver publicado mas não tiver data de agendamento (posts antigos), usamos a data de criação como histórico
              const dayPosts = posts.filter(p => {
                const targetDate = p.scheduled_for || (p.status === 'published' ? p.created_at : null);
                if (!targetDate) return false;
                const pDate = new Date(targetDate);
                const pLocalDateStr = pDate.toLocaleDateString('en-CA');
                return pLocalDateStr === localDateStr;
              }).sort((a, b) => {
                const dateA = a.scheduled_for || a.created_at;
                const dateB = b.scheduled_for || b.created_at;
                return new Date(dateA).getTime() - new Date(dateB).getTime();
              });

              const isToday = new Date().toLocaleDateString('en-CA') === localDateStr;

              return (
                <div key={localDateStr} className={`border-r border-slate-800 last:border-r-0 flex flex-col ${isToday ? 'bg-amber-500/5' : ''}`}>
                  
                  {/* Cabeçalho do Dia */}
                  <div className={`p-3 text-center border-b border-slate-800 sticky top-0 ${isToday ? 'bg-amber-500/10' : 'bg-[#111116]'}`}>
                    <p className={`text-xs font-bold uppercase ${isToday ? 'text-amber-500' : 'text-slate-500'}`}>{dayName}</p>
                    <p className={`text-lg font-bold ${isToday ? 'text-amber-500' : 'text-white'}`}>{day.getDate()}</p>
                  </div>

                  {/* Slots do Dia */}
                  <div className="flex-1 p-2 space-y-3 overflow-y-auto min-h-[400px]">
                    {dayPosts.map(post => {
                      const targetTimeDate = post.scheduled_for || post.created_at;
                      const timeStr = new Date(targetTimeDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                      const isPublished = post.status === 'published';

                      return (
                        <div key={post.id} className={`rounded-lg border overflow-hidden group transition-all hover:scale-105 cursor-pointer ${isPublished ? 'border-green-500/30' : 'border-blue-500/30'}`} onClick={() => setPreviewModal(post)}>
                          
                          <div className={`text-[10px] font-bold px-2 py-1 text-center flex items-center justify-center gap-1 ${isPublished ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                            {isPublished ? <span>PUBLICADO {timeStr}</span> : <><Clock size={10} /> {timeStr}</>}
                          </div>
                          
                          <div className="relative aspect-square">
                            {post.media_type === 'REEL' ? (
                              post.video_url ? (
                                <video src={getSecureVideoUrl(post.video_url)} className="w-full h-full object-cover" muted loop playsInline onMouseOver={(e) => (e.target as HTMLVideoElement).play()} onMouseOut={(e) => (e.target as HTMLVideoElement).pause()} />
                              ) : (
                                <div className="w-full h-full bg-slate-800 flex flex-col items-center justify-center">
                                  <RefreshCw className="animate-spin text-amber-500 mb-2" size={20} />
                                  <span className="text-[10px] text-amber-500 font-bold text-center px-2">Processando Reel...</span>
                                </div>
                              )
                            ) : (
                              <img src={post.image_url} className="w-full h-full object-cover" />
                            )}
                            
                            {/* Hover Actions */}
                            <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity p-2">
                              {!isPublished && (
                                <>
                                  <button onClick={(e) => { e.stopPropagation(); handleScheduleClick(post); }} className="w-full bg-slate-800 text-white text-[10px] py-1 rounded hover:bg-slate-700">Mudar Hora</button>
                                  <button onClick={(e) => { e.stopPropagation(); handleUnschedule(post); }} className="w-full bg-red-500/20 text-red-400 text-[10px] py-1 rounded hover:bg-red-500/40">Desagendar</button>
                                </>
                              )}
                              <button onClick={(e) => { e.stopPropagation(); handleEdit(post); }} className="w-full bg-amber-500/20 text-amber-500 text-[10px] py-1 rounded hover:bg-amber-500/40">Editar Texto</button>
                            </div>
                          </div>
                          
                        </div>
                      );
                    })}

                    {/* Botão de adicionar direto no dia */}
                    <button 
                      onClick={() => {
                        const unscheduled = posts.find(p => p.status === 'pending' && !p.scheduled_for);
                        if(unscheduled) {
                          handleScheduleClick(unscheduled, localDateStr);
                        } else {
                          showDialog('alert', 'Aviso', "Você não tem posts em Rascunho. Gere um novo lote primeiro!");
                        }
                      }}
                      className="w-full py-2 border-2 border-dashed border-slate-800 rounded-lg text-slate-500 hover:text-amber-500 hover:border-amber-500/50 transition-colors flex justify-center opacity-0 hover:opacity-100"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      </div>
      
      {/* MODAL DE ZOOM / PREVIEW */}
      {previewModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[200] flex items-center justify-center p-4" onClick={() => setPreviewModal(null)}>
          <button className="absolute top-6 right-6 text-white hover:text-amber-500 p-2 transition-colors"><X size={36} /></button>
          
          <div className="max-w-3xl max-h-[90vh] flex flex-col items-center animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            {previewModal.media_type === 'REEL' ? (
              previewModal.video_url ? (
                <video src={getSecureVideoUrl(previewModal.video_url)} className="max-w-full max-h-[70vh] rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-slate-800" controls autoPlay controlsList="nodownload" />
              ) : (
                <div className="w-[350px] h-[600px] bg-[#111116] rounded-xl flex flex-col items-center justify-center shadow-2xl border border-slate-800">
                   <RefreshCw className="animate-spin text-amber-500 mb-6" size={56} />
                   <h3 className="text-2xl font-bold text-white mb-2">Vídeo em Produção</h3>
                   <p className="text-slate-400 text-center px-8 text-sm">A Inteligência Artificial está narrando o roteiro, encontrando um vídeo cinematográfico e realizando a renderização. Isso pode levar alguns minutos.</p>
                </div>
              )
            ) : (
              <img src={previewModal.image_url} className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-slate-800" />
            )}
            
            <div className="mt-8 bg-[#111116]/80 backdrop-blur-md p-5 rounded-2xl border border-slate-800 text-center w-full shadow-2xl">
              <p className="text-sm md:text-base text-amber-500 font-bold uppercase mb-2">Roteiro / Texto Gerado</p>
              <p className="text-lg text-white font-medium italic">"{previewModal.text}"</p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE AGENDAMENTO */}
      {scheduleModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#111116] border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
              <h3 className="text-white font-bold flex items-center gap-2">
                <CalendarDays className="text-amber-500" size={18} />
                Agendar Postagem
              </h3>
              <button 
                onClick={() => setScheduleModal({ isOpen: false, post: null, dateVal: '' })} 
                className="text-slate-400 hover:text-white transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {scheduleModal.post && (
                <div className="flex gap-4 items-center bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                  {scheduleModal.post.media_type === 'REEL' ? (
                    scheduleModal.post.video_url ? (
                       <video src={getSecureVideoUrl(scheduleModal.post.video_url)} className="w-16 h-16 object-cover rounded-lg" autoPlay muted loop />
                    ) : (
                       <div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center"><Play size={16} className="text-amber-500" /></div>
                    )
                  ) : (
                    <img src={scheduleModal.post.image_url} className="w-16 h-16 object-cover rounded-lg" />
                  )}
                  <div>
                    <p className="text-xs font-bold text-amber-500 uppercase">{scheduleModal.post.type}</p>
                    <p className="text-sm text-slate-300 line-clamp-2">{scheduleModal.post.text}</p>
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-400">Data e Hora Exata</label>
                <input 
                  type="datetime-local" 
                  value={scheduleModal.dateVal}
                  onChange={(e) => setScheduleModal({ ...scheduleModal, dateVal: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-3 outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-800 bg-slate-900/30 flex gap-3 justify-end">
              <button 
                onClick={() => setScheduleModal({ isOpen: false, post: null, dateVal: '' })}
                className="px-4 py-2 text-slate-400 font-bold hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmSchedule}
                className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg transition-colors shadow-lg shadow-amber-500/20"
              >
                Salvar Data
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function TabCreator() {
  return (
    <div className="p-10 max-w-5xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Criador de Postagens</h2>
        <p className="text-slate-400">Escreva o texto e o sistema gera a arte na hora, pronta para ir para o Feed ou Stories.</p>
      </div>
      
      <div className="bg-[#111116] p-8 rounded-2xl border border-slate-800 shadow-2xl">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Formato</label>
            <div className="flex gap-4">
              <button className="flex-1 py-3 border-2 border-amber-500 rounded-lg text-amber-500 font-bold bg-amber-500/10">Feed (1080x1080)</button>
              <button className="flex-1 py-3 border border-slate-700 rounded-lg text-slate-400 hover:bg-slate-800 transition-colors">Story (1080x1920)</button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Tipo de Conteúdo</label>
            <select className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-amber-500">
              <option value="devocional">Devocional (Mensagem Diária)</option>
              <option value="promessa">Promessa (Caixinha Bíblica)</option>
              <option value="motivacional">Frase Motivacional</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Sua Mensagem</label>
            <textarea 
              rows={4} 
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-4 text-white outline-none focus:border-amber-500 resize-none"
              placeholder="Digite o texto que aparecerá na imagem..."
            />
          </div>
          <button className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-4 rounded-lg flex items-center justify-center gap-2 text-lg">
            <ImageIcon size={24} />
            Gerar Arte e Publicar
          </button>
        </div>
      </div>
    </div>
  );
}

function TabAnalytics() {
  const [data, setData] = useState<any>(null);
  const [isMock, setIsMock] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics')
      .then(r => r.json())
      .then(res => {
        setData(res.data);
        setIsMock(res.isMock);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="p-10 h-full flex items-center justify-center">
        <div className="text-amber-500 flex flex-col items-center gap-4">
          <RefreshCw className="animate-spin" size={32} />
          <p className="font-bold">Analisando dados do Instagram...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="p-10 text-white">Erro ao carregar métricas.</div>;
  }

  return (
    <div className="p-10 space-y-8 max-w-7xl mx-auto overflow-y-auto max-h-full">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
            Análise de Engajamento
            {isMock ? (
              <span className="text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded-full border border-red-500/50 flex items-center gap-1">
                <CheckCircle2 size={12} /> DADOS SIMULADOS (MOCK)
              </span>
            ) : (
              <span className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full border border-green-500/50 flex items-center gap-1">
                <CheckCircle2 size={12} /> DADOS REAIS AO VIVO
              </span>
            )}
          </h2>
          <p className="text-slate-400">
            {isMock 
              ? "⚠️ O Token atual não tem permissões de Insights. Mostrando demonstração." 
              : "Dados ao vivo do seu público e alcance extraídos da Graph API."}
          </p>
        </div>
      </header>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-amber-500/10 to-transparent p-6 rounded-2xl border border-amber-500/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-500/20 rounded-lg text-amber-500"><Users size={20}/></div>
            <h3 className="text-slate-400 font-bold uppercase text-xs">Total de Seguidores</h3>
          </div>
          <p className="text-4xl font-bold text-white">{data.followers_count.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500/10 to-transparent p-6 rounded-2xl border border-blue-500/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/20 rounded-lg text-blue-500"><BarChart3 size={20}/></div>
            <h3 className="text-slate-400 font-bold uppercase text-xs">Alcance (28 dias)</h3>
          </div>
          <p className="text-4xl font-bold text-white">+{data.reach.reduce((acc:any, curr:any) => acc + curr.value, 0).toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-gradient-to-br from-green-500/10 to-transparent p-6 rounded-2xl border border-green-500/20">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/20 rounded-lg text-green-500"><ImageIcon size={20}/></div>
            <h3 className="text-slate-400 font-bold uppercase text-xs">Total de Posts</h3>
          </div>
          <p className="text-4xl font-bold text-white">{data.media_count}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Alcance */}
        <div className="bg-[#111116] border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-6">Crescimento de Alcance Diário</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.reach}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#f59e0b' }}
                />
                <Line type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', strokeWidth: 2 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Horários de Pico */}
        <div className="bg-[#111116] border border-slate-800 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-2">Horários de Maior Audiência</h3>
          <p className="text-sm text-slate-400 mb-6">Base usado para o agendamento automático do robô.</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.peakHours}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  cursor={{fill: '#1e293b'}}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
}

function TabInbox() {
  return (
    <div className="p-10 max-w-7xl mx-auto space-y-8 flex flex-col items-center justify-center h-[80vh] text-center">
      <MessageSquareText size={64} className="text-blue-500 mb-4 opacity-50" />
      <h2 className="text-3xl font-bold text-white">Inbox CRM Integrado</h2>
      <p className="text-slate-400 max-w-lg">
        Essa aba receberá os directs, comentários e mensagens do Messenger em tempo real via Webhooks.
        Requer as permissões <strong className="text-blue-400">pages_messaging</strong> e <strong className="text-blue-400">instagram_manage_messages</strong>.
      </p>
    </div>
  );
}

function TabAutomations({ showDialog }: { showDialog: any }) {
  const [automations, setAutomations] = useState<any[]>([]);
  const [triggerWord, setTriggerWord] = useState('');
  const [commentReply, setCommentReply] = useState('');
  const [dmReply, setDmReply] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAutomations();
  }, []);

  async function fetchAutomations() {
    const { data } = await supabase.from('automations').select('*').order('created_at', { ascending: false });
    if (data) setAutomations(data);
  }

  async function handleSave() {
    if (!triggerWord || !dmReply) {
      showDialog('alert', 'Aviso', 'A palavra-chave e a mensagem do Direct são obrigatórias!');
      return;
    }
    setLoading(true);
    
    await supabase.from('automations').insert({
      trigger_word: triggerWord,
      comment_reply: commentReply,
      dm_reply: dmReply,
      is_active: true
    });

    setTriggerWord('');
    setCommentReply('');
    setDmReply('');
    await fetchAutomations();
    setLoading(false);
  }

  async function handleDelete(id: string) {
    const ok = await showDialog('confirm', 'Excluir Regra', 'Tem certeza que deseja excluir esta regra?');
    if (ok) {
      await supabase.from('automations').delete().eq('id', id);
      await fetchAutomations();
    }
  }

  return (
    <div className="p-10 max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Automações do Robô</h2>
          <p className="text-slate-400">Configure as palavras-chave que ativarão respostas automáticas no Direct e Comentários.</p>
        </div>
      </div>
      
      <div className="bg-[#111116] p-8 rounded-2xl border border-slate-800 shadow-2xl space-y-6">
        {/* Formulário de Criação Rápida */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Se o usuário digitar:</label>
            <input 
              type="text" 
              value={triggerWord}
              onChange={e => setTriggerWord(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-amber-500" 
              placeholder="ex: quero, me manda, amém" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Responder no Comentário (opcional):</label>
            <input 
              type="text" 
              value={commentReply}
              onChange={e => setCommentReply(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-amber-500" 
              placeholder="ex: Te enviei no direct! ❤️" 
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-400 mb-2">E enviar no Direct (Mensagem Privada):</label>
            <textarea 
              rows={3} 
              value={dmReply}
              onChange={e => setDmReply(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-4 text-white outline-none focus:border-amber-500 resize-none" 
              placeholder="Aqui está o que você pediu: https://link..." 
            />
          </div>
        </div>
        <button 
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? 'Salvando...' : 'Salvar Nova Regra'}
        </button>

        {/* Lista de Automações Ativas */}
        <div className="pt-6 border-t border-slate-800 mt-6">
          <h3 className="text-lg font-bold text-white mb-4">Regras Ativas (Banco de Dados)</h3>
          
          {automations.length === 0 ? (
            <p className="text-slate-500 text-sm">Nenhuma regra configurada ainda.</p>
          ) : (
            <div className="space-y-4">
              {automations.map(auto => (
                <div key={auto.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex justify-between items-center">
                  <div>
                    <p className="text-amber-500 font-bold">Palavra: "{auto.trigger_word}"</p>
                    {auto.comment_reply && <p className="text-sm text-slate-400 mt-1">📝 Comentário: "{auto.comment_reply}"</p>}
                    <p className="text-sm text-slate-400">💬 Direct: "{auto.dm_reply}"</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full font-bold h-fit">Ativa</span>
                    <button onClick={() => handleDelete(auto.id)} className="text-red-500 hover:text-red-400 p-1 h-fit"><Trash2 size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// --- UTILS ---

function NavItem({ icon: Icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm
        ${active 
          ? 'bg-amber-500/10 text-amber-500' 
          : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
        }
      `}
    >
      <Icon size={20} className={active ? "text-amber-500" : "opacity-70"} />
      {label}
    </button>
  );
}

function StatCard({ title, value, icon: Icon }: { title: string, value: string, icon: any }) {
  return (
    <div className="bg-[#111116] p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-400 mb-1 font-medium">{title}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
      </div>
      <div className="w-12 h-12 rounded-xl bg-slate-800/50 flex items-center justify-center text-amber-500">
        <Icon size={24} />
      </div>
    </div>
  );
}
