import React, { useState } from 'react';
import { SchoolClass, UserProfile } from '../../types';
import { KindergartenAttendance } from './KindergartenAttendance';
import { KindergartenEvaluation } from './KindergartenEvaluation';
import { KindergartenDailyLogView } from './KindergartenDailyLog';
import { Baby, Clock, Award, BookOpen } from 'lucide-react';

interface KindergartenModuleProps {
  currentUser: UserProfile;
  classes: SchoolClass[];
}

export const KindergartenModule: React.FC<KindergartenModuleProps> = ({ currentUser, classes }) => {
  const [subTab, setSubTab] = useState<'attendance' | 'evaluation' | 'log'>('attendance');

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-6">
      {/* En-tête du Module Maternelle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-pink-100 text-pink-700">
              <Baby className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                Module Pédagogique Maternelle
              </h2>
              <p className="text-xs sm:text-sm text-gray-500">
                Gestion des sections Petite, Moyenne et Grande Section (Éveil, Sécurité & Bilans sans notes).
              </p>
            </div>
          </div>
        </div>

        {/* Sous-onglets */}
        <div className="flex bg-gray-100 p-1 rounded-xl self-start sm:self-auto text-xs font-bold">
          <button
            onClick={() => setSubTab('attendance')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              subTab === 'attendance'
                ? 'bg-white text-pink-700 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pointage & Sorties</span>
          </button>

          <button
            onClick={() => setSubTab('evaluation')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              subTab === 'evaluation'
                ? 'bg-white text-pink-700 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Bilans d'Éveil</span>
          </button>

          <button
            onClick={() => setSubTab('log')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              subTab === 'log'
                ? 'bg-white text-pink-700 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Cahier de Vie</span>
          </button>
        </div>
      </div>

      {/* Contenu actif */}
      {subTab === 'attendance' && <KindergartenAttendance classes={classes} />}
      {subTab === 'evaluation' && <KindergartenEvaluation classes={classes} />}
      {subTab === 'log' && <KindergartenDailyLogView classes={classes} />}
    </div>
  );
};
