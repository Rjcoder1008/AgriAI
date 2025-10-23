import React, { useState, useCallback, useEffect } from 'react';
import { identifyPlant } from '../services/geminiService';
import { PlantIdentificationResult } from '../types';
import { UploadIcon, SparklesIcon, MicrophoneIcon } from './icons/Icons';
import { fileToBase64 } from '../utils/fileUtils';
import { useLanguage } from '../context/LanguageContext';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

const PlantIdentifier: React.FC = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [image, setImage] = useState<{ file: File; base64: string; mimeType: string } | null>(null);
  const [result, setResult] = useState<PlantIdentificationResult | null>(null);
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
    if (!image) {
      setError(t('errorImageRequired'));
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const imageData = { mimeType: image.mimeType, data: image.base64 };
      const fullPrompt = `${t('identifierGeminiPrompt')} ${prompt}`;
      const identificationResult = await identifyPlant(fullPrompt, language, imageData);
      setResult(identificationResult);
    } catch (err: any)      {
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
        <h1 className="text-4xl font-extrabold text-gray-800 dark:text-white mb-2">{t('identifierTitle')}</h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 mb-8">{t('identifierDescription')}</p>
        
        {!result && !isLoading && (
          <form onSubmit={handleSubmit} className="space-y-6">
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

            <div>
              <label htmlFor="description" className="block text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('notesLabel')}</label>
               <div className="relative">
                <textarea
                  id="description"
                  rows={2}
                  className="w-full text-lg p-4 pr-12 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[var(--primary-green)] focus:border-[var(--primary-green)] transition"
                  placeholder={t('notesPlaceholder')}
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

            {error && <p className="text-red-500 text-base mb-4 text-center font-semibold">{error}</p>}

            <button
              type="submit"
              disabled={isLoading || !image}
              className="w-full flex items-center justify-center bg-[var(--primary-green)] text-white font-bold text-lg py-4 px-6 rounded-lg hover:bg-[var(--primary-green-dark)] disabled:opacity-50 disabled:cursor-not-allowed transition-transform transform hover:scale-105"
            >
              <SparklesIcon className="w-6 h-6 mr-3"/>
              {isLoading ? t('identifyingButton') : t('identifyButton')}
            </button>
          </form>
        )}

        {isLoading && (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-[var(--primary-green)] mx-auto"></div>
            <p className="mt-6 text-xl text-gray-600 dark:text-gray-300">{t('loadingIdentifier')}</p>
          </div>
        )}
        
        {result && (
            <div className="animate-fade-in">
                <div className="text-center border-b pb-6 mb-6 border-[var(--border-light)] dark:border-[var(--border-dark)]">
                    <h2 className="text-4xl font-extrabold text-[var(--primary-green)]">{result.commonName}</h2>
                    <p className="text-lg font-mono text-gray-500 dark:text-gray-400 mt-1">{result.scientificName}</p>
                </div>
                
                <div className="space-y-8">
                    {image && <img src={`data:${image.mimeType};base64,${image.base64}`} alt="Uploaded plant" className="max-h-80 w-auto mx-auto rounded-lg shadow-lg" />}
                    <div>
                        <h3 className="text-2xl font-bold mb-3 text-gray-800 dark:text-white">{t('descriptionLabel')}</h3>
                        <p className="text-lg text-gray-600 dark:text-gray-300">{result.description}</p>
                    </div>

                    <div>
                        <h3 className="text-2xl font-bold mb-3 text-gray-800 dark:text-white">{t('careTipsLabel')}</h3>
                        <ul className="list-disc list-inside space-y-2 text-lg text-gray-600 dark:text-gray-300">
                            {result.careTips.map((item, index) => <li key={index}>{item}</li>)}
                        </ul>
                    </div>
                </div>

                <div className="mt-10 text-center">
                    <button onClick={resetForm} className="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white font-bold py-3 px-8 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors text-lg">
                        {t('newIdentificationButton')}
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default PlantIdentifier;
