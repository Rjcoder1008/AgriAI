import React, { useState, useCallback, useEffect } from 'react';
import { diagnosePlant } from '../services/geminiService';
import { DiagnosisResult } from '../types';
// FIX: Import 'InfoIcon' to fix 'Cannot find name' error.
import { UploadIcon, SparklesIcon, MicrophoneIcon, LeafIcon, FlaskIcon, ShieldCheckIcon, InfoIcon } from './icons/Icons';
import { fileToBase64 } from '../utils/fileUtils';
import { useLanguage } from '../context/LanguageContext';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

const ResultSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div>
        <h3 className="flex items-center text-xl font-bold mb-3 text-gray-800 dark:text-white">
            {icon}
            <span className="ml-3">{title}</span>
        </h3>
        {children}
    </div>
);


const DiseaseDiagnoser: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [image, setImage] = useState<{ file: File; base64: string; mimeType: string } | null>(null);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { language, t } = useLanguage();
  const { transcript, isListening, startListening, stopListening } = useSpeechRecognition(language);

  useEffect(() => {
    if (transcript) {
        setPrompt(prev => prev ? `${prev} ${transcript}` : transcript);
    }
  }, [transcript]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if(file.size > 4 * 1024 * 1024) {
          setError(t('errorFileSize'));
          return;
      }
      const { base64, mimeType } = await fileToBase64(file);
      setImage({ file, base64, mimeType });
      setError(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!prompt && !image) {
      setError(t('errorPromptOrImage'));
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const imageData = image ? { mimeType: image.mimeType, data: image.base64 } : undefined;
      const fullPrompt = `${t('diagnoserGeminiPrompt')} ${prompt}`;
      const diagnosisResult = await diagnosePlant(fullPrompt, language, imageData);
      setResult(diagnosisResult);
    } catch (err: any) {
      setError(err.message || t('errorUnknown'));
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetForm = useCallback(() => {
    setPrompt('');
    setImage(null);
    setResult(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <div className="bg-[var(--card-bg-light)] dark:bg-[var(--card-bg-dark)] p-8 rounded-2xl shadow-xl border border-[var(--border-light)] dark:border-[var(--border-dark)]">
        <h1 className="text-4xl font-extrabold text-gray-800 dark:text-white mb-2">{t('diagnoserTitle')}</h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 mb-8">{t('diagnoserDescription')}</p>
        
        {!result && !isLoading && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="description" className="block text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('symptomsLabel')}</label>
              <div className="relative">
                <textarea
                  id="description"
                  rows={4}
                  className="w-full text-lg p-4 pr-12 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[var(--primary-green)] focus:border-[var(--primary-green)] transition"
                  placeholder={t('symptomsPlaceholder')}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
                <button
                    type="button"
                    onClick={isListening ? stopListening : startListening}
                    className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300'}`}
                    aria-label={isListening ? 'Stop listening' : 'Start listening'}
                >
                    <MicrophoneIcon className="w-6 h-6"/>
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="file-upload" className="block text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('uploadLabel')}</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  {image ? (
                    <img src={`data:${image.mimeType};base64,${image.base64}`} alt="Preview" className="mx-auto h-24 w-24 object-cover rounded-md" />
                  ) : (
                    <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                  )}
                  <div className="flex text-base text-gray-600 dark:text-gray-400">
                    <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-medium text-[var(--primary-green)] hover:text-[var(--primary-green-dark)] focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-[var(--primary-green)]">
                      <span>{t('uploadLink')}</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*"/>
                    </label>
                    <p className="pl-1">{t('dragAndDrop')}</p>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-500">{image ? image.file.name : t('fileTypes')}</p>
                </div>
              </div>
            </div>

            {error && <p className="text-red-500 text-base mb-4 text-center font-semibold">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center bg-[var(--primary-green)] text-white font-bold text-lg py-4 px-6 rounded-lg hover:bg-[var(--primary-green-dark)] disabled:opacity-50 disabled:cursor-not-allowed transition-transform transform hover:scale-105"
            >
              <SparklesIcon className="w-6 h-6 mr-3"/>
              {isLoading ? t('diagnosingButton') : t('getDiagnosisButton')}
            </button>
          </form>
        )}

        {isLoading && (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-[var(--primary-green)] mx-auto"></div>
            <p className="mt-6 text-xl text-gray-600 dark:text-gray-300">{t('loadingDiagnoser')}</p>
          </div>
        )}
        
        {result && (
            <div className="animate-fade-in space-y-8">
                <div className="text-center border-b pb-6 mb-6 border-[var(--border-light)] dark:border-[var(--border-dark)]">
                    <h2 className="text-4xl font-extrabold text-[var(--primary-green)]">{result.diseaseName}</h2>
                    <p className="text-base text-gray-500 dark:text-gray-400 mt-2">{t('confidenceLabel')}: <strong className="font-bold text-lg">{result.confidence}</strong></p>
                </div>
                
                <ResultSection title={t('descriptionLabel')} icon={<InfoIcon className="w-7 h-7" />}>
                    <p className="text-lg text-gray-600 dark:text-gray-300">{result.description}</p>
                </ResultSection>

                <div className="grid md:grid-cols-2 gap-8">
                    <ResultSection title={t('organicTreatmentsLabel')} icon={<LeafIcon className="w-7 h-7 text-green-500" />}>
                        <ul className="list-disc list-inside space-y-2 text-lg text-gray-600 dark:text-gray-300">
                            {result.organicTreatments.map((item, index) => <li key={index}>{item}</li>)}
                        </ul>
                    </ResultSection>
                    <ResultSection title={t('chemicalTreatmentsLabel')} icon={<FlaskIcon className="w-7 h-7 text-orange-500" />}>
                        <ul className="list-disc list-inside space-y-2 text-lg text-gray-600 dark:text-gray-300">
                            {result.chemicalTreatments.map((item, index) => <li key={index}>{item}</li>)}
                        </ul>
                    </ResultSection>
                </div>
                 <ResultSection title={t('preventionTipsLabel')} icon={<ShieldCheckIcon className="w-7 h-7 text-blue-500" />}>
                    <ul className="list-disc list-inside space-y-2 text-lg text-gray-600 dark:text-gray-300">
                        {result.preventionTips.map((item, index) => <li key={index}>{item}</li>)}
                    </ul>
                </ResultSection>

                <div className="mt-10 text-center">
                    <button onClick={resetForm} className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white font-bold py-3 px-8 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors text-lg">
                        {t('newDiagnosisButton')}
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default DiseaseDiagnoser;