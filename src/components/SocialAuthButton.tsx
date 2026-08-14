"use client";

import { useState } from "react";

export default function SocialAuthButton() {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    // Para MVP, abriremos o portal do Ayrshare (Agregador de Redes) 
    // ou simularemos a chamada da API para o link OAuth.
    alert("Redirecionando para o painel de conexão de Redes Sociais...");
    window.open("https://app.ayrshare.com", "_blank");
  };

  return (
    <button 
      onClick={handleConnect}
      disabled={loading}
      className="bg-neutral-800 hover:bg-black text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-md disabled:opacity-50 flex items-center gap-2"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
      </svg>
      Conectar Redes Sociais
    </button>
  );
}
