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
  lastFocusedElementBeforeDialog: null,
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
  setTimeout(() => {
    DOM.liveAnnouncer.textContent = message;
  }, 50);
}

// ============================================================================
// 5. LocalStorage Storage Management
// ============================================================================

/**
 * Load orders from localStorage with defensive error handling
 * @returns {Array} List of validated order objects
 */
function loadOrdersFromStorage() {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (!rawData) {
      return [];
    }
    const parsed = JSON.parse(rawData);
    if (!Array.isArray(parsed)) {
      console.warn('StitchTrack: localStorage data was not an array. Resetting.');
      return [];
    }
    // Filter and sanitize valid order records
    return parsed.filter(item => (
      item &&
      typeof item.id === 'string' &&
      typeof item.clientName === 'string' &&
      typeof item.clothingItem === 'string' &&
      typeof item.agreedPrice === 'number' &&
      typeof item.deliveryDate === 'string' &&
      ORDER_STATUSES.includes(item.status)
    ));
  } catch (error) {
    console.error('StitchTrack: Failed to parse localStorage orders.', error);
    return [];
  }
}

/**
 * Persist current orders array to localStorage
 * @returns {boolean} True if saved successfully
 */
function saveOrdersToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.orders));
    return true;
  } catch (error) {
    console.error('StitchTrack: Unable to save orders to localStorage.', error);
    announceToScreenReader('Warning: Unable to save order changes to local storage.');
    return false;
  }
}

// ============================================================================
// 6. Ordering & Sorting Logic
// ============================================================================

/**
 * Sort orders array by delivery date in ascending order (closest first)
 */
function sortOrders() {
  state.orders.sort((a, b) => {
    // Primary: Delivery date ascending
    if (a.deliveryDate < b.deliveryDate) return -1;
    if (a.deliveryDate > b.deliveryDate) return 1;
    // Tiebreaker: Creation time ascending
    return (a.createdAt || 0) - (b.createdAt || 0);
  });
}

// ============================================================================
// 7. Form Validation & Error Management
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

// ============================================================================
// 8. Safe DOM Card Rendering
// ============================================================================

/**
 * Build a single order card DOM element safely without innerHTML for user strings
 * @param {Object} order 
 * @returns {HTMLLIElement} Order card element
 */
