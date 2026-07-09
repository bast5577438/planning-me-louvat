/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Location, AppSettings } from '../types';
import { Settings, MapPin, Calendar, Clock, Euro, Plus, Trash2, Edit2, Check, X, Shield, Lock, Mail, AlertCircle } from 'lucide-react';

interface SettingsManagerProps {
  locations: Location[];
  settings: AppSettings;
  onUpdateLocations: (newLocations: Location[]) => void;
  onUpdateSettings: (newSettings: AppSettings) => void;
}

export const COLOR_OPTIONS = [
  { label: 'Ambre / Miel', value: 'amber', bgClass: 'bg-[#FEF3C7] text-[#92400E] border-[#F59E0B]' },
  { label: 'Vert Émeraude', value: 'emerald', bgClass: 'bg-[#D1FAE5] text-[#065F46] border-[#10B981]' },
  { label: 'Rouge Groseille', value: 'rose', bgClass: 'bg-[#FFE4E6] text-[#9F1239] border-[#F43F5E]' },
  { label: 'Violet Prune', value: 'purple', bgClass: 'bg-[#F3E8FF] text-[#6B21A8] border-[#A855F7]' },
  { label: 'Bleu Glacier', value: 'blue', bgClass: 'bg-[#DBEAFE] text-[#1E40AF] border-[#3B82F6]' },
  { label: 'Orange Mandarine', value: 'orange', bgClass: 'bg-[#FFEDD5] text-[#9A3412] border-[#F97316]' },
  { label: 'Gris Ardoise', value: 'slate', bgClass: 'bg-[#E2E8F0] text-[#1E293B] border-[#64748B]' },
];

