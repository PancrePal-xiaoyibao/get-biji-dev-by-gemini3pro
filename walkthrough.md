# 多知识库支持使用指南 (Multi-Knowledge Base Support Walkthrough)

## 概述
我们更新了 MCP 服务器以支持多个“Get 笔记”知识库。这允许用户配置具有独立 API Key 和 Endpoint 的不同知识库，并使 LLM 能够发现并在它们之间进行搜索。

## 变更说明

### 1. 配置方式
- **新配置文件**: 项目根目录下的 `knowledge_bases.json`。
- **环境变量支持**: `GET_KNOWLEDGE_BASES` 环境变量支持传入 JSON 字符串配置，这对于 `npx` 或容器化部署非常有用。
- **向后兼容性**: 现有的 `GET_API_KEY` 和 `GET_NOTE_TOPIC_ID` 环境变量仍然有效，系统会自动将其创建一个名为 "Default Knowledge Base (Env)" 的默认知识库。

### 2. 工具变更
- **[新增] `list_knowledge_bases`**: 列出所有可用的知识库及其 ID 和描述。
- **[更新] `search_knowledge`**: 现在必须传入 `kb_id` 参数。
- **[更新] `recall_knowledge`**: 现在必须传入 `kb_id` 参数。

## 使用指南

### 配置文件示例 (`knowledge_bases.json`)
```json
[
  {
    "id": "kb_tech",
    "name": "技术文档库",
    "description": "包含 API 文档和开发指南",
    "config": {
      "api_endpoint": "https://open-api.biji.com/getnote/openapi",
      "api_key": "sk-tech-key...",
      "topic_id": "topic_123"
    }
  }
]
```

### 环境变量示例 (用于 npx 等场景)
```bash
export GET_KNOWLEDGE_BASES='[{"id":"kb_env","name":"环境变量库","description":"...","config":{"api_endpoint":"...","api_key":"...","topic_id":"..."}}]'
```

### MCP 工具调用流程
1. **列出知识库**: 首先调用 `list_knowledge_bases` 查看可用列表。
2. **执行搜索**: 调用 `search_knowledge`，传入 `kb_id="kb_tech"` 以及您的问题。

## 验证方法
运行测试以验证配置加载和环境变量支持是否正常：
```bash
npm test tests/multi_kb.test.js
```
