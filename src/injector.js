%%bash
cat <<'EOF' > injector.js
const fs = require('fs');

// The captured intel from the Auditor
const data = {
    t: 1777966394,
    b: "ab050d87f7fc76bf",
    public_key: [0x1a, 0x62, 0x0b, 0xb2, 0x30, 0xf8, 0x1e, 0xad, 0x46, 0x88, 0x83, 0xe3, 0xa3, 0xc8, 0x5e, 0xc6, 0xbf, 0x08, 0x7b, 0xf6, 0xce, 0xd0, 0xb3, 0x94, 0x24, 0xbd, 0x3b, 0xe3, 0x3c, 0x24, 0x1e, 0x5b],
    target: "qrp6ujau11f36bnm-c.uvwx.xyz"
};

// 1. Re-writing bot_config.js using your specific module.exports function structure
const configContent = `module.exports = function() {
    return {
        t: ${data.t},
        b: "${data.b}",
        public_key: [${data.public_key.map(x => "0x" + x.toString(16).padStart(2, '0')).join(', ')}],
        target: "${data.target}",
        proxy_count: 50
    };
};`;

try {
    // Write to bot_config.js
    fs.writeFileSync('bot_config.js', configContent);
    console.log("🛠️ [INJECTOR] bot_config.js patched successfully.");

    // 2. Updating current_target.txt (convenience for bash scripts)
    fs.writeFileSync('current_target.txt', data.target);
    console.log("🛠️ [INJECTOR] current_target.txt updated.");

    console.log("\n✅ [READY] Project Phoenix is armed and synced.");
} catch (err) {
    console.error("🔥 [INJECTOR ERROR]", err.message);
}
EOF

node injector.js
