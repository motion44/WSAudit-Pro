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
            if (url.includes('t=')) {
                const u = new URL(url);
                console.log("\n🔗 [SESSION] " + u.hostname);
                console.log("   T: " + u.searchParams.get('t'));
                console.log("   B: " + u.searchParams.get('b'));
            }
        });

        console.log("🌐 [INFO] Navigating to Arras.io/#ec...");
        await page.goto('https://arras.io', { waitUntil: 'domcontentloaded' });

        console.log("⌨️  [INFO] Triggering Handshake...");
        await new Promise(r => setTimeout(r, 5000));
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
