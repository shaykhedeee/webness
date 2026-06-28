import React, { useState, useEffect } from 'react';
import { WordPressCreds, BloggerCreds, UserSettings, DefaultPlatform, DefaultDownloadFormat } from '../types';
import { testConnection as testWpConnection } from '../services/wordpressService';
import { testConnection as testBloggerConnection } from '../services/bloggerService';
import { SpinnerIcon, CheckIcon, ErrorIcon } from './icons/StatusIcons';
import { WordpressIcon, BloggerIcon } from './icons/NavIcons';

interface SettingsProps {
  existingWpCreds: WordPressCreds | null;
  existingBloggerCreds: BloggerCreds | null;
  existingSettings: UserSettings;
  onSave: (wp: WordPressCreds | null, blogger: BloggerCreds | null, settings: UserSettings) => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

type TestStatus = 'idle' | 'testing' | 'success' | 'error';

const Settings: React.FC<SettingsProps> = ({ existingWpCreds, existingBloggerCreds, existingSettings, onSave }) => {
  const [wpCreds, setWpCreds] = useState<WordPressCreds>({ url: '', username: '', appPassword: '' });
  const [bloggerCreds, setBloggerCreds] = useState<BloggerCreds>({ apiKey: '', blogId: ''});
  const [userSettings, setUserSettings] = useState<UserSettings>({ defaultPlatform: DefaultPlatform.NONE, defaultDownloadFormat: DefaultDownloadFormat.DOCX });
  
  const [wpTestStatus, setWpTestStatus] = useState<TestStatus>('idle');
  const [wpTestMessage, setWpTestMessage] = useState<string>('');
  const [bloggerTestStatus, setBloggerTestStatus] = useState<TestStatus>('idle');
  const [bloggerTestMessage, setBloggerTestMessage] = useState<string>('');

  useEffect(() => {
    if (existingWpCreds) setWpCreds(existingWpCreds);
    if (existingBloggerCreds) setBloggerCreds(existingBloggerCreds);
    if (existingSettings) setUserSettings(existingSettings);
  }, [existingWpCreds, existingBloggerCreds, existingSettings]);

  const handleWpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setWpCreds(prev => ({ ...prev, [name]: value }));
    setWpTestStatus('idle');
  };
  
