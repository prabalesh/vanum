import { useState, useCallback, useEffect, useMemo } from 'react';
import type { SeatLayoutConfig, SeatPosition } from '../../types';
import { isSeat } from '../../utils/seatNumbering';

// Services
import { LayoutValidationService } from './../../services/layoutValidation';
import { SeatNumberingService } from './../../services/seatNumbering';
import { LayoutFactory } from './../../factories/LayoutFactory';

// Constants
import { SEAT_TYPES, GRID_LIMITS } from './../../constants/seatTypes';

// Components
import SeatTypeSelector from './SeatTypeSelector';
import LayoutSettings from './LayoutSettings';
import SeatNumberEditor from './SeatNumberEditor';
import DuplicateWarning from './warnings/DuplicateWarning';
import QuickRowTools from './controls/QuickRowTools';
import ValidationStatus from './warnings/ValidationStatus';
import DimensionControls from './controls/DimensionControls';
import SeatGrid from './grid/SeatGrid';
import SeatTypesLegend from './legend/SeatTypesLegend';

interface SeatLayoutDesignerProps {
  layout: SeatLayoutConfig;
  onChange: (layout: SeatLayoutConfig) => void;
}

export default function SeatLayoutDesigner({ layout, onChange }: SeatLayoutDesignerProps) {
  // === STATE ===
  const [selectedTool, setSelectedTool] = useState<string>('normal');
  const [showSettings, setShowSettings] = useState(false);
  const [editingSeat, setEditingSeat] = useState<{row: number, col: number} | null>(null);
  const [numberingScheme, setNumberingScheme] = useState<string>(layout.numbering_scheme || 'alphabetic');
  const [rowNaming, setRowNaming] = useState<string>(layout.row_naming || 'alphabetic');
  const [customRowNames, setCustomRowNames] = useState<string[]>(layout.custom_row_names || []);
  const [isValid, setIsValid] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  // === COMPUTED VALUES ===
  const duplicateAnalysis = useMemo(() => {
  console.log('Re-analyzing duplicates...', layout.layout); // Debug log
  return LayoutValidationService.analyzeDuplicates(layout.layout);
}, [layout.layout, layout.rows, layout.columns]); // Add more dependencies

  const statistics = useMemo(() => 
    LayoutValidationService.calculateStatistics(layout.layout), 
    [layout.layout]
  );

  // === EVENT HANDLERS ===
  const handleSeatClick = useCallback((rowIndex: number, colIndex: number) => {
  console.log('Seat single-clicked:', rowIndex, colIndex); // Debug log
  
  const newLayout = { ...layout };
  
  if (!newLayout.layout || newLayout.layout.length === 0) {
    newLayout.layout = LayoutFactory.createInitialLayout(layout.rows, layout.columns);
  }

  const currentSeat = newLayout.layout[rowIndex]?.[colIndex] || 
    LayoutFactory.createDefaultSeat(rowIndex, colIndex);

  const newType = selectedTool as SeatPosition['type'];
  const seatTypeInfo = SEAT_TYPES[newType];
  
  // Only change type if it's different from current type
  if (currentSeat.type === newType) {
    console.log('Same type selected, no change needed');
    return;
  }
  
  // Update the seat
  newLayout.layout[rowIndex][colIndex] = {
    ...currentSeat,
    type: newType,
    number: '',
    row: '',
    price: seatTypeInfo?.price || 0,
    is_accessible: seatTypeInfo?.is_accessible || false,
  };

  // Regenerate numbers for the entire row
  newLayout.layout[rowIndex] = newLayout.layout[rowIndex].map((seat, colIdx) => {
    if (isSeat(seat.type)) {
      return {
        ...seat,
        number: seat.custom_number || SeatNumberingService.generateSeatNumber(
          rowIndex, colIdx, newLayout.layout!, numberingScheme, rowNaming, customRowNames
        ),
        row: SeatNumberingService.generateRowName(rowIndex, newLayout.layout!, rowNaming, customRowNames),
      };
    }
    return { ...seat, number: '', row: '' };
  });

  onChange(newLayout);
}, [selectedTool, layout, numberingScheme, rowNaming, customRowNames, onChange]);

  const handleEditSeatNumber = useCallback((rowIndex: number, colIndex: number) => {
  console.log('Edit seat clicked:', rowIndex, colIndex); // Debug log
  
  const seat = layout.layout?.[rowIndex]?.[colIndex];
  console.log('Seat data:', seat); // Debug log
  
  if (seat && isSeat(seat.type)) {
    console.log('Setting editing seat:', { row: rowIndex, col: colIndex }); // Debug log
    setEditingSeat({ row: rowIndex, col: colIndex });
  } else {
    console.log('Cannot edit this seat type:', seat?.type); // Debug log
  }
}, [layout.layout]);

  const handleSaveCustomNumber = useCallback(async (customNumber: string): Promise<boolean> => {
  if (!editingSeat) return false;
  
  const trimmedNumber = customNumber.trim();
  console.log('Saving custom number:', trimmedNumber, 'for seat:', editingSeat); // Debug
  
  if (!trimmedNumber) return false;
  
  // Format validation
  if (!/^[A-Z0-9-]+$/i.test(trimmedNumber) || trimmedNumber.length > 10) {
    return false;
  }
  
  // Create a completely new layout object to trigger re-renders
  const newLayout = JSON.parse(JSON.stringify(layout)); // Deep clone
  
  if (!newLayout.layout || !newLayout.layout[editingSeat.row]) return false;
  
  // Update the specific seat
  newLayout.layout[editingSeat.row][editingSeat.col] = {
    ...newLayout.layout[editingSeat.row][editingSeat.col],
    custom_number: trimmedNumber,
    number: trimmedNumber
  };
  
  console.log('Updated layout:', newLayout.layout[editingSeat.row][editingSeat.col]); // Debug
  
  // Force state update
  onChange(newLayout);
  setEditingSeat(null);
  
  // Small delay to ensure state has updated before closing modal
  setTimeout(() => {
    console.log('Seat number save completed'); // Debug
  }, 100);
  
  return true;
}, [editingSeat, layout, onChange]);




const validateSeatNumber = useCallback((newNumber: string): { isValid: boolean; error?: string } => {
  if (!newNumber.trim()) {
    return { isValid: false, error: 'Seat number cannot be empty' };
  }
  
  const trimmed = newNumber.trim();
  
  if (!editingSeat) {
    return { isValid: false, error: 'No seat selected for editing' };
  }
  
  const currentSeat = layout.layout?.[editingSeat.row]?.[editingSeat.col];
  
  // Allow if it's the same number (no change)
  if (trimmed === currentSeat?.number) {
    return { isValid: true };
  }
  
  // Check if number already exists
  if (duplicateAnalysis.seatNumberCounts[trimmed]) {
    return { 
      isValid: false, 
      error: `Seat number "${trimmed}" is already used by another seat` 
    };
  }
  
  // Format validation
  if (!/^[A-Z0-9-]+$/i.test(trimmed)) {
    return { 
      isValid: false, 
      error: 'Use only letters, numbers, and hyphens' 
    };
  }
  
  if (trimmed.length > 10) {
    return { 
      isValid: false, 
      error: 'Maximum 10 characters allowed' 
    };
  }
  
  return { isValid: true };
}, [editingSeat, layout.layout, duplicateAnalysis.seatNumberCounts]);

  const handleRowSelection = useCallback((rowIndex: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(rowIndex)) {
      newSelected.delete(rowIndex);
    } else {
      newSelected.add(rowIndex);
    }
    setSelectedRows(newSelected);
  }, [selectedRows]);

  const toggleRowWalkway = useCallback((rowIndex: number) => {
    const newLayout = { ...layout };
    if (!newLayout.layout || !newLayout.layout[rowIndex]) return;

    const isRowWalkway = newLayout.layout[rowIndex].every(
      seat => seat.type === 'walkway' || seat.type === 'empty'
    );

    newLayout.layout[rowIndex] = newLayout.layout[rowIndex].map((seat, colIndex) => ({
      ...seat,
      type: isRowWalkway ? 'normal' : 'walkway',
      number: isRowWalkway ? SeatNumberingService.generateSeatNumber(
        rowIndex, colIndex, newLayout.layout!, numberingScheme, rowNaming, customRowNames
      ) : '',
      row: isRowWalkway ? SeatNumberingService.generateRowName(
        rowIndex, newLayout.layout!, rowNaming, customRowNames
      ) : '',
      price: isRowWalkway ? SEAT_TYPES.normal.price : 0,
      is_accessible: false,
    }));

    const newSelectedRows = new Set(selectedRows);
    if (isRowWalkway) {
      newSelectedRows.delete(rowIndex);
    } else {
      newSelectedRows.add(rowIndex);
    }
    setSelectedRows(newSelectedRows);

    onChange(newLayout);
  }, [layout, selectedRows, numberingScheme, rowNaming, customRowNames, onChange]);

  const toggleSelectedRowsAsWalkways = useCallback(() => {
    selectedRows.forEach(rowIndex => toggleRowWalkway(rowIndex));
    setSelectedRows(new Set());
  }, [selectedRows, toggleRowWalkway]);

  const updateDimensions = useCallback((rows: number, columns: number) => {
    const newLayout = { 
      ...layout, 
      rows: Math.max(GRID_LIMITS.MIN_ROWS, Math.min(GRID_LIMITS.MAX_ROWS, rows)),
      columns: Math.max(GRID_LIMITS.MIN_COLUMNS, Math.min(GRID_LIMITS.MAX_COLUMNS, columns)),
      layout: []
    };
    setSelectedRows(new Set());
    onChange(newLayout);
  }, [layout, onChange]);

  // Other methods... (validation, effects, etc.)

  const isSeatDuplicate = useCallback((rowIndex: number, colIndex: number): boolean => {
  const key = `${rowIndex}-${colIndex}`;
  const isDupe = duplicateAnalysis.duplicatePositions.has(key);
  
  // Debug log
  const seat = layout.layout?.[rowIndex]?.[colIndex];
  console.log(`Checking duplicate for ${key}:`, {
    isDupe,
    seatNumber: seat?.number,
    allDuplicatePositions: Array.from(duplicateAnalysis.duplicatePositions),
    duplicateNumbers: duplicateAnalysis.duplicateNumbers
  });
  
  return isDupe;
}, [duplicateAnalysis.duplicatePositions, duplicateAnalysis.duplicateNumbers, layout.layout]);

  // === EFFECTS ===
  useEffect(() => {
    if (!layout.layout || layout.layout.length === 0) {
      const initialLayout = LayoutFactory.createInitialLayout(layout.rows, layout.columns);
      onChange({
        ...layout,
        layout: initialLayout,
        seat_types: SEAT_TYPES
      });
    }
  }, [layout.rows, layout.columns, layout, onChange]);

  useEffect(() => {
    const valid = LayoutValidationService.validateLayout(
      layout,
      rowNaming,
      customRowNames,
      statistics.actualRowCount,
      duplicateAnalysis.duplicateNumbers
    );
    setIsValid(valid);
  }, [layout, rowNaming, customRowNames, statistics.actualRowCount, duplicateAnalysis.duplicateNumbers]);

  // === RENDER ===
  return (
    <div className="space-y-6">
      <DuplicateWarning duplicateAnalysis={duplicateAnalysis} />
      
      <QuickRowTools
        selectedRowCount={selectedRows.size}
        onMakeWalkways={toggleSelectedRowsAsWalkways}
        onClearSelection={() => setSelectedRows(new Set())}
      />
      
      <ValidationStatus
        isValid={isValid}
        statistics={statistics}
        duplicateAnalysis={duplicateAnalysis}
        gridSize={{ rows: layout.rows, columns: layout.columns }}
      />

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <LayoutSettings
          showSettings={showSettings}
          onToggleSettings={() => setShowSettings(!showSettings)}
          numberingScheme={numberingScheme}
          onNumberingSchemeChange={setNumberingScheme}
          rowNaming={rowNaming}
          onRowNamingChange={setRowNaming}
          customRowNames={customRowNames}
          onCustomRowNameChange={(index, value) => {
            const newNames = [...customRowNames];
            newNames[index] = value;
            setCustomRowNames(newNames);
          }}
          actualRowCount={statistics.actualRowCount}
          onApplyChanges={() => {/* updateLayoutSettings logic */}}
        />

        <div className="mt-4">
          <SeatTypeSelector
            seatTypes={SEAT_TYPES}
            selectedTool={selectedTool}
            onToolSelect={setSelectedTool}
          />
        </div>

        <DimensionControls
          rows={layout.rows}
          columns={layout.columns}
          onUpdateDimensions={updateDimensions}
        />
      </div>

<SeatGrid
  key={`${layout.rows}-${layout.columns}-${JSON.stringify(duplicateAnalysis.duplicateNumbers)}`} // Force re-render
  layout={layout}
  selectedRows={selectedRows}
  rowNaming={rowNaming}
  customRowNames={customRowNames}
  isDuplicate={isSeatDuplicate}
  onSeatClick={handleSeatClick}
  onSeatEdit={handleEditSeatNumber}
  onRowSelect={handleRowSelection}
  onRowToggle={toggleRowWalkway}
/>

      <SeatNumberEditor
  isOpen={!!editingSeat}
  currentNumber={editingSeat ? 
    layout.layout?.[editingSeat.row]?.[editingSeat.col]?.number || '' : ''}
  seatPosition={editingSeat}
  onSave={handleSaveCustomNumber}
  onCancel={() => setEditingSeat(null)}
  duplicateNumbers={duplicateAnalysis.duplicateNumbers}
  allowDuplicatesInDesign={true} // Enable design mode
/>


      <SeatTypesLegend />
    </div>
  );
}
