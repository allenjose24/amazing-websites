# Setup Guide: GitHub App Authentication for MCP Server

This guide walks you through registering a private GitHub App and setting up a zero-dependency Node.js launcher script to authenticate your MCP server. This gives the AI agent a professional **`[bot]`** identity (e.g. `your-app-name[bot]`), allowing you to review, approve, and merge its Pull Requests yourself.

---

## Step 1: Register the GitHub App

1. Go to your GitHub account **Settings** $\rightarrow$ **Developer settings** $\rightarrow$ **GitHub Apps** $\rightarrow$ Click **New GitHub App**.
2. **App Details**:
   * **GitHub App name**: Enter a name (e.g., `Antigravity-Vault-Bot`).
   * **Homepage URL**: Enter any URL (e.g., `https://github.com/allenjose24/amazing-websites`).
3. **Webhook**:
   * Uncheck **Active** (no webhook URL is required for the client-side MCP server).
4. **Permissions**:
   Under **Repository permissions**, configure the following:
   * **Contents**: `Read & write` (to view files, create branches, and push code changes)
   * **Issues**: `Read & write` (to create, update, and manage issues)
   * **Pull requests**: `Read & write` (to create and update PRs)
5. **Install App**:
   * Choose **\"Only on this account\"** (for personal/private use).
   * Click **Create GitHub App**.
6. **Key & Configuration Values**:
   * Note down the **App ID** on the App settings page.
   * Scroll down to **Private keys** and click **Generate a private key**. This will download a `.pem` key file.
   * Navigate to the **Install App** tab in the sidebar, click **Install** next to your account, and select only your `amazing-websites` repository.
   * Look at the URL after installation: `https://github.com/settings/installations/XXXXXX`. The number `XXXXXX` at the end is your **Installation ID**.

---

## Step 2: Create the Launcher Script

Create a script file in your project root named `mcp-github-app.cjs`. This zero-dependency script automatically handles the JWT cryptographic signatures and fetches a fresh 1-hour installation token on startup, before spawning the MCP server.

Create **`d:/antigravity/amazing-websites/mcp-github-app.cjs`** with the following content:

```javascript
const crypto = require('crypto');
const https = require('https');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// ==================== CONFIGURATION ====================
const APP_ID = 'YOUR_APP_ID_HERE';               // Replace with your App ID
const INSTALLATION_ID = 'YOUR_INSTALLATION_ID_HERE'; // Replace with your Installation ID
const PRIVATE_KEY_FILE = path.join(__dirname, 'private-key.pem'); // Place your .pem file in the same directory
// =======================================================

// 1. Generate JSON Web Token (JWT) signed with RSA-SHA256
function signJwt(appId, privateKeyPem) {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  
  const payload = Buffer.from(JSON.stringify({
    iat: now - 60, // 60-second offset to handle clock drift
    exp: now + 600, // JWT valid for 10 minutes
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
```

---

## Step 3: Configure your MCP Settings

1. Place the private key `.pem` file you downloaded in Step 1 in your project root (`d:/antigravity/amazing-websites/private-key.pem`).
2. Update the `APP_ID` and `INSTALLATION_ID` variables in `mcp-github-app.cjs`.
3. Open your IDE's MCP Configuration file (e.g. `claude_desktop_config.json`) and configure the GitHub MCP server to launch via node and your script:

```json
{
  "mcpServers": {
    "github": {
      "command": "node",
      "args": [
        "d:/antigravity/amazing-websites/mcp-github-app.cjs"
      ]
    }
  }
}
```

4. Restart your IDE/environment. 

Now, when the IDE boots, it will execute your script, dynamically fetch a secure token representing the App, and load the MCP server. Any issues, commits, or PRs raised will show up with your App's clean bot identity, enabling you to approve and merge them yourself!
