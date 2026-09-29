import React, { useState, useCallback } from 'react';
import { SchoolConfig, UserProfile, Student, Payment, SchoolClass } from '../types';
import { storage } from '../services/storage';
import { formatFCFA, formatDateFR } from '../utils/formatters';
import { useSyncData } from '../hooks/useSyncData';
import {
  Users,
  Wallet,
  GraduationCap,
  Baby,
  BookOpen,
  ArrowUpRight,
  Clock,
  Printer,
  Share2,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Receipt,
  MessageCircle,
  Phone,
  ShieldCheck,
  UserCheck,
  CreditCard,
} from 'lucide-react';

interface DashboardProps {
  school: SchoolConfig;
  currentUser: UserProfile;
  onNavigateTab: (tab: any) => void;
  onOpenReceipt: (payment: Payment) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  school,
  currentUser,
  onNavigateTab,
  onOpenReceipt,
}) => {
  const [students, setStudents] = useState<Student[]>(storage.getStudents());
  const [payments, setPayments] = useState<Payment[]>(storage.getPayments().filter((p) => !p.is_cancelled));
  const [classes, setClasses] = useState<SchoolClass[]>(storage.getClasses());

  useSyncData(
    useCallback(() => {
      setStudents(storage.getStudents());
      setPayments(storage.getPayments().filter((p) => !p.is_cancelled));
      setClasses(storage.getClasses());
    }, [])
  );

  // Chiffres clés
  const totalStudents = students.length;
  const kindergartenStudents = students.filter((s) => s.cycle === 'kindergarten').length;
  const primaryStudents = students.filter((s) => s.cycle === 'primary').length;

  const totalCollected = payments.reduce((sum, p) => sum + p.amount_fcfa, 0);

  const totalFeesDue = students.reduce(
    (sum, s) => sum + (s.total_fees - s.discount),
    0
  );
  const totalUnpaid = Math.max(0, totalFeesDue - totalCollected);
  const recoveryRate = totalFeesDue > 0 ? Math.round((totalCollected / totalFeesDue) * 100) : 0;

  const isPaymentToday = (p: Payment) => {
    if (!p.created_at) return false;
    const paymentDate = new Date(p.created_at);
    const now = new Date();
    const isSameLocalDate =
      paymentDate.getFullYear() === now.getFullYear() &&
      paymentDate.getMonth() === now.getMonth() &&
      paymentDate.getDate() === now.getDate();
    const isSameIsoDate = p.created_at.slice(0, 10) === now.toISOString().slice(0, 10);
    return isSameLocalDate || isSameIsoDate;
  };

  const todayPayments = payments.filter(isPaymentToday);
  const todayTotal = todayPayments.reduce((sum, p) => sum + p.amount_fcfa, 0);

  // Dernières transactions
  const recentPayments = payments.slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-6">
      {/* Bandeau d'accueil et raccourcis rapides */}
      <div className="bg-linear-to-r from-emerald-800 to-teal-900 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-semibold backdrop-blur-xs">
            <span>Année Scolaire {school.academic_year}</span>
            <span>•</span>
            <span>Burkina Faso</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-black tracking-tight">
            Bienvenue, {currentUser.name}
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100">
            Tableau de bord de gestion intégrée : scolarité en FCFA, PWA hors-ligne, reçus thermiques 80 mm et communications parents.
          </p>

          {/* Raccourcis tactiles rapides */}
          <div className="pt-3 flex flex-wrap gap-2 text-xs font-bold">
            <button
              onClick={() => onNavigateTab('cash')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-gray-950 rounded-xl shadow-xs transition-colors"
            >
              <Wallet className="w-4 h-4" />
              <span>Guichet Encaissement</span>
            </button>

            <button
              onClick={() => onNavigateTab('students')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl backdrop-blur-xs transition-colors"
            >
              <Users className="w-4 h-4" />
              <span>Inscrire un Élève</span>
            </button>

            {['school_admin', 'founder', 'director'].includes(currentUser.role) && (
              <button
                onClick={() => onNavigateTab('staff')}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-xs transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Gestion Équipe & Accès</span>
              </button>
            )}

            <button
              onClick={() => onNavigateTab('id-cards')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl shadow-xs transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              <span>Cartes Scolaires & Badges</span>
            </button>

            <button
              onClick={() => onNavigateTab('whatsapp')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl shadow-xs transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>Relances WhatsApp</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cartes Métriques Clés de l'Établissement (Visibles par l'Admin) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Recettes du jour */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-1 hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase tracking-wider">
            <span>Recettes du Jour</span>
            <span className="p-1 rounded-lg bg-emerald-100 text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-2">
            {formatFCFA(todayTotal)}
          </div>
          <div className="text-[11px] text-gray-500 font-medium">
            {todayPayments.length} encaissement(s) aujourd'hui
          </div>
        </div>

        {/* 2. Cumul Encaissé */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-1 hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase tracking-wider">
            <span>Cumul Encaissé</span>
            <span className="p-1 rounded-lg bg-blue-100 text-blue-700">
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-gray-900 mt-2">
            {formatFCFA(totalCollected)}
          </div>
          <div className="text-[11px] text-emerald-600 font-bold">
            Taux de recouvrement : {recoveryRate}%
          </div>
        </div>

        {/* 3. Reliquats à Recouvrer */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-1 hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between text-amber-700 text-xs font-bold uppercase tracking-wider">
            <span>Reliquat à Recouvrer</span>
            <span className="p-1 rounded-lg bg-amber-100 text-amber-800">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-900 mt-2">
            {formatFCFA(totalUnpaid)}
          </div>
          <div className="text-[11px] text-gray-500 font-medium">
            Créances scolaires restantes
          </div>
        </div>

        {/* 4. Effectif Total */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs space-y-1 hover:border-purple-300 transition-all">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold uppercase tracking-wider">
            <span>Effectif Total</span>
            <span className="p-1 rounded-lg bg-purple-100 text-purple-700">
              <GraduationCap className="w-4 h-4" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-gray-900 mt-2">
            {totalStudents} élève{totalStudents > 1 ? 's' : ''}
          </div>
          <div className="text-[11px] text-gray-500 font-medium">
            {kindergartenStudents} Maternelle • {primaryStudents} Primaire
          </div>
        </div>
      </div>

      {/* Section Deux Colonnes : Avancement & Derniers Encaissements */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Progression du recouvrement par classe */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <h3 className="font-bold text-gray-900 text-sm flex items-center justify-between border-b pb-2">
            <span>Taux de Recouvrement par Classe</span>
            <span className="text-xs text-gray-400 font-normal">Objectif 100%</span>
          </h3>

          <div className="space-y-3 text-xs">
            {classes.map((cls) => {
              const classStudents = students.filter((s) => s.class_id === cls.id);
              const classTotalDue = classStudents.reduce(
                (sum, s) => sum + (s.total_fees - s.discount),
                0
              );
              const classPaid = classStudents.reduce((sum, s) => sum + s.paid_amount, 0);
              const rate = classTotalDue > 0 ? Math.round((classPaid / classTotalDue) * 100) : 0;

              return (
                <div key={cls.id} className="space-y-1">
                  <div className="flex justify-between font-semibold">
                    <span className="text-gray-800">
                      {cls.name}{' '}
                      <span className="text-gray-400 font-normal text-[11px]">
                        ({classStudents.length} élèves)
                      </span>
                    </span>
                    <span className="text-emerald-700 font-bold">{rate}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        rate >= 80 ? 'bg-emerald-600' : rate >= 50 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(100, rate)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Corps Enseignant & Contacts WhatsApp */}
        <div className="lg:col-span-12 bg-white p-5 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
            <div>
              <h3 className="font-bold text-gray-900 text-sm sm:text-base flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-600" />
                <span>Corps Enseignant & Éducatrices de l'Établissement</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {storage.getUsersBySchool(school.id).filter((u) => u.role === 'teacher').length} enseignants
                </span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Liste officielle des maîtres et éducatrices intervenant dans l'école avec numéro WhatsApp direct
              </p>
            </div>

            {['school_admin', 'founder', 'director'].includes(currentUser.role) && (
              <button
                onClick={() => onNavigateTab('staff')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-200 transition-colors shrink-0"
              >
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span>Gérer les accès & l'équipe</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {storage
              .getUsersBySchool(school.id)
              .filter((u) => u.role === 'teacher')
              .map((teacher) => {
                const assignedClasses = classes.filter((c) =>
                  (teacher.assigned_class_ids || []).includes(c.id)
                );
                const rawPhone = teacher.phone.replace(/[^0-9]/g, '');
                const waUrl = `https://wa.me/${rawPhone.startsWith('226') ? rawPhone : '226' + rawPhone}`;

                return (
                  <div
                    key={teacher.id}
                    className="p-3.5 rounded-xl border border-gray-150 bg-gray-50/70 hover:bg-white hover:border-indigo-200 hover:shadow-xs transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-800 font-black text-xs flex items-center justify-center shrink-0">
                          {teacher.name.split(' ').slice(1, 3).map((n) => n[0]).join('') || 'EN'}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-xs sm:text-sm leading-tight">
                            {teacher.name}
                          </h4>
                          <span className="text-[11px] text-gray-500">{teacher.email}</span>
                        </div>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 shrink-0">
                        Enseignant
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs pt-1 border-t border-gray-200/60">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-gray-500">Classes assignées :</span>
                        <div className="flex flex-wrap gap-1 justify-end max-w-[65%]">
                          {assignedClasses.length > 0 ? (
                            assignedClasses.map((cls) => (
                              <span
                                key={cls.id}
                                className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-gray-200 text-gray-800"
                              >
                                {cls.level}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400 italic">Non assigné</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-1.5 text-gray-700 font-mono font-semibold text-xs">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          <span>{teacher.phone}</span>
                        </div>

                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#25D366] hover:bg-[#20ba59] text-white text-[11px] font-bold shadow-2xs transition-colors shrink-0"
                          title="Discuter directement sur WhatsApp"
                        >
                          <MessageCircle className="w-3 h-3 fill-current" />
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};
