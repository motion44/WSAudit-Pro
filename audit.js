const puppeteer = require('puppeteer');

(async () => {
  try {
    console.log("[STATUS] Initializing Auditor Engine...");
    
    const browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    const page = await browser.newPage();
    const client = await page.target().createCDPSession();
    await client.send('Network.enable');

    // Intercept outbound binary frames
    client.on('Network.webSocketFrameSent', ({ response }) => {
      const buffer = Buffer.from(response.payloadData, 'base64');
      
      // Filter for Handshake
      if (buffer.length === 7) {
        console.log("\n[PACKET] Handshake Detected:");
        console.log(JSON.stringify(Array.from(buffer).map(b => "0x" + b.toString(16).padStart(2, '0'))));
      }
      
      // Filter for Session Public Key
      if (buffer.length > 30 && buffer.length < 40) {
        console.log("\n[PACKET] Public Key Detected:");
        console.log(JSON.stringify(Array.from(buffer).map(b => "0x" + b.toString(16).padStart(2, '0'))));
      }
    });

    // Intercept connection parameters
    client.on('Network.webSocketCreated', ({ url }) => {
      const params = new URLSearchParams(url.split('?')[1]);
      console.log("\n[SESSION] Connection Initialized:");
      console.log("Token T:", params.get('t'));
      console.log("Token B:", params.get('b'));
      console.log("Endpoint:", url.split('?')[0]);
    });

    console.log("[INFO] Navigating to target...");
    await page.goto('https://arras.io', { waitUntil: 'networkidle2' });
    
    // Automation to trigger connection
    await new Promise(r => setTimeout(r, 6000));
    await page.keyboard.press('Enter');
    
    console.log("[INFO] Listening for traffic...");
    await new Promise(r => setTimeout(r, 15000));
    
    await browser.close();
    console.log("\n[STATUS] Audit Complete.");
    
  } catch (e) { 
    console.error("[ERROR]", e.message);
  }
})();
