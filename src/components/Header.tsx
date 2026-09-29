import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, SchoolConfig } from '../types';
import { storage } from '../services/storage';
import {
  Wifi,
  WifiOff,
  Printer,
  ShieldAlert,
  Settings,
  UserCheck,
  ChevronDown,
  Building,
  School as SchoolIcon,
  Baby,
  BookOpen,
  LogOut,
  Shield,
  KeyRound,
  Sparkles,
  Cloud,
  RefreshCw,
  Check,
} from 'lucide-react';
import { syncService, SyncStatus } from '../services/syncService';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  currentUser: UserProfile;
  onUserChange: (user: UserProfile) => void;
  onOpenPrinterModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenAuditModal: () => void;
  onOpenSuperAdminPin: () => void;
  onLogoutSchool: () => void;
  school: SchoolConfig;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onUserChange,
  onOpenPrinterModal,
  onOpenSettingsModal,
  onOpenAuditModal,
  onOpenSuperAdminPin,
  onLogoutSchool,
  school,
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [cloudStatus, setCloudStatus] = useState<SyncStatus>('offline');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [showRoleMenu, setShowRoleMenu] = useState<boolean>(false);

  // Triple-clic detector
  const clickCountRef = useRef<number>(0);
  const clickTimerRef = useRef<any>(null);

  const handleBrandTripleClick = () => {
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

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubscribeSync = syncService.onStatusChange((status, lastSync) => {
      setCloudStatus(status);
      setLastSyncTime(lastSync);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribeSync();
    };
  }, []);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'school_admin':
        return 'Admin Établissement';
      case 'founder':
        return 'Fondateur / Promoteur';
      case 'director':
        return 'Directeur Pédagogique';
      case 'accountant':
        return 'Comptable Principal';
      case 'secretary':
        return 'Secrétaire de Caisse';
      case 'teacher':
        return 'Enseignant / Éducatrice';
      default:
        return role;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'school_admin':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'founder':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'director':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'accountant':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'secretary':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'teacher':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const schoolUsers = storage.getUsersBySchool(school.id);
  const subCheck = storage.checkSubscription(school);

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-xs">
      {/* Barre supérieure principale */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 flex items-center justify-between gap-3">
        {/* Logo & Nom École avec TRIPLE-CLIC pour Super Admin */}
        <div
          onClick={handleBrandTripleClick}
          className="flex items-center gap-2.5 min-w-0 cursor-pointer select-none group"
          title="EduNova Primaire"
        >
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-emerald-600 via-teal-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-sm shrink-0 group-hover:scale-105 transition-transform">
            {school.short_code.slice(0, 3)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-gray-900 truncate group-hover:text-emerald-700 transition-colors">
                {school.name}
              </h1>
              {/* Code Établissement Badge */}
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-purple-100 text-purple-800 border border-purple-200" title="Code d'accès de votre établissement">
                {school.access_code}
              </span>
              <span className="hidden md:inline-flex px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 text-gray-700">
                {school.academic_year}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-gray-500 truncate">
              <span>{school.region}</span>
              <span className="text-gray-300">•</span>
              {/* Statut Abonnement */}
              <span className={`inline-flex items-center gap-1 font-semibold ${
                subCheck.status === 'active' ? 'text-emerald-700' : subCheck.status === 'trial' ? 'text-blue-700' : 'text-amber-700'
              }`}>
                {subCheck.status === 'active' ? '• Licence Active' : subCheck.status === 'trial' ? `• Essai (${subCheck.daysRemaining}j)` : '• Licence Expirée'}
              </span>
            </div>
          </div>
        </div>

        {/* Côté Droit : Statut Réseau, Imprimante, Profil & Rôles */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Badge Synchronisation Firebase Cloud & Écoute Temps Réel */}
          <button
            onClick={async () => {
              await syncService.pushLocalToFirestore();
              await syncService.pullRemoteFromFirestore();
            }}
            disabled={cloudStatus === 'syncing'}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
              cloudStatus === 'synced'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 shadow-2xs'
                : cloudStatus === 'syncing'
                ? 'bg-blue-50 text-blue-800 border-blue-300 animate-pulse'
                : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
            }`}
            title={
              cloudStatus === 'synced'
                ? `Synchronisation en temps réel active (${lastSyncTime || 'à l\'instant'}). Cliquez pour forcer une réactualisation complète.`
                : cloudStatus === 'syncing'
                ? 'Synchronisation cloud en cours...'
                : 'Connexion interrompue. Mode hors-ligne actif.'
            }
          >
            {cloudStatus === 'syncing' ? (
              <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />
            ) : cloudStatus === 'synced' ? (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
              </span>
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-amber-600" />
            )}
            <span className="font-semibold text-[11px] sm:text-xs">
              {cloudStatus === 'syncing'
                ? 'Synchro...'
                : cloudStatus === 'synced'
                ? 'Temps réel actif'
                : 'Hors ligne'}
            </span>
            {lastSyncTime && cloudStatus === 'synced' && (
              <span className="hidden lg:inline text-[10px] text-emerald-600 font-mono">
                {lastSyncTime}
              </span>
            )}
          </button>

          {/* Bouton d'Installation PWA */}
          <PWAInstallButton />

          {/* Bouton Matériel Imprimante Thermique */}
          <button
            onClick={onOpenPrinterModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors"
            title="Configurer l'imprimante thermique 80mm (Bluetooth / USB)"
          >
            <Printer className="w-4 h-4 text-emerald-600" />
            <span className="hidden md:inline">Imprimante 80mm</span>
          </button>

          {/* Bouton Audit (Admin / Directeur / Fondateur) */}
          {['school_admin', 'founder', 'director'].includes(currentUser.role) && (
            <button
              onClick={onOpenAuditModal}
              className="p-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors"
              title="Journal d'audit et sécurité des transactions"
            >
              <ShieldAlert className="w-4 h-4 text-purple-600" />
            </button>
          )}

          {/* Bouton Paramètres École (Admin / Directeur / Fondateur) */}
          {['school_admin', 'founder', 'director'].includes(currentUser.role) && (
            <button
              onClick={onOpenSettingsModal}
              className="p-1.5 text-xs font-medium rounded-lg border border-gray-200 hover:border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors"
              title="Paramètres de l'école et cycles"
            >
              <Settings className="w-4 h-4 text-gray-600" />
            </button>
          )}

          {/* Sélecteur de Rôle / Utilisateur */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2 pl-2.5 pr-2 py-1 rounded-xl border border-gray-200 hover:border-gray-300 bg-white text-left transition-all"
            >
              <div className="hidden sm:block text-right">
                <div className="text-xs font-bold text-gray-900 leading-tight">
                  {currentUser.name}
                </div>
                <div className="text-[10px] text-gray-500">
                  {getRoleLabel(currentUser.role)}
                </div>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getRoleBadgeColor(
                  currentUser.role
                )}`}
              >
                {currentUser.role.toUpperCase()}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {/* Menu Déroulant Changement d'Utilisateur & Déconnexion École */}
            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 border-b border-gray-100">
                  <p className="text-xs font-bold text-gray-800">Personnel de l'école ({school.access_code})</p>
                  <p className="text-[10.5px] text-gray-500">
                    Basculez entre les profils de cet établissement
                  </p>
                </div>
                <div className="divide-y divide-gray-50 max-h-60 overflow-y-auto">
                  {schoolUsers.map((usr) => (
                    <button
                      key={usr.id}
                      onClick={() => {
                        onUserChange(usr);
                        storage.setCurrentUser(usr);
                        setShowRoleMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-gray-50 transition-colors ${
                        usr.id === currentUser.id ? 'bg-emerald-50/70 font-semibold' : ''
                      }`}
                    >
                      <div>
                        <div className="text-gray-900">{usr.name}</div>
                        <div className="text-[10.5px] text-gray-500">
                          {getRoleLabel(usr.role)}
                        </div>
                      </div>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getRoleBadgeColor(
                          usr.role
                        )}`}
                      >
                        {usr.role}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Option Déconnexion / Changer d'établissement */}
                <div className="pt-2 mt-1 border-t border-gray-150 px-2 space-y-1">
                  <button
                    onClick={() => {
                      setShowRoleMenu(false);
                      onLogoutSchool();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Quitter / Changer d'établissement</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bandeau d'alerte en cas de coupure de réseau */}
      {!isOnline && (
        <div className="bg-amber-500 text-white text-xs px-4 py-1 flex items-center justify-center gap-2 font-medium">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Connexion Internet interrompue : Vous travaillez en mode local (IndexedDB). Les opérations seront synchronisées automatiquement au retour du réseau.</span>
        </div>
      )}
    </header>
  );
};
