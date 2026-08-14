'use client';

import { useState } from 'react';
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
  Clock
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
        {activeTab === 'dashboard' && <TabDashboard posts={posts} />}
        {activeTab === 'creator' && <TabCreator />}
        {activeTab === 'analytics' && <TabAnalytics />}
        {activeTab === 'inbox' && <TabInbox />}
        {activeTab === 'automations' && <TabAutomations />}
      </main>

    </div>
  );
}

// --- TAB COMPONENTS ---

function TabDashboard({ posts }: { posts: any[] }) {
  return (
    <div className="p-10 space-y-8 max-w-7xl mx-auto">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Visão Geral</h2>
          <p className="text-slate-400">Acompanhe as últimas publicações geradas pelo sistema.</p>
        </div>
        <button className="bg-amber-500 hover:bg-amber-400 text-black font-bold py-2 px-6 rounded-lg shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all flex items-center gap-2">
          <PenTool size={18} />
          Gerar Novo Lote (n8n)
        </button>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total de Publicações" value={posts.length.toString()} icon={ImageIcon} />
        <StatCard title="Posts Pendentes" value={posts.filter(p => p.status === 'pending').length.toString()} icon={Clock} />
        <StatCard title="Alcance Estimado" value="Calculando..." icon={BarChart3} />
      </div>

      {/* Posts Grid */}
      <div className="bg-[#111116] rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h3 className="text-lg font-bold text-white">Histórico Recente</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
          {posts.map((post) => (
            <div key={post.id} className="group relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-amber-500/50 transition-colors">
              <div className="aspect-square bg-slate-950">
                <img src={post.image_url} alt="Post" className="w-full h-full object-cover" />
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
                <p className="text-sm text-slate-300 line-clamp-2">"{post.text}"</p>
              </div>
            </div>
          ))}
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
  return (
    <div className="p-10 max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Automações do Robô</h2>
          <p className="text-slate-400">Configure as palavras-chave que ativarão respostas automáticas no Direct e Comentários.</p>
        </div>
        <button className="bg-amber-500 hover:bg-amber-400 text-black font-bold py-2 px-6 rounded-lg shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all flex items-center gap-2">
          <Plus size={18} />
          Nova Regra
        </button>
      </div>
      
      <div className="bg-[#111116] p-8 rounded-2xl border border-slate-800 shadow-2xl space-y-6">
        {/* Formulário de Criação Rápida */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Se o usuário digitar:</label>
            <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-amber-500" placeholder="ex: quero, me manda, link" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Responder no Comentário:</label>
            <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white outline-none focus:border-amber-500" placeholder="ex: Te enviei no direct! ❤️" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-400 mb-2">E enviar no Direct (Mensagem Privada):</label>
            <textarea rows={3} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-4 text-white outline-none focus:border-amber-500 resize-none" placeholder="Aqui está o que você pediu: https://link..." />
          </div>
        </div>
        <button className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-lg transition-colors">
          Salvar Nova Regra
        </button>

        {/* Lista de Automações Ativas */}
        <div className="pt-6 border-t border-slate-800 mt-6">
          <h3 className="text-lg font-bold text-white mb-4">Regras Ativas (Banco de Dados)</h3>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex justify-between items-center">
            <div>
              <p className="text-amber-500 font-bold">Palavra: "quero"</p>
              <p className="text-sm text-slate-400">Direct: "Olá! Recebemos o seu 'quero'..."</p>
            </div>
            <div className="flex gap-2">
              <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full font-bold">Ativa</span>
              <button className="text-red-500 hover:text-red-400 p-1"><Trash2 size={16} /></button>
            </div>
          </div>
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
