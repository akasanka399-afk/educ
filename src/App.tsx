/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserProfile, SchoolConfig, Payment, Student } from './types';
import { storage } from './services/storage';
import { Header } from './components/Header';
import { Navigation, TabType } from './components/Navigation';
import { Dashboard } from './components/Dashboard';
import { CashDesk } from './components/CashDesk';
import { CashJournal } from './components/CashJournal';
import { StudentsList } from './components/StudentsList';
import { KindergartenModule } from './components/kindergarten/KindergartenModule';
import { PrimaryModule } from './components/primary/PrimaryModule';
import { WhatsAppCenter } from './components/WhatsAppCenter';
import { ReceiptModal } from './components/ReceiptModal';
import { PrinterSettingsModal } from './components/PrinterSettingsModal';
import { SchoolSettingsModal } from './components/SchoolSettingsModal';
import { AuditLogModal } from './components/AuditLogModal';
import { SuperAdminPinDialog } from './components/SuperAdminPinDialog';
import { SuperAdminModal } from './components/SuperAdminModal';
import { SchoolLoginScreen } from './components/SchoolLoginScreen';
import { SchoolStaffManagement } from './components/SchoolStaffManagement';
import { syncService } from './services/syncService';
import { AlertTriangle, Shield } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile>(storage.getCurrentUser());
  const [school, setSchool] = useState<SchoolConfig>(storage.getSchoolConfig());
  const [classes, setClasses] = useState(storage.getClasses());
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [isLoggedIntoSchool, setIsLoggedIntoSchool] = useState<boolean>(true);

  // Initialisation de la synchronisation Firebase Cloud
  useEffect(() => {
    syncService.init();

    const handleCloudUpdate = () => {
      setSchool(storage.getSchoolConfig());
      setClasses(storage.getClasses());
      setCurrentUser(storage.getCurrentUser());
    };

    window.addEventListener('edunova_cloud_synced', handleCloudUpdate);
    return () => {
      window.removeEventListener('edunova_cloud_synced', handleCloudUpdate);
    };
  }, []);

  // Modals globaux & Super Admin
  const [activeReceipt, setActiveReceipt] = useState<Payment | null>(null);
  const [showPrinterModal, setShowPrinterModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);
  const [showSuperAdminPinDialog, setShowSuperAdminPinDialog] = useState<boolean>(false);
  const [showSuperAdminModal, setShowSuperAdminModal] = useState<boolean>(false);

  // Vérification de la licence active de l'école
  const subCheck = storage.checkSubscription(school);

  // Recharger l'utilisateur ou la config lors des modifications
  const handleUserChange = (user: UserProfile) => {
    setCurrentUser(user);
    if (['teacher'].includes(user.role) && ['cash', 'journal'].includes(currentTab)) {
      setCurrentTab('dashboard');
    }
  };

  const handleConfigSaved = (newConfig: SchoolConfig) => {
    setSchool(newConfig);
    setClasses(storage.getClasses());
  };

  const handleSchoolUnlocked = (unlockedSchool: SchoolConfig, user: UserProfile) => {
    setSchool(unlockedSchool);
    setCurrentUser(user);
    setClasses(storage.getClasses());
    setIsLoggedIntoSchool(true);
    setCurrentTab('dashboard');
  };

  const handleLogoutSchool = () => {
    setIsLoggedIntoSchool(false);
  };

  // Si l'utilisateur n'est pas encore entré dans un établissement (ou a cliqué sur Changer d'école)
  if (!isLoggedIntoSchool) {
    return (
      <>
        <SchoolLoginScreen
          onSchoolUnlocked={handleSchoolUnlocked}
          onOpenSuperAdminPin={() => setShowSuperAdminPinDialog(true)}
        />

        <SuperAdminPinDialog
          isOpen={showSuperAdminPinDialog}
          onClose={() => setShowSuperAdminPinDialog(false)}
          onSuccess={() => {
            setShowSuperAdminPinDialog(false);
            setShowSuperAdminModal(true);
          }}
        />

        {showSuperAdminModal && (
          <SuperAdminModal
            isOpen={showSuperAdminModal}
            onClose={() => setShowSuperAdminModal(false)}
            onSelectSchool={(selected) => {
              setSchool(selected);
              const users = storage.getUsersBySchool(selected.id);
              if (users.length > 0) setCurrentUser(users[0]);
              setClasses(storage.getClasses());
              setIsLoggedIntoSchool(true);
            }}
          />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans antialiased text-gray-900 selection:bg-emerald-100 selection:text-emerald-900">
      {/* Alerte si licence suspendue ou expirée */}
      {!subCheck.isValid && (
        <div className="bg-red-600 text-white text-xs px-4 py-2 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span className="font-bold">{subCheck.message}</span>
          </div>
          <button
            onClick={() => setShowSuperAdminPinDialog(true)}
            className="px-2.5 py-1 rounded bg-black/30 hover:bg-black/50 text-white font-bold text-[11px] transition-colors"
          >
            Régulariser (Super Admin)
          </button>
        </div>
      )}

      {/* Barre d'en-tête principale */}
      <Header
        currentUser={currentUser}
        onUserChange={handleUserChange}
        onOpenPrinterModal={() => setShowPrinterModal(true)}
        onOpenSettingsModal={() => setShowSettingsModal(true)}
        onOpenAuditModal={() => setShowAuditModal(true)}
        onOpenSuperAdminPin={() => setShowSuperAdminPinDialog(true)}
        onLogoutSchool={handleLogoutSchool}
        school={school}
      />

      {/* Barre de navigation par onglets */}
      <Navigation
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        userRole={currentUser.role}
        school={school}
      />

      {/* Contenu principal selon l'onglet actif */}
      <main className="flex-1 pb-12">
        {currentTab === 'dashboard' && (
          <Dashboard
            school={school}
            currentUser={currentUser}
            onNavigateTab={setCurrentTab}
            onOpenReceipt={(payment) => setActiveReceipt(payment)}
          />
        )}

        {currentTab === 'cash' && (
          <CashDesk currentUser={currentUser} school={school} />
        )}

        {currentTab === 'journal' && (
          <CashJournal currentUser={currentUser} school={school} />
        )}

        {currentTab === 'students' && (
          <StudentsList
            currentUser={currentUser}
            onNavigateToCash={(student) => {
              setCurrentTab('cash');
            }}
          />
        )}

        {currentTab === 'kindergarten' && school.active_modules.kindergarten && (
          <KindergartenModule currentUser={currentUser} classes={classes} />
        )}

        {currentTab === 'primary' && school.active_modules.primary && (
          <PrimaryModule currentUser={currentUser} classes={classes} />
        )}

        {currentTab === 'staff' && (
          <SchoolStaffManagement
            school={school}
            currentUser={currentUser}
            classes={classes}
          />
        )}

        {currentTab === 'whatsapp' && (
          <WhatsAppCenter school={school} classes={classes} />
        )}
      </main>

      {/* Modals Globaux */}
      {activeReceipt && (
        <ReceiptModal
          payment={activeReceipt}
          onClose={() => setActiveReceipt(null)}
        />
      )}

      {showPrinterModal && (
        <PrinterSettingsModal
          school={school}
          onClose={() => setShowPrinterModal(false)}
        />
      )}

      {showSettingsModal && (
        <SchoolSettingsModal
          onClose={() => setShowSettingsModal(false)}
          onConfigSaved={handleConfigSaved}
        />
      )}

      {showAuditModal && (
        <AuditLogModal onClose={() => setShowAuditModal(false)} />
      )}

      {/* Boîtes de dialogue Super Admin */}
      <SuperAdminPinDialog
        isOpen={showSuperAdminPinDialog}
        onClose={() => setShowSuperAdminPinDialog(false)}
        onSuccess={() => {
          setShowSuperAdminPinDialog(false);
          setShowSuperAdminModal(true);
        }}
      />

      {showSuperAdminModal && (
        <SuperAdminModal
          isOpen={showSuperAdminModal}
          onClose={() => setShowSuperAdminModal(false)}
          onSelectSchool={(selected) => {
            setSchool(selected);
            const users = storage.getUsersBySchool(selected.id);
            if (users.length > 0) setCurrentUser(users[0]);
            setClasses(storage.getClasses());
            setIsLoggedIntoSchool(true);
          }}
        />
      )}
    </div>
  );
}
