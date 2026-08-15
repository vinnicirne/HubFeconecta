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
  CalendarIcon
} from 'lucide-react';

export default function DashboardClient({ initialPosts }: { initialPosts: any[] }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [posts, setPosts] = useState(initialPosts);

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
        {activeTab === 'dashboard' && <TabDashboard posts={posts} setPosts={setPosts} />}
        {activeTab === 'creator' && <TabCreator />}
        {activeTab === 'analytics' && <TabAnalytics />}
        {activeTab === 'inbox' && <TabInbox />}
        {activeTab === 'automations' && <TabAutomations />}
      </main>

    </div>
  );
}

// --- TAB COMPONENTS ---

function TabDashboard({ posts, setPosts }: { posts: any[], setPosts: any }) {
  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta postagem?')) {
      const { error } = await supabase.from('posts').delete().eq('id', id);
      if (!error) {
        setPosts(posts.filter((p: any) => p.id !== id));
      } else {
        alert('Erro ao excluir: ' + error.message);
      }
    }
  };

  const handleEdit = async (post: any) => {
    const newText = prompt('Edite o texto da postagem:', post.text);
    if (newText && newText !== post.text) {
      const { error } = await supabase.from('posts').update({ text: newText }).eq('id', post.id);
      if (!error) {
        setPosts(posts.map((p: any) => p.id === post.id ? { ...p, text: newText } : p));
      } else {
        alert('Erro ao editar: ' + error.message);
      }
    }
  };

  const handleReschedule = async (id: string, newDate: string) => {
    const { error } = await supabase.from('posts').update({ scheduled_for: new Date(newDate).toISOString() }).eq('id', id);
    if (!error) {
      setPosts(posts.map((p: any) => p.id === id ? { ...p, scheduled_for: new Date(newDate).toISOString() } : p));
    } else {
      alert('Erro ao agendar: ' + error.message);
    }
  };

  // Organizar posts do mais recente para o mais antigo, mas colocar os pendentes com data futura primeiro
  const sortedPosts = [...posts].sort((a, b) => {
    if (a.status === 'pending' && b.status === 'published') return -1;
    if (a.status === 'published' && b.status === 'pending') return 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="p-10 space-y-8 max-w-7xl mx-auto">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Calendário e Visão Geral</h2>
          <p className="text-slate-400">Acompanhe as últimas publicações e agende os próximos conteúdos.</p>
        </div>
        <button className="bg-amber-500 hover:bg-amber-400 text-black font-bold py-2 px-6 rounded-lg shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all flex items-center gap-2">
          <CalendarDays size={18} />
          Gerar e Agendar Novo Lote
        </button>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total de Publicações" value={posts.length.toString()} icon={ImageIcon} />
        <StatCard title="Posts Pendentes" value={posts.filter(p => p.status === 'pending').length.toString()} icon={Clock} />
        <StatCard title="Alcance Estimado" value="Calculando..." icon={BarChart3} />
      </div>

      {/* Posts Grid */}
      <div className="bg-[#111116] rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <h3 className="text-lg font-bold text-white flex items-center gap-2"><CalendarIcon className="text-amber-500" size={20} /> Calendário de Postagens</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
          {sortedPosts.map((post) => {
            // Formatar data local para o input datetime-local
            let dateVal = "";
            if (post.scheduled_for) {
              const d = new Date(post.scheduled_for);
              // O input datetime-local requer YYYY-MM-DDThh:mm
              const offset = d.getTimezoneOffset() * 60000;
              dateVal = new Date(d.getTime() - offset).toISOString().slice(0, 16);
            }

            return (
              <div key={post.id} className={`group relative rounded-xl overflow-hidden bg-slate-900 border transition-colors ${post.status === 'pending' ? 'border-blue-500/30 hover:border-blue-500' : 'border-slate-800 hover:border-slate-600'}`}>
                <div className="aspect-square bg-slate-950 relative">
                  <img src={post.image_url} alt="Post" className="w-full h-full object-cover" />
                  {post.status === 'pending' && (
                    <div className="absolute top-2 right-2 bg-blue-500/90 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg backdrop-blur-sm flex items-center gap-1">
                      <Clock size={12} /> AGENDADO
                    </div>
                  )}
                </div>
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold uppercase text-amber-500">{post.type}</span>
                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${
                      post.status === 'pending' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'
                    }`}>
                      {post.status}
                    </span>
                  </div>
                  
                  {post.status === 'pending' ? (
                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                      <label className="text-[10px] text-slate-500 font-bold uppercase mb-1 block">Vai ao ar em:</label>
                      <input 
                        type="datetime-local" 
                        value={dateVal}
                        onChange={(e) => handleReschedule(post.id, e.target.value)}
                        className="w-full bg-transparent text-slate-300 text-xs outline-none cursor-pointer"
                      />
                    </div>
                  ) : (
                    <div className="bg-green-500/5 p-2 rounded-lg border border-green-500/10 text-center">
                      <span className="text-[10px] text-green-500/70 font-bold uppercase block">Já Publicado</span>
                    </div>
                  )}

                  <p className="text-sm text-slate-300 line-clamp-2 mt-2" title={post.text}>"{post.text}"</p>
                  
                  <div className="flex gap-2 pt-2 border-t border-slate-800/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(post)} className="flex-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 rounded flex items-center justify-center gap-1">
                      <PenTool size={12} /> Editar
                    </button>
                    <button onClick={() => handleDelete(post.id)} className="flex-1 text-xs bg-red-500/10 hover:bg-red-500/20 text-red-500 py-1.5 rounded flex items-center justify-center gap-1">
                      <Trash2 size={12} /> Apagar
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
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
  return (
    <div className="p-10 max-w-7xl mx-auto space-y-8 flex flex-col items-center justify-center h-[80vh] text-center">
      <BarChart3 size={64} className="text-amber-500 mb-4 opacity-50" />
      <h2 className="text-3xl font-bold text-white">Analytics em Construção</h2>
      <p className="text-slate-400 max-w-lg">
        Para que os gráficos de alcance e horário de pico apareçam aqui, certifique-se de ter adicionado as permissões 
        <strong className="text-amber-500"> read_insights </strong> e 
        <strong className="text-amber-500"> instagram_manage_insights </strong>
        no seu Token do Facebook.
      </p>
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

function TabAutomations() {
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
    if (!triggerWord || !dmReply) return alert('A palavra-chave e a mensagem do Direct são obrigatórias!');
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
    if (confirm('Tem certeza que deseja excluir esta regra?')) {
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
