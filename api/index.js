const fs = require('fs');
const path = require('path');

const ADMIN_PIN = process.env.ADMIN_PIN || '841428';
const STUDIO_WHATSAPP = process.env.STUDIO_WHATSAPP || '919431000000';
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';

// On Vercel serverless, /tmp is writable across warm invocations
const TMP_ORDERS_FILE = '/tmp/darpan_orders.json';
const SEED_ORDERS_FILE = path.join(process.cwd(), 'orders.json');

function readOrders() {
  try {
    if (fs.existsSync(TMP_ORDERS_FILE)) {
      return JSON.parse(fs.readFileSync(TMP_ORDERS_FILE, 'utf8'));
    }
    if (fs.existsSync(SEED_ORDERS_FILE)) {
      return JSON.parse(fs.readFileSync(SEED_ORDERS_FILE, 'utf8'));
    }
    return [];
  } catch (_) {
    return [];
  }
}

function writeOrders(orders) {
  try {
    fs.writeFileSync(TMP_ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8');
  } catch (_) {}
}

module.exports = async (req, res) => {
  const parsedUrl = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  if (pathname === '/api/health' && req.method === 'GET') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ status: 'ok', service: 'Darpan Framing Studio (Vercel)' }));
    return;
  }

  if (pathname === '/api/config' && req.method === 'GET') {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(
      JSON.stringify({
        studioWhatsApp: STUDIO_WHATSAPP,
        razorpayKeyId: RAZORPAY_KEY_ID
      })
    );
    return;
  }

  if (pathname === '/api/upload' && req.method === 'POST') {
    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
    const dataUrl = body.dataUrl || '';
    const origName = (body.fileName || 'photo.jpg').replace(/[^a-zA-Z0-9._-]/g, '_');

    if (!/^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/i.test(dataUrl)) {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ ok: false, error: 'Unsupported image format' }));
      return;
    }

    res.statusCode = 201;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(
      JSON.stringify({
        ok: true,
        url: dataUrl,
        fileName: `PHOTO-${Date.now()}-${origName.slice(-24)}`
      })
    );
    return;
  }

  if (pathname === '/api/orders') {
    if (req.method === 'GET') {
      const providedPin = req.headers['x-admin-pin'] || parsedUrl.searchParams.get('pin') || '';
      if (providedPin !== ADMIN_PIN) {
        res.statusCode = 401;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: false, error: 'Unauthorized. Valid Studio Admin PIN required.' }));
        return;
      }
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ ok: true, orders: readOrders() }));
      return;
    }

    if (req.method === 'POST') {
      const order = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
      if (!order.paymentId) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify({ ok: false, error: 'Payment verification required before confirming order.' }));
        return;
      }
      const orders = readOrders();
      orders.unshift(order);
      writeOrders(orders);
      res.statusCode = 201;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ ok: true, orderId: order.orderId }));
      return;
    }
  }

  res.statusCode = 404;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({ ok: false, error: 'Not Found' }));
};
