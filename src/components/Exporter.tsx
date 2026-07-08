/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { User, Location, Reservation, AppSettings } from '../types';
import { Download, Calendar, FileText, Check, Award, Printer, Cookie } from 'lucide-react';

interface ExporterProps {
  allUsers: User[];
  locations: Location[];
  reservations: Reservation[];
  settings: AppSettings;
}

export const Exporter: React.FC<ExporterProps> = ({
  allUsers,
  locations,
  reservations,
  settings,
}) => {
  const [filterMonth, setFilterMonth] = useState<string>('12'); // Dec by default
  const [filterYear, setFilterYear] = useState<string>('2026');
  const [filterPartnerId, setFilterPartnerId] = useState<string>('ALL');
  const [filterLocationId, setFilterLocationId] = useState<string>('ALL');
  
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [showPrintPreview, setShowPrintPreview] = useState<boolean>(false);

  const partners = allUsers.filter(u => u.role === 'PARTNER');

  // Filter reservations based on selected period and entities
  const getFilteredReservations = () => {
    return reservations.filter((res) => {
      const resDate = new Date(res.date);
      const resMonth = String(resDate.getMonth() + 1);
      const resYear = String(resDate.getFullYear());

      const matchesMonth = filterMonth === 'ALL' || resMonth === filterMonth;
      const matchesYear = resYear === filterYear;
      const matchesPartner = filterPartnerId === 'ALL' || res.userId === filterPartnerId;
      const matchesLocation = filterLocationId === 'ALL' || res.locationId === filterLocationId;

      return matchesMonth && matchesYear && matchesPartner && matchesLocation;
    }).sort((a, b) => a.date.localeCompare(b.date));
  };

  const filteredRes = getFilteredReservations();

  // Computations
  const totalHours = filteredRes.reduce((sum, r) => sum + r.hours, 0);
  const totalAmount = filteredRes.reduce((sum, r) => sum + (r.hours * r.hourlyRate), 0);

  // CSV Generator & Downloader
  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,\uFEFF'; // UTF-8 BOM for Excel French accents
    csvContent += 'Date,Auto-entrepreneur,Boutique,Heures,Tarif Horaire,Montant Total (€)\n';

    filteredRes.forEach((res) => {
      const locName = locations.find(l => l.id === res.locationId)?.name || 'Boutique';
      csvContent += `"${res.date}","${res.userName}","${locName}",${res.hours},${res.hourlyRate},${res.hours * res.hourlyRate}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `prestations_louvat_${filterMonth}_${filterYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    triggerFeedback('CSV');
  };

  // Excel HTML table spreadsheet exporter
  const handleExportExcel = () => {
    const tableHeader = '<tr><th>Date</th><th>Auto-entrepreneur</th><th>Point de Vente</th><th>Heures</th><th>Tarif Horaire (€)</th><th>Total Brut (€)</th></tr>';
    let tableRows = '';
    
    filteredRes.forEach((res) => {
      const locName = locations.find(l => l.id === res.locationId)?.name || 'Boutique';
      tableRows += `<tr>
        <td>${res.date}</td>
        <td>${res.userName}</td>
        <td>${locName}</td>
        <td style="text-align:center;">${res.hours}</td>
        <td style="text-align:right;">${res.hourlyRate}</td>
        <td style="text-align:right;">${res.hours * res.hourlyRate}</td>
      </tr>`;
    });

    const excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
        <!--[if gte o mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Prestations</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
      </head>
      <body>
        <h2>Biscuiterie Louvat - Prestations Commerciales</h2>
        <table border="1">
          ${tableHeader}
          ${tableRows}
          <tr style="font-weight:bold; background-color:#f4f4f5;">
            <td colspan="3">Cumul global</td>
            <td style="text-align:center;">${totalHours} h</td>
            <td>-</td>
            <td style="text-align:right;">${totalAmount} €</td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `facturation_louvat_${filterMonth}_${filterYear}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    triggerFeedback('Excel');
  };

  const triggerFeedback = (format: string) => {
    setExportSuccess(`Fichier ${format} généré et téléchargé avec succès !`);
    setTimeout(() => setExportSuccess(null), 3000);
  };

  return (
    <div className="bg-white border border-[#E5E1D8] rounded-[32px] shadow-sm p-4 sm:p-6 space-y-6" id="exporter-container">
      
      {/* Exporter Header */}
      <div className="border-b border-[#E5E1D8] pb-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-serif italic font-bold text-[#8B5E3C]">
            Exportation de Données Comptables
          </h2>
          <p className="text-xs text-[#3C2A21]/60 font-medium">
            Exportez les relevés de prestations, cumuls d'heures et montants facturables des auto-entrepreneurs.
          </p>
        </div>
      </div>

      {exportSuccess && (
        <div className="p-3 bg-[#EAF0DE] text-[#7B8A56] border border-[#D4DEC3] rounded-xl text-xs font-bold flex items-center gap-2">
          <Check className="h-4 w-4" />
          <span>{exportSuccess}</span>
        </div>
      )}

      {/* Filter panel */}
      <div className="bg-[#F5F2EA]/40 border border-[#E5E1D8] rounded-[24px] p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
        {/* Month Selector */}
        <div className="space-y-1">
          <label className="block font-bold text-[#3C2A21]/80 text-[10px] uppercase tracking-wider">Mois :</label>
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="w-full bg-white border border-[#E5E1D8] rounded-xl p-2.5 font-semibold cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#8B5E3C] shadow-xs"
          >
            <option value="ALL">Tous les mois</option>
            <option value="9">Septembre</option>
            <option value="10">Octobre</option>
            <option value="11">Novembre</option>
            <option value="12">Décembre</option>
          </select>
        </div>

        {/* Year Selector */}
        <div className="space-y-1">
          <label className="block font-bold text-[#3C2A21]/80 text-[10px] uppercase tracking-wider">Année :</label>
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="w-full bg-white border border-[#E5E1D8] rounded-xl p-2.5 font-semibold cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#8B5E3C] shadow-xs"
          >
            <option value="2026">2026</option>
          </select>
        </div>

        {/* Partner Filter */}
        <div className="space-y-1">
          <label className="block font-bold text-[#3C2A21]/80 text-[10px] uppercase tracking-wider">Auto-entrepreneur :</label>
          <select
            value={filterPartnerId}
            onChange={(e) => setFilterPartnerId(e.target.value)}
            className="w-full bg-white border border-[#E5E1D8] rounded-xl p-2.5 font-semibold cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#8B5E3C] shadow-xs"
          >
            <option value="ALL">Tous les auto-entrepreneurs</option>
            {partners.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Location Filter */}
        <div className="space-y-1">
          <label className="block font-bold text-[#3C2A21]/80 text-[10px] uppercase tracking-wider">Point de vente :</label>
          <select
            value={filterLocationId}
            onChange={(e) => setFilterLocationId(e.target.value)}
            className="w-full bg-white border border-[#E5E1D8] rounded-xl p-2.5 font-semibold cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#8B5E3C] shadow-xs"
          >
            <option value="ALL">Toutes les boutiques</option>
            {locations.map(loc => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Overview stats of selection */}
      <div className="border border-[#E5E1D8] rounded-2xl p-4 bg-[#F5F2EA]/50 grid grid-cols-3 gap-4 text-center shadow-xs">
        <div>
          <span className="text-[10px] uppercase font-bold text-[#3C2A21]/50">Prestations</span>
          <p className="text-xl font-serif font-bold text-[#3C2A21]">{filteredRes.length}</p>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-[#3C2A21]/50">Total Heures</span>
          <p className="text-xl font-serif font-bold text-[#3C2A21]">{totalHours} h</p>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-[#3C2A21]/50">Montant Cumulé</span>
          <p className="text-xl font-serif font-bold text-[#8B5E3C]">{totalAmount.toLocaleString('fr-FR')} €</p>
        </div>
      </div>

      {/* Export Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-end text-xs">
        
        {/* CSV export */}
        <button
          onClick={handleExportCSV}
          disabled={filteredRes.length === 0}
          className="flex items-center justify-center gap-2 px-5 py-2.5 border border-[#E5E1D8] hover:bg-[#F5F2EA]/40 rounded-full text-[#3C2A21] font-bold text-xs shadow-xs disabled:opacity-50 transition-all cursor-pointer bg-white"
        >
          <Download className="h-4 w-4 text-stone-500" />
          Exporter au format CSV
        </button>

        {/* Excel export */}
        <button
          onClick={handleExportExcel}
          disabled={filteredRes.length === 0}
          className="flex items-center justify-center gap-2 px-5 py-2.5 border border-[#E5E1D8] hover:bg-[#F5F2EA]/40 rounded-full text-[#3C2A21] font-bold text-xs shadow-xs disabled:opacity-50 transition-all cursor-pointer bg-white"
        >
          <FileText className="h-4 w-4 text-green-700" />
          Exporter sous Excel (.xls)
        </button>

        {/* PDF statement preview toggle */}
        <button
          onClick={() => setShowPrintPreview(!showPrintPreview)}
          disabled={filteredRes.length === 0}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#8B5E3C] hover:bg-[#8B5E3C]/90 text-white font-bold rounded-full text-xs shadow-md disabled:opacity-50 transition-all cursor-pointer"
        >
          <Printer className="h-4 w-4" />
          Générer le PDF / Relevé de Prestations
        </button>
      </div>

      {/* Beautiful formatted printable statement (PDF Simulation) */}
      {showPrintPreview && filteredRes.length > 0 && (
        <div className="border-t-2 border-dashed border-[#E5E1D8] pt-6 animate-fade-in" id="pdf-recap-statement">
          <div className="bg-white border border-[#E5E1D8] shadow-xl p-6 sm:p-8 max-w-3xl mx-auto space-y-6 text-[#3C2A21] rounded-[24px]">
            
            {/* Louvat Header Document */}
            <div className="flex justify-between items-start pb-4 border-b border-[#E5E1D8]">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-[#3C2A21] font-serif font-bold text-lg">
                  <Cookie className="h-5 w-5 text-[#8B5E3C]" />
                  <span>Biscuiterie Louvat</span>
                </div>
                <p className="text-[10px] text-stone-500 leading-normal font-semibold">
                  Artisans depuis 1954 • Saint-Geoire-en-Valdaine • Isère, France
                </p>
              </div>

              <div className="text-right text-xs">
                <span className="text-[9px] uppercase tracking-wider font-bold bg-[#8B5E3C] text-white px-2.5 py-1 rounded-full">
                  Relevé Officiel
                </span>
                <p className="text-[10px] text-stone-500 font-mono mt-1.5">Ref: {filterYear}-{filterMonth || 'ALL'}</p>
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center py-3 bg-[#F5F2EA]/50 rounded-2xl border border-[#E5E1D8]">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#3C2A21]">
                État Récapitulatif des Prestations Commerciales
              </h3>
              <p className="text-[11px] text-[#3C2A21]/70 font-semibold">
                Période : {filterMonth === 'ALL' ? 'Annuelle' : `Mois de ${filterMonth}/2026`}
              </p>
            </div>

            {/* Entity details */}
            <div className="grid grid-cols-2 gap-4 text-[11px] border-b border-[#E5E1D8] pb-4">
              <div>
                <span className="font-bold text-stone-400 uppercase tracking-wide block text-[9px]">Émetteur</span>
                <span className="font-bold text-[#3C2A21] text-xs">Biscuiterie Louvat SAS</span>
                <p className="text-stone-500 font-semibold">Magasin d'usine : Saint-Geoire-en-Valdaine</p>
                <p className="text-stone-500 font-semibold">Boutique de Voiron</p>
              </div>
              <div>
                <span className="font-bold text-stone-400 uppercase tracking-wide block text-[9px]">Destinataires</span>
                <span className="font-bold text-[#3C2A21] text-xs">
                  {filterPartnerId === 'ALL' ? 'Tous les auto-entrepreneurs' : allUsers.find(u => u.id === filterPartnerId)?.name}
                </span>
                <p className="text-stone-500 font-semibold">Régime fiscal : Auto-entrepreneur micro-fiscal</p>
              </div>
            </div>

            {/* Table of prestations */}
            <table className="w-full text-left text-[11px] border-collapse">
              <thead>
                <tr className="border-b-2 border-[#E5E1D8] text-[#3C2A21]/70 font-bold text-[10px] uppercase tracking-widest pb-2">
                  <th className="py-2">Date</th>
                  <th className="py-2">Prestataire</th>
                  <th className="py-2">Lieu / Boutique</th>
                  <th className="py-2 text-center">Volume horaire</th>
                  <th className="py-2 text-right">Tarif horaire</th>
                  <th className="py-2 text-right">Prestation due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium text-stone-600">
                {filteredRes.map((res) => {
                  const shopName = locations.find(l => l.id === res.locationId)?.name || 'Boutique';
                  return (
                    <tr key={res.id} className="py-1">
                      <td className="py-2 font-mono font-bold text-[#3C2A21]">{res.date}</td>
                      <td className="py-2 font-bold text-[#3C2A21]">{res.userName}</td>
                      <td className="py-2">{shopName}</td>
                      <td className="py-2 text-center">{res.hours} h</td>
                      <td className="py-2 text-right font-mono">{res.hourlyRate} €/h</td>
                      <td className="py-2 text-right font-bold font-mono text-[#3C2A21]">{(res.hours * res.hourlyRate)} €</td>
                    </tr>
                  );
                })}
                {/* Total Line */}
                <tr className="border-t-2 border-[#E5E1D8] font-bold bg-[#F5F2EA]/40">
                  <td colSpan="3" className="py-3 text-[#3C2A21] font-bold">CUMUL GÉNÉRAL RELEVÉ</td>
                  <td className="py-3 text-center text-[#3C2A21]">{totalHours} h</td>
                  <td className="py-3">-</td>
                  <td className="py-3 text-right font-serif text-[#8B5E3C] font-bold text-xs">{totalAmount.toLocaleString('fr-FR')} €</td>
                </tr>
              </tbody>
            </table>

            {/* Footer with signatures block */}
            <div className="grid grid-cols-2 gap-4 text-[10px] pt-4 border-t border-[#E5E1D8]">
              <div>
                <p className="italic text-stone-500 font-medium">Document généré automatiquement à des fins de facturation.</p>
                <p className="text-stone-500 mt-1 font-semibold">Date d'édition : {new Date('2026-07-06').toLocaleDateString('fr-FR')}</p>
              </div>
              <div className="text-right space-y-6">
                <span className="font-bold text-[#3C2A21]/80 block">Pour la Biscuiterie Louvat (Gérante) :</span>
                <span className="font-mono text-stone-400 block italic font-semibold">Signature et bon pour accord</span>
              </div>
            </div>

            {/* Browser print action button */}
            <div className="flex justify-end pt-4 border-t border-[#E5E1D8] no-print">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 bg-[#8B5E3C] hover:bg-[#8B5E3C]/90 text-white text-[11px] font-bold px-4 py-2 rounded-full shadow-md transition-all"
              >
                <Printer className="h-3.5 w-3.5" />
                Lancer l'impression Papier / PDF
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
