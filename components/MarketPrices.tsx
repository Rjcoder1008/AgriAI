import React, { useState, useEffect } from 'react';
import { getMarketPrices } from '../services/geminiService';
import { SearchIcon, MicrophoneIcon } from './icons/Icons';
import { useLanguage } from '../context/LanguageContext';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { MarketPriceResult } from '../types';

const MarketPrices: React.FC = () => {
    const [cropName, setCropName] = useState('');
    const [results, setResults] = useState<MarketPriceResult[]>([]);
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { language, t } = useLanguage();
    const { transcript, isListening, startListening, stopListening } = useSpeechRecognition(language);

    useEffect(() => {
        if(transcript) {
            setCropName(transcript);
        }
    }, [transcript]);

    const parseMarkdownTable = (markdown: string, sources: any[]): MarketPriceResult[] => {
        const lines = markdown.split('\n').map(line => line.trim());
        const tableLines = lines.filter(line => line.startsWith('|') && line.endsWith('|'));
        if (tableLines.length < 3) return [];

        const dataLines = tableLines.slice(2);
        return dataLines.map((line, index) => {
            const cells = line.split('|').map(cell => cell.trim()).slice(1, -1);
            return {
                cropName: cropName,
                marketName: cells[0] || 'N/A',
                price: cells[1] || 'N/A',
                date: cells[2] || 'N/A',
                source: sources[index] ? { uri: sources[index]?.web?.uri, title: sources[index]?.web?.title } : undefined
            };
        });
    };

    const handleSearch = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!cropName.trim()) {
            setError(t('errorCropName'));
            return;
        }

        setIsLoading(true);
        setError(null);
        setResults([]);
        setSummary('');

        try {
            const { text, sources } = await getMarketPrices(cropName, language);
            const summaryText = text.split('|---')[0].trim();
            setSummary(summaryText);
            const parsedResults = parseMarkdownTable(text, sources);
            if (parsedResults.length === 0 && summaryText) {
                // If table parsing fails but we have text, show it
                setError(t('marketPriceError'));
            } else {
                 setResults(parsedResults);
            }
        } catch (err: any) {
            setError(err.message || t('marketPriceError'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="bg-[var(--card-bg-light)] dark:bg-[var(--card-bg-dark)] p-8 rounded-2xl shadow-xl border border-[var(--border-light)] dark:border-[var(--border-dark)]">
                <h1 className="text-4xl font-extrabold text-gray-800 dark:text-white mb-2">{t('marketPricesTitle')}</h1>
                <p className="text-lg text-gray-500 dark:text-gray-400 mb-8">{t('marketPricesDescription')}</p>

                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 mb-8">
                    <div className="relative flex-grow">
                        <input
                            type="text"
                            value={cropName}
                            onChange={(e) => setCropName(e.target.value)}
                            placeholder={t('marketPricesPlaceholder')}
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
                        {isLoading ? t('gettingPricesButton') : t('getPricesButton')}
                    </button>
                </form>

                {error && <p className="text-red-500 text-base my-4 text-center font-semibold">{error}</p>}
                
                <div className="min-h-[20rem]">
                    {isLoading && (
                        <div className="text-center py-20">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[var(--primary-green)] mx-auto"></div>
                            <p className="mt-6 text-xl text-gray-600 dark:text-gray-300">{t('loadingMarketPrices')}</p>
                        </div>
                    )}
                    
                    {summary && <p className="mb-6 text-lg">{summary}</p>}

                    {results.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {results.map((result, index) => (
                                <div key={index} className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg border border-[var(--border-light)] dark:border-[var(--border-dark)]">
                                    <h3 className="font-bold text-xl text-[var(--primary-green)]">{result.marketName}</h3>
                                    <p className="text-2xl font-extrabold my-2">{result.price}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">As of: {result.date}</p>
                                    {result.source && result.source.uri && (
                                        <a href={result.source.uri} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline mt-2 inline-block">
                                            {t('priceSource')}: {result.source.title || 'Link'}
                                        </a>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MarketPrices;
