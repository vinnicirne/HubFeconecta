import ApproveButton from "@/components/ApproveButton";
import GenerateButton from "@/components/GenerateButton";
import SocialAuthButton from "@/components/SocialAuthButton";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  // Fetch latest 10 posts from Supabase
  let posts: any[] = [];
  try {
    const { data } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (data) posts = data;
  } catch (error) {
    console.error("Erro ao carregar posts:", error);
  }

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex justify-between items-center bg-white dark:bg-neutral-800 p-6 rounded-xl shadow-sm border border-neutral-200 dark:border-neutral-700">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">Diário do Céu</h1>
            <p className="text-neutral-500 dark:text-neutral-400">Painel de Administração e Geração de Conteúdo</p>
          </div>
          <div className="flex gap-4">
            <SocialAuthButton />
            <GenerateButton />
          </div>
        </header>

        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-neutral-800 dark:text-neutral-100">Posters Gerados Recentemente</h2>
          </div>
          
          {posts.length === 0 ? (
            <div className="bg-white dark:bg-neutral-800 rounded-xl p-12 text-center border border-dashed border-neutral-300 dark:border-neutral-700">
              <p className="text-neutral-500 dark:text-neutral-400">Nenhum post gerado ainda. Clique em "Gerar Novo Lote" para iniciar a IA.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {posts.map((post) => (
                <div key={post.id} className="bg-white dark:bg-neutral-800 rounded-xl overflow-hidden shadow-sm border border-neutral-200 dark:border-neutral-700 hover:shadow-md transition-shadow flex flex-col">
                  <div className="aspect-square relative bg-neutral-200 w-full">
                    {/* The OG Image endpoint needs absolute URL in production, but relative works via next/image for local domains if configured, we use standard img here to avoid next/image domain whitelisting issues for dynamic OG params */}
                    <img 
                      src={post.image_url} 
                      alt={`Poster do tipo ${post.type}`}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="p-4 border-t border-neutral-100 dark:border-neutral-700 flex-1 flex flex-col">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-medium text-neutral-900 dark:text-white capitalize">{post.type}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        post.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        post.status === 'posted' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {post.status}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 line-clamp-3 mb-4 flex-1">"{post.text}"</p>
                    <div className="mt-auto flex gap-2">
                      {post.status === 'pending' && <ApproveButton postId={post.id} />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
