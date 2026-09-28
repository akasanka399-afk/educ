import React, { useState } from 'react';
import { SchoolClass, UserProfile } from '../../types';
import { GradeEntry } from './GradeEntry';
import { ReportCardView } from './ReportCardView';
import { PrimaryAttendance } from './PrimaryAttendance';
import { storage } from '../../services/storage';
import { BookOpen, Calculator, Award, Clock, GraduationCap, CheckCircle2 } from 'lucide-react';

interface PrimaryModuleProps {
  currentUser: UserProfile;
  classes: SchoolClass[];
}

export const PrimaryModule: React.FC<PrimaryModuleProps> = ({ currentUser, classes }) => {
  const [subTab, setSubTab] = useState<'grades' | 'reports' | 'attendance' | 'cep'>('grades');

  const cepCandidates = storage
    .getStudents()
    .filter((s) => s.is_cep_candidate && s.cycle === 'primary');

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-6">
      {/* En-tête du Module Primaire */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-blue-100 text-blue-700">
            <BookOpen className="w-6 h-6" />
          </span>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Module Pédagogique Primaire
            </h2>
            <p className="text-xs sm:text-sm text-gray-500">
              Gestion des classes du CP1 au CM2 : Évaluations, Calculs des Moyennes, Rangs, Bulletins et CEP.
            </p>
          </div>
        </div>

        {/* Sous-onglets */}
        <div className="flex bg-gray-100 p-1 rounded-xl self-start sm:self-auto text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setSubTab('grades')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              subTab === 'grades'
                ? 'bg-white text-blue-800 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Saisie des Notes</span>
          </button>

          <button
            onClick={() => setSubTab('reports')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              subTab === 'reports'
                ? 'bg-white text-blue-800 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Bulletins & Rangs</span>
          </button>

          <button
            onClick={() => setSubTab('attendance')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              subTab === 'attendance'
                ? 'bg-white text-blue-800 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Appel du Matin</span>
          </button>

          <button
            onClick={() => setSubTab('cep')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
              subTab === 'cep'
                ? 'bg-white text-blue-800 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-purple-600" />
            <span>Candidats CEP ({cepCandidates.length})</span>
          </button>
        </div>
      </div>

      {/* Contenu actif */}
      {subTab === 'grades' && <GradeEntry classes={classes} />}
      {subTab === 'reports' && <ReportCardView classes={classes} />}
      {subTab === 'attendance' && <PrimaryAttendance classes={classes} />}

      {/* Vue Spéciale Examen CEP (CM2) */}
      {subTab === 'cep' && (
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">
                Promotion CM2 : Préparation et Candidatures à l'Examen du CEP
              </h3>
              <p className="text-xs text-gray-500">
                Liste officielle des élèves présentés par l'établissement pour la session 2026.
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-semibold"
            >
              Imprimer la Liste Officielle
            </button>
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 uppercase text-gray-500 font-bold border-b">
                <tr>
                  <th className="py-2.5 px-4">N° Ordre</th>
                  <th className="py-2.5 px-4">Matricule</th>
                  <th className="py-2.5 px-4">Nom & Prénom(s)</th>
                  <th className="py-2.5 px-4">Date & Lieu de Naissance</th>
                  <th className="py-2.5 px-4">Genre</th>
                  <th className="py-2.5 px-4">Statut Dossier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cepCandidates.map((st, idx) => (
                  <tr key={st.id} className="hover:bg-gray-50">
                    <td className="py-2.5 px-4 font-bold text-gray-400">{idx + 1}</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-gray-900">{st.student_number}</td>
                    <td className="py-2.5 px-4 font-bold text-gray-900">{st.last_name} {st.first_name}</td>
                    <td className="py-2.5 px-4 text-gray-600">{st.birth_date} à {st.birth_place}</td>
                    <td className="py-2.5 px-4">{st.gender === 'M' ? 'Masculin' : 'Féminin'}</td>
                    <td className="py-2.5 px-4">
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Dossier Complet
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
