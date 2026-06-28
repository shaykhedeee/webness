import React, { useState, useCallback, useEffect } from 'react';
import { BlogGenerationConfig, PipelineState, PipelineStep, StepStatus, Language, WordPressCreds, BloggerCreds, UserSettings, DefaultPlatform, DefaultDownloadFormat, BlogResult } from './types';
import Header from './components/Header';
import Footer from './components/Footer';
import BlogForm from './components/BlogForm';
import StatusDisplay from './components/StatusDisplay';
import Preview from './components/Preview';
import Settings from './components/Settings';
import History from './components/History';
import Toast from './components/Toast';
import Stepper from './components/Stepper';
import { generateOutline, draftBlog, polishBlog, generateImages, translateText } from './services/geminiService';
import { useLocalStorage } from './hooks/useLocalStorage';

const NATIVE_GENERATION_LANGUAGES = new Set([Language.ENGLISH, Language.SPANISH, Language.HINDI]);
const WP_CREDS_KEY = 'blogGeniusWpCreds';
const BLOGGER_CREDS_KEY = 'blogGeniusBloggerCreds';
const USER_SETTINGS_KEY = 'blogGeniusUserSettings';
const HISTORY_KEY = 'blogGeniusHistory';

export type View = 'form' | 'generating' | 'preview' | 'settings' | 'history';
export type ToastMessage = { id: number; message: string; type: 'success' | 'error' };

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const App: React.FC = () => {
  const [view, setView] = useState<View>('form');
  const [config, setConfig] = useState<BlogGenerationConfig | null>(null);
  const [pipelineState, setPipelineState] = useState<PipelineState>({});
  const [error, setError] = useState<string | null>(null);
  const [blogResult, setBlogResult] = useState<BlogResult | null>(null);
  
  const [wpCreds, setWpCreds] = useLocalStorage<WordPressCreds | null>(WP_CREDS_KEY, null);
  const [bloggerCreds, setBloggerCreds] = useLocalStorage<BloggerCreds | null>(BLOGGER_CREDS_KEY, null);
  const [userSettings, setUserSettings] = useLocalStorage<UserSettings>(USER_SETTINGS_KEY, {
    defaultPlatform: DefaultPlatform.NONE,
    defaultDownloadFormat: DefaultDownloadFormat.DOCX
  });

  const [history, setHistory] = useLocalStorage<BlogResult[]>(HISTORY_KEY, []);
  const [isHighContrast, setIsHighContrast] = useLocalStorage<boolean>('blogGeniusHighContrast', false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    document.documentElement.classList.toggle('high-contrast', isHighContrast);
  }, [isHighContrast]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    const newToast = { id: Date.now(), message, type };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => {
      setToasts(currentToasts => currentToasts.filter(t => t.id !== newToast.id));
    }, 3000);
  };

  const updateStepStatus = (step: PipelineStep, status: StepStatus) => {
    setPipelineState(prev => ({ ...prev, [step]: status }));
  };

  const resetState = () => {
    setConfig(null);
    setPipelineState({});
    setError(null);
    setBlogResult(null);
    setView('form');
  };
  
  const viewHistoryItem = (item: BlogResult) => {
    setBlogResult(item);
    setView('preview');
  };
  
  const deleteHistoryItem = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
    showToast("Blog post deleted from history.", "success");
  };

  const handleSaveSettings = (wp: WordPressCreds | null, blogger: BloggerCreds | null, settings: UserSettings) => {
    setWpCreds(wp);
    setBloggerCreds(blogger);
    setUserSettings(settings);
    showToast("Settings saved successfully!", "success");
    setView('form');
  };

  const runPipeline = useCallback(async (currentConfig: BlogGenerationConfig) => {
    setError(null);
    setPipelineState({});

    try {
      const isNativeGeneration = NATIVE_GENERATION_LANGUAGES.has(currentConfig.language);
      const generationLanguage = isNativeGeneration ? currentConfig.language : Language.ENGLISH;

      updateStepStatus(PipelineStep.OUTLINE, 'running');
      let researchContent = '';
      if (currentConfig.researchFile) {
        researchContent = await currentConfig.researchFile.text();
      } else if (currentConfig.researchUrl) {
        researchContent = `Please research this URL: ${currentConfig.researchUrl}`;
      }
      const outline = await generateOutline(currentConfig.topic, currentConfig.keywords, generationLanguage, researchContent);
      updateStepStatus(PipelineStep.OUTLINE, 'success');
      await delay(1000);

      updateStepStatus(PipelineStep.DRAFT, 'running');
      const draft = await draftBlog(outline, currentConfig.topic, currentConfig.keywords, currentConfig.tone, generationLanguage);
      updateStepStatus(PipelineStep.DRAFT, 'success');
      await delay(1000);

      updateStepStatus(PipelineStep.POLISH, 'running');
      const polished = await polishBlog(draft, generationLanguage);
      updateStepStatus(PipelineStep.POLISH, 'success');
      await delay(1000);
      
      let finalContent = polished;

      if (!isNativeGeneration) {
        updateStepStatus(PipelineStep.TRANSLATE, 'running');
        finalContent = await translateText(polished, currentConfig.language);
        updateStepStatus(PipelineStep.TRANSLATE, 'success');
        await delay(1000);
      }

      updateStepStatus(PipelineStep.IMAGING, 'running');
      const images = await generateImages(polished, currentConfig.topic);
      updateStepStatus(PipelineStep.IMAGING, 'success');
      
      const newResult: BlogResult = {
        id: `blog-${Date.now()}`,
        createdAt: new Date().toISOString(),
        title: currentConfig.topic,
        content: finalContent,
        images: images,
      };

      setBlogResult(newResult);
      setHistory(prev => [newResult, ...prev]);
      setView('preview');

    } catch (err: any) {
      console.error('Pipeline Error:', err);
      setError(err.message || 'An unknown error occurred during the generation process.');
      const runningStep = Object.keys(pipelineState).find(step => pipelineState[step as PipelineStep] === 'running') as PipelineStep;
      if (runningStep) {
        updateStepStatus(runningStep, 'error');
      }
    }
  }, [pipelineState, setHistory]);

  useEffect(() => {
    if (view === 'generating' && config) {
      runPipeline(config);
    }
  }, [view, config, runPipeline]);

  const handleFormSubmit = (data: BlogGenerationConfig) => {
    setConfig(data);
    setPipelineState({});
    setError(null);
    setBlogResult(null);
    setView('generating');
  };

  const renderContent = () => {
    switch (view) {
      case 'settings':
        return <Settings existingWpCreds={wpCreds} existingBloggerCreds={bloggerCreds} existingSettings={userSettings} onSave={handleSaveSettings} showToast={showToast} />;
      case 'history':
        return <History history={history} onView={viewHistoryItem} onDelete={deleteHistoryItem} />;
      case 'generating':
        return (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 md:p-8 shadow-2xl border border-gray-700">
            <h2 className="text-2xl font-bold mb-6 text-center">Generation in Progress...</h2>
            <p className="text-center text-gray-400 mb-6 -mt-4 text-sm">Two advanced AI models are collaborating to create your content.</p>
            <StatusDisplay pipelineState={pipelineState} />
            {error && (
               <div className="mt-8 text-center p-6 border-t-2 border-gray-700">
                  <div className="bg-red-500/20 text-red-300 border border-red-500/50 rounded-md p-4">
                    <h3 className="text-lg font-bold mb-2">An Error Occurred</h3>
                    <p className="text-sm">{error}</p>
                  </div>
                  <button onClick={resetState} className="mt-6 py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500">
                    Try Again
                  </button>
               </div>
            )}
          </div>
        );
      case 'preview':
        return blogResult && <Preview result={blogResult} wpCreds={wpCreds} bloggerCreds={bloggerCreds} onRestart={resetState} showToast={showToast} />;
      case 'form':
      default:
        return (
          <>
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-600 mb-4">
                One-Click SEO Blog Publishing
              </h1>
              <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
                Generate high-quality, multilingual blog posts with AI-powered images and publish directly to your CMS.
              </p>
            </div>
            <BlogForm onSubmit={handleFormSubmit} />
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <Header setView={setView} currentView={view} isHighContrast={isHighContrast} setHighContrast={setIsHighContrast} />
      <main className="flex-grow container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          {['form', 'generating', 'preview'].includes(view) && <Stepper currentView={view} />}
          {renderContent()}
        </div>
      </main>
      <Footer />
      <Toast toasts={toasts} />
    </div>
  );
};

export default App;