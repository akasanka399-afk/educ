import React, { useState } from 'react';
import { SchoolClass, SubjectConfig, Assessment, AssessmentGrade, Student } from '../../types';
import { storage } from '../../services/storage';
import { BookOpen, Save, CheckCircle2, Calculator, Calendar, Award } from 'lucide-react';

interface GradeEntryProps {
  classes: SchoolClass[];
}

export const GradeEntry: React.FC<GradeEntryProps> = ({ classes }) => {
  const primaryClasses = classes.filter((c) => c.cycle === 'primary');
  const [selectedClassId, setSelectedClassId] = useState<string>(primaryClasses[0]?.id || '');
  const currentClass = classes.find((c) => c.id === selectedClassId);

  const subjects = currentClass?.subjects || [];
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(subjects[0]?.id || '');
  const [period, setPeriod] = useState<'T1' | 'T2' | 'T3'>('T1');
  const [evalType, setEvalType] = useState<'INTERRO' | 'DEVOIR' | 'COMPOSITION'>('DEVOIR');
  const [evalTitle, setEvalTitle] = useState<string>('Devoir N°1 de Trimestre');
  const [evalDate, setEvalDate] = useState<string>(new Date().toISOString().slice(0, 10));

  const currentSubject = subjects.find((s) => s.id === selectedSubjectId);
  const maxScore = currentSubject?.max_score || 10;

  const students = storage
    .getStudents()
    .filter((s) => s.class_id === selectedClassId && s.cycle === 'primary');

  // Notes saisies
  const [grades, setGrades] = useState<{ [studentId: string]: { score: number; isAbsent: boolean } }>(() => {
    const init: any = {};
    students.forEach((s) => {
      init[s.id] = { score: 7.5, isAbsent: false };
    });
    return init;
  });

  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const handleScoreChange = (studentId: string, val: string) => {
    const num = parseFloat(val);
    setGrades((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        score: isNaN(num) ? 0 : Math.min(maxScore, Math.max(0, num)),
      },
    }));
  };

  const handleAbsentToggle = (studentId: string, isAbsent: boolean) => {
    setGrades((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        isAbsent,
      },
    }));
  };

  const handleSaveAssessment = () => {
    if (!currentClass || !currentSubject) return;

    const newAssessment: Assessment = {
      id: `eval_${selectedClassId}_${selectedSubjectId}_${period}_${Date.now()}`,
      school_id: storage.getSchoolConfig().id,
      class_id: selectedClassId,
      subject_id: selectedSubjectId,
      period,
      type: evalType,
      title: evalTitle,
      max_score: maxScore,
      date: evalDate,
      grades: students.map((s) => ({
        student_id: s.id,
        score: grades[s.id]?.score || 0,
        is_absent: grades[s.id]?.isAbsent || false,
      })),
    };

    storage.addOrUpdateAssessment(newAssessment);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-4">
      {/* Paramètres de l'évaluation */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-gray-900 text-sm">
              Saisie des Évaluations & Notes (Primaire)
            </h3>
          </div>

          <button
            onClick={handleSaveAssessment}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer les Notes</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="block font-bold text-gray-700 mb-1">Classe</label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                const cls = classes.find((c) => c.id === e.target.value);
                if (cls && cls.subjects.length > 0) {
                  setSelectedSubjectId(cls.subjects[0].id);
                }
              }}
              className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg font-semibold"
            >
              {primaryClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Matière & Coef</label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg font-semibold"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} (Coef {s.coefficient} / Barème /{s.max_score})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Trimestre</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg font-semibold"
            >
              <option value="T1">1er Trimestre (T1)</option>
              <option value="T2">2ème Trimestre (T2)</option>
              <option value="T3">3ème Trimestre (T3)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Type d'épreuve</label>
            <select
              value={evalType}
              onChange={(e) => setEvalType(e.target.value as any)}
              className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg font-semibold"
            >
              <option value="INTERRO">Interrogation écrite</option>
              <option value="DEVOIR">Devoir sur table</option>
              <option value="COMPOSITION">Composition trimestrielle</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={evalDate}
              onChange={(e) => setEvalDate(e.target.value)}
              className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg"
            />
          </div>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Notes enregistrées et sauvegardées localement !</span>
        </div>
      )}

      {/* Grille de saisie par élève */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-xs">
          <span className="font-bold text-gray-700 uppercase">
            Liste de la classe : {currentClass?.name} ({students.length} élèves)
          </span>
          <span className="font-semibold text-emerald-700">
            Barème de notation : / {maxScore} points (Coefficient {currentSubject?.coefficient || 1})
          </span>
        </div>

        <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
          {students.map((st, idx) => {
            const gradeInfo = grades[st.id] || { score: 0, isAbsent: false };
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
                    <div className="text-[10.5px] text-gray-400 font-mono">
                      {st.student_number}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Absent toggle */}
                  <label className="flex items-center gap-1.5 cursor-pointer text-gray-500">
                    <input
                      type="checkbox"
                      checked={gradeInfo.isAbsent}
                      onChange={(e) => handleAbsentToggle(st.id, e.target.checked)}
                      className="rounded text-red-600"
                    />
                    <span className="text-[11px]">Absent</span>
                  </label>

                  {/* Saisie note */}
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      max={maxScore}
                      disabled={gradeInfo.isAbsent}
                      value={gradeInfo.isAbsent ? '' : gradeInfo.score}
                      onChange={(e) => handleScoreChange(st.id, e.target.value)}
                      className={`w-20 p-2 text-center text-sm font-bold rounded-lg border focus:outline-hidden ${
                        gradeInfo.isAbsent
                          ? 'bg-gray-100 text-gray-400 border-gray-200'
                          : gradeInfo.score >= maxScore * 0.5
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-red-50 text-red-700 border-red-300'
                      }`}
                    />
                    <span className="text-gray-400 font-bold text-xs">/ {maxScore}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
