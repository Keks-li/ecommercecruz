import api from './api';

let cachedPublicKey = null;

/**
 * Retrieves the Paystack public key from backend or environment.
 */
export async function getPaystackPublicKey() {
  if (cachedPublicKey) return cachedPublicKey;

  // 1. Try env var first
  const envKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
  if (envKey && envKey.trim()) {
    cachedPublicKey = envKey.trim();
    return cachedPublicKey;
  }

  // 2. Fetch from backend endpoint
  try {
    const { data } = await api.get('/paystack/public-key');
    if (data?.publicKey) {
      cachedPublicKey = data.publicKey;
      return cachedPublicKey;
    }
  } catch (err) {
    console.warn('[Paystack] Could not retrieve public key from backend:', err.message);
  }

  return '';
}

/**
 * Initializes and triggers Paystack popup, with graceful fallback to hosted redirect.
 */
export async function payWithPaystack({
  email,
  amountInCedis,
  reference,
  accessCode,
  authorizationUrl,
  onSuccess,
  onClose,
  onError,
}) {
  try {
    const key = await getPaystackPublicKey();
    const amountInPesewas = Math.round(parseFloat(amountInCedis) * 100);

    // If PaystackPop is available in window and public key exists, use seamless inline popup
    if (typeof window !== 'undefined' && window.PaystackPop && key && key !== 'pk_test_placeholder_cruzaro_test_public_key') {
      const handler = window.PaystackPop.setup({
        key,
        email,
        amount: amountInPesewas,
        currency: 'GHS',
        ref: reference,
        ...(accessCode ? { access_code: accessCode } : {}),
        callback: function (response) {
          // Paystack payment approved
          onSuccess?.(response);
        },
        onClose: function () {
          // Customer closed payment modal
          onClose?.();
        },
      });

      handler.openIframe();
      return { mode: 'POPUP' };
    }

    // Fallback: If hosted checkout URL exists, redirect directly
    if (authorizationUrl && authorizationUrl.startsWith('http')) {
      window.location.href = authorizationUrl;
      return { mode: 'REDIRECT' };
    }

    // If neither works (e.g. placeholder keys in local environment)
    throw new Error('Paystack public key is not configured or inline script failed to load.');
  } catch (err) {
    console.error('[Paystack] Error opening checkout:', err);
    onError?.(err);
    throw err;
  }
}

/**
 * Calls backend to cryptographically and authoritatively verify the transaction.
 */
export async function verifyTransaction(reference) {
  const { data } = await api.get(`/paystack/verify/${encodeURIComponent(reference)}`);
  return data;
}
