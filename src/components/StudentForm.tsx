import React, { useState } from 'react';
import { Student, SchoolClass, AuthorizedPickup, CycleType } from '../types';
import { storage } from '../services/storage';
import { normalizeBurkinaPhone, formatFCFA } from '../utils/formatters';
import { X, UserPlus, Save, Users, AlertCircle, Plus, Trash2 } from 'lucide-react';

interface StudentFormProps {
  onClose: () => void;
  onStudentSaved: () => void;
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

  // Santé
  const [allergies, setAllergies] = useState('');
  const [healthNotes, setHealthNotes] = useState('');

  // Finances
  const [totalFees, setTotalFees] = useState<number>(cycle === 'kindergarten' ? 160000 : 150000);
  const [discount, setDiscount] = useState<number>(0);
  const [isCep, setIsCep] = useState<boolean>(false);

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

    const newStudent: Student = {
      id: `std_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      school_id: school.id,
      student_number: studentNumber.trim(),
      first_name: firstName.trim(),
      last_name: lastName.trim().toUpperCase(),
      birth_date: birthDate,
      birth_place: birthPlace.trim(),
      gender,
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
      paid_amount: 0,
      created_at: new Date().toISOString(),
    };

    storage.addStudent(newStudent);
    onStudentSaved();
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

              {cycle === 'primary' && (
                <div className="flex items-center pt-5">
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

          {/* Santé & Allergies */}
          <div>
            <h4 className="font-bold text-gray-800 uppercase tracking-wider mb-2 border-b pb-1">
              4. Santé & Allergies
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
