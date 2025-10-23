import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Language } from '../types';
import { View } from '../App';
import { PlantIcon, BugIcon, ChatIcon, InfoIcon, PriceIcon, CommunityIcon, AgriHelperIcon, SunIcon, MoonIcon } from './icons/Icons';

interface SidebarProps {
  activeView: View;
  onSelectView: (view: View) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full px-4 py-3 text-lg font-semibold rounded-lg transition-all duration-200 ease-in-out transform hover:scale-105 ${
      isActive
        ? 'bg-[var(--primary-green)] text-white shadow-md'
        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
    }`}
  >
    {icon}
    <span className="ml-4">{label}</span>
  </button>
);

const Sidebar: React.FC<SidebarProps> = ({ activeView, onSelectView, isDarkMode, toggleDarkMode }) => {
  const { language, setLanguage, t } = useLanguage();

  const navItems = [
    { id: 'identifier', label: t('identifierTitle'), icon: <PlantIcon className="w-6 h-6" /> },
    { id: 'diagnoser', label: t('diagnoserTitle'), icon: <BugIcon className="w-6 h-6" /> },
    { id: 'chat', label: t('expertChatTitle'), icon: <ChatIcon className="w-6 h-6" /> },
    { id: 'crop-info', label: t('cropInfoTitle'), icon: <InfoIcon className="w-6 h-6" /> },
    { id: 'market-prices', label: t('marketPricesTitle'), icon: <PriceIcon className="w-6 h-6" /> },
    { id: 'community-hub', label: t('communityHubTitle'), icon: <CommunityIcon className="w-6 h-6" /> },
  ] as const;

  return (
    <aside className="w-72 flex-shrink-0 bg-[var(--card-bg-light)] dark:bg-[var(--card-bg-dark)] border-r border-[var(--border-light)] dark:border-[var(--border-dark)] flex flex-col p-6">
        <div className="flex items-center mb-10 px-2">
            <AgriHelperIcon className="w-10 h-10 text-[var(--primary-green)]" />
            <h1 className="text-2xl font-extrabold ml-3 text-gray-800 dark:text-white">AgriHelper</h1>
        </div>

      <nav className="flex-1 space-y-3">
        {navItems.map((item) => (
          <NavItem
            key={item.id}
            icon={item.icon}
            label={item.label}
            isActive={activeView === item.id}
            onClick={() => onSelectView(item.id)}
          />
        ))}
      </nav>

      <div className="mt-auto space-y-4">
        <div>
          <label htmlFor="language-select" className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1 px-2">
            Language
          </label>
          <select
            id="language-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-base focus:ring-2 focus:ring-[var(--primary-green)] focus:border-[var(--primary-green)]"
          >
            <option value="en-US">English</option>
            <option value="es-ES">Español</option>
            <option value="hi-IN">हिन्दी</option>
            <option value="kn-IN">ಕನ್ನಡ</option>
          </select>
        </div>
        <button 
          onClick={toggleDarkMode} 
          className="w-full flex items-center justify-center p-2.5 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          aria-label="Toggle dark mode"
        >
          {isDarkMode ? <SunIcon className="w-6 h-6 text-yellow-400" /> : <MoonIcon className="w-6 h-6 text-gray-700" />}
          <span className="ml-3 font-semibold">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
