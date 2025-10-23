import React, { useState, useEffect } from 'react';
import { getCropInformation } from '../services/geminiService';
import { SearchIcon, MicrophoneIcon } from './icons/Icons';
import { useLanguage } from '../context/LanguageContext';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import DOMPurify from 'dompurify';
import { marked } from 'marked';


const CropInfo: React.FC = () => {
    const [cropName, setCropName] = useState('');
    const [cropData, setCropData] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { language, t } = useLanguage();
    const { transcript, isListening, startListening, stopListening } = useSpeechRecognition(language);

    useEffect(() => {
        if(transcript) {
            setCropName(transcript);
        }
    }, [transcript]);

    const handleSearch = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!cropName.trim()) {
            setError(t('errorCropName'));
            return;
        }

        setIsLoading(true);
        setError(null);
        setCropData('');

        try {
            const data = await getCropInformation(cropName, language);
            const rawHtml = await marked.parse(data);
            const sanitizedHtml = DOMPurify.sanitize(rawHtml);
            setCropData(sanitizedHtml);
        } catch (err: any) {
            setError(err.message || t('errorCropInfo'));
        } finally {
            setIsLoading(false);
        }
    };
    
    const suggestions = t('cropSuggestions');

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="bg-[var(--card-bg-light)] dark:bg-[var(--card-bg-dark)] p-8 rounded-2xl shadow-xl border border-[var(--border-light)] dark:border-[var(--border-dark)]">
                <h1 className="text-4xl font-extrabold text-gray-800 dark:text-white mb-2">{t('cropInfoTitle')}</h1>
                <p className="text-lg text-gray-500 dark:text-gray-400 mb-8">{t('cropInfoDescription')}</p>

                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 mb-4">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            value={cropName}
                            onChange={(e) => setCropName(e.target.value)}
                            placeholder={t('cropInfoPlaceholder')}
                            className="w-full text-lg p-4 pr-14 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[var(--primary-green)] focus:border-[var(--primary-green)] transition"
                        />
                         <button
                            type="button"
                            onClick={isListening ? stopListening : startListening}
                            className={`absolute top-1/2 right-4 -translate-y-1/2 p-2 rounded-full transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-500 hover:text-gray-700'}`}
                            aria-label={isListening ? 'Stop listening' : 'Start listening'}
                        >
                            <MicrophoneIcon className="w-6 h-6"/>
                        </button>
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex items-center justify-center bg-[var(--primary-green)] text-white font-bold py-4 px-8 rounded-lg hover:bg-[var(--primary-green-dark)] disabled:opacity-50 transition-transform transform hover:scale-105 text-lg"
                    >
                        <SearchIcon className="w-6 h-6 mr-2"/>
                        {isLoading ? t('searchingButton') : t('searchButton')}
                    </button>
                </form>

                <div className="flex flex-wrap gap-2 mb-8">
                    <span className="text-base text-gray-500 dark:text-gray-400 mr-2">{t('suggestionsLabel')}:</span>
                    {suggestions.map(s => (
                        <button 
                            key={s}
                            onClick={() => setCropName(s)}
                            className="text-base bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                            {s}
                        </button>
                    ))}
                </div>

                {error && <p className="text-red-500 text-base my-4 text-center font-semibold">{error}</p>}
                
                <div className="mt-6 min-h-[20rem]">
                    {isLoading && (
                        <div className="text-center py-20">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[var(--primary-green)] mx-auto"></div>
                            <p className="mt-6 text-xl text-gray-600 dark:text-gray-300">{t('loadingCropInfo')}</p>
                        </div>
                    )}
                    {cropData && (
                        <article className="prose prose-lg dark:prose-invert max-w-none p-6 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
                            dangerouslySetInnerHTML={{ __html: cropData }}>
                        </article>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CropInfo;