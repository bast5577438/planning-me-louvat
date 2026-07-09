/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User } from '../types';
import { Shield, Users, LogOut, RefreshCw } from 'lucide-react';
import { LouvatLogo } from './LouvatLogo';

interface NavbarProps {
  currentUser: User | null;
  allUsers: User[];
  onUserChange: (user: User | null) => void;
  onNavigate: (view: 'calendar' | 'dashboard' | 'partners' | 'settings' | 'notifications') => void;
  activeView: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  allUsers,
  onUserChange,
  onNavigate,
  activeView,
}) => {
  return (
    <header className="bg-[#FDFCF8] border-b border-[#E5E1D8] sticky top-0 z-40 shadow-xs" id="main-header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo & Brand */}
          <div className="flex items-center cursor-pointer" onClick={() => onNavigate('calendar')} id="brand-logo-container">
            <LouvatLogo className="h-11 w-auto" color="text-[#8B5E3C]" />
          </div>

          {/* Navigation Links - Responsive */}
          {currentUser && (
            <nav className="hidden md:flex space-x-1" id="desktop-nav">
              <button
                id="btn-nav-calendar"
                onClick={() => onNavigate('calendar')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                  activeView === 'calendar'
                    ? 'bg-[#F5F2EA] text-[#8B5E3C]'
                    : 'text-[#3C2A21]/70 hover:bg-[#F5F2EA]/60 hover:text-[#3C2A21]'
                }`}
              >
                Planning
              </button>

              {currentUser.role === 'ADMIN' ? (
                <>
                  <button
                    id="btn-nav-dashboard"
                    onClick={() => onNavigate('dashboard')}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                      activeView === 'dashboard'
                        ? 'bg-[#F5F2EA] text-[#8B5E3C]'
                        : 'text-[#3C2A21]/70 hover:bg-[#F5F2EA]/60 hover:text-[#3C2A21]'
                    }`}
                  >
                    Tableau de bord
                  </button>
                  <button
                    id="btn-nav-partners"
                    onClick={() => onNavigate('partners')}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                      activeView === 'partners'
                        ? 'bg-[#F5F2EA] text-[#8B5E3C]'
                        : 'text-[#3C2A21]/70 hover:bg-[#F5F2EA]/60 hover:text-[#3C2A21]'
                    }`}
                  >
                    Auto-entrepreneurs
                  </button>
                  <button
                    id="btn-nav-settings"
                    onClick={() => onNavigate('settings')}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                      activeView === 'settings'
                        ? 'bg-[#F5F2EA] text-[#8B5E3C]'
                        : 'text-[#3C2A21]/70 hover:bg-[#F5F2EA]/60 hover:text-[#3C2A21]'
                    }`}
                  >
                    Paramètres
                  </button>
                </>
              ) : (
                <div 
                  className="bg-[#EAF0DE] text-[#7B8A56] px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider select-none flex items-center space-x-2 border border-[#D4DEC3]"
                  title="Vous êtes connecté en tant qu'auto-entrepreneur. Le planning ci-dessous est votre espace de travail."
                >
                  <span className="h-2 w-2 rounded-full bg-[#7B8A56]"></span>
                  <span>Mode Auto-entrepreneur</span>
                </div>
              )}
              
              <button
                id="btn-nav-notifications"
                onClick={() => onNavigate('notifications')}
                className={`px-3 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                  activeView === 'notifications'
                    ? 'bg-[#F5F2EA] text-[#8B5E3C]'
                    : 'text-[#3C2A21]/70 hover:bg-[#F5F2EA]/60 hover:text-[#3C2A21]'
                }`}
              >
                Journal d'alertes
              </button>
            </nav>
          )}

          {/* User Profile Info */}
          <div className="flex items-center space-x-3">
            {currentUser ? (
              <div className="flex items-center space-x-2" id="profile-block">
                <div className="h-8 w-8 rounded-full flex items-center justify-center text-white font-bold shadow-sm" style={{ backgroundColor: currentUser.color || '#3b82f6' }}>
                  {currentUser.name.charAt(0)}
                </div>
                <button
                  id="btn-logout"
                  onClick={() => onUserChange(null)}
                  className="p-1.5 text-stone-500 hover:text-amber-800 hover:bg-stone-100 rounded-full transition-all"
                  title="Se déconnecter"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <span className="text-xs text-stone-400 font-medium">Biscuiterie Louvat</span>
            )}
          </div>

        </div>
      </div>
      
      {/* Mobile Nav Bar - visible only to logged-in users */}
      {currentUser && (
        <div className="md:hidden flex border-t border-[#E5E1D8] bg-[#FDFCF8] justify-around py-2" id="mobile-navigation-bar">
          <button
            onClick={() => onNavigate('calendar')}
            className={`flex flex-col items-center p-1 text-[11px] font-semibold transition-all ${
              activeView === 'calendar' ? 'text-[#8B5E3C]' : 'text-[#3C2A21]/60'
            }`}
          >
            <span className="text-lg">📅</span>
            Planning
          </button>
          
          {currentUser.role === 'ADMIN' ? (
            <>
              <button
                onClick={() => onNavigate('dashboard')}
                className={`flex flex-col items-center p-1 text-[11px] font-semibold transition-all ${
                  activeView === 'dashboard' ? 'text-[#8B5E3C]' : 'text-[#3C2A21]/60'
                }`}
              >
                <span className="text-lg">📊</span>
                Stats
              </button>
              <button
                onClick={() => onNavigate('partners')}
                className={`flex flex-col items-center p-1 text-[11px] font-semibold transition-all ${
                  activeView === 'partners' ? 'text-[#8B5E3C]' : 'text-[#3C2A21]/60'
                }`}
              >
                <span className="text-lg">👥</span>
                Entrepreneurs
              </button>
              <button
                onClick={() => onNavigate('settings')}
                className={`flex flex-col items-center p-1 text-[11px] font-semibold transition-all ${
                  activeView === 'settings' ? 'text-[#8B5E3C]' : 'text-[#3C2A21]/60'
                }`}
              >
                <span className="text-lg">⚙️</span>
                Réglages
              </button>
            </>
          ) : (
            <div className="flex items-center text-[#3C2A21]/70 text-[11px] font-bold py-1">
              <span>👤 {currentUser.name}</span>
            </div>
          )}
          
          <button
            onClick={() => onNavigate('notifications')}
            className={`flex flex-col items-center p-1 text-[11px] font-semibold transition-all ${
              activeView === 'notifications' ? 'text-[#8B5E3C]' : 'text-[#3C2A21]/60'
            }`}
          >
            <span className="text-lg">🔔</span>
            Alertes
          </button>
        </div>
      )}
    </header>
  );
};
