# Get Notes MCP Server

A Model Context Protocol (MCP) server for integrating with Get Notes API. This server provides tools to search and recall knowledge from your Get Notes knowledge base.

## Features

- **Knowledge Search**: AI-processed search that returns synthesized answers and references.
- **Knowledge Recall**: Raw recall of relevant notes and files.
- **Rate Limiting**: Built-in protection with QPS < 2 and Total Requests < 5000 limits.
- **Retry Mechanism**: Automatic retries for transient network errors (5xx).

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env` file from example:
   ```bash
   cp .env.example .env
   ```
4. Configure your API key in `.env`:
   ```
   GET_API_KEY=your_api_key_here
   ```

## Usage

### Running the Server

```bash
node index.js
```

### Testing with MCP Inspector

You can test the MCP server interactively using the MCP Inspector:

```bash
npx @modelcontextprotocol/inspector node index.js
```

### Running with npx

You can run the server directly without installing it using `npx`:

```bash
npx get_notebook_mcp_server
```

### MCP Configuration (Claude Desktop)

Add the following configuration to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "get-notes": {
      "command": "npx",
      "args": [
        "-y",
        "get_notebook_mcp_server"
      ],
      "env": {
        "GET_API_KEY": "your_api_key_here",
        "GET_NOTE_TOPIC_ID": "your_topic_id_here"
      }
    }
  }
}
```

### Tools

#### `search_knowledge`
Search the knowledge base with AI processing.

**Parameters:**
- `question` (string, required): The question to ask.
- `topic_ids` (array<string>, optional): List of knowledge base IDs. If not provided, uses `GET_NOTE_TOPIC_ID` from environment.
- `deep_seek` (boolean): Enable deep thinking mode (default: true).
- `history` (array): Chat history for context.

#### `recall_knowledge`
Raw recall from knowledge base without AI synthesis.

**Parameters:**
- `question` (string, required): The question or query.
- `topic_id` (string, optional): Knowledge base ID. If not provided, uses `GET_NOTE_TOPIC_ID` from environment.
- `top_k` (number): Number of results to return (default: 10).
- `intent_rewrite` (boolean): Enable intent rewrite (default: false).

## Development

### Running Tests

```bash
npm test
```

### Project Structure

- `src/api`: API client implementation
- `src/utils`: Utility classes (RateLimiter, etc.)
- `tests`: Unit and integration tests
- `index.js`: Main MCP server entry point

## License

ISC