  const handleBloggerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setBloggerCreds(prev => ({ ...prev, [name]: value }));
    setBloggerTestStatus('idle');
  };

  const handleSettingsChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUserSettings(prev => ({ ...prev, [name]: value as any }));
  };

  const handleTestWp = async () => {
    setWpTestStatus('testing');
    setWpTestMessage('');
    const result = await testWpConnection(wpCreds);
    setWpTestMessage(result.message);
    setWpTestStatus(result.ok ? 'success' : 'error');
  };
  
  const handleTestBlogger = async () => {
    setBloggerTestStatus('testing');
    setBloggerTestMessage('');
    const result = await testBloggerConnection(bloggerCreds);
    setBloggerTestMessage(result.message);
    setBloggerTestStatus(result.ok ? 'success' : 'error');
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalWpCreds = (wpCreds.url && wpCreds.username && wpCreds.appPassword) ? wpCreds : null;
    const finalBloggerCreds = (bloggerCreds.apiKey && bloggerCreds.blogId) ? bloggerCreds : null;
    onSave(finalWpCreds, finalBloggerCreds, userSettings);
  };
  
  const getTestStatusDisplay = (status: TestStatus, message: string) => {
    switch(status) {
        case 'testing': return <><SpinnerIcon /> <span className="text-blue-300">Testing...</span></>;
        case 'success': return <><CheckIcon /> <span className="text-green-400">{message}</span></>;
        case 'error': return <><ErrorIcon /> <span className="text-red-400">{message}</span></>;
        default: return null;
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-gray-800/50 backdrop-blur-sm p-6 md:p-8 rounded-lg shadow-2xl border border-gray-700">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-400 mt-2">Manage integrations and user preferences.</p>
      </div>

       <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-200 text-sm rounded-lg p-4" role="alert">
          <p><span className="font-bold">Security Warning:</span> Credentials are saved in your browser's local storage. This is for convenience in this demo environment but is not secure for production. Always use dedicated, limited-permission credentials.</p>
       </div>

      <div className="space-y-4 border-t border-gray-700 pt-6">
        <h2 className="text-xl font-semibold text-gray-200">User Preferences</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="defaultPlatform" className="block text-sm font-medium text-gray-300 mb-1">Default Publishing Platform</label>
            <select name="defaultPlatform" id="defaultPlatform" value={userSettings.defaultPlatform} onChange={handleSettingsChange} className="w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white focus:ring-indigo-500 focus:border-indigo-500">
              {Object.values(DefaultPlatform).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="defaultDownloadFormat" className="block text-sm font-medium text-gray-300 mb-1">Default Download Format</label>
            <select name="defaultDownloadFormat" id="defaultDownloadFormat" value={userSettings.defaultDownloadFormat} onChange={handleSettingsChange} className="w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white focus:ring-indigo-500 focus:border-indigo-500">
              {Object.values(DefaultDownloadFormat).map(f => <option key={f} value={f}>.{f.toUpperCase()}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-8 border-t border-gray-700 pt-6">
          <h2 className="text-xl font-semibold text-gray-200">Integrations</h2>
          
          {/* WordPress Settings */}
          <div className="p-6 bg-gray-900/50 rounded-lg border border-gray-700 space-y-4">
              <h3 className="flex items-center gap-3 text-lg font-semibold text-gray-200"><WordpressIcon /> WordPress</h3>
              <div>
                  <label htmlFor="wp-url" className="block text-sm font-medium text-gray-300 mb-1">Site URL *</label>
                  <input type="url" name="url" id="wp-url" value={wpCreds.url} onChange={handleWpChange} className="w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white focus:ring-indigo-500 focus:border-indigo-500" placeholder="https://yourblog.com" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label htmlFor="wp-username" className="block text-sm font-medium text-gray-300 mb-1">Username *</label>
                      <input type="text" name="username" id="wp-username" value={wpCreds.username} onChange={handleWpChange} className="w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>
                  <div>
                      <label htmlFor="wp-appPassword" className="block text-sm font-medium text-gray-300 mb-1">Application Password *</label>
                      <input type="password" name="appPassword" id="wp-appPassword" value={wpCreds.appPassword} onChange={handleWpChange} className="w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white focus:ring-indigo-500 focus:border-indigo-500" />
                  </div>
              </div>
              <div className="flex items-center gap-4 pt-2">
                  <button type="button" onClick={handleTestWp} disabled={wpTestStatus === 'testing' || !wpCreds.url || !wpCreds.username || !wpCreds.appPassword} className="btn-secondary">Test Connection</button>
                  <div className="flex items-center gap-2 text-sm">{getTestStatusDisplay(wpTestStatus, wpTestMessage)}</div>
              </div>
          </div>

          {/* Blogger Settings */}
          <div className="p-6 bg-gray-900/50 rounded-lg border border-gray-700 space-y-4">
              <h3 className="flex items-center gap-3 text-lg font-semibold text-gray-200"><BloggerIcon /> Blogger (Google)</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label htmlFor="blogger-apiKey" className="block text-sm font-medium text-gray-300 mb-1">API Key *</label>
                      <input type="password" name="apiKey" id="blogger-apiKey" value={bloggerCreds.apiKey} onChange={handleBloggerChange} className="w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white focus:ring-indigo-500 focus:border-indigo-500" />
                      <p className="mt-1 text-xs text-gray-400">From Google Cloud Console.</p>
                  </div>
                  <div>
                      <label htmlFor="blogger-blogId" className="block text-sm font-medium text-gray-300 mb-1">Blog ID *</label>
                      <input type="text" name="blogId" id="blogger-blogId" value={bloggerCreds.blogId} onChange={handleBloggerChange} className="w-full bg-gray-700 border-gray-600 rounded-md shadow-sm text-white focus:ring-indigo-500 focus:border-indigo-500" />
                      <p className="mt-1 text-xs text-gray-400">Find this in your Blogger settings URL.</p>
                  </div>
              </div>
              <div className="flex items-center gap-4 pt-2">
                  <button type="button" onClick={handleTestBlogger} disabled={bloggerTestStatus === 'testing' || !bloggerCreds.apiKey || !bloggerCreds.blogId} className="btn-secondary">Test Connection</button>
                  <div className="flex items-center gap-2 text-sm">{getTestStatusDisplay(bloggerTestStatus, bloggerTestMessage)}</div>
              </div>
          </div>
      </div>
      
      <div className="pt-4 flex justify-end border-t border-gray-700">
        <button type="submit" className="flex justify-center py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500">
          Save All Settings
        </button>
      </div>
      <style>{`.btn-secondary { @apply py-2 px-4 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed; }`}</style>
    </form>
  );
};

export default Settings;