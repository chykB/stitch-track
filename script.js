/**
 * StitchTrack - Tailor Clothing Order Tracker
 * Vanilla JavaScript application logic
 * 
 * Features:
 * - Reactive form validation with accessible inline error messages
 * - Safe DOM rendering with document.createElement and textContent
 * - Robust localStorage persistence with error handling
 * - Status updating and accessible deletion modal
 * - Delivery date ascending sorting
 * - Nigerian Naira (NGN) international currency formatting
 * - Accessible screen reader announcements and focus management
 */

'use strict';

// ============================================================================
// 1. Constants & Configuration
// ============================================================================

const STORAGE_KEY = 'stitchtrack_orders_v1';

const ORDER_STATUSES = ['Pending', 'In Progress', 'Ready', 'Delivered'];

// Nigerian Naira currency formatter
const nairaFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

// ============================================================================
// 2. Application State
// ============================================================================

const state = {
  orders: [],
  orderPendingDeletion: null,
};

// ============================================================================
// 3. DOM Element Selectors
// ============================================================================

const DOM = {
  // Form elements
  form: document.getElementById('order-form'),
  clientNameInput: document.getElementById('client-name'),
  clothingItemInput: document.getElementById('clothing-item'),
  agreedPriceInput: document.getElementById('agreed-price'),
  deliveryDateInput: document.getElementById('delivery-date'),
  orderStatusSelect: document.getElementById('order-status'),
  saveOrderBtn: document.getElementById('save-order-btn'),

  // Error containers
  clientNameError: document.getElementById('client-name-error'),
  clothingItemError: document.getElementById('clothing-item-error'),
  agreedPriceError: document.getElementById('agreed-price-error'),
  deliveryDateError: document.getElementById('delivery-date-error'),

  // Orders view elements
  ordersList: document.getElementById('orders-list'),
  emptyState: document.getElementById('empty-state'),
  ordersCountBadge: document.getElementById('orders-count'),

  // Accessible live announcer
  liveAnnouncer: document.getElementById('live-announcer'),

  // Delete modal dialog
  deleteOverlay: document.getElementById('delete-dialog-overlay'),
  deleteDialog: document.getElementById('delete-dialog'),
  deleteClientName: document.getElementById('delete-client-name'),
  dialogCancelBtn: document.getElementById('dialog-cancel-btn'),
  dialogConfirmBtn: document.getElementById('dialog-confirm-btn'),
};

// ============================================================================
// 4. Utility Functions
// ============================================================================

/**
 * Generate a collision-resistant unique ID for each order
 * @returns {string} Unique ID
 */
function generateUniqueId() {
  const timestamp = Date.now().toString(36);
  const randomSection = Math.random().toString(36).substring(2, 8);
  return `ord_${timestamp}_${randomSection}`;
}

/**
 * Format a positive number into Nigerian Naira string
 * @param {number} amount 
 * @returns {string} Formatted currency e.g. ₦45,000.00
 */
function formatNaira(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '₦0.00';
  }
  return nairaFormatter.format(amount);
}

/**
 * Format ISO date (YYYY-MM-DD) into user-friendly readable format
 * e.g. "2026-09-15" -> "15 Sep 2026"
 * @param {string} dateString 
 * @returns {string} Formatted date string
 */
