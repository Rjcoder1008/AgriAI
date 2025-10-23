import React, { useState, useRef, useEffect } from 'react';
import { Chat } from '@google/genai';
import { createChatInstance } from '../services/geminiService';
import { ChatMessage } from '../types';
import { SendIcon, BotIcon, UserIcon, MicrophoneIcon } from './icons/Icons';
import { useLanguage } from '../context/LanguageContext';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';

const ExpertChat: React.FC = () => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { language, t } = useLanguage();
  const { transcript, isListening, startListening, stopListening, setTranscript } = useSpeechRecognition(language);
  
  useEffect(() => {
    if (transcript) {
        setInput(prev => prev ? `${prev} ${transcript}` : transcript);
        setTranscript(''); 
    }
  }, [transcript, setTranscript]);

  useEffect(() => {
    const initChat = () => {
      setIsLoading(true);
      const chatInstance = createChatInstance(language);
      setChat(chatInstance);
      setMessages([{ role: 'model', text: t('expertChatWelcome') }]);
      setIsLoading(false);
    };
    initChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !chat || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await chat.sendMessageStream({ message: input });
      let modelResponse = '';
      setMessages((prev) => [...prev, { role: 'model', text: '' }]);

      for await (const chunk of result) {
        modelResponse += chunk.text;
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1].text = modelResponse;
          return newMessages;
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = { role: 'model', text: t('errorChat') };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto bg-[var(--card-bg-light)] dark:bg-[var(--card-bg-dark)] rounded-2xl shadow-xl border border-[var(--border-light)] dark:border-[var(--border-dark)] animate-fade-in">
      <div className="p-4 border-b border-[var(--border-light)] dark:border-[var(--border-dark)]">
        <h2 className="text-2xl font-bold text-center">{t('expertChatTitle')}</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, index) => (
          <div key={index} className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'model' && (
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--primary-green)] flex items-center justify-center">
                <BotIcon className="w-6 h-6 text-white" />
              </div>
            )}
            <div className={`max-w-md p-4 rounded-2xl text-lg ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>
               <div className="prose prose-lg dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br />') }}></div>
            </div>
            {msg.role === 'user' && (
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                <UserIcon className="w-6 h-6 text-white" />
              </div>
            )}
          </div>
        ))}
        {isLoading && messages[messages.length-1]?.role === 'user' && (
            <div className="flex items-start gap-4">
                 <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--primary-green)] flex items-center justify-center">
                    <BotIcon className="w-6 h-6 text-white" />
                </div>
                <div className="max-w-md p-4 rounded-2xl bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-gray-500 rounded-full animate-pulse"></div>
                        <div className="w-3 h-3 bg-gray-500 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                        <div className="w-3 h-3 bg-gray-500 rounded-full animate-pulse [animation-delay:0.4s]"></div>
                    </div>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-[var(--border-light)] dark:border-[var(--border-dark)] bg-white/50 dark:bg-black/20">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={t('expertChatPlaceholder')}
            className="w-full text-lg p-4 pr-28 bg-gray-100 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-full focus:ring-2 focus:ring-[var(--primary-green)] focus:border-[var(--primary-green)] transition"
            disabled={isLoading}
          />
          <div className="absolute inset-y-0 right-3 flex items-center">
            <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`p-2 rounded-full transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-gray-500 hover:text-[var(--primary-green)]'}`}
                aria-label={isListening ? 'Stop listening' : 'Start listening'}
                disabled={isLoading}
            >
                <MicrophoneIcon className="w-7 h-7"/>
            </button>
            <button onClick={sendMessage} disabled={isLoading || !input.trim()} className="p-2 rounded-full text-white bg-[var(--primary-green)] hover:bg-[var(--primary-green-dark)] disabled:bg-gray-400 dark:disabled:bg-gray-600 transition-colors ml-2">
                <SendIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpertChat;
