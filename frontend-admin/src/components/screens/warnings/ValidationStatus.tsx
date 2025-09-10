import { CheckIcon, CogIcon } from '@heroicons/react/24/outline';
import type { LayoutStatistics, DuplicateAnalysis } from '../../../services/layoutValidation';

interface ValidationStatusProps {
  isValid: boolean;
  statistics: LayoutStatistics;
  duplicateAnalysis: DuplicateAnalysis;
  gridSize: { rows: number; columns: number };
}

export default function ValidationStatus({ 
  isValid, 
  statistics, 
  duplicateAnalysis, 
  gridSize 
}: ValidationStatusProps) {
  return (
    <div className={`p-4 rounded-lg border ${isValid ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
      <div className="flex items-center">
        {isValid ? (
          <>
            <CheckIcon className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-green-800 font-medium">Layout is ready for submission</span>
          </>
        ) : (
          <>
            <CogIcon className="h-5 w-5 text-yellow-600 mr-2" />
            <span className="text-yellow-800 font-medium">
              Complete the layout configuration
              {duplicateAnalysis.duplicateNumbers.length > 0 && ' - Fix duplicate seat numbers'}
            </span>
          </>
        )}
      </div>
      <div className="mt-2 text-sm text-gray-600 space-y-1">
        <div>Actual Rows (with seats): {statistics.actualRowCount} | Total Seats: {statistics.totalSeats}</div>
        <div>
          Accessible Seats: {statistics.accessibleSeats} | Grid Size: {gridSize.rows} × {gridSize.columns}
          {duplicateAnalysis.duplicateNumbers.length > 0 && (
            <span className="text-red-600 font-medium"> | ⚠️ {duplicateAnalysis.duplicateNumbers.length} duplicate seat numbers</span>
          )}
        </div>
      </div>
    </div>
  );
}
