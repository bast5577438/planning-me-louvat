/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, Location, Reservation, AppSettings } from '../types';
import { Calendar, ChevronLeft, ChevronRight, CheckCircle, AlertTriangle, Trash2, UserPlus, Lock, MapPin, Clock, Euro, Users, Info } from 'lucide-react';
import { triggerNotification } from '../utils/storage';

interface CalendarViewProps {
  currentUser: User;
  allUsers: User[];
  locations: Location[];
  reservations: Reservation[];
  settings: AppSettings;
  onUpdateReservations: (newReservations: Reservation[]) => void;
  onAddNotificationLog: (log: any) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  currentUser,
  allUsers,
  locations,
  reservations,
  settings,
  onUpdateReservations,
  onAddNotificationLog,
}) => {
  // Dynamic initialization to land on the current month and year (or closest active month in 2026)
  const realToday = new Date();
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(realToday.getMonth()); // Dynamic current month (0-indexed)
  
  // Active day selection state for the booking modal/sidebar
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(
    `2026-${String(realToday.getMonth() + 1).padStart(2, '0')}-${String(realToday.getDate()).padStart(2, '0')}`
  );
  
  // Form states for booking
  const [bookingLocationId, setBookingLocationId] = useState<string>('loc_xm_voiron');
  const [bookingPartnerId, setBookingPartnerId] = useState<string>(currentUser.role === 'PARTNER' ? currentUser.id : '2');
  const [customHours, setCustomHours] = useState<number>(settings.defaultHoursPerDay);
  const [customRate, setCustomRate] = useState<number>(settings.defaultHourlyRate);
  
  // Notification states
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showCancellationConfirm, setShowCancellationConfirm] = useState<string | null>(null);

  // Helper date lists
  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];
  const monthAbbrevs = [
    'Jan.', 'Fév.', 'Mars', 'Avr.', 'Mai', 'Juin',
    'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'
  ];
  const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  // Calculate days of month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Get the day index for starting day of the month (Monday = 0, Sunday = 6)
  const getFirstDayOfMonthIndex = (year: number, month: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Convert to Mon-Sun
  };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayIndex = getFirstDayOfMonthIndex(currentYear, currentMonth);

  // Switch month
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Format date helper: returns "YYYY-MM-DD"
  const formatDateString = (day: number) => {
    const yyyy = currentYear;
    const mm = String(currentMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Format human readable date in French: "Mercredi 16 Décembre 2026"
  // Utilise les parties de la date pour éviter les bugs timezone Safari/Firefox
  const formatHumanDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  // Check if a location is active on a specific date
  const isLocationActiveOnDate = (loc: Location, dateStr: string) => {
    if (!loc.isActive) return false;
    // Dates vides = boutique annuelle (toujours ouverte)
    if (!loc.startDate && !loc.endDate) return true;
    if (!loc.startDate) return dateStr <= loc.endDate;
    if (!loc.endDate) return dateStr >= loc.startDate;
    // Dates invalides (ex: 'voir tati') → pas actif
    if (loc.startDate.length !== 10 || loc.endDate.length !== 10) return false;
    return dateStr >= loc.startDate && dateStr <= loc.endDate;
  };

  // Get active locations for a specific date
  const getActiveLocationsOnDate = (dateStr: string) => {
    return locations.filter(loc => isLocationActiveOnDate(loc, dateStr));
  };

  // Garde le point de vente du formulaire admin aligné sur le jour sélectionné :
  // sans ça, une réservation peut partir sur une boutique fermée ce jour-là (invisible sur le planning)
  useEffect(() => {
    if (!selectedDateStr) return;
    const active = getActiveLocationsOnDate(selectedDateStr);
    if (active.length > 0 && !active.some(l => l.id === bookingLocationId)) {
      setBookingLocationId(active[0].id);
    }
  }, [selectedDateStr, locations]);

  // Get reservations for a specific date & location
  const getReservationsForSlot = (dateStr: string, locationId: string) => {
    return reservations.filter(r => r.date === dateStr && r.locationId === locationId);
  };

  // Check cancellation deadline (current date assumed to be 2026-07-06 as metadata indicates)
  const isWithinCancellationDeadline = (dateStr: string) => {
    const today = new Date('2026-07-06'); // System simulated date
    const targetDate = new Date(dateStr);
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays < settings.cancellationDeadlineDays;
  };

  // Handle slot reservation
  const handleBookSlot = (locationId: string, partnerId: string) => {
    const dateStr = selectedDateStr;
    if (!dateStr) return;

    const partnerObj = allUsers.find(u => u.id === partnerId);
    if (!partnerObj) return;

    // Refuse la réservation si la boutique n'est pas ouverte ce jour-là
    const targetLoc = locations.find(l => l.id === locationId);
    if (!targetLoc || !isLocationActiveOnDate(targetLoc, dateStr)) {
      setAlertMessage({
        type: 'error',
        text: `Ce point de vente n'est pas ouvert à cette date. Sélectionnez une boutique active dans la liste.`
      });
      return;
    }

    // Check capacity for location
    const existing = getReservationsForSlot(dateStr, locationId);
    if (existing.length >= settings.maxPartnersPerDay) {
      setAlertMessage({
        type: 'error',
        text: `Limite de places atteinte (${settings.maxPartnersPerDay} max) pour ce lieu ce jour.`
      });
      return;
    }

    // Check if partner is already booked in ANY location on this same day
    const partnerAlreadyBookedToday = reservations.some(r => r.date === dateStr && r.userId === partnerId);
    if (partnerAlreadyBookedToday) {
      setAlertMessage({
        type: 'error',
        text: `${partnerObj.name} est déjà planifiée sur une boutique ce jour-là.`
      });
      return;
    }

    // Book it
    const newReservation: Reservation = {
      id: `res_${Date.now()}`,
      userId: partnerId,
      userName: partnerObj.name,
      locationId,
      date: dateStr,
      hours: customHours,
      hourlyRate: customRate
    };

    const updated = [...reservations, newReservation];
    onUpdateReservations(updated);

    // Logs & Simulated Alerts
    const locationName = locations.find(l => l.id === locationId)?.name || 'Boutique';
    const emailAdminLog = triggerNotification(
      'EMAIL',
      'cib@biscuiterie-louvat.com',
      `Nouvelle réservation - ${partnerObj.name}`,
      `L'auto-entrepreneur ${partnerObj.name} s'est positionné sur la journée du ${formatHumanDate(dateStr)} à la boutique : ${locationName}.`
    );
    const emailPartnerLog = triggerNotification(
      'EMAIL',
      partnerObj.email,
      `Confirmation de réservation Louvat`,
      `Bonjour ${partnerObj.name}, votre réservation pour le ${formatHumanDate(dateStr)} à "${locationName}" a bien été enregistrée.\n\nDétails : ${customHours}h à ${customRate}€/h soit ${customHours * customRate}€.`
    );
    onAddNotificationLog(emailAdminLog);
    onAddNotificationLog(emailPartnerLog);

    setAlertMessage({
      type: 'success',
      text: `Réservation enregistrée avec succès ! Emails de confirmation envoyés.`
    });

    // Reset forms
    setCustomHours(settings.defaultHoursPerDay);
    setCustomRate(settings.defaultHourlyRate);
  };

  // Handle slot cancellation
  const handleCancelBooking = (reservationId: string) => {
    const res = reservations.find(r => r.id === reservationId);
    if (!res) return;

    const partnerObj = allUsers.find(u => u.id === res.userId);
    const locationName = locations.find(l => l.id === res.locationId)?.name || 'Boutique';

    // Non-authoritative notification of cancellation deadline for Partners
    if (currentUser.role === 'PARTNER' && isWithinCancellationDeadline(res.date) && showCancellationConfirm !== reservationId) {
      setShowCancellationConfirm(reservationId);
      setAlertMessage({
        type: 'error',
        text: `⚠️ Rappel d'organisation : Pour préserver notre chaîne d'approvisionnement en biscuits frais et la livraison des points de vente, un délai d'annonce de ${settings.cancellationDeadlineDays} jours est d'usage. En tant qu'entrepreneur partenaire indépendant, vous restez entièrement libre de retirer votre prestation. Merci de confirmer ci-dessous si vous souhaitez acter ce retrait.`
      });
      return;
    }

    // Cancel reservation
    const updated = reservations.filter(r => r.id !== reservationId);
    onUpdateReservations(updated);
    setShowCancellationConfirm(null);

    // Logs & Alerts
    const alertAdminLog = triggerNotification(
      'EMAIL',
      'cib@biscuiterie-louvat.com',
      `Annulation de réservation`,
      `L'auto-entrepreneur ${res.userName} a annulé sa prestation du ${formatHumanDate(res.date)} à la boutique : ${locationName}.`
    );
    if (partnerObj) {
      const alertPartnerLog = triggerNotification(
        'EMAIL',
        partnerObj.email,
        `Annulation confirmée - Louvat`,
        `Bonjour ${res.userName}, votre annulation pour la prestation du ${formatHumanDate(res.date)} à "${locationName}" a été prise en compte.`
      );
      onAddNotificationLog(alertPartnerLog);
    }
    onAddNotificationLog(alertAdminLog);

    setAlertMessage({
      type: 'success',
      text: `Réservation annulée avec succès. Emails d'annulation envoyés.`
    });
  };

  // Get color styles for locations
  const getLocationBadgeStyle = (color: string) => {
    switch (color) {
      case 'amber':
        return 'bg-[#FEF3C7] text-[#92400E] border-[#F59E0B] font-bold';
      case 'emerald':
        return 'bg-[#D1FAE5] text-[#065F46] border-[#10B981] font-bold';
      case 'rose':
        return 'bg-[#FFE4E6] text-[#9F1239] border-[#F43F5E] font-bold';
      case 'purple':
        return 'bg-[#F3E8FF] text-[#6B21A8] border-[#A855F7] font-bold';
      case 'blue':
        return 'bg-[#DBEAFE] text-[#1E40AF] border-[#3B82F6] font-bold';
      case 'orange':
        return 'bg-[#FFEDD5] text-[#9A3412] border-[#F97316] font-bold';
      case 'slate':
        return 'bg-[#E2E8F0] text-[#1E293B] border-[#64748B] font-bold';
      default:
        return 'bg-[#FAFAFA] text-[#3C2A21] border-[#E5E1D8] font-bold';
    }
  };

  const getLocDatesLabel = (loc: Location) => {
    if (!loc.startDate || !loc.endDate) {
      return "Annuel";
    }
    if (loc.startDate === 'voir tati' || loc.endDate === 'voir tati') {
      return "voir tati";
    }
    try {
      const sParts = loc.startDate.split('-');
      const eParts = loc.endDate.split('-');
      const s = sParts.length === 3 ? `${sParts[2]}/${sParts[1]}` : loc.startDate;
      const e = eParts.length === 3 ? `${eParts[2]}/${eParts[1]}` : loc.endDate;
      return `${s} au ${e}`;
    } catch {
      return `${loc.startDate} au ${loc.endDate}`;
    }
  };

  // Generate calendar days grid
  const renderCalendarGrid = () => {
    const cells = [];

    // Fill blank cells for leading days
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(
        <div key={`empty-${i}`} className="bg-[#F5F2EA]/20 border border-[#E5E1D8] h-28 p-1 select-none opacity-40 rounded-lg"></div>
      );
    }

    // Fill actual month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDateString(day);
      const activeShops = getActiveLocationsOnDate(dateStr);
      const isSelected = selectedDateStr === dateStr;

      cells.push(
        <div
          key={`day-${day}`}
          onClick={() => {
            setSelectedDateStr(dateStr);
            setAlertMessage(null);
            // Auto select first active shop
            if (activeShops.length > 0) {
              setBookingLocationId(activeShops[0].id);
            }
          }}
          className={`bg-white border border-[#E5E1D8] min-h-[160px] md:min-h-[148px] p-2 flex flex-col justify-between cursor-pointer transition-all hover:bg-[#F5F2EA]/30 group relative overflow-hidden rounded-lg ${
            isSelected ? 'ring-2 ring-[#8B5E3C] ring-offset-1 z-10 bg-[#F5F2EA]/20' : ''
          }`}
          id={`day-box-${dateStr}`}
        >
          {/* Day Number Header */}
          <div className="flex justify-between items-center pb-1 border-b border-[#E5E1D8]/30">
            <span className={`text-sm font-bold rounded-full w-6 h-6 flex items-center justify-center transition-all ${
              isSelected ? 'bg-[#8B5E3C] text-stone-50 font-bold' : 'text-[#3C2A21]'
            }`}>
              {day}
            </span>
            {activeShops.length > 0 && (
              <span className="text-[9px] font-bold text-[#8B5E3C]/75 bg-[#F5F2EA] px-1.5 py-0.5 rounded-lg uppercase tracking-wide border border-[#E5E1D8]/60">
                {activeShops.length} {activeShops.length > 1 ? 'Lieux' : 'Lieu'}
              </span>
            )}
          </div>

          {/* Active Shops details in box */}
          <div className="space-y-1.5 mt-1.5 flex-1 overflow-y-auto scrollbar-none">
            {activeShops.map((shop) => {
              const resList = getReservationsForSlot(dateStr, shop.id);
              const isFull = resList.length >= settings.maxPartnersPerDay;
              
              return (
                <div 
                  key={shop.id} 
                  className={`text-[9px] px-2 py-1 rounded-[10px] border leading-tight flex flex-col gap-1 ${getLocationBadgeStyle(shop.color)}`}
                >
                  <div className="flex items-center justify-between font-bold text-[8px] uppercase tracking-wider border-b border-[#E5E1D8]/20 pb-0.5">
                    <span className="truncate max-w-[65px] font-extrabold text-[#3C2A21]/70">{shop.code}</span>
                    {resList.length === 0 && (
                      <span className="text-[8px] uppercase font-extrabold text-[#7B8A56]">Libre</span>
                    )}
                  </div>
                  
                  {resList.length > 0 && (
                    <div className="space-y-1">
                      {resList.map((res) => {
                        const pColor = allUsers.find(u => u.id === res.userId)?.color || '#999';
                        return (
                          <div
                            key={res.id}
                            className="flex items-center gap-1.5 bg-[#F5F2EA]/60 border border-[#E5E1D8] px-2 py-0.5 rounded-md text-[11px] font-black text-[#3C2A21] shadow-2xs"
                            title={`${res.userName} (${shop.name})`}
                          >
                            <span className="w-2 h-2 rounded-full shrink-0 border border-white" style={{ backgroundColor: pColor }}></span>
                            <span className="truncate max-w-[110px] font-black tracking-tight text-[#3C2A21]">{res.userName}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            
            {activeShops.length === 0 && (
              <div className="text-[9px] text-stone-400 text-center py-4 select-none italic font-medium">
                Fermé / Repos
              </div>
            )}
          </div>
        </div>
      );
    }

    return cells;
  };

  // Check J-7 vacancy alerts for a date (Simulated Today as 2026-12-09)
  const getJ7VacancyAlerts = (dateStr: string) => {
    try {
      const simToday = new Date('2026-12-09');
      const targetDate = new Date(dateStr);
      const diffTime = targetDate.getTime() - simToday.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 7) {
        const activeLocs = getActiveLocationsOnDate(dateStr);
        return activeLocs.filter(loc => getReservationsForSlot(dateStr, loc.id).length === 0);
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="calendar-view-container">
      
      {/* Calendar Grid Area */}
      <div className="lg:col-span-8 bg-white border border-[#E5E1D8] rounded-[32px] shadow-sm p-4 sm:p-6 flex flex-col">
        
        {/* Calendar Header with Navigation */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-[#F5F2EA] rounded-full text-[#8B5E3C] border border-[#E5E1D8]/60">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h2 key={`title-${currentYear}-${currentMonth}`} className="text-xl font-serif italic font-bold text-[#3C2A21]">
                {monthNames[currentMonth]} {currentYear}
              </h2>
              <p className="text-xs text-[#3C2A21]/60 font-medium">
                Cliquez sur un jour pour réserver ou gérer les auto-entrepreneurs
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-1 bg-[#F5F2EA] p-1 rounded-full">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-full hover:bg-white text-[#3C2A21] transition-all shadow-xs"
              title="Mois précédent"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => {
                const todayMonth = new Date().getMonth();
                setCurrentMonth(todayMonth);
                setCurrentYear(2026);
              }}
              className="px-2.5 py-1 text-xs font-bold text-[#8B5E3C] hover:bg-white rounded-full transition-all shadow-xs"
              title="Retour au mois en cours"
            >
              <span key={`nav-${currentYear}-${currentMonth}`}>{monthAbbrevs[currentMonth]} {currentYear}</span>
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-full hover:bg-white text-[#3C2A21] transition-all shadow-xs"
              title="Mois suivant"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Legend of Shops */}
        <div className="flex flex-wrap gap-3 mb-4 p-3 bg-[#F5F2EA]/40 rounded-xl border border-[#E5E1D8] text-xs">
          <span className="font-bold text-[#3C2A21]/80 flex items-center">Boutiques actives :</span>
          {locations.map((loc) => (
            <span
              key={loc.id}
              className={`px-2 py-0.5 rounded-lg border font-semibold ${getLocationBadgeStyle(loc.color)}`}
            >
              {loc.name} ({getLocDatesLabel(loc)})
            </span>
          ))}
        </div>

        {/* Calendar Grid Header (Days of week) */}
        <div className="grid grid-cols-7 gap-1 text-center font-bold text-[#8B5E3C]/80 text-[10px] uppercase tracking-widest mb-1 py-2 bg-[#F5F2EA]/50 rounded-lg">
          {daysOfWeek.map((day) => (
            <div key={day}>{day}</div>
          ))}
        </div>

        {/* Calendar Main Days Grid */}
        <div className="grid grid-cols-7 gap-1">
          {renderCalendarGrid()}
        </div>
      </div>

      {/* Reservation Sidebar / Actions Column */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Day details card */}
        <div className="bg-[#FDFCF8] border border-[#E5E1D8] rounded-[24px] shadow-sm p-4 sm:p-5" id="day-detail-panel">
          {selectedDateStr ? (
            <>
              <div className="border-b border-[#E5E1D8] pb-3 mb-4">
                <span className="text-[10px] uppercase tracking-widest font-bold text-[#8B5E3C]">
                  Journée sélectionnée
                </span>
                <h3 className="text-lg font-serif italic font-bold text-[#3C2A21] capitalize leading-tight mt-1">
                  {formatHumanDate(selectedDateStr)}
                </h3>
              </div>

              {/* J-7 vacancy alert banner */}
              {getJ7VacancyAlerts(selectedDateStr).length > 0 && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3 text-xs mb-4 flex items-start gap-2 animate-pulse shadow-3xs" id="j7-calendar-warning">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold block text-[10px] uppercase tracking-wider text-amber-700">
                      🚨 Alerte Vacance J-7 !
                    </span>
                    <span className="font-semibold leading-relaxed">
                      Aucun auto-entrepreneur n'est inscrit aujourd'hui pour :{" "}
                      {getJ7VacancyAlerts(selectedDateStr).map(loc => loc.name).join(', ')}.
                    </span>
                  </div>
                </div>
              )}

              {/* Status alerts */}
              {alertMessage && (
                <div className={`p-3 rounded-lg flex items-start gap-2 text-xs font-medium mb-4 animate-fade-in ${
                  alertMessage.type === 'success' 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {alertMessage.type === 'success' ? (
                    <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  )}
                  <span>{alertMessage.text}</span>
                </div>
              )}

              {/* Locations details and bookings status */}
              <div className="space-y-4">
                <h4 className="text-[10px] uppercase tracking-widest font-bold text-[#3C2A21]/60">
                  État des boutiques ce jour :
                </h4>
                
                {getActiveLocationsOnDate(selectedDateStr).length === 0 ? (
                  <div className="bg-white border border-[#E5E1D8] rounded-2xl p-6 text-center italic text-[#3C2A21]/70 text-xs shadow-xs">
                    Aucun point de vente n'est ouvert sur cette journée du calendrier.
                  </div>
                ) : (
                  getActiveLocationsOnDate(selectedDateStr).map((shop) => {
                    const resList = getReservationsForSlot(selectedDateStr, shop.id);
                    const isFull = resList.length >= settings.maxPartnersPerDay;
                    const canReserve = !isFull;
                    const alreadyMyBooking = resList.find(r => r.userId === currentUser.id);

                    return (
                      <div key={shop.id} className="bg-white border border-[#E5E1D8] rounded-2xl p-3 shadow-xs space-y-2">
                        <div className="flex justify-between items-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border uppercase tracking-wide ${getLocationBadgeStyle(shop.color)}`}>
                            {shop.name}
                          </span>
                          <span className="text-[11px] text-[#3C2A21]/60 font-semibold flex items-center gap-1">
                            <Users className="h-3.5 w-3.5 text-[#8B5E3C]" />
                            {resList.length} / {settings.maxPartnersPerDay} {resList.length > 1 ? 'places' : 'place'}
                          </span>
                        </div>

                        {/* List current reservations */}
                        {resList.length > 0 ? (
                          <div className="space-y-1.5 pt-1">
                            {resList.map((res) => {
                              const partnerColor = allUsers.find(u => u.id === res.userId)?.color || '#e5e7eb';
                              const isMe = res.userId === currentUser.id;
                              
                              return (
                                <div key={res.id} className="flex justify-between items-center text-xs p-2.5 rounded-xl bg-[#FAFAFA] border border-[#E5E1D8]">
                                  <div className="flex items-center space-x-2.5">
                                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold border border-white/60 shadow-xs" style={{ backgroundColor: partnerColor }}>
                                      {res.userName.charAt(0)}
                                    </div>
                                    <span className="font-extrabold text-[13px] text-[#3C2A21] flex items-center gap-1">
                                      {res.userName} {isMe && <span className="text-[10px] text-[#8B5E3C] font-extrabold bg-[#F5F2EA] px-1.5 py-0.5 rounded-full border border-[#E5E1D8]/60 ml-0.5">(Moi)</span>}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-[10px] text-[#8B5E3C] font-mono bg-[#F5F2EA] px-1.5 py-0.5 rounded-md border border-[#E5E1D8]/50">
                                      {res.hours}h ({res.hourlyRate}€/h)
                                    </span>
                                    
                                    {/* Action button: delete/cancel */}
                                    {(currentUser.role === 'ADMIN' || isMe) && (
                                      <div className="flex items-center gap-1">
                                        {showCancellationConfirm === res.id ? (
                                          <button
                                            onClick={() => handleCancelBooking(res.id)}
                                            className="text-white bg-red-600 hover:bg-red-700 px-2.5 py-1 rounded-full text-[10px] font-bold animate-pulse transition-all shadow-xs"
                                            title="Confirmer mon choix libre de retrait"
                                          >
                                            Confirmer le retrait libre
                                          </button>
                                        ) : (
                                          <button
                                            onClick={() => handleCancelBooking(res.id)}
                                            className="text-stone-400 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-all"
                                            title={currentUser.role === 'ADMIN' ? 'Retirer cette réservation' : 'Annuler ma réservation'}
                                          >
                                            <Trash2 className="h-3.5 w-3.5" />
                                          </button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-[11px] text-[#3C2A21]/60 italic py-2.5 text-center bg-[#F5F2EA]/20 border border-dashed border-[#E5E1D8] rounded-xl">
                            Aucune réservation enregistrée
                          </div>
                        )}

                        {/* Quick Reservation Actions for this location */}
                        {currentUser.role === 'PARTNER' && (
                          <div className="pt-2">
                            {alreadyMyBooking ? (
                              <div className="bg-emerald-50 text-emerald-800 p-2 rounded-xl text-[11px] font-semibold border border-emerald-200 text-center">
                                Vous êtes déjà positionnée sur cette boutique.
                              </div>
                            ) : canReserve ? (
                              <div className="space-y-1">
                                <button
                                  onClick={() => {
                                    setBookingLocationId(shop.id);
                                    handleBookSlot(shop.id, currentUser.id);
                                  }}
                                  className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 bg-[#8B5E3C] hover:bg-[#8B5E3C]/90 text-white text-xs font-bold rounded-full shadow-md transition-all"
                                >
                                  <UserPlus className="h-4 w-4" />
                                  Se positionner pour la journée ({customHours * customRate}€)
                                </button>
                                <p className="text-[9px] text-[#3C2A21]/60 italic text-center leading-normal">
                                  En tant que micro-entrepreneur partenaire, votre proposition de service est volontaire et libre de tout lien hiérarchique.
                                </p>
                              </div>
                            ) : (
                              <div className="bg-red-50 text-red-800 p-2 rounded-xl text-[11px] font-semibold border border-red-200 text-center flex items-center justify-center gap-1">
                                <Lock className="h-3 w-3 shrink-0" />
                                Boutique déjà complète pour cette journée.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}

                {/* Gérante admin reservation builder form */}
                {currentUser.role === 'ADMIN' && getActiveLocationsOnDate(selectedDateStr).length > 0 && (
                  <div className="bg-[#F5F2EA]/60 border border-[#E5E1D8] rounded-2xl p-4 mt-4 shadow-xs space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#3C2A21]/75">
                      <UserPlus className="h-4 w-4 text-[#8B5E3C]" />
                      <span>Ajouter une réservation (Admin)</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      {/* Select Shop */}
                      <div>
                        <label className="block text-[#3C2A21]/80 font-bold mb-1 text-[10px] uppercase tracking-wider">Point de vente :</label>
                        <select
                          value={bookingLocationId}
                          onChange={(e) => setBookingLocationId(e.target.value)}
                          className="w-full bg-white border border-[#E5E1D8] rounded-xl p-2.5 font-medium focus:outline-none focus:ring-1 focus:ring-[#8B5E3C]"
                        >
                          {getActiveLocationsOnDate(selectedDateStr).map(shop => (
                            <option key={shop.id} value={shop.id}>{shop.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Select Partner */}
                      <div>
                        <label className="block text-[#3C2A21]/80 font-bold mb-1 text-[10px] uppercase tracking-wider">Auto-entrepreneur partenaire :</label>
                        <select
                          value={bookingPartnerId}
                          onChange={(e) => setBookingPartnerId(e.target.value)}
                          className="w-full bg-white border border-[#E5E1D8] rounded-xl p-2.5 font-medium focus:outline-none focus:ring-1 focus:ring-[#8B5E3C]"
                        >
                          {allUsers.filter(u => u.role === 'PARTNER').map(partner => (
                            <option key={partner.id} value={partner.id}>{partner.name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Config Hours and Rate */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[#3C2A21]/80 font-bold mb-1 text-[10px] uppercase tracking-wider">Heures :</label>
                          <input
                            type="number"
                            value={customHours}
                            onChange={(e) => setCustomHours(Number(e.target.value))}
                            className="w-full bg-white border border-[#E5E1D8] rounded-xl p-2.5 text-center font-mono focus:outline-none focus:ring-1 focus:ring-[#8B5E3C]"
                            min="1"
                            max="24"
                          />
                        </div>
                        <div>
                          <label className="block text-[#3C2A21]/80 font-bold mb-1 text-[10px] uppercase tracking-wider">Tarif (€/h) :</label>
                          <input
                            type="number"
                            value={customRate}
                            onChange={(e) => setCustomRate(Number(e.target.value))}
                            className="w-full bg-white border border-[#E5E1D8] rounded-xl p-2.5 text-center font-mono focus:outline-none focus:ring-1 focus:ring-[#8B5E3C]"
                            min="1"
                          />
                        </div>
                      </div>

                      <button
                        onClick={() => handleBookSlot(bookingLocationId, bookingPartnerId)}
                        className="w-full py-2.5 bg-[#8B5E3C] hover:bg-[#8B5E3C]/90 text-white font-bold rounded-full shadow-md transition-all mt-2"
                      >
                        Valider la réservation
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-stone-500 italic text-xs space-y-2">
              <Info className="h-8 w-8 mx-auto text-stone-400 stroke-1" />
              <p>Sélectionnez une journée sur le calendrier pour effectuer ou modifier une prestation.</p>
            </div>
          )}
        </div>

        {/* Informative quick stats sidebar widget */}
        <div className="bg-[#FDFCF8] border border-[#E5E1D8] rounded-[24px] p-4 text-xs space-y-2 shadow-sm">
          <h4 className="font-bold text-[#8B5E3C] uppercase tracking-widest flex items-center gap-1 font-serif italic text-sm">
            <Info className="h-4 w-4" />
            Règles d'affaires Louvat
          </h4>
          <ul className="list-disc pl-4 space-y-1.5 text-[#3C2A21]/80 leading-relaxed font-medium">
            <li><strong>Partenariat Indépendant (B2B)</strong> : Les auto-entrepreneurs sont des micro-entrepreneurs partenaires, autonomes et libres de planifier leurs prestations.</li>
            <li>Une journée de service est valorisée à <strong>{settings.defaultHoursPerDay} heures</strong> à <strong>{settings.defaultHourlyRate} €/h</strong>, soit une facturation de <strong>{settings.defaultHoursPerDay * settings.defaultHourlyRate} €</strong>.</li>
            <li>Pour des <strong>raisons d'organisation logistique mutuelle</strong> (fabrication de biscuits frais, approvisionnement), nous sollicitons un délai de prévenance de <strong>{settings.cancellationDeadlineDays} jours</strong> pour tout retrait de créneau, favorisant un partenariat fluide et de confiance.</li>
          </ul>
        </div>

      </div>
    </div>
  );
};
