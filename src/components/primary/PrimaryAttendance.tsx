import React, { useState } from 'react';
import { SchoolClass, Student, AttendanceRecord } from '../../types';
import { storage } from '../../services/storage';
import { whatsappService } from '../../services/whatsapp';
import { CheckCircle2, Clock, UserX, Share2, Save, Calendar, AlertTriangle } from 'lucide-react';

interface PrimaryAttendanceProps {
  classes: SchoolClass[];
}

export const PrimaryAttendance: React.FC<PrimaryAttendanceProps> = ({ classes }) => {
  const school = storage.getSchoolConfig();
  const primaryClasses = classes.filter((c) => c.cycle === 'primary');
  const [selectedClassId, setSelectedClassId] = useState<string>(primaryClasses[0]?.id || '');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));

  const currentClass = classes.find((c) => c.id === selectedClassId);
  const students = storage
    .getStudents()
    .filter((s) => s.class_id === selectedClassId && s.cycle === 'primary');

  const existingRecord = storage.getAttendanceByClassAndDate(selectedClassId, date);

  const [records, setRecords] = useState<{
    [studentId: string]: 'present' | 'absent_justified' | 'absent_unjustified' | 'late';
  }>(() => {
    const init: any = {};
    students.forEach((s) => {
      const match = existingRecord?.records.find((r) => r.student_id === s.id);
      init[s.id] = match?.status || 'present';
    });
    return init;
  });

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleStatusChange = (studentId: string, status: any) => {
    setRecords((prev) => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSaveAttendance = () => {
    const recordPayload: AttendanceRecord = {
      id: `${selectedClassId}_${date}`,
      school_id: school.id,
      class_id: selectedClassId,
      date,
      cycle: 'primary',
      records: students.map((s) => ({
        student_id: s.id,
        status: records[s.id] || 'present',
      })),
    };

    storage.setAttendance(recordPayload);
    storage.logAudit(
      'ATTENDANCE_RECORDED',
      `Appel du matin Primaire pour la classe ${currentClass?.name} (${date})`
    );
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const absentStudents = students.filter(
    (s) => records[s.id] === 'absent_unjustified'
  );

  const handleAlertParent = (st: Student) => {
    if (!st.parent_phone) return;
    const msg = whatsappService.createAbsenceMessage(
      st,
      currentClass?.name || 'sa classe',
      school
    );
    whatsappService.openWhatsApp(st.parent_phone, msg);
    storage.logWhatsApp({
      student_id: st.id,
      recipient_name: st.parent_name,
      phone: st.parent_phone,
      template_type: 'ALERTE_ABSENCE',
      content: msg,
      status: 'SENT',
    });
  };

  return (
    <div className="space-y-4">
      {/* Barre sélecteurs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-emerald-600" />
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="p-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-900"
          >
            {primaryClasses.map((c) => (
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
        </div>

        <button
          onClick={handleSaveAttendance}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
        >
          <Save className="w-4 h-4" />
          <span>Enregistrer l'Appel</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Feuille d'appel enregistrée !</span>
        </div>
      )}

      {/* Alerte si des élèves sont absents */}
      {absentStudents.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>
              {absentStudents.length} élève(s) absent(s) ce matin sans justification :
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {absentStudents.map((st) => (
              <button
                key={st.id}
                onClick={() => handleAlertParent(st)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs shadow-xs transition-all"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>
                  Alerter parent de {st.last_name} ({st.parent_phone})
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grille de présence tactile */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="divide-y divide-gray-100">
          {students.map((st, idx) => {
            const status = records[st.id] || 'present';
            return (
              <div
                key={st.id}
                className="p-3 flex items-center justify-between hover:bg-gray-50/80 transition-colors text-xs"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center font-mono text-gray-400 font-bold">
                    {idx + 1}.
                  </span>
                  <div>
                    <div className="font-bold text-gray-900">
                      {st.last_name} {st.first_name}
                    </div>
                    <div className="text-[10.5px] text-gray-400">
                      Parent : {st.parent_name} • {st.parent_phone}
                    </div>
                  </div>
                </div>

                {/* Sélecteur de statut tactile 3 boutons */}
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => handleStatusChange(st.id, 'present')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      status === 'present'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Présent
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusChange(st.id, 'absent_unjustified')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      status === 'absent_unjustified'
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    Absent
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusChange(st.id, 'late')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      status === 'late'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    En Retard
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
