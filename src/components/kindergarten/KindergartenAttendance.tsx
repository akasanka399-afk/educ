import React, { useState } from 'react';
import { Student, SchoolClass, AttendanceRecord } from '../../types';
import { storage } from '../../services/storage';
import {
  Baby,
  Clock,
  UserCheck,
  ShieldAlert,
  Save,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  HeartPulse
} from 'lucide-react';

interface KindergartenAttendanceProps {
  classes: SchoolClass[];
}

export const KindergartenAttendance: React.FC<KindergartenAttendanceProps> = ({ classes }) => {
  const kindergartenClasses = classes.filter((c) => c.cycle === 'kindergarten');
  const [selectedClassId, setSelectedClassId] = useState<string>(
    kindergartenClasses[0]?.id || ''
  );
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const students = storage
    .getStudents()
    .filter((s) => s.class_id === selectedClassId && s.cycle === 'kindergarten');

  // État local de la feuille d'appel du jour
  const existingRecord = storage.getAttendanceByClassAndDate(selectedClassId, date);

  const [records, setRecords] = useState<{
    [studentId: string]: {
      status: 'present' | 'absent_justified' | 'absent_unjustified' | 'late';
      arrivalTime: string;
      departureTime: string;
      pickedUpBy: string;
    };
  }>(() => {
    const initial: any = {};
    students.forEach((s) => {
      const match = existingRecord?.records.find((r) => r.student_id === s.id);
      initial[s.id] = {
        status: match?.status || 'present',
        arrivalTime: match?.arrival_time || '07:45',
        departureTime: match?.departure_time || '',
        pickedUpBy: match?.picked_up_by || '',
      };
    });
    return initial;
  });

  const handleStatusChange = (studentId: string, status: any) => {
    setRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const handleFieldChange = (studentId: string, field: string, val: string) => {
    setRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: val,
      },
    }));
  };

  const handleSave = () => {
    const recordPayload: AttendanceRecord = {
      id: `${selectedClassId}_${date}`,
      school_id: storage.getSchoolConfig().id,
      class_id: selectedClassId,
      date,
      cycle: 'kindergarten',
      records: students.map((s) => ({
        student_id: s.id,
        status: records[s.id]?.status || 'present',
        arrival_time: records[s.id]?.arrivalTime,
        departure_time: records[s.id]?.departureTime,
        picked_up_by: records[s.id]?.pickedUpBy,
      })),
    };

    storage.setAttendance(recordPayload);
    storage.logAudit(
      'ATTENDANCE_RECORDED',
      `Pointage Maternelle enregistré pour la classe ${selectedClassId} (${date})`
    );
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const selectedClass = classes.find((c) => c.id === selectedClassId);

  return (
    <div className="space-y-4">
      {/* Barre de sélection de classe et date */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
        <div className="flex items-center gap-2">
          <Baby className="w-5 h-5 text-pink-600" />
          <span className="text-xs font-bold text-gray-700 uppercase">Classe Maternelle :</span>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="p-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-900"
          >
            {kindergartenClasses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="p-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold"
            />
          </div>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer le pointage</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Pointage quotidien de la maternelle sauvegardé localement avec succès !</span>
        </div>
      )}

      {/* Grille des élèves pour pointage Arrivée / Sortie */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {students.map((st) => {
          const rec = records[st.id] || {
            status: 'present',
            arrivalTime: '07:45',
            departureTime: '',
            pickedUpBy: '',
          };

          return (
            <div
              key={st.id}
              className={`p-4 rounded-2xl border transition-all ${
                rec.status === 'present'
                  ? 'bg-white border-gray-200 shadow-xs'
                  : 'bg-red-50/50 border-red-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 text-sm">
                      {st.last_name} {st.first_name}
                    </span>
                    <span className="text-[10px] font-mono text-gray-500">
                      ({st.student_number})
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    Parent : {st.parent_name} ({st.parent_phone})
                  </div>
                </div>

                {/* Statut de présence */}
                <select
                  value={rec.status}
                  onChange={(e) => handleStatusChange(st.id, e.target.value)}
                  className={`p-1 rounded-lg text-xs font-bold border ${
                    rec.status === 'present'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-red-50 text-red-700 border-red-300'
                  }`}
                >
                  <option value="present">Présent(e)</option>
                  <option value="absent_unjustified">Absent(e)</option>
                  <option value="late">En retard</option>
                </select>
              </div>

              {/* Alerte Santé / Allergies si présente */}
              {(st.allergies || st.health_notes) && (
                <div className="mt-2 p-1.5 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-1.5 text-[11px] text-amber-900">
                  <HeartPulse className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span className="font-semibold">Santé : {st.allergies || st.health_notes}</span>
                </div>
              )}

              {/* Pointage Entrée & Sortie (Sécurité Maternelle) */}
              {rec.status !== 'absent_unjustified' && (
                <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {/* Arrivée le matin */}
                  <div className="bg-gray-50 p-2 rounded-xl">
                    <span className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                      <Clock className="w-3 h-3 text-emerald-600" /> Arrivée le matin
                    </span>
                    <input
                      type="time"
                      value={rec.arrivalTime}
                      onChange={(e) => handleFieldChange(st.id, 'arrivalTime', e.target.value)}
                      className="mt-1 w-full p-1 bg-white border border-gray-200 rounded text-xs font-semibold"
                    />
                  </div>

                  {/* Départ l'après-midi + Personne autorisée */}
                  <div className="bg-gray-50 p-2 rounded-xl">
                    <span className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                      <Clock className="w-3 h-3 text-pink-600" /> Sortie / Adulte
                    </span>
                    <div className="mt-1 space-y-1">
                      <input
                        type="time"
                        value={rec.departureTime}
                        onChange={(e) => handleFieldChange(st.id, 'departureTime', e.target.value)}
                        placeholder="Heure départ"
                        className="w-full p-1 bg-white border border-gray-200 rounded text-xs"
                      />
                      <select
                        value={rec.pickedUpBy}
                        onChange={(e) => handleFieldChange(st.id, 'pickedUpBy', e.target.value)}
                        className="w-full p-1 bg-white border border-gray-200 rounded text-[11px] font-medium"
                      >
                        <option value="">Sélectionner qui récupère l'enfant...</option>
                        <option value={st.parent_name}>{st.parent_name} (Parent direct)</option>
                        {st.authorized_pickups?.map((p) => (
                          <option key={p.id} value={`${p.name} (${p.relation})`}>
                            {p.name} ({p.relation})
                          </option>
                        ))}
                        <option value="Autre personne vérifiée">Autre personne vérifiée</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
