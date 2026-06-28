export enum Language {
  ENGLISH = 'English',
  SPANISH = 'Spanish',
  PORTUGUESE = 'Portuguese',
  FRENCH = 'French',
  GERMAN = 'German',
  HINDI = 'Hindi',
  TAMIL = 'Tamil',
  TELUGU = 'Telugu',
  BENGALI = 'Bengali',
  MARATHI = 'Marathi',
}

export enum Tone {
  PROFESSIONAL = 'Professional',
  FRIENDLY = 'Friendly',
  PERSUASIVE = 'Persuasive',
  INFORMATIVE = 'Informative',
  HUMOROUS = 'Humorous',
}

export enum PublishStatus {
  DRAFT = 'draft',
  PUBLISH = 'publish',
}

export interface WordPressCreds {
  url: string;
  username: string;
  appPassword: string;
}

export interface BloggerCreds {
  apiKey: string;
  blogId: string;
}

export enum DefaultPlatform {
    NONE = 'None',
    WORDPRESS = 'WordPress',
    BLOGGER = 'Blogger',
}

export enum DefaultDownloadFormat {
    DOCX = 'docx',
    PDF = 'pdf',
    MARKDOWN = 'md',
    HTML = 'html',
}

export interface UserSettings {
    defaultPlatform: DefaultPlatform;
    defaultDownloadFormat: DefaultDownloadFormat;
}

export interface BlogGenerationConfig {
  topic: string;
  keywords: string;
  language: Language;
  tone: Tone;
  researchFile?: File;
  researchUrl?: string;
}

export interface BlogResult {
  id: string;
  createdAt: string;
  title: string;
  content: string; // Markdown content
  images: string[]; // Array of base64 image strings
}

export enum PipelineStep {
  OUTLINE = 'Research & Outline',
  DRAFT = 'Drafting with AI Model 1',
  POLISH = 'Polishing with AI Model 2',
  TRANSLATE = 'Translating Content',
  IMAGING = 'Generating Images',
  PUBLISH = 'Publishing to WordPress',
}

export type StepStatus = 'idle' | 'running' | 'success' | 'error';

export type PipelineState = {
  [key in PipelineStep]?: StepStatus;
};