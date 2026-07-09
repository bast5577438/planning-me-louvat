/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User } from '../types';
import { Plus, Trash2, Edit2, Check, X, Mail, Phone, AlertCircle, Loader2 } from 'lucide-react';
import { createFirebaseUser } from '../utils/firebaseAuth';
import { saveUserToFirestore } from '../utils/firestoreSync';

interface PartnersManagerProps {
  users: User[];
  onUpdateUsers: (newUsers: User[]) => void;
  currentUser: User;
}

export const PartnersManager: React.FC<PartnersManagerProps> = ({
  users,
  onUpdateUsers,
  currentUser,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [color, setColor] = useState('#db2777'); // default pink

  // Edit form states
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editColor, setEditColor] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [addingLoading, setAddingLoading] = useState(false);

  // Elegant color palette options for calendar comfort - warm-palette matching
  const PRESET_COLORS = [
    '#A67B5B', // Clay/Terracotta
    '#8B5E3C', // Biscuit Brown
    '#7B8A56', // Olive Green
    '#D4A373', // Mustard Amber
    '#be123c', // Warm Crimson
    '#0891b2', // Teal
    '#4f46e5', // Deep Indigo
    '#db2777', // Soft Rose
  ];

  // Save new partner (auto-entrepreneur) + crée le compte Firebase Auth
  const handleAddPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim() || !email.trim()) {
      setErrorMessage("Le nom et l'adresse email sont obligatoires.");
      return;
    }
    if (!password.trim() || password.trim().length < 6) {
      setErrorMessage('Le mot de passe doit contenir au moins 6 caractères (exigence Firebase).');
      return;
    }

    const emailExists = users.some(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (emailExists) {
      setErrorMessage('Cette adresse e-mail est déjà utilisée par un autre auto-entrepreneur.');
      return;
    }

    setAddingLoading(true);
    try {
      // Crée le compte Firebase Auth (sans déconnecter la gérante)
      await createFirebaseUser(email.trim().toLowerCase(), password.trim());
    } catch (fbErr: any) {
      if (fbErr?.code !== 'auth/email-already-in-use') {
        setErrorMessage('Erreur Firebase Auth : ' + (fbErr?.message ?? 'inconnue'));
        setAddingLoading(false);
        return;
      }
      // email-already-in-use → le compte Auth existe déjà, on ajoute juste le profil
    }

    const newPartner: User = {
      id: `partner_${Date.now()}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: 'PARTNER',
      color,
      phone: phone.trim() || undefined,
      password: password.trim(),
      isActive: true,
    };

    // Écriture DIRECTE et vérifiée dans le tableau Firestore (source de vérité partagée
    // entre tous les appareils). On attend la confirmation avant de valider côté UI.
    try {
      await saveUserToFirestore(newPartner);
    } catch (err) {
      setErrorMessage(
        "Le compte de connexion a été créé, mais l'enregistrement du profil dans le tableau a échoué. Vérifiez votre connexion et réessayez."
      );
      setAddingLoading(false);
      return;
    }

    // Met à jour l'affichage local (la synchro temps réel confirmera de son côté)
    onUpdateUsers([...users, newPartner]);

    // Reset fields
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setColor('#db2777');
    setIsAdding(false);
    setAddingLoading(false);
  };

  // Start editing a partner
  const handleStartEdit = (user: User) => {
    setEditingUserId(user.id);
    setEditName(user.name);
    setEditEmail(user.email);
    setEditPhone(user.phone || '');
    setEditPassword(user.password || 'louvat1954');
    setEditColor(user.color);
    setErrorMessage(null);
  };

  // Save edits
  const handleSaveEdit = (userId: string) => {
    if (!editName.trim() || !editEmail.trim()) {
      setErrorMessage('Le nom et l\'adresse email sont obligatoires.');
      return;
    }

    if (editPassword && editPassword.length < 4) {
      setErrorMessage('Le mot de passe doit contenir au moins 4 caractères.');
      return;
    }

    const emailExists = users.some(u => u.id !== userId && u.email.toLowerCase() === editEmail.trim().toLowerCase());
    if (emailExists) {
      setErrorMessage('Cette adresse e-mail est déjà utilisée par un autre auto-entrepreneur.');
      return;
    }

    const updated = users.map(user => {
      if (user.id === userId) {
        return {
          ...user,
          name: editName.trim(),
          email: editEmail.trim().toLowerCase(),
          phone: editPhone.trim() || undefined,
          password: editPassword.trim() || undefined,
          color: editColor,
        };
      }
      return user;
    });

    onUpdateUsers(updated);
    setEditingUserId(null);
    setErrorMessage(null);
  };

  // Delete partner
  const handleDeletePartner = (userId: string) => {
    if (userId === currentUser.id) {
      setErrorMessage('Vous ne pouvez pas supprimer votre propre compte administrateur.');
      return;
    }

    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet auto-entrepreneur ? Ses réservations futures resteront mais il ne pourra plus se connecter.')) {
      const updated = users.filter(u => u.id !== userId);
      onUpdateUsers(updated);
    }
  };

  return (
    <div className="bg-white border border-[#E5E1D8] rounded-[32px] shadow-sm p-4 sm:p-6 space-y-6" id="partners-manager-container">
      
      {/* Header and Add action button */}
      <div className="flex justify-between items-center border-b border-[#E5E1D8] pb-4">
        <div>
          <h2 className="text-xl font-serif italic font-bold text-[#8B5E3C]">
            Gestion des Auto-entrepreneurs
          </h2>
          <p className="text-xs text-[#3C2A21]/60 font-medium">
            Inscrivez de nouveaux auto-entrepreneurs ou modifiez leurs paramètres de contact, codes couleur et mot de passe de connexion.
          </p>
        </div>

        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 bg-[#8B5E3C] hover:bg-[#8B5E3C]/90 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-md transition-all"
            id="btn-add-partner-trigger"
          >
            <Plus className="h-4 w-4" />
            Nouvel Auto-entrepreneur
          </button>
        )}
      </div>

      {/* Global Form Validation Alerts */}
      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs font-medium flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Add Partner Form */}
      {isAdding && (
        <form onSubmit={handleAddPartner} className="bg-[#F5F2EA]/40 border border-[#E5E1D8] rounded-[24px] p-4 sm:p-5 space-y-4 animate-fade-in" id="add-partner-form">
          <div className="flex justify-between items-center pb-2 border-b border-[#E5E1D8]">
            <span className="text-[10px] uppercase tracking-widest font-bold text-[#3C2A21]/75">Inscrire un nouvel auto-entrepreneur</span>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="p-1.5 text-stone-400 hover:text-[#3C2A21] hover:bg-[#F5F2EA] rounded-full transition-all"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            {/* Name Input */}
            <div className="space-y-1">
              <label className="block font-bold text-[#3C2A21]/80 uppercase tracking-wider text-[10px]">Nom complet :</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Emma Martin"
                className="w-full bg-white border border-[#E5E1D8] rounded-xl p-2.5 font-medium focus:outline-none focus:ring-1 focus:ring-[#8B5E3C] shadow-xs"
                required
              />
            </div>

            {/* Email Input */}
            <div className="space-y-1">
              <label className="block font-bold text-[#3C2A21]/80 uppercase tracking-wider text-[10px]">Adresse Email :</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: emma@louvat.com"
                className="w-full bg-white border border-[#E5E1D8] rounded-xl p-2.5 font-medium focus:outline-none focus:ring-1 focus:ring-[#8B5E3C] shadow-xs"
                required
              />
            </div>

            {/* Phone Input */}
            <div className="space-y-1">
              <label className="block font-bold text-[#3C2A21]/80 uppercase tracking-wider text-[10px]">Téléphone (SMS) :</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ex: 06 12 34 56 78"
                className="w-full bg-white border border-[#E5E1D8] rounded-xl p-2.5 font-medium focus:outline-none focus:ring-1 focus:ring-[#8B5E3C] shadow-xs"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-1">
              <label className="block font-bold text-[#3C2A21]/80 uppercase tracking-wider text-[10px]">Mot de passe :</label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Défaut: louvat1954"
                className="w-full bg-white border border-[#E5E1D8] rounded-xl p-2.5 font-medium focus:outline-none focus:ring-1 focus:ring-[#8B5E3C] shadow-xs"
              />
            </div>
          </div>

          {/* Color visual indicator selector */}
          <div className="space-y-2 text-xs">
            <label className="block font-bold text-[#3C2A21]/80 uppercase tracking-wider text-[10px]">Code couleur sur le planning :</label>
            <div className="flex items-center space-x-3">
              <div className="flex space-x-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full transition-all flex items-center justify-center border-2 ${
                      color === c ? 'border-[#3C2A21] scale-110 shadow-md' : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {color === c && <span className="text-[9px] text-white">✓</span>}
                  </button>
                ))}
              </div>
              <div className="text-[10px] text-[#3C2A21]/50 italic font-medium">
                Sert d'indicateur visuel sur la grille mensuelle du calendrier
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t border-[#E5E1D8] text-xs">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 border border-[#E5E1D8] hover:bg-[#F5F2EA]/60 rounded-full text-[#3C2A21] font-bold text-xs transition-all shadow-xs"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={addingLoading}
              className="px-5 py-2 bg-[#8B5E3C] hover:bg-[#8B5E3C]/90 text-white font-bold rounded-full text-xs shadow-md transition-all flex items-center gap-1.5 disabled:opacity-60"
            >
              {addingLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {addingLoading ? 'Création…' : 'Enregistrer'}
            </button>
          </div>
        </form>
      )}

      {/* Partners List Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#E5E1D8] bg-[#F5F2EA] text-[#3C2A21]/80 font-bold uppercase tracking-widest text-[9px]">
              <th className="p-3 rounded-l-lg">Nom</th>
              <th className="p-3">Email</th>
              <th className="p-3">Téléphone</th>
              <th className="p-3">Mot de passe</th>
              <th className="p-3 text-center">Couleur Planning</th>
              <th className="p-3 text-right rounded-r-lg">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {users.map((user) => {
              const isEditing = editingUserId === user.id;
              
              return (
                <tr key={user.id} className="hover:bg-stone-50/50 transition-all">
                  
                  {/* Name column */}
                  <td className="p-3 font-bold text-[#3C2A21]">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="bg-white border border-[#E5E1D8] rounded-xl px-3 py-1.5 font-medium focus:outline-none"
                      />
                    ) : (
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold shadow-sm"
                          style={{ backgroundColor: user.color }}
                        >
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <span>{user.name}</span>
                          {user.role === 'ADMIN' && (
                            <span className="ml-1.5 px-2 py-0.5 rounded-full text-[9px] uppercase font-bold bg-[#F5F2EA] text-[#8B5E3C] border border-[#E5E1D8]/60">Gérante</span>
                          )}
                        </div>
                      </div>
                    )}
                  </td>

                  {/* Email column */}
                  <td className="p-3 text-[#3C2A21]/80 font-medium">
                    {isEditing ? (
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="bg-white border border-[#E5E1D8] rounded-xl px-3 py-1.5 focus:outline-none"
                      />
                    ) : (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3 text-stone-400" />
                        {user.email}
                      </span>
                    )}
                  </td>

                  {/* Phone column */}
                  <td className="p-3 text-[#3C2A21]/80 font-medium font-mono">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="bg-white border border-[#E5E1D8] rounded-xl px-3 py-1.5 focus:outline-none"
                      />
                    ) : (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3 text-stone-400" />
                        {user.phone || <span className="italic text-stone-400">Non renseigné</span>}
                      </span>
                    )}
                  </td>

                  {/* Password column */}
                  <td className="p-3 text-[#3C2A21]/80 font-medium font-mono">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        className="bg-white border border-[#E5E1D8] rounded-xl px-3 py-1.5 focus:outline-none w-28"
                      />
                    ) : (
                      <span>{user.password || 'louvat1954'}</span>
                    )}
                  </td>

                  {/* Color representation */}
                  <td className="p-3 text-center">
                    {isEditing ? (
                      <div className="flex space-x-1 justify-center">
                        {PRESET_COLORS.map(c => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setEditColor(c)}
                            className="w-4 h-4 rounded-full border border-[#E5E1D8] shadow-xs"
                            style={{ backgroundColor: c }}
                          >
                            {editColor === c && <span className="text-[7px] text-white">✓</span>}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <div
                          className="w-5 h-5 rounded-full border border-[#E5E1D8] shadow-sm"
                          style={{ backgroundColor: user.color }}
                          title={user.color}
                        />
                      </div>
                    )}
                  </td>

                  {/* Edit/Delete Actions */}
                  <td className="p-3 text-right">
                    {isEditing ? (
                      <div className="flex justify-end space-x-1">
                        <button
                          onClick={() => handleSaveEdit(user.id)}
                          className="p-1 bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 rounded transition-all"
                          title="Sauvegarder"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingUserId(null)}
                          className="p-1 bg-stone-100 text-stone-600 border border-stone-200 hover:bg-stone-200 rounded transition-all"
                          title="Annuler"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end space-x-1">
                        <button
                          onClick={() => handleStartEdit(user)}
                          className="p-1 text-stone-500 hover:text-[#8B5E3C] hover:bg-[#F5F2EA] rounded-full transition-all"
                          title="Modifier"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        {user.role === 'PARTNER' && (
                          <button
                            onClick={() => handleDeletePartner(user.id)}
                            className="p-1 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded transition-all"
                            title="Supprimer l'auto-entrepreneur"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
};