export const SettingsManager: React.FC<SettingsManagerProps> = ({
  locations,
  settings,
  onUpdateLocations,
  onUpdateSettings,
}) => {
  // Form states for Settings
  const [maxPartnersPerDay, setMaxPartnersPerDay] = useState<number>(settings.maxPartnersPerDay);
  const [defaultHourlyRate, setDefaultHourlyRate] = useState<number>(settings.defaultHourlyRate);
  const [defaultHoursPerDay, setDefaultHoursPerDay] = useState<number>(settings.defaultHoursPerDay);
  const [cancellationDeadlineDays, setCancellationDeadlineDays] = useState<number>(settings.cancellationDeadlineDays);
  
  // Notification States
  const [notificationEmail, setNotificationEmail] = useState<string>(settings.notificationEmail || 'cib@bicuiterie-louvat.com');
  const [enableEmailAlerts, setEnableEmailAlerts] = useState<boolean>(settings.enableEmailAlerts !== false);

  // Form states for Location Add
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [locName, setLocName] = useState('');
  const [locCode, setLocCode] = useState('');
  const [locDesc, setLocDesc] = useState('');
  const [locStart, setLocStart] = useState('2026-09-01');
  const [locEnd, setLocEnd] = useState('2026-12-31');
  const [locColor, setLocColor] = useState('amber');

  // Edit location states
  const [editingLocId, setEditingLocId] = useState<string | null>(null);
  const [editLocName, setEditLocName] = useState('');
  const [editLocCode, setEditLocCode] = useState('');
  const [editLocDesc, setEditLocDesc] = useState('');
  const [editLocStart, setEditLocStart] = useState('');
  const [editLocEnd, setEditLocEnd] = useState('');
  const [editLocColor, setEditLocColor] = useState('');

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Save general parameters
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      maxPartnersPerDay: Number(maxPartnersPerDay),
      defaultHourlyRate: Number(defaultHourlyRate),
      defaultHoursPerDay: Number(defaultHoursPerDay),
      cancellationDeadlineDays: Number(cancellationDeadlineDays),
      notificationEmail,
      enableEmailAlerts,
    });
    setMessage({
      type: 'success',
      text: 'Paramètres généraux et alertes de notification sauvegardés avec succès ! En vigueur immédiatement.'
    });
    setTimeout(() => setMessage(null), 3000);
  };

  // Save new boutique location
  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!locName.trim() || !locCode.trim()) {
      setMessage({ type: 'error', text: 'Le nom et le code de la boutique sont requis.' });
      return;
    }

    const newLoc: Location = {
      id: `loc_${Date.now()}`,
      name: locName.trim(),
      code: locCode.trim().toUpperCase(),
      description: locDesc.trim(),
      startDate: locStart,
      endDate: locEnd,
      color: locColor,
      isActive: true,
    };

    onUpdateLocations([...locations, newLoc]);
    setIsAddingLocation(false);
    
    // reset
    setLocName('');
    setLocCode('');
    setLocDesc('');
    
    setMessage({ type: 'success', text: `Nouveau point de vente "${newLoc.name}" configuré avec succès !` });
    setTimeout(() => setMessage(null), 4000);
  };

  // Toggle location status
  const handleToggleLocationActive = (locId: string) => {
    const updated = locations.map(l => {
      if (l.id === locId) {
        return { ...l, isActive: !l.isActive };
      }
      return l;
    });
    onUpdateLocations(updated);
  };

  // Start editing location
  const handleStartEditLocation = (loc: Location) => {
    setEditingLocId(loc.id);
    setEditLocName(loc.name);
    setEditLocCode(loc.code);
    setEditLocDesc(loc.description || '');
    setEditLocStart(loc.startDate);
    setEditLocEnd(loc.endDate);
    setEditLocColor(loc.color);
  };

  // Save location edits
  const handleSaveEditLocation = (locId: string) => {
    if (!editLocName.trim() || !editLocCode.trim()) {
      setMessage({ type: 'error', text: 'Le nom et le code de la boutique sont requis.' });
      return;
    }

    const updated = locations.map(l => {
      if (l.id === locId) {
        return {
          ...l,
          name: editLocName.trim(),
          code: editLocCode.trim().toUpperCase(),
          description: editLocDesc.trim(),
          startDate: editLocStart,
          endDate: editLocEnd,
          color: editLocColor,
        };
      }
      return l;
    });

    onUpdateLocations(updated);
    setEditingLocId(null);
    setMessage({ type: 'success', text: 'Lieu d\'activité modifié avec succès !' });
    setTimeout(() => setMessage(null), 3000);
  };

  // Delete location
  const handleDeleteLocation = (locId: string) => {
    if (locations.length <= 1) {
      alert('L\'application doit posséder au moins un lieu d\'activité actif.');
      return;
    }
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce lieu ? Les réservations associées sur le calendrier ne seront pas effacées mais le lieu n\'apparaîtra plus pour de nouvelles réservations.')) {
      onUpdateLocations(locations.filter(l => l.id !== locId));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in" id="settings-manager-container">
      
      {/* Left Column: General Global parameters */}
      <div className="lg:col-span-5 bg-white border border-[#E5E1D8] rounded-[32px] shadow-sm p-4 sm:p-5">
        <div className="flex items-center space-x-2 border-b border-[#E5E1D8] pb-3 mb-4">
          <Settings className="h-5 w-5 text-[#8B5E3C]" />
          <h2 className="text-lg font-serif italic font-bold text-[#3C2A21]">
            Paramètres du Planning
          </h2>
        </div>

        {message && (
          <div className={`p-3 text-xs font-bold rounded-xl mb-4 ${
            message.type === 'success' ? 'bg-[#EAF0DE] text-[#7B8A56] border border-[#D4DEC3]' : 'bg-red-50 text-red-800 border border-red-100'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
          
          {/* Max partner per day */}
          <div className="space-y-1.5">
            <label className="block font-bold text-[#3C2A21]/80 uppercase tracking-wider text-[10px]">Nombre max d'auto-entrepreneurs par jour par boutique :</label>
            <div className="flex items-center space-x-4 bg-[#F5F2EA]/40 p-3 rounded-xl border border-[#E5E1D8] shadow-xs">
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="maxPartners"
                  value="1"
                  checked={maxPartnersPerDay === 1}
                  onChange={() => setMaxPartnersPerDay(1)}
                  className="text-[#8B5E3C] focus:ring-[#8B5E3C]"
                />
                <span className="font-bold text-[#3C2A21]">1 Auto-entrepreneur</span>
              </label>
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="maxPartners"
                  value="2"
                  checked={maxPartnersPerDay === 2}
                  onChange={() => setMaxPartnersPerDay(2)}
                  className="text-[#8B5E3C] focus:ring-[#8B5E3C]"
                />
                <span className="font-bold text-[#3C2A21]">2 Auto-entrepreneurs maximum</span>
              </label>
            </div>
            <p className="text-[10px] text-[#3C2A21]/50 italic font-medium">
              Autorise ou bloque la planification de plusieurs auto-entrepreneurs en binôme sur la même journée.
            </p>
          </div>

          {/* Default Hourly Rate */}
          <div className="space-y-1">
            <label className="block font-bold text-[#3C2A21]/80 flex items-center gap-1 text-[10px] uppercase tracking-wider">
              <Euro className="h-3.5 w-3.5 text-[#8B5E3C]" />
              Tarif horaire de base (€ / Heure) :
            </label>
            <input
              type="number"
              value={defaultHourlyRate}
              onChange={(e) => setDefaultHourlyRate(Number(e.target.value))}
              className="w-full bg-white border border-[#E5E1D8] rounded-xl p-2.5 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#8B5E3C] shadow-xs"
              min="1"
            />
          </div>

          {/* Default work hours */}
          <div className="space-y-1">
            <label className="block font-bold text-[#3C2A21]/80 flex items-center gap-1 text-[10px] uppercase tracking-wider">
              <Clock className="h-3.5 w-3.5 text-[#8B5E3C]" />
              Durée standard d'une journée de travail (Heures) :
            </label>
            <input
              type="number"
              value={defaultHoursPerDay}
              onChange={(e) => setDefaultHoursPerDay(Number(e.target.value))}
              className="w-full bg-white border border-[#E5E1D8] rounded-xl p-2.5 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#8B5E3C] shadow-xs"
              min="1"
              max="24"
            />
            <p className="text-[10px] text-[#3C2A21]/50 italic font-medium">
              Sert à calculer automatiquement le montant brut journalier (Par défaut : {defaultHoursPerDay * defaultHourlyRate} €).
            </p>
          </div>

          {/* Cancellation deadline */}
          <div className="space-y-1">
            <label className="block font-bold text-[#3C2A21]/80 flex items-center gap-1 text-[10px] uppercase tracking-wider">
              <Lock className="h-3.5 w-3.5 text-[#8B5E3C]" />
              Limite d'annulation autonome par l'auto-entrepreneur (Jours avant) :
            </label>
            <input
              type="number"
              value={cancellationDeadlineDays}
              onChange={(e) => setCancellationDeadlineDays(Number(e.target.value))}
              className="w-full bg-white border border-[#E5E1D8] rounded-xl p-2.5 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#8B5E3C] shadow-xs"
              min="0"
            />
            <p className="text-[10px] text-[#3C2A21]/50 italic font-medium">
              Bloque le bouton d'annulation de l'auto-entrepreneur si la prestation est trop proche.
            </p>
          </div>

          {/* Section: Alertes de Notification Automatisées */}
          <div className="pt-4 border-t border-[#E5E1D8] space-y-3.5">
            <h3 className="text-xs font-bold text-[#8B5E3C] uppercase tracking-wider flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" />
              Alertes & Notifications Automatisées
            </h3>
            
            {/* Email configuration */}
            <div className="bg-[#F5F2EA]/30 p-3 rounded-2xl border border-[#E5E1D8] space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#3C2A21] text-xs flex items-center gap-1.5">
                  <Mail className="h-4 w-4 text-[#8B5E3C]" />
                  Alerte Email Gérant
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={enableEmailAlerts} 
                    onChange={(e) => setEnableEmailAlerts(e.target.checked)} 
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#8B5E3C]"></div>
                </label>
              </div>

              {enableEmailAlerts && (
                <div className="space-y-1 animate-fade-in">
                  <label className="block text-[10px] font-bold text-[#3C2A21]/70">Adresse Email de réception :</label>
                  <input
                    type="email"
                    value={notificationEmail}
                    onChange={(e) => setNotificationEmail(e.target.value)}
                    placeholder="cib@bicuiterie-louvat.com"
                    className="w-full bg-white border border-[#E5E1D8] rounded-lg p-2 font-medium focus:outline-none focus:ring-1 focus:ring-[#8B5E3C]"
                  />
                </div>
              )}
            </div>

            {/* Price & Cost Info Panel */}
            <div className="p-3.5 bg-amber-50/60 rounded-2xl border border-amber-100/70 text-[11px] text-[#8B5E3C] space-y-1.5">
              <div className="font-bold flex items-center gap-1 text-[#3C2A21]">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span>Rapports de Coûts & Options :</span>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-stone-600">
                <li>
                  <strong className="text-[#3C2A21]">Alerte Email (Gratuit)</strong>. Routage direct via Firebase Cloud Functions ou Resend. Le quota de base inclus est de <span className="font-bold text-[#8B5E3C]">3 000 emails gratuits par mois</span> (coût fixe de 0 €/mois).
                </li>
                <li>
                  <strong className="text-[#3C2A21]">Alerte Instantanée (Gratuit)</strong>. Notification immédiate dans le centre d'activité en temps réel synchronisé sur le site pour tous les terminaux.
                </li>
              </ul>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-[#8B5E3C] hover:bg-[#8B5E3C]/90 text-white font-bold rounded-full text-xs shadow-md transition-all"
          >
            Sauvegarder les paramètres
          </button>
        </form>
      </div>

      {/* Right Column: Manage dynamic locations */}
      <div className="lg:col-span-7 bg-white border border-[#E5E1D8] rounded-[32px] shadow-sm p-4 sm:p-5 space-y-6">
        <div className="flex justify-between items-center border-b border-[#E5E1D8] pb-3">
          <div className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-[#8B5E3C]" />
            <h2 className="text-lg font-serif italic font-bold text-[#3C2A21]">
              Lieux & Événements Saisonniers
            </h2>
          </div>

          {!isAddingLocation && (
            <button
              onClick={() => setIsAddingLocation(true)}
              className="flex items-center gap-1 bg-[#F5F2EA] border border-[#E5E1D8] hover:bg-[#F5F2EA]/80 text-[#3C2A21] text-[11px] font-bold px-3 py-2 rounded-full shadow-xs transition-all"
            >
              <Plus className="h-3.5 w-3.5 text-[#8B5E3C]" />
              Nouveau Lieu
            </button>
          )}
        </div>

        {/* Add Location Form */}
        {isAddingLocation && (
          <form onSubmit={handleAddLocation} className="bg-[#F5F2EA]/40 border border-[#E5E1D8] rounded-[24px] p-4 space-y-3 text-xs animate-fade-in" id="add-location-form">
            <div className="flex justify-between items-center pb-2 border-b border-[#E5E1D8]">
              <span className="font-bold text-[#3C2A21]/80 uppercase tracking-wider text-[10px]">Ajouter un nouveau lieu commercial</span>
              <button
                type="button"
                onClick={() => setIsAddingLocation(false)}
                className="p-1 text-stone-400 hover:text-stone-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2 space-y-1">
                <label className="block font-bold text-[#3C2A21]/80">Nom du lieu :</label>
                <input
                  type="text"
                  value={locName}
                  onChange={(e) => setLocName(e.target.value)}
                  placeholder="Ex: Marché de Noël Voiron"
                  className="w-full bg-white border border-[#E5E1D8] rounded-xl p-2 font-semibold text-[#3C2A21]"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="block font-bold text-[#3C2A21]/80">Code court :</label>
                <input
                  type="text"
                  value={locCode}
                  onChange={(e) => setLocCode(e.target.value)}
                  placeholder="Ex: XM_VOIRON"
                  className="w-full bg-white border border-[#E5E1D8] rounded-xl p-2 text-center uppercase font-mono font-bold text-[#3C2A21]"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block font-bold text-[#3C2A21]/80">Description / Adresse :</label>
              <input
                type="text"
                value={locDesc}
                onChange={(e) => setLocDesc(e.target.value)}
                placeholder="Ex: Chalet en centre-ville, Place des éléphants"
                className="w-full bg-white border border-[#E5E1D8] rounded-xl p-2 text-[#3C2A21]"
              />
            </div>

            {/* Dates range */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="block font-bold text-[#3C2A21]/80">Date d'ouverture :</label>
                <input
                  type="text"
                  value={locStart}
                  onChange={(e) => setLocStart(e.target.value)}
                  placeholder="Ex: 2026-09-01, voir tati ou vide"
                  className="w-full bg-white border border-[#E5E1D8] rounded-xl p-2 text-center font-semibold text-[#3C2A21]"
                />
              </div>
              <div className="space-y-1">
                <label className="block font-bold text-[#3C2A21]/80">Date de fermeture :</label>
                <input
                  type="text"
                  value={locEnd}
                  onChange={(e) => setLocEnd(e.target.value)}
                  placeholder="Ex: 2026-12-31, voir tati ou vide"
                  className="w-full bg-white border border-[#E5E1D8] rounded-xl p-2 text-center font-semibold text-[#3C2A21]"
                />
              </div>
            </div>
            <p className="text-[10px] text-[#3C2A21]/50 italic font-medium leading-tight">
              Astuce : Pour les boutiques permanentes à l'année (comme Voiron, SGV), laissez vide. Pour les chalets de Noël, vous pouvez saisir "voir tati".
            </p>

            {/* Color Tag Picker */}
            <div className="space-y-1.5 pt-1">
              <label className="block font-bold text-[#3C2A21]/80">Thème couleur de la boutique :</label>
              <div className="flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setLocColor(opt.value)}
                    className={`px-3 py-1.5 rounded-full border text-[11px] font-bold transition-all ${opt.bgClass} ${
                      locColor === opt.value ? 'ring-2 ring-[#8B5E3C] ring-offset-1 scale-105 shadow-sm' : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    {opt.label} {locColor === opt.value && '✓'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-[#E5E1D8]">
              <button
                type="button"
                onClick={() => setIsAddingLocation(false)}
                className="px-4 py-2 border border-[#E5E1D8] hover:bg-[#F5F2EA]/60 rounded-full text-[#3C2A21] font-bold text-xs transition-all shadow-xs"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#8B5E3C] hover:bg-[#8B5E3C]/90 text-white text-xs font-bold rounded-full shadow-md transition-all"
              >
                Créer Boutique
              </button>
            </div>
          </form>
        )}

        {/* Locations List */}
        <div className="space-y-3">
          {locations.map((loc) => {
            const isEditing = editingLocId === loc.id;
            
            if (isEditing) {
              return (
                <div key={loc.id} className="border border-[#8B5E3C] bg-[#FDFCF8] rounded-2xl p-4 space-y-3.5 shadow-md animate-fade-in text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-[#E5E1D8]">
                    <span className="font-extrabold text-[#8B5E3C] uppercase tracking-wider text-[10px]">Modifier le Lieu d'Activité</span>
                    <button
                      type="button"
                      onClick={() => setEditingLocId(null)}
                      className="p-1 text-stone-400 hover:text-stone-700"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2 space-y-1">
                      <label className="block font-bold text-[#3C2A21]/80">Nom du lieu :</label>
                      <input
                        type="text"
                        value={editLocName}
                        onChange={(e) => setEditLocName(e.target.value)}
                        className="w-full bg-white border border-[#E5E1D8] rounded-xl p-2 font-bold text-[#3C2A21]"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block font-bold text-[#3C2A21]/80">Code court :</label>
                      <input
                        type="text"
                        value={editLocCode}
                        onChange={(e) => setEditLocCode(e.target.value)}
                        className="w-full bg-white border border-[#E5E1D8] rounded-xl p-2 text-center font-mono font-bold uppercase text-[#3C2A21]"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block font-bold text-[#3C2A21]/80">Description / Adresse :</label>
                    <input
                      type="text"
                      value={editLocDesc}
                      onChange={(e) => setEditLocDesc(e.target.value)}
                      className="w-full bg-white border border-[#E5E1D8] rounded-xl p-2 text-[#3C2A21]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="block font-bold text-[#3C2A21]/80">Date d'ouverture :</label>
                      <input
                        type="text"
                        value={editLocStart}
                        onChange={(e) => setEditLocStart(e.target.value)}
                        placeholder="AAAA-MM-JJ, voir tati ou vide"
                        className="w-full bg-white border border-[#E5E1D8] rounded-xl p-2 text-center font-semibold text-[#3C2A21]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block font-bold text-[#3C2A21]/80">Date de fermeture :</label>
                      <input
                        type="text"
                        value={editLocEnd}
                        onChange={(e) => setEditLocEnd(e.target.value)}
                        placeholder="AAAA-MM-JJ, voir tati ou vide"
                        className="w-full bg-white border border-[#E5E1D8] rounded-xl p-2 text-center font-semibold text-[#3C2A21]"
                      />
                    </div>
                  </div>

                  {/* Edit Color Options */}
                  <div className="space-y-1.5 pt-1">
                    <label className="block font-bold text-[#3C2A21]/80">Thème couleur :</label>
                    <div className="flex flex-wrap gap-1.5">
                      {COLOR_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setEditLocColor(opt.value)}
                          className={`px-2.5 py-1 rounded-full border text-[10px] font-bold transition-all ${opt.bgClass} ${
                            editLocColor === opt.value ? 'ring-2 ring-[#8B5E3C] ring-offset-1 scale-105' : 'opacity-65'
                          }`}
                        >
                          {opt.label} {editLocColor === opt.value && '✓'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2 pt-2 border-t border-[#E5E1D8]">
                    <button
                      type="button"
                      onClick={() => setEditingLocId(null)}
                      className="px-3 py-1.5 border border-[#E5E1D8] hover:bg-stone-50 rounded-full text-[#3C2A21] font-bold text-[11px] transition-all"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveEditLocation(loc.id)}
                      className="px-3 py-1.5 bg-[#8B5E3C] hover:bg-[#8B5E3C]/90 text-white font-bold text-[11px] rounded-full shadow-xs transition-all"
                    >
                      Enregistrer
                    </button>
                  </div>
                </div>
              );
            }

            // Normal non-editing state row
            const getLocBadgeStyle = (col: string) => {
              const matched = COLOR_OPTIONS.find(o => o.value === col);
              return matched ? matched.bgClass : 'bg-[#FAFAFA] text-[#3C2A21] border-[#E5E1D8]';
            };

            const formatLocationDates = (l: Location) => {
              if (!l.startDate || !l.endDate) {
                return "Active toute l'année";
              }
              if (l.startDate === 'voir tati' || l.endDate === 'voir tati') {
                return 'Dates : "voir tati"';
              }
              try {
                const s = new Date(l.startDate);
                const e = new Date(l.endDate);
                if (isNaN(s.getTime()) || isNaN(e.getTime())) {
                  return `Du ${l.startDate} au ${l.endDate}`;
                }
                const startStr = s.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
                const endStr = e.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
                return `Ouvert du ${startStr} au ${endStr}`;
              } catch {
                return `Du ${l.startDate} au ${l.endDate}`;
              }
            };

            return (
              <div key={loc.id} className="border border-[#E5E1D8] rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-white shadow-xs hover:border-[#E5E1D8]/90 transition-all">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className="font-bold text-[#3C2A21] text-sm">{loc.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-bold border ${getLocBadgeStyle(loc.color)}`}>
                      {loc.code}
                    </span>
                  </div>
                  <p className="text-[#3C2A21]/60 font-semibold">{loc.description || 'Pas de description renseignée.'}</p>
                  
                  <div className="flex items-center space-x-1 text-[#8B5E3C] font-bold text-[11px] pt-1">
                    <Calendar className="h-3.5 w-3.5 shrink-0" />
                    <span>{formatLocationDates(loc)}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3 self-end sm:self-auto shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0">
                  {/* Active / Inactive switch */}
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={loc.isActive}
                      onChange={() => handleToggleLocationActive(loc.id)}
                      className="rounded text-[#8B5E3C] focus:ring-[#8B5E3C]"
                    />
                    <span className={`font-bold uppercase tracking-wider text-[9px] ${loc.isActive ? 'text-emerald-700' : 'text-[#3C2A21]/40'}`}>
                      {loc.isActive ? 'Actif' : 'Désactivé'}
                    </span>
                  </label>

                  {/* Edit button */}
                  <button
                    onClick={() => handleStartEditLocation(loc)}
                    className="p-1.5 text-stone-400 hover:text-[#8B5E3C] hover:bg-[#F5F2EA] rounded transition-all"
                    title="Modifier la boutique"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>

                  {/* Delete button */}
                  <button
                    onClick={() => handleDeleteLocation(loc.id)}
                    className="p-1.5 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded transition-all"
                    title="Supprimer la boutique"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
};
