import React, { useState } from 'react';
import { Payment, UserProfile, SchoolConfig } from '../types';
import { storage } from '../services/storage';
import { formatFCFA, formatDateTimeFR } from '../utils/formatters';
import { ReceiptModal } from './ReceiptModal';
import {
  Receipt,
  FileSpreadsheet,
  Printer,
  AlertTriangle,
  Ban,
  CheckCircle2,
  Calendar,
  Filter,
  DollarSign,
  Smartphone,
  Banknote,
  Search,
  Lock
} from 'lucide-react';

interface CashJournalProps {
  currentUser: UserProfile;
  school: SchoolConfig;
}

export const CashJournal: React.FC<CashJournalProps> = ({ currentUser, school }) => {
  const [payments, setPayments] = useState<Payment[]>(storage.getPayments());
  const [selectedReceipt, setSelectedReceipt] = useState<Payment | null>(null);
  const [filterMethod, setFilterMethod] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Annulation de reçu
  const [cancellingPayment, setCancellingPayment] = useState<Payment | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');

  // Clôture journalière (Z-Report)
  const [showZReport, setShowZReport] = useState<boolean>(false);

  const canCancel = ['founder', 'director', 'accountant'].includes(currentUser.role);

  // Filtrage
  const filteredPayments = payments.filter((p) => {
    const matchesMethod = filterMethod === 'ALL' || p.payment_method === filterMethod;
    const matchesSearch =
      p.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.receipt_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.student_number.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesMethod && matchesSearch;
  });

  // Calculs statistiques
  const validPayments = payments.filter((p) => !p.is_cancelled);
  const totalAmount = validPayments.reduce((sum, p) => sum + p.amount_fcfa, 0);
  const cashAmount = validPayments
    .filter((p) => p.payment_method === 'CASH')
    .reduce((sum, p) => sum + p.amount_fcfa, 0);
  const orangeAmount = validPayments
    .filter((p) => p.payment_method === 'ORANGE_MONEY')
    .reduce((sum, p) => sum + p.amount_fcfa, 0);
  const moovAmount = validPayments
    .filter((p) => p.payment_method === 'MOOV_MONEY')
    .reduce((sum, p) => sum + p.amount_fcfa, 0);
  const bankAmount = validPayments
    .filter((p) => p.payment_method === 'BANK_TRANSFER')
    .reduce((sum, p) => sum + p.amount_fcfa, 0);

  const handleCancelSubmit = () => {
    if (!cancellingPayment || !cancelReason.trim()) {
      alert('Veuillez renseigner un motif pour l\'annulation.');
      return;
    }

    const success = storage.cancelPayment(
      cancellingPayment.id,
      cancelReason.trim(),
      currentUser.name
    );

    if (success) {
      setPayments(storage.getPayments());
      setCancellingPayment(null);
      setCancelReason('');
    } else {
      alert('Impossible d\'annuler ce reçu.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-6">
      {/* En-tête et actions de clôture */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-emerald-600" />
            Journal de Caisse & Clôtures
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            Traçabilité intégrale des écritures, réimpression de duplicata et clôture de journée.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Bouton Clôture Journalière */}
          <button
            onClick={() => setShowZReport(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-gray-900 text-white hover:bg-gray-800 shadow-sm transition-all"
          >
            <Lock className="w-4 h-4 text-amber-400" />
            <span>Clôture Journalière (Ticket Z)</span>
          </button>
        </div>
      </div>

      {/* Cartes métriques de caisse */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Total Recettes</span>
            <Banknote className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg sm:text-xl font-black text-gray-900 mt-2">
            {formatFCFA(totalAmount)}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">{validPayments.length} versements validés</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Espèces en Caisse</span>
            <Banknote className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg sm:text-xl font-black text-emerald-700 mt-2">
            {formatFCFA(cashAmount)}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">Coffre-fort / Tiroir</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Orange Money</span>
            <Smartphone className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-lg sm:text-xl font-black text-orange-700 mt-2">
            {formatFCFA(orangeAmount)}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">Compte marchand OM</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase">Moov & Banques</span>
            <Smartphone className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-lg sm:text-xl font-black text-blue-800 mt-2">
            {formatFCFA(moovAmount + bankAmount)}
          </div>
          <div className="text-[11px] text-gray-500 mt-1">Moov: {formatFCFA(moovAmount)}</div>
        </div>
      </div>

      {/* Barre de filtres et recherche */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="N° reçu, élève, matricule..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <Filter className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          <span className="text-xs text-gray-500 shrink-0">Mode :</span>
          {['ALL', 'CASH', 'ORANGE_MONEY', 'MOOV_MONEY'].map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMethod(mode)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filterMethod === mode
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {mode === 'ALL' ? 'Tous' : mode.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Tableau du journal */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Reçu N°</th>
                <th className="py-3 px-4">Date & Heure</th>
                <th className="py-3 px-4">Élève & Classe</th>
                <th className="py-3 px-4">Catégorie</th>
                <th className="py-3 px-4">Mode & Réf</th>
                <th className="py-3 px-4 text-right">Montant FCFA</th>
                <th className="py-3 px-4 text-center">Statut</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredPayments.length > 0 ? (
                filteredPayments.map((p) => (
                  <tr
                    key={p.id}
                    className={`hover:bg-gray-50/80 transition-colors ${
                      p.is_cancelled ? 'bg-red-50/40 text-gray-400' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-gray-900">
                      {p.receipt_number}
                    </td>
                    <td className="py-3 px-4 text-gray-600">
                      {formatDateTimeFR(p.created_at)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-gray-900">{p.student_name}</div>
                      <div className="text-[11px] text-gray-500">
                        {p.class_name} • {p.student_number}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-gray-100 font-semibold text-gray-700">
                        {p.fee_category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-gray-800">
                        {p.payment_method.replace('_', ' ')}
                      </div>
                      {p.transaction_ref && (
                        <div className="text-[10px] text-gray-400 font-mono">
                          {p.transaction_ref}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-sm text-gray-900">
                      {formatFCFA(p.amount_fcfa)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {p.is_cancelled ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                          <Ban className="w-3 h-3" />
                          Annulé
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          Encaissé
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedReceipt(p)}
                          className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700"
                          title="Voir / Imprimer le reçu thermique 80mm"
                        >
                          <Printer className="w-4 h-4 text-emerald-600" />
                        </button>

                        {!p.is_cancelled && canCancel && (
                          <button
                            onClick={() => setCancellingPayment(p)}
                            className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600"
                            title="Annuler ce reçu (traçabilité comptable)"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400 text-xs">
                    Aucune écriture trouvée pour ces critères.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal d'Annulation de Reçu */}
      {cancellingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>Annulation du Reçu {cancellingPayment.receipt_number}</span>
            </div>

            <p className="text-xs text-gray-600">
              Attention : L'annulation déduira immédiatement {formatFCFA(cancellingPayment.amount_fcfa)} du compte de l'élève {cancellingPayment.student_name}. Cette opération sera consignée dans le journal d'audit.
            </p>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Motif obligatoire de l'annulation
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ex: Erreur de saisie de montant, chèque rejeté, versement en double..."
                rows={3}
                className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCancellingPayment(null)}
                className="px-3 py-2 text-xs font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl"
              >
                Retour
              </button>
              <button
                onClick={handleCancelSubmit}
                className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs"
              >
                Confirmer l'annulation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Clôture Journalière (Ticket Z) */}
      {showZReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-5 space-y-4 font-mono text-xs">
            <div className="text-center border-b pb-2">
              <h3 className="font-black text-sm uppercase">{school.name}</h3>
              <p className="text-[10px] text-gray-500">CLÔTURE JOURNALIÈRE DE CAISSE (TICKET Z)</p>
              <p className="text-[10px] text-gray-500">{new Date().toLocaleDateString('fr-FR')}</p>
            </div>

            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span>Nombre d'encaissements:</span>
                <span className="font-bold">{validPayments.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Espèces (Cash):</span>
                <span>{formatFCFA(cashAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Orange Money:</span>
                <span>{formatFCFA(orangeAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Moov Money:</span>
                <span>{formatFCFA(moovAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Virements bancaires:</span>
                <span>{formatFCFA(bankAmount)}</span>
              </div>
              <div className="flex justify-between border-t border-b py-1 font-bold text-gray-900 text-xs">
                <span>TOTAL JOURNÉE:</span>
                <span>{formatFCFA(totalAmount)}</span>
              </div>
            </div>

            <div className="text-[10px] text-gray-500 space-y-1">
              <p>Clôturé par : {currentUser.name} ({currentUser.role})</p>
              <p>Signature caissier(e) : ...........................</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-emerald-600 text-white rounded-xl font-sans font-bold text-xs"
              >
                Imprimer Ticket Z
              </button>
              <button
                onClick={() => setShowZReport(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-sans text-xs"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reçu de Paiement */}
      {selectedReceipt && (
        <ReceiptModal
          payment={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
          onReprint={() => setPayments(storage.getPayments())}
        />
      )}
    </div>
  );
};
