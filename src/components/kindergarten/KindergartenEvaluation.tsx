import React, { useState } from 'react';
import { Student, SchoolClass, KindergartenReport, KindergartenDomain, SkillLevel } from '../../types';
import { storage } from '../../services/storage';
import { Baby, Star, Award, CheckCircle2, FileText, Printer, Save, User } from 'lucide-react';

interface KindergartenEvaluationProps {
  classes: SchoolClass[];
}

const DEFAULT_DOMAINS: KindergartenDomain[] = [
  {
    id: 'dom_langage',
    title: '1. Langage & Communication',
    skills: [
      { id: 'sk_1', label: 'S\'exprime clairement en phrases simples', level: 'ACQUIS' },
      { id: 'sk_2', label: 'Écoute et comprend une consigne collective', level: 'ACQUIS' },
      { id: 'sk_3', label: 'Participe aux comptines et récits oraux', level: 'EN_COURS' },
    ],
    observation: 'Très bonne participation orale aux moments de regroupement.',
  },
  {
    id: 'dom_motricite',
    title: '2. Motricité & Schéma Corporel',
    skills: [
      { id: 'sk_4', label: 'Tient correctement son crayon / pinceau', level: 'ACQUIS' },
      { id: 'sk_5', label: 'Coordination générale (sauter, courir, équilibre)', level: 'ACQUIS' },
      { id: 'sk_6', label: 'Découpage et collage selon une ligne', level: 'EN_COURS' },
    ],
    observation: 'Progrès constants en motricité fine et graphisme.',
  },
  {
    id: 'dom_eveil',
    title: '3. Éveil Scientifique & Structuration',
    skills: [
      { id: 'sk_7', label: 'Reconnaît les formes et les couleurs de base', level: 'ACQUIS' },
      { id: 'sk_8', label: 'Dénombre de petites collections (1 à 10)', level: 'EN_COURS' },
      { id: 'sk_9', label: 'Se repère dans l\'espace (haut/bas, devant/derrière)', level: 'ACQUIS' },
    ],
    observation: 'Curieux et attentif lors des ateliers de manipulation.',
  },
  {
    id: 'dom_autonomie',
    title: '4. Autonomie & Vie Collective',
    skills: [
      { id: 'sk_10', label: 'Range ses affaires et respecte le matériel', level: 'ACQUIS' },
      { id: 'sk_11', label: 'Partage les jeux avec ses camarades', level: 'ACQUIS' },
      { id: 'sk_12', label: 'Autonomie aux toilettes et au lavage des mains', level: 'ACQUIS' },
    ],
    observation: 'Enfant très sociable et bien intégré dans le groupe.',
  },
  {
    id: 'dom_arts',
    title: '5. Sensibilité Artistique & Créativité',
    skills: [
      { id: 'sk_13', label: 'Prend plaisir à peindre et modeler', level: 'ACQUIS' },
      { id: 'sk_14', label: 'Mémorise et chante en rythme', level: 'ACQUIS' },
    ],
    observation: 'Créatif et enthousiaste.',
  },
];

