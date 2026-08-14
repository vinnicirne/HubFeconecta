import { supabase } from "@/lib/supabase";
import DashboardClient from "./DashboardClient";

export const dynamic = "force-dynamic";

export default async function Page() {
  // 1. Fetch Posts History
  let posts: any[] = [];
  try {
    const { data } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
      
    if (data) posts = data;
  } catch (error) {
    console.error("Erro ao carregar posts:", error);
  }

  // Pass data to Client Component for interactivity (Tabs, Forms, etc.)
  return <DashboardClient initialPosts={posts} />;
}
