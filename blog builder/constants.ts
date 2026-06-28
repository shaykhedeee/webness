import { Language, Tone, PipelineStep } from './types';

export const LANGUAGES = [
  { value: Language.ENGLISH, label: 'English' },
  { value: Language.SPANISH, label: 'Spanish' },
  { value: Language.PORTUGUESE, label: 'Portuguese' },
  { value: Language.FRENCH, label: 'French' },
  { value: Language.GERMAN, label: 'German' },
  { value: Language.HINDI, label: 'Hindi (हिंदी)' },
  { value: Language.TAMIL, label: 'Tamil (தமிழ்)' },
  { value: Language.TELUGU, label: 'Telugu (తెలుగు)' },
  { value: Language.BENGALI, label: 'Bengali (বাংলা)' },
  { value: Language.MARATHI, label: 'Marathi (मराठी)' },
];
export const TONES = Object.values(Tone).map(tone => ({ value: tone, label: tone }));

export const PIPELINE_STEPS_ORDER: PipelineStep[] = [
  PipelineStep.OUTLINE,
  PipelineStep.DRAFT,
  PipelineStep.POLISH,
  PipelineStep.TRANSLATE,
  PipelineStep.IMAGING,
];