function formatDisplayDate(dateString) {
  if (!dateString) return 'Date not specified';
  try {
    // Parse year, month, day directly to avoid timezone shift
    const [year, month, day] = dateString.split('-').map(Number);
    if (!year || !month || !day) return dateString;
    const dateObj = new Date(year, month - 1, day);
    return dateObj.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Announce messages to screen readers via aria-live region
 * @param {string} message 
 */
function announceToScreenReader(message) {
  if (!DOM.liveAnnouncer) return;
  DOM.liveAnnouncer.textContent = '';
  // Force a brief reflow so screen readers detect changes even if message repeats
  setTimeout(() => {
    DOM.liveAnnouncer.textContent = message;
  }, 50);
}

// ============================================================================
// 5. Form Validation & Error Management
// ============================================================================

/**
 * Set an error message on a specific form field
 * @param {HTMLInputElement|HTMLSelectElement} inputElement 
 * @param {HTMLElement} errorElement 
 * @param {string} message 
 */
function setFieldError(inputElement, errorElement, message) {
  if (!inputElement || !errorElement) return;
  inputElement.classList.add('is-invalid');
  inputElement.setAttribute('aria-invalid', 'true');
  errorElement.textContent = message;
  errorElement.classList.add('visible');
}

/**
 * Clear the error message on a specific form field
 * @param {HTMLInputElement|HTMLSelectElement} inputElement 
 * @param {HTMLElement} errorElement 
 */
function clearFieldError(inputElement, errorElement) {
  if (!inputElement || !errorElement) return;
  inputElement.classList.remove('is-invalid');
  inputElement.setAttribute('aria-invalid', 'false');
  errorElement.textContent = '';
  errorElement.classList.remove('visible');
}

/**
 * Clear all field errors in the form
 */
function clearAllErrors() {
  clearFieldError(DOM.clientNameInput, DOM.clientNameError);
  clearFieldError(DOM.clothingItemInput, DOM.clothingItemError);
  clearFieldError(DOM.agreedPriceInput, DOM.agreedPriceError);
  clearFieldError(DOM.deliveryDateInput, DOM.deliveryDateError);
}

/**
 * Validate the entire order form before creation
 * @returns {{ isValid: boolean, firstInvalidInput: HTMLElement|null }}
 */
function validateOrderForm() {
  let isValid = true;
  let firstInvalidInput = null;

  // 1. Client Name validation: must not be empty
  const clientName = DOM.clientNameInput.value.trim();
  if (!clientName) {
    setFieldError(DOM.clientNameInput, DOM.clientNameError, 'Please enter the client’s name.');
    isValid = false;
    if (!firstInvalidInput) firstInvalidInput = DOM.clientNameInput;
  } else {
    clearFieldError(DOM.clientNameInput, DOM.clientNameError);
  }

  // 2. Clothing Item validation: must not be empty
  const clothingItem = DOM.clothingItemInput.value.trim();
  if (!clothingItem) {
    setFieldError(DOM.clothingItemInput, DOM.clothingItemError, 'Please enter the clothing item description.');
    isValid = false;
    if (!firstInvalidInput) firstInvalidInput = DOM.clothingItemInput;
  } else {
    clearFieldError(DOM.clothingItemInput, DOM.clothingItemError);
  }

  // 3. Agreed Price validation: valid positive number
  const priceValue = DOM.agreedPriceInput.value.trim();
  const numericPrice = parseFloat(priceValue);
  if (!priceValue || isNaN(numericPrice) || numericPrice <= 0) {
    setFieldError(DOM.agreedPriceInput, DOM.agreedPriceError, 'Please enter a valid agreed price greater than 0.');
    isValid = false;
    if (!firstInvalidInput) firstInvalidInput = DOM.agreedPriceInput;
  } else {
    clearFieldError(DOM.agreedPriceInput, DOM.agreedPriceError);
  }

  // 4. Delivery Date validation: must be provided
  const deliveryDate = DOM.deliveryDateInput.value.trim();
  if (!deliveryDate) {
    setFieldError(DOM.deliveryDateInput, DOM.deliveryDateError, 'Please select an agreed delivery date.');
    isValid = false;
    if (!firstInvalidInput) firstInvalidInput = DOM.deliveryDateInput;
  } else {
    clearFieldError(DOM.deliveryDateInput, DOM.deliveryDateError);
  }

  return { isValid, firstInvalidInput };
}

/**
 * Set up real-time input event listeners to clear errors as user types
 */
function setupInputValidationListeners() {
  DOM.clientNameInput.addEventListener('input', () => {
    if (DOM.clientNameInput.value.trim().length > 0) {
      clearFieldError(DOM.clientNameInput, DOM.clientNameError);
    }
  });

  DOM.clothingItemInput.addEventListener('input', () => {
    if (DOM.clothingItemInput.value.trim().length > 0) {
      clearFieldError(DOM.clothingItemInput, DOM.clothingItemError);
    }
  });

  DOM.agreedPriceInput.addEventListener('input', () => {
    const val = parseFloat(DOM.agreedPriceInput.value.trim());
    if (!isNaN(val) && val > 0) {
      clearFieldError(DOM.agreedPriceInput, DOM.agreedPriceError);
    }
  });

  DOM.deliveryDateInput.addEventListener('input', () => {
    if (DOM.deliveryDateInput.value.trim().length > 0) {
      clearFieldError(DOM.deliveryDateInput, DOM.deliveryDateError);
    }
  });
}

// Placeholder for Stage 3 validation initialization
setupInputValidationListeners();
