import React from 'react';
import { View } from '../App';
import { CheckIcon } from './icons/StatusIcons';

interface StepperProps {
  currentView: View;
}

const steps = [
  { view: 'form', title: '1. Configure Blog' },
  { view: 'generating', title: '2. Generate Content' },
  { view: 'preview', title: '3. Preview & Export' },
];

const Stepper: React.FC<StepperProps> = ({ currentView }) => {
  const getEffectiveStepIndex = () => {
    switch(currentView) {
      case 'form': return 0;
      case 'generating': return 1;
      case 'preview': return 2;
      default: return -1; // Should not happen in the views it's displayed on
    }
  }
  const effectiveStepIndex = getEffectiveStepIndex();

  return (
    <nav aria-label="Progress" className="mb-12">
      <ol role="list" className="flex w-full items-center">
        {steps.map((step, stepIdx) => (
          <li key={step.title} className="relative flex-1">
            {/* Connector Line - placed behind the step indicator */}
            {stepIdx > 0 && (
              <div className="absolute -left-1/2 top-4 h-0.5 w-full -translate-y-1/2" aria-hidden="true">
                <div className={`h-full w-full ${stepIdx <= effectiveStepIndex ? 'bg-indigo-600' : 'bg-gray-700'} transition-colors duration-300`} />
              </div>
            )}

            <div className="relative flex flex-col items-center text-center">
                {/* Step Circle */}
                {stepIdx < effectiveStepIndex ? (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 z-10 transition-colors duration-300">
                    <CheckIcon />
                  </div>
                ) : stepIdx === effectiveStepIndex ? (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-indigo-600 bg-gray-800 z-10" aria-current="step">
                    <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
                  </div>
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-700 bg-gray-800 z-10 transition-colors duration-300" />
                )}
                {/* Step Title */}
                <p className={`mt-2 text-xs ${stepIdx <= effectiveStepIndex ? 'text-white font-medium' : 'text-gray-400'} transition-colors duration-300`}>
                    {step.title}
                </p>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Stepper;