import { useState, useCallback, useEffect, useMemo } from 'react';
import { PlusIcon, MinusIcon, CheckIcon, CogIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import type { SeatLayoutConfig, SeatPosition, SeatType } from '../../types';
import { isSeat, getActualRowCount } from '../../utils/seatNumbering';
import SeatTypeSelector from './SeatTypeSelector';
import LayoutSettings from './LayoutSettings';
import SeatNumberEditor from './SeatNumberEditor';

interface SeatLayoutDesignerProps {
  layout: SeatLayoutConfig;
  onChange: (layout: SeatLayoutConfig) => void;
}

export default function SeatLayoutDesigner({ layout, onChange }: SeatLayoutDesignerProps) {
  const [selectedTool, setSelectedTool] = useState<string>('normal');
  const [showSettings, setShowSettings] = useState(false);
  const [editingSeat, setEditingSeat] = useState<{row: number, col: number} | null>(null);
  const [numberingScheme, setNumberingScheme] = useState<string>(layout.numbering_scheme || 'alphabetic');
  const [rowNaming, setRowNaming] = useState<string>(layout.row_naming || 'alphabetic');
  const [customRowNames, setCustomRowNames] = useState<string[]>(layout.custom_row_names || []);
  const [isValid, setIsValid] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  const seatTypes: Record<string, SeatType> = {
    normal: { name: 'Normal', color: '#10B981', price: 100, available: true, is_accessible: false, icon: '🪑', description: 'Standard seating' },
    premium: { name: 'Premium', color: '#F59E0B', price: 200, available: true, is_accessible: false, icon: '✨', description: 'Premium comfortable seats' },
    disabled_access: { name: 'Wheelchair Access', color: '#3B82F6', price: 100, available: true, is_accessible: true, icon: '♿', description: 'Wheelchair accessible seats' },
    couple: { name: 'Couple Seat', color: '#EC4899', price: 300, available: true, is_accessible: false, icon: '💕', description: 'Couple seating with shared armrest' },
    recliner: { name: 'Recliner', color: '#8B5CF6', price: 250, available: true, is_accessible: false, icon: '🛋️', description: 'Luxury reclining seats' },
    walkway: { name: 'Walkway/Aisle', color: '#E5E7EB', price: 0, available: false, is_accessible: false, icon: '🚶', description: 'Walking path - not counted in seating' },
    empty: { name: 'Empty Space', color: 'transparent', price: 0, available: false, is_accessible: false, icon: '', description: 'Empty space - not counted' },
  };

  // NEW: Calculate duplicate seat numbers
  const { duplicateNumbers, seatNumberCounts, duplicatePositions } = useMemo(() => {
    if (!layout.layout) return { duplicateNumbers: [], seatNumberCounts: {}, duplicatePositions: new Set() };

    const counts: Record<string, number> = {};
    const duplicates: string[] = [];
    const positions = new Set<string>();
    
    // Count seat numbers
    layout.layout.forEach((row, rowIndex) => {
      row.forEach((seat, colIndex) => {
        if (seat?.number && isSeat(seat.type)) {
          counts[seat.number] = (counts[seat.number] || 0) + 1;
        }
      });
    });
    
    // Find duplicates and their positions
    Object.entries(counts).forEach(([number, count]) => {
      if (count > 1) {
        duplicates.push(number);
        
        // Find all positions with this duplicate number
        layout.layout.forEach((row, rowIndex) => {
          row.forEach((seat, colIndex) => {
            if (seat?.number === number && isSeat(seat.type)) {
              positions.add(`${rowIndex}-${colIndex}`);
            }
          });
        });
      }
    });
    
    return { 
      duplicateNumbers: duplicates, 
      seatNumberCounts: counts,
      duplicatePositions: positions
    };
  }, [layout.layout]);

  // NEW: Check if a specific seat is duplicate
  const isSeatDuplicate = useCallback((rowIndex: number, colIndex: number): boolean => {
    return duplicatePositions.has(`${rowIndex}-${colIndex}`);
  }, [duplicatePositions]);

  // NEW: Validate if a seat number is unique
  const validateSeatNumber = useCallback((newNumber: string, currentRowIndex: number, currentColIndex: number): boolean => {
    if (!newNumber.trim()) return false;
    
    const currentSeat = layout.layout?.[currentRowIndex]?.[currentColIndex];
    
    // Allow if it's the same number (editing existing)
    if (newNumber === currentSeat?.number) return true;
    
    // Check if number already exists
    return !Object.keys(seatNumberCounts).includes(newNumber);
  }, [seatNumberCounts, layout.layout]);

  // Initialize layout on component mount if it doesn't exist
  useEffect(() => {
    if (!layout.layout || layout.layout.length === 0) {
      const initialLayout = createInitialLayout();
      onChange({
        ...layout,
        layout: initialLayout,
        seat_types: seatTypes
      });
    }
  }, [layout.rows, layout.columns]);

  const createInitialLayout = useCallback((): SeatPosition[][] => {
    const newLayout: SeatPosition[][] = [];
    for (let row = 0; row < layout.rows; row++) {
      const rowSeats: SeatPosition[] = [];
      for (let col = 0; col < layout.columns; col++) {
        rowSeats.push({
          row: String.fromCharCode(65 + row),
          column: col + 1,
          type: 'normal',
          number: `${String.fromCharCode(65 + row)}${col + 1}`,
          price: seatTypes.normal.price,
          is_accessible: false,
          custom_number: '',
        });
      }
      newLayout.push(rowSeats);
    }
    return newLayout;
  }, [layout.rows, layout.columns, seatTypes]);

  // FIXED: Enhanced seat number generation that properly handles walkways within rows
  const generateSeatNumberFixed = useCallback((gridRowIndex: number, colIndex: number): string => {
    const row = layout.layout?.[gridRowIndex];
    if (!row) return '';
    
    // Count only actual seats in this row up to this column position
    let seatCount = 0;
    for (let i = 0; i <= colIndex; i++) {
      if (row[i] && isSeat(row[i].type)) {
        seatCount++;
      }
    }
    
    // Only assign numbers if this position will be a seat
    if (seatCount === 0) return '';

    // Get the row name (already fixed to skip walkway-only rows)
    const rowName = generateRowName(gridRowIndex);
    if (!rowName) return '';

    if (numberingScheme === 'alphabetic') {
      return `${rowName}${seatCount}`;
    } else if (numberingScheme === 'numeric') {
      const actualRowIndex = getActualRowIndexForGridRow(gridRowIndex);
      return `${actualRowIndex + 1}-${seatCount}`;
    }
    return `${rowName}${seatCount}`;
  }, [layout.layout, numberingScheme, rowNaming, customRowNames]);

  // Helper to get actual row index for a grid row
  const getActualRowIndexForGridRow = useCallback((gridRowIndex: number): number => {
    let actualRowIndex = 0;
    for (let i = 0; i < gridRowIndex; i++) {
      const row = layout.layout?.[i];
      if (row && row.some(seat => isSeat(seat.type))) {
        actualRowIndex++;
      }
    }
    return actualRowIndex;
  }, [layout.layout]);

  const generateRowName = useCallback((gridRowIndex: number): string => {
    const currentRow = layout.layout?.[gridRowIndex];
    const currentRowHasSeats = currentRow && currentRow.some(seat => isSeat(seat.type));
    
    if (!currentRowHasSeats) {
      return '';
    }

    const actualRowIndex = getActualRowIndexForGridRow(gridRowIndex);
    
    if (rowNaming === 'alphabetic') {
      return String.fromCharCode(65 + actualRowIndex);
    } else if (rowNaming === 'numeric') {
      return `${actualRowIndex + 1}`;
    } else if (rowNaming === 'custom' && customRowNames[actualRowIndex]) {
      return customRowNames[actualRowIndex];
    }
    return String.fromCharCode(65 + actualRowIndex);
  }, [layout.layout, rowNaming, customRowNames, getActualRowIndexForGridRow]);

  const shouldShowRowLabel = useCallback((gridRowIndex: number): boolean => {
    const row = layout.layout?.[gridRowIndex];
    return row ? row.some(seat => isSeat(seat.type)) : false;
  }, [layout.layout]);

  // ENHANCED: Validation with duplicate check
  const validateLayout = useCallback(() => {
    const hasSeats = layout.layout && layout.layout.some(row => 
      row.some(seat => isSeat(seat.type))
    );
    
    const actualRowCount = layout.layout ? getActualRowCount(layout.layout) : 0;
    const validRowNames = rowNaming !== 'custom' || 
      (customRowNames.length >= actualRowCount && 
       customRowNames.slice(0, actualRowCount).every(name => name && name.trim()));
    
    // NEW: Check for duplicates
    const noDuplicates = duplicateNumbers.length === 0;
    
    const valid = hasSeats && validRowNames && actualRowCount > 0 && noDuplicates;
    setIsValid(valid);
    return valid;
  }, [layout, rowNaming, customRowNames, duplicateNumbers]);

  useEffect(() => {
    validateLayout();
  }, [validateLayout]);

  // NEW: Toggle entire row as walkway
  const toggleRowWalkway = (rowIndex: number) => {
    const newLayout = { ...layout };
    if (!newLayout.layout || !newLayout.layout[rowIndex]) return;

    // Check if row is currently all walkway/empty
    const isRowWalkway = newLayout.layout[rowIndex].every(
      seat => seat.type === 'walkway' || seat.type === 'empty'
    );

    // Toggle entire row
    newLayout.layout[rowIndex] = newLayout.layout[rowIndex].map((seat, colIndex) => ({
      ...seat,
      type: isRowWalkway ? 'normal' : 'walkway',
      number: isRowWalkway ? generateSeatNumberFixed(rowIndex, colIndex) : '',
      row: isRowWalkway ? generateRowName(rowIndex) : '',
      price: isRowWalkway ? seatTypes.normal.price : 0,
      is_accessible: false,
    }));

    // Update selected rows state
    const newSelectedRows = new Set(selectedRows);
    if (isRowWalkway) {
      newSelectedRows.delete(rowIndex);
    } else {
      newSelectedRows.add(rowIndex);
    }
    setSelectedRows(newSelectedRows);

    onChange(newLayout);
  };

  // Enhanced seat click handler with proper numbering regeneration
  const handleSeatClick = (rowIndex: number, colIndex: number) => {
    console.log('Seat clicked:', rowIndex, colIndex, 'Tool:', selectedTool);

    const newLayout = { ...layout };
    
    if (!newLayout.layout || newLayout.layout.length === 0) {
      newLayout.layout = createInitialLayout();
    }

    const currentSeat = newLayout.layout[rowIndex]?.[colIndex] || {
      row: String.fromCharCode(65 + rowIndex),
      column: colIndex + 1,
      type: 'normal' as const,
      number: `${String.fromCharCode(65 + rowIndex)}${colIndex + 1}`,
      price: 100,
      is_accessible: false,
      custom_number: '',
    };

    const newType = selectedTool as SeatPosition['type'];
    const seatTypeInfo = seatTypes[newType];
    
    // Update the seat first
    newLayout.layout[rowIndex][colIndex] = {
      ...currentSeat,
      type: newType,
      number: '', // Will be regenerated
      row: '',    // Will be regenerated
      price: seatTypeInfo?.price || 0,
      is_accessible: seatTypeInfo?.is_accessible || false,
    };

    // Regenerate numbers for the entire row to ensure proper sequential numbering
    newLayout.layout[rowIndex] = newLayout.layout[rowIndex].map((seat, colIdx) => {
      if (isSeat(seat.type)) {
        return {
          ...seat,
          number: seat.custom_number || generateSeatNumberFixed(rowIndex, colIdx),
          row: generateRowName(rowIndex),
        };
      }
      return {
        ...seat,
        number: '',
        row: '',
      };
    });

    console.log('Updated seat:', newLayout.layout[rowIndex][colIndex]);
    onChange(newLayout);
  };

  const handleEditSeatNumber = (rowIndex: number, colIndex: number) => {
    const seat = layout.layout?.[rowIndex]?.[colIndex];
    if (seat && isSeat(seat.type)) {
      setEditingSeat({ row: rowIndex, col: colIndex });
    }
  };

  // ENHANCED: Save custom number with validation
  const handleSaveCustomNumber = (customNumber: string): boolean => {
    if (!editingSeat) return false;
    
    const trimmedNumber = customNumber.trim();
    
    // Validate uniqueness
    if (!validateSeatNumber(trimmedNumber, editingSeat.row, editingSeat.col)) {
      return false; // Invalid - will show error in modal
    }
    
    const newLayout = { ...layout };
    const seat = newLayout.layout[editingSeat.row][editingSeat.col];
    
    seat.custom_number = trimmedNumber;
    seat.number = trimmedNumber || generateSeatNumberFixed(editingSeat.row, editingSeat.col);
    
    onChange(newLayout);
    setEditingSeat(null);
    return true;
  };

  const updateDimensions = (rows: number, columns: number) => {
    const newLayout = { 
      ...layout, 
      rows, 
      columns,
      layout: []
    };
    setSelectedRows(new Set()); // Clear row selections
    onChange(newLayout);
  };

  const updateLayout = useCallback(() => {
    const newLayout = { 
      ...layout, 
      numbering_scheme: numberingScheme,
      row_naming: rowNaming,
      custom_row_names: customRowNames,
      seat_types: seatTypes
    };
    
    if (newLayout.layout && newLayout.layout.length > 0) {
      newLayout.layout = newLayout.layout.map((row, rowIndex) =>
        row.map((seat, colIndex) => ({
          ...seat,
          row: isSeat(seat.type) ? generateRowName(rowIndex) : '',
          number: isSeat(seat.type) ? 
            (seat.custom_number || generateSeatNumberFixed(rowIndex, colIndex)) : '',
        }))
      );
    }
    
    onChange(newLayout);
  }, [layout, numberingScheme, rowNaming, customRowNames, generateRowName, onChange, seatTypes, generateSeatNumberFixed]);

  // Statistics
  const totalSeats = layout.layout ? layout.layout.reduce((total, row) => 
    total + row.filter(seat => isSeat(seat.type)).length, 0) : 0;
  
  const accessibleSeats = layout.layout ? layout.layout.reduce((total, row) => 
    total + row.filter(seat => isSeat(seat.type) && (seat.is_accessible || seat.type === 'disabled_access')).length, 0) : 0;
  
  const actualRowCount = layout.layout ? getActualRowCount(layout.layout) : 0;

  return (
    <div className="space-y-6">
      {/* Debug info */}
      <div className="bg-gray-100 p-2 text-xs rounded">
        <strong>Debug:</strong> Selected Tool: {selectedTool} | Selected Rows: {Array.from(selectedRows).join(', ')} | 
        Layout: {layout.layout?.length || 0}x{layout.layout?.[0]?.length || 0} | Duplicates: {duplicateNumbers.join(', ')}
      </div>

      {/* NEW: Duplicate seats warning */}
      {duplicateNumbers.length > 0 && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-800 font-bold">⚠️ Duplicate Seat Numbers Detected</span>
          </div>
          <p className="text-red-700 text-sm mt-2">
            The following seat numbers are used multiple times: <strong>{duplicateNumbers.join(', ')}</strong>
          </p>
          <p className="text-red-600 text-xs mt-1">
            Please double-click the highlighted seats (marked with red borders) to assign unique numbers.
          </p>
          <div className="mt-2 text-xs text-red-600">
            Total duplicates: {duplicateNumbers.length} numbers affecting {duplicatePositions.size} seats
          </div>
        </div>
      )}

      {/* Row Selection Controls */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold mb-2 text-blue-900">Quick Row Tools</h3>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => {
              // Toggle all selected rows as walkways
              selectedRows.forEach(rowIndex => toggleRowWalkway(rowIndex));
              setSelectedRows(new Set());
            }}
            disabled={selectedRows.size === 0}
            className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Make Selected Rows Walkways ({selectedRows.size})
          </button>
          
          <button
            onClick={() => setSelectedRows(new Set())}
            disabled={selectedRows.size === 0}
            className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear Selection
          </button>
        </div>
        <p className="text-xs text-blue-700 mt-2">
          💡 <strong>Tip:</strong> Click on row labels (A, B, C) to select/toggle entire rows as walkways
        </p>
      </div>

      {/* ENHANCED: Validation Status with duplicate check */}
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
                {duplicateNumbers.length > 0 && ' - Fix duplicate seat numbers'}
              </span>
            </>
          )}
        </div>
        <div className="mt-2 text-sm text-gray-600 space-y-1">
          <div>Actual Rows (with seats): {actualRowCount} | Total Seats: {totalSeats}</div>
          <div>
            Accessible Seats: {accessibleSeats} | Grid Size: {layout.rows} × {layout.columns}
            {duplicateNumbers.length > 0 && (
              <span className="text-red-600 font-medium"> | ⚠️ {duplicateNumbers.length} duplicate seat numbers</span>
            )}
          </div>
        </div>
      </div>

      {/* Settings Panel */}
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
          actualRowCount={actualRowCount}
          onApplyChanges={updateLayout}
        />

        {/* Seat Type Selector */}
        <div className="mt-4">
          <SeatTypeSelector
            seatTypes={seatTypes}
            selectedTool={selectedTool}
            onToolSelect={setSelectedTool}
          />
        </div>

        {/* Dimensions Control */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Rows</label>
            <div className="flex items-center space-x-2">
              <button onClick={() => updateDimensions(Math.max(1, layout.rows - 1), layout.columns)} className="p-1 border border-gray-300 rounded hover:bg-gray-50">
                <MinusIcon className="h-4 w-4" />
              </button>
              <span className="w-12 text-center">{layout.rows}</span>
              <button onClick={() => updateDimensions(Math.min(20, layout.rows + 1), layout.columns)} className="p-1 border border-gray-300 rounded hover:bg-gray-50">
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Columns</label>
            <div className="flex items-center space-x-2">
              <button onClick={() => updateDimensions(layout.rows, Math.max(1, layout.columns - 1))} className="p-1 border border-gray-300 rounded hover:bg-gray-50">
                <MinusIcon className="h-4 w-4" />
              </button>
              <span className="w-12 text-center">{layout.columns}</span>
              <button onClick={() => updateDimensions(layout.rows, Math.min(30, layout.columns + 1))} className="p-1 border border-gray-300 rounded hover:bg-gray-50">
                <PlusIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Seat Layout Grid */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center mb-4">
          <div className="bg-gray-800 text-white py-2 px-8 rounded-md inline-block">
            🎬 SCREEN 🎬
          </div>
        </div>

        <div className="flex justify-center">
          <div className="space-y-1">
            {Array.from({ length: layout.rows }, (_, rowIndex) => {
              const isRowSelected = selectedRows.has(rowIndex);
              const rowHasSeats = shouldShowRowLabel(rowIndex);
              
              return (
                <div key={rowIndex} className="flex items-center space-x-1">
                  {/* ENHANCED: Clickable row label for row selection/toggle */}
                  <button
                    onClick={() => {
                      if (selectedRows.has(rowIndex)) {
                        const newSelected = new Set(selectedRows);
                        newSelected.delete(rowIndex);
                        setSelectedRows(newSelected);
                      } else {
                        setSelectedRows(new Set(selectedRows).add(rowIndex));
                      }
                    }}
                    onDoubleClick={() => toggleRowWalkway(rowIndex)}
                    className={`w-8 h-8 text-center text-sm font-medium cursor-pointer rounded transition-colors ${
                      isRowSelected 
                        ? 'bg-blue-500 text-white' 
                        : rowHasSeats 
                          ? 'text-gray-900 hover:bg-blue-100' 
                          : 'text-gray-400 hover:bg-gray-100'
                    }`}
                    title={`${rowHasSeats ? generateRowName(rowIndex) : '·'} - Click to select, Double-click to toggle walkway`}
                  >
                    {rowHasSeats ? generateRowName(rowIndex) : '·'}
                  </button>
                  
                  <div className="flex space-x-1">
                    {Array.from({ length: layout.columns }, (_, colIndex) => {
                      const seat = layout.layout?.[rowIndex]?.[colIndex] || {
                        row: String.fromCharCode(65 + rowIndex),
                        column: colIndex + 1,
                        type: 'normal' as const,
                        number: `${String.fromCharCode(65 + rowIndex)}${colIndex + 1}`,
                        price: 100,
                        is_accessible: false,
                        custom_number: ''
                      };
                      
                      // NEW: Check if this seat is duplicate
                      const isDuplicate = isSeatDuplicate(rowIndex, colIndex);
                      
                      return (
                        <div key={`${rowIndex}-${colIndex}`} className="relative">
                          <button
                            onClick={() => handleSeatClick(rowIndex, colIndex)}
                            onDoubleClick={() => handleEditSeatNumber(rowIndex, colIndex)}
                            className={`w-8 h-8 rounded border-2 transition-all hover:scale-110 text-xs font-medium flex items-center justify-center ${
                              isSeat(seat.type)
                                ? `border-gray-300 cursor-pointer hover:border-gray-400 ${isDuplicate ? 'ring-2 ring-red-400 border-red-400' : ''}`
                                : 'border-gray-200 cursor-pointer bg-gray-100'
                            }`}
                            style={{
                              backgroundColor: isDuplicate ? '#FEE2E2' : (seatTypes[seat.type]?.color || '#10B981'),
                              color: isSeat(seat.type) ? (isDuplicate ? '#DC2626' : 'white') : '#6B7280',
                              opacity: seat.type === 'empty' ? 0.3 : 1,
                            }}
                            title={`${seat.number || `${rowIndex + 1}-${colIndex + 1}`} - ${seatTypes[seat.type]?.name || 'Normal'}${isDuplicate ? ' (DUPLICATE - Double-click to edit)' : ''}`}
                          >
                            {isSeat(seat.type) ? (
                              <span className="text-xs font-bold">
                                {seat.number?.slice(-2) || `${colIndex + 1}`}
                              </span>
                            ) : (
                              seat.type === 'walkway' && (
                                <span className="text-xs">{seatTypes[seat.type]?.icon}</span>
                              )
                            )}
                          </button>
                          
                          {/* NEW: Duplicate warning icon */}
                          {isDuplicate && (
                            <div className="absolute -top-2 -left-2 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center z-10">
                              <ExclamationTriangleIcon className="w-2.5 h-2.5" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ENHANCED: Custom Seat Number Editor with validation */}
      <SeatNumberEditor
        isOpen={!!editingSeat}
        currentNumber={editingSeat ? 
          layout.layout?.[editingSeat.row]?.[editingSeat.col]?.custom_number || 
          layout.layout?.[editingSeat.row]?.[editingSeat.col]?.number || '' : ''}
        onSave={handleSaveCustomNumber}
        onCancel={() => setEditingSeat(null)}
        // duplicateNumbers={duplicateNumbers}
        // validateNumber={(number) => editingSeat ? validateSeatNumber(number, editingSeat.row, editingSeat.col) : true}
      />

      {/* Legend */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-semibold mb-3">Seat Types Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {Object.entries(seatTypes).map(([key, seatType]) => (
            <div key={key} className="flex items-center">
              <div className="w-4 h-4 rounded mr-2 border border-gray-300 flex items-center justify-center text-xs" style={{ backgroundColor: seatType.color }}>
                {seatType.icon}
              </div>
              <div className="text-sm">
                <div className="font-medium text-gray-700">{seatType.name}</div>
                {seatType.price > 0 && (
                  <div className="text-xs text-gray-500">₹{seatType.price}</div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-blue-700 space-y-1">
          <div><strong>🖱️ Single-click seats</strong> to change type using selected tool above.</div>
          <div><strong>🖱️ Double-click seats</strong> to set custom numbers.</div>
          <div><strong>🖱️ Click row labels (A, B, C)</strong> to select entire rows.</div>
          <div><strong>🖱️ Double-click row labels</strong> to instantly toggle entire row as walkway.</div>
          <div><strong>🔢 Smart Numbering:</strong> Seats in each row are numbered consecutively (A1, A2, A3) skipping walkways.</div>
          <div><strong>⚠️ Duplicate Detection:</strong> Seats with duplicate numbers are highlighted with red borders and warning icons.</div>
        </div>
      </div>
    </div>
  );
}
