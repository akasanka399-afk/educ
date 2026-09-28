import React from 'react';
import { Student, SchoolClass, Payment } from '../types';
import { storage } from '../services/storage';
import { formatFCFA, formatDateFR, displayPhoneFR } from '../utils/formatters';
import { whatsappService } from '../services/whatsapp';
import {
  X,
  User,
  GraduationCap,
  Calendar,
  HeartPulse,
  Users,
  Wallet,
  Phone,
  Share2,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
} from 'lucide-react';

interface StudentDetailModalProps {
  student: Student;
  onClose: () => void;
  onOpenPayment?: (student: Student) => void;
  onOpenCard?: (student: Student) => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  student,
  onClose,
  onOpenPayment,
  onOpenCard,
}) => {
  const school = storage.getSchoolConfig();
  const classes = storage.getClasses();
  const currentClass = classes.find((c) => c.id === student.class_id);
  const studentPayments = storage
    .getPayments()
    .filter((p) => p.student_id === student.id && !p.is_cancelled);

  const remaining = (student.total_fees - student.discount) - student.paid_amount;

  const handleSendWhatsAppReminder = () => {
    if (!student.parent_phone) return;
    const msg = whatsappService.createReminderMessage(
      student,
      currentClass?.name || 'sa classe',
      school
    );
    whatsappService.openWhatsApp(student.parent_phone, msg);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* En-tête de la fiche */}
        <div className="flex items-center justify-between px-6 py-4 bg-emerald-800 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center font-bold text-lg">
              {student.last_name.slice(0, 1)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">
                  {student.last_name} {student.first_name}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20">
                  {student.cycle === 'kindergarten' ? 'Maternelle' : 'Primaire'}
                </span>
              </div>
              <p className="text-xs text-emerald-100">
                Matricule: {student.student_number} • {currentClass?.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenu Déroulant */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Situation Financière */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-700 uppercase flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-emerald-600" />
                Situation Financière & Scolarité
              </span>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                  remaining <= 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {remaining <= 0 ? 'Scolarité Soldée' : `Reste: ${formatFCFA(remaining)}`}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                <span className="text-gray-400 text-[10px]">Total Dû</span>
                <p className="font-bold text-gray-900 mt-0.5">
                  {formatFCFA(student.total_fees - student.discount)}
                </p>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                <span className="text-emerald-600 text-[10px]">Déjà Versé</span>
                <p className="font-bold text-emerald-700 mt-0.5">
                  {formatFCFA(student.paid_amount)}
                </p>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-gray-100">
                <span className="text-amber-600 text-[10px]">Reste à Devoir</span>
                <p className="font-bold text-amber-800 mt-0.5">{formatFCFA(remaining)}</p>
              </div>
            </div>

            {/* Actions rapides sur le compte */}
            <div className="mt-3 flex items-center justify-end gap-2">
              {remaining > 0 && (
                <button
                  onClick={handleSendWhatsAppReminder}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#25D366] text-white hover:bg-[#20ba59]"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Rappeler le parent sur WhatsApp</span>
                </button>
              )}
            </div>
          </div>

          {/* Informations Personnelles & État Civil */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2">
              <h3 className="font-bold text-gray-900 uppercase text-[11px] border-b pb-1">
                Identité de l'élève
              </h3>
              <p className="text-gray-600">
                Date de naissance :{' '}
                <span className="font-semibold text-gray-900">{formatDateFR(student.birth_date)}</span>{' '}
                à {student.birth_place}
              </p>
              <p className="text-gray-600">
                Genre :{' '}
                <span className="font-semibold text-gray-900">
                  {student.gender === 'M' ? 'Masculin (Garçon)' : 'Féminin (Fille)'}
                </span>
              </p>
              {student.is_cep_candidate && (
                <p className="font-bold text-purple-700">
                  ★ Candidat officiel à l'Examen du CEP (CM2)
                </p>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-gray-900 uppercase text-[11px] border-b pb-1">
                Responsable Légal (WhatsApp)
              </h3>
              <p className="text-gray-600">
                Nom : <span className="font-semibold text-gray-900">{student.parent_name}</span>
              </p>
              <p className="text-gray-600">
                Téléphone WhatsApp :{' '}
                <span className="font-mono font-bold text-emerald-700">
                  {displayPhoneFR(student.parent_phone)}
                </span>
              </p>
              {student.parent_profession && (
                <p className="text-gray-600">
                  Profession : <span className="font-semibold">{student.parent_profession}</span>
                </p>
              )}
              {student.parent_address && (
                <p className="text-gray-600">
                  Domicile : <span className="font-semibold">{student.parent_address}</span>
                </p>
              )}
            </div>
          </div>

          {/* Santé & Allergies */}
          {(student.allergies || student.health_notes) && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-red-900">
              <HeartPulse className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Alerte Santé / Allergies :</p>
                <p className="mt-0.5">{student.allergies || student.health_notes}</p>
              </div>
            </div>
          )}

          {/* Personnes autorisées à récupérer l'enfant (Indispensable Maternelle) */}
          <div>
            <h3 className="font-bold text-gray-900 uppercase text-[11px] flex items-center gap-1.5 mb-2">
              <Users className="w-4 h-4 text-emerald-600" />
              Personnes autorisées à récupérer l'enfant à la sortie
            </h3>

            {student.authorized_pickups && student.authorized_pickups.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {student.authorized_pickups.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs space-y-0.5"
                  >
                    <div className="font-bold text-gray-900">{p.name}</div>
                    <div className="text-gray-500">Lien : {p.relation}</div>
                    <div className="text-gray-600 font-mono text-[11px]">Tél : {p.phone}</div>
                    {p.cni && <div className="text-[10px] text-gray-400">CNI : {p.cni}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">
                Seuls les parents directs sont autorisés par défaut.
              </p>
            )}
          </div>

          {/* Historique des paiements de l'élève */}
          <div>
            <h3 className="font-bold text-gray-900 uppercase text-[11px] mb-2">
              Historique des reçus émis
            </h3>
            {studentPayments.length > 0 ? (
              <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100 text-xs">
                {studentPayments.map((p) => (
                  <div key={p.id} className="p-2.5 flex items-center justify-between hover:bg-gray-50">
                    <div>
                      <span className="font-mono font-bold text-gray-900">{p.receipt_number}</span>
                      <span className="text-gray-400 text-[10px] ml-2">
                        {formatDateFR(p.created_at)}
                      </span>
                      <div className="text-[11px] text-gray-500">
                        {p.fee_category} ({p.payment_method.replace('_', ' ')})
                      </div>
                    </div>
                    <div className="font-bold text-emerald-700">{formatFCFA(p.amount_fcfa)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">Aucun versement enregistré pour le moment.</p>
            )}
          </div>
        </div>

        {/* Pied de modal */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-2">
          {onOpenCard && (
            <button
              onClick={() => onOpenCard(student)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              <span>Imprimer Carte Scolaire & Badge</span>
            </button>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-semibold rounded-xl"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
