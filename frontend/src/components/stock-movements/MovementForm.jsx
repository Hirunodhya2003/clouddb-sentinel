// Owner: Member 08
import React, { useState, useMemo } from 'react';
import {
  IS_DEVELOPMENT_MOCK_MODE,
  API_ENDPOINTS,
  VALID_ADJUSTMENT_TYPES,
  ADJUSTMENT_TYPE_META,
} from '../../services/stockMovementService.js';

function generateSuggestedReference() {
  const randomSuffix = Math.floor(2105 + Math.random() * 890);
  return `ADJ-2026-${randomSuffix}`;
}

/**
 * Create Stock Adjustment Form Component (Figma UI 19)
 * Conforms strictly to:
 *   - stock_adjustments (03_create_stock_adjustments_table.sql)
 *   - stock_adjustment_items (04_create_stock_adjustment_items_table.sql)
 *
 * IMPORTANT:
 *   - Calculates quantity_difference = quantity_after - quantity_before for display ONLY.
 *   - Never stores or submits quantity_difference in the payload because it is a
 *     MySQL GENERATED ALWAYS AS (quantity_after - quantity_before) STORED column.
 *   - Submits new adjustments in PENDING status only (development mock mode).
 */
export default function MovementForm({
  variants = [],
  existingReferences = [],
  onSubmitAdjustment,
  onCancel,
}) {
  const [adjustmentReference, setAdjustmentReference] = useState('ADJ-2026-2105');
  const [adjustmentDate, setAdjustmentDate] = useState('2026-11-17');
  const [adjustmentType, setAdjustmentType] = useState('PHYSICAL_COUNT');
  const [reason, setReason] = useState('');
  const [variantId, setVariantId] = useState('');
  const [quantityBefore, setQuantityBefore] = useState('0');
  const [quantityAfter, setQuantityAfter] = useState('0');
  const [itemReason, setItemReason] = useState('');

  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedVariant = useMemo(() => {
    if (!variantId) return null;
    return variants.find((v) => v.variant_id === Number(variantId)) || null;
  }, [variants, variantId]);

  // Real-time calculation of quantity_difference = quantity_after - quantity_before for display only
  const quantityDifferencePreview = useMemo(() => {
    const parsedBefore = Number(quantityBefore);
    const parsedAfter = Number(quantityAfter);
    if (
      quantityBefore === '' ||
      quantityAfter === '' ||
      Number.isNaN(parsedBefore) ||
      Number.isNaN(parsedAfter)
    ) {
      return null;
    }
    return parsedAfter - parsedBefore;
  }, [quantityBefore, quantityAfter]);

  const handleVariantChange = (event) => {
    const nextVariantId = event.target.value;
    setVariantId(nextVariantId);
    setSubmitError(null);

    if (nextVariantId) {
      const matched = variants.find((v) => v.variant_id === Number(nextVariantId));
      if (matched && typeof matched.current_quantity_on_hand === 'number') {
        setQuantityBefore(String(matched.current_quantity_on_hand));
        setQuantityAfter(String(matched.current_quantity_on_hand));
      }
    }

    if (fieldErrors.variant_id) {
      setFieldErrors((prev) => ({ ...prev, variant_id: null }));
    }
  };

  const validateForm = () => {
    const errors = {};
    const trimmedRef = adjustmentReference.trim();
    const trimmedReason = reason.trim();
    const trimmedItemReason = itemReason.trim();

    if (!trimmedRef) {
      errors.adjustment_reference =
        'Reference / Name is required (chk_adjustment_reference_not_empty).';
    } else if (trimmedRef.length > 50) {
      errors.adjustment_reference =
        'Reference / Name cannot exceed 50 characters (VARCHAR(50)).';
    } else if (
      existingReferences.some(
        (ref) => String(ref).toLowerCase() === trimmedRef.toLowerCase()
      )
    ) {
      errors.adjustment_reference = `Reference "${trimmedRef}" already exists (uq_adjustment_reference).`;
    }

    if (!adjustmentDate) {
      errors.adjustment_date = 'Adjustment date is required.';
    }

    if (!VALID_ADJUSTMENT_TYPES.includes(adjustmentType)) {
      errors.adjustment_type = 'Please select a valid SQL adjustment_type.';
    }

    if (!variantId) {
      errors.variant_id = 'Please select a related product variant.';
    }

    const parsedBefore = Number(quantityBefore);
    if (
      quantityBefore === '' ||
      !Number.isInteger(parsedBefore) ||
      parsedBefore < 0
    ) {
      errors.quantity_before =
        'Quantity before must be a whole number >= 0 (chk_adjustment_quantity_before).';
    }

    const parsedAfter = Number(quantityAfter);
    if (
      quantityAfter === '' ||
      !Number.isInteger(parsedAfter) ||
      parsedAfter < 0
    ) {
      errors.quantity_after =
        'Quantity after must be a whole number >= 0 (chk_adjustment_quantity_after).';
    }

    if (!trimmedReason) {
      errors.reason =
        'Description / Reason is required (chk_adjustment_reason_not_empty).';
    }

    if (trimmedItemReason.length > 255) {
      errors.item_reason =
        'Item reason cannot exceed 255 characters (VARCHAR(255)).';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleReset = () => {
    setAdjustmentReference(generateSuggestedReference());
    setAdjustmentDate('2026-11-17');
    setAdjustmentType('PHYSICAL_COUNT');
    setReason('');
    setVariantId('');
    setQuantityBefore('0');
    setQuantityAfter('0');
    setItemReason('');
    setFieldErrors({});
    setSubmitError(null);
    setSubmitSuccess(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!validateForm()) {
      setSubmitError(
        'Please correct the highlighted validation errors before saving.'
      );
      return;
    }

    // Construct schema-compliant payload WITHOUT quantity_difference
    // (quantity_difference is GENERATED ALWAYS AS (quantity_after - quantity_before) STORED in MySQL)
    const payload = {
      adjustment_reference: adjustmentReference.trim(),
      adjustment_date: `${adjustmentDate}T12:00:00Z`,
      adjustment_type: adjustmentType,
      reason: reason.trim(),
      created_by: 4,
      items: [
        {
          variant_id: Number(variantId),
          quantity_before: Number(quantityBefore),
          quantity_after: Number(quantityAfter),
          item_reason: itemReason.trim() || null,
        },
      ],
    };

    setIsSubmitting(true);
    try {
      const response = await onSubmitAdjustment(payload);
      setSubmitSuccess({
        reference: response?.item?.adjustment_reference || payload.adjustment_reference,
        adjustmentId: response?.item?.adjustment_id,
        status: response?.item?.status || 'PENDING',
        notice:
          response?.notice ||
          'Development mock submission only: Added as PENDING in local memory. No database save, inventory update (sp_update_inventory), or stock_movements record was created.',
      });
      setAdjustmentReference(generateSuggestedReference());
      setReason('');
      setItemReason('');
      setFieldErrors({});
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Unable to submit stock adjustment.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="m08-sa-form-view">
      {/* Top Header matching Figma UI 19 */}
      <header className="m08-sa-header">
        <div className="m08-sa-title-group">
          <div className="m08-sa-title-row">
            <h1 id="m08-sa-form-title" className="m08-sa-title">
              Create Stock Adjustment
            </h1>
            {IS_DEVELOPMENT_MOCK_MODE && (
              <span
                className="m08-sa-mock-pill"
                title={`Development mock submission (${API_ENDPOINTS.CREATE_STOCK_ADJUSTMENT})`}
              >
                Dev Mock Mode · Local Pending Only
              </span>
            )}
          </div>
          <p className="m08-sa-subtitle">
            Record controlled stock corrections
          </p>
        </div>

        <div className="m08-sa-header-actions">
          {onCancel && (
            <button
              type="button"
              className="m08-sa-btn-secondary"
              onClick={onCancel}
            >
              ← Back to directory
            </button>
          )}
          <button
            type="submit"
            form="m08-create-adjustment-form"
            className="m08-sa-btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </header>

      {/* Main White Card matching Figma UI 19 */}
      <div className="m08-sa-card">
        <div className="m08-sa-form-section-header">
          <h2 className="m08-sa-card-title">Basic information</h2>
          <p className="m08-sa-card-subtitle">
            Complete the information below. Fields marked required must be provided.
          </p>
        </div>

        {submitError && (
          <div className="m08-sa-alert m08-sa-alert-error" role="alert">
            <strong>Validation / Submission Error:</strong> {submitError}
          </div>
        )}

        {submitSuccess && (
          <div
            className="m08-sa-alert m08-sa-alert-success"
            role="status"
            aria-live="polite"
          >
            <div className="m08-sa-alert-title">
              Mock Adjustment Created: {submitSuccess.reference} (Status:{' '}
              {submitSuccess.status})
            </div>
            <p className="m08-sa-alert-text">{submitSuccess.notice}</p>
            {onCancel && (
              <div style={{ marginTop: '10px' }}>
                <button
                  type="button"
                  className="m08-sa-btn-secondary"
                  onClick={onCancel}
                >
                  View in Stock Adjustments directory →
                </button>
              </div>
            )}
          </div>
        )}

        <form
          id="m08-create-adjustment-form"
          onSubmit={handleSubmit}
          noValidate
          aria-labelledby="m08-sa-form-title"
        >
          {/* 2-Column Grid matching Figma UI 19 */}
          <div className="m08-sa-form-grid">
            {/* Slot 1 (Top Left): Reference / Name */}
            <div className="m08-sa-field">
              <div className="m08-sa-label-row">
                <label
                  htmlFor="m08-adj-reference"
                  className="m08-sa-label"
                >
                  Reference / Name <span aria-hidden="true">*</span>
                </label>
                <button
                  type="button"
                  className="m08-sa-link-btn"
                  onClick={() => {
                    setAdjustmentReference(generateSuggestedReference());
                    if (fieldErrors.adjustment_reference) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        adjustment_reference: null,
                      }));
                    }
                  }}
                >
                  Generate ID
                </button>
              </div>
              <input
                id="m08-adj-reference"
                type="text"
                maxLength={50}
                className={`m08-sa-input ${
                  fieldErrors.adjustment_reference ? 'm08-sa-input-error' : ''
                }`}
                placeholder="Enter details (e.g. ADJ-2026-2105)"
                value={adjustmentReference}
                onChange={(e) => {
                  setAdjustmentReference(e.target.value);
                  if (fieldErrors.adjustment_reference) {
                    setFieldErrors((prev) => ({
                      ...prev,
                      adjustment_reference: null,
                    }));
                  }
                }}
                required
              />
              {fieldErrors.adjustment_reference && (
                <span className="m08-sa-field-error" role="alert">
                  {fieldErrors.adjustment_reference}
                </span>
              )}
            </div>

            {/* Slot 2 (Top Right): Related record (Product Variant) */}
            <div className="m08-sa-field">
              <label htmlFor="m08-adj-variant" className="m08-sa-label">
                Related record (Product Variant) <span aria-hidden="true">*</span>
              </label>
              <select
                id="m08-adj-variant"
                className={`m08-sa-input ${
                  fieldErrors.variant_id ? 'm08-sa-input-error' : ''
                }`}
                value={variantId}
                onChange={handleVariantChange}
                required
              >
                <option value="">Select an option</option>
                {variants.map((variant) => (
                  <option key={variant.variant_id} value={variant.variant_id}>
                    {variant.sku} · {variant.product_name} ({variant.size_name} /{' '}
                    {variant.colour_name}) — On hand:{' '}
                    {variant.current_quantity_on_hand}
                  </option>
                ))}
              </select>
              {selectedVariant && (
                <span className="m08-sa-field-hint">
                  Variant #{selectedVariant.variant_id} · Category:{' '}
                  {selectedVariant.category_name} · Reference Stock:{' '}
                  {selectedVariant.current_quantity_on_hand} units
                </span>
              )}
              {fieldErrors.variant_id && (
                <span className="m08-sa-field-error" role="alert">
                  {fieldErrors.variant_id}
                </span>
              )}
            </div>

            {/* Slot 3 (Middle Left): Date & Adjustment Type */}
            <div className="m08-sa-field">
              <div className="m08-sa-subgrid-2">
                <div>
                  <label htmlFor="m08-adj-date" className="m08-sa-label">
                    Date <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="m08-adj-date"
                    type="date"
                    className={`m08-sa-input ${
                      fieldErrors.adjustment_date ? 'm08-sa-input-error' : ''
                    }`}
                    value={adjustmentDate}
                    onChange={(e) => setAdjustmentDate(e.target.value)}
                    required
                  />
                  {fieldErrors.adjustment_date && (
                    <span className="m08-sa-field-error" role="alert">
                      {fieldErrors.adjustment_date}
                    </span>
                  )}
                </div>

                <div>
                  <label htmlFor="m08-adj-type" className="m08-sa-label">
                    Adjustment Type <span aria-hidden="true">*</span>
                  </label>
                  <select
                    id="m08-adj-type"
                    className={`m08-sa-input ${
                      fieldErrors.adjustment_type ? 'm08-sa-input-error' : ''
                    }`}
                    value={adjustmentType}
                    onChange={(e) => setAdjustmentType(e.target.value)}
                    required
                  >
                    {VALID_ADJUSTMENT_TYPES.map((typeCode) => (
                      <option key={typeCode} value={typeCode}>
                        {ADJUSTMENT_TYPE_META[typeCode]?.label || typeCode} (
                        {typeCode})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Slot 4 (Middle Right): Quantity / Amount (quantity_before, quantity_after, quantity_difference preview) */}
            <div className="m08-sa-field">
              <div className="m08-sa-subgrid-3">
                <div>
                  <label htmlFor="m08-qty-before" className="m08-sa-label">
                    Quantity Before <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="m08-qty-before"
                    type="number"
                    min="0"
                    step="1"
                    className={`m08-sa-input ${
                      fieldErrors.quantity_before ? 'm08-sa-input-error' : ''
                    }`}
                    placeholder="0"
                    value={quantityBefore}
                    onChange={(e) => {
                      setQuantityBefore(e.target.value);
                      if (fieldErrors.quantity_before) {
                        setFieldErrors((prev) => ({
                          ...prev,
                          quantity_before: null,
                        }));
                      }
                    }}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="m08-qty-after" className="m08-sa-label">
                    Quantity After <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="m08-qty-after"
                    type="number"
                    min="0"
                    step="1"
                    className={`m08-sa-input ${
                      fieldErrors.quantity_after ? 'm08-sa-input-error' : ''
                    }`}
                    placeholder="0"
                    value={quantityAfter}
                    onChange={(e) => {
                      setQuantityAfter(e.target.value);
                      if (fieldErrors.quantity_after) {
                        setFieldErrors((prev) => ({
                          ...prev,
                          quantity_after: null,
                        }));
                      }
                    }}
                    required
                  />
                </div>

                <div>
                  <span className="m08-sa-label">
                    Difference (Display Only)
                  </span>
                  <div
                    className="m08-sa-input m08-sa-input-readonly"
                    aria-live="polite"
                    title="MySQL GENERATED ALWAYS AS (quantity_after - quantity_before) STORED. Displayed for preview; not submitted."
                  >
                    {quantityDifferencePreview === null
                      ? '—'
                      : `${
                          quantityDifferencePreview > 0 ? '+' : ''
                        }${quantityDifferencePreview} units`}
                  </div>
                </div>
              </div>
              {fieldErrors.quantity_before && (
                <span className="m08-sa-field-error" role="alert">
                  {fieldErrors.quantity_before}
                </span>
              )}
              {fieldErrors.quantity_after && (
                <span className="m08-sa-field-error" role="alert">
                  {fieldErrors.quantity_after}
                </span>
              )}
              <span className="m08-sa-field-hint">
                <code>quantity_difference</code> is calculated as{' '}
                <code>quantity_after - quantity_before</code> for display and is
                never manually stored or submitted.
              </span>
            </div>

            {/* Slot 5 (Bottom Left): Description / Reason & Item Reason */}
            <div className="m08-sa-field">
              <label htmlFor="m08-adj-reason" className="m08-sa-label">
                Description / Reason <span aria-hidden="true">*</span>
              </label>
              <input
                id="m08-adj-reason"
                type="text"
                className={`m08-sa-input ${
                  fieldErrors.reason ? 'm08-sa-input-error' : ''
                }`}
                placeholder="Enter details (required adjustment reason)"
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (fieldErrors.reason) {
                    setFieldErrors((prev) => ({ ...prev, reason: null }));
                  }
                }}
                required
              />
              {fieldErrors.reason && (
                <span className="m08-sa-field-error" role="alert">
                  {fieldErrors.reason}
                </span>
              )}

              <div style={{ marginTop: '12px' }}>
                <label htmlFor="m08-item-reason" className="m08-sa-label">
                  Line Item Note (Optional · max 255 chars)
                </label>
                <input
                  id="m08-item-reason"
                  type="text"
                  maxLength={255}
                  className={`m08-sa-input ${
                    fieldErrors.item_reason ? 'm08-sa-input-error' : ''
                  }`}
                  placeholder="Optional item-specific note (stock_adjustment_items.item_reason)"
                  value={itemReason}
                  onChange={(e) => setItemReason(e.target.value)}
                />
                {fieldErrors.item_reason && (
                  <span className="m08-sa-field-error" role="alert">
                    {fieldErrors.item_reason}
                  </span>
                )}
              </div>
            </div>

            {/* Slot 6 (Bottom Right): Status */}
            <div className="m08-sa-field">
              <label htmlFor="m08-adj-status" className="m08-sa-label">
                Status
              </label>
              <input
                id="m08-adj-status"
                type="text"
                className="m08-sa-input m08-sa-input-readonly"
                value="PENDING (Awaiting Approval)"
                readOnly
                aria-readonly="true"
              />
              <span className="m08-sa-field-hint">
                New adjustments always start as <code>PENDING</code>. Inventory
                quantities are only modified upon completion via Member 05&apos;s{' '}
                <code>sp_update_inventory</code> stored procedure.
              </span>
            </div>
          </div>

          {/* Card Footer matching Figma UI 19 */}
          <div className="m08-sa-form-footer">
            <p className="m08-sa-footer-note">
              All changes are subject to validation and role permissions.
            </p>

            <div className="m08-sa-footer-actions">
              <button
                type="button"
                className="m08-sa-btn-secondary"
                onClick={handleReset}
                disabled={isSubmitting}
              >
                Reset
              </button>
              {onCancel && (
                <button
                  type="button"
                  className="m08-sa-btn-secondary"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="m08-sa-btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
