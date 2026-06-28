
import React from 'react';
import { PipelineState, PipelineStep } from '../types';
import { PIPELINE_STEPS_ORDER } from '../constants';
import { SpinnerIcon, CheckIcon, ErrorIcon, IdleIcon } from './icons/StatusIcons';

interface StatusDisplayProps {
  pipelineState: PipelineState;
}

const getStatusIcon = (status: string | undefined) => {
  switch (status) {
    case 'running':
      return <SpinnerIcon />;
    case 'success':
      return <CheckIcon />;
    case 'error':
      return <ErrorIcon />;
    default:
      return <IdleIcon />;
  }
};

const getStatusColor = (status: string | undefined) => {
    switch (status) {
        case 'running':
          return 'text-blue-400';
        case 'success':
          return 'text-green-400';
        case 'error':
          return 'text-red-400';
        default:
          return 'text-gray-500';
      }
}

const StatusDisplay: React.FC<StatusDisplayProps> = ({ pipelineState }) => {
  // Translate is conditional, so we only show it if the language is not English or if it's already in the state
  const isTranslationStepNeeded = !Object.keys(pipelineState).includes(PipelineStep.TRANSLATE) || pipelineState[PipelineStep.TRANSLATE] !== undefined;

  const stepsToShow = PIPELINE_STEPS_ORDER.filter(step => {
    if (step === PipelineStep.TRANSLATE) {
        // Show translate step only if it's been initiated
        return pipelineState[PipelineStep.TRANSLATE] !== undefined;
    }
    return true;
  });


  return (
    <div className="space-y-4">
      <ul className="space-y-3">
        {stepsToShow.map((step) => {
          const status = pipelineState[step] || 'idle';
          return (
            <li key={step} className={`flex items-center p-3 rounded-md transition-all duration-300 ${status === 'running' ? 'bg-blue-500/10' : ''} ${status === 'idle' ? '' : 'bg-gray-700/50'}`}>
              <div className={`flex-shrink-0 mr-3 ${getStatusColor(status)}`}>
                {getStatusIcon(status)}
              </div>
              <span className={`font-medium ${getStatusColor(status)}`}>
                {step}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default StatusDisplay;
