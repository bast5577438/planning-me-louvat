/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { NotificationLog } from '../types';
import { Mail, MessageSquare, Send, Calendar, Clock, AlertCircle, Sparkles, PhoneCall } from 'lucide-react';

interface NotificationCenterProps {
  logs: NotificationLog[];
  onClearLogs: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  logs,
  onClearLogs,
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'EMAIL' | 'SMS'>('ALL');

  const filteredLogs = logs.filter((log) => {
    if (filterType === 'ALL') return true;
    return log.type === filterType;
  });

  return (
    <div className="bg-white border border-[#E5E1D8] rounded-[32px] shadow-sm p-4 sm:p-6 space-y-6" id="notification-center-container">
      
      {/* Title & Actions */}
      <div className="flex justify-between items-center border-b border-[#E5E1D8] pb-4">
        <div>
          <h2 className="text-xl font-serif italic font-bold text-[#8B5E3C]">
            Journal de Notifications Automatiques
          </h2>
          <p className="text-xs text-[#3C2A21]/60 font-medium">
            Vérifiez l'historique et la structure des alertes e-mails et SMS expédiés aux vendeuses et à l'administration.
          </p>
        </div>

        {logs.length > 0 && (
          <button
            onClick={() => {
              if (window.confirm('Voulez-vous réinitialiser l\'historique des notifications simulées ?')) {
                onClearLogs();
              }
            }}
            className="text-[10px] font-bold text-[#3C2A21] hover:text-[#8B5E3C] hover:bg-[#F5F2EA] px-3.5 py-2 rounded-full border border-[#E5E1D8] transition-all cursor-pointer"
          >
            Vider l'historique
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-1.5 border-b border-[#E5E1D8] pb-3 text-xs">
        <button
          onClick={() => setFilterType('ALL')}
          className={`px-4 py-2 rounded-full font-bold transition-all cursor-pointer ${
            filterType === 'ALL'
              ? 'bg-[#F5F2EA] text-[#8B5E3C] border border-[#E5E1D8]'
              : 'text-stone-500 hover:text-[#3C2A21] hover:bg-[#F5F2EA]/20'
          }`}
        >
          Toutes les alertes ({logs.length})
        </button>
        <button
          onClick={() => setFilterType('EMAIL')}
          className={`px-4 py-2 rounded-full font-bold transition-all cursor-pointer ${
            filterType === 'EMAIL'
              ? 'bg-[#F5F2EA] text-[#8B5E3C] border border-[#E5E1D8]'
              : 'text-stone-500 hover:text-[#3C2A21] hover:bg-[#F5F2EA]/20'
          }`}
        >
          E-mails confirmés ({logs.filter(l => l.type === 'EMAIL').length})
        </button>
        <button
          onClick={() => setFilterType('SMS')}
          className={`px-4 py-2 rounded-full font-bold transition-all cursor-pointer ${
            filterType === 'SMS'
              ? 'bg-[#F5F2EA] text-[#8B5E3C] border border-[#E5E1D8]'
              : 'text-stone-500 hover:text-[#3C2A21] hover:bg-[#F5F2EA]/20'
          }`}
        >
          SMS planifiés ({logs.filter(l => l.type === 'SMS').length})
        </button>
      </div>

      {/* Architecture warning explaining how the email and sms is connected */}
      <div className="p-4 bg-[#F5F2EA]/50 rounded-2xl border border-[#E5E1D8] flex gap-3 text-xs items-start leading-relaxed text-[#3C2A21] shadow-xs">
        <Sparkles className="h-5 w-5 text-[#8B5E3C] shrink-0 mt-0.5" />
        <div className="space-y-1 font-medium">
          <p className="font-bold text-[#3C2A21]">Architecture de notification câblée</p>
          <p className="text-[#3C2A21]/80">
            Cette application simule de manière transparente les envois réels. Le code utilise un module de services 
            <code className="mx-1 px-1 py-0.5 bg-white border border-[#E5E1D8] rounded font-mono text-[10px] text-[#8B5E3C]">triggerNotification(type, recipient, subject, message)</code> qui écrit dans un tampon. Pour la production, 
            il suffit d'y connecter l'API de messagerie <strong>Nodemailer/Resend</strong> (pour les emails) et <strong>Twilio/Sinch</strong> (pour les SMS).
          </p>
        </div>
      </div>

      {/* Logs list representation */}
      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log) => {
            const timeStr = new Date(log.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            const dateStr = new Date(log.timestamp).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
            
            return (
              <div key={log.id} className="border border-[#E5E1D8] rounded-2xl p-4 space-y-2.5 hover:bg-[#F5F2EA]/20 transition-all text-xs bg-white shadow-xs animate-fade-in">
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-2">
                    <div className={`p-2 rounded-full ${log.type === 'EMAIL' ? 'bg-[#F5F2EA] text-[#8B5E3C] border border-[#E5E1D8]' : 'bg-pink-50 text-pink-800 border border-pink-100'}`}>
                      {log.type === 'EMAIL' ? <Mail className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
                    </div>
                    <div>
                      <span className="font-bold text-[#3C2A21] block">
                        {log.subject}
                      </span>
                      <span className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider">
                        Destinataire : {log.recipient}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] uppercase font-bold bg-[#EAF0DE] text-[#7B8A56] border border-[#D4DEC3] flex items-center gap-1">
                      <Send className="h-3 w-3" />
                      {log.status === 'SENT' ? 'Expédié' : 'File d\'attente'}
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono block mt-1 font-semibold">
                      {dateStr}, {timeStr}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-[#F5F2EA]/30 border border-[#E5E1D8]/40 rounded-xl text-[11px] font-mono text-[#3C2A21]/80 whitespace-pre-wrap leading-relaxed">
                  {log.message}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-16 text-stone-400 italic text-xs space-y-2">
            <AlertCircle className="h-8 w-8 mx-auto stroke-1" />
            <p>Aucune notification enregistrée dans l'historique pour le moment.</p>
          </div>
        )}
      </div>

    </div>
  );
};
