import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import type { DuplicateAnalysis } from '../../../services/layoutValidation';

interface DuplicateWarningProps {
  duplicateAnalysis: DuplicateAnalysis;
}

export default function DuplicateWarning({ duplicateAnalysis }: DuplicateWarningProps) {
  if (duplicateAnalysis.duplicateNumbers.length === 0) return null;

  return (
    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-center">
        <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-2" />
        <span className="text-red-800 font-bold">⚠️ Duplicate Seat Numbers Detected</span>
      </div>
      <p className="text-red-700 text-sm mt-2">
        The following seat numbers are used multiple times: <strong>{duplicateAnalysis.duplicateNumbers.join(', ')}</strong>
      </p>
      <p className="text-red-600 text-xs mt-1">
        Please double-click the highlighted seats (marked with red borders) to assign unique numbers.
      </p>
      <div className="mt-2 text-xs text-red-600">
        Total duplicates: {duplicateAnalysis.duplicateNumbers.length} numbers affecting {duplicateAnalysis.duplicatePositions.size} seats
      </div>
    </div>
  );
}
