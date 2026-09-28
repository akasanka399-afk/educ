import React, { useState, useRef } from 'react';
import { SchoolConfig, UserProfile } from '../types';
import { storage } from '../services/storage';
import {
  Building,
  KeyRound,
  Shield,
  ArrowRight,
  Sparkles,
  Lock,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  UserCheck,
  AlertTriangle,
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface SchoolLoginScreenProps {
  onSchoolUnlocked: (school: SchoolConfig, user: UserProfile) => void;
  onOpenSuperAdminPin: () => void;
}

export const SchoolLoginScreen: React.FC<SchoolLoginScreenProps> = ({
  onSchoolUnlocked,
  onOpenSuperAdminPin,
}) => {
  const [accessCode, setAccessCode] = useState<string>('');
  const [selectedSchool, setSelectedSchool] = useState<SchoolConfig | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [userPin, setUserPin] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [subscriptionWarning, setSubscriptionWarning] = useState<string | null>(null);

  // Triple-clic detector
  const clickCountRef = useRef<number>(0);
  const clickTimerRef = useRef<any>(null);

  const handleBrandClick = () => {
    clickCountRef.current += 1;
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);

    if (clickCountRef.current >= 3) {
      clickCountRef.current = 0;
      onOpenSuperAdminPin();
    } else {
      clickTimerRef.current = setTimeout(() => {
        clickCountRef.current = 0;
      }, 500);
    }
  };

  const handleCodeSubmit = (e?: React.FormEvent, overrideCode?: string) => {
    if (e) e.preventDefault();
    const code = (overrideCode || accessCode).trim().toUpperCase();

    if (!code) {
      setError('Veuillez entrer le code d\'accès de votre établissement.');
      return;
    }

    const school = storage.getSchoolByCode(code);
    if (!school) {
      setError(`Code "${code}" introuvable. Vérifiez l'orthographe ou contactez l'administration.`);
      setSelectedSchool(null);
      return;
    }

    // Check subscription
    const subCheck = storage.checkSubscription(school);
    if (!subCheck.isValid) {
      setSubscriptionWarning(subCheck.message || 'Abonnement expiré ou suspendu.');
      setSelectedSchool(school);
      return;
    }

    setSubscriptionWarning(null);
    setError(null);
    setSelectedSchool(school);

    // Preselect director or first user of school
    const schoolUsers = storage.getUsersBySchool(school.id);
    if (schoolUsers.length > 0) {
      setSelectedUser(schoolUsers[0]);
    }
  };

  const handleUserPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchool || !selectedUser) return;

    if (!userPin.trim()) {
      setError('Veuillez saisir votre code PIN.');
      return;
    }

    const isPinValid = storage.verifyUserPin(selectedUser.id, userPin);
    if (!isPinValid) {
      setError(`Code PIN incorrect pour ${selectedUser.name}.`);
      return;
    }

    // Success: activate school and log in user
    storage.setActiveSchoolCode(selectedSchool.access_code);
    storage.setCurrentUser(selectedUser);
    onSchoolUnlocked(selectedSchool, selectedUser);
  };

  const availableSchools = storage.getAllSchools();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Barre supérieure discrète */}
      <header className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        {/* Titre & Logo avec gestionnaire de TRIPLE-CLIC */}
        <div
          onClick={handleBrandClick}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
          title="EduNova Primaire"
        >
          <div className="w-9 h-9 rounded-xl bg-linear-to-tr from-emerald-600 via-teal-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-md group-hover:scale-105 transition-transform">
            ED
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm tracking-tight text-white group-hover:text-emerald-400 transition-colors">
                EduNova Primaire
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-800 text-emerald-400 border border-slate-700">
                SaaS BF
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Gestion Maternelle & Primaire • Burkina Faso
            </p>
          </div>
        </div>

        <div>
          <PWAInstallButton />
        </div>
      </header>

      {/* Contenu central */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-slate-850 border border-slate-750 rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8">
          {/* Étape 1 : Saisie du Code Établissement */}
          {!selectedSchool || subscriptionWarning ? (
            <div>
              <div className="text-center mb-6">
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-inner">
                  <Building className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-black text-white tracking-tight">
                  Accès Établissement
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Saisissez le code d'accès de votre école pour ouvrir votre espace de travail.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-950/70 border border-red-800/80 text-red-200 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Si l'abonnement est suspendu / expiré */}
              {subscriptionWarning && selectedSchool && (
                <div className="mb-5 p-4 rounded-xl bg-amber-950/80 border border-amber-700/80 text-amber-200 text-xs">
                  <div className="flex items-center gap-2 font-bold mb-1.5 text-amber-300">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>Abonnement non actif ({selectedSchool.name})</span>
                  </div>
                  <p className="mb-3 leading-relaxed">{subscriptionWarning}</p>
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-amber-800/60 text-[11px]">
                    <button
                      onClick={() => {
                        setSelectedSchool(null);
                        setSubscriptionWarning(null);
                        setAccessCode('');
                      }}
                      className="text-amber-300 underline hover:text-white"
                    >
                      Essayer un autre code
                    </button>
                    <span className="text-amber-400 font-medium">
                      Contactez l'administration pour réactiver
                    </span>
                  </div>
                </div>
              )}

              <form onSubmit={handleCodeSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
                    Code de votre école
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      autoFocus
                      required
                      value={accessCode}
                      onChange={(e) => {
                        setAccessCode(e.target.value.toUpperCase().replace(/\s+/g, ''));
                        setError(null);
                      }}
                      placeholder="Ex: WENDPANGA, MERVEILLES"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 font-mono font-black text-lg text-emerald-400 tracking-wider placeholder-slate-600 uppercase focus:border-emerald-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                    />
                    <KeyRound className="w-5 h-5 text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-bold text-sm text-white shadow-lg shadow-emerald-900/30 active:scale-[0.99] transition-all"
                >
                  <span>Entrer dans l'établissement</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Codes d'accès rapides pour la démonstration */}
              <div className="mt-6 pt-5 border-t border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                  Établissements de démonstration enregistrés :
                </span>
                <div className="flex flex-wrap gap-2">
                  {availableSchools.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setAccessCode(s.access_code);
                        handleCodeSubmit(undefined, s.access_code);
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-left text-xs transition-colors flex items-center gap-2"
                    >
                      <code className="font-mono font-bold text-emerald-400">{s.access_code}</code>
                      <span className="text-slate-400 text-[11px] truncate max-w-[130px]">{s.short_code}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Étape 2 : Sélection de l'utilisateur & Saisie de son Code PIN */
            <div>
              <div className="text-center mb-5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/60 text-xs font-bold mb-2">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{selectedSchool.name}</span>
                </div>
                <h3 className="text-lg font-bold text-white">Sélectionnez votre profil</h3>
                <p className="text-xs text-slate-400">
                  Entrez votre code PIN personnel pour accéder aux fonctions autorisées.
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-950/70 border border-red-800/80 text-red-200 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleUserPinSubmit} className="space-y-4">
                {/* Liste des utilisateurs de l'école */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Utilisateur / Fonction
                  </label>
                  <select
                    value={selectedUser?.id || ''}
                    onChange={(e) => {
                      const found = storage.getUsersBySchool(selectedSchool.id).find((u) => u.id === e.target.value);
                      if (found) setSelectedUser(found);
                      setUserPin('');
                      setError(null);
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:border-emerald-500 focus:outline-hidden"
                  >
                    {storage.getUsersBySchool(selectedSchool.id).map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} (
                        {u.role === 'school_admin'
                          ? 'Admin Établissement'
                          : u.role === 'director'
                          ? 'Directeur'
                          : u.role === 'accountant'
                          ? 'Comptable'
                          : u.role === 'secretary'
                          ? 'Secrétaire'
                          : u.role === 'teacher'
                          ? 'Enseignant'
                          : 'Fondateur'}
                        )
                      </option>
                    ))}
                  </select>
                </div>

                {/* Champ Code PIN */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      Code PIN de session
                    </label>
                  </div>
                  <input
                    type="password"
                    autoFocus
                    required
                    maxLength={6}
                    value={userPin}
                    onChange={(e) => {
                      setUserPin(e.target.value);
                      setError(null);
                    }}
                    placeholder="••••"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-center text-xl font-mono tracking-widest text-emerald-400 placeholder-slate-600 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSchool(null);
                      setUserPin('');
                      setError(null);
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold transition-colors"
                  >
                    Changer d'école
                  </button>

                  <button
                    type="submit"
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-950 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Ouvrir l'espace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>

      {/* Pied de page */}
      <footer className="px-4 py-3 border-t border-slate-800 text-center text-[11px] text-slate-500">
        EduNova SaaS v2.0 • Burkina Faso • Plateforme de gestion scolaire pour écoles privées
      </footer>
    </div>
  );
};
