"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { PRO_CATEGORIES } from "@/lib/utils";

type Message = { id: string; senderRole: "COUPLE" | "PRO"; body: string; createdAt: string };
type Conv = {
  id: string; updatedAt: string; unreadByCouple: number; unreadByPro: number;
  coupleId: string; proId: string;
  couple: { prenoms: string };
  pro:    { name: string; category: string; slug: string };
  messages: Message[];
};

type Props = {
  role:         "couple" | "pro";
  extraHeader?: React.ReactNode;
};

export default function Messagerie({ role, extraHeader }: Props) {
  const searchParams = useSearchParams();
  const [convs,      setConvs]      = useState<Conv[]>([]);
  const [activeConv, setActiveConv] = useState<Conv | null>(null);
  const [body,       setBody]       = useState("");
  const [sending,    setSending]    = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeId = searchParams.get("conv");

  const loadConvs = useCallback(async () => {
    const res = await fetch("/api/messages/conversations");
    if (res.ok) {
      const data: Conv[] = await res.json();
      setConvs(data);
      // Auto-sélectionner via URL param ou première conv
      const target = activeId
        ? data.find((c) => c.id === activeId)
        : data[0];
      if (target) loadConv(target.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  const loadConv = async (id: string) => {
    const res = await fetch(`/api/messages/conversations/${id}`);
    if (res.ok) {
      const data = await res.json();
      setActiveConv(data);
      setConvs((prev) => prev.map((c) => c.id === id ? { ...c, unreadByCouple: 0, unreadByPro: 0 } : c));
    }
  };

  useEffect(() => { loadConvs(); }, [loadConvs]);

  // Polling toutes les 20 secondes
  useEffect(() => {
    const t = setInterval(() => {
      if (activeConv) loadConv(activeConv.id);
    }, 20000);
    return () => clearInterval(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConv?.id]);

  // Scroll au dernier message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConv?.messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() || !activeConv || sending) return;
    setSending(true);
    const res = await fetch(`/api/messages/conversations/${activeConv.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    setSending(false);
    if (res.ok) {
      setBody("");
      loadConv(activeConv.id);
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) {
      return d.toLocaleTimeString("fr-FR", { hour:"2-digit", minute:"2-digit" });
    }
    return d.toLocaleDateString("fr-FR", { day:"numeric", month:"short" });
  };

  const unreadCount = (c: Conv) => role === "couple" ? c.unreadByCouple : c.unreadByPro;
  const convName = (c: Conv) => role === "couple" ? c.pro.name : c.couple.prenoms;
  const convMeta = (c: Conv) => role === "couple" ? PRO_CATEGORIES[c.pro.category] ?? c.pro.category : "";

  return (
    <div className="msgr-layout">
      {/* ── Liste des conversations ── */}
      <aside className="msgr-left">
        <div className="msgr-left-head">Conversations</div>
        {convs.length === 0 && (
          <p className="serif" style={{ fontStyle:"italic", color:"var(--mute)", padding:"24px 20px", fontSize:"0.9rem" }}>
            Aucune conversation pour l&apos;instant.
          </p>
        )}
        {convs.map((c) => (
          <div
            key={c.id}
            className={`msgr-item${activeConv?.id === c.id ? " active" : ""}`}
            onClick={() => loadConv(c.id)}
          >
            <div className="msgr-item-top">
              <span className="msgr-item-name">
                {unreadCount(c) > 0 && <span className="msgr-unread" />}
                {convName(c)}
              </span>
              <span className="msgr-item-date">{formatTime(c.updatedAt)}</span>
            </div>
            <div className="msgr-item-preview">
              {c.messages[0]?.body ?? "—"}
            </div>
          </div>
        ))}
      </aside>

      {/* ── Vue conversation ── */}
      <div className="msgr-right">
        {!activeConv ? (
          <div className="msgr-empty">Sélectionnez une conversation</div>
        ) : (
          <>
            <div className="msgr-conv-head">
              <div>
                <div className="msgr-conv-name">{convName(activeConv)}</div>
                <div className="msgr-conv-meta">{convMeta(activeConv)}</div>
              </div>
              <div style={{ display:"flex", gap:10 }}>
                {extraHeader}
                {role === "couple" && (
                  <Link href={`/prestataires/${activeConv.pro.slug}`} className="btn ghost small" target="_blank">
                    Voir la fiche
                  </Link>
                )}
                {role === "pro" && (
                  <Link href={`/dashboard/paiements/nouveau?couple=${activeConv.coupleId}`} className="btn gold small">
                    Créer un paiement
                  </Link>
                )}
              </div>
            </div>

            <div className="msgr-messages">
              {activeConv.messages.map((m) => {
                const isMe = (role === "couple" && m.senderRole === "COUPLE") ||
                             (role === "pro"    && m.senderRole === "PRO");
                return (
                  <div key={m.id} className={`msgr-bubble${isMe ? " me" : ""}`}>
                    {m.body}
                    <span className="msgr-bubble-time">{formatTime(m.createdAt)}</span>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <form className="msgr-compose" onSubmit={handleSend}>
              <input
                type="text"
                placeholder="Votre réponse…"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                disabled={sending}
              />
              <button className="btn gold small" type="submit" disabled={sending || !body.trim()}>
                Envoyer
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
