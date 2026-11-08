const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;
const ORDERS_FILE = path.join(__dirname, 'orders.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Studio configuration (override via environment variables in production)
const ADMIN_PIN = process.env.ADMIN_PIN || '841428';
const STUDIO_WHATSAPP = process.env.STUDIO_WHATSAPP || '919431000000';
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function readOrders() {
  try {
    if (!fs.existsSync(ORDERS_FILE)) return [];
    return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
  } catch (_) {
    return [];
  }
}

function writeOrders(orders) {
  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8');
}

function collectRequestBody(req, maxBytes = 25 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > maxBytes) {
        req.socket.destroy();
        reject(new Error('Payload too large'));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Private-Network': 'true'
    });
    res.end();
    return;
  }

  // 0. Vercel Deployment Payload Helper (for instant local-to-browser deployment)
  if (parsedUrl.pathname === '/api/vercel-payload' && req.method === 'GET') {
    const assetPairs = [
      ['vercel.json', 'vercel.json'],
      ['api/index.js', 'api/index.js'],
      ['admin.html', 'admin.html'],
      ['index.html', 'v2/index.html'],
      ['styles.css', 'v2/styles.css'],
      ['app.js', 'v2/app.js'],
      ['v2/index.html', 'v2/index.html'],
      ['v2/styles.css', 'v2/styles.css'],
      ['v2/app.js', 'v2/app.js'],
      ['usps/usp-exploded-layers.jpg', 'v2/usps/usp-exploded-layers.jpg'],
      ['usps/usp-mount-dropshield.jpg', 'v2/usps/usp-mount-dropshield.jpg'],
      ['usps/usp-optical-acrylic.jpg', 'v2/usps/usp-optical-acrylic.jpg'],
      ['usps/usp-silver-halide-lab.jpg', 'v2/usps/usp-silver-halide-lab.jpg'],
      ['v2/usps/usp-exploded-layers.jpg', 'v2/usps/usp-exploded-layers.jpg'],
      ['v2/usps/usp-mount-dropshield.jpg', 'v2/usps/usp-mount-dropshield.jpg'],
      ['v2/usps/usp-optical-acrylic.jpg', 'v2/usps/usp-optical-acrylic.jpg'],
      ['v2/usps/usp-silver-halide-lab.jpg', 'v2/usps/usp-silver-halide-lab.jpg'],
      ['walls/indian-bedroom-trio-teak.jpg', 'v2/walls/indian-bedroom-trio-teak.jpg'],
      ['walls/indian-festive-trio-gold.jpg', 'v2/walls/indian-festive-trio-gold.jpg'],
      ['walls/indian-hallway-6-teak.jpg', 'v2/walls/indian-hallway-6-teak.jpg'],
      ['walls/indian-living-sofa-6-black.jpg', 'v2/walls/indian-living-sofa-6-black.jpg'],
      ['walls/indian-parents-16x24-walnut.jpg', 'v2/walls/indian-parents-16x24-walnut.jpg'],
      ['walls/indian-study-diwan-6-white.jpg', 'v2/walls/indian-study-diwan-6-white.jpg'],
      ['v2/walls/indian-bedroom-trio-teak.jpg', 'v2/walls/indian-bedroom-trio-teak.jpg'],
      ['v2/walls/indian-festive-trio-gold.jpg', 'v2/walls/indian-festive-trio-gold.jpg'],
      ['v2/walls/indian-hallway-6-teak.jpg', 'v2/walls/indian-hallway-6-teak.jpg'],
      ['v2/walls/indian-living-sofa-6-black.jpg', 'v2/walls/indian-living-sofa-6-black.jpg'],
      ['v2/walls/indian-parents-16x24-walnut.jpg', 'v2/walls/indian-parents-16x24-walnut.jpg'],
      ['v2/walls/indian-study-diwan-6-white.jpg', 'v2/walls/indian-study-diwan-6-white.jpg']
    ];
    const files = assetPairs.map(([destFile, diskRel]) => ({
      file: destFile,
      data: fs.readFileSync(path.join(__dirname, diskRel)).toString('base64'),
      encoding: 'base64'
    }));
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Private-Network': 'true'
    });
    res.end(JSON.stringify({
      name: 'darpan-framing-studio',
      project: 'prj_XygvfeEmeaB8G0ox15YgEnHynTsf',
      target: 'production',
      projectSettings: { framework: null },
      files
    }));
    return;
  }

  // 1. Healthcheck API
  if (parsedUrl.pathname === '/api/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ status: 'ok', service: 'Darpan Framing Studio', port: PORT }));
    return;
  }

  // 2. Public Client Config API
  if (parsedUrl.pathname === '/api/config' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(
      JSON.stringify({
        studioWhatsApp: STUDIO_WHATSAPP,
        razorpayKeyId: RAZORPAY_KEY_ID
      })
    );
    return;
  }

  // 3. Customer Photo Upload API (Saves real customer image files to ./uploads/)
  if (parsedUrl.pathname === '/api/upload' && req.method === 'POST') {
    try {
      const raw = await collectRequestBody(req, 25 * 1024 * 1024);
      const payload = JSON.parse(raw);
      const dataUrl = payload.dataUrl || '';
      const origName = (payload.fileName || 'photo.jpg').replace(/[^a-zA-Z0-9._-]/g, '_');

      const match = /^data:image\/(jpeg|jpg|png|webp);base64,(.+)$/i.exec(dataUrl);
      if (!match) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: 'Unsupported image format' }));
        return;
      }

      const ext = match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase();
      const buffer = Buffer.from(match[2], 'base64');
      const savedFileName = `PHOTO-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}-${origName.slice(-24)}.${ext}`;
      const savedPath = path.join(UPLOADS_DIR, savedFileName);

      fs.writeFileSync(savedPath, buffer);

      res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(
        JSON.stringify({
          ok: true,
          url: `/uploads/${savedFileName}`,
          fileName: savedFileName,
          bytes: buffer.length
        })
      );
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: false, error: err.message || 'Upload failed' }));
    }
    return;
  }

  // 4. Orders API (POST is public for checkout; GET is protected by Studio Admin PIN)
  if (parsedUrl.pathname === '/api/orders') {
    if (req.method === 'GET') {
      const providedPin = req.headers['x-admin-pin'] || parsedUrl.searchParams.get('pin') || '';
      if (providedPin !== ADMIN_PIN) {
        res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: 'Unauthorized. Valid Studio Admin PIN required.' }));
        return;
      }
      const orders = readOrders();
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ ok: true, orders }));
      return;
    }

    if (req.method === 'POST') {
      try {
        const body = await collectRequestBody(req, 5 * 1024 * 1024);
        const order = JSON.parse(body);
        if (!order.paymentId) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: false, error: 'Payment verification required before confirming order.' }));
          return;
        }
        const orders = readOrders();
        orders.unshift(order);
        writeOrders(orders);
        res.writeHead(201, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true, orderId: order.orderId }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: false, error: 'Invalid order payload' }));
      }
      return;
    }
  }

  // 5. Route /admin to admin.html, / and /v2 to /v2/index.html, and /v1 to /index.html
  let reqPath = parsedUrl.pathname;
  if (reqPath === '/admin' || reqPath === '/admin/') {
    reqPath = '/admin.html';
  } else if (reqPath === '/v2' || reqPath === '/v2/' || reqPath === '/' || reqPath === '\\') {
    reqPath = '/v2/index.html';
  } else if (reqPath === '/v1' || reqPath === '/v1/') {
    reqPath = '/index.html';
  }

  const safePath = path.normalize(reqPath).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(PUBLIC_DIR, safePath);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'X-Content-Type-Options': 'nosniff'
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`Darpan Framing Studio running at http://localhost:${PORT} (Admin: http://localhost:${PORT}/admin)`);
});
