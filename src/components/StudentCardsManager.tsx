import React, { useState, useCallback } from 'react';
import { Student, SchoolConfig, SchoolClass, UserProfile } from '../types';
import { storage } from '../services/storage';
import { StudentIdCard } from './StudentIdCard';
import { StudentIdCardModal } from './StudentIdCardModal';
import { useSyncData } from '../hooks/useSyncData';
import {
  CreditCard,
  Printer,
  Search,
  Filter,
  CheckSquare,
  Square,
  Users,
  Eye,
  Layers,
  Sparkles,
  Download,
  AlertCircle
} from 'lucide-react';

interface StudentCardsManagerProps {
  school: SchoolConfig;
  currentUser: UserProfile;
  classes: SchoolClass[];
}

export const StudentCardsManager: React.FC<StudentCardsManagerProps> = ({
  school,
  currentUser,
  classes,
}) => {
  const [students, setStudents] = useState<Student[]>(storage.getStudents());

  useSyncData(
    useCallback(() => {
      setStudents(storage.getStudents());
    }, [])
  );

  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [selectedCycle, setSelectedCycle] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [activePreviewStudent, setActivePreviewStudent] = useState<Student | null>(null);
  const [printLayout, setPrintLayout] = useState<'both' | 'front_only'>('both');

  // Filtre des élèves
  const filteredStudents = students.filter((s) => {
    const matchesCycle = selectedCycle === 'ALL' || s.cycle === selectedCycle;
    const matchesClass = selectedClassId === 'ALL' || s.class_id === selectedClassId;
    const matchesSearch =
      `${s.last_name} ${s.first_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.student_number.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCycle && matchesClass && matchesSearch;
  });

  const handleSelectAll = () => {
    if (selectedStudentIds.length === filteredStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(filteredStudents.map((s) => s.id));
    }
  };

  const toggleSelectStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handlePrintBatch = () => {
    window.print();
  };

  const handleUpdateStudentPhoto = (studentId: string, photoUrl: string) => {
    const updated = storage.updateStudent(studentId, { photo_url: photoUrl });
    if (updated) {
      setStudents(storage.getStudents());
      if (activePreviewStudent && activePreviewStudent.id === studentId) {
        setActivePreviewStudent(updated);
      }
    }
  };

  const studentsToPrint =
    selectedStudentIds.length > 0
      ? students.filter((s) => selectedStudentIds.includes(s.id))
      : filteredStudents;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* En-tête du module Cartes Scolaires (masqué à l'impression) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-200 shadow-xs print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-md">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-gray-900 tracking-tight">
                Gestion des Cartes Scolaires & Badges
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                Norme ISO CR80
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Générez, personnalisez et imprimez en planche ou à l'unité les cartes d'identité des élèves avec QR Code sécurisé.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setPrintLayout(printLayout === 'both' ? 'front_only' : 'both')}
            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 hover:bg-gray-50 text-xs font-semibold rounded-xl text-gray-700 transition-colors"
          >
            <Layers className="w-4 h-4 text-gray-500" />
            <span>{printLayout === 'both' ? 'Recto + Verso' : 'Recto uniquement'}</span>
          </button>

          <button
            onClick={handlePrintBatch}
            disabled={studentsToPrint.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-bold rounded-xl shadow-md transition-all transform hover:scale-105 disabled:opacity-50 disabled:pointer-events-none"
          >
            <Printer className="w-4 h-4" />
            <span>
              Imprimer la sélection ({studentsToPrint.length} carte{studentsToPrint.length > 1 ? 's' : ''})
            </span>
          </button>
        </div>
      </div>

      {/* Filtres et recherche (masqués à l'impression) */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex flex-wrap items-center gap-3">
          {/* Recherche */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom ou matricule..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          {/* Filtre Cycle */}
          <select
            value={selectedCycle}
            onChange={(e) => setSelectedCycle(e.target.value)}
            className="py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          >
            <option value="ALL">Tous les cycles</option>
            <option value="kindergarten">Cycle Maternelle</option>
            <option value="primary">Cycle Primaire</option>
          </select>

          {/* Filtre Classe */}
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="py-2 px-3 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-700 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          >
            <option value="ALL">Toutes les classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.level})
              </option>
            ))}
          </select>
        </div>

        {/* Sélection globale */}
        <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 font-semibold transition-colors"
          >
            {selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0 ? (
              <CheckSquare className="w-4 h-4 text-emerald-600" />
            ) : (
              <Square className="w-4 h-4 text-gray-400" />
            )}
            <span>
              {selectedStudentIds.length === filteredStudents.length && filteredStudents.length > 0
                ? 'Tout désélectionner'
                : 'Tout sélectionner'}
            </span>
          </button>
          <span className="text-gray-400">|</span>
          <span className="text-emerald-700 font-bold">
            {selectedStudentIds.length} / {filteredStudents.length} sélectionné(s)
          </span>
        </div>
      </div>

      {/* Guide Pratique pour l'impression (masqué à l'impression) */}
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 print:hidden">
        <Sparkles className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-950 space-y-1">
          <p className="font-bold">
            Instructions pour l'impression des badges et cartes plastifiées :
          </p>
          <p className="text-emerald-800 leading-relaxed">
            Pour imprimer une planche de cartes scolaires, cliquez sur <strong>« Imprimer la sélection »</strong>. Dans les options d'impression de votre navigateur, cochez <strong>« Graphiques d'arrière-plan »</strong> (Background graphics) et choisissez une échelle de 100% pour conserver les dimensions réglementaires exactes de 85.6 mm × 54 mm.
          </p>
        </div>
      </div>

      {/* Liste des cartes à l'écran (Vue Gestion) */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-xs overflow-hidden print:hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-500 font-bold uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="py-3 px-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      selectedStudentIds.length === filteredStudents.length &&
                      filteredStudents.length > 0
                    }
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4">Élève & Photo</th>
                <th className="py-3 px-4">Matricule</th>
                <th className="py-3 px-4">Classe & Cycle</th>
                <th className="py-3 px-4">Contact Parent</th>
                <th className="py-3 px-4">Groupe Sanguin</th>
                <th className="py-3 px-4 text-center">Aperçu Carte</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((st) => {
                  const isChecked = selectedStudentIds.includes(st.id);
                  const stClass = classes.find((c) => c.id === st.class_id);

                  return (
                    <tr
                      key={st.id}
                      className={`hover:bg-gray-50/80 transition-colors ${
                        isChecked ? 'bg-emerald-50/40' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectStudent(st.id)}
                          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-11 rounded-lg border border-gray-200 bg-gray-100 overflow-hidden shrink-0 flex items-center justify-center">
                            {st.photo_url ? (
                              <img
                                src={st.photo_url}
                                alt={st.last_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="font-black text-xs text-gray-400">
                                {st.last_name[0]}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">
                              {st.last_name} {st.first_name}
                            </div>
                            <div className="text-[10px] text-gray-400">
                              {st.gender === 'M' ? 'Garçon' : 'Fille'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-gray-800">
                        {st.student_number}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-gray-900">
                          {stClass?.name || 'Non assigné'}
                        </div>
                        <span
                          className={`inline-block px-1.5 py-0.2 rounded text-[9.5px] font-bold ${
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
                        <div className="font-mono text-emerald-700 text-[11px]">
                          {st.parent_phone}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-50 text-red-700 border border-red-200">
                          {st.blood_group || 'N/R'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                          <CreditCard className="w-3.5 h-3.5" />
                          Prête (CR80)
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setActivePreviewStudent(st)}
                          className="px-3 py-1.5 rounded-xl border border-gray-200 hover:border-emerald-500 hover:bg-emerald-50 text-emerald-700 font-bold text-xs transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Gérer la carte</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-gray-400">
                    Aucun élève trouvé pour ces critères de recherche.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= ZONE DE PLANCHE D'IMPRESSION (Actif lors de window.print) ================= */}
      <div className="hidden print:block print:w-full print:m-0 print:p-0">
        <div className="flex flex-wrap items-center justify-start gap-4">
          {studentsToPrint.map((st) => {
            const stClass = classes.find((c) => c.id === st.class_id);
            return (
              <div
                key={st.id}
                className="print:page-break-inside-avoid print:mb-4"
              >
                <StudentIdCard
                  student={st}
                  school={school}
                  schoolClass={stClass}
                  showBackSide={printLayout === 'both'}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Fiche Carte Individuelle */}
      {activePreviewStudent && (
        <StudentIdCardModal
          student={activePreviewStudent}
          school={school}
          schoolClass={classes.find((c) => c.id === activePreviewStudent.class_id)}
          onClose={() => setActivePreviewStudent(null)}
          onUpdatePhoto={handleUpdateStudentPhoto}
        />
      )}
    </div>
  );
};
