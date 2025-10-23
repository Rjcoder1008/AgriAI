import React, { useState, useEffect } from 'react';
import { getCommunityAnswer } from '../services/geminiService';
import { useLanguage } from '../context/LanguageContext';
import { CommunityPost } from '../types';
import { SendIcon, BotIcon, UserIcon } from './icons/Icons';

const CommunityHub: React.FC = () => {
    const [question, setQuestion] = useState('');
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { language, t } = useLanguage();

    useEffect(() => {
        try {
            const savedPosts = localStorage.getItem('agri-community-posts');
            if (savedPosts) {
                setPosts(JSON.parse(savedPosts));
            }
        } catch (e) {
            console.error("Failed to load posts from localStorage", e);
        }
    }, []);

    useEffect(() => {
        try {
            localStorage.setItem('agri-community-posts', JSON.stringify(posts));
        } catch(e) {
            console.error("Failed to save posts to localStorage", e);
        }
    }, [posts]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!question.trim()) {
            setError(t('communityQuestionError'));
            return;
        }

        setIsLoading(true);
        setError(null);
        
        try {
            const answer = await getCommunityAnswer(question, language);
            const newPost: CommunityPost = {
                id: new Date().toISOString(),
                question,
                answer,
                timestamp: new Date().toLocaleString(language),
            };
            setPosts(prevPosts => [newPost, ...prevPosts]);
            setQuestion('');
        } catch (err: any) {
            setError(err.message || t('errorUnknown'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="bg-[var(--card-bg-light)] dark:bg-[var(--card-bg-dark)] p-8 rounded-2xl shadow-xl border border-[var(--border-light)] dark:border-[var(--border-dark)]">
                <h1 className="text-4xl font-extrabold text-gray-800 dark:text-white mb-2">{t('communityHubTitle')}</h1>
                <p className="text-lg text-gray-500 dark:text-gray-400 mb-8">{t('communityHubDescription')}</p>

                <form onSubmit={handleSubmit} className="mb-8">
                    <div className="relative">
                        <textarea
                            rows={3}
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            placeholder={t('askQuestionPlaceholder')}
                            className="w-full text-lg p-4 pr-28 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[var(--primary-green)] focus:border-[var(--primary-green)] transition"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="absolute bottom-3 right-3 flex items-center justify-center bg-[var(--primary-green)] text-white font-bold py-2 px-4 rounded-lg hover:bg-[var(--primary-green-dark)] disabled:opacity-50"
                        >
                            <SendIcon className="w-5 h-5 mr-2" />
                            {isLoading ? t('askingButton') : t('askButton')}
                        </button>
                    </div>
                     {error && <p className="text-red-500 text-sm mt-2 font-semibold">{error}</p>}
                </form>

                <div className="space-y-6">
                    {posts.map(post => (
                        <div key={post.id} className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg border border-[var(--border-light)] dark:border-[var(--border-dark)]">
                            <div className="flex items-start gap-4 mb-4">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                                    <UserIcon className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">{t('yourQuestion')}</h3>
                                    <p className="text-lg">{post.question}</p>
                                    <p className="text-xs text-gray-500 mt-1">{post.timestamp}</p>
                                </div>
                            </div>
                            <div className="border-t border-[var(--border-light)] dark:border-[var(--border-dark)] pt-4 flex items-start gap-4">
                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--primary-green)] flex items-center justify-center">
                                    <BotIcon className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">{t('agriBotAnswer')}</h3>
                                    <p className="text-lg text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{post.answer}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CommunityHub;
