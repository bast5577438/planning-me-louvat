/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, Location, Reservation, AppSettings } from '../types';
import { Calendar, Users, Briefcase, TrendingUp, DollarSign, Download, ArrowUpRight, Award, MapPin, Eye, AlertTriangle, Mail, Check, Bell } from 'lucide-react';

interface AdminDashboardProps {
  allUsers: User[];
  locations: Location[];
  reservations: Reservation[];
  settings: AppSettings;
  onNavigateToCalendar: (dateStr: string) => void;
  onAddNotificationLog?: (log: any) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  allUsers,
  locations,
  reservations,
  settings,
  onNavigateToCalendar,
  onAddNotificationLog,
}) => {
  // Month selector for statistics: "ALL", "09-2026" (September), "12-2026" (December)
  const [selectedPeriod, setSelectedPeriod] = useState<string>('12-2026'); // Defaults to December 2026 when multiple events overlap

  const partners = allUsers.filter(u => u.role === 'PARTNER');

  // Helper: check if reservation falls within chosen period
  const filterByPeriod = (res: Reservation) => {
    if (selectedPeriod === 'ALL') return true;
    const [month, year] = selectedPeriod.split('-');
    const resDate = new Date(res.date);
    const resMonth = String(resDate.getMonth() + 1).padStart(2, '0');
    const resYear = String(resDate.getFullYear());
    return resMonth === month && resYear === year;
  };

  const activeReservations = reservations.filter(filterByPeriod);

  // --- STATS COMPUTATIONS ---
  const totalPrestations = activeReservations.length;
  const totalHours = activeReservations.reduce((sum, r) => sum + r.hours, 0);
  const totalPayout = activeReservations.reduce((sum, r) => sum + (r.hours * r.hourlyRate), 0);

  // Computing statistics for each partner
  const partnerStats = partners.map(partner => {
    const partnerRes = activeReservations.filter(r => r.userId === partner.id);
    const days = partnerRes.length;
    const hours = partnerRes.reduce((sum, r) => sum + r.hours, 0);
    const earnings = partnerRes.reduce((sum, r) => sum + (r.hours * r.hourlyRate), 0);
    return {
      partner,
      days,
      hours,
      earnings,
    };
  }).sort((a, b) => b.earnings - a.earnings); // Sort by highest earning for beautiful hierarchy

  // Calculating total potential working slots in December 2026 or September 2026 to evaluate filling rate
  // - September 2026: Boutique Voiron is active for 30 days. Max capacity = 30 * settings.maxPartnersPerDay
  // - December 2026: 
  //   - Voiron: 31 days
  //   - SGV: Dec 7 to Dec 31 (25 days)
  //   - Christmas Market: Dec 16 to Dec 24 (9 days)
  //   - Total open slots = (31 + 25 + 9) * maxPartnersPerDay = 65 slots
  const getPotentialSlots = () => {
    if (selectedPeriod === '09-2026') return 30 * settings.maxPartnersPerDay;
    if (selectedPeriod === '12-2026') return (31 + 25 + 9) * settings.maxPartnersPerDay;
    return 120; // Default approximation for "ALL"
  };

  const potentialSlots = getPotentialSlots();
  const fillingRate = Math.min(100, Math.round((totalPrestations / potentialSlots) * 100)) || 0;
  const remainingSlots = Math.max(0, potentialSlots - totalPrestations);

  // Breakdown by location
  const locationStats = locations.map(loc => {
    const locRes = activeReservations.filter(r => r.locationId === loc.id);
    const payout = locRes.reduce((sum, r) => sum + (r.hours * r.hourlyRate), 0);
    return {
      location: loc,
      count: locRes.length,
      payout,
    };
  });

  // --- ALERTES J-7 SANS AUTO-ENTREPRENEUR ---
  const [simulatedToday, setSimulatedToday] = useState<string>('2026-12-09');
  const [sentAlertLocs, setSentAlertLocs] = useState<string[]>([]);

  const formatFrenchDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    } catch (e) {
      return dateStr;
    }
  };

  const getAlertsJ7 = () => {
    if (!simulatedToday) return [];
    try {
      const todayDate = new Date(simulatedToday);
      const targetDate = new Date(todayDate);
      targetDate.setDate(todayDate.getDate() + 7);
      
      const yyyy = targetDate.getFullYear();
      const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
      const dd = String(targetDate.getDate()).padStart(2, '0');
      const targetDateStr = `${yyyy}-${mm}-${dd}`;
      
      // Filter active locations on target J+7 date
      const activeLocs = locations.filter(loc => {
        if (!loc.isActive) return false;
        return targetDateStr >= loc.startDate && targetDateStr <= loc.endDate;
      });
      
      const alerts: { location: Location; dateStr: string }[] = [];
      
      activeLocs.forEach(loc => {
        const bookings = reservations.filter(r => r.date === targetDateStr && r.locationId === loc.id);
        if (bookings.length === 0) {
          alerts.push({ location: loc, dateStr: targetDateStr });
        }
      });
      
      return alerts;
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  const alertsJ7 = getAlertsJ7();

  const handleTriggerAlertEmail = (loc: Location, targetDateStr: string) => {
    const managerEmail = settings.notificationEmail || 'cib@biscuiterie-louvat.com';
    
    const newLog = {
      id: `not_j7_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'EMAIL' as const,
      recipient: managerEmail,
      subject: `🚨 [ALERTE J-7] Vacance de créneau détectée - ${loc.name}`,
      message: `Bonjour,\n\nCeci est un rappel automatique du système de planification destiné à la gérante.\n\nLa boutique "${loc.name}" (${loc.code}) est ouverte le ${formatFrenchDate(targetDateStr)} (dans exactement 1 semaine), mais aucun auto-entrepreneur indépendant n'est actuellement positionné pour cette journée.\n\nNous vous invitons à prendre contact avec vos auto-entrepreneurs pour coordonner un créneau ou à ajuster l'affichage des boutiques actives si nécessaire.\n\nLien d'accès au planning : ${window.location.origin}\n\nCordialement,\nService Planification — Biscuiterie Louvat`,
      status: 'SENT' as const,
    };
    
    if (onAddNotificationLog) {
      onAddNotificationLog(newLog);
    }
    
    setSentAlertLocs(prev => [...prev, `${loc.id}_${targetDateStr}`]);
  };

  return (
    <div className="space-y-6" id="dashboard-container">
      
      {/* Dashboard Heading & Period Filter */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 border-b border-[#E5E1D8] pb-4">
        <div>
          <h2 className="text-2xl font-serif italic font-bold text-[#8B5E3C] flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-[#8B5E3C]" />
            Tableau de Bord Administratif
          </h2>
          <p className="text-xs text-[#3C2A21]/60 font-medium">
            Suivi en temps réel de l'activité commerciale et des commissions dues à la Biscuiterie Louvat
          </p>
        </div>

        {/* Month Selector Tabs */}
        <div className="flex items-center space-x-1.5 bg-[#F5F2EA] p-1.5 rounded-full border border-[#E5E1D8] self-start md:self-auto shadow-xs">
          <button
            onClick={() => setSelectedPeriod('09-2026')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              selectedPeriod === '09-2026'
                ? 'bg-[#8B5E3C] text-white shadow-xs'
                : 'text-[#3C2A21]/70 hover:bg-white/60'
            }`}
          >
            Septembre 2026
          </button>
          <button
            onClick={() => setSelectedPeriod('12-2026')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              selectedPeriod === '12-2026'
                ? 'bg-[#8B5E3C] text-white shadow-xs'
                : 'text-[#3C2A21]/70 hover:bg-white/60'
            }`}
          >
            Décembre 2026
          </button>
          <button
            onClick={() => setSelectedPeriod('ALL')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
              selectedPeriod === 'ALL'
                ? 'bg-[#8B5E3C] text-white shadow-xs'
                : 'text-[#3C2A21]/70 hover:bg-white/60'
            }`}
          >
            Toutes périodes
          </button>
        </div>
      </div>

      {/* SECTION ALERTE J-7 (VACANCE DE PLANNING) */}
      <div className="bg-[#FAF8F5] border border-[#E5E1D8] rounded-[24px] p-5 shadow-xs space-y-4" id="alert-j7-box">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-50 rounded-lg text-amber-700 border border-amber-200">
              <AlertTriangle className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-serif italic font-bold text-[#3C2A21] text-base">
                Alerte de Vacance à J-7 (Rappel Gérante)
              </h3>
              <p className="text-[11px] text-[#3C2A21]/70 font-medium">
                S'envoyer un e-mail de rappel si une boutique active n'a aucun auto-entrepreneur planifié 7 jours à l'avance.
              </p>
            </div>
          </div>
          
          {/* Simulated Date Picker for interactive verification */}
          <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-full border border-[#E5E1D8] shadow-2xs">
            <span className="text-[10px] font-bold text-[#3C2A21]/60 uppercase tracking-wider">
              Date simulée d'analyse :
            </span>
            <input 
              type="date" 
              value={simulatedToday}
              onChange={(e) => setSimulatedToday(e.target.value)}
              className="text-xs font-bold text-[#8B5E3C] bg-transparent border-none focus:ring-0 p-0 cursor-pointer outline-none"
            />
          </div>
        </div>

        {alertsJ7.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="alerts-grid">
            {alertsJ7.map(({ location, dateStr }) => {
              const isSent = sentAlertLocs.includes(`${location.id}_${dateStr}`);
              return (
                <div 
                  key={`${location.id}_${dateStr}`} 
                  className="bg-white border border-amber-200/80 rounded-xl p-4 flex flex-col justify-between shadow-3xs relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500"></div>
                  <div className="pl-2 space-y-1">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/50 uppercase tracking-wider">
                        Alerte critique
                      </span>
                      <span className="text-[10px] font-mono text-stone-500 font-medium">
                        J-7 (Prestation le {formatFrenchDate(dateStr)})
                      </span>
                    </div>
                    <h4 className="font-bold text-[#3C2A21] text-sm mt-1">
                      {location.name} ({location.code})
                    </h4>
                    <p className="text-[11px] text-stone-600 font-medium leading-normal">
                      Aucun auto-entrepreneur n'est planifié pour cette journée. La boutique risque de rester fermée !
                    </p>
                  </div>

                  <div className="mt-4 pl-2 flex justify-end">
                    {isSent ? (
                      <span className="inline-flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                        <Check className="h-3.5 w-3.5 mr-1" />
                        Rappel e-mail envoyé à la Gérante !
                      </span>
                    ) : (
                      <button
                        onClick={() => handleTriggerAlertEmail(location, dateStr)}
                        className="inline-flex items-center text-[10px] font-bold text-white bg-[#8B5E3C] hover:bg-[#704a2d] px-3.5 py-1.5 rounded-full shadow-xs transition-all gap-1.5"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        S'envoyer le rappel e-mail (Gérante)
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4 text-center text-xs font-medium text-emerald-800" id="alerts-empty-state">
            ✨ Aucune vacance à J-7 détectée le <strong>{formatFrenchDate(new Date(new Date(simulatedToday).getTime() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0])}</strong>. Toutes les boutiques actives ont au moins un auto-entrepreneur planifié !
          </div>
        )}
      </div>

      {/* Primary KPI Stats Cards Grid (Bento) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Taux de Remplissage Card */}
        <div className="bg-white border border-[#E5E1D8] rounded-[24px] p-5 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-[#F5F2EA] rounded-full text-[#8B5E3C] border border-[#E5E1D8]/60">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[#3C2A21]/50 tracking-wider">Remplissage</span>
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-serif font-bold text-[#3C2A21]">{fillingRate}%</span>
              <span className="text-[11px] text-[#3C2A21]/60 font-medium">des créneaux</span>
            </div>
            {/* Tiny progressive bar */}
            <div className="w-28 bg-[#F5F2EA] h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div className="bg-[#D4A373] h-full rounded-full" style={{ width: `${fillingRate}%` }}></div>
            </div>
          </div>
        </div>

        {/* Prestations Réalisées Card */}
        <div className="bg-white border border-[#E5E1D8] rounded-[24px] p-5 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-[#FDF4EA] rounded-full text-[#D4A373] border border-[#F1E4D4]">
            <Briefcase className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[#3C2A21]/50 tracking-wider">Prestations</span>
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-serif font-bold text-[#3C2A21]">{totalPrestations}</span>
              <span className="text-[11px] text-[#3C2A21]/60 font-medium">réservées</span>
            </div>
            <p className="text-[10px] text-[#3C2A21]/60 mt-1 font-medium">
              {remainingSlots} journées libres à pourvoir
            </p>
          </div>
        </div>

        {/* Heures cumulées Card */}
        <div className="bg-white border border-[#E5E1D8] rounded-[24px] p-5 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-[#EAF0DE] rounded-full text-[#7B8A56] border border-[#D4DEC3]">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-[#3C2A21]/50 tracking-wider">Heures Cumulées</span>
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-serif font-bold text-[#3C2A21]">{totalHours}h</span>
              <span className="text-[11px] text-[#3C2A21]/60 font-medium">travaillées</span>
            </div>
            <p className="text-[10px] text-[#7B8A56] font-bold mt-1 flex items-center">
              Moyenne: {totalPrestations > 0 ? Math.round(totalHours / totalPrestations) : 0}h / jour
            </p>
          </div>
        </div>

        {/* Montant total des commissions Card */}
        <div className="bg-[#3C2A21] border border-[#3C2A21] rounded-[24px] p-5 shadow-md flex items-center space-x-4 text-white">
          <div className="p-3 bg-[#8B5E3C] rounded-full text-white">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-stone-300 tracking-wider">Masse Salariale</span>
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-serif font-bold text-amber-100">{totalPayout.toLocaleString('fr-FR')} €</span>
            </div>
            <p className="text-[10px] text-stone-300 mt-1">
              Tarif moyen configuré : {settings.defaultHourlyRate} €/h
            </p>
          </div>
        </div>
      </div>

      {/* Main Stats Grid Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Partners detailed payout table */}
        <div className="lg:col-span-8 bg-white border border-[#E5E1D8] rounded-[32px] shadow-sm p-4 sm:p-5 flex flex-col overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-serif italic font-bold text-[#3C2A21] text-lg">
              Performances et Rémunérations par Auto-entrepreneur
            </h3>
            <span className="text-[10px] text-[#8B5E3C] uppercase tracking-wider font-bold bg-[#F5F2EA] px-2.5 py-1 rounded-full border border-[#E5E1D8]/60">
              Calcul Automatique
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E5E1D8] bg-[#F5F2EA] text-[#3C2A21]/80 font-bold uppercase tracking-widest text-[9px]">
                  <th className="p-3 rounded-l-lg">Partenaire</th>
                  <th className="p-3">Statut</th>
                  <th className="p-3 text-center">Journées</th>
                  <th className="p-3 text-center">Total Heures</th>
                  <th className="p-3 text-right">Rémunération due</th>
                  <th className="p-3 text-right rounded-r-lg">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {partnerStats.map(({ partner, days, hours, earnings }) => (
                  <tr key={partner.id} className="hover:bg-stone-50/50 transition-all">
                    {/* User profile with custom tag color */}
                    <td className="p-3 font-bold text-[#3C2A21]">
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
                          style={{ backgroundColor: partner.color }}
                        >
                          {partner.name.charAt(0)}
                        </div>
                        <span>{partner.name}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold bg-[#EAF0DE] text-[#7B8A56] border border-[#D4DEC3]">
                        Auto-Entrepreneure
                      </span>
                    </td>
                    <td className="p-3 text-center font-bold text-stone-700">{days} j</td>
                    <td className="p-3 text-center font-mono text-stone-600">{hours} h</td>
                    <td className="p-3 text-right font-serif font-bold text-[#8B5E3C] text-sm">
                      {earnings.toLocaleString('fr-FR')} €
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          // Try to open first reservation date or default to Sept/Dec
                          const firstRes = reservations.find(r => r.userId === partner.id && filterByPeriod(r));
                          onNavigateToCalendar(firstRes ? firstRes.date : selectedPeriod === '09-2026' ? '2026-09-01' : '2026-12-16');
                        }}
                        className="text-[10px] font-bold text-[#8B5E3C] hover:bg-white px-2.5 py-1 rounded-full border border-[#E5E1D8] shadow-xs transition-all"
                        title="Voir sur le planning"
                      >
                        Voir Planning
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Empty stats state */}
          {partnerStats.length === 0 && (
            <div className="text-center py-10 italic text-stone-400">
              Aucun partenaire enregistré.
            </div>
          )}
        </div>

        {/* Right Side: Boutique locations statistics & native clean visualizer */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Location breakdown card */}
          <div className="bg-white border border-[#E5E1D8] rounded-[32px] shadow-sm p-4 sm:p-5 flex flex-col">
            <h3 className="font-serif italic font-bold text-[#3C2A21] text-base mb-4">
              Répartition par Boutique
            </h3>
            
            <div className="space-y-4">
              {locationStats.map(({ location, count, payout }) => {
                const percentage = totalPrestations > 0 ? Math.round((count / totalPrestations) * 100) : 0;
                
                return (
                  <div key={location.id} className="space-y-1.5">
                    <div className="flex justify-between text-xs items-center font-semibold">
                      <span className="text-[#3C2A21]">{location.name}</span>
                      <span className="font-mono text-[#3C2A21]/60">
                        {count} prest. ({percentage}%)
                      </span>
                    </div>
                    {/* Visual custom range bar */}
                    <div className="w-full bg-[#F5F2EA] h-2.5 rounded-full overflow-hidden border border-[#E5E1D8]/50">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          location.color === 'amber' ? 'bg-[#D4A373]' : location.color === 'emerald' ? 'bg-[#7B8A56]' : 'bg-[#A67B5B]'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-[#3C2A21]/50 font-bold">
                      <span>Total prestations</span>
                      <span className="text-[#8B5E3C] font-bold">{payout.toLocaleString('fr-FR')} €</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Svg graphical indicator chart of earnings share */}
          <div className="bg-[#F5F2EA]/40 border border-[#E5E1D8] rounded-[24px] p-4 sm:p-5 shadow-xs">
            <h3 className="font-serif italic font-bold text-[#8B5E3C] text-sm mb-3">
              Part de Rémunération Globale
            </h3>

            {totalPayout > 0 ? (
              <div className="flex items-center gap-4">
                {/* Simulated beautiful SVG Donut Chart */}
                <div className="relative h-20 w-20 flex-shrink-0">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f4f4f5" strokeWidth="3" />
                    {(() => {
                      let currentOffset = 0;
                      return partnerStats.map(({ partner, earnings }) => {
                        const percent = (earnings / totalPayout) * 100;
                        if (percent === 0) return null;
                        const dashArray = `${percent} ${100 - percent}`;
                        const strokeOffset = 100 - currentOffset;
                        currentOffset += percent;
                        return (
                          <circle
                            key={partner.id}
                            cx="18"
                            cy="18"
                            r="15.915"
                            fill="none"
                            stroke={partner.color}
                            strokeWidth="3"
                            strokeDasharray={dashArray}
                            strokeDashoffset={strokeOffset}
                            className="transition-all duration-500"
                          />
                        );
                      });
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[9px] uppercase font-bold text-stone-400">Total</span>
                    <span className="text-xs font-bold text-[#8B5E3C] leading-none">{totalPayout}€</span>
                  </div>
                </div>

                {/* Legend list */}
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] w-full">
                  {partnerStats.filter(p => p.earnings > 0).map(({ partner, earnings }) => (
                    <div key={partner.id} className="flex items-center space-x-1.5 truncate">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: partner.color }} />
                      <span className="text-[#3C2A21]/70 truncate">{partner.name} :</span>
                      <span className="font-bold text-[#3C2A21]">{Math.round((earnings / totalPayout) * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-stone-500 text-xs text-center py-4">Aucune donnée disponible pour cette période.</p>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
