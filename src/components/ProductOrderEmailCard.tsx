import React, { useState } from 'react';
import { User, NotificationLog } from '../types';
import { Send, ShoppingBasket, Plus, Trash2, Eye } from 'lucide-react';

interface ProductOrderEmailCardProps {
  users: User[];
  onAddNotificationLog: (log: NotificationLog) => void;
}

/**
 * Carte Réglages (admin) : compose un email type de commande de produits.
 * La gérante complète les "trous" (produits, quantités, date) puis le mail
 * s'ouvre pré-rempli dans sa messagerie (mailto).
 */
export const ProductOrderEmailCard: React.FC<ProductOrderEmailCardProps> = ({
  users,
  onAddNotificationLog,
}) => {
  const partners = users.filter(u => u.role === 'PARTNER' && u.isActive);

  const [recipientId, setRecipientId] = useState<string>('ALL');
  const [products, setProducts] = useState<{ name: string; qty: string }[]>([
    { name: '', qty: '' },
  ]);
  const [neededByDate, setNeededByDate] = useState<string>('');
  const [extraNote, setExtraNote] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [sentMessage, setSentMessage] = useState<string | null>(null);

  const updateProduct = (index: number, field: 'name' | 'qty', value: string) => {
    setProducts(prev => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  };

  const addProductRow = () => setProducts(prev => [...prev, { name: '', qty: '' }]);
  const removeProductRow = (index: number) =>
    setProducts(prev => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));

  const filledProducts = products.filter(p => p.name.trim());

  const formatFrDate = (iso: string) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  };

  const buildBody = (recipientName: string) => {
    const productLines = filledProducts.length > 0
      ? filledProducts.map(p => `  •  ${p.name.trim()}${p.qty.trim() ? ` — Quantité : ${p.qty.trim()}` : ''}`).join('\n')
      : '  •  ________________________';

    return (
`Bonjour ${recipientName},

Dans le cadre de votre prochaine prestation en boutique, voici la liste des produits dont nous avons besoin et que nous vous demandons de bien vouloir recommander :

${productLines}
${neededByDate ? `\nDate souhaitée de réception : ${formatFrDate(neededByDate)}\n` : ''}${extraNote.trim() ? `\nRemarque : ${extraNote.trim()}\n` : ''}
Merci de confirmer la bonne prise en compte de cette commande par retour de mail.

Bien cordialement,

La Gérante
Biscuiterie Louvat — Maison fondée en 1954
Saint-Geoire-en-Valdaine (Isère)`
    );
  };

  const subject = 'Biscuiterie Louvat — Produits à recommander pour la boutique';

  const handleOpenMail = () => {
    const isAll = recipientId === 'ALL';
    const targets = isAll ? partners : partners.filter(p => p.id === recipientId);
    if (targets.length === 0) return;

    const to = targets.map(p => p.email).join(',');
    const name = isAll ? 'à toutes et à tous' : targets[0].name;
    const body = buildBody(isAll ? 'à toutes et à tous' : targets[0].name.split(' ')[0]);

    window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // Trace dans le journal d'alertes
    onAddNotificationLog({
      id: `not_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'EMAIL',
      recipient: to,
      subject,
      message: `Email de commande produits préparé pour ${isAll ? `${targets.length} auto-entrepreneurs` : targets[0].name} (${filledProducts.length} produit${filledProducts.length > 1 ? 's' : ''}).`,
      status: 'QUEUED',
    });

    setSentMessage(`Votre messagerie s'est ouverte avec l'email pré-rempli pour ${isAll ? `${targets.length} destinataires` : targets[0].name}. Relisez puis cliquez sur Envoyer.`);
    setTimeout(() => setSentMessage(null), 6000);
  };

  const previewRecipientName = recipientId === 'ALL'
    ? 'à toutes et à tous'
    : (partners.find(p => p.id === recipientId)?.name.split(' ')[0] ?? '');

  return (
    <div className="lg:col-span-12 bg-white border border-[#E5E1D8] rounded-[32px] shadow-sm p-4 sm:p-5 space-y-4" id="product-order-email-card">
      <div className="flex items-center space-x-2 border-b border-[#E5E1D8] pb-3">
        <ShoppingBasket className="h-5 w-5 text-[#8B5E3C]" />
        <div>
          <h2 className="text-lg font-serif italic font-bold text-[#3C2A21]">
            Email type — Commande de produits
          </h2>
          <p className="text-xs text-[#3C2A21]/60 font-medium">
            Complétez les produits à recommander, choisissez le destinataire, et l'email s'ouvre pré-rempli dans votre messagerie.
          </p>
        </div>
      </div>

      {sentMessage && (
        <div className="p-3 bg-[#EAF0DE] text-[#7B8A56] border border-[#D4DEC3] rounded-xl text-xs font-bold">
          {sentMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
        {/* Colonne gauche : formulaire */}
        <div className="space-y-3.5">
          {/* Destinataire */}
          <div className="space-y-1">
            <label className="block font-bold text-[#3C2A21]/80 uppercase tracking-wider text-[10px]">Destinataire :</label>
            <select
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
              className="w-full bg-white border border-[#E5E1D8] rounded-xl p-2.5 font-medium focus:outline-none focus:ring-1 focus:ring-[#8B5E3C]"
            >
              <option value="ALL">📢 Tous les auto-entrepreneurs actifs ({partners.length})</option>
              {partners.map(p => (
                <option key={p.id} value={p.id}>{p.name} — {p.email}</option>
              ))}
            </select>
          </div>

          {/* Produits */}
          <div className="space-y-1.5">
            <label className="block font-bold text-[#3C2A21]/80 uppercase tracking-wider text-[10px]">Produits à recommander :</label>
            {products.map((p, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={p.name}
                  onChange={(e) => updateProduct(i, 'name', e.target.value)}
                  placeholder={`Ex: Biscuits noisette boîte fer ${i + 1}kg`}
                  className="flex-1 bg-white border border-[#E5E1D8] rounded-xl p-2.5 font-medium focus:outline-none focus:ring-1 focus:ring-[#8B5E3C]"
                />
                <input
                  type="text"
                  value={p.qty}
                  onChange={(e) => updateProduct(i, 'qty', e.target.value)}
                  placeholder="Qté"
                  className="w-20 bg-white border border-[#E5E1D8] rounded-xl p-2.5 text-center font-medium focus:outline-none focus:ring-1 focus:ring-[#8B5E3C]"
                />
                <button
                  type="button"
                  onClick={() => removeProductRow(i)}
                  disabled={products.length === 1}
                  className="p-1.5 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded-full transition-all disabled:opacity-30"
                  title="Retirer cette ligne"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addProductRow}
              className="flex items-center gap-1 text-[11px] font-bold text-[#8B5E3C] hover:bg-[#F5F2EA] px-3 py-1.5 rounded-full border border-[#E5E1D8] transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              Ajouter un produit
            </button>
          </div>

          {/* Date souhaitée */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block font-bold text-[#3C2A21]/80 uppercase tracking-wider text-[10px]">Réception souhaitée le :</label>
              <input
                type="date"
                value={neededByDate}
                onChange={(e) => setNeededByDate(e.target.value)}
                className="w-full bg-white border border-[#E5E1D8] rounded-xl p-2.5 font-medium focus:outline-none focus:ring-1 focus:ring-[#8B5E3C]"
              />
            </div>
            <div className="space-y-1">
              <label className="block font-bold text-[#3C2A21]/80 uppercase tracking-wider text-[10px]">Remarque libre (optionnel) :</label>
              <input
                type="text"
                value={extraNote}
                onChange={(e) => setExtraNote(e.target.value)}
                placeholder="Ex: privilégier le fournisseur habituel"
                className="w-full bg-white border border-[#E5E1D8] rounded-xl p-2.5 font-medium focus:outline-none focus:ring-1 focus:ring-[#8B5E3C]"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-1.5 px-4 py-2.5 border border-[#E5E1D8] hover:bg-[#F5F2EA]/60 rounded-full text-[#3C2A21] font-bold text-xs transition-all shadow-xs"
            >
              <Eye className="h-3.5 w-3.5" />
              {showPreview ? 'Masquer l\'aperçu' : 'Aperçu'}
            </button>
            <button
              type="button"
              onClick={handleOpenMail}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#8B5E3C] hover:bg-[#8B5E3C]/90 text-white font-bold rounded-full text-xs shadow-md transition-all"
            >
              <Send className="h-3.5 w-3.5" />
              Ouvrir l'email pré-rempli dans ma messagerie
            </button>
          </div>
        </div>

        {/* Colonne droite : aperçu */}
        <div className={`${showPreview ? '' : 'hidden lg:block'} bg-[#F5F2EA]/40 border border-[#E5E1D8] rounded-2xl p-4 space-y-2`}>
          <span className="text-[10px] uppercase tracking-widest font-bold text-[#8B5E3C]">Aperçu de l'email</span>
          <div className="text-[11px] font-bold text-[#3C2A21] border-b border-[#E5E1D8] pb-2">
            Objet : {subject}
          </div>
          <pre className="text-[11px] text-[#3C2A21]/85 whitespace-pre-wrap font-sans leading-relaxed">
            {buildBody(previewRecipientName || '________')}
          </pre>
        </div>
      </div>
    </div>
  );
};
