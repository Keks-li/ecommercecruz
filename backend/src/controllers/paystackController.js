import crypto from 'crypto';
import prisma from '../utils/prisma.js';
import cache from '../utils/cache.js';

// ── Helpers ─────────────────────────────────────────────────────────────────

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

/**
 * Derives payment status based on total required and amount paid.
 */
function derivePaymentStatus(totalRequired, amountPaid) {
  if (amountPaid <= 0) return 'PENDING';
  if (amountPaid >= totalRequired) return 'PAID';
  return 'PARTIALLY_PAID';
}

/**
 * Securely verifies the Paystack webhook signature using HMAC-SHA512
 * with timingSafeEqual to protect against timing attacks.
 */
export function verifyPaystackSignature(rawBody, signatureHeader) {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    console.error('[Paystack] PAYSTACK_SECRET_KEY is not set in environment.');
    return false;
  }
  if (!signatureHeader || !rawBody) {
    return false;
  }

  try {
    const computedHash = crypto
      .createHmac('sha512', secretKey)
      .update(rawBody)
      .digest('hex');

    const signatureBuffer = Buffer.from(signatureHeader, 'hex');
    const computedBuffer = Buffer.from(computedHash, 'hex');

    if (signatureBuffer.length !== computedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(signatureBuffer, computedBuffer);
  } catch (err) {
    console.error('[Paystack] Error during signature verification:', err);
    return false;
  }
}

/**
 * Shared atomic, idempotent transaction processor.
 * Safe against race conditions between webhook and client-side verification.
 */
export async function processSuccessfulPayment({
  reference,
  amountInPesewas,
  currency,
  orderId,
  channel,
  gatewayResponse,
  ipAddress,
  userId,
}) {
  if (!reference) throw new Error('Payment reference is required');

  if (currency && currency.toUpperCase() !== 'GHS') {
    throw new Error(`Unsupported currency: ${currency}. Only GHS is supported.`);
  }

  const paidAmount = Number(amountInPesewas) / 100;
  if (isNaN(paidAmount) || paidAmount <= 0) {
    throw new Error('Invalid payment amount');
  }

  // 1. Initial idempotency check
  const existingTx = await prisma.paymentTransaction.findFirst({
    where: { reference },
    include: {
      order: {
        include: {
          items: { include: { product: { select: { name: true, image_url: true, unique_code: true } } } },
          transactions: { orderBy: { created_at: 'desc' } },
        },
      },
    },
  });

  if (existingTx) {
    return { alreadyProcessed: true, order: existingTx.order, transaction: existingTx };
  }

  // 2. Validate order existence
  const parsedOrderId = parseInt(orderId, 10);
  if (isNaN(parsedOrderId)) {
    throw new Error(`Invalid order ID: ${orderId}`);
  }

  const targetOrder = await prisma.order.findUnique({
    where: { id: parsedOrderId },
  });

  if (!targetOrder) {
    throw new Error(`Order #${parsedOrderId} does not exist`);
  }

  // 3. Atomic database transaction with double-check inside
  const result = await prisma.$transaction(async (tx) => {
    // Double-check to prevent concurrent race condition between webhook & callback
    const concurrentTx = await tx.paymentTransaction.findFirst({
      where: { reference },
    });
    if (concurrentTx) {
      const refreshed = await tx.order.findUnique({
        where: { id: parsedOrderId },
        include: {
          items: { include: { product: { select: { name: true, image_url: true, unique_code: true } } } },
          transactions: { orderBy: { created_at: 'desc' } },
        },
      });
      return { alreadyProcessed: true, order: refreshed, transaction: concurrentTx };
    }

    // Refresh current order state inside transaction
    const currentOrder = await tx.order.findUnique({
      where: { id: parsedOrderId },
      include: { items: true },
    });
    const newAmountPaid = Number((currentOrder.amount_paid + paidAmount).toFixed(2));
    const effectiveTotal = Number((currentOrder.total_price + (currentOrder.penalty_amount || 0)).toFixed(2));
    const newPaymentStatus = derivePaymentStatus(effectiveTotal, newAmountPaid);

    // Update order
    const updatedOrder = await tx.order.update({
      where: { id: parsedOrderId },
      data: {
        amount_paid: newAmountPaid,
        payment_status: newPaymentStatus,
        status: currentOrder.status === 'PENDING' ? 'CONFIRMED' : currentOrder.status,
      },
      include: {
        items: { include: { product: { select: { name: true, image_url: true, unique_code: true } } } },
        transactions: { orderBy: { created_at: 'desc' } },
        cancellation: true,
      },
    });

    // Decrement stock ONLY when customer actually pays for the items (first payment received)
    if (currentOrder.amount_paid === 0 && Array.isArray(currentOrder.items)) {
      for (const item of currentOrder.items) {
        await tx.product.update({
          where: { id: item.product_id },
          data: { stock: { decrement: item.quantity } },
        });
      }
    }

    // Record PaymentTransaction
    const createdTransaction = await tx.paymentTransaction.create({
      data: {
        order_id: parsedOrderId,
        amount: paidAmount,
        payment_method: 'PAYSTACK',
        reference: reference,
        note: `Paystack online payment (${channel || 'online'}) - ${gatewayResponse || 'Successful'}`,
      },
    });

    // Record immutable AuditLog
    await tx.auditLog.create({
      data: {
        user_id: userId || currentOrder.user_id,
        action: 'PAYSTACK_PAYMENT_SUCCESS',
        entity: 'Order',
        entity_id: parsedOrderId,
        old_value: JSON.stringify({
          amountPaid: currentOrder.amount_paid,
          paymentStatus: currentOrder.payment_status,
        }),
        new_value: JSON.stringify({
          amountPaid: newAmountPaid,
          paymentStatus: newPaymentStatus,
          reference,
          channel: channel || 'online',
        }),
        ip_address: ipAddress || null,
      },
    });

    return {
      alreadyProcessed: false,
      order: updatedOrder,
      transaction: createdTransaction,
    };
  });

  if (!result.alreadyProcessed) {
    cache.invalidate('orders:');
    cache.invalidate('stats:');
    cache.invalidate('revenue:');
    cache.invalidate('products:');
  }

  return result;
}

