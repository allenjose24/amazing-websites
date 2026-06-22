const crypto = require('crypto');
const https = require('https');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// ==================== CONFIGURATION ====================
const APP_ID = '4108698';               // Replace with your App ID
const INSTALLATION_ID = '141709305'; // Replace with your Installation ID
const PRIVATE_KEY_FILE = path.join(__dirname, 'antigravity-vault-bot.2026-06-21.private-key.pem'); // Place your .pem file in the same directory
// =======================================================

// 1. Generate JSON Web Token (JWT) signed with RSA-SHA256
function signJwt(appId, privateKeyPem) {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  
  const payload = Buffer.from(JSON.stringify({
    iat: now - 60, // 60-second offset to handle clock drift
    exp: now + 500, // JWT valid for 8 minutes, well within GitHub's 10-minute limit relative to iat
    iss: appId
  })).toString('base64url');

  const sign = crypto.createSign('RSA-SHA256');
  sign.update(`${header}.${payload}`);
  const signature = sign.sign(privateKeyPem, 'base64url');

  return `${header}.${payload}.${signature}`;
}

// 2. Request an Installation Access Token from GitHub
function getInstallationToken(jwt, installationId) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.github.com',
      path: `/app/installations/${installationId}/access_tokens`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'Node-MCP-Auth-Launcher'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 201) {
          resolve(JSON.parse(data).token);
        } else {
          reject(new Error(`GitHub App Auth Failed (${res.statusCode}): ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

// 3. Authenticate and Launch the MCP Server
async function main() {
  try {
    if (!fs.existsSync(PRIVATE_KEY_FILE)) {
      throw new Error(`Private key file not found at: ${PRIVATE_KEY_FILE}`);
    }
    const privateKey = fs.readFileSync(PRIVATE_KEY_FILE, 'utf8');

    console.error('[App Launcher] Generating JWT...');
    const jwt = signJwt(APP_ID, privateKey);

    console.error('[App Launcher] Requesting Installation Token...');
    const token = await getInstallationToken(jwt, INSTALLATION_ID);

    console.error('[App Launcher] Spawning GitHub MCP Server...');
    const isWindows = process.platform === 'win32';
    const npxCmd = isWindows ? 'npx.cmd' : 'npx';

    const mcpProcess = spawn(npxCmd, ['-y', '@modelcontextprotocol/server-github'], {
      env: {
        ...process.env,
        GITHUB_PERSONAL_ACCESS_TOKEN: token
      },
      stdio: 'inherit',
      shell: true
    });

    mcpProcess.on('exit', (code) => {
      process.exit(code || 0);
    });

  } catch (error) {
    console.error('[App Launcher] Fatal Error:', error.message);
    process.exit(1);
  }
}

main();