# MCP SERVERS SETUP GUIDE
**Version:** 1.0 | **Date:** February 12, 2026  
**Purpose:** Configure all Model Context Protocol servers for Webness OS development

---

## What Are MCP Servers?

MCP (Model Context Protocol) servers extend AI assistants' capabilities by providing:
- File system access
- Database connections
- Web search
- Memory persistence
- Git operations
- And more...

---

## ✅ Currently Configured

| MCP Server | Status | What It Does |
|---|---|---|
| **Memory** | 🟢 Active | Persistent context across chat sessions |
| **Filesystem** | 🟢 Active | Read/write files in workspace |
| **GitHub** | 🟢 Active | Repository management, issues, PRs |
| **GitKraken** | 🟢 Active | Advanced Git operations |
| **Pylance** | 🟢 Active | Python environment management |

---

## 🔧 Configuration File Location

**File:** `.vscode/settings.json` (already created in your workspace)

**Current Configuration:**
```json
{
  "github.copilot.chat.mcp.servers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"],
      "description": "Persistent memory across conversations"
    },
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "C:\\Users\\USER\\Documents\\Webness\\pro webness ai tools"
      ],
      "description": "Read/write files in workspace"
    }
  }
}
```

---

## 🚀 Phase 0: Essential MCP Servers (Add These Now)

### 1. Memory MCP Server ✅ DONE
- **Purpose:** Remember context across conversations
- **Package:** `@modelcontextprotocol/server-memory`
- **Status:** ✅ Already configured

### 2. Filesystem MCP Server ✅ DONE
- **Purpose:** Read/write files in workspace
- **Package:** `@modelcontextprotocol/server-filesystem`
- **Status:** ✅ Already configured

---

## 📋 Phase 1: Additional MCP Servers (Add When Needed)

### 3. PostgreSQL MCP Server (Phase 0 - After DB Setup)

**Add this to `.vscode/settings.json` AFTER PostgreSQL is installed:**

```json
"postgres": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-postgres"],
  "env": {
    "DATABASE_URL": "postgresql://webness:YOUR_PASSWORD@localhost:5432/webness_os"
  },
  "description": "PostgreSQL database access"
}
```

**Install PostgreSQL First:**
```powershell
# Install PostgreSQL 16
winget install PostgreSQL.PostgreSQL.16

# After installation, update DATABASE_URL in settings.json
```

---

### 4. Brave Search MCP Server (Phase 1 - For SEO Auditor)

**Get a Brave API Key:**
1. Go to https://brave.com/search/api/
2. Sign up for free tier (2,500 queries/month)
3. Copy your API key

**Add to `.vscode/settings.json`:**

```json
"brave-search": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-brave-search"],
  "env": {
    "BRAVE_API_KEY": "YOUR_BRAVE_API_KEY_HERE"
  },
  "description": "Web search for research and SEO tools"
}
```

---

### 5. Playwright MCP Server (Phase 1 - For Web Scraping)

**Add to `.vscode/settings.json`:**

```json
"playwright": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-playwright"],
  "description": "Web scraping and browser automation"
}
```

**Install Playwright browsers:**
```powershell
npx playwright install
```

---

### 6. Fetch MCP Server (Phase 1 - For API Calls)

**Add to `.vscode/settings.json`:**

```json
"fetch": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-fetch"],
  "description": "Make HTTP requests to external APIs"
}
```

---

## 🎯 How to Use MCP Servers

### In Chat with GitHub Copilot:

Once configured, you can ask me to:

**With Filesystem MCP:**
- "Create a new file at `path/to/file.ts`"
- "Read the contents of `package.json`"
- "Update all TypeScript files in `src/` folder"

**With Memory MCP:**
- "Remember that we're using Oracle Cloud Free Tier"
- "What decisions did we make about the database?"
- "Recall our architecture design"

**With PostgreSQL MCP (after setup):**
- "Show me all tables in the database"
- "Run a query to count users"
- "Check if pgvector extension is installed"

**With Brave Search MCP (after setup):**
- "Search for the latest Oracle Cloud ARM issues"
- "Find best practices for Ollama deployment"
- "Research competitor pricing for AI SaaS tools"

---

## ✅ Verification Steps

### 1. Reload VS Code Window
```
Ctrl + Shift + P → "Developer: Reload Window"
```

### 2. Check MCP Server Status
```
Ctrl + Shift + P → "GitHub Copilot: Show MCP Server Status"
```

### 3. Test in Chat
Ask me: "Can you list all files in the workspace using the Filesystem MCP?"

---

## 🔄 How to Restart MCP Servers

If an MCP server stops working:

```
Ctrl + Shift + P → "GitHub Copilot: Restart MCP Servers"
```

---

## 📊 MCP Servers Roadmap

| Phase | MCP Server | Status |
|---|---|---|
| Phase 0 | Memory | ✅ Configured |
| Phase 0 | Filesystem | ✅ Configured |
| Phase 0 | PostgreSQL | ⏳ Add after DB setup |
| Phase 1 | Brave Search | ⏳ Need API key |
| Phase 1 | Playwright | ⏳ Add when building SEO Auditor |
| Phase 1 | Fetch | ⏳ Add when integrating external APIs |
| Phase 2 | Google Search Console | ⏳ Add for SEO data |
| Phase 4 | Slack | ⏳ Add for notifications |

---

## 🐛 Troubleshooting

### MCP Server Not Starting

**Error:** `Error: Cannot find module '@modelcontextprotocol/server-xyz'`

**Fix:**
```powershell
# Clear npm cache
npm cache clean --force

# Test manually
npx -y @modelcontextprotocol/server-memory
```

### VS Code Not Detecting MCP Servers

**Fix:**
1. Check `.vscode/settings.json` syntax (no trailing commas)
2. Reload VS Code window
3. Check Output panel: `View → Output → GitHub Copilot`

### MCP Server Crashes

**Fix:**
1. Check Node.js version: `node --version` (should be v18+)
2. Update npm: `npm install -g npm@latest`
3. Restart MCP servers

---

## 🔐 Security Notes

- **Never commit API keys** to `.vscode/settings.json` if you push to GitHub
- Use environment variables for sensitive data
- Add `.vscode/settings.json` to `.gitignore` if it contains secrets

**Safe Configuration (Use .env files instead):**
```json
"brave-search": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-brave-search"],
  "env": {
    "BRAVE_API_KEY": "${env:BRAVE_API_KEY}"
  }
}
```

Then set in your shell:
```powershell
$env:BRAVE_API_KEY = "your_key_here"
```

---

*This file will be updated as we add more MCP servers throughout development.*
