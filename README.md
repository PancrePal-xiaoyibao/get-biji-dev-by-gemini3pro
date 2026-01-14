# Get Notes MCP Server / Get 笔记 MCP 服务器

[English](#english) | [中文](#chinese)

<a name="english"></a>

## 🇬🇧 English

A Model Context Protocol (MCP) server for integrating with Get Notes API. This server provides tools to search and recall knowledge from your Get Notes knowledge base.

### Features

- **Knowledge Search**: AI-processed search that returns synthesized answers and references.
- **Knowledge Recall**: Raw recall of relevant notes and files.
- **Rate Limiting**: Built-in protection with QPS < 2 and Total Requests < 5000 limits.
- **Retry Mechanism**: Automatic retries for transient network errors (5xx).

### Installation

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
   GET_NOTE_TOPIC_ID=your_topic_id_1
   ```

### Usage

#### Running with npx

You can run the server directly without installing it using `npx`:

```bash
npx get_notebook_mcp_server
```

#### MCP Configuration (Claude Desktop)

**Option 1: Single Knowledge Base (Simple Setup)**

For a single knowledge base, add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "get-notes": {
      "command": "npx",
      "args": ["-y", "get_notebook_mcp_server"],
      "env": {
        "GET_API_KEY": "your_api_key_here",
        "GET_NOTE_TOPIC_ID": "your_topic_id_1"
      }
    }
  }
}
```

**Option 2: Multiple Knowledge Bases (Grouped Configuration - Recommended)**

For multiple knowledge bases sharing the same API key, use grouped configuration. The system will automatically expand them into individual knowledge bases:

```json
{
  "mcpServers": {
    "get-notes": {
      "command": "npx",
      "args": ["-y", "get_notebook_mcp_server"],
      "env": {
        "GET_KNOWLEDGE_BASES": "[{\"id\":\"medical_group\",\"name\":\"Medical Knowledge Bases\",\"config\":{\"api_key\":\"your_api_key_here\",\"topics\":[{\"id\":\"kb_pancreatic_trials\",\"name\":\"Tumor Clinical Trials KB\",\"topic_id\":\"your_topic_id_1\"},{\"id\":\"kb_patient_experience\",\"name\":\"Patient Experience KB\",\"topic_id\":\"your_topic_id_2\"}]}}]"
      }
    }
  }
}
```

This configuration will be automatically expanded into two independent knowledge bases: `kb_pancreatic_trials` and `kb_patient_experience`.

**Option 3: Using Local Configuration File (Recommended for Development)**

Create a `knowledge_bases.json` file in your project root:

```json
[
  {
    "id": "demo_group",
    "name": "Sam's Knowledge Bases",
    "description": "Knowledge bases sharing the same API Key",
    "config": {
      "api_key": "your_api_key_here",
      "api_endpoint": "https://open-api.biji.com/getnote/openapi",
      "topics": [
        {
          "id": "kb_pancreatic_trials",
          "name": "Tumor Clinical Trials Knowledge Base",
          "description": "Knowledge base about tumor clinical trials",
          "topic_id": "your_topic_id_1"
        },
        {
          "id": "kb_patient_experience",
          "name": "Patient Experience Information",
          "description": "Patient experience info including guidelines and treatment experiences",
          "topic_id": "your_topic_id_2"
        }
      ]
    }
  }
]
```

Then configure Claude Desktop to use the local file:

```json
{
  "mcpServers": {
    "get-notes": {
      "command": "npx",
      "args": ["-y", "get_notebook_mcp_server"]
    }
  }
}
```

#### How Claude Uses Multiple Knowledge Bases

**Claude automatically selects the appropriate knowledge base - no manual selection needed!**

**Workflow:**
1. **User asks a question**: "How long after pancreatic cancer surgery should chemotherapy start?"
2. **Claude automatically calls `list_knowledge_bases`**: Views all available knowledge bases
3. **Claude intelligently selects**: Based on the question content, automatically chooses the most relevant KB (e.g., `kb_pancreatic_trials`)
4. **Claude calls `search_knowledge`**: Passes the selected `kb_id` and the question
5. **Returns results**: Claude synthesizes the search results into an answer

**Users can also specify explicitly:**
- "Search in the Tumor Clinical Trials KB: pancreatic cancer chemotherapy timing"
- "Find in Patient Experience: chemotherapy side effect management"

This way Claude knows exactly which knowledge base to use.

#### Running Locally

```bash
node index.js
```

#### Testing with MCP Inspector

You can test the MCP server interactively using the MCP Inspector:

```bash
npx @modelcontextprotocol/inspector node index.js
```

### Tools

#### `list_knowledge_bases`
List all available knowledge bases with their IDs, names, and descriptions.

**Parameters:** None

**Returns:** Array of knowledge base information (without sensitive API keys)

#### `search_knowledge`
Search the knowledge base with AI processing.

**Parameters:**
- `kb_id` (string, optional): Knowledge base ID. If not provided, uses the first configured KB.
- `question` (string, required): The question to ask.
- `deep_seek` (boolean): Enable deep thinking mode (default: false).
- `history` (array): Chat history for context.

#### `recall_knowledge`
Raw recall from knowledge base without AI synthesis.

**Parameters:**
- `kb_id` (string, optional): Knowledge base ID. If not provided, uses the first configured KB.
- `question` (string, required): The question or query.
- `top_k` (number): Number of results to return (default: 10).
- `intent_rewrite` (boolean): Enable intent rewrite (default: false).

### Development

#### Running Tests

```bash
npm test
```

#### Project Structure

- `src/api`: API client implementation
- `src/utils`: Utility classes (RateLimiter, etc.)
- `tests`: Unit and integration tests
- `index.js`: Main MCP server entry point

### License

ISC

### ❤️ Acknowledgments

This project is contributed by the **Xiao-X-Bao Community** - an AI open-source public welfare community focused on improving medical information access for cancer/rare disease patients and their families throughout their life cycle.

#### About Xiao-X-Bao Community

We are an AI open-source public welfare community dedicated to using AI technology to build a high-quality, high-density patient knowledge ecosystem to improve medical information barriers. Our community brings together a diverse group of open-source contributors, AI technology experts, cancer patients, family members, medical professionals, and public welfare volunteers, working together to improve the information access challenges faced by patients.

**Community Website**: https://info.xiao-x-bao.com.cn

**Our Mission**: To use AI technology to break down medical information barriers and build a comprehensive knowledge ecosystem for patients.

**Origin of Community Name**: All our AI assistants are named "Xiao-X-Bao" (Little X Treasure), such as "Xiao Yi Bao" (Little Pancreas Treasure), "Xiao Fen Bao" (Little Pink Treasure), etc., hence our community is named "Xiao-X-Bao Community".

**Community Development**: In 2024, the project was donated to the "Tiangong Kaiwu Foundation", which provides funding and guidance to promote public welfare initiatives.

**Progress Updates**: Published via the WeChat Official Account "Xiao Yi Bao Assistant".

#### Community Contact

**Detailed Community Introduction**: [View Introduction](https://uei55ql5ok.feishu.cn/wiki/ULuKwHuv1iEM8gkrFTecP8DqnSd)

**Contact Us**:
- WeChat: qinxiaoqiang2002
- WeChat: hhxdeweixinxin
- WeChat: zhuangbiaowei

We welcome all contributors, developers, medical professionals, and volunteers to join our community and use technology to improve medical information accessibility! 🌟

---

<a name="chinese"></a>

## 🇨🇳 中文

这是一个用于集成 Get 笔记 API 的 Model Context Protocol (MCP) 服务器。该服务器提供了从您的 Get 笔记知识库中搜索和召回知识的工具。

### 功能特性

- **知识库搜索 (Knowledge Search)**：经过 AI 处理的搜索，返回综合的答案和引用。
- **知识库召回 (Knowledge Recall)**：相关笔记和文件的原始召回。
- **速率限制 (Rate Limiting)**：内置保护，限制 QPS < 2 和总请求数 < 5000。
- **重试机制 (Retry Mechanism)**：针对瞬时网络错误 (5xx) 的自动重试。

### 安装

1. 克隆仓库
2. 安装依赖：
   ```bash
   npm install
   ```
3. 从示例创建 `.env` 文件：
   ```bash
   cp .env.example .env
   ```
4. 在 `.env` 中配置您的 API 密钥：
   ```
   GET_API_KEY=your_api_key_here
   GET_NOTE_TOPIC_ID=your_topic_id_1
   ```

### 使用方法

#### 使用 npx 运行

您可以直接使用 `npx` 运行服务器，无需安装：

```bash
npx get_notebook_mcp_server
```

#### MCP 配置 (Claude Desktop)

将以下配置添加到您的 `claude_desktop_config.json`：

**方式1：单个知识库（简单配置）**

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
        "GET_NOTE_TOPIC_ID": "your_topic_id_1"
      }
    }
  }
}
```

**方式2：多知识库（分组配置，推荐）**

如果多个知识库共享同一个 API Key，可以使用分组配置。系统会自动将其展开为独立的知识库：

```json
{
  "mcpServers": {
    "get-notes-multi": {
      "command": "npx",
      "args": [
        "-y",
        "get_notebook_mcp_server"
      ],
      "env": {
        "GET_KNOWLEDGE_BASES": "[{\"id\":\"medical_group\",\"name\":\"医学知识库组\",\"config\":{\"api_key\":\"your_api_key_here\",\"topics\":[{\"id\":\"kb_pancreatic_trials\",\"name\":\"肿瘤临床试验知识库\",\"topic_id\":\"your_topic_id_1\"},{\"id\":\"kb_patient_experience\",\"name\":\"小胰宝病友经验信息\",\"topic_id\":\"your_topic_id_2\"}]}}]"
      }
    }
  }
}
```

上述配置会自动展开为两个独立的知识库：`kb_pancreatic_trials` 和 `kb_patient_experience`。

**方式3：使用本地配置文件（推荐用于开发）**

在项目根目录创建 `knowledge_bases.json` 文件：

```json
[
  {
    "id": "demo_group",
    "name": "sam的知识库",
    "description": "使用同一个 API Key 的知识库",
    "config": {
      "api_key": "your_api_key_here",
      "api_endpoint": "https://open-api.biji.com/getnote/openapi",
      "topics": [
        {
          "id": "kb_pancreatic_trials",
          "name": "肿瘤临床试验知识库",
          "description": "有关肿瘤临床试验的知识库",
          "topic_id": "your_topic_id_1"
        },
        {
          "id": "kb_patient_experience",
          "name": "小胰宝病友经验信息",
          "description": "小胰宝病友经验信息，包括各种指南和治疗经验",
          "topic_id": "your_topic_id_2"
        }
      ]
    }
  }
]
```

然后在 Claude Desktop 配置中使用本地文件：

```json
{
  "mcpServers": {
    "get-notes": {
      "command": "npx",
      "args": ["-y", "get_notebook_mcp_server"]
    }
  }
}
```

#### Claude 如何使用多知识库

**Claude 会自动选择合适的知识库，无需手动选择！**

**工作流程：**
1. **用户提问**："胰腺癌术后多久开始化疗？"
2. **Claude 自动调用 `list_knowledge_bases`**：查看所有可用的知识库
3. **Claude 智能选择**：根据问题内容，自动选择最相关的知识库（如 `kb_pancreatic_trials`）
4. **Claude 调用 `search_knowledge`**：传入选定的 `kb_id` 和问题
5. **返回结果**：Claude 综合搜索结果给出答案

**用户也可以明确指定：**
- "在肿瘤临床试验知识库中搜索：胰腺癌化疗方案"
- "在小胰宝病友经验中查找：化疗副作用处理方法"

这样 Claude 就会明确使用指定的知识库。

#### 本地运行

```bash
node index.js
```

#### 使用 MCP Inspector 测试

您可以使用 MCP Inspector 交互式测试 MCP 服务器：

```bash
npx @modelcontextprotocol/inspector node index.js
```

### 工具说明

#### `list_knowledge_bases`
列出所有可用的知识库及其 ID、名称和描述。

**参数：** 无

**返回：** 知识库信息数组（不包含敏感的 API 密钥）

#### `search_knowledge`
使用 AI 处理搜索知识库。

**参数：**
- `kb_id` (string, 可选): 知识库 ID。如果未提供，使用第一个配置的知识库。
- `question` (string, 必需): 要提问的问题。
- `deep_seek` (boolean): 启用深度思考模式（默认值：false）。
- `history` (array): 用于上下文的聊天历史。

#### `recall_knowledge`
从知识库原始召回，不进行 AI 综合。

**参数：**
- `kb_id` (string, 可选): 知识库 ID。如果未提供，使用第一个配置的知识库。
- `question` (string, 必需): 问题或查询。
- `top_k` (number): 返回结果数量（默认值：10）。
- `intent_rewrite` (boolean): 启用意图重写（默认值：false）。

### 开发

#### 运行测试

```bash
npm test
```

#### 项目结构

- `src/api`：API 客户端实现
- `src/utils`：工具类（速率限制器等）
- `tests`：单元和集成测试
- `index.js`：MCP 服务器主入口点

### 许可证

ISC

### ❤️ 致谢

本项目由**小x宝社区**贡献 - 一个专注于改善癌症/罕见病患者及其家庭整个生命周期医疗信息获取的AI开源公益社区。

#### 关于小x宝社区

我们是一个AI开源公益社区，致力于使用AI技术构建高质量、高密度的患者知识生态系统，以改善医疗信息壁垒。我们的社区汇聚了开源贡献者、AI技术专家、癌症患者、家庭成员、医疗专业人员和公益志愿者等多元化群体，共同努力改善患者面临的信息获取挑战。

**社区网站**：https://info.xiao-x-bao.com.cn

**我们的使命**：使用AI技术打破医疗信息壁垒，为患者构建全面的知识生态系统。

**社区名称由来**：我们所有的AI助手都以"小x宝"命名，如"小胰宝"、"小粉宝"等，因此我们的社区命名为"小x宝社区"。

**社区发展**：2024年，项目捐赠给"天工开物基金会"，该基金会提供资金和指导以促进公益倡议。

**进展更新**：通过微信公众号"小胰宝助手"发布。

#### 社区联系方式

**详细社区介绍**： [查看介绍](https://uei55ql5ok.feishu.cn/wiki/ULuKwHuv1iEM8gkrFTecP8DqnSd)

**社区联系方式**：
- 微信号: qinxiaoqiang2002
- 微信号: hhxdeweixinxin  
- 微信号: zhuangbiaowei

我们欢迎所有贡献者、开发人员、医疗专业人员和志愿者加入我们的社区，使用技术改善医疗信息可及性！🌟