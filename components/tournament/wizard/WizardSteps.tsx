/**
 * Composant de progression du wizard de création de tournoi
 */

'use client'

import { Check, Trophy, Users, Settings, Gamepad } from '@/components/Icons'
import type { StepConfig } from '@/hooks/tournament'

interface WizardStepsProps {
  steps: StepConfig[]
  currentStep: number
}

const stepIcons: Record<number, React.ReactNode> = {
  1: <Trophy className="w-5 h-5" />,
  2: <Gamepad className="w-5 h-5" />,
  3: <Users className="w-5 h-5" />,
  4: <Settings className="w-5 h-5" />,
  5: <Check className="w-5 h-5" />
}

export default function WizardSteps({ steps, currentStep }: WizardStepsProps) {
  return (
    <div className="mb-12 sm:mb-16">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div className="relative">
              {currentStep === step.number && (
                <div className={`absolute inset-0 bg-gradient-to-br ${step.color} rounded-full animate-ping opacity-20`} />
              )}

              <div className={`
                relative w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-bold text-sm sm:text-lg
                transition-all duration-500 transform
                ${currentStep >= step.number
                  ? `bg-gradient-to-br ${step.color} text-white shadow-lg scale-100`
                  : 'bg-gray-200 text-gray-400 scale-90'}
                ${currentStep === step.number ? 'ring-2 sm:ring-4 ring-white shadow-2xl scale-110' : ''}
              `}>
                {currentStep > step.number ? <Check className="w-5 h-5" /> : stepIcons[step.number]}
              </div>

              <div className={`absolute -bottom-6 sm:-bottom-8 left-1/2 transform -translate-x-1/2 text-[10px] sm:text-xs font-medium transition-all duration-500 text-center max-w-[60px] sm:max-w-none sm:whitespace-nowrap ${
                currentStep >= step.number ? 'text-gray-900' : 'text-gray-400'
              }`}>
                {step.title}
              </div>
            </div>

            {index < steps.length - 1 && (
              <div className="w-8 sm:w-24 h-1 mx-1 sm:mx-4">
                <div className="h-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${step.color} transition-all duration-700`}
                    style={{ width: currentStep > step.number ? '100%' : '0%' }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
