import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import PlantIdentifier from './components/PlantIdentifier';
import DiseaseDiagnoser from './components/DiseaseDiagnoser';
import ExpertChat from './components/ExpertChat';
import CropInfo from './components/CropInfo';
import MarketPrices from './components/MarketPrices';
import CommunityHub from './components/CommunityHub';
import { useLanguage } from './context/LanguageContext';

export type View = 'identifier' | 'diagnoser' | 'chat' | 'crop-info' | 'market-prices' | 'community-hub';

const App: React.FC = () => {
    const [activeView, setActiveView] = useState<View>('identifier');
    const { language } = useLanguage();
    const [isDarkMode, setIsDarkMode] = useState(() => {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    useEffect(() => {
        // Set the document's lang attribute for accessibility
        document.documentElement.lang = language;
    }, [language]);

    const toggleDarkMode = () => setIsDarkMode(!isDarkMode);
    
    const renderContent = () => {
        switch(activeView) {
            case 'identifier': return <PlantIdentifier />;
            case 'diagnoser': return <DiseaseDiagnoser />;
            case 'chat': return <ExpertChat />;
            case 'crop-info': return <CropInfo />;
            case 'market-prices': return <MarketPrices />;
            case 'community-hub': return <CommunityHub />;
            default: return <PlantIdentifier />;
        }
    };
    
    return (
        <div className="flex h-screen bg-[var(--bg-light)] dark:bg-[var(--bg-dark)] font-sans text-[var(--text-light)] dark:text-[var(--text-dark)]">
            <Sidebar 
                activeView={activeView} 
                onSelectView={setActiveView}
                isDarkMode={isDarkMode}
                toggleDarkMode={toggleDarkMode}
            />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                {renderContent()}
            </main>
        </div>
    );
};

export default App;
