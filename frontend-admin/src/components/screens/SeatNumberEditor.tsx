import { useState, useEffect } from 'react';

interface SeatNumberEditorProps {
  isOpen: boolean;
  currentNumber: string;
  onSave: (number: string) => void;
  onCancel: () => void;
}

export default function SeatNumberEditor({
  isOpen,
  currentNumber,
  onSave,
  onCancel
}: SeatNumberEditorProps) {
  const [seatNumber, setSeatNumber] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSeatNumber(currentNumber);
    }
  }, [isOpen, currentNumber]);

  const handleSave = () => {
    onSave(seatNumber.trim());
    setSeatNumber('');
  };

  const handleCancel = () => {
    onCancel();
    setSeatNumber('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h3 className="text-lg font-semibold mb-4">Edit Seat Number</h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Custom Seat Number
          </label>
          <input
            type="text"
            value={seatNumber}
            onChange={(e) => setSeatNumber(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., VIP1, A1, Premium-5"
            autoFocus
            onKeyPress={(e) => e.key === 'Enter' && handleSave()}
          />
          <p className="text-xs text-gray-500 mt-1">
            Leave empty to use automatic numbering
          </p>
        </div>
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
