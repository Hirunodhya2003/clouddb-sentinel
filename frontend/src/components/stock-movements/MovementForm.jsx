// Owner: Member 08
import React, { useState, useMemo, useEffect } from 'react';
import {
  IS_DEVELOPMENT_MOCK_MODE,
  API_ENDPOINTS,
  VALID_ADJUSTMENT_TYPES,
  ADJUSTMENT_TYPE_META,
  getSaleItemsForReturn,
} from '../../services/stockMovementService.js';

function generateSuggestedReference() {
  const randomSuffix = Math.floor(2105 + Math.random() * 890);
  return `ADJ-2026-${randomSuffix}`;
}

export function getCurrentLocalDateInput() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatCurrencyINR(amount) {
  const num = Number(amount);
  if (Number.isNaN(num)) return 'INR 0';
  return `INR ${num.toLocaleString('en-IN', {
    minimumFractionDigits: num % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Create Sales Return Form Component (Figma UI 21)
 * Conforms strictly to:
 *   - sales_returns (05_create_sales_returns_table.sql)
 *   - sales_return_items (06_create_sales_return_items_table.sql)
 *
 * IMPORTANT:
 *   - Calculates refund_subtotal = quantity * refund_unit_price for display ONLY.
 *   - Never stores or submits refund_subtotal in the payload because it is a
 *     MySQL GENERATED ALWAYS AS (quantity * refund_unit_price) STORED column.
 *   - Validates that the selected sale_item_id belongs to the selected sale_id
 *     and that quantity > 0 and quantity <= remaining_eligible_quantity.
 *   - Submits new returns in PENDING status only (development mock mode).
 */
function SalesReturnCreationForm({
  sales = [],
  isSalesLoading = false,
  salesError = null,
  onRetryLoadSales,
  onSubmitReturn,
  onCancel,
}) {
  const [selectedSaleId, setSelectedSaleId] = useState('');
  const [selectedSaleItemId, setSelectedSaleItemId] = useState('');
  const [returnDate, setReturnDate] = useState(() =>
    getCurrentLocalDateInput()
  );
  const [returnQuantity, setReturnQuantity] = useState('1');
  const [returnReason, setReturnReason] = useState('');
  const [notes, setNotes] = useState('');

  const [liveSaleItems, setLiveSaleItems] = useState(null);
  const [isItemsLoading, setIsItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState(null);

  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedSale = useMemo(() => {
    if (!selectedSaleId) return null;
    return sales.find((s) => Number(s.sale_id) === Number(selectedSaleId)) || null;
  }, [sales, selectedSaleId]);

  useEffect(() => {
    let isCancelled = false;

    if (!selectedSaleId || !selectedSale) {
      setLiveSaleItems(null);
      setIsItemsLoading(false);
      setItemsError(null);
      return () => {
        isCancelled = true;
      };
    }

    if (IS_DEVELOPMENT_MOCK_MODE) {
      setLiveSaleItems(null);
      setIsItemsLoading(false);
      setItemsError(null);
      return () => {
        isCancelled = true;
      };
    }

    // In LIVE API mode, fetch the actual line items for the selected sale from MySQL
    setIsItemsLoading(true);
    setItemsError(null);
    setLiveSaleItems(
      Array.isArray(selectedSale.items) ? selectedSale.items : null
    );

    getSaleItemsForReturn(Number(selectedSaleId))
      .then((res) => {
        if (!isCancelled) {
          setLiveSaleItems(Array.isArray(res.items) ? res.items : []);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          setItemsError(
            err instanceof Error
              ? err.message
              : 'Unable to load sale line items for the selected sale.'
          );
          setLiveSaleItems([]);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsItemsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [selectedSaleId, selectedSale]);

  const availableSaleItems = useMemo(() => {
    if (!selectedSale) return [];
    if (!IS_DEVELOPMENT_MOCK_MODE && Array.isArray(liveSaleItems)) {
      return liveSaleItems;
    }
    return Array.isArray(selectedSale.items) ? selectedSale.items : [];
  }, [selectedSale, liveSaleItems]);

  const selectedSaleItem = useMemo(() => {
    if (!selectedSaleItemId || !selectedSale) return null;
    return (
      availableSaleItems.find(
        (item) => Number(item.sale_item_id) === Number(selectedSaleItemId)
      ) || null
    );
  }, [availableSaleItems, selectedSale, selectedSaleItemId]);

  // Display-only preview of refund_subtotal = quantity * refund_unit_price
  const refundSubtotalPreview = useMemo(() => {
    if (!selectedSaleItem) return null;
    const qty = Number(returnQuantity);
    if (returnQuantity === '' || !Number.isInteger(qty) || qty <= 0) {
      return 0;
    }
    return Number((qty * Number(selectedSaleItem.unit_price)).toFixed(2));
  }, [selectedSaleItem, returnQuantity]);

  const handleSaleChange = (event) => {
    const nextSaleId = event.target.value;
    setSelectedSaleId(nextSaleId);
    setSelectedSaleItemId('');
    setReturnQuantity('1');
    setSubmitError(null);
    setItemsError(null);
    setFieldErrors((prev) => ({
      ...prev,
      sale_id: null,
      sale_item_id: null,
      quantity: null,
    }));
  };

  const handleSaleItemChange = (event) => {
    const nextItemId = event.target.value;
    setSelectedSaleItemId(nextItemId);
    setSubmitError(null);

    if (nextItemId && selectedSale) {
      const matchedItem = availableSaleItems.find(
        (i) => Number(i.sale_item_id) === Number(nextItemId)
      );
      if (matchedItem) {
        setReturnQuantity(
          matchedItem.remaining_eligible_quantity > 0 ? '1' : '0'
        );
      }
    }

    setFieldErrors((prev) => ({
      ...prev,
      sale_item_id: null,
      quantity: null,
    }));
  };

  const validateReturnForm = () => {
    const errors = {};
    const trimmedReason = returnReason.trim();

    if (!selectedSaleId || !selectedSale) {
      errors.sale_id = 'Please select an original completed sale.';
    }

    if (!selectedSaleItemId) {
      errors.sale_item_id =
        'Please select a sale item belonging to the selected sale.';
    } else if (!selectedSaleItem) {
      errors.sale_item_id =
        'Selected sale item does not belong to the chosen sale.';
    }

    if (!returnDate) {
      errors.return_date = 'Return date is required.';
    }

    const parsedQty = Number(returnQuantity);
    if (
      returnQuantity === '' ||
      !Number.isInteger(parsedQty) ||
      parsedQty <= 0
    ) {
      errors.quantity =
        'Return quantity must be a whole integer greater than 0 (chk_return_item_quantity).';
    } else if (
      selectedSaleItem &&
      parsedQty > selectedSaleItem.remaining_eligible_quantity
    ) {
      errors.quantity = `Cannot return ${parsedQty} units. Only ${selectedSaleItem.remaining_eligible_quantity} units remain eligible (Sold: ${selectedSaleItem.quantity}, Previously returned: ${selectedSaleItem.previously_returned_quantity}).`;
    }

    if (!trimmedReason) {
      errors.return_reason =
        'Return reason is required (chk_return_reason_not_empty).';
    } else if (trimmedReason.length > 255) {
      errors.return_reason =
        'Return reason cannot exceed 255 characters (VARCHAR(255)).';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleReset = () => {
    setSelectedSaleId('');
    setSelectedSaleItemId('');
    setReturnDate(getCurrentLocalDateInput());
    setReturnQuantity('1');
    setReturnReason('');
    setNotes('');
    setFieldErrors({});
    setSubmitError(null);
    setSubmitSuccess(null);
  };

  const isSaveLocked = Boolean(submitSuccess);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting || isSaveLocked) {
      return;
    }
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!validateReturnForm()) {
      setSubmitError(
        'Please correct the highlighted validation errors before saving.'
      );
      return;
    }

    // Build schema-compliant payload WITHOUT refund_subtotal
    // (refund_subtotal is GENERATED ALWAYS AS (quantity * refund_unit_price) STORED in MySQL)
    const payload = {
      sale_id: Number(selectedSaleId),
      return_date: `${returnDate}T12:00:00Z`,
      return_reason: returnReason.trim(),
      notes: notes.trim() || null,
      items: [
        {
          sale_item_id: Number(selectedSaleItemId),
          quantity: Number(returnQuantity),
          refund_unit_price: Number(selectedSaleItem.unit_price),
        },
      ],
    };

    setIsSubmitting(true);
    try {
      const response = await onSubmitReturn(payload);
      setSubmitSuccess({
        returnCode: response?.item?.return_code || `RET-${response?.item?.return_id}`,
        saleCode: response?.item?.sale_code || `SAL-${payload.sale_id}`,
        invoiceNumber: response?.item?.invoice_number,
        status: response?.item?.return_status || 'PENDING',
        totalRefund: response?.item?.total_refund_amount || 0,
        notice:
          response?.notice ||
          'Development mock submission only: Added as PENDING in local memory. No database save, inventory restoration (sp_update_inventory), stock_movements record, or financial refund was processed.',
      });
      setSelectedSaleItemId('');
      setReturnQuantity('1');
      setReturnReason('');
      setNotes('');
      setFieldErrors({});
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Unable to submit sales return.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="m08-sa-form-view">
      {/* Top Header matching Figma UI 21 */}
      <header className="m08-sa-header">
        <div className="m08-sa-title-group">
          <div className="m08-sa-title-row">
            <h1 id="m08-sr-form-title" className="m08-sa-title">
              Create Return
            </h1>
            {IS_DEVELOPMENT_MOCK_MODE && (
              <span
                className="m08-sa-mock-pill"
                title={`Development mock submission (${API_ENDPOINTS.CREATE_RETURN})`}
              >
                Dev Mock Mode · Local Pending Only
              </span>
            )}
          </div>
          <p className="m08-sa-subtitle">
            Register items returned against a sale
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
            form="m08-create-return-form"
            className="m08-sa-btn-primary"
            disabled={isSubmitting || isSaveLocked}
          >
            {isSubmitting ? 'Saving...' : 'Save changes'}
          </button>
        </div>
      </header>

      {/* Main White Card matching Figma UI 21 */}
      <div className="m08-sa-card">
        <div className="m08-sa-form-section-header">
          <h2 className="m08-sa-card-title">Basic information</h2>
          <p className="m08-sa-card-subtitle">
            Complete the information below. Fields marked required must be provided.
          </p>
        </div>

        {salesError && (
          <div className="m08-sa-alert m08-sa-alert-error" role="alert">
            <strong>Unable to load eligible sales from database:</strong>{' '}
            {salesError}
            {onRetryLoadSales && (
              <div style={{ marginTop: '10px' }}>
                <button
                  type="button"
                  className="m08-sa-btn-secondary"
                  onClick={onRetryLoadSales}
                >
                  Retry loading sales
                </button>
              </div>
            )}
          </div>
        )}

        {!isSalesLoading && !salesError && sales.length === 0 && (
          <div className="m08-sa-alert" role="status">
            <strong>No completed sales available:</strong> No COMPLETED sales
            were found in the database to register a return against.
          </div>
        )}

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
              {IS_DEVELOPMENT_MOCK_MODE
                ? 'Mock Sales Return Created:'
                : 'Sales Return Created (PENDING):'}{' '}
              {submitSuccess.returnCode} against {submitSuccess.saleCode} (
              {submitSuccess.invoiceNumber}) · Status: {submitSuccess.status} ·
              Refund: {formatCurrencyINR(submitSuccess.totalRefund)}
            </div>
            <p className="m08-sa-alert-text">{submitSuccess.notice}</p>
            <div
              style={{
                marginTop: '10px',
                display: 'flex',
                gap: '10px',
                flexWrap: 'wrap',
              }}
            >
              {onCancel && (
                <button
                  type="button"
                  className="m08-sa-btn-secondary"
                  onClick={onCancel}
                >
                  View in Sales Returns directory →
                </button>
              )}
              <button
                type="button"
                className="m08-sa-btn-secondary"
                onClick={handleReset}
              >
                + Create another return
              </button>
            </div>
          </div>
        )}

        <form
          id="m08-create-return-form"
          onSubmit={handleSubmit}
          noValidate
          aria-labelledby="m08-sr-form-title"
        >
          {/* 2-Column Grid matching Figma UI 21 */}
          <div className="m08-sa-form-grid">
            {/* Slot 1 (Top Left): Reference / Name (Original Sale) */}
            <div className="m08-sa-field">
              <label htmlFor="m08-ret-sale" className="m08-sa-label">
                Reference / Name (Original Sale) <span aria-hidden="true">*</span>
              </label>
              <select
                id="m08-ret-sale"
                className={`m08-sa-input ${fieldErrors.sale_id ? 'm08-sa-input-error' : ''
                  }`}
                value={selectedSaleId}
                onChange={handleSaleChange}
                disabled={
                  isSubmitting ||
                  isSaveLocked ||
                  isSalesLoading ||
                  Boolean(salesError) ||
                  sales.length === 0
                }
                required
              >
                <option value="">
                  {isSalesLoading
                    ? 'Loading completed sales from database...'
                    : salesError
                      ? 'Unable to load sales'
                      : sales.length === 0
                        ? 'No completed sales available'
                        : 'Enter details / Select original sale'}
                </option>
                {sales.map((sale) => (
                  <option key={sale.sale_id} value={sale.sale_id}>
                    SAL-{sale.sale_id} · {sale.invoice_number} —{' '}
                    {sale.customer_name} ({sale.sale_label || 'Completed sale'})
                  </option>
                ))}
              </select>
              {selectedSale && (
                <span className="m08-sa-field-hint">
                  Invoice: <strong>{selectedSale.invoice_number}</strong> ·
                  Customer: {selectedSale.customer_name} · Sale Total:{' '}
                  {formatCurrencyINR(selectedSale.total_amount)}
                </span>
              )}
              {fieldErrors.sale_id && (
                <span className="m08-sa-field-error" role="alert">
                  {fieldErrors.sale_id}
                </span>
              )}
            </div>

            {/* Slot 2 (Top Right): Related record (Sale Line Item) */}
            <div className="m08-sa-field">
              <label htmlFor="m08-ret-sale-item" className="m08-sa-label">
                Related record (Sale Line Item) <span aria-hidden="true">*</span>
              </label>
              <select
                id="m08-ret-sale-item"
                className={`m08-sa-input ${fieldErrors.sale_item_id ? 'm08-sa-input-error' : ''
                  }`}
                value={selectedSaleItemId}
                onChange={handleSaleItemChange}
                disabled={
                  isSubmitting ||
                  isSaveLocked ||
                  !selectedSale ||
                  isSalesLoading ||
                  isItemsLoading ||
                  Boolean(itemsError)
                }
                required
              >
                <option value="">
                  {!selectedSale
                    ? 'Select an original sale first'
                    : isItemsLoading && availableSaleItems.length === 0
                      ? 'Loading sale line items...'
                      : itemsError
                        ? 'Unable to load sale line items'
                        : availableSaleItems.length === 0
                          ? 'No line items found for selected sale'
                          : 'Select an option'}
                </option>
                {availableSaleItems.map((item) => (
                  <option key={item.sale_item_id} value={item.sale_item_id}>
                    {item.sku} · {item.product_name} ({item.size_name} /{' '}
                    {item.colour_name}) — Sold: {item.quantity}, Returned:{' '}
                    {item.previously_returned_quantity}, Eligible:{' '}
                    {item.remaining_eligible_quantity}
                  </option>
                ))}
              </select>
              {itemsError && (
                <span className="m08-sa-field-error" role="alert">
                  {itemsError}
                </span>
              )}
              {selectedSaleItem && (
                <span className="m08-sa-field-hint">
                  Sale Item #{selectedSaleItem.sale_item_id} · Variant #
                  {selectedSaleItem.variant_id} · Sold:{' '}
                  <strong>{selectedSaleItem.quantity} units</strong> · Previously
                  Returned: <strong>{selectedSaleItem.previously_returned_quantity} units</strong> ·
                  Remaining Eligible:{' '}
                  <strong>
                    {selectedSaleItem.remaining_eligible_quantity} units
                  </strong>
                </span>
              )}
              {fieldErrors.sale_item_id && (
                <span className="m08-sa-field-error" role="alert">
                  {fieldErrors.sale_item_id}
                </span>
              )}
            </div>

            {/* Slot 3 (Middle Left): Date */}
            <div className="m08-sa-field">
              <label htmlFor="m08-ret-date" className="m08-sa-label">
                Date <span aria-hidden="true">*</span>
              </label>
              <input
                id="m08-ret-date"
                type="date"
                className={`m08-sa-input ${fieldErrors.return_date ? 'm08-sa-input-error' : ''
                  }`}
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                disabled={isSubmitting || isSaveLocked}
                required
              />
              {fieldErrors.return_date && (
                <span className="m08-sa-field-error" role="alert">
                  {fieldErrors.return_date}
                </span>
              )}
            </div>

            {/* Slot 4 (Middle Right): Quantity / Amount */}
            <div className="m08-sa-field">
              <div className="m08-sa-subgrid-3">
                <div>
                  <label htmlFor="m08-ret-qty" className="m08-sa-label">
                    Quantity <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="m08-ret-qty"
                    type="number"
                    min="1"
                    max={selectedSaleItem?.remaining_eligible_quantity ?? undefined}
                    step="1"
                    className={`m08-sa-input ${fieldErrors.quantity ? 'm08-sa-input-error' : ''
                      }`}
                    placeholder="0"
                    value={returnQuantity}
                    onChange={(e) => {
                      setReturnQuantity(e.target.value);
                      if (fieldErrors.quantity) {
                        setFieldErrors((prev) => ({ ...prev, quantity: null }));
                      }
                    }}
                    disabled={isSubmitting || isSaveLocked}
                    required
                  />
                </div>

                <div>
                  <span className="m08-sa-label">Refund Unit Price</span>
                  <div className="m08-sa-input m08-sa-input-readonly">
                    {selectedSaleItem
                      ? formatCurrencyINR(selectedSaleItem.unit_price)
                      : 'INR 0'}
                  </div>
                </div>

                <div>
                  <span className="m08-sa-label">
                    Refund Subtotal (Display)
                  </span>
                  <div
                    className="m08-sa-input m08-sa-input-readonly"
                    aria-live="polite"
                    title="MySQL GENERATED ALWAYS AS (quantity * refund_unit_price) STORED. Calculated for display only; not submitted."
                  >
                    {refundSubtotalPreview === null
                      ? 'INR 0'
                      : formatCurrencyINR(refundSubtotalPreview)}
                  </div>
                </div>
              </div>
              {fieldErrors.quantity && (
                <span className="m08-sa-field-error" role="alert">
                  {fieldErrors.quantity}
                </span>
              )}
              <span className="m08-sa-field-hint">
                <code>refund_subtotal</code> is calculated as{' '}
                <code>quantity * refund_unit_price</code> for display only and is
                never manually stored or submitted.
              </span>
            </div>

            {/* Slot 5 (Bottom Left): Description (return_reason & optional notes) */}
            <div className="m08-sa-field">
              <label htmlFor="m08-ret-reason" className="m08-sa-label">
                Description (Return Reason) <span aria-hidden="true">*</span>
              </label>
              <input
                id="m08-ret-reason"
                type="text"
                maxLength={255}
                className={`m08-sa-input ${fieldErrors.return_reason ? 'm08-sa-input-error' : ''
                  }`}
                placeholder="Enter details (required return reason, max 255 chars)"
                value={returnReason}
                onChange={(e) => {
                  setReturnReason(e.target.value);
                  if (fieldErrors.return_reason) {
                    setFieldErrors((prev) => ({
                      ...prev,
                      return_reason: null,
                    }));
                  }
                }}
                disabled={isSubmitting || isSaveLocked}
                required
              />
              {fieldErrors.return_reason && (
                <span className="m08-sa-field-error" role="alert">
                  {fieldErrors.return_reason}
                </span>
              )}

              <div style={{ marginTop: '12px' }}>
                <label htmlFor="m08-ret-notes" className="m08-sa-label">
                  Inspection / Operational Notes (Optional)
                </label>
                <input
                  id="m08-ret-notes"
                  type="text"
                  className="m08-sa-input"
                  placeholder="Optional inspection notes (sales_returns.notes)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isSubmitting || isSaveLocked}
                />
              </div>
            </div>

            {/* Slot 6 (Bottom Right): Status */}
            <div className="m08-sa-field">
              <label htmlFor="m08-ret-status" className="m08-sa-label">
                Status
              </label>
              <input
                id="m08-ret-status"
                type="text"
                className="m08-sa-input m08-sa-input-readonly"
                value="PENDING (Awaiting Approval)"
                readOnly
                aria-readonly="true"
              />
              <span className="m08-sa-field-hint">
                New returns always start as <code>PENDING</code>. Stock
                restoration into inventory occurs only upon approved completion
                via Member 05&apos;s <code>sp_update_inventory</code> stored
                procedure.
              </span>
            </div>
          </div>

          {/* Card Footer matching Figma UI 21 */}
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
                disabled={isSubmitting || isSaveLocked}
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
export default function MovementForm(props) {
  const {
    mode = 'adjustment',
    variants = [],
    isVariantsLoading = false,
    variantsError = null,
    onRetryLoadVariants,
    existingReferences = [],
    onSubmitAdjustment,
    onCancel,
  } = props;

  if (mode === 'return') {
    return <SalesReturnCreationForm {...props} />;
  }
  const [adjustmentReference, setAdjustmentReference] = useState('ADJ-2026-2105');
  const [adjustmentDate, setAdjustmentDate] = useState(() =>
    getCurrentLocalDateInput()
  );
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
    return (
      variants.find((v) => Number(v.variant_id) === Number(variantId)) || null
    );
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
      const matched = variants.find(
        (v) => Number(v.variant_id) === Number(nextVariantId)
      );
      if (matched && typeof matched.current_quantity_on_hand === 'number') {
        setQuantityBefore(String(matched.current_quantity_on_hand));
        setQuantityAfter(String(matched.current_quantity_on_hand));
      } else {
        setQuantityBefore('0');
        setQuantityAfter('0');
      }
    } else {
      setQuantityBefore('0');
      setQuantityAfter('0');
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
    setAdjustmentDate(getCurrentLocalDateInput());
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

  const isSaveLocked = Boolean(submitSuccess);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSubmitting || isSaveLocked) {
      return;
    }
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
      created_by: IS_DEVELOPMENT_MOCK_MODE ? 4 : null,
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
            disabled={isSubmitting || isSaveLocked}
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

        {variantsError && (
          <div className="m08-sa-alert m08-sa-alert-error" role="alert">
            <strong>Unable to load product variants from database:</strong>{' '}
            {variantsError}
            {onRetryLoadVariants && (
              <div style={{ marginTop: '10px' }}>
                <button
                  type="button"
                  className="m08-sa-btn-secondary"
                  onClick={onRetryLoadVariants}
                >
                  Retry loading product variants
                </button>
              </div>
            )}
          </div>
        )}

        {!isVariantsLoading && !variantsError && variants.length === 0 && (
          <div className="m08-sa-alert" role="status">
            <strong>No product variants available:</strong> No product variants
            were found in the database to create a stock adjustment for.
          </div>
        )}

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
              {IS_DEVELOPMENT_MOCK_MODE
                ? 'Mock Adjustment Created:'
                : 'Stock Adjustment Created (PENDING):'}{' '}
              {submitSuccess.reference} (Status: {submitSuccess.status})
            </div>
            <p className="m08-sa-alert-text">{submitSuccess.notice}</p>
            <div
              style={{
                marginTop: '10px',
                display: 'flex',
                gap: '10px',
                flexWrap: 'wrap',
              }}
            >
              {onCancel && (
                <button
                  type="button"
                  className="m08-sa-btn-secondary"
                  onClick={onCancel}
                >
                  View in Stock Adjustments directory →
                </button>
              )}
              <button
                type="button"
                className="m08-sa-btn-secondary"
                onClick={handleReset}
              >
                + Create another adjustment
              </button>
            </div>
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
                  disabled={isSubmitting || isSaveLocked}
                  onClick={() => {
                    if (isSubmitting || isSaveLocked) return;
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
                className={`m08-sa-input ${fieldErrors.adjustment_reference ? 'm08-sa-input-error' : ''
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
                disabled={isSubmitting || isSaveLocked}
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
                className={`m08-sa-input ${fieldErrors.variant_id ? 'm08-sa-input-error' : ''
                  }`}
                value={variantId}
                onChange={handleVariantChange}
                disabled={
                  isSubmitting ||
                  isSaveLocked ||
                  isVariantsLoading ||
                  Boolean(variantsError) ||
                  variants.length === 0
                }
                required
              >
                <option value="">
                  {isVariantsLoading
                    ? 'Loading product variants from database...'
                    : variantsError
                      ? 'Unable to load product variants'
                      : variants.length === 0
                        ? 'No product variants available'
                        : 'Select an option'}
                </option>
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
                    className={`m08-sa-input ${fieldErrors.adjustment_date ? 'm08-sa-input-error' : ''
                      }`}
                    value={adjustmentDate}
                    onChange={(e) => setAdjustmentDate(e.target.value)}
                    disabled={isSubmitting || isSaveLocked}
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
                    className={`m08-sa-input ${fieldErrors.adjustment_type ? 'm08-sa-input-error' : ''
                      }`}
                    value={adjustmentType}
                    onChange={(e) => setAdjustmentType(e.target.value)}
                    disabled={isSubmitting || isSaveLocked}
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
                    className={`m08-sa-input ${fieldErrors.quantity_before ? 'm08-sa-input-error' : ''
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
                    disabled={isSubmitting || isSaveLocked}
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
                    className={`m08-sa-input ${fieldErrors.quantity_after ? 'm08-sa-input-error' : ''
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
                    disabled={isSubmitting || isSaveLocked}
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
                      : `${quantityDifferencePreview > 0 ? '+' : ''
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
                className={`m08-sa-input ${fieldErrors.reason ? 'm08-sa-input-error' : ''
                  }`}
                placeholder="Enter details (required adjustment reason)"
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (fieldErrors.reason) {
                    setFieldErrors((prev) => ({ ...prev, reason: null }));
                  }
                }}
                disabled={isSubmitting || isSaveLocked}
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
                  className={`m08-sa-input ${fieldErrors.item_reason ? 'm08-sa-input-error' : ''
                    }`}
                  placeholder="Optional item-specific note (stock_adjustment_items.item_reason)"
                  value={itemReason}
                  onChange={(e) => setItemReason(e.target.value)}
                  disabled={isSubmitting || isSaveLocked}
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
                disabled={isSubmitting || isSaveLocked}
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
