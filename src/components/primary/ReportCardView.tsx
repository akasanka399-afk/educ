import React, { useState } from 'react';
import { SchoolClass, Student, ReportCard, ReportCardGrade } from '../../types';
import { storage } from '../../services/storage';
import { BookOpen, Printer, Award, FileText, CheckCircle2, ChevronRight } from 'lucide-react';

interface ReportCardViewProps {
  classes: SchoolClass[];
}

export const ReportCardView: React.FC<ReportCardViewProps> = ({ classes }) => {
  const school = storage.getSchoolConfig();
  const primaryClasses = classes.filter((c) => c.cycle === 'primary');
  const [selectedClassId, setSelectedClassId] = useState<string>(primaryClasses[0]?.id || '');
  const [selectedPeriod, setSelectedPeriod] = useState<'T1' | 'T2' | 'T3'>('T1');

  const currentClass = classes.find((c) => c.id === selectedClassId);
  const students = storage
    .getStudents()
    .filter((s) => s.class_id === selectedClassId && s.cycle === 'primary');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  // Moteur de calcul des bulletins de la classe
  const calculateStudentReportCard = (st: Student): ReportCard => {
    const subjects = currentClass?.subjects || [];
    let totalWeighted = 0;
    let totalMaxWeighted = 0;

    // Simulation déterministe basée sur les compétences de l'élève pour le prototype
    const grades: ReportCardGrade[] = subjects.map((sub, idx) => {
      // Barème par défaut sur 10 au primaire burkinabè (ou 20 selon config)
      const baseMax = sub.max_score || 10;
      // Note simulée réaliste pour l'élève
      const seed = (st.id.charCodeAt(st.id.length - 1) + idx * 3) % 4;
      const score = Math.min(baseMax, baseMax * 0.65 + seed * 0.75);
      const weighted = score * sub.coefficient;

      totalWeighted += weighted;
      totalMaxWeighted += baseMax * sub.coefficient;

      let appreciation = 'Passable';
      const pct = score / baseMax;
      if (pct >= 0.85) appreciation = 'Très Bien';
      else if (pct >= 0.7) appreciation = 'Bien';
      else if (pct >= 0.6) appreciation = 'Assez Bien';
      else if (pct >= 0.5) appreciation = 'Passable';
      else appreciation = 'Insuffisant';

      return {
        subject_id: sub.id,
        subject_name: sub.name,
        coefficient: sub.coefficient,
        max_score: baseMax,
        average_score: Math.round(score * 10) / 10,
        weighted_score: Math.round(weighted * 10) / 10,
        appreciation,
      };
    });

    const totalCoefs = subjects.reduce((sum, s) => sum + s.coefficient, 0) || 1;
    // Moyenne générale sur 10 (standard primaire BF)
    const periodAverage = Math.round((totalWeighted / totalCoefs) * 100) / 100;

    let directorDecision = 'Tableau d\'Honneur';
    if (periodAverage >= 8.5) directorDecision = 'Félicitations & Tableau d\'Honneur';
    else if (periodAverage >= 7.0) directorDecision = 'Encouragements du Conseil';
    else if (periodAverage >= 5.0) directorDecision = 'Travail Moyen - Peut mieux faire';
    else directorDecision = 'Avertissement de Travail';

    return {
      id: `rep_${st.id}_${selectedPeriod}`,
      student_id: st.id,
      student_name: `${st.last_name} ${st.first_name}`,
      student_number: st.student_number,
      class_id: selectedClassId,
      class_name: currentClass?.name || 'Primaire',
      period: selectedPeriod,
      grades,
      total_weighted: Math.round(totalWeighted * 10) / 10,
      total_max_weighted: totalMaxWeighted,
      period_average: periodAverage,
      base_scale: 10,
      class_average: 7.15,
      rank: 1, // sera recalculé ci-après
      total_students: students.length,
      absences_count: 0,
      teacher_remarks: 'Élève attentif et sérieux. Bon niveau général dans les matières fondamentales.',
      director_decision: directorDecision,
    };
  };

  // Calcul pour tous les élèves de la classe afin d'établir le classement officiel
  const allReports = students.map((s) => calculateStudentReportCard(s));
  allReports.sort((a, b) => b.period_average - a.period_average);
  allReports.forEach((rep, idx) => {
    rep.rank = idx + 1;
  });

  const activeReport = allReports.find((r) => r.student_id === selectedStudentId);

  return (
    <div className="space-y-4">
      {/* Sélecteurs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-emerald-600" />
          <select
            value={selectedClassId}
            onChange={(e) => {
              setSelectedClassId(e.target.value);
              const st = storage
                .getStudents()
                .filter((s) => s.class_id === e.target.value && s.cycle === 'primary');
              if (st.length > 0) setSelectedStudentId(st[0].id);
            }}
            className="p-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-900"
          >
            {primaryClasses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="p-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-900"
          >
            <option value="T1">1er Trimestre (T1)</option>
            <option value="T2">2ème Trimestre (T2)</option>
            <option value="T3">3ème Trimestre (T3)</option>
          </select>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
        >
          <Printer className="w-4 h-4" />
          <span>Imprimer le Bulletin Officiel (A4)</span>
        </button>
      </div>

      {/* Grille : Liste des élèves et Aperçu Bulletin */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Liste des élèves avec leur rang */}
        <div className="lg:col-span-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-2">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
            Classement de la classe ({allReports.length} élèves)
          </span>
          <div className="space-y-1 max-h-[500px] overflow-y-auto">
            {allReports.map((rep) => (
              <button
                key={rep.student_id}
                onClick={() => setSelectedStudentId(rep.student_id)}
                className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                  rep.student_id === selectedStudentId
                    ? 'bg-emerald-50 border border-emerald-300 font-bold text-emerald-900'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      rep.rank === 1
                        ? 'bg-amber-400 text-white'
                        : rep.rank <= 3
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {rep.rank}
                  </span>
                  <div>
                    <div>{rep.student_name}</div>
                    <div className="text-[10px] text-gray-400 font-mono">
                      {rep.student_number}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">{rep.period_average} / 10</div>
                  <div className="text-[9.5px] text-gray-500">Moyenne</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Aperçu Officiel du Bulletin (Format Conforme Écoles BF) */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
          {activeReport && selectedStudent ? (
            <div id="official-report-card" className="border-2 border-gray-800 p-6 rounded-sm space-y-4 font-serif text-xs">
              {/* En-tête officiel République du Burkina Faso */}
              <div className="flex justify-between items-start border-b-2 border-gray-800 pb-3">
                <div className="text-center font-sans space-y-0.5 max-w-[240px]">
                  <p className="font-bold text-[11px] uppercase">Burkina Faso</p>
                  <p className="text-[9.5px] italic">Unité - Progrès - Justice</p>
                  <p className="text-[9px] uppercase text-gray-600">Ministère de l'Éducation Nationale</p>
                  <p className="text-[9px] font-semibold">{school.region}</p>
                </div>

                <div className="text-center font-sans">
                  <h3 className="font-black text-sm uppercase text-gray-900">{school.name}</h3>
                  <p className="text-[10px] italic text-gray-600">{school.motto}</p>
                  <p className="text-[10px] text-gray-700">Tél: {school.phone}</p>
                  <div className="mt-2 py-1 px-4 bg-gray-100 border border-gray-400 font-bold text-xs uppercase tracking-wider">
                    Bulletin du {selectedPeriod}
                  </div>
                </div>

                <div className="text-right font-sans text-[10px] space-y-0.5">
                  <p>Année Scolaire : <strong>{school.academic_year}</strong></p>
                  <p>Classe : <strong>{activeReport.class_name}</strong></p>
                  <p>Effectif : <strong>{activeReport.total_students} élèves</strong></p>
                </div>
              </div>

              {/* Fiche Élève */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-2.5 border border-gray-300 font-sans text-xs">
                <div>
                  <p>Nom & Prénom(s) : <strong className="text-sm">{activeReport.student_name}</strong></p>
                  <p>Matricule : <span className="font-mono font-bold">{activeReport.student_number}</span></p>
                </div>
                <div className="text-right">
                  <p>Rang : <strong className="text-emerald-700 text-sm">{activeReport.rank}e sur {activeReport.total_students}</strong></p>
                  <p>Moyenne de la classe : <strong>{activeReport.class_average} / 10</strong></p>
                </div>
              </div>

              {/* Tableau des Matières & Notes */}
              <table className="w-full text-left border-collapse border border-gray-800 text-xs font-sans">
                <thead>
                  <tr className="bg-gray-100 text-gray-900 border-b border-gray-800">
                    <th className="p-2 border-r border-gray-800">Matières Enseignées</th>
                    <th className="p-2 text-center border-r border-gray-800">Barème</th>
                    <th className="p-2 text-center border-r border-gray-800">Coef</th>
                    <th className="p-2 text-center border-r border-gray-800">Note / 10</th>
                    <th className="p-2 text-center border-r border-gray-800">Note Pondérée</th>
                    <th className="p-2">Appréciation du Maître</th>
                  </tr>
                </thead>
                <tbody>
                  {activeReport.grades.map((g) => (
                    <tr key={g.subject_id} className="border-b border-gray-300">
                      <td className="p-2 font-medium border-r border-gray-800">{g.subject_name}</td>
                      <td className="p-2 text-center border-r border-gray-800">/{g.max_score}</td>
                      <td className="p-2 text-center border-r border-gray-800 font-bold">{g.coefficient}</td>
                      <td className="p-2 text-center border-r border-gray-800 font-bold">{g.average_score}</td>
                      <td className="p-2 text-center border-r border-gray-800 font-black">{g.weighted_score}</td>
                      <td className="p-2 italic text-[11px] text-gray-700">{g.appreciation}</td>
                    </tr>
                  ))}
                  {/* Totaux & Moyenne générale */}
                  <tr className="bg-gray-50 border-t-2 border-gray-800 font-bold">
                    <td colSpan={4} className="p-2 text-right border-r border-gray-800">
                      TOTAL DES POINTS :
                    </td>
                    <td className="p-2 text-center border-r border-gray-800 font-black text-sm">
                      {activeReport.total_weighted} / {activeReport.total_max_weighted}
                    </td>
                    <td></td>
                  </tr>
                  <tr className="bg-emerald-50/70 border-t border-gray-800 font-bold text-xs">
                    <td colSpan={4} className="p-2 text-right border-r border-gray-800 text-emerald-900">
                      MOYENNE DU TRIMESTRE :
                    </td>
                    <td className="p-2 text-center border-r border-gray-800 font-black text-base text-emerald-900">
                      {activeReport.period_average} / 10
                    </td>
                    <td className="p-2 font-black text-emerald-800">
                      {activeReport.director_decision}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Observations du Maître & Direction */}
              <div className="grid grid-cols-2 gap-4 font-sans text-xs pt-2">
                <div className="border border-gray-400 p-2.5 rounded-sm">
                  <p className="font-bold text-[11px] uppercase">Observation du Maître Titulaire :</p>
                  <p className="italic text-gray-700 mt-1">{activeReport.teacher_remarks}</p>
                </div>
                <div className="border border-gray-400 p-2.5 rounded-sm">
                  <p className="font-bold text-[11px] uppercase">Décision du Conseil des Maîtres :</p>
                  <p className="font-black text-emerald-800 mt-1">{activeReport.director_decision}</p>
                </div>
              </div>

              {/* Signatures & Cachet */}
              <div className="grid grid-cols-2 gap-8 pt-4 font-sans text-[11px] text-center">
                <div>
                  <p>Le Maître de Classe</p>
                  <div className="h-14 border-b border-dotted border-gray-400"></div>
                </div>
                <div>
                  <p>Le Directeur de l'Établissement (Cachet)</p>
                  <div className="h-14 border-b border-dotted border-gray-400"></div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">Veuillez sélectionner un élève.</p>
          )}
        </div>
      </div>
    </div>
  );
};
