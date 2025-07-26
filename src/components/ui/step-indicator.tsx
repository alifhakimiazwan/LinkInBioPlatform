interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  color?: 'orange' | 'purple';
}

export function StepIndicator({ 
  currentStep, 
  totalSteps, 
  color = 'orange' 
}: StepIndicatorProps) {
  const colorClasses = {
    orange: {
      active: 'bg-orange-600 text-white',
      inactive: 'bg-gray-200 text-gray-600',
      line: 'bg-orange-600'
    },
    purple: {
      active: 'bg-purple-600 text-white',
      inactive: 'bg-gray-200 text-gray-600',
      line: 'bg-purple-600'
    }
  };

  const colors = colorClasses[color];

  return (
    <div className="flex items-center mb-8 w-full">
      {Array.from({ length: totalSteps }, (_, index) => {
        const step = index + 1;
        return (
          <div key={step} className="flex items-center flex-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === currentStep
                  ? colors.active
                  : step < currentStep
                  ? colors.active
                  : colors.inactive
              }`}
            >
              {step < currentStep ? "✓" : step}
            </div>
            {step < totalSteps && (
              <div
                className={`flex-1 h-0.5 mx-4 ${
                  step < currentStep ? colors.line : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}