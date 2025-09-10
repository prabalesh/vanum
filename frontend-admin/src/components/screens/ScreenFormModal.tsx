import { useState, useEffect } from 'react';
import { Dialog, DialogPanel } from '@headlessui/react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { screensApi } from '../../services/api';
import SeatLayoutDesigner from './SeatLayoutDesigner';
import type { Screen, SeatLayoutConfig } from '../../types';

interface ScreenFormModalProps {
  isOpen: boolean;
  theaterId: number;
  editingScreen: Screen | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ScreenFormModal({
  isOpen,
  theaterId,
  editingScreen,
  onClose,
  onSuccess,
}: ScreenFormModalProps) {
  // Form fields
  const [screenName, setScreenName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); // FIXED: Added missing state

  // Seat layout state
  const [localLayout, setLocalLayout] = useState<SeatLayoutConfig>({
    rows: 8,
    columns: 12,
    numbering_scheme: 'alphabetic',
    row_naming: 'alphabetic',
    custom_row_names: [],
    seat_types: {},
    layout: [],
    walkway_rows: [],
    walkway_cols: [],
    accessible_seats: [],
    pricing_tiers: {},
  });

  const [activeStep, setActiveStep] = useState(0);
  const [canProceed, setCanProceed] = useState(false);
  
  const steps = ['Basic Info', 'Seat Layout', 'Review & Submit'];

  // Initialize form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (editingScreen) {
        setScreenName(editingScreen.name || '');
        setIsActive(editingScreen.is_active ?? true);
        try {
          const parsedLayout =
            typeof editingScreen.seat_layout === 'string'
              ? JSON.parse(editingScreen.seat_layout)
              : editingScreen.seat_layout;
          setLocalLayout(parsedLayout);
        } catch {
          setLocalLayout((prev) => ({ ...prev, layout: [] }));
        }
      } else {
        setScreenName('');
        setIsActive(true);
        setLocalLayout({
          rows: 8,
          columns: 12,
          numbering_scheme: 'alphabetic',
          row_naming: 'alphabetic',
          custom_row_names: [],
          seat_types: {},
          layout: [],
          walkway_rows: [],
          walkway_cols: [],
          accessible_seats: [],
          pricing_tiers: {},
        });
      }
      setActiveStep(0);
      setIsSubmitting(false); // Reset loading state
    }
  }, [isOpen, editingScreen]);

  // Validation functions
  const validateBasicInfo = () => screenName.trim().length > 0;

  const validateSeatLayout = (layout: SeatLayoutConfig) => {
    if (!layout.layout || layout.layout.length === 0) return false;
    const hasSeats = layout.layout.some((row) =>
      row.some((seat) => seat.type !== 'walkway' && seat.type !== 'empty')
    );
    const allRowsNamed =
      layout.row_naming !== 'custom' ||
      (layout.custom_row_names != undefined && layout.custom_row_names.length === layout.rows &&
        layout.custom_row_names.every((name) => name.trim() !== ''));
    return hasSeats && allRowsNamed;
  };

  // Update canProceed based on current step validation
  useEffect(() => {
    if (activeStep === 0) {
      setCanProceed(validateBasicInfo());
    } else if (activeStep === 1) {
      setCanProceed(validateSeatLayout(localLayout));
    } else {
      setCanProceed(true);
    }
  }, [activeStep, screenName, localLayout]);

  // Submit handler - only submits on final step
  const onSubmit = async () => {
  if (activeStep !== steps.length - 1) {
    return; // Block submission if not on last step
  }

  if (!canProceed) {
    toast.error('Please complete all steps before submitting.');
    return;
  }

  setIsSubmitting(true);
  try {
    // Calculate total seats from layout
    const totalSeats = localLayout.layout?.reduce(
      (sum, row) => sum + row.filter((seat) => seat.type !== 'walkway' && seat.type !== 'empty').length,
      0
    ) || 0;

    const payload = {
      name: screenName.trim(),
      seat_layout: localLayout,
      is_active: isActive,
      total_seats: totalSeats, // ADD THIS LINE
      // Alternative: if your backend expects 'capacity' instead
      // capacity: totalSeats
    };

    if (editingScreen) {
      await screensApi.update(editingScreen.id, payload);
      toast.success('Screen updated successfully.');
    } else {
      await screensApi.create(theaterId, payload);
      toast.success('Screen created successfully.');
    }
    
    onSuccess();
    onClose();
  } catch (error) {
    toast.error(editingScreen ? 'Failed to update screen' : 'Failed to create screen');
    console.error(error);
  } finally {
    setIsSubmitting(false);
  }
};


  // Navigation handlers
  const onNext = () => {
    if (!canProceed) {
      toast.error('Please complete the current step before proceeding.');
      return;
    }
    setActiveStep((s) => Math.min(steps.length - 1, s + 1));
  };

  const onPrevious = () => {
    setActiveStep((s) => Math.max(0, s - 1));
  };

  const handleClose = () => {
    setScreenName('');
    setIsActive(true);
    setLocalLayout({
      rows: 8,
      columns: 12,
      numbering_scheme: 'alphabetic',
      row_naming: 'alphabetic',
      custom_row_names: [],
      seat_types: {},
      layout: [],
      walkway_rows: [],
      walkway_cols: [],
      accessible_seats: [],
      pricing_tiers: {},
    });
    setActiveStep(0);
    setIsSubmitting(false);
    onClose();
  };

  // Helper functions for stats
  const getTotalSeats = () =>
    localLayout.layout?.reduce(
      (sum, row) => sum + row.filter((s) => s.type !== 'walkway' && s.type !== 'empty').length,
      0
    ) ?? 0;

  const getAccessibleSeatsCount = () =>
    localLayout.layout?.reduce(
      (sum, row) => sum + row.filter((s) => s.is_accessible || s.type === 'disabled_access').length,
      0
    ) ?? 0;

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="mx-auto max-w-4xl w-full rounded-xl bg-white shadow-xl max-h-[90vh] overflow-auto">
          <div className="flex items-center justify-between border-b p-6">
            <h3 className="text-xl font-semibold">
              {editingScreen ? `Edit Screen: ${editingScreen.name}` : 'Create New Screen'}
            </h3>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600" aria-label="Close">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Step Navigation */}
            <nav className="flex justify-center gap-4 mb-8">
              {steps.map((step, idx) => (
                <button
                  key={step}
                  type="button"
                  disabled={idx > activeStep}
                  onClick={() => setActiveStep(idx)}
                  className={`rounded-full px-4 py-1 text-sm font-medium ${
                    idx === activeStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                  } ${idx > activeStep ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  {step}
                </button>
              ))}
            </nav>

            {/* Step Content */}
            {activeStep === 0 && (
              <>
                <label className="block text-gray-700 mb-2 font-semibold">
                  Screen Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={screenName}
                  onChange={(e) => setScreenName(e.target.value)}
                  className="w-full rounded border border-gray-300 p-2 focus:ring-2 focus:ring-blue-600"
                  placeholder="Example: Main Hall"
                />
                {!validateBasicInfo() && screenName.length > 0 && (
                  <p className="mt-1 text-red-600">Screen name is required</p>
                )}

                <label className="inline-flex items-center mt-4">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">Active Screen</span>
                </label>
              </>
            )}

            {activeStep === 1 && (
              <>
                <h4 className="mb-4 text-lg font-semibold">Configure Seat Layout</h4>
                <SeatLayoutDesigner layout={localLayout} onChange={setLocalLayout} />
                {!validateSeatLayout(localLayout) && (
                  <div className="mt-4 flex items-center gap-2 rounded border border-yellow-300 bg-yellow-100 p-4 text-yellow-700">
                    <ExclamationTriangleIcon className="h-6 w-6" />
                    <p>Please configure your seat layout completely before proceeding.</p>
                  </div>
                )}
              </>
            )}

            {activeStep === 2 && (
              <>
                <h4 className="mb-4 text-lg font-semibold">Review Your Configuration</h4>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <dt className="font-semibold">Name:</dt>
                    <dd>{screenName}</dd>
                    <dt className="font-semibold mt-2">Active:</dt>
                    <dd>{isActive ? 'Yes' : 'No'}</dd>
                    <dt className="font-semibold mt-2">Total Seats:</dt>
                    <dd>{getTotalSeats()}</dd>
                    <dt className="font-semibold mt-2">Accessible Seats:</dt>
                    <dd>{getAccessibleSeatsCount()}</dd>
                    <dt className="font-semibold mt-2">Rows × Columns:</dt>
                    <dd>
                      {localLayout.rows} × {localLayout.columns}
                    </dd>
                  </div>
                </dl>
              </>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t border-gray-200">
              {activeStep > 0 && (
                <button
                  type="button"
                  onClick={onPrevious}
                  disabled={isSubmitting}
                  className="rounded border border-gray-300 px-4 py-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
              )}

              {activeStep < steps.length - 1 ? (
                <button
                  type="button"
                  onClick={onNext}
                  disabled={!canProceed || isSubmitting}
                  className={`rounded px-4 py-2 text-white ${
                    canProceed && !isSubmitting
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={!canProceed || isSubmitting}
                  className={`rounded px-4 py-2 text-white ${
                    canProceed && !isSubmitting
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? 'Saving...' : editingScreen ? 'Update Screen' : 'Create Screen'}
                </button>
              )}
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
