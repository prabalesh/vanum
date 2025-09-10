import { useState, useEffect } from 'react';
import { Dialog, DialogPanel } from '@headlessui/react';
import { XMarkIcon, CheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface SeatNumberEditorProps {
  isOpen: boolean;
  currentNumber: string;
  seatPosition: { row: number; col: number } | null;
  onSave: (customNumber: string) => Promise<boolean> | boolean;
  onCancel: () => void;
  duplicateNumbers?: string[];
  allowDuplicatesInDesign?: boolean; // New prop
}

export default function SeatNumberEditor({
  isOpen,
  currentNumber,
  seatPosition,
  onSave,
  onCancel,
  duplicateNumbers = [],
  allowDuplicatesInDesign = true // Default to true for design mode
}: SeatNumberEditorProps) {
  const [inputValue, setInputValue] = useState('');
  const [warning, setWarning] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [validationState, setValidationState] = useState<'idle' | 'valid' | 'warning'>('idle');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setInputValue(currentNumber);
      setWarning('');
      setValidationState('idle');
    }
  }, [isOpen, currentNumber]);

  // More permissive validation for design mode
  useEffect(() => {
    if (!inputValue.trim()) {
      setValidationState('idle');
      setWarning('');
      return;
    }

    const trimmedValue = inputValue.trim();
    
    // Basic format validation (always required)
    if (!/^[A-Z0-9-]+$/i.test(trimmedValue)) {
      setValidationState('warning');
      setWarning('Seat number should only contain letters, numbers, and hyphens');
      return;
    }

    if (trimmedValue.length > 10) {
      setValidationState('warning');
      setWarning('Seat number should not exceed 10 characters');
      return;
    }

    // Check for duplicates - but allow in design mode
    if (duplicateNumbers.includes(trimmedValue) && trimmedValue !== currentNumber) {
      if (allowDuplicatesInDesign) {
        setValidationState('warning');
        setWarning(`⚠️ This number already exists - you can fix duplicates later`);
      } else {
        setValidationState('warning');
        setWarning(`Seat number "${trimmedValue}" already exists`);
        return;
      }
    } else {
      setValidationState('valid');
      setWarning('');
    }
  }, [inputValue, duplicateNumbers, currentNumber, allowDuplicatesInDesign]);

  const handleSave = async () => {
    const trimmedValue = inputValue.trim();
    
    if (!trimmedValue) {
      setWarning('Seat number cannot be empty');
      return;
    }

    // In design mode, allow saving even with warnings
    setIsLoading(true);
    setWarning('');

    try {
      const result = await onSave(trimmedValue);
      if (result) {
        onCancel(); // Close modal on success
      } else {
        setWarning('Failed to save seat number. Please try again.');
      }
    } catch (err) {
      setWarning('An error occurred while saving');
    } finally {
      setIsLoading(false);
    }
  };

  const isValidForSave = inputValue.trim() && inputValue !== currentNumber;
  const isDuplicate = duplicateNumbers.includes(inputValue.trim()) && inputValue.trim() !== currentNumber;

  return (
    <Dialog open={isOpen} onClose={onCancel} className="relative z-50">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="mx-auto max-w-md w-full rounded-xl bg-white shadow-xl">
          <div className="flex items-center justify-between border-b p-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Edit Seat Number
            </h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {seatPosition && (
              <div className="text-sm text-gray-600">
                Editing seat at position: Row {seatPosition.row + 1}, Column {seatPosition.col + 1}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Seat Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && isValidForSave && !isLoading) {
                      handleSave();
                    } else if (e.key === 'Escape') {
                      onCancel();
                    }
                  }}
                  className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 transition-colors ${
                    validationState === 'valid'
                      ? 'border-green-300 focus:border-green-500 focus:ring-green-500/20'
                      : validationState === 'warning'
                      ? 'border-yellow-300 focus:border-yellow-500 focus:ring-yellow-500/20'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
                  }`}
                  placeholder="e.g. A1, B12, VIP1"
                  maxLength={10}
                  autoFocus
                />
                
                {/* Status icons */}
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  {validationState === 'valid' && !isDuplicate && (
                    <CheckIcon className="h-4 w-4 text-green-500" />
                  )}
                  {validationState === 'warning' && (
                    <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />
                  )}
                </div>
              </div>
              
              {/* Warning/error messages */}
              {warning && (
                <p className={`mt-1 text-sm flex items-center gap-1 ${
                  isDuplicate && allowDuplicatesInDesign 
                    ? 'text-yellow-600' 
                    : 'text-red-600'
                }`}>
                  <ExclamationTriangleIcon className="h-4 w-4 flex-shrink-0" />
                  {warning}
                </p>
              )}
              
              {/* Success message */}
              {validationState === 'valid' && !warning && inputValue !== currentNumber && (
                <p className="mt-1 text-sm text-green-600 flex items-center gap-1">
                  <CheckIcon className="h-4 w-4 flex-shrink-0" />
                  Ready to save
                </p>
              )}
            </div>

            {/* Preview section */}
            {inputValue !== currentNumber && (
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-xs font-medium text-gray-700 mb-1">Preview:</div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    Current: <span className="font-mono">{currentNumber || '(auto-generated)'}</span>
                  </span>
                  <span className="text-gray-400">→</span>
                  <span className={isDuplicate ? 'text-yellow-600' : 'text-blue-600'}>
                    New: <span className="font-mono">{inputValue || '(empty)'}</span>
                    {isDuplicate && allowDuplicatesInDesign && (
                      <span className="text-xs text-yellow-600 ml-1">(duplicate)</span>
                    )}
                  </span>
                </div>
              </div>
            )}

            {/* Design mode notice */}
            {allowDuplicatesInDesign && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-xs text-blue-800">
                  <strong>Design Mode:</strong> You can create temporary duplicates while configuring. 
                  Fix all duplicates before finalizing the layout.
                </div>
              </div>
            )}

            {/* Tips */}
            <div className="text-xs text-gray-500">
              <div className="font-medium mb-1">Tips:</div>
              <ul className="space-y-0.5">
                <li>• Use letters and numbers (A1, B12, VIP1)</li>
                <li>• Press Enter to save, Escape to cancel</li>
                {allowDuplicatesInDesign && (
                  <li>• Duplicates are allowed during design phase</li>
                )}
              </ul>
            </div>
          </div>

          <div className="flex justify-between items-center border-t px-4 py-3 bg-gray-50 rounded-b-xl">
            <button
              onClick={() => setInputValue(currentNumber)}
              className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
              disabled={inputValue === currentNumber}
            >
              Reset to Original
            </button>
            
            <div className="flex gap-2">
              <button
                onClick={onCancel}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!isValidForSave || isLoading}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  isValidForSave && !isLoading
                    ? isDuplicate && allowDuplicatesInDesign
                      ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Saving...
                  </span>
                ) : (
                  isDuplicate && allowDuplicatesInDesign 
                    ? 'Save (will create duplicate)' 
                    : 'Save'
                )}
              </button>
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
