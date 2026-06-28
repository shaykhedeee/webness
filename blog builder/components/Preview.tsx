import React, { useMemo, useState, useRef } from 'react';
import { BlogResult, WordPressCreds, BloggerCreds, PublishStatus } from '../types';
import { uploadImage as uploadWpImage, createPost as createWpPost } from '../services/wordpressService';
import { createPost as createBloggerPost } from '../services/bloggerService';
import { markdownToHtml, downloadFile, downloadDoc, downloadPdf } from '../utils/converters';
import { SpinnerIcon } from './icons/StatusIcons';
import { WordpressIcon, BloggerIcon, DownloadIcon, CopyIcon, FileHtmlIcon, FileMdIcon, FileDocIcon, FilePdfIcon } from './icons/NavIcons';

interface PreviewProps {
  result: BlogResult;
  wpCreds: WordPressCreds | null;
  bloggerCreds: BloggerCreds | null;
  onRestart: () => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

type PublishState = 'idle' | 'publishing' | 'success' | 'error';
type PublishTarget = 'wordpress' | 'blogger';

const Preview: React.FC<PreviewProps> = ({ result, wpCreds, bloggerCreds, onRestart, showToast }) => {
  const [publishState, setPublishState] = useState<PublishState>('idle');
  const [publishTarget, setPublishTarget] = useState<PublishTarget | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [postUrl, setPostUrl] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const finalHtmlContent = useMemo(() => {
    let html = markdownToHtml(result.content);
    if (result.images.length > 1 && result.images[1]) {
      const inlineImgTag = `<img src="data:image/jpeg;base64,${result.images[1]}" alt="${result.title} inline image" style="width:100%; height:auto; border-radius: 8px; margin: 1rem 0;" />`;
      html = html.replace(/\[IMAGE_1\]/g, inlineImgTag);
    }
    return html;
  }, [result]);

  const handlePublish = async (target: PublishTarget, status: PublishStatus) => {
    setPublishTarget(target);
    setPublishState('publishing');
    setPublishError(null);
    setPostUrl(null);
    
    try {
        let url = '';
        if (target === 'wordpress') {
            if (!wpCreds) throw new Error("WordPress credentials are not configured.");
            const featureImage = await uploadWpImage(wpCreds, result.images[0], `${result.title.replace(/\s+/g, '-')}-feature.jpeg`);
            let contentWithImageUrls = result.content;
            if (result.images.length > 1) {
                const inlineImage = await uploadWpImage(wpCreds, result.images[1], `${result.title.replace(/\s+/g, '-')}-inline-1.jpeg`);
                contentWithImageUrls = contentWithImageUrls.replace('[IMAGE_1]', `\n<img src="${inlineImage.source_url}" alt="${result.title} inline image" />\n`);
            }
            url = await createWpPost(wpCreds, result.title, markdownToHtml(contentWithImageUrls), featureImage.id, status);
        } else if (target === 'blogger') {
            if (!bloggerCreds) throw new Error("Blogger credentials are not configured.");
             // Note: Blogger API has limitations on direct image uploads via its basic API key method.
             // This service is a mock. A real implementation would require OAuth2 and a more complex flow.
            url = await createBloggerPost(bloggerCreds, result.title, finalHtmlContent, status === 'publish');
        }

        setPostUrl(url);
        setPublishState('success');
        showToast(`Successfully published to ${target}!`, "success");
    } catch (err: any) {
        console.error("Publishing error:", err);
        setPublishError(err.message || "An unknown error occurred while publishing.");
        setPublishState('error');
        showToast(err.message || "Publishing failed.", "error");
    }
  };


  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(result.content).then(() => {
        showToast('Markdown copied to clipboard!');
    }, (err) => {
        showToast('Failed to copy content.', 'error');
        console.error('Clipboard error:', err);
    });
  };
  
  const handleDownloadMd = () => {
      const filename = `${result.title.replace(/\s+/g, '-')}.md`;
      downloadFile(result.content, filename, 'text/markdown');
  };

  const handleDownloadHtml = () => {
    const filename = `${result.title.replace(/\s+/g, '-')}.html`;
    const fullHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${result.title}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 20px auto; padding: 0 20px; }
          img { max-width: 100%; height: auto; border-radius: 8px; margin: 1.5em 0; }
          h1, h2, h3, h4, h5, h6 { color: #222; }
          a { color: #007bff; }
        </style>
      </head>
      <body>
        <h1>${result.title}</h1>
        <img src="data:image/jpeg;base64,${result.images[0]}" alt="${result.title} feature image" />
        ${finalHtmlContent}
      </body>
      </html>
    `;
    downloadFile(fullHtml.trim(), filename, 'text/html');
  }

  const handleDownloadDoc = () => {
    const filename = `${result.title.replace(/\s+/g, '-')}.doc`;
    downloadDoc(finalHtmlContent, result.title, filename);
  };
  
  const handleDownloadPdf = async () => {
    if (previewRef.current) {
        showToast("Generating PDF, please wait...", "success");
        const filename = `${result.title.replace(/\s+/g, '-')}.pdf`;
        await downloadPdf(previewRef.current, filename);
    }
  };


  return (
    <div className="space-y-8">
      <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-lg shadow-2xl border border-gray-700 flex flex-col md:flex-row items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-white">Preview & Export</h2>
        <div className="flex flex-wrap gap-3">
            <button onClick={handleCopyToClipboard} className="btn-secondary"><CopyIcon /> Copy Markdown</button>
            <div className="flex gap-1 p-1 bg-gray-900/50 border border-gray-700 rounded-lg">
                <button onClick={handleDownloadMd} className="btn-tertiary" title="Download as Markdown"><FileMdIcon /></button>
                <button onClick={handleDownloadHtml} className="btn-tertiary" title="Download as HTML"><FileHtmlIcon /></button>
                <button onClick={handleDownloadDoc} className="btn-tertiary" title="Download as Word (.doc)"><FileDocIcon /></button>
                <button onClick={handleDownloadPdf} className="btn-tertiary" title="Download as PDF"><FilePdfIcon /></button>
            </div>
            <div className="relative group">
                <button onClick={() => handlePublish('wordpress', PublishStatus.PUBLISH)} disabled={!wpCreds || (publishState === 'publishing' && publishTarget === 'wordpress')} className="btn-primary">
                    {publishState === 'publishing' && publishTarget === 'wordpress' ? <SpinnerIcon /> : <WordpressIcon />} Publish
                </button>
                {!wpCreds && <span className="absolute bottom-full mb-2 w-48 left-1/2 -translate-x-1/2 bg-red-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Configure in Settings first!</span>}
            </div>
             <div className="relative group">
                <button onClick={() => handlePublish('blogger', PublishStatus.PUBLISH)} disabled={!bloggerCreds || (publishState === 'publishing' && publishTarget === 'blogger')} className="btn-primary bg-orange-600 hover:bg-orange-700 focus:ring-orange-500">
                    {publishState === 'publishing' && publishTarget === 'blogger' ? <SpinnerIcon /> : <BloggerIcon />} Publish
                </button>
                {!bloggerCreds && <span className="absolute bottom-full mb-2 w-48 left-1/2 -translate-x-1/2 bg-red-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Configure in Settings first!</span>}
            </div>
        </div>
      </div>

      {publishState === 'error' && (
          <div className='p-4 rounded-md border border-red-500/50 bg-red-500/20 text-red-300'>
              <p className='font-bold'>Publishing Error ({publishTarget}):</p>
              <p>{publishError}</p>
          </div>
      )}
      {publishState === 'success' && postUrl && (
          <div className='p-4 rounded-md border border-green-500/50 bg-green-500/20 text-green-300'>
              <p className="font-bold mb-2">Successfully published to {publishTarget}!</p>
              <a href={postUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-green-200">Click here to view your new post</a>
          </div>
      )}

      <div className="bg-gray-800/50 p-2 md:p-4 rounded-lg shadow-inner border border-gray-700">
          <div id="pdf-content" ref={previewRef} className="bg-white text-gray-800 p-8 rounded-md shadow-lg max-w-none mx-auto prose prose-lg">
            <h1>{result.title}</h1>
            <img src={`data:image/jpeg;base64,${result.images[0]}`} alt={result.title} className="w-full h-auto rounded-lg shadow-lg mb-6" />
            <div dangerouslySetInnerHTML={{ __html: finalHtmlContent }} />
          </div>
      </div>

      <div className="text-center">
        <button onClick={onRestart} className="py-3 px-8 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none transition-transform duration-200 hover:scale-105">
            Generate Another Post
        </button>
      </div>

      <style>{`
        .btn-primary { @apply flex items-center gap-2 justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 disabled:bg-indigo-500/50 disabled:cursor-not-allowed transition-colors; }
        .btn-secondary { @apply flex items-center gap-2 justify-center py-2 px-4 border border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-300 bg-gray-700 hover:bg-gray-600 focus:outline-none transition-colors; }
        .btn-tertiary { @apply p-2 rounded-md text-gray-400 hover:bg-gray-700 hover:text-white transition-colors; }
      `}</style>
    </div>
  );
};

export default Preview;