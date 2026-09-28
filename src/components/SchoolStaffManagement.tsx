import React, { useState } from 'react';
import { SchoolConfig, UserProfile, SchoolClass } from '../types';
import { storage } from '../services/storage';
import {
  Users,
  Shield,
  KeyRound,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  GraduationCap,
  MessageCircle,
  Eye,
  EyeOff,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';

interface SchoolStaffManagementProps {
  school: SchoolConfig;
  currentUser: UserProfile;
  classes: SchoolClass[];
}

export const SchoolStaffManagement: React.FC<SchoolStaffManagementProps> = ({
  school,
  currentUser,
  classes,
}) => {
  const [users, setUsers] = useState<UserProfile[]>(storage.getUsersBySchool(school.id));
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showPinsMap, setShowPinsMap] = useState<Record<string, boolean>>({});
  const [notification, setNotification] = useState<string | null>(null);

  // Modal pour ajouter ou éditer un collaborateur
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'teacher' as UserProfile['role'],
    pin: '',
    assigned_class_ids: [] as string[],
  });

  const refreshUsers = () => {
    setUsers(storage.getUsersBySchool(school.id));
  };

  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const togglePinVisibility = (userId: string) => {
    setShowPinsMap((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      phone: '+226 ',
      role: 'teacher',
      pin: Math.floor(1000 + Math.random() * 9000).toString(),
      assigned_class_ids: [],
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user: UserProfile) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      pin: user.pin,
      assigned_class_ids: user.assigned_class_ids || [],
    });
    setIsModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert('Veuillez renseigner le nom complet.');
      return;
    }

    if (!formData.pin || formData.pin.length < 4) {
      alert('Le code PIN doit comporter au moins 4 chiffres.');
      return;
    }

    const cleanPin = formData.pin.replace(/\D/g, '').slice(0, 6);

    if (editingUser) {
      // Modification
      const updatedUser: UserProfile = {
        ...editingUser,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        role: formData.role,
        pin: cleanPin,
        assigned_class_ids: formData.role === 'teacher' ? formData.assigned_class_ids : undefined,
      };

      storage.saveUser(updatedUser);
      storage.logAudit(
        'STAFF_UPDATED',
        `Modification du profil et des accès de ${updatedUser.name} (${updatedUser.role}) par l'administrateur ${currentUser.name}`
      );
      notify(`Accès de ${updatedUser.name} mis à jour avec succès.`);
    } else {
      // Création
      const newUser: UserProfile = {
        id: `usr_${Date.now()}`,
        name: formData.name.trim(),
        email: formData.email.trim() || `${formData.name.toLowerCase().replace(/\s+/g, '.')}@${school.access_code.toLowerCase()}.bf`,
        phone: formData.phone.trim(),
        role: formData.role,
        school_id: school.id,
        pin: cleanPin,
        assigned_class_ids: formData.role === 'teacher' ? formData.assigned_class_ids : undefined,
        is_active: true,
      };

      storage.saveUser(newUser);
      storage.logAudit(
        'STAFF_CREATED',
        `Création d'un nouvel accès pour ${newUser.name} (${newUser.role}) avec PIN personnel par l'administrateur ${currentUser.name}`
      );
      notify(`Nouvel accès créé pour ${newUser.name}.`);
    }

    setIsModalOpen(false);
    refreshUsers();
  };

  const handleDeleteUser = (userId: string, userName: string, userRole: string) => {
    if (userId === currentUser.id) {
      alert('Vous ne pouvez pas supprimer votre propre compte administrateur.');
      return;
    }

    if (userRole === 'school_admin') {
      alert('Le compte Administrateur Principal de l\'établissement ne peut être supprimé que par le Super Administrateur.');
      return;
    }

    if (confirm(`Confirmez-vous la désactivation de l'accès de ${userName} ?`)) {
      const all = storage.getAllUsers();
      const updated = all.filter((u) => u.id !== userId);
      storage.saveAllUsers(updated);
      storage.logAudit(
        'STAFF_DELETED',
        `Suppression du compte de ${userName} (${userRole}) par l'administrateur ${currentUser.name}`
      );
      notify(`Accès de ${userName} retiré.`);
      refreshUsers();
    }
  };

  const handleResetPin = (user: UserProfile) => {
    const defaultNewPin = '1234';
    if (confirm(`Réinitialiser le code PIN de ${user.name} à "${defaultNewPin}" ?`)) {
      storage.updateUserPin(user.id, defaultNewPin);
      notify(`PIN de ${user.name} réinitialisé à ${defaultNewPin}.`);
      refreshUsers();
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.phone.includes(search) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const getRoleBadge = (role: UserProfile['role']) => {
    switch (role) {
      case 'school_admin':
        return { label: 'Admin Établissement', color: 'bg-rose-100 text-rose-800 border-rose-200' };
      case 'director':
        return { label: 'Directeur', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'accountant':
        return { label: 'Comptable', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'secretary':
        return { label: 'Secrétaire Caisse', color: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'teacher':
        return { label: 'Enseignant / Éducatrice', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
      case 'founder':
        return { label: 'Fondateur', color: 'bg-purple-100 text-purple-800 border-purple-200' };
      default:
        return { label: role, color: 'bg-gray-100 text-gray-800 border-gray-200' };
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-6">
      {/* Notification Toast */}
      {notification && (
        <div className="p-3 bg-emerald-700 text-white rounded-xl shadow-lg flex items-center gap-2 text-xs font-bold animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* En-tête de section */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
                Gestion des Accès & Équipe Pédagogique
              </h2>
              <p className="text-xs text-gray-500">
                Administration interne de {school.name} ({school.access_code}) : création des accès du Directeur aux Enseignants et attribution des codes PIN.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Créer un Accès Utilisateur</span>
          </button>
        </div>
      </div>

      {/* Rappel synthétique du Tableau de Bord Établissement */}
      {(() => {
        const students = storage.getStudents();
        const payments = storage.getPayments().filter((p) => !p.is_cancelled);
        const todayStr = new Date().toISOString().slice(0, 10);
        const todayPayments = payments.filter((p) => p.created_at.slice(0, 10) === todayStr);
        const todayTotal = todayPayments.reduce((sum, p) => sum + p.amount_fcfa, 0);
        const totalCollected = payments.reduce((sum, p) => sum + p.amount_fcfa, 0);
        const totalFeesDue = students.reduce((sum, s) => sum + (s.total_fees - s.discount), 0);
        const totalUnpaid = Math.max(0, totalFeesDue - totalCollected);
        const totalStudents = students.length;

        const formatFCFA = (val: number) =>
          new Intl.NumberFormat('fr-FR').format(val) + ' F CFA';

        return (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Recette du Jour</span>
              <div className="text-lg font-black text-emerald-700 mt-1">{formatFCFA(todayTotal)}</div>
              <div className="text-[10px] text-gray-400">{todayPayments.length} paiement(s)</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Cumul Encaissé</span>
              <div className="text-lg font-black text-gray-900 mt-1">{formatFCFA(totalCollected)}</div>
              <div className="text-[10px] text-emerald-600 font-semibold">Total scolarité perçue</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-amber-700 tracking-wider">Reliquat à Recouvrer</span>
              <div className="text-lg font-black text-amber-800 mt-1">{formatFCFA(totalUnpaid)}</div>
              <div className="text-[10px] text-gray-400">Reste à percevoir</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-purple-700 tracking-wider">Effectif Total</span>
              <div className="text-lg font-black text-purple-900 mt-1">{totalStudents} élève{totalStudents > 1 ? 's' : ''}</div>
              <div className="text-[10px] text-gray-400">Inscrits dans l'établissement</div>
            </div>
          </div>
        );
      })()}

      {/* Barre d'outils & Filtres */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Rechercher par nom, téléphone, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-gray-200 focus:outline-hidden focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-gray-400 shrink-0" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full sm:w-auto text-xs rounded-xl border border-gray-200 px-3 py-1.5 bg-white text-gray-700 focus:outline-hidden focus:border-emerald-500"
          >
            <option value="all">Tous les rôles ({users.length})</option>
            <option value="school_admin">Admins Établissement</option>
            <option value="director">Directeurs</option>
            <option value="accountant">Comptables</option>
            <option value="secretary">Secrétaires</option>
            <option value="teacher">Enseignants & Éducatrices</option>
            <option value="founder">Fondateurs</option>
          </select>
        </div>
      </div>

      {/* Tableau des utilisateurs et accès */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-700">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5">Collaborateur & Contact</th>
                <th className="p-3.5">Rôle / Niveau d'accès</th>
                <th className="p-3.5">Classes ou Attribution</th>
                <th className="p-3.5 text-center">Code PIN</th>
                <th className="p-3.5 text-right">Actions de Gestion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((u) => {
                const roleBadge = getRoleBadge(u.role);
                const isPinVisible = showPinsMap[u.id];
                const rawPhone = u.phone.replace(/[^0-9]/g, '');
                const waUrl = `https://wa.me/${rawPhone.startsWith('226') ? rawPhone : '226' + rawPhone}`;
                const userClasses = classes.filter((c) => (u.assigned_class_ids || []).includes(c.id));

                return (
                  <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                    {/* Nom & Contact */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gray-150 text-gray-700 font-black text-xs flex items-center justify-center shrink-0">
                          {u.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                            <span>{u.name}</span>
                            {u.id === currentUser.id && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-100 text-emerald-800 font-bold">
                                Vous
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-gray-500 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-gray-400" />
                              <span className="font-mono">{u.phone}</span>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-gray-400" />
                              <span>{u.email}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Rôle */}
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${roleBadge.color}`}>
                        {roleBadge.label}
                      </span>
                    </td>

                    {/* Classes assignées ou domaine */}
                    <td className="p-3.5">
                      {u.role === 'teacher' ? (
                        userClasses.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {userClasses.map((c) => (
                              <span
                                key={c.id}
                                className="px-2 py-0.5 rounded-lg bg-gray-100 text-gray-700 font-bold text-[10px] border border-gray-200"
                              >
                                {c.level}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-[11px]">Toutes les classes</span>
                        )
                      ) : (
                        <span className="text-gray-500 text-[11px]">
                          {u.role === 'school_admin'
                            ? 'Administration générale'
                            : u.role === 'director'
                            ? 'Pédagogie & Direction'
                            : u.role === 'accountant'
                            ? 'Caisse & Comptabilité'
                            : u.role === 'secretary'
                            ? 'Accueil & Guichet'
                            : 'Conseil de gestion'}
                        </span>
                      )}
                    </td>

                    {/* Code PIN */}
                    <td className="p-3.5 text-center">
                      <div className="inline-flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg border border-gray-200">
                        <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="font-mono font-bold text-xs tracking-widest text-gray-900">
                          {isPinVisible ? u.pin : '••••'}
                        </span>
                        <button
                          type="button"
                          onClick={() => togglePinVisibility(u.id)}
                          className="p-1 hover:text-gray-900 text-gray-400 rounded"
                          title={isPinVisible ? 'Masquer le code PIN' : 'Afficher le code PIN'}
                        >
                          {isPinVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* WhatsApp direct si enseignant */}
                        {u.role === 'teacher' && (
                          <a
                            href={waUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366] text-[#25D366] hover:text-white transition-colors"
                            title="Envoyer un message WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5 fill-current" />
                          </a>
                        )}

                        <button
                          onClick={() => handleResetPin(u)}
                          className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-gray-600 transition-colors"
                          title="Réinitialiser le code PIN à 1234"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleOpenEditModal(u)}
                          className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 text-indigo-600 transition-colors"
                          title="Modifier les coordonnées et le rôle"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {u.id !== currentUser.id && u.role !== 'school_admin' && (
                          <button
                            onClick={() => handleDeleteUser(u.id, u.name, u.role)}
                            className="p-1.5 rounded-lg border border-gray-200 hover:bg-red-50 text-red-600 transition-colors"
                            title="Désactiver cet accès"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-400">
                    Aucun collaborateur trouvé pour cette recherche.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Création / Modification d'un Collaborateur */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-lg overflow-hidden animate-scale-up">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">
                    {editingUser ? `Modifier l'accès de ${editingUser.name}` : 'Créer un nouvel accès'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Définition du niveau d'accès et du code PIN personnel
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Nom et Prénom complet
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: M. OUÉDRAOGO François"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-hidden focus:border-emerald-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Niveau d'accès (Rôle)
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value as UserProfile['role'] })
                    }
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-hidden focus:border-emerald-500 bg-white"
                  >
                    <option value="director">Directeur Pédagogique</option>
                    <option value="teacher">Enseignant / Éducatrice</option>
                    <option value="accountant">Comptable Principal</option>
                    <option value="secretary">Secrétaire de Caisse</option>
                    <option value="founder">Fondateur / Promoteur</option>
                    {currentUser.role === 'school_admin' && (
                      <option value="school_admin">Admin Établissement (Secondaire)</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Code PIN Personnel (4 à 6 chiffres)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Ex: 1234"
                    value={formData.pin}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        pin: e.target.value.replace(/\D/g, '').slice(0, 6),
                      })
                    }
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-mono font-bold text-emerald-700 tracking-wider focus:outline-hidden focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-gray-400">
                    Code confidentiel pour déverrouiller la session
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Numéro Téléphone / WhatsApp
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+226 70 00 00 00"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-mono focus:outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Email professionnel
                  </label>
                  <input
                    type="email"
                    placeholder="email@wendpanga.bf"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-hidden focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Sélection des classes si rôle Enseignant */}
              {formData.role === 'teacher' && (
                <div className="pt-2 border-t border-gray-150">
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                    Classes assignées à cet enseignant
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {classes.map((cls) => {
                      const isSelected = formData.assigned_class_ids.includes(cls.id);
                      return (
                        <button
                          key={cls.id}
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              assigned_class_ids: isSelected
                                ? prev.assigned_class_ids.filter((id) => id !== cls.id)
                                : [...prev.assigned_class_ids, cls.id],
                            }));
                          }}
                          className={`p-2 rounded-xl border text-xs font-bold flex items-center justify-between transition-colors ${
                            isSelected
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <span>{cls.name}</span>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-gray-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-gray-200 hover:bg-gray-100 text-xs font-bold text-gray-600"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  {editingUser ? 'Enregistrer les modifications' : 'Créer l\'accès'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
