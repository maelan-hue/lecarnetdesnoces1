"use client";

type Props = {
  selectedIds:    string[];
  onSendMessage:  () => void;
  onAddFavorites: () => void;
  onClear:        () => void;
  loading?:       boolean;
};

export default function FloatingActionBar({ selectedIds, onSendMessage, onAddFavorites, onClear, loading }: Props) {
  if (selectedIds.length === 0) return null;

  return (
    <div className="fab">
      <div className="fab-count">
        {selectedIds.length} <em>prestataire{selectedIds.length > 1 ? "s" : ""} sélectionné{selectedIds.length > 1 ? "s" : ""}</em>
      </div>
      <div className="fab-sep" />
      <button className="btn gold small" onClick={onSendMessage} disabled={loading}>
        Envoyer un message groupé
      </button>
      <button className="btn ghost small" onClick={onAddFavorites} disabled={loading}
        style={{ borderColor:"rgba(250,248,244,0.3)", color:"rgba(250,248,244,0.8)" }}>
        ♥ Ajouter aux favoris
      </button>
      <button onClick={onClear} style={{ background:"none", border:"none", color:"rgba(250,248,244,0.45)", cursor:"pointer", fontSize:"0.75rem", textDecoration:"underline", textUnderlineOffset:3 }}>
        Annuler
      </button>
    </div>
  );
}