function createOrderCardElement(order) {
  const card = document.createElement('li');
  card.className = 'order-card';
  card.setAttribute('data-order-id', order.id);

  // 1. Header (Client Name, Clothing Item, Status Badge)
  const header = document.createElement('div');
  header.className = 'order-card-header';

  const titleGroup = document.createElement('div');
  
  const clientNameHeading = document.createElement('h3');
  clientNameHeading.className = 'order-client-name';
  clientNameHeading.textContent = order.clientName; // Safe textContent

  const clothingItemDesc = document.createElement('p');
  clothingItemDesc.className = 'order-clothing-item';
  clothingItemDesc.textContent = order.clothingItem; // Safe textContent

  titleGroup.appendChild(clientNameHeading);
  titleGroup.appendChild(clothingItemDesc);

  const statusBadge = document.createElement('span');
  statusBadge.className = 'status-badge';
  statusBadge.setAttribute('data-status', order.status);
  statusBadge.textContent = order.status; // Always display status as text

  header.appendChild(titleGroup);
  header.appendChild(statusBadge);

  // 2. Details Grid (Agreed Price & Delivery Date)
  const detailsGrid = document.createElement('div');
  detailsGrid.className = 'order-details-grid';

  // Price Detail Item
  const priceItem = document.createElement('div');
  priceItem.className = 'detail-item';
  
  const priceLabel = document.createElement('span');
  priceLabel.className = 'detail-label';
  priceLabel.textContent = 'Agreed Price';

  const priceValue = document.createElement('span');
  priceValue.className = 'detail-value price-value';
  priceValue.textContent = formatNaira(order.agreedPrice);

  priceItem.appendChild(priceLabel);
  priceItem.appendChild(priceValue);

  // Delivery Date Detail Item
  const dateItem = document.createElement('div');
  dateItem.className = 'detail-item';

  const dateLabel = document.createElement('span');
  dateLabel.className = 'detail-label';
  dateLabel.textContent = 'Delivery Date';

  const dateValue = document.createElement('span');
  dateValue.className = 'detail-value date-value';
  dateValue.textContent = formatDisplayDate(order.deliveryDate);

  dateItem.appendChild(dateLabel);
  dateItem.appendChild(dateValue);

  detailsGrid.appendChild(priceItem);
  detailsGrid.appendChild(dateItem);

  // 3. Actions Area (Status Changer & Delete Button)
  const actionsArea = document.createElement('div');
  actionsArea.className = 'order-card-actions';

  // Status changer control
  const statusChanger = document.createElement('div');
  statusChanger.className = 'card-status-changer';

  const statusSelectId = `status-select-${order.id}`;
  const statusLabel = document.createElement('label');
  statusLabel.className = 'card-status-label';
  statusLabel.htmlFor = statusSelectId;
  statusLabel.textContent = 'Update Status:';

  const statusSelect = document.createElement('select');
  statusSelect.className = 'card-status-select';
  statusSelect.id = statusSelectId;
  statusSelect.setAttribute('aria-label', `Change status for order by ${order.clientName}`);

  ORDER_STATUSES.forEach(statusOption => {
    const opt = document.createElement('option');
    opt.value = statusOption;
    opt.textContent = statusOption;
    if (statusOption === order.status) {
      opt.selected = true;
    }
    statusSelect.appendChild(opt);
  });

  statusSelect.addEventListener('change', (e) => {
    handleStatusChange(order.id, e.target.value);
  });

  statusChanger.appendChild(statusLabel);
  statusChanger.appendChild(statusSelect);

  // Bottom action bar with Delete button
  const bottomBar = document.createElement('div');
  bottomBar.className = 'card-bottom-bar';

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'btn btn-danger-ghost delete-order-btn';
  deleteBtn.setAttribute('aria-label', `Delete order for ${order.clientName}`);
  deleteBtn.textContent = 'Delete Order';

  deleteBtn.addEventListener('click', () => {
    promptDeleteOrder(order);
  });

  bottomBar.appendChild(deleteBtn);

  actionsArea.appendChild(statusChanger);
  actionsArea.appendChild(bottomBar);

  // Assemble Card
  card.appendChild(header);
  card.appendChild(detailsGrid);
  card.appendChild(actionsArea);

  return card;
}

/**
 * Render the entire orders collection to the DOM
 */
function renderOrders() {
  // Update count badge
  const total = state.orders.length;
  DOM.ordersCountBadge.textContent = total === 1 ? '1 Order' : `${total} Orders`;

  if (total === 0) {
    DOM.emptyState.removeAttribute('hidden');
    DOM.ordersList.setAttribute('hidden', '');
    DOM.ordersList.textContent = ''; // Clear child nodes safely
    return;
  }

  // Show orders list and hide empty state
  DOM.emptyState.setAttribute('hidden', '');
  DOM.ordersList.removeAttribute('hidden');

  // Clear existing items safely
  DOM.ordersList.textContent = '';

  // Render sorted cards
  state.orders.forEach(order => {
    const cardEl = createOrderCardElement(order);
    DOM.ordersList.appendChild(cardEl);
  });
}

// ============================================================================
// 9. Order Creation & Form Submission
// ============================================================================

/**
 * Handle new order form submission
 * @param {Event} event 
 */
function handleOrderFormSubmit(event) {
  event.preventDefault();

  const { isValid, firstInvalidInput } = validateOrderForm();

  if (!isValid) {
    if (firstInvalidInput) {
      firstInvalidInput.focus();
    }
    return;
  }

  // Extract sanitized values
  const clientName = DOM.clientNameInput.value.trim();
  const clothingItem = DOM.clothingItemInput.value.trim();
  const agreedPrice = parseFloat(DOM.agreedPriceInput.value.trim());
  const deliveryDate = DOM.deliveryDateInput.value.trim();
  const status = DOM.orderStatusSelect.value || 'Pending';

  const newOrder = {
    id: generateUniqueId(),
    clientName,
    clothingItem,
    agreedPrice,
    deliveryDate,
    status,
    createdAt: Date.now(),
  };

  // Add to state, sort, persist, and render
  state.orders.push(newOrder);
  sortOrders();
  saveOrdersToStorage();
  renderOrders();

  // Screen reader feedback
  announceToScreenReader(`Order for ${clientName} created successfully.`);

  // Reset form and return focus to first input
  DOM.form.reset();
  clearAllErrors();
  DOM.orderStatusSelect.value = 'Pending';
  DOM.clientNameInput.focus();
}

