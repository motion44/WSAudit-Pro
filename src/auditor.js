%%bash
cat <<'EOF' > auditor.js
const puppeteer = require('puppeteer');

(async () => {
  try {
    console.log("🚀 [PHOENIX AUDITOR] Initializing...");
    const browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    const client = await page.target().createCDPSession();
    await client.send('Network.enable');

    // INITIALIZE DATA OBJECT HERE TO FIX REFERENCEERROR
    let data = { t: '', b: '', target: '' };

    client.on('Network.webSocketFrameSent', ({ response }) => {
      const buffer = Buffer.from(response.payloadData, 'base64');
      
      if (buffer.length === 7) {
        console.log("📍 [HANDSHAKE] " + JSON.stringify(Array.from(buffer).map(b => "0x" + b.toString(16).padStart(2, '0'))));
      } 
      else if (buffer.length > 30 && buffer.length < 45) {
        console.log("📍 [PUBLIC_KEY] " + JSON.stringify(Array.from(buffer).map(b => "0x" + b.toString(16).padStart(2, '0'))));
      }
    });

    client.on('Network.webSocketCreated', ({ url }) => {
      const parts = url.split('?');
      if (parts.length > 1) {
        const params = new URLSearchParams(parts[1]);
        if (params.get('t')) {
          data.t = params.get('t');
          data.b = params.get('b');
          data.target = parts[0].replace('wss://', '');
          
          console.log("\n🔗 [SESSION] " + data.target);
          console.log("   T: " + data.t);
          console.log("   B: " + data.b);
        }
      }
    });

    console.log("🌐 [INFO] Navigating to target...");
    await page.goto('https://arras.io', { waitUntil: 'networkidle2' });

    console.log("⌨️ [INFO] Triggering Handshake...");
    await new Promise(r => setTimeout(r, 6000));
    await page.keyboard.press('Enter');

    console.log("📡 [INFO] Monitoring traffic for 15s...");
    await new Promise(r => setTimeout(r, 15000));

    await browser.close();
    console.log("\n🏁 [STATUS] Audit Complete.");

  } catch (e) { 
    console.error("🔥 [ERROR] " + e.message); 
  }
})();
EOF

node auditor.js
