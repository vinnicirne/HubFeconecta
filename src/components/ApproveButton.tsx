"use client";

import { useState } from "react";

export default function ApproveButton({ postId }: { postId: string }) {
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      
      const data = await res.json();
      if (data.success) {
        alert("Post aprovado e enviado para distribuição!");
        window.location.reload();
      } else {
        alert("Erro ao aprovar: " + data.error);
      }
    } catch (error) {
      alert("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleApprove}
      disabled={loading}
      className="flex-1 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-xs font-medium py-2 rounded transition-colors text-neutral-700 dark:text-neutral-200 disabled:opacity-50"
    >
      {loading ? "..." : "Aprovar"}
    </button>
  );
}