// ============================================================================
// 10. Status Update & Deletion Operations
// ============================================================================

/**
 * Update an order's status and persist changes
 * @param {string} orderId 
 * @param {string} newStatus 
 */
function handleStatusChange(orderId, newStatus) {
  const order = state.orders.find(o => o.id === orderId);
  if (!order) return;

  if (ORDER_STATUSES.includes(newStatus)) {
    order.status = newStatus;
    saveOrdersToStorage();
    renderOrders();
    announceToScreenReader(`Status for order by ${order.clientName} updated to ${newStatus}.`);
  }
}

/**
 * Open confirmation modal dialog for order deletion
 * @param {Object} order 
 */
function promptDeleteOrder(order) {
  state.orderPendingDeletion = order;
  state.lastFocusedElementBeforeDialog = document.activeElement;
  DOM.deleteClientName.textContent = order.clientName;
  DOM.deleteOverlay.removeAttribute('hidden');
  DOM.dialogCancelBtn.focus();
}

/**
 * Dismiss the delete confirmation dialog
 */
function dismissDeleteDialog() {
  state.orderPendingDeletion = null;
  DOM.deleteOverlay.setAttribute('hidden', '');
  DOM.deleteClientName.textContent = '';
  if (state.lastFocusedElementBeforeDialog && typeof state.lastFocusedElementBeforeDialog.focus === 'function') {
    state.lastFocusedElementBeforeDialog.focus();
  }
  state.lastFocusedElementBeforeDialog = null;
}

/**
 * Confirm and execute deletion of pending order
 */
function confirmDeleteOrder() {
  if (!state.orderPendingDeletion) {
    dismissDeleteDialog();
    return;
  }

  const clientName = state.orderPendingDeletion.clientName;
  const orderId = state.orderPendingDeletion.id;

  // Filter out the deleted order
  state.orders = state.orders.filter(o => o.id !== orderId);
  saveOrdersToStorage();
  renderOrders();

  state.orderPendingDeletion = null;
  state.lastFocusedElementBeforeDialog = null;
  DOM.deleteOverlay.setAttribute('hidden', '');
  DOM.deleteClientName.textContent = '';

  announceToScreenReader(`Order for ${clientName} has been deleted.`);
  
  // Set focus to the new order client name input for convenient next action
  DOM.clientNameInput.focus();
}

// ============================================================================
// 11. Modal Dialog Event Listeners & Keyboard Trapping
// ============================================================================

function setupDialogEventListeners() {
  DOM.dialogCancelBtn.addEventListener('click', dismissDeleteDialog);

  DOM.dialogConfirmBtn.addEventListener('click', confirmDeleteOrder);

  // Close dialog on overlay click outside card
  DOM.deleteOverlay.addEventListener('click', (e) => {
    if (e.target === DOM.deleteOverlay) {
      dismissDeleteDialog();
    }
  });

  // Close dialog on Escape key or manage Tab trapping
  document.addEventListener('keydown', (e) => {
    if (DOM.deleteOverlay.hasAttribute('hidden')) return;

    if (e.key === 'Escape') {
      dismissDeleteDialog();
    } else if (e.key === 'Tab') {
      const focusable = [DOM.dialogCancelBtn, DOM.dialogConfirmBtn];
      const firstFocusable = focusable[0];
      const lastFocusable = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable.focus();
      } else if (!e.shiftKey && document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable.focus();
      }
    }
  });
}

// ============================================================================
// 12. Application Initialization
// ============================================================================

function initApp() {
  // 1. Attach form listeners
  DOM.form.addEventListener('submit', handleOrderFormSubmit);
  setupInputValidationListeners();

  // 2. Attach dialog listeners
  setupDialogEventListeners();

  // 3. Load saved orders from storage
  state.orders = loadOrdersFromStorage();
  sortOrders();
  renderOrders();
}

// Initialize on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
