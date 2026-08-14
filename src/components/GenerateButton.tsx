"use client";

import { useState } from "react";

export default function GenerateButton() {
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "all" }),
      });
      
      const data = await res.json();
      if (data.success) {
        alert("Posts gerados com sucesso! A página será atualizada.");
        window.location.reload();
      } else {
        alert("Erro ao gerar: " + data.error);
      }
    } catch (error) {
      alert("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleGenerate}
      disabled={loading}
      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-md disabled:opacity-50"
    >
      {loading ? "Gerando via IA..." : "Gerar Novo Lote (IA)"}
    </button>
  );
}
