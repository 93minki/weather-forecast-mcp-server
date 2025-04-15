# weather-server MCP Server

Weather MCP Server

This is a TypeScript-based MCP server that implements a simple notes system. It demonstrates core MCP concepts by providing:

- Resources representing text notes with URIs and metadata
- Tools for creating new notes
- Prompts for generating summaries of notes

## Features

### Resources

- List and access notes via `note://` URIs
- Each note has a title, content and metadata
- Plain text mime type for simple content access

### Tools

- `create_note` - Create new text notes
  - Takes title and content as required parameters
  - Stores note in server state

### Prompts

- `summarize_notes` - Generate a summary of all stored notes
  - Includes all note contents as embedded resources
  - Returns structured prompt for LLM summarization

## Development

Install dependencies:

```bash
npm install
```

Build the server:

```bash
npm run build
```

For development with auto-rebuild:

```bash
npm run watch
```

## Installation

To use with Claude Desktop, add the server config:

On MacOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
On Windows: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "weather-server": {
      "command": "/path/to/weather-server/build/index.js"
    }
  }
}
```

### Debugging

Since MCP servers communicate over stdio, debugging can be challenging. We recommend using the [MCP Inspector](https://github.com/modelcontextprotocol/inspector), which is available as a package script:

```bash
npm run inspector
```

The Inspector will provide a URL to access debugging tools in your browser.

### 사용 방법

1. `.env` 파일 생성 후 OPENWEATHER_API_KEY=API_KEY
2. `npx tsc` 명령어로 빌드
3. `claude_desktop_config.json` 파일 수정

```json
{
  "mcpServers": {
    "weather-server": {
      "command": "node",
      "args": ["/Users/{UserName}/Desktop/{Project-path}/build/index.js"]
    }
  }
}
```

npx tsc
