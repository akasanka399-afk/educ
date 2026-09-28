import React, { useState } from 'react';
import { SchoolClass, KindergartenDailyLog } from '../../types';
import { storage } from '../../services/storage';
import { BookOpen, Calendar, Save, CheckCircle2, Utensils, Moon, AlertOctagon, Heart } from 'lucide-react';

interface KindergartenDailyLogProps {
  classes: SchoolClass[];
}

export const KindergartenDailyLogView: React.FC<KindergartenDailyLogProps> = ({ classes }) => {
  const kindergartenClasses = classes.filter((c) => c.cycle === 'kindergarten');
  const [selectedClassId, setSelectedClassId] = useState<string>(
    kindergartenClasses[0]?.id || ''
  );
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));

  const existingLogs = storage.getKindergartenDailyLogs();
  const currentLog = existingLogs.find(
    (l) => l.class_id === selectedClassId && l.date === date
  );

  const [theme, setTheme] = useState<string>(
    currentLog?.activities_theme || 'Découverte des animaux de la savane & Graphisme de boucles'
  );
  const [meals, setMeals] = useState<string>(
    currentLog?.meals_summary || 'Déjeuner : Riz au gras et haricots verts. Goûter : Bouillie de petit mil et bananes.'
  );
  const [nap, setNap] = useState<string>(
    currentLog?.nap_summary || 'Sieste calme de 12h45 à 14h30 pour tous les enfants.'
  );
  const [incidents, setIncidents] = useState<string>(
    currentLog?.incidents || 'Aucun incident notable ce jour.'
  );
  const [reminders, setReminders] = useState<string>(
    currentLog?.reminders_to_parents || 'Prévoir une tenue de rechange étiquetée pour la séance d\'arts plastiques de jeudi.'
  );

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleSave = () => {
    const newLog: KindergartenDailyLog = {
      id: `klog_${selectedClassId}_${date}`,
      class_id: selectedClassId,
      date,
      activities_theme: theme,
      meals_summary: meals,
      nap_summary: nap,
      incidents,
      reminders_to_parents: reminders,
    };

    storage.saveKindergartenDailyLog(newLog);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-pink-600" />
          <h3 className="font-bold text-gray-900 text-sm">
            Cahier de Vie & Journal Quotidien de la Section
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="p-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold"
          >
            {kindergartenClasses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="p-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs"
          />

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer le journal</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Journal de classe sauvegardé !</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Activités & Thème */}
        <div className="space-y-1.5 p-3.5 bg-pink-50/50 border border-pink-100 rounded-xl">
          <label className="font-bold text-pink-900 flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-pink-600" />
            Thème & Activités du jour
          </label>
          <textarea
            rows={3}
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="w-full p-2 bg-white border border-gray-200 rounded-lg focus:outline-pink-500"
          />
        </div>

        {/* Repas & Goûter */}
        <div className="space-y-1.5 p-3.5 bg-amber-50/50 border border-amber-100 rounded-xl">
          <label className="font-bold text-amber-900 flex items-center gap-1.5">
            <Utensils className="w-4 h-4 text-amber-600" />
            Repas, cantine & goûter
          </label>
          <textarea
            rows={3}
            value={meals}
            onChange={(e) => setMeals(e.target.value)}
            className="w-full p-2 bg-white border border-gray-200 rounded-lg focus:outline-amber-500"
          />
        </div>

        {/* Sieste & Repos */}
        <div className="space-y-1.5 p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl">
          <label className="font-bold text-indigo-900 flex items-center gap-1.5">
            <Moon className="w-4 h-4 text-indigo-600" />
            Sieste & Rythme de sommeil
          </label>
          <textarea
            rows={3}
            value={nap}
            onChange={(e) => setNap(e.target.value)}
            className="w-full p-2 bg-white border border-gray-200 rounded-lg focus:outline-indigo-500"
          />
        </div>

        {/* Incidents & Bobos */}
        <div className="space-y-1.5 p-3.5 bg-red-50/50 border border-red-100 rounded-xl">
          <label className="font-bold text-red-900 flex items-center gap-1.5">
            <AlertOctagon className="w-4 h-4 text-red-600" />
            Incidents, petits bobos & observations
          </label>
          <textarea
            rows={3}
            value={incidents}
            onChange={(e) => setIncidents(e.target.value)}
            className="w-full p-2 bg-white border border-gray-200 rounded-lg focus:outline-red-500"
          />
        </div>
      </div>

      {/* Rappels pour les parents */}
      <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1 text-xs">
        <label className="font-bold text-gray-800">
          Consignes & Rappels pour les parents à la sortie
        </label>
        <input
          type="text"
          value={reminders}
          onChange={(e) => setReminders(e.target.value)}
          className="w-full p-2 bg-white border border-gray-200 rounded-lg"
        />
      </div>
    </div>
  );
};
