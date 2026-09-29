import React, { useState } from 'react';
import { Student, SchoolClass, AuthorizedPickup, CycleType, Payment, PaymentMethod } from '../types';
import { storage } from '../services/storage';
import { normalizeBurkinaPhone, formatFCFA } from '../utils/formatters';
import { numberToWordsFcfa } from '../utils/numberToWords';
import { X, UserPlus, Save, Users, AlertCircle, Plus, Trash2, Wallet, CheckCircle2, Banknote, Smartphone, CreditCard } from 'lucide-react';

interface StudentFormProps {
  onClose: () => void;
  onStudentSaved: (payment?: Payment) => void;
}

export const StudentForm: React.FC<StudentFormProps> = ({ onClose, onStudentSaved }) => {
  const school = storage.getSchoolConfig();
  const classes = storage.getClasses();

  // Cycle & Classe
  const [cycle, setCycle] = useState<CycleType>('primary');
  const availableClasses = classes.filter((c) => c.cycle === cycle);
  const [classId, setClassId] = useState<string>(availableClasses[0]?.id || '');

  // État civil
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('2018-05-10');
  const [birthPlace, setBirthPlace] = useState('Ouagadougou');
  const [gender, setGender] = useState<'M' | 'F'>('M');

  // Numéro matricule généré
  const nextNumber = String(storage.getStudents().length + 1).padStart(4, '0');
  const [studentNumber, setStudentNumber] = useState(
    `${school.short_code}-${school.academic_year.slice(2, 4)}-${nextNumber}`
  );

  // Parent / WhatsApp
  const [parentName, setParentName] = useState('');
  const [parentRelation, setParentRelation] = useState<'father' | 'mother' | 'tutor'>('father');
  const [parentPhone, setParentPhone] = useState('');
  const [parentProfession, setParentProfession] = useState('');
  const [parentAddress, setParentAddress] = useState('');

  // Santé & Carte
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [allergies, setAllergies] = useState('');
  const [healthNotes, setHealthNotes] = useState('');

  // Finances
  const [totalFees, setTotalFees] = useState<number>(cycle === 'kindergarten' ? 160000 : 150000);
  const [discount, setDiscount] = useState<number>(0);
  const [isCep, setIsCep] = useState<boolean>(false);

  // Règlement immédiat à l'inscription (Caisse)
  const [recordInitialPayment, setRecordInitialPayment] = useState<boolean>(true);
  const [initialPaymentAmount, setInitialPaymentAmount] = useState<number>(35000);
  const [initialPaymentMethod, setInitialPaymentMethod] = useState<PaymentMethod>('CASH');
  const [initialTransactionRef, setInitialTransactionRef] = useState<string>('');

  // Personnes autorisées pour la sortie (Maternelle)
  const [pickups, setPickups] = useState<AuthorizedPickup[]>([]);
  const [newPickupName, setNewPickupName] = useState('');
  const [newPickupRelation, setNewPickupRelation] = useState('');
  const [newPickupPhone, setNewPickupPhone] = useState('');

  const handleCycleChange = (newCycle: CycleType) => {
    setCycle(newCycle);
    const cls = classes.filter((c) => c.cycle === newCycle);
    if (cls.length > 0) {
      setClassId(cls[0].id);
    }
    setTotalFees(newCycle === 'kindergarten' ? 160000 : 150000);
  };

  const handleAddPickup = () => {
    if (!newPickupName.trim() || !newPickupPhone.trim()) return;
    setPickups([
      ...pickups,
      {
        id: `pk_${Date.now()}`,
        name: newPickupName.trim(),
        relation: newPickupRelation.trim() || 'Proche',
        phone: normalizeBurkinaPhone(newPickupPhone.trim()),
      },
    ]);
    setNewPickupName('');
    setNewPickupRelation('');
    setNewPickupPhone('');
  };

  const handleRemovePickup = (id: string) => {
    setPickups(pickups.filter((p) => p.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!lastName.trim() || !firstName.trim()) {
      alert('Veuillez renseigner le nom et le prénom de l\'élève.');
      return;
    }

    if (!parentPhone.trim()) {
      alert('Le numéro WhatsApp du parent est obligatoire pour le suivi scolaire.');
      return;
    }

    const normalizedPhone = normalizeBurkinaPhone(parentPhone);

    const netFees = Math.max(0, (Number(totalFees) || 0) - (Number(discount) || 0));
    const paidAtRegistration = recordInitialPayment ? Math.min(Number(initialPaymentAmount) || 0, netFees) : 0;

    const newStudent: Student = {
      id: `std_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      school_id: school.id,
      student_number: studentNumber.trim(),
      first_name: firstName.trim(),
      last_name: lastName.trim().toUpperCase(),
      birth_date: birthDate,
      birth_place: birthPlace.trim(),
      gender,
      photo_url: photoUrl,
      blood_group: bloodGroup,
      class_id: classId,
      cycle,
      academic_year_id: school.academic_year,
      parent_name: parentName.trim() || 'Parent d\'élève',
      parent_relation: parentRelation,
      parent_phone: normalizedPhone,
      parent_profession: parentProfession.trim() || undefined,
      parent_address: parentAddress.trim() || undefined,
      allergies: allergies.trim() || undefined,
      health_notes: healthNotes.trim() || undefined,
      authorized_pickups: pickups,
      is_cep_candidate: cycle === 'primary' && isCep,
      total_fees: Number(totalFees) || 0,
      discount: Number(discount) || 0,
      paid_amount: paidAtRegistration,
      created_at: new Date().toISOString(),
    };

    storage.addStudent(newStudent);

    let createdPayment: Payment | undefined;
    if (paidAtRegistration > 0) {
      const currentUser = storage.getCurrentUser();
      const currentCounter = school.receipt_counter + 1;
      const paddedCounter = String(currentCounter).padStart(5, '0');
      const receiptNumber = `REC-${school.academic_year.slice(0, 4)}-${school.cash_prefix}-${paddedCounter}`;
      const className = classes.find((c) => c.id === classId)?.name || 'Classe';

      createdPayment = {
        id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        school_id: school.id,
        academic_year_id: school.academic_year,
        student_id: newStudent.id,
        student_name: `${newStudent.last_name} ${newStudent.first_name}`,
        student_number: newStudent.student_number,
        class_id: newStudent.class_id,
        class_name: className,
        receipt_number: receiptNumber,
        amount_fcfa: Math.floor(paidAtRegistration),
        amount_in_words: numberToWordsFcfa(paidAtRegistration),
        payment_method: initialPaymentMethod,
        transaction_ref: initialTransactionRef.trim() || undefined,
        fee_category: 'INSCRIPTION',
        period_label: 'Frais d\'inscription',
        total_paid_after: paidAtRegistration,
        remaining_balance_after: Math.max(0, netFees - paidAtRegistration),
        cashier_id: currentUser.id,
        cashier_name: currentUser.name,
        is_cancelled: false,
        print_count: 1,
        created_at: new Date().toISOString(),
      };

      storage.addPayment(createdPayment);
    }

    onStudentSaved(createdPayment);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[92vh]">
        {/* En-tête */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/80 rounded-t-2xl">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-base">
            <UserPlus className="w-5 h-5 text-emerald-600" />
            <span>Nouvelle Inscription Scolaire ({school.academic_year})</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Choix du Cycle & Classe */}
          <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-3">
            <div className="flex items-center gap-4">
              <span className="font-bold text-gray-700">Cycle scolaire :</span>
              {school.active_modules.primary && (
                <label className="flex items-center gap-1.5 cursor-pointer font-semibold">
                  <input
                    type="radio"
                    name="cycle"
                    checked={cycle === 'primary'}
                    onChange={() => handleCycleChange('primary')}
                    className="text-emerald-600"
                  />
                  <span>Primaire (CP - CM2)</span>
                </label>
              )}
              {school.active_modules.kindergarten && (
                <label className="flex items-center gap-1.5 cursor-pointer font-semibold">
                  <input
                    type="radio"
                    name="cycle"
                    checked={cycle === 'kindergarten'}
                    onChange={() => handleCycleChange('kindergarten')}
                    className="text-emerald-600"
                  />
                  <span>Maternelle (PS - GS)</span>
                </label>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Classe d'affectation *</label>
                <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  required
                  className="w-full p-2 bg-white border border-gray-300 rounded-lg focus:outline-emerald-500"
                >
                  {availableClasses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">Matricule Scolaire</label>
                <input
                  type="text"
                  value={studentNumber}
                  onChange={(e) => setStudentNumber(e.target.value)}
                  className="w-full p-2 bg-white border border-gray-300 rounded-lg font-mono font-bold"
                />
              </div>
            </div>
          </div>

          {/* État civil de l'enfant */}
          <div>
            <h4 className="font-bold text-gray-800 uppercase tracking-wider mb-2 border-b pb-1">
              1. État Civil de l'Enfant
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Nom de famille *</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Ex: OUÉDRAOGO, TRAORÉ"
                  required
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Prénom(s) *</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Ex: Wend-Panga Maxime"
                  required
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Date de naissance</label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Lieu de naissance</label>
                <input
                  type="text"
                  value={birthPlace}
                  onChange={(e) => setBirthPlace(e.target.value)}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Genre</label>
                <div className="flex gap-4 pt-1">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      checked={gender === 'M'}
                      onChange={() => setGender('M')}
                    />
                    <span>Masculin (Garçon)</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      checked={gender === 'F'}
                      onChange={() => setGender('F')}
                    />
                    <span>Féminin (Fille)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Groupe Sanguin (pour la Carte Scolaire)
                </label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white font-bold text-gray-800"
                >
                  <option value="O+">O+ (Le plus fréquent)</option>
                  <option value="A+">A+</option>
                  <option value="B+">B+</option>
                  <option value="AB+">AB+</option>
                  <option value="O-">O-</option>
                  <option value="A-">A-</option>
                  <option value="B-">B-</option>
                  <option value="AB-">AB-</option>
                  <option value="Inconnu">Inconnu / Non testé</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Photo d'identité (Badge / Carte)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        setPhotoUrl(ev.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
                />
              </div>

              {cycle === 'primary' && (
                <div className="flex items-center pt-2 sm:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-purple-800">
                    <input
                      type="checkbox"
                      checked={isCep}
                      onChange={(e) => setIsCep(e.target.checked)}
                      className="w-4 h-4 text-purple-600 rounded"
                    />
                    <span>Candidat officiel au CEP (CM2)</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Tuteur & WhatsApp */}
          <div>
            <h4 className="font-bold text-gray-800 uppercase tracking-wider mb-2 border-b pb-1">
              2. Tuteur & Contact WhatsApp Obligatoire
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Nom complet du tuteur *</label>
                <input
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="Ex: M. OUÉDRAOGO François"
                  required
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Lien de parenté</label>
                <select
                  value={parentRelation}
                  onChange={(e) => setParentRelation(e.target.value as any)}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white"
                >
                  <option value="father">Père</option>
                  <option value="mother">Mère</option>
                  <option value="tutor">Tuteur légal / Oncle</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-emerald-800 mb-1">
                  Téléphone WhatsApp (+226) *
                </label>
                <input
                  type="tel"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  placeholder="Ex: 70 12 34 56 ou +22670123456"
                  required
                  className="w-full p-2 bg-emerald-50/50 border border-emerald-300 rounded-lg font-mono font-bold focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Profession</label>
                <input
                  type="text"
                  value={parentProfession}
                  onChange={(e) => setParentProfession(e.target.value)}
                  placeholder="Ex: Enseignant, Commerçant..."
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Frais & Scolarité */}
          <div>
            <h4 className="font-bold text-gray-800 uppercase tracking-wider mb-2 border-b pb-1">
              3. Grille Tarifaire & Remise (FCFA)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Frais Annuels Globaux (FCFA)
                </label>
                <input
                  type="number"
                  step="1000"
                  value={totalFees}
                  onChange={(e) => setTotalFees(Number(e.target.value))}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Remise / Bourse accordée (FCFA)
                </label>
                <input
                  type="number"
                  step="1000"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg"
                />
              </div>
            </div>
            <p className="mt-1 text-gray-500 text-[11px]">
              Net à payer : <span className="font-bold text-emerald-700">{formatFCFA(totalFees - discount)}</span>
            </p>
          </div>

          {/* 4. Règlement immédiat des Frais d'Inscription */}
          <div className="p-3.5 bg-emerald-50/90 border-2 border-emerald-400 rounded-2xl space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-emerald-950 text-xs">
                <input
                  type="checkbox"
                  checked={recordInitialPayment}
                  onChange={(e) => setRecordInitialPayment(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <span className="flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-emerald-700" />
                  <span>Encaisser les frais d'inscription immédiatement (Recette du jour)</span>
                </span>
              </label>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-200 text-emerald-800">
                Guichet Caisse
              </span>
            </div>

            {recordInitialPayment && (
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-gray-800 mb-1">
                      Montant versé à l'inscription (FCFA) *
                    </label>
                    <input
                      type="number"
                      step="500"
                      min="1000"
                      max={Math.max(0, totalFees - discount)}
                      value={initialPaymentAmount}
                      onChange={(e) => setInitialPaymentAmount(Number(e.target.value))}
                      className="w-full p-2 bg-white border border-emerald-300 rounded-lg font-black text-emerald-800 text-sm focus:ring-2 focus:ring-emerald-500"
                    />
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {[15000, 25000, 35000, 50000].map((quick) => (
                        <button
                          key={quick}
                          type="button"
                          onClick={() => setInitialPaymentAmount(quick)}
                          className="px-2 py-0.5 text-[10px] bg-white border border-emerald-200 hover:bg-emerald-100 rounded text-emerald-800 font-semibold"
                        >
                          {formatFCFA(quick)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-gray-800 mb-1">
                      Mode de paiement *
                    </label>
                    <select
                      value={initialPaymentMethod}
                      onChange={(e) => setInitialPaymentMethod(e.target.value as PaymentMethod)}
                      className="w-full p-2 bg-white border border-emerald-300 rounded-lg font-bold text-xs"
                    >
                      <option value="CASH">Espèces (Billets / Pièces)</option>
                      <option value="ORANGE_MONEY">Orange Money Burkina</option>
                      <option value="MOOV_MONEY">Moov Money Flooz</option>
                      <option value="BANK_TRANSFER">Virement / Chèque bancaire</option>
                    </select>

                    {['ORANGE_MONEY', 'MOOV_MONEY', 'BANK_TRANSFER'].includes(initialPaymentMethod) && (
                      <input
                        type="text"
                        placeholder="N° Réf transaction / SMS..."
                        value={initialTransactionRef}
                        onChange={(e) => setInitialTransactionRef(e.target.value)}
                        className="w-full mt-2 p-1.5 bg-white border border-gray-200 rounded text-xs"
                      />
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] bg-white/90 p-2.5 rounded-xl border border-emerald-200">
                  <span className="text-gray-600">
                    Reste dû après inscription :{' '}
                    <strong className="text-amber-800 font-bold">
                      {formatFCFA(Math.max(0, (totalFees - discount) - initialPaymentAmount))}
                    </strong>
                  </span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Reçu officiel généré & synchronisé</span>
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Santé & Allergies */}
          <div>
            <h4 className="font-bold text-gray-800 uppercase tracking-wider mb-2 border-b pb-1">
              5. Santé & Allergies
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Allergies connues</label>
                <input
                  type="text"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="Ex: Arachides, pénicilline, asthme..."
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Observations médicales</label>
                <input
                  type="text"
                  value={healthNotes}
                  onChange={(e) => setHealthNotes(e.target.value)}
                  placeholder="Ex: Port de lunettes..."
                  className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Personnes autorisées pour la sortie (Maternelle) */}
          {cycle === 'kindergarten' && (
            <div>
              <h4 className="font-bold text-gray-800 uppercase tracking-wider mb-2 border-b pb-1">
                5. Personnes Autorisées à Récupérer l'Enfant (Maternelle)
              </h4>

              <div className="space-y-2 mb-3">
                {pickups.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <span>
                      <strong>{p.name}</strong> ({p.relation}) - {p.phone}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemovePickup(p.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200">
                <input
                  type="text"
                  placeholder="Nom complet"
                  value={newPickupName}
                  onChange={(e) => setNewPickupName(e.target.value)}
                  className="p-1.5 bg-white border border-gray-200 rounded"
                />
                <input
                  type="text"
                  placeholder="Lien (Tante, Chauffeur)"
                  value={newPickupRelation}
                  onChange={(e) => setNewPickupRelation(e.target.value)}
                  className="p-1.5 bg-white border border-gray-200 rounded"
                />
                <div className="flex gap-1">
                  <input
                    type="tel"
                    placeholder="Téléphone"
                    value={newPickupPhone}
                    onChange={(e) => setNewPickupPhone(e.target.value)}
                    className="p-1.5 bg-white border border-gray-200 rounded flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleAddPickup}
                    className="p-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Boutons actions */}
          <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer l'inscription</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
