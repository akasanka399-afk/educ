import React from 'react';
import { UserRole, SchoolConfig } from '../types';
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  GraduationCap,
  Baby,
  BookOpen,
  MessageSquare,
  History,
  ShieldCheck,
  CreditCard,
} from 'lucide-react';

export type TabType =
  | 'dashboard'
  | 'cash'
  | 'journal'
  | 'students'
  | 'id-cards'
  | 'kindergarten'
  | 'primary'
  | 'whatsapp'
  | 'staff';

interface NavigationProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  userRole: UserRole;
  school: SchoolConfig;
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onTabChange,
  userRole,
  school,
}) => {
  const isFinanceAuthorized = ['school_admin', 'founder', 'director', 'accountant', 'secretary'].includes(userRole);
  const isStaffManagementAuthorized = ['school_admin', 'founder', 'director'].includes(userRole);

  const tabs = [
    {
      id: 'dashboard' as TabType,
      label: 'Tableau de bord',
      icon: LayoutDashboard,
      visible: true,
    },
    {
      id: 'staff' as TabType,
      label: 'Équipe & Accès',
      icon: ShieldCheck,
      visible: isStaffManagementAuthorized,
      badge: 'Admin',
    },
    {
      id: 'cash' as TabType,
      label: 'Guichet Caisse',
      icon: Wallet,
      visible: isFinanceAuthorized,
    },
    {
      id: 'journal' as TabType,
      label: 'Journal de Caisse',
      icon: Receipt,
      visible: isFinanceAuthorized,
    },
    {
      id: 'students' as TabType,
      label: 'Élèves & Inscriptions',
      icon: GraduationCap,
      visible: true,
    },
    {
      id: 'id-cards' as TabType,
      label: 'Cartes Scolaires',
      icon: CreditCard,
      visible: true,
      badge: 'QR Code',
    },
    {
      id: 'kindergarten' as TabType,
      label: 'Maternelle',
      icon: Baby,
      visible: school.active_modules.kindergarten,
      badge: 'Cycle Éveil',
    },
    {
      id: 'primary' as TabType,
      label: 'Primaire',
      icon: BookOpen,
      visible: school.active_modules.primary,
      badge: 'CP-CM2',
    },
    {
      id: 'whatsapp' as TabType,
      label: 'WhatsApp Parents',
      icon: MessageSquare,
      visible: true,
    },
  ];

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 no-scrollbar">
          {tabs
            .filter((t) => t.visible)
            .map((tab) => {
              const Icon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-semibold ${
                        isActive
                          ? 'bg-emerald-700/60 text-white'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
        </div>
      </div>
    </nav>
  );
};