export const KindergartenEvaluation: React.FC<KindergartenEvaluationProps> = ({ classes }) => {
  const school = storage.getSchoolConfig();
  const kindergartenClasses = classes.filter((c) => c.cycle === 'kindergarten');
  const [selectedClassId, setSelectedClassId] = useState<string>(kindergartenClasses[0]?.id || '');
  const [selectedPeriod, setSelectedPeriod] = useState<'T1' | 'T2' | 'T3'>('T1');

  const students = storage
    .getStudents()
    .filter((s) => s.class_id === selectedClassId && s.cycle === 'kindergarten');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');

  // Charger ou initialiser les bilans qualitatifs
  const existingReports = storage.getKindergartenReports();
  const currentReport = existingReports.find(
    (r) => r.student_id === selectedStudentId && r.period === selectedPeriod
  );

  const [domains, setDomains] = useState<KindergartenDomain[]>(
    currentReport ? currentReport.domains : DEFAULT_DOMAINS
  );
  const [generalObs, setGeneralObs] = useState<string>(
    currentReport?.general_observation || 'Très bon trimestre dans l\'ensemble. Poursuivre ainsi !'
  );
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  const selectedStudent = students.find((s) => s.id === selectedStudentId);
  const currentClass = classes.find((c) => c.id === selectedClassId);

  const handleStudentSelect = (studentId: string) => {
    setSelectedStudentId(studentId);
    const rep = existingReports.find(
      (r) => r.student_id === studentId && r.period === selectedPeriod
    );
    if (rep) {
      setDomains(rep.domains);
      setGeneralObs(rep.general_observation);
    } else {
      setDomains(DEFAULT_DOMAINS);
      setGeneralObs('Très bon trimestre dans l\'ensemble.');
    }
  };

  const handleSkillLevelChange = (domainIndex: number, skillIndex: number, level: SkillLevel) => {
    const updated = [...domains];
    updated[domainIndex].skills[skillIndex].level = level;
    setDomains(updated);
  };

  const handleDomainObservationChange = (domainIndex: number, text: string) => {
    const updated = [...domains];
    updated[domainIndex].observation = text;
    setDomains(updated);
  };

  const handleSaveReport = () => {
    if (!selectedStudentId) return;
    const report: KindergartenReport = {
      id: `krep_${selectedStudentId}_${selectedPeriod}`,
      student_id: selectedStudentId,
      class_id: selectedClassId,
      period: selectedPeriod,
      domains,
      general_observation: generalObs,
      educator_signature_date: new Date().toISOString().slice(0, 10),
    };

    storage.saveKindergartenReport(report);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const getBadgeStyle = (lvl: SkillLevel) => {
    switch (lvl) {
      case 'ACQUIS':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'EN_COURS':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'A_ENCOURAGER':
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  return (
    <div className="space-y-4">
      {/* Sélecteurs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
        <div className="flex items-center gap-3">
          <Baby className="w-5 h-5 text-pink-600" />
          <select
            value={selectedClassId}
            onChange={(e) => {
              setSelectedClassId(e.target.value);
              const st = storage
                .getStudents()
                .filter((s) => s.class_id === e.target.value && s.cycle === 'kindergarten');
              if (st.length > 0) setSelectedStudentId(st[0].id);
            }}
            className="p-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-900"
          >
            {kindergartenClasses.map((c) => (
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

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPrintModal(true)}
            disabled={!selectedStudent}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <Printer className="w-4 h-4 text-gray-600" />
            <span>Bulletin Descriptif PDF</span>
          </button>

          <button
            onClick={handleSaveReport}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer le Bilan</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Bilan qualitatif de maternelle enregistré avec succès !</span>
        </div>
      )}

      {/* Grille : Sélection de l'élève à gauche, Grille de domaines à droite */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Liste des élèves de la classe */}
        <div className="lg:col-span-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-2">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
            Élèves de la section ({students.length})
          </span>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {students.map((st) => (
              <button
                key={st.id}
                onClick={() => handleStudentSelect(st.id)}
                className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                  st.id === selectedStudentId
                    ? 'bg-pink-50 border border-pink-200 font-bold text-pink-900'
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div>
                  <div>
                    {st.last_name} {st.first_name}
                  </div>
                  <div className="text-[10.5px] text-gray-400 font-mono">
                    {st.student_number}
                  </div>
                </div>
                <Award className="w-4 h-4 text-pink-500" />
              </button>
            ))}
          </div>
        </div>

        {/* Formulaire des 5 Domaines d'Éveil */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-6">
          {selectedStudent ? (
            <>
              <div className="border-b border-gray-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-gray-900">
                    Bilan Pédagogique Qualitatif : {selectedStudent.last_name} {selectedStudent.first_name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Section : {currentClass?.name} • Période : {selectedPeriod} • (Aucune note chiffrée)
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-pink-100 text-pink-800 text-xs font-bold rounded-full">
                  Maternelle
                </span>
              </div>

              {/* Domaines */}
              <div className="space-y-4">
                {domains.map((dom, domIdx) => (
                  <div key={dom.id} className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl space-y-2.5">
                    <h4 className="font-bold text-xs text-emerald-800 uppercase tracking-wider">
                      {dom.title}
                    </h4>

                    <div className="space-y-2">
                      {dom.skills.map((sk, skIdx) => (
                        <div
                          key={sk.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-white rounded-lg border border-gray-100 text-xs"
                        >
                          <span className="font-medium text-gray-800">{sk.label}</span>
                          <div className="flex gap-1 shrink-0">
                            {(['ACQUIS', 'EN_COURS', 'A_ENCOURAGER'] as SkillLevel[]).map((lvl) => (
                              <button
                                key={lvl}
                                type="button"
                                onClick={() => handleSkillLevelChange(domIdx, skIdx, lvl)}
                                className={`px-2 py-0.5 rounded text-[10.5px] font-bold border transition-all ${
                                  sk.level === lvl
                                    ? getBadgeStyle(lvl)
                                    : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
                                }`}
                              >
                                {lvl === 'ACQUIS' && 'Acquis'}
                                {lvl === 'EN_COURS' && 'En cours'}
                                {lvl === 'A_ENCOURAGER' && 'À encourager'}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div>
                      <input
                        type="text"
                        placeholder="Observation de l'éducatrice pour ce domaine..."
                        value={dom.observation}
                        onChange={(e) => handleDomainObservationChange(domIdx, e.target.value)}
                        className="w-full p-2 bg-white border border-gray-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Appréciation générale */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Appréciation Générale Trimestrielle
                </label>
                <textarea
                  rows={2}
                  value={generalObs}
                  onChange={(e) => setGeneralObs(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-hidden"
                />
              </div>
            </>
          ) : (
            <p className="text-xs text-gray-400 italic">Veuillez sélectionner un élève.</p>
          )}
        </div>
      </div>

      {/* Modal Aperçu / Impression du Bulletin Descriptif Maternelle */}
      {showPrintModal && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-gray-900 text-sm">
                Bulletin Trimestriel Descriptif - Maternelle
              </h3>
              <button
                onClick={() => setShowPrintModal(false)}
                className="text-gray-400 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="border border-gray-300 p-6 rounded-xl space-y-4 font-sans text-xs">
              <div className="text-center border-b border-gray-300 pb-3">
                <h2 className="font-black text-sm uppercase text-gray-900">{school.name}</h2>
                <p className="text-[10px] text-gray-600">{school.motto} • {school.region}</p>
                <h3 className="font-bold text-xs uppercase mt-2 text-pink-700">
                  LIVRET D'ÉVALUATION ET D'ÉVEIL - MATERNELLE ({selectedPeriod})
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div>
                  <p>Élève : <strong>{selectedStudent.last_name} {selectedStudent.first_name}</strong></p>
                  <p>Matricule : {selectedStudent.student_number}</p>
                </div>
                <div>
                  <p>Classe : <strong>{currentClass?.name}</strong></p>
                  <p>Année : {school.academic_year}</p>
                </div>
              </div>

              <div className="space-y-3">
                {domains.map((dom) => (
                  <div key={dom.id} className="border-b pb-2">
                    <h5 className="font-bold text-gray-800 text-[11px] mb-1">{dom.title}</h5>
                    <div className="space-y-1">
                      {dom.skills.map((sk) => (
                        <div key={sk.id} className="flex justify-between text-[11px]">
                          <span>• {sk.label}</span>
                          <span className="font-semibold text-gray-700">
                            {sk.level === 'ACQUIS' && '✅ Acquis'}
                            {sk.level === 'EN_COURS' && '⏳ En cours d\'acquisition'}
                            {sk.level === 'A_ENCOURAGER' && '🌱 À encourager'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 p-3 rounded-lg border">
                <span className="font-bold">Observation globale de l'éducatrice : </span>
                <p className="italic text-gray-700 mt-1">{generalObs}</p>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-4 text-center text-[11px]">
                <div>
                  <p>Signature de l'Éducatrice :</p>
                  <div className="h-12 border-b border-dashed border-gray-400"></div>
                </div>
                <div>
                  <p>Cachet de la Direction :</p>
                  <div className="h-12 border-b border-dashed border-gray-400"></div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs"
              >
                Imprimer le Livret
              </button>
              <button
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-xs"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
