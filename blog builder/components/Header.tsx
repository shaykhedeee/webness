import React from 'react';
import { View } from '../App';
import { FormIcon, SettingsIcon, HistoryIcon } from './icons/NavIcons';
import { SunIcon, MoonIcon } from './icons/StatusIcons';

interface HeaderProps {
  setView: (view: View) => void;
  currentView: View;
  isHighContrast: boolean;
  setHighContrast: (value: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ setView, currentView, isHighContrast, setHighContrast }) => {
  const getButtonClass = (viewName: 'form' | 'history' | 'settings') => {
    const isActive = (viewName === 'form' && ['form', 'generating', 'preview'].includes(currentView)) || currentView === viewName;
    return `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
    }`;
  };

  return (
    <header className="container mx-auto px-4 py-4">
      <div className="flex justify-between items-center">
        <div className="text-2xl font-bold tracking-tighter cursor-pointer" onClick={() => setView('form')}>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-500">
            BlogGenius AI
          </span>
        </div>
        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-1 p-1 bg-gray-900/50 border border-gray-700 rounded-lg">
            <button onClick={() => setView('form')} className={getButtonClass('form')} aria-label="Generator">
              <FormIcon /> Generator
            </button>
            <button onClick={() => setView('history')} className={getButtonClass('history')} aria-label="History">
              <HistoryIcon /> History
            </button>
            <button onClick={() => setView('settings')} className={getButtonClass('settings')} aria-label="Settings">
              <SettingsIcon /> Settings
            </button>
          </nav>
          <button 
            onClick={() => setHighContrast(!isHighContrast)} 
            className="p-2 rounded-full bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
            aria-label="Toggle High Contrast Mode"
            title="Toggle High Contrast Mode"
          >
            {isHighContrast ? <MoonIcon /> : <SunIcon />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;