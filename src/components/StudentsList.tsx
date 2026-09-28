import React, { useState } from 'react';
import { Student, SchoolClass, UserProfile } from '../types';
import { storage } from '../services/storage';
import { formatFCFA, displayPhoneFR } from '../utils/formatters';
import { whatsappService } from '../services/whatsapp';
import { StudentDetailModal } from './StudentDetailModal';
import { StudentForm } from './StudentForm';
import {
  GraduationCap,
  UserPlus,
  Search,
  Filter,
  Share2,
  Eye,
  AlertCircle,
  CheckCircle2,
  Users,
  Baby,
  BookOpen,
  CreditCard,
} from 'lucide-react';
import { StudentIdCardModal } from './StudentIdCardModal';

interface StudentsListProps {
  currentUser: UserProfile;
  onNavigateToCash?: (student: Student) => void;
}

export const StudentsList: React.FC<StudentsListProps> = ({ currentUser, onNavigateToCash }) => {
  const school = storage.getSchoolConfig();
  const classes = storage.getClasses();
  const [students, setStudents] = useState<Student[]>(storage.getStudents());

  // Filtres
  const [selectedCycle, setSelectedCycle] = useState<string>('ALL');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals
  const [activeStudentDetail, setActiveStudentDetail] = useState<Student | null>(null);
  const [activeIdCardStudent, setActiveIdCardStudent] = useState<Student | null>(null);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  const getClassName = (classId: string) => {
    return classes.find((c) => c.id === classId)?.name || 'Classe';
  };

  const filteredStudents = students.filter((s) => {
    const matchesCycle = selectedCycle === 'ALL' || s.cycle === selectedCycle;
    const matchesClass = selectedClass === 'ALL' || s.class_id === selectedClass;
    const remaining = (s.total_fees - s.discount) - s.paid_amount;
    const matchesStatus =
      selectedStatus === 'ALL' ||
      (selectedStatus === 'PAID' && remaining <= 0) ||
      (selectedStatus === 'UNPAID' && remaining > 0);
    const matchesSearch =
      `${s.last_name} ${s.first_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.student_number.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesCycle && matchesClass && matchesStatus && matchesSearch;
  });

  const totalBoys = students.filter((s) => s.gender === 'M').length;
  const totalGirls = students.filter((s) => s.gender === 'F').length;
  const totalUnpaid = students.reduce((sum, s) => {
    const rem = (s.total_fees - s.discount) - s.paid_amount;
    return sum + (rem > 0 ? rem : 0);
  }, 0);

  const handleSendReminder = (st: Student) => {
    if (!st.parent_phone) return;
    const msg = whatsappService.createReminderMessage(
      st,
      getClassName(st.class_id),
      school
    );
    whatsappService.openWhatsApp(st.parent_phone, msg);
    storage.logWhatsApp({
      student_id: st.id,
      recipient_name: st.parent_name,
      phone: st.parent_phone,
      template_type: 'RELANCE_IMPAYE',
      content: msg,
      status: 'SENT',
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-6">
      {/* En-tête & Bouton Inscription */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-emerald-600" />
            Répertoire des Élèves & Inscriptions
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">
            Dossiers complets, contacts WhatsApp obligatoires des parents, et suivi des reliquats.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Nouvelle Inscription</span>
        </button>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs font-bold text-gray-500 uppercase">Effectif Total</span>
          <div className="text-xl font-black text-gray-900 mt-1">{students.length} élèves</div>
          <div className="text-[11px] text-gray-500 mt-0.5">Inscrits {school.academic_year}</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs font-bold text-gray-500 uppercase">Répartition Genre</span>
          <div className="text-xl font-black text-gray-900 mt-1">
            {totalBoys} G <span className="text-gray-300">/</span> {totalGirls} F
          </div>
          <div className="text-[11px] text-gray-500 mt-0.5">Garçons / Filles</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs font-bold text-emerald-700 uppercase">Cycles d'enseignement</span>
          <div className="text-sm font-bold text-gray-800 mt-1.5 flex items-center gap-2">
            <span className="flex items-center gap-1 text-xs">
              <Baby className="w-3.5 h-3.5 text-pink-500" /> Maternelle
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-xs">
              <BookOpen className="w-3.5 h-3.5 text-blue-500" /> Primaire
            </span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-xs">
          <span className="text-xs font-bold text-amber-700 uppercase">Total Reliquats Impayés</span>
          <div className="text-lg font-black text-amber-900 mt-1">
            {formatFCFA(totalUnpaid)}
          </div>
          <div className="text-[11px] text-gray-500 mt-0.5">À recouvrer auprès des parents</div>
        </div>
      </div>

      {/* Barre de filtres combinés */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher nom, prénom, matricule..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto text-xs">
            {/* Filtre Cycle */}
            <select
              value={selectedCycle}
              onChange={(e) => setSelectedCycle(e.target.value)}
              className="p-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs"
            >
              <option value="ALL">Tous les cycles</option>
              <option value="kindergarten">Maternelle</option>
              <option value="primary">Primaire</option>
            </select>

            {/* Filtre Classe */}
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="p-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs"
            >
              <option value="ALL">Toutes les classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Filtre Statut de Paiement */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="p-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="PAID">Scolarité Soldée</option>
              <option value="UNPAID">Avec Impayé / Reliquat</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grille / Liste des Élèves */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Matricule</th>
                <th className="py-3 px-4">Nom & Prénom(s)</th>
                <th className="py-3 px-4">Classe & Cycle</th>
                <th className="py-3 px-4">Parent / Contact WhatsApp</th>
                <th className="py-3 px-4 text-right">Déjà Versé</th>
                <th className="py-3 px-4 text-right">Reste à Payer</th>
                <th className="py-3 px-4 text-center">Statut</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((st) => {
                  const remaining = (st.total_fees - st.discount) - st.paid_amount;
                  return (
                    <tr key={st.id} className="hover:bg-gray-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-gray-800">
                        {st.student_number}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900">
                          {st.last_name} {st.first_name}
                        </div>
                        <div className="text-[10.5px] text-gray-400">
                          {st.gender === 'M' ? 'Garçon' : 'Fille'}
                          {st.is_cep_candidate && ' • Candidat CEP'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-gray-800">
                          {getClassName(st.class_id)}
                        </span>
                        <span
                          className={`ml-1.5 px-1.5 py-0.2 rounded text-[9.5px] font-bold ${
                            st.cycle === 'kindergarten'
                              ? 'bg-pink-100 text-pink-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {st.cycle === 'kindergarten' ? 'Maternelle' : 'Primaire'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-gray-900 font-medium">{st.parent_name}</div>
                        <div className="font-mono text-emerald-700 font-semibold text-[11px]">
                          {displayPhoneFR(st.parent_phone)}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-emerald-700">
                        {formatFCFA(st.paid_amount)}
                      </td>
                      <td className="py-3 px-4 text-right font-black">
                        <span className={remaining > 0 ? 'text-amber-800' : 'text-gray-400'}>
                          {formatFCFA(remaining)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {remaining <= 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            Soldé
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
                            <AlertCircle className="w-3 h-3" />
                            Reliquat
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Fiche détaillée */}
                          <button
                            onClick={() => setActiveStudentDetail(st)}
                            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-700"
                            title="Consulter le dossier complet"
                          >
                            <Eye className="w-4 h-4 text-gray-600" />
                          </button>

                          {/* Carte Scolaire & Badge */}
                          <button
                            onClick={() => setActiveIdCardStudent(st)}
                            className="p-1.5 rounded-lg border border-purple-200 hover:bg-purple-50 text-purple-700"
                            title="Imprimer / Visualiser la carte scolaire"
                          >
                            <CreditCard className="w-4 h-4" />
                          </button>

                          {/* Relance WhatsApp si impayé */}
                          {remaining > 0 && (
                            <button
                              onClick={() => handleSendReminder(st)}
                              className="p-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-50 text-emerald-600"
                              title="Envoyer un rappel de scolarité sur WhatsApp"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400 text-xs">
                    Aucun élève trouvé correspondant à ces filtres.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Détail Élève */}
      {activeStudentDetail && (
        <StudentDetailModal
          student={activeStudentDetail}
          onClose={() => setActiveStudentDetail(null)}
          onOpenCard={(st) => {
            setActiveStudentDetail(null);
            setActiveIdCardStudent(st);
          }}
        />
      )}

      {/* Modal Carte Scolaire */}
      {activeIdCardStudent && (
        <StudentIdCardModal
          student={activeIdCardStudent}
          school={school}
          schoolClass={classes.find((c) => c.id === activeIdCardStudent.class_id)}
          onClose={() => setActiveIdCardStudent(null)}
          onUpdatePhoto={(stId, photoUrl) => {
            storage.updateStudent(stId, { photo_url: photoUrl });
            setStudents(storage.getStudents());
          }}
        />
      )}

      {/* Modal Inscription */}
      {showAddForm && (
        <StudentForm
          onClose={() => setShowAddForm(false)}
          onStudentSaved={() => setStudents(storage.getStudents())}
        />
      )}
    </div>
  );
};
