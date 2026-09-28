import React, { useState } from 'react';
import { Student, Payment, PaymentMethod, SchoolConfig, UserProfile } from '../types';
import { storage } from '../services/storage';
import { formatFCFA } from '../utils/formatters';
import { numberToWordsFcfa } from '../utils/numberToWords';
import { ReceiptModal } from './ReceiptModal';
import {
  Search,
  Wallet,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Banknote,
  Smartphone,
  Building2,
  Printer,
  ChevronRight,
  User,
  ArrowRight
} from 'lucide-react';

interface CashDeskProps {
  currentUser: UserProfile;
  school: SchoolConfig;
}

export const CashDesk: React.FC<CashDeskProps> = ({ currentUser, school }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Formulaire d'encaissement
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [feeCategory, setFeeCategory] = useState<Payment['fee_category']>('SCOLARITE');
  const [periodLabel, setPeriodLabel] = useState<string>('Tranche 1');

  // Reçu généré pour le modal
  const [currentReceipt, setCurrentReceipt] = useState<Payment | null>(null);

  const students = storage.getStudents();
  const classes = storage.getClasses();

  // Filtrage des élèves pour recherche rapide
  const filteredStudents = searchTerm.trim()
    ? students.filter(
        (s) =>
          `${s.last_name} ${s.first_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
          s.student_number.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const handleSelectStudent = (st: Student) => {
    setSelectedStudent(st);
    setSearchTerm('');
    // Proposer par défaut le reste dû si inférieur ou égal à 50 000, ou une tranche de 25 000
    const remaining = (st.total_fees - st.discount) - st.paid_amount;
    if (remaining > 0) {
      setAmount(Math.min(remaining, 50000));
    } else {
      setAmount(0);
    }
  };

  const getStudentClass = (classId: string) => {
    return classes.find((c) => c.id === classId)?.name || 'Classe inconnue';
  };

  const remainingBalance = selectedStudent
    ? (selectedStudent.total_fees - selectedStudent.discount) - selectedStudent.paid_amount
    : 0;

  const handleConfirmPayment = () => {
    if (!selectedStudent || amount <= 0) {
      alert('Veuillez sélectionner un élève et un montant valide supérieur à 0 FCFA.');
      return;
    }

    const currentCounter = school.receipt_counter + 1;
    const paddedCounter = String(currentCounter).padStart(5, '0');
    const receiptNumber = `REC-${school.academic_year.slice(0, 4)}-${school.cash_prefix}-${paddedCounter}`;

    const newPayment: Payment = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      school_id: school.id,
      academic_year_id: school.academic_year,
      student_id: selectedStudent.id,
      student_name: `${selectedStudent.last_name} ${selectedStudent.first_name}`,
      student_number: selectedStudent.student_number,
      class_id: selectedStudent.class_id,
      class_name: getStudentClass(selectedStudent.class_id),
      receipt_number: receiptNumber,
      amount_fcfa: Math.floor(amount),
      amount_in_words: numberToWordsFcfa(amount),
      payment_method: paymentMethod,
      transaction_ref: transactionRef.trim() || undefined,
      fee_category: feeCategory,
      period_label: periodLabel,
      total_paid_after: selectedStudent.paid_amount + amount,
      remaining_balance_after: Math.max(0, remainingBalance - amount),
      cashier_id: currentUser.id,
      cashier_name: currentUser.name,
      is_cancelled: false,
      print_count: 1,
      created_at: new Date().toISOString(),
    };

    // Sauvegarde atomique locale
    storage.addPayment(newPayment);

    // Mettre à jour l'élève sélectionné
    const updated = storage.getStudentById(selectedStudent.id);
    if (updated) setSelectedStudent(updated);

    // Ouvrir le ticket de reçu
    setCurrentReceipt(newPayment);

    // Réinitialiser les champs de saisie
    setAmount(0);
    setTransactionRef('');
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4">
      {/* En-tête de section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wallet className="w-6 h-6 text-emerald-600" />
            Guichet d'Encaissement Rapide
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            Saisie des versements de scolarité, émission et impression instantanée des reçus 80 mm.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 text-xs font-semibold text-emerald-800">
          <Banknote className="w-4 h-4 text-emerald-600" />
          <span>Devise : FCFA (sans décimales)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Colonne Gauche : Recherche & Sélection Élève */}
        <div className="lg:col-span-5 space-y-4">
          {/* Barre de recherche */}
          <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-200">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              1. Rechercher l'élève (Nom ou Matricule)
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ex: Ouédraogo, Sawadogo, GSWP-25-..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:outline-hidden transition-all"
              />
            </div>

            {/* Liste de suggestions */}
            {filteredStudents.length > 0 && (
              <div className="mt-2 divide-y divide-gray-100 max-h-56 overflow-y-auto border border-gray-200 rounded-xl bg-white shadow-lg">
                {filteredStudents.map((st) => (
                  <button
                    key={st.id}
                    onClick={() => handleSelectStudent(st)}
                    className="w-full text-left p-2.5 hover:bg-emerald-50 text-xs flex items-center justify-between transition-colors"
                  >
                    <div>
                      <div className="font-bold text-gray-900">
                        {st.last_name} {st.first_name}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        {st.student_number} • {getStudentClass(st.class_id)}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Fiche État Financier de l'élève sélectionné */}
          {selectedStudent ? (
            <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-200 space-y-4 animate-in fade-in">
              <div className="flex items-start justify-between border-b border-gray-100 pb-3">
                <div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {selectedStudent.cycle === 'kindergarten' ? 'Maternelle' : 'Primaire'}
                  </span>
                  <h3 className="text-base font-bold text-gray-900 mt-1">
                    {selectedStudent.last_name} {selectedStudent.first_name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Matricule: {selectedStudent.student_number} • Classe: {getStudentClass(selectedStudent.class_id)}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-sm">
                  {selectedStudent.last_name.slice(0, 1)}
                </div>
              </div>

              {/* Cadre situation des paiements */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  <div className="text-gray-500 text-[10px] uppercase font-semibold">Total Frais Dû</div>
                  <div className="font-bold text-gray-900 mt-0.5">
                    {formatFCFA(selectedStudent.total_fees - selectedStudent.discount)}
                  </div>
                </div>

                <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
                  <div className="text-emerald-700 text-[10px] uppercase font-semibold">Déjà Encaissé</div>
                  <div className="font-bold text-emerald-800 mt-0.5">
                    {formatFCFA(selectedStudent.paid_amount)}
                  </div>
                </div>
              </div>

              {/* Reste à recouvrer */}
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-amber-900">Reste à payer</div>
                  <div className="text-lg font-black text-amber-900">
                    {formatFCFA(remainingBalance)}
                  </div>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                    remainingBalance === 0
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-200 text-amber-900'
                  }`}
                >
                  {remainingBalance === 0 ? 'En règle' : 'Solde débiteur'}
                </span>
              </div>

              {/* Coordonnées parent */}
              <div className="text-xs text-gray-600 pt-1 border-t border-gray-100 space-y-1">
                <div className="flex justify-between">
                  <span>Parent / Tuteur :</span>
                  <span className="font-medium text-gray-900">{selectedStudent.parent_name}</span>
                </div>
                <div className="flex justify-between">
                  <span>WhatsApp :</span>
                  <span className="font-mono text-emerald-700 font-bold">
                    {selectedStudent.parent_phone}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 bg-gray-50 border border-dashed border-gray-200 rounded-2xl text-center text-gray-400 space-y-2">
              <User className="w-8 h-8 mx-auto text-gray-300" />
              <p className="text-xs font-medium">
                Veuillez chercher et sélectionner un élève pour engager un encaissement.
              </p>
            </div>
          )}
        </div>

        {/* Colonne Droite : Formulaire d'Encaissement */}
        <div className="lg:col-span-7">
          <div className="bg-white p-5 rounded-2xl shadow-xs border border-gray-200 space-y-5">
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider border-b border-gray-100 pb-2">
              2. Paramètres du Versement
            </h3>

            {/* Catégorie & Période */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Motif des frais</label>
                <select
                  value={feeCategory}
                  onChange={(e) => setFeeCategory(e.target.value as any)}
                  className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                >
                  <option value="SCOLARITE">Scolarité d'enseignement</option>
                  <option value="INSCRIPTION">Frais d'inscription / Réinscription</option>
                  <option value="CANTINE">Frais de Cantine scolaire</option>
                  <option value="TRANSPORT">Frais de Transport / Bus</option>
                  <option value="TENUE">Tenue & Uniforme scolaire</option>
                  <option value="AUTRE">Autre versement</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tranche / Période</label>
                <select
                  value={periodLabel}
                  onChange={(e) => setPeriodLabel(e.target.value)}
                  className="w-full p-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                >
                  <option value="Tranche 1">1ère Tranche (Rentrée)</option>
                  <option value="Tranche 2">2ème Tranche (Janvier)</option>
                  <option value="Tranche 3">3ème Tranche (Avril)</option>
                  <option value="Mois en cours">Mois en cours</option>
                  <option value="Solde intégral">Solde intégral de scolarité</option>
                </select>
              </div>
            </div>

            {/* Saisie du Montant en FCFA */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-gray-700">
                  Montant à encaisser (FCFA)
                </label>
                <span className="text-[11px] text-gray-500">Pas de centimes</span>
              </div>

              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={amount || ''}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="0"
                  className="w-full pl-4 pr-16 py-3 text-xl font-bold text-gray-900 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:outline-hidden transition-all"
                />
                <span className="absolute right-4 top-3.5 text-xs font-black text-gray-500">
                  FCFA
                </span>
              </div>

              {/* Boutons d'ajouts rapides */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[10000, 20000, 25000, 50000].map((quick) => (
                  <button
                    key={quick}
                    type="button"
                    onClick={() => setAmount(quick)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                  >
                    +{formatFCFA(quick)}
                  </button>
                ))}
                {selectedStudent && remainingBalance > 0 && (
                  <button
                    type="button"
                    onClick={() => setAmount(remainingBalance)}
                    className="px-2.5 py-1 text-xs font-bold rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 transition-colors"
                  >
                    Solder tout ({formatFCFA(remainingBalance)})
                  </button>
                )}
              </div>

              {/* Aperçu en toutes lettres */}
              {amount > 0 && (
                <div className="mt-2 text-xs italic text-gray-600 bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100">
                  <span className="font-semibold text-emerald-900">En toutes lettres : </span>
                  {numberToWordsFcfa(amount)}
                </div>
              )}
            </div>

            {/* Mode de règlement */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">
                Mode de règlement
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`p-2.5 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition-all ${
                    paymentMethod === 'CASH'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <Banknote className="w-5 h-5 text-emerald-600" />
                  <span>Espèces</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('ORANGE_MONEY')}
                  className={`p-2.5 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition-all ${
                    paymentMethod === 'ORANGE_MONEY'
                      ? 'border-orange-500 bg-orange-50 text-orange-900 shadow-xs'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <Smartphone className="w-5 h-5 text-orange-600" />
                  <span>Orange Money</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('MOOV_MONEY')}
                  className={`p-2.5 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition-all ${
                    paymentMethod === 'MOOV_MONEY'
                      ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-xs'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <Smartphone className="w-5 h-5 text-blue-600" />
                  <span>Moov Money</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('BANK_TRANSFER')}
                  className={`p-2.5 rounded-xl text-xs font-bold flex flex-col items-center gap-1 border transition-all ${
                    paymentMethod === 'BANK_TRANSFER'
                      ? 'border-purple-600 bg-purple-50 text-purple-900 shadow-xs'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <Building2 className="w-5 h-5 text-purple-600" />
                  <span>Virement</span>
                </button>
              </div>

              {/* Référence de transaction Mobile Money / Virement */}
              {['ORANGE_MONEY', 'MOOV_MONEY', 'BANK_TRANSFER'].includes(paymentMethod) && (
                <div className="mt-3">
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Référence ou N° de transaction {paymentMethod.replace('_', ' ')}
                  </label>
                  <input
                    type="text"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="Ex: OM260928.1402 ou MOOV-78921"
                    className="w-full p-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              )}
            </div>

            {/* Bouton de validation & Impression Reçu */}
            <div className="pt-2">
              <button
                type="button"
                disabled={!selectedStudent || amount <= 0}
                onClick={handleConfirmPayment}
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all ${
                  !selectedStudent || amount <= 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white cursor-pointer'
                }`}
              >
                <Printer className="w-5 h-5" />
                <span>Valider l'encaissement et Imprimer le Reçu 80 mm</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal d'affichage et d'impression du reçu thermique */}
      {currentReceipt && (
        <ReceiptModal
          payment={currentReceipt}
          onClose={() => setCurrentReceipt(null)}
        />
      )}
    </div>
  );
};
