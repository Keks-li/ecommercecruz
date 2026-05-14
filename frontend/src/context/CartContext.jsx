import { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import api from '../services/api';

// ─── Storage helpers ──────────────────────────────────────────────────────────
const STORAGE_KEY = 'cruzaro_cart';

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

// ─── Reducer ──────────────────────────────────────────────────────────────────
function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      const exists = state.items.find((i) => i.id === action.product.id);
      const updatedItems = exists
        ? state.items.map((i) =>
            i.id === action.product.id ? { ...i, qty: i.qty + 1 } : i
          )
        : [...state.items, { ...action.product, qty: 1 }];
      saveCart(updatedItems);
      return { ...state, items: updatedItems };
    }

    case 'REMOVE_ITEM': {
      const updatedItems = state.items.filter((i) => i.id !== action.id);
      saveCart(updatedItems);
      return { ...state, items: updatedItems };
    }

    case 'UPDATE_QTY': {
      const updatedItems = state.items
        .map((i) => (i.id === action.id ? { ...i, qty: action.qty } : i))
        .filter((i) => i.qty > 0);
      saveCart(updatedItems);
      return { ...state, items: updatedItems };
    }

    case 'CLEAR':
      saveCart([]);
      return { ...state, items: [] };

    case 'SET_SUSPENDED':
      // Replace items list after removing suspended products; surface warnings
      saveCart(action.items);
      return { ...state, items: action.items, suspendedWarnings: action.warnings };

    case 'CLEAR_WARNINGS':
      return { ...state, suspendedWarnings: [] };

    case 'SET_VALIDATING':
      return { ...state, validating: action.value };

    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: loadCart(),
    suspendedWarnings: [],  // [{ id, name }] products removed because they were suspended
    validating: false,
  });

  // Total item count for badge
  const totalItems = state.items.reduce((sum, i) => sum + i.qty, 0);

  // Total price
  const totalPrice = state.items.reduce((sum, i) => sum + i.price * i.qty, 0);

  const addItem = useCallback((product) => {
    dispatch({ type: 'ADD_ITEM', product });
  }, []);

  const removeItem = useCallback((id) => {
    dispatch({ type: 'REMOVE_ITEM', id });
  }, []);

  const updateQty = useCallback((id, qty) => {
    dispatch({ type: 'UPDATE_QTY', id, qty });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR' });
  }, []);

  const clearWarnings = useCallback(() => {
    dispatch({ type: 'CLEAR_WARNINGS' });
  }, []);

  /**
   * validateCart — called when the user opens the cart drawer/page.
   * Hits POST /api/products/validate-cart with current item IDs.
   * Any items that are now SUSPENDED are removed and surfaced as warnings.
   */
  const validateCart = useCallback(async () => {
    if (state.items.length === 0) return;

    dispatch({ type: 'SET_VALIDATING', value: true });
    try {
      const ids = state.items.map((i) => i.id);
      const { data } = await api.post('/products/validate-cart', { ids });

      // Build a map of id → current status from the API response
      const statusMap = Object.fromEntries(data.map((p) => [p.id, p.status]));

      const warnings = [];
      const activeItems = state.items.filter((item) => {
        const currentStatus = statusMap[item.id];
        // If the product is missing from DB or is SUSPENDED, flag it
        if (!currentStatus || currentStatus === 'SUSPENDED') {
          warnings.push({ id: item.id, name: item.name });
          return false;
        }
        return true;
      });

      dispatch({ type: 'SET_SUSPENDED', items: activeItems, warnings });
    } catch (err) {
      console.error('Cart validation failed:', err);
    } finally {
      dispatch({ type: 'SET_VALIDATING', value: false });
    }
  }, [state.items]);

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        suspendedWarnings: state.suspendedWarnings,
        validating: state.validating,
        totalItems,
        totalPrice,
        addItem,
        removeItem,
        updateQty,
        clearCart,
        clearWarnings,
        validateCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
