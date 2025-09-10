interface RowLabelProps {
  rowIndex: number;
  isSelected: boolean;
  hasSeats: boolean;
  label: string;
  onSelect: (rowIndex: number) => void;
  onToggleWalkway: (rowIndex: number) => void;
}

export default function RowLabel({
  rowIndex,
  isSelected,
  hasSeats,
  label,
  onSelect,
  onToggleWalkway
}: RowLabelProps) {
  return (
    <button
      onClick={() => onSelect(rowIndex)}
      onDoubleClick={() => onToggleWalkway(rowIndex)}
      className={`w-8 h-8 text-center text-sm font-medium cursor-pointer rounded transition-colors ${
        isSelected 
          ? 'bg-blue-500 text-white' 
          : hasSeats 
            ? 'text-gray-900 hover:bg-blue-100' 
            : 'text-gray-400 hover:bg-gray-100'
      }`}
      title={`${label} - Click to select, Double-click to toggle walkway`}
    >
      {hasSeats ? label : '·'}
    </button>
  );
}
