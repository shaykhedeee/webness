import React, { useState } from 'react';
import { BlogGenerationConfig, Language, Tone } from '../types';
import { LANGUAGES, TONES } from '../constants';
import { suggestTopics } from '../services/geminiService';
import { SpinnerIcon } from './icons/StatusIcons';
import { LightbulbIcon, InfoIcon } from './icons/NavIcons';

interface BlogFormProps {
  onSubmit: (data: BlogGenerationConfig) => void;
}

const Tooltip: React.FC<{ text: string }> = ({ text }) => (
  <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max max-w-xs p-2 text-xs text-white bg-gray-900 border border-gray-600 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
    {text}
  </span>
);

const BlogForm: React.FC<BlogFormProps> = ({ onSubmit }) => {
  const [formData, setFormData] = useState<Partial<BlogGenerationConfig>>({
    language: Language.ENGLISH,
    tone: Tone.INFORMATIVE,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [niche, setNiche] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, researchFile: e.target.files![0] }));
    }
  };

  const handleSuggestTopics = async () => {
    if (!niche) return;
    setIsSuggesting(true);
    setSuggestions([]);
    try {
      const topics = await suggestTopics(niche);
      setSuggestions(topics);
    } catch (err) {
      setError("Could not fetch topic suggestions. Please try again.");
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleSelectSuggestion = (topic: string) => {
    setFormData(prev => ({ ...prev, topic }));
    setSuggestions([]);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.topic) {
      setError('Please fill in the blog topic.');
      return;
    }

    setIsLoading(true);
    onSubmit(formData as BlogGenerationConfig);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10 bg-gray-800/50 backdrop-blur-sm p-6 md:p-8 rounded-lg shadow-2xl border border-gray-700">
        {error && <div className="p-3 bg-red-500/20 text-red-300 border border-red-500/50 rounded-md text-center">{error}</div>}
      
      <div className="space-y-6">
        <h2 className="text-xl font-semibold border-b border-gray-600 pb-3 text-gray-200">1. Blog Content</h2>
        <div className="relative group">
          <label htmlFor="topic" className="block text-sm font-medium text-gray-300 mb-2">Blog Topic / Title *</label>
          <input type="text" name="topic" id="topic" value={formData.topic || ''} required onChange={handleChange} className="form-input" placeholder="e.g., The Future of Renewable Energy" />
          <Tooltip text="The main headline for your blog post. Make it catchy!" />
        </div>
        
        <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
            <div className="flex items-center gap-4">
              <div className="relative group flex-grow">
                <input type="text" value={niche} onChange={(e) => setNiche(e.target.value)} className="form-input" placeholder="Enter a niche to get ideas (e.g., 'digital marketing')" />
                <Tooltip text="Need inspiration? Enter a general niche and we'll suggest some trending topics." />
              </div>
              <button type="button" onClick={handleSuggestTopics} disabled={isSuggesting || !niche} className="flex items-center gap-2 py-3 px-4 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none transition-colors disabled:opacity-50">
                {isSuggesting ? <SpinnerIcon /> : <LightbulbIcon />} Suggest Topics
              </button>
            </div>
            {suggestions.length > 0 && (
                <div className="mt-4 space-y-2">
                <h4 className="text-sm font-semibold text-gray-300">Click to use a suggestion:</h4>
                <ul className="space-y-1">
                    {suggestions.map((s, i) => (
                    <li key={i} onClick={() => handleSelectSuggestion(s)} className="p-2 bg-indigo-600/20 text-indigo-200 rounded-md hover:bg-indigo-600/40 cursor-pointer text-sm transition-colors">
                        {s}
                    </li>
                    ))}
                </ul>
                </div>
            )}
        </div>

        <div className="relative group">
          <label htmlFor="keywords" className="block text-sm font-medium text-gray-300 mb-2">Keywords (comma-separated)</label>
          <input type="text" name="keywords" id="keywords" onChange={handleChange} className="form-input" placeholder="e.g., solar, wind, sustainable, green tech" />
          <Tooltip text="SEO keywords to include in the article. Separate them with commas." />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className='relative group'>
            <label htmlFor="language" className="block text-sm font-medium text-gray-300 mb-2">Language</label>
            <select name="language" id="language" defaultValue={Language.ENGLISH} onChange={handleChange} className="form-input">
              {LANGUAGES.map(lang => <option key={lang.value} value={lang.value}>{lang.label}</option>)}
            </select>
             <Tooltip text="The language for the final blog post." />
          </div>
          <div className='relative group'>
            <label htmlFor="tone" className="block text-sm font-medium text-gray-300 mb-2">Tone / Style</label>
            <select name="tone" id="tone" defaultValue={Tone.INFORMATIVE} onChange={handleChange} className="form-input">
              {TONES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <Tooltip text="The writing style of the AI." />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold border-b border-gray-600 pb-3 text-gray-200">2. Research Material (Optional)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className='relative group'>
                <label htmlFor="researchFile" className="block text-sm font-medium text-gray-300 mb-2">Upload File</label>
                <input type="file" name="researchFile" id="researchFile" onChange={handleFileChange} className="w-full text-sm text-gray-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-600/50 file:text-indigo-200 hover:file:bg-indigo-600/70" />
                <Tooltip text="Upload a text file (.txt, .md) with research notes for the AI to use." />
            </div>
            <div className='relative'>
                 <span className='absolute left-1/2 -top-3 -translate-x-1/2 bg-gray-800 px-2 text-xs text-gray-400 z-10'>OR</span>
                 <div className="relative group">
                    <label htmlFor="researchUrl" className="block text-sm font-medium text-gray-300 mb-2">Provide URL</label>
                    <input type="url" name="researchUrl" id="researchUrl" onChange={handleChange} className="form-input" placeholder="https://example.com/article" />
                    <Tooltip text="Provide a URL with relevant information for the AI to consider." />
                </div>
            </div>
        </div>
      </div>
      
      <div className="pt-4 border-t border-gray-700">
        <button type="submit" disabled={isLoading} className="w-full flex justify-center py-4 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 disabled:bg-indigo-500/50 disabled:cursor-not-allowed transition-transform duration-200 hover:scale-105">
          {isLoading ? 'Generating...' : 'Start Generating'}
        </button>
      </div>

      <style>{`
        .form-input {
            @apply w-full bg-gray-700 border-gray-600 rounded-lg shadow-sm text-white text-base p-3;
            @apply focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow;
        }
      `}</style>
    </form>
  );
};

export default BlogForm;