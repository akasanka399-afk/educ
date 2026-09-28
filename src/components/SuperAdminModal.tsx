import React, { useState } from 'react';
import {
  SchoolConfig,
  UserProfile,
  SubscriptionStatus,
  SubscriptionPlan,
} from '../types';
import { storage } from '../services/storage';
import { formatFCFA } from '../utils/formatters';
import {
  Shield,
  Building,
  CreditCard,
  KeyRound,
  X,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Ban,
  Calendar,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  LogIn,
  Search,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface SuperAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSchool: (school: SchoolConfig) => void;
}

type SuperAdminTab = 'schools' | 'subscriptions' | 'pins';

export const SuperAdminModal: React.FC<SuperAdminModalProps> = ({
  isOpen,
  onClose,
  onSelectSchool,
}) => {
  const [activeTab, setActiveTab] = useState<SuperAdminTab>('schools');
  const [schools, setSchools] = useState<SchoolConfig[]>(storage.getAllSchools());
  const [users, setUsers] = useState<UserProfile[]>(storage.getAllUsers());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSchoolFilter, setSelectedSchoolFilter] = useState<string>('all');
  const [notification, setNotification] = useState<string | null>(null);

  // Modal création/édition école
  const [showSchoolForm, setShowSchoolForm] = useState<boolean>(false);
  const [editingSchoolId, setEditingSchoolId] = useState<string | null>(null);
  const [schoolFormData, setSchoolFormData] = useState<{
    name: string;
    access_code: string;
    short_code: string;
    region: string;
    phone: string;
    email: string;
    has_kindergarten: boolean;
    has_primary: boolean;
    plan: SubscriptionPlan;
    admin_pin: string;
  }>({
    name: '',
    access_code: '',
    short_code: '',
    region: 'Centre / Ouagadougou',
    phone: '+226 ',
    email: '',
    has_kindergarten: true,
    has_primary: true,
    plan: 'annual',
    admin_pin: '1234',
  });

  // Modal modification PIN utilisateur
  const [pinModalUser, setPinModalUser] = useState<UserProfile | null>(null);
  const [newPinValue, setNewPinValue] = useState<string>('');
  const [showPinsMap, setShowPinsMap] = useState<Record<string, boolean>>({});

  // Modal nouvel utilisateur
  const [showNewUserModal, setShowNewUserModal] = useState<boolean>(false);
  const [newUserData, setNewUserData] = useState<{
    name: string;
    email: string;
    phone: string;
    role: UserProfile['role'];
    school_id: string;
    pin: string;
  }>({
    name: '',
    email: '',
    phone: '+226 ',
    role: 'teacher',
    school_id: schools[0]?.id || '',
    pin: '1234',
  });

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const refreshData = () => {
    setSchools(storage.getAllSchools());
    setUsers(storage.getAllUsers());
  };

  // --- GESTION ÉCOLES ---
  const handleOpenAddSchool = () => {
    setEditingSchoolId(null);
    setSchoolFormData({
      name: '',
      access_code: '',
      short_code: '',
      region: 'Centre / Ouagadougou',
      phone: '+226 ',
      email: '',
      has_kindergarten: true,
      has_primary: true,
      plan: 'annual',
      admin_pin: '1234',
    });
    setShowSchoolForm(true);
  };

  const handleOpenEditSchool = (sc: SchoolConfig) => {
    setEditingSchoolId(sc.id);
    setSchoolFormData({
      name: sc.name,
      access_code: sc.access_code,
      short_code: sc.short_code,
      region: sc.region,
      phone: sc.phone,
      email: sc.email,
      has_kindergarten: sc.active_modules.kindergarten,
      has_primary: sc.active_modules.primary,
      plan: sc.subscription?.plan || 'annual',
      admin_pin: '1234',
    });
    setShowSchoolForm(true);
  };

  const handleSaveSchool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolFormData.name.trim() || !schoolFormData.access_code.trim()) {
      showToast('Veuillez remplir le nom et le code d’accès de l’école.');
      return;
    }

    const cleanCode = schoolFormData.access_code.trim().toUpperCase().replace(/\s+/g, '');

    // Check code uniqueness
    const existing = schools.find(
      (s) => s.access_code.toUpperCase() === cleanCode && s.id !== editingSchoolId
    );
    if (existing) {
      showToast(`Le code d'accès "${cleanCode}" est déjà attribué à ${existing.name}.`);
      return;
    }

    if (editingSchoolId) {
      // Modification
      const sc = schools.find((s) => s.id === editingSchoolId);
      if (sc) {
        const updated: SchoolConfig = {
          ...sc,
          name: schoolFormData.name.trim(),
          access_code: cleanCode,
          short_code: schoolFormData.short_code.trim().toUpperCase() || cleanCode.slice(0, 4),
          region: schoolFormData.region,
          phone: schoolFormData.phone,
          email: schoolFormData.email,
          active_modules: {
            kindergarten: schoolFormData.has_kindergarten,
            primary: schoolFormData.has_primary,
          },
        };
        storage.saveSchoolConfig(updated);
        showToast(`Établissement "${updated.name}" mis à jour avec succès.`);
      }
    } else {
      // Création
      const newId = `sch_${Date.now()}`;
      const now = new Date();
      const expires = new Date();
      expires.setFullYear(now.getFullYear() + 1);

      const newSchool: SchoolConfig = {
        id: newId,
        access_code: cleanCode,
        name: schoolFormData.name.trim(),
        short_code: schoolFormData.short_code.trim().toUpperCase() || cleanCode.slice(0, 4),
        motto: 'Discipline - Travail - Succès',
        region: schoolFormData.region,
        address: 'Burkina Faso',
        phone: schoolFormData.phone,
        whatsapp: schoolFormData.phone,
        email: schoolFormData.email || `${cleanCode.toLowerCase()}@edunova.bf`,
        academic_year: '2025-2026',
        active_modules: {
          kindergarten: schoolFormData.has_kindergarten,
          primary: schoolFormData.has_primary,
        },
        cash_prefix: `CAISSE-${cleanCode.slice(0, 2)}`,
        receipt_counter: 1,
        stamp_text: `Direction Générale - ${schoolFormData.name.trim()}`,
        subscription: {
          status: 'active',
          plan: schoolFormData.plan,
          start_date: now.toISOString().split('T')[0],
          expires_at: expires.toISOString().split('T')[0],
          price_fcfa: schoolFormData.plan === 'annual' ? 200000 : schoolFormData.plan === 'quarterly' ? 65000 : 25000,
          notes: 'Nouvelle licence créée par le Super Admin',
        },
        created_at: now.toISOString(),
      };

      storage.createSchool(newSchool, schoolFormData.admin_pin || '1234');
      showToast(`Établissement "${newSchool.name}" créé avec le code ${newSchool.access_code} !`);
    }

    setShowSchoolForm(false);
    refreshData();
  };

  const handleDeleteSchool = (sc: SchoolConfig) => {
    if (confirm(`Êtes-vous certain de vouloir supprimer l'école "${sc.name}" et tous ses utilisateurs ?`)) {
      storage.deleteSchool(sc.id);
      showToast(`Établissement "${sc.name}" supprimé.`);
      refreshData();
    }
  };

  // --- GESTION ABONNEMENTS ---
  const handleExtendSubscription = (schoolId: string, months: number) => {
    const sc = schools.find((s) => s.id === schoolId);
    if (!sc) return;

    const currentExpiry = new Date(sc.subscription?.expires_at || Date.now());
    const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
    baseDate.setMonth(baseDate.getMonth() + months);

    storage.updateSchoolSubscription(schoolId, {
      status: 'active',
      expires_at: baseDate.toISOString().split('T')[0],
      last_payment_date: new Date().toISOString().split('T')[0],
      notes: `Prolongation de ${months} mois effectuée le ${new Date().toLocaleDateString('fr-FR')}`,
    });

    showToast(`Abonnement de "${sc.name}" prolongé de +${months} mois (jusqu'au ${baseDate.toLocaleDateString('fr-FR')})`);
    refreshData();
  };

  const handleToggleSuspend = (schoolId: string) => {
    const sc = schools.find((s) => s.id === schoolId);
    if (!sc) return;

    const isSuspended = sc.subscription?.status === 'suspended';
    const nextStatus: SubscriptionStatus = isSuspended ? 'active' : 'suspended';

    storage.updateSchoolSubscription(schoolId, {
      status: nextStatus,
      notes: isSuspended ? 'Accès rétabli par le Super Admin' : 'Accès suspendu pour défaut de paiement',
    });

    showToast(isSuspended ? `Accès rétabli pour "${sc.name}"` : `Accès suspendu pour "${sc.name}"`);
    refreshData();
  };

  const handleSetTrial = (schoolId: string) => {
    const sc = schools.find((s) => s.id === schoolId);
    if (!sc) return;

    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 30);

    storage.updateSchoolSubscription(schoolId, {
      status: 'trial',
      plan: 'monthly',
      expires_at: trialEnd.toISOString().split('T')[0],
      notes: 'Période d\'essai activée pour 30 jours',
    });

    showToast(`Période d'essai (30 jours) activée pour "${sc.name}"`);
    refreshData();
  };

  // --- GESTION PIN UTILISATEURS ---
  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinModalUser) return;
    if (!newPinValue.trim() || newPinValue.trim().length < 4) {
      showToast('Le code PIN doit comporter au moins 4 chiffres.');
      return;
    }

    storage.updateUserPin(pinModalUser.id, newPinValue.trim());
    showToast(`Code PIN de ${pinModalUser.name} mis à jour : ${newPinValue.trim()}`);
    setPinModalUser(null);
    setNewPinValue('');
    refreshData();
  };

  const handleResetPinDefault = (user: UserProfile) => {
    if (confirm(`Réinitialiser le code PIN de ${user.name} à "1234" ?`)) {
      storage.updateUserPin(user.id, '1234');
      showToast(`Code PIN de ${user.name} réinitialisé à 1234`);
      refreshData();
    }
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserData.name.trim() || !newUserData.pin.trim()) {
      showToast('Veuillez renseigner le nom et le code PIN.');
      return;
    }

    const newUser: UserProfile = {
      id: `usr_${Date.now()}`,
      name: newUserData.name.trim(),
      email: newUserData.email.trim() || `${newUserData.name.toLowerCase().replace(/\s+/g, '.')}@edunova.bf`,
      phone: newUserData.phone.trim(),
      role: newUserData.role,
      school_id: newUserData.school_id,
      pin: newUserData.pin.trim(),
      is_active: true,
    };

    storage.saveUser(newUser);
    showToast(`Utilisateur "${newUser.name}" ajouté avec le PIN ${newUser.pin}`);
    setShowNewUserModal(false);
    refreshData();
  };

  // Filtrage des écoles
  const filteredSchools = schools.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.access_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filtrage des utilisateurs
  const filteredUsers = users.filter((u) => {
    const matchesSchool = selectedSchoolFilter === 'all' || u.school_id === selectedSchoolFilter;
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.role.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSchool && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-purple-500/50 w-full max-w-5xl h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-gray-100">
        {/* HEADER SUPER ADMIN */}
        <div className="bg-linear-to-r from-purple-950 via-indigo-950 to-gray-900 px-4 py-3.5 border-b border-purple-800/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-900/50">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-base sm:text-lg text-white tracking-wide">
                  Console Super Administrateur SaaS
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-900/80 text-purple-300 border border-purple-500/40 uppercase tracking-wider">
                  Master Root
                </span>
              </div>
              <p className="text-xs text-purple-300/80">
                Gestion des établissements, codes d’accès, abonnements et codes PIN utilisateurs
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TOAST NOTIFICATION */}
        {notification && (
          <div className="bg-emerald-600 text-white text-xs font-semibold px-4 py-2 flex items-center justify-between transition-all animate-in slide-in-from-top duration-150">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{notification}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-white/80 hover:text-white">
              ×
            </button>
          </div>
        )}

        {/* BARRE D'ONGLETS & RECHERCHE */}
        <div className="bg-gray-950/70 border-b border-gray-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 p-1 bg-gray-900 rounded-xl border border-gray-800">
            <button
              onClick={() => setActiveTab('schools')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'schools'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Building className="w-4 h-4" />
              <span>Établissements ({schools.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('subscriptions')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'subscriptions'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Abonnements & Licences</span>
            </button>
            <button
              onClick={() => setActiveTab('pins')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'pins'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>Codes PIN Utilisateurs ({users.length})</span>
            </button>
          </div>

          {/* Recherche */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher école, code, utilisateur..."
              className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-hidden focus:border-purple-500"
            />
          </div>
        </div>

        {/* CONTENU PRINCIPAL PAR ONGLET */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* ================= ONGLET 1: ÉTABLISSEMENTS ================= */}
          {activeTab === 'schools' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-white">Parc des Établissements Scolaires</h3>
                  <p className="text-xs text-gray-400">
                    Chaque école dispose d’un code unique que son personnel utilise pour se connecter.
                  </p>
                </div>
                <button
                  onClick={handleOpenAddSchool}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nouvel Établissement</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {filteredSchools.map((sc) => {
                  const subCheck = storage.checkSubscription(sc);
                  const isCurrent = storage.getActiveSchoolCode() === sc.access_code;

                  return (
                    <div
                      key={sc.id}
                      className={`bg-gray-850/80 rounded-xl border p-4 flex flex-col justify-between transition-all hover:border-purple-500/60 ${
                        isCurrent
                          ? 'border-purple-500/80 bg-purple-950/20 shadow-md shadow-purple-950/50'
                          : 'border-gray-800'
                      }`}
                    >
                      <div>
                        {/* En-tête carte */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-sm text-white truncate">{sc.name}</span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-600 text-white shrink-0">
                                  Actif
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-400">{sc.region}</p>
                          </div>

                          {/* Badge Statut Abonnement */}
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                              subCheck.status === 'active'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                                : subCheck.status === 'trial'
                                ? 'bg-blue-950 text-blue-300 border border-blue-700/60'
                                : subCheck.status === 'suspended'
                                ? 'bg-red-950 text-red-300 border border-red-700/60'
                                : 'bg-amber-950 text-amber-300 border border-amber-700/60'
                            }`}
                          >
                            {subCheck.status === 'active'
                              ? 'Actif'
                              : subCheck.status === 'trial'
                              ? 'Essai'
                              : subCheck.status === 'suspended'
                              ? 'Suspendu'
                              : 'Expiré'}
                          </span>
                        </div>

                        {/* CODE D'ACCÈS CLÉ */}
                        <div className="bg-gray-900/90 border border-gray-750 rounded-lg p-2.5 my-3 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-gray-400 block">
                              Code d'accès de l'école
                            </span>
                            <span className="font-mono font-black text-base text-purple-300 tracking-wider">
                              {sc.access_code}
                            </span>
                          </div>
                          <span className="text-[11px] text-gray-400 bg-gray-800 px-2 py-1 rounded">
                            {sc.phone}
                          </span>
                        </div>

                        {/* Cycles & Formule */}
                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-3">
                          <span className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-300 text-[11px]">
                            {sc.active_modules.kindergarten && sc.active_modules.primary
                              ? 'Maternelle + Primaire'
                              : sc.active_modules.kindergarten
                              ? 'Maternelle seule'
                              : 'Primaire seul'}
                          </span>
                          <span>•</span>
                          <span className="text-[11px]">
                            Plan :{' '}
                            <strong className="text-gray-200">
                              {sc.subscription?.plan === 'annual'
                                ? 'Annuel'
                                : sc.subscription?.plan === 'quarterly'
                                ? 'Trimestriel'
                                : 'Mensuel'}
                            </strong>
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="pt-3 border-t border-gray-800/80 flex items-center justify-between gap-2">
                        <button
                          onClick={() => {
                            storage.setActiveSchoolCode(sc.access_code);
                            onSelectSchool(sc);
                            showToast(`Connexion à l'espace de "${sc.name}"`);
                            onClose();
                          }}
                          className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-900/50 hover:bg-purple-600 text-purple-200 hover:text-white text-xs font-semibold border border-purple-700/50 transition-all"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          <span>Accéder à l'espace</span>
                        </button>

                        <button
                          onClick={() => handleOpenEditSchool(sc)}
                          title="Modifier"
                          className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {schools.length > 1 && (
                          <button
                            onClick={() => handleDeleteSchool(sc)}
                            title="Supprimer"
                            className="p-1.5 rounded-lg bg-gray-800 hover:bg-red-950/80 text-gray-400 hover:text-red-300 border border-transparent hover:border-red-800/60 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================= ONGLET 2: ABONNEMENTS & LICENCES ================= */}
          {activeTab === 'subscriptions' && (
            <div className="space-y-4">
              {/* Synthèse globale SaaS */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="bg-gray-850 p-3.5 rounded-xl border border-gray-800">
                  <span className="text-[11px] text-gray-400 block font-medium">Établissements Actifs</span>
                  <div className="text-xl font-black text-emerald-400 mt-1">
                    {schools.filter((s) => s.subscription?.status === 'active').length} / {schools.length}
                  </div>
                </div>
                <div className="bg-gray-850 p-3.5 rounded-xl border border-gray-800">
                  <span className="text-[11px] text-gray-400 block font-medium">En Période d'Essai</span>
                  <div className="text-xl font-black text-blue-400 mt-1">
                    {schools.filter((s) => s.subscription?.status === 'trial').length}
                  </div>
                </div>
                <div className="bg-gray-850 p-3.5 rounded-xl border border-gray-800">
                  <span className="text-[11px] text-gray-400 block font-medium">Expirés ou Suspendus</span>
                  <div className="text-xl font-black text-red-400 mt-1">
                    {schools.filter((s) => ['expired', 'suspended'].includes(s.subscription?.status)).length}
                  </div>
                </div>
                <div className="bg-gray-850 p-3.5 rounded-xl border border-gray-800">
                  <span className="text-[11px] text-gray-400 block font-medium">Total Facturation / Cycle</span>
                  <div className="text-xl font-black text-purple-300 mt-1">
                    {formatFCFA(
                      schools.reduce((acc, s) => acc + (s.subscription?.price_fcfa || 0), 0)
                    )}
                  </div>
                </div>
              </div>

              {/* Tableau détaillé des abonnements */}
              <div className="bg-gray-850 rounded-xl border border-gray-800 overflow-hidden">
                <div className="p-3 bg-gray-900 border-b border-gray-800 flex items-center justify-between">
                  <h3 className="font-bold text-xs text-white">Gestion des Licences & Échéanciers SaaS</h3>
                  <span className="text-[11px] text-gray-400">Tarification indicative : 25 000 F/mois • 200 000 F/an</span>
                </div>

                <div className="divide-y divide-gray-800 overflow-x-auto">
                  {filteredSchools.map((sc) => {
                    const sub = sc.subscription;
                    const check = storage.checkSubscription(sc);

                    return (
                      <div key={sc.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-800/40 transition-colors">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-white">{sc.name}</span>
                            <code className="text-[11px] px-1.5 py-0.5 rounded bg-gray-900 text-purple-300 border border-gray-750 font-mono">
                              {sc.access_code}
                            </code>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                            <span>
                              Plan :{' '}
                              <strong className="text-gray-200">
                                {sub?.plan === 'annual' ? 'Annuel' : sub?.plan === 'quarterly' ? 'Trimestriel' : 'Mensuel'}
                              </strong>{' '}
                              ({formatFCFA(sub?.price_fcfa || 0)})
                            </span>
                            <span>•</span>
                            <span>
                              Échéance :{' '}
                              <strong className={check.daysRemaining <= 7 ? 'text-amber-400 font-bold' : 'text-gray-200'}>
                                {new Date(sub?.expires_at || Date.now()).toLocaleDateString('fr-FR')}
                              </strong>{' '}
                              ({check.daysRemaining > 0 ? `${check.daysRemaining} j restants` : 'Expiré'})
                            </span>
                          </div>
                          {sub?.notes && (
                            <p className="text-[11px] text-gray-500 italic mt-1">{sub.notes}</p>
                          )}
                        </div>

                        {/* Actions de gestion rapide */}
                        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleExtendSubscription(sc.id, 1)}
                            className="px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-purple-900/60 text-gray-200 hover:text-white text-xs font-semibold border border-gray-700 hover:border-purple-600 transition-all"
                          >
                            +1 Mois
                          </button>
                          <button
                            onClick={() => handleExtendSubscription(sc.id, 3)}
                            className="px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-purple-900/60 text-gray-200 hover:text-white text-xs font-semibold border border-gray-700 hover:border-purple-600 transition-all"
                          >
                            +1 Trimestre
                          </button>
                          <button
                            onClick={() => handleExtendSubscription(sc.id, 12)}
                            className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-xs"
                          >
                            +1 An
                          </button>

                          <button
                            onClick={() => handleSetTrial(sc.id)}
                            title="Activer essai 30j"
                            className="px-2 py-1 rounded-lg bg-gray-800 hover:bg-blue-950 text-blue-300 text-xs font-semibold border border-gray-700 hover:border-blue-700 transition-all"
                          >
                            Essai 30j
                          </button>

                          <button
                            onClick={() => handleToggleSuspend(sc.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                              sub?.status === 'suspended'
                                ? 'bg-emerald-950 text-emerald-300 border-emerald-700 hover:bg-emerald-900'
                                : 'bg-red-950/80 text-red-300 border-red-800/80 hover:bg-red-900'
                            }`}
                          >
                            {sub?.status === 'suspended' ? 'Débloquer' : 'Suspendre'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ================= ONGLET 3: CODES PIN UTILISATEURS ================= */}
          {activeTab === 'pins' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-sm text-white">Gestion des Codes PIN du Personnel</h3>
                  <p className="text-xs text-gray-400">
                    Consultez, réinitialisez ou modifiez les codes PIN de tous les utilisateurs par établissement.
                  </p>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {/* Filtre par école */}
                  <select
                    value={selectedSchoolFilter}
                    onChange={(e) => setSelectedSchoolFilter(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-hidden"
                  >
                    <option value="all">Toutes les écoles ({schools.length})</option>
                    {schools.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.access_code})
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() => {
                      setNewUserData({
                        name: '',
                        email: '',
                        phone: '+226 ',
                        role: 'teacher',
                        school_id: selectedSchoolFilter !== 'all' ? selectedSchoolFilter : schools[0]?.id || '',
                        pin: '1234',
                      });
                      setShowNewUserModal(true);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nouvel Utilisateur</span>
                  </button>
                </div>
              </div>

              {/* Liste des utilisateurs et leurs PIN */}
              <div className="bg-gray-850 rounded-xl border border-gray-800 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-gray-900 border-b border-gray-800 text-gray-400 font-semibold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Utilisateur</th>
                      <th className="p-3">Rôle</th>
                      <th className="p-3">Établissement</th>
                      <th className="p-3 text-center">Code PIN</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800 text-gray-200">
                    {filteredUsers.map((u) => {
                      const userSchool = schools.find((s) => s.id === u.school_id);
                      const isVisible = showPinsMap[u.id];

                      return (
                        <tr key={u.id} className="hover:bg-gray-800/40 transition-colors">
                          <td className="p-3">
                            <div className="font-bold text-white">{u.name}</div>
                            <div className="text-[11px] text-gray-400">
                              {u.email} • {u.phone}
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-800 text-gray-300 border border-gray-700 capitalize">
                              {u.role === 'school_admin'
                                ? 'Admin Établissement'
                                : u.role === 'founder'
                                ? 'Fondateur'
                                : u.role === 'director'
                                ? 'Directeur'
                                : u.role === 'accountant'
                                ? 'Comptable'
                                : u.role === 'secretary'
                                ? 'Secrétaire'
                                : 'Enseignant'}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="font-medium text-gray-300">
                              {userSchool?.name || u.school_id}
                            </span>
                            <div className="text-[10px] text-purple-300 font-mono">
                              Code: {userSchool?.access_code || '---'}
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <div className="inline-flex items-center gap-1.5 bg-gray-900 px-2.5 py-1 rounded-lg border border-gray-750">
                              <KeyRound className="w-3 h-3 text-purple-400" />
                              <span className="font-mono font-black text-sm tracking-widest text-purple-200">
                                {isVisible ? u.pin : '••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setShowPinsMap((prev) => ({
                                    ...prev,
                                    [u.id]: !prev[u.id],
                                  }))
                                }
                                className="text-gray-400 hover:text-white p-0.5"
                              >
                                {isVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </button>
                            </div>
                          </td>
                          <td className="p-3 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  setPinModalUser(u);
                                  setNewPinValue(u.pin);
                                }}
                                className="px-2 py-1 rounded bg-purple-900/50 hover:bg-purple-600 text-purple-200 hover:text-white text-[11px] font-semibold border border-purple-700/50 transition-all"
                              >
                                Modifier PIN
                              </button>
                              <button
                                onClick={() => handleResetPinDefault(u)}
                                title="Réinitialiser à 1234"
                                className="px-2 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-[11px] transition-colors"
                              >
                                Reset 1234
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* MODAL CRÉATION / MODIFICATION ÉCOLE */}
        {showSchoolForm && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/75 p-4 animate-in fade-in">
            <div className="bg-gray-900 border border-purple-500/60 rounded-2xl w-full max-w-lg p-5 text-white shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-4">
                <h4 className="font-bold text-base text-white">
                  {editingSchoolId ? "Modifier l'établissement" : 'Ajouter un nouvel établissement'}
                </h4>
                <button
                  onClick={() => setShowSchoolForm(false)}
                  className="p-1 rounded text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveSchool} className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">
                    Nom de l'école <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={schoolFormData.name}
                    onChange={(e) => setSchoolFormData({ ...schoolFormData, name: e.target.value })}
                    placeholder="Ex: Complexe Scolaire Saint-Joseph"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">
                      Code d'accès école <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={schoolFormData.access_code}
                      onChange={(e) =>
                        setSchoolFormData({
                          ...schoolFormData,
                          access_code: e.target.value.toUpperCase().replace(/\s+/g, ''),
                        })
                      }
                      placeholder="Ex: STJOSEPH"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 font-mono font-bold text-purple-300 focus:border-purple-500 focus:outline-hidden uppercase"
                    />
                    <span className="text-[10px] text-gray-400">Code à saisir par l'école</span>
                  </div>

                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Sigle court (Reçus)</label>
                    <input
                      type="text"
                      value={schoolFormData.short_code}
                      onChange={(e) =>
                        setSchoolFormData({
                          ...schoolFormData,
                          short_code: e.target.value.toUpperCase(),
                        })
                      }
                      placeholder="Ex: CSSJ"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white uppercase focus:border-purple-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Région / Ville</label>
                    <input
                      type="text"
                      value={schoolFormData.region}
                      onChange={(e) =>
                        setSchoolFormData({ ...schoolFormData, region: e.target.value })
                      }
                      placeholder="Ex: Centre / Ouaga"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Téléphone de l'école</label>
                    <input
                      type="text"
                      value={schoolFormData.phone}
                      onChange={(e) =>
                        setSchoolFormData({ ...schoolFormData, phone: e.target.value })
                      }
                      placeholder="+226 70 00 00 00"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Modules activés */}
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Modules pédagogiques</label>
                  <div className="flex items-center gap-4 bg-gray-800 p-2.5 rounded-lg border border-gray-700">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={schoolFormData.has_kindergarten}
                        onChange={(e) =>
                          setSchoolFormData({
                            ...schoolFormData,
                            has_kindergarten: e.target.checked,
                          })
                        }
                        className="rounded text-purple-600 focus:ring-purple-500"
                      />
                      <span>Maternelle (Éveil)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={schoolFormData.has_primary}
                        onChange={(e) =>
                          setSchoolFormData({ ...schoolFormData, has_primary: e.target.checked })
                        }
                        className="rounded text-purple-600 focus:ring-purple-500"
                      />
                      <span>Primaire (Notes & CEP)</span>
                    </label>
                  </div>
                </div>

                {!editingSchoolId && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-gray-300 font-semibold mb-1">Formule d'abonnement</label>
                      <select
                        value={schoolFormData.plan}
                        onChange={(e) =>
                          setSchoolFormData({
                            ...schoolFormData,
                            plan: e.target.value as SubscriptionPlan,
                          })
                        }
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                      >
                        <option value="annual">Annuel (200 000 FCFA)</option>
                        <option value="quarterly">Trimestriel (65 000 FCFA)</option>
                        <option value="monthly">Mensuel (25 000 FCFA)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-300 font-semibold mb-1">PIN Directeur initial</label>
                      <input
                        type="text"
                        value={schoolFormData.admin_pin}
                        onChange={(e) =>
                          setSchoolFormData({ ...schoolFormData, admin_pin: e.target.value })
                        }
                        maxLength={6}
                        placeholder="1234"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-purple-300 font-mono font-bold"
                      />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-800">
                  <button
                    type="button"
                    onClick={() => setShowSchoolForm(false)}
                    className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold"
                  >
                    {editingSchoolId ? 'Enregistrer les modifications' : "Créer l'établissement"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL MODIFICATION PIN INDIVIDUEL */}
        {pinModalUser && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/75 p-4 animate-in fade-in">
            <div className="bg-gray-900 border border-purple-500/60 rounded-2xl w-full max-w-xs p-5 text-white shadow-2xl">
              <div className="flex items-center justify-between pb-2 border-b border-gray-800 mb-3">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-purple-400" />
                  <h4 className="font-bold text-sm text-white">Changer le Code PIN</h4>
                </div>
                <button
                  onClick={() => setPinModalUser(null)}
                  className="p-1 rounded text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-gray-300 mb-3">
                Définissez le nouveau code PIN pour <strong>{pinModalUser.name}</strong> (
                {pinModalUser.role}).
              </p>

              <form onSubmit={handleSavePin} className="space-y-4">
                <div>
                  <label className="block text-[11px] text-gray-400 font-semibold mb-1">
                    Nouveau Code PIN (4 à 6 chiffres)
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    maxLength={6}
                    value={newPinValue}
                    onChange={(e) => setNewPinValue(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ex: 5678"
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-center text-lg font-mono font-bold tracking-widest text-purple-300 focus:border-purple-500 focus:outline-hidden"
                  />
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setPinModalUser(null)}
                    className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-xs text-gray-300"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-xs"
                  >
                    Enregistrer le PIN
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL NOUVEL UTILISATEUR */}
        {showNewUserModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/75 p-4 animate-in fade-in">
            <div className="bg-gray-900 border border-purple-500/60 rounded-2xl w-full max-w-sm p-5 text-white shadow-2xl">
              <div className="flex items-center justify-between pb-2 border-b border-gray-800 mb-3">
                <h4 className="font-bold text-sm text-white">Créer un profil personnel</h4>
                <button
                  onClick={() => setShowNewUserModal(false)}
                  className="p-1 rounded text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Nom complet</label>
                  <input
                    type="text"
                    required
                    value={newUserData.name}
                    onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                    placeholder="Mme / M. ..."
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Établissement</label>
                  <select
                    value={newUserData.school_id}
                    onChange={(e) => setNewUserData({ ...newUserData, school_id: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white"
                  >
                    {schools.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.access_code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Rôle</label>
                    <select
                      value={newUserData.role}
                      onChange={(e) =>
                        setNewUserData({
                          ...newUserData,
                          role: e.target.value as UserProfile['role'],
                        })
                      }
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1.5 text-white"
                    >
                      <option value="school_admin">Admin Établissement</option>
                      <option value="director">Directeur</option>
                      <option value="accountant">Comptable</option>
                      <option value="secretary">Secrétaire</option>
                      <option value="teacher">Enseignant</option>
                      <option value="founder">Fondateur</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Code PIN (4-6 ch.)</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={newUserData.pin}
                      onChange={(e) => setNewUserData({ ...newUserData, pin: e.target.value })}
                      placeholder="1234"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 font-mono text-purple-300 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 font-semibold mb-1">Téléphone</label>
                  <input
                    type="text"
                    value={newUserData.phone}
                    onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                    placeholder="+226 XX XX XX XX"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-800">
                  <button
                    type="button"
                    onClick={() => setShowNewUserModal(false)}
                    className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold"
                  >
                    Créer l'utilisateur
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