// ── Controller Handlers ─────────────────────────────────────────────────────

/**
 * GET /api/paystack/public-key
 * Safely provides public key to frontend for Paystack inline script.
 * Never exposes the secret key.
 */
export const getPublicKey = async (req, res) => {
  return res.json({
    publicKey: process.env.PAYSTACK_PUBLIC_KEY || '',
    configured: Boolean(process.env.PAYSTACK_SECRET_KEY && process.env.PAYSTACK_PUBLIC_KEY),
  });
};

/**
 * POST /api/paystack/initialize-checkout
 * Validates stock and items, creates order with PENDING status,
 * and initializes Paystack transaction for checkout.
 */
export const initializeCheckoutPayment = async (req, res) => {
  try {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return res.status(503).json({
        error: 'Paystack is not configured. Please contact support or set PAYSTACK_SECRET_KEY in server environment.',
      });
    }

    const { items, pickup_region, pickup_district, pickup_city, amount_paid, email: bodyEmail } = req.body;
    const userId = req.user.id;

    // Resolve user email and phone reliably
    let userEmail = req.user.email || bodyEmail;
    let userPhone = req.body.phone;
    if (!userEmail || !userPhone) {
      const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, phone: true } });
      if (!userEmail) userEmail = dbUser?.email;
      if (!userPhone) userPhone = dbUser?.phone;
    }

    if (!userEmail) {
      return res.status(400).json({ error: 'Customer email address is required to initialize payment.' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    // 1. Fetch products & validate active status and stock
    const productIds = items.map((item) => Number(item.id));
    const dbProducts = await prisma.product.findMany({ where: { id: { in: productIds } } });
    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    const validatedItems = [];
    let totalPrice = 0;

    for (const item of items) {
      const dbProduct = productMap.get(Number(item.id));
      if (!dbProduct) {
        return res.status(404).json({ error: `Product with ID ${item.id} not found` });
      }
      if (dbProduct.status !== 'ACTIVE') {
        return res.status(400).json({ error: `Product '${dbProduct.name}' is currently unavailable` });
      }

      const qty = parseInt(item.qty, 10);
      if (isNaN(qty) || qty <= 0) {
        return res.status(400).json({ error: 'Quantity must be a positive integer' });
      }

      if (dbProduct.stock < qty) {
        return res.status(400).json({
          error: `Insufficient stock for '${dbProduct.name}'. Available: ${dbProduct.stock}, requested: ${qty}`,
        });
      }

      totalPrice += dbProduct.price * qty;
      validatedItems.push({
        product_id: dbProduct.id,
        quantity: qty,
        price: dbProduct.price,
      });
    }

    const parsedAmountPaid = parseFloat(amount_paid);
    if (isNaN(parsedAmountPaid) || parsedAmountPaid <= 0) {
      return res.status(400).json({ error: 'Payment amount must be greater than zero' });
    }
    if (parsedAmountPaid > totalPrice) {
      return res.status(400).json({ error: 'Payment amount cannot exceed the total order amount' });
    }

    // 2. Create Order in database (PENDING status, amount_paid: 0 until verified)
    // Decrement stock in atomic transaction (Rule 9)
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          user_id: userId,
          total_price: Number(totalPrice.toFixed(2)),
          amount_paid: 0,
          payment_status: 'PENDING',
          status: 'PENDING',
          pickup_region,
          pickup_district,
          pickup_city,
        },
      });

      await tx.orderItem.createMany({
        data: validatedItems.map((item) => ({
          order_id: newOrder.id,
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price,
        })),
      });

      return tx.order.findUnique({
        where: { id: newOrder.id },
        include: {
          items: { include: { product: { select: { name: true, image_url: true, unique_code: true } } } },
        },
      });
    });

    cache.invalidate('orders:');
    cache.invalidate('stats:');

    // 3. Initialize Paystack transaction
    const reference = `CRZ-INIT-${order.id}-${Date.now()}`;
    const amountInPesewas = Math.round(parsedAmountPaid * 100);

    const callbackUrl =
      process.env.PAYSTACK_CALLBACK_URL ||
      `${req.protocol}://${req.get('host')}/profile`;

    // Retrieve customer name and phone
    const dbCustomer = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, phone: true },
    });
    const customerFullName = (dbCustomer?.name || '').trim();
    const nameParts = customerFullName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || firstName;
    const finalPhone = dbCustomer?.phone || userPhone || '';

    const paystackPayload = {
      email: userEmail,
      amount: amountInPesewas,
      currency: 'GHS',
      reference,
      callback_url: `${callbackUrl}?reference=${reference}&order_id=${order.id}`,
      first_name: firstName || undefined,
      last_name: lastName || undefined,
      phone: finalPhone || undefined,
      metadata: {
        order_id: order.id,
        user_id: userId,
        phone: finalPhone || undefined,
        customer_name: customerFullName || undefined,
        payment_type: 'INITIAL',
        intended_amount: parsedAmountPaid,
        custom_fields: [
          ...(customerFullName ? [{
            display_name: 'Customer Name',
            variable_name: 'customer_name',
            value: customerFullName,
          }] : []),
          {
            display_name: 'Order Reference',
            variable_name: 'order_reference',
            value: `#CRZ-${order.id.toString().padStart(5, '0')}`,
          },
          {
            display_name: 'Customer ID',
            variable_name: 'customer_id',
            value: String(userId),
          },
          ...(finalPhone ? [{
            display_name: 'Mobile Money Number',
            variable_name: 'mobile_money_number',
            value: finalPhone,
          }] : []),
        ],
      },
      channels: ['card', 'mobile_money'],
    };

    const paystackResponse = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paystackPayload),
    });

    const paystackData = await paystackResponse.json();

    if (!paystackResponse.ok || !paystackData.status) {
      console.error('[Paystack] Initialize failed:', paystackData);
      return res.status(400).json({
        error: paystackData.message || 'Failed to initialize Paystack payment',
      });
    }

    // Write audit log for payment initiation
    await prisma.auditLog.create({
      data: {
        user_id: userId,
        action: 'PAYSTACK_CHECKOUT_INITIALIZED',
        entity: 'Order',
        entity_id: order.id,
        new_value: JSON.stringify({
          reference,
          amount: parsedAmountPaid,
          amountInPesewas,
        }),
        ip_address: req.ip || null,
      },
    });

    return res.status(201).json({
      order,
      paystack: {
        authorization_url: paystackData.data.authorization_url,
        access_code: paystackData.data.access_code,
        reference: paystackData.data.reference || reference,
      },
    });
  } catch (error) {
    console.error('[Paystack] Error in initializeCheckoutPayment:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * POST /api/paystack/orders/:id/initialize
 * Initializes balance installment payment for an existing order.
 */
export const initializeBalancePayment = async (req, res) => {
  try {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return res.status(503).json({
        error: 'Paystack is not configured. Please set PAYSTACK_SECRET_KEY in server environment.',
      });
    }

    const orderId = parseInt(req.params.id, 10);
    if (isNaN(orderId)) return res.status(400).json({ error: 'Invalid order ID' });

    const userId = req.user.id;
    const { amount, email: bodyEmail } = req.body;

    let userEmail = req.user.email || bodyEmail;
    if (!userEmail) {
      const dbUser = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
      userEmail = dbUser?.email;
    }

    if (!userEmail) {
      return res.status(400).json({ error: 'Customer email address is required to initialize payment.' });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Payment amount must be greater than zero' });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.user_id !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const effectiveTotal = order.total_price + (order.penalty_amount || 0);
    const outstanding = Number((effectiveTotal - order.amount_paid).toFixed(2));

    if (outstanding <= 0) {
      return res.status(400).json({ error: 'This order is already fully paid' });
    }
    if (parsedAmount > outstanding) {
      return res.status(400).json({
        error: `Payment amount (GH₵ ${parsedAmount.toFixed(2)}) exceeds outstanding balance of GH₵ ${outstanding.toFixed(2)}`,
      });
    }

    const reference = `CRZ-BAL-${order.id}-${Date.now()}`;
    const amountInPesewas = Math.round(parsedAmount * 100);

    const callbackUrl =
      process.env.PAYSTACK_CALLBACK_URL ||
      `${req.protocol}://${req.get('host')}/profile`;

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, phone: true },
    });
    const customerFullName = (dbUser?.name || '').trim();
    const nameParts = customerFullName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || firstName;
    const finalPhone = req.body.phone || dbUser?.phone || '';

    const paystackPayload = {
      email: userEmail,
      amount: amountInPesewas,
      currency: 'GHS',
      reference,
      callback_url: `${callbackUrl}?reference=${reference}&order_id=${order.id}`,
      first_name: firstName || undefined,
      last_name: lastName || undefined,
      phone: finalPhone || undefined,
      metadata: {
        order_id: order.id,
        user_id: userId,
        phone: finalPhone || undefined,
        customer_name: customerFullName || undefined,
        payment_type: 'BALANCE',
        intended_amount: parsedAmount,
        custom_fields: [
          ...(customerFullName ? [{
            display_name: 'Customer Name',
            variable_name: 'customer_name',
            value: customerFullName,
          }] : []),
          {
            display_name: 'Order Reference',
            variable_name: 'order_reference',
            value: `#CRZ-${order.id.toString().padStart(5, '0')}`,
          },
          ...(finalPhone ? [{
            display_name: 'Mobile Money Number',
            variable_name: 'mobile_money_number',
            value: finalPhone,
          }] : []),
        ],
      },
      channels: ['card', 'mobile_money'],
    };

    const paystackResponse = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paystackPayload),
    });

    const paystackData = await paystackResponse.json();

    if (!paystackResponse.ok || !paystackData.status) {
      console.error('[Paystack] Balance initialize failed:', paystackData);
      return res.status(400).json({
        error: paystackData.message || 'Failed to initialize Paystack payment',
      });
    }

    return res.json({
      authorization_url: paystackData.data.authorization_url,
      access_code: paystackData.data.access_code,
      reference: paystackData.data.reference || reference,
      amount: parsedAmount,
    });
  } catch (error) {
    console.error('[Paystack] Error in initializeBalancePayment:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * GET /api/paystack/verify/:reference
 * Verifies transaction with Paystack API and credits order idempotently.
 */
export const verifyPayment = async (req, res) => {
  try {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return res.status(503).json({ error: 'PAYSTACK_SECRET_KEY is not configured.' });
    }

    const { reference } = req.params;
    if (!reference) {
      return res.status(400).json({ error: 'Reference parameter is required' });
    }

    // Call Paystack verify API with secret key
    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    });

    const data = await response.json();

    if (!response.ok || !data.status) {
      return res.status(400).json({
        error: data.message || 'Failed to verify transaction with Paystack',
      });
    }

    const txData = data.data;

    // Verify transaction status
    if (txData.status !== 'success') {
      return res.status(400).json({
        error: `Transaction status is '${txData.status}': ${txData.gateway_response || 'Payment not completed'}`,
      });
    }

    // Verify currency
    if (txData.currency && txData.currency.toUpperCase() !== 'GHS') {
      return res.status(400).json({
        error: `Invalid currency: ${txData.currency}. Only GHS is supported.`,
      });
    }

    const orderId = txData.metadata?.order_id;
    if (!orderId) {
      return res.status(400).json({ error: 'Transaction metadata missing order_id' });
    }

    // Ensure requesting user is authorized to view/verify this order
    const targetOrder = await prisma.order.findUnique({ where: { id: Number(orderId) } });
    if (!targetOrder) {
      return res.status(404).json({ error: 'Associated order not found' });
    }

    if (req.user && req.user.role !== 'ADMIN' && targetOrder.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to verify this order payment' });
    }

    // Process idempotent credit
    const processResult = await processSuccessfulPayment({
      reference: txData.reference,
      amountInPesewas: txData.amount,
      currency: txData.currency,
      orderId: targetOrder.id,
      channel: txData.channel,
      gatewayResponse: txData.gateway_response,
      ipAddress: req.ip || txData.ip_address,
      userId: req.user?.id || targetOrder.user_id,
    });

    return res.json({
      success: true,
      message: processResult.alreadyProcessed ? 'Payment already processed' : 'Payment verified and recorded',
      order: processResult.order,
      transaction: processResult.transaction,
    });
  } catch (error) {
    console.error('[Paystack] Error in verifyPayment:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};

/**
 * POST /api/webhooks/paystack
 * Public endpoint for receiving Paystack webhooks with strict HMAC-SHA512 verification.
 */
export const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-paystack-signature'];
    if (!signature) {
      console.warn('[Paystack Webhook] Missing x-paystack-signature header');
      return res.status(400).send('Missing signature');
    }

    const isValid = verifyPaystackSignature(req.rawBody, signature);
    if (!isValid) {
      console.warn('[Paystack Webhook] Invalid signature received');
      return res.status(400).send('Invalid signature');
    }

    const event = req.body;
    if (!event || !event.event) {
      return res.status(400).send('Invalid event structure');
    }

    // Handle charge.success
    if (event.event === 'charge.success') {
      const data = event.data;
      const orderId = data.metadata?.order_id;

      if (!orderId) {
        console.warn('[Paystack Webhook] charge.success missing order_id in metadata, ref:', data.reference);
        return res.status(200).send('No order_id in metadata');
      }

      await processSuccessfulPayment({
        reference: data.reference,
        amountInPesewas: data.amount,
        currency: data.currency,
        orderId: orderId,
        channel: data.channel,
        gatewayResponse: data.gateway_response,
        ipAddress: data.ip_address,
        userId: data.metadata?.user_id || null,
      });

      console.log(`[Paystack Webhook] Successfully processed charge.success for ref ${data.reference}, order #${orderId}`);
    }

    // Always acknowledge with 200 OK
    return res.status(200).send('Webhook received');
  } catch (error) {
    console.error('[Paystack Webhook] Processing error:', error);
    // Respond 200 or 500 depending on idempotency; Paystack retries on non-2xx
    return res.status(500).send('Internal server error');
  }
};
