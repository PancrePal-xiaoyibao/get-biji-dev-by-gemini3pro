# 多知识库设计方案

## 背景

### 核心需求
- 支持 20+ 个 Get 笔记知识库
- 不同知识库可能由不同贡献者维护
- 每个知识库有独立的 API 配置（API Key, Topic ID）
- 某些知识库可能共享同一个 API Key

### API 限制
根据 Get Notes API 文档：
- `topic_ids` 参数虽然是数组格式，但**明确标注"当前只支持1个"**
- 每次 API 调用只能查询一个 Topic ID
- 不支持在单次调用中同时搜索多个知识库

## 设计方案对比

### 方案1：每个 Topic ID 一个独立配置

#### 配置示例
```json
[
  {
    "id": "kb_pancrepal",
    "name": "PancrePal 胰腺癌知识库",
    "description": "专注于胰腺癌诊疗的医学知识库",
    "config": {
      "api_key": "KEY_1",
      "topic_id": "your_topic_id_1"
    }
  },
  {
    "id": "kb_diabetes",
    "name": "糖尿病知识库",
    "description": "糖尿病管理与治疗知识",
    "config": {
      "api_key": "KEY_1",  // 与上面共享同一个 Key
      "topic_id": "your_topic_id_2"
    }
  },
  {
    "id": "kb_cardiology",
    "name": "心血管疾病知识库",
    "description": "心血管疾病诊疗指南",
    "config": {
      "api_key": "KEY_2",  // 不同的 Key
      "topic_id": "abc123"
    }
  }
  // ... 共 20 个配置
]
```

#### 优点
- ✅ 配置清晰明确，每个知识库独立
- ✅ 符合 API 限制（每次只查询一个 Topic ID）
- ✅ 易于维护和理解
- ✅ 可以为每个知识库设置独立的名称和描述

#### 缺点
- ❌ 20 个知识库需要 20 组配置
- ❌ 共享 API Key 的知识库需要重复配置 Key
- ❌ 配置文件较长

---

### 方案2：保留 topic_ids 数组，只使用第一个

#### 配置示例
```json
[
  {
    "id": "kb_pancrepal",
    "name": "PancrePal 知识库",
    "config": {
      "api_key": "KEY_1",
      "topic_ids": ["your_topic_id_1", "your_topic_id_2"]  // 只会使用第一个
    }
  }
]
```

#### 优点
- ✅ 配置相对简洁
- ✅ 可以在配置中记录所有可用的 Topic ID

#### 缺点
- ❌ 容易误导用户，以为可以同时搜索多个 Topic
- ❌ 其他 Topic ID 无法使用，除非创建新的知识库配置
- ❌ 不符合直觉

---

### 方案3：分组配置 + 自动展开（推荐）

#### 配置示例
```json
[
  {
    "id": "medical_group_1",
    "name": "医学知识库组1",
    "description": "使用 API Key 1 的医学知识库",
    "config": {
      "api_key": "KEY_1",
      "topics": [
        {
          "id": "kb_pancrepal",
          "name": "PancrePal 胰腺癌知识库",
          "description": "专注于胰腺癌诊疗",
          "topic_id": "your_topic_id_1"
        },
        {
          "id": "kb_diabetes",
          "name": "糖尿病知识库",
          "description": "糖尿病管理与治疗",
          "topic_id": "your_topic_id_2"
        }
      ]
    }
  },
  {
    "id": "medical_group_2",
    "name": "医学知识库组2",
    "description": "使用 API Key 2 的医学知识库",
    "config": {
      "api_key": "KEY_2",
      "topics": [
        {
          "id": "kb_cardiology",
          "name": "心血管疾病知识库",
          "description": "心血管疾病诊疗指南",
          "topic_id": "abc123"
        }
      ]
    }
  }
]
```

#### 系统行为
1. **加载配置时**：自动展开为独立的知识库
2. **`list_knowledge_bases` 返回**：
   ```json
   [
     {"id": "kb_pancrepal", "name": "PancrePal 胰腺癌知识库", "description": "专注于胰腺癌诊疗"},
     {"id": "kb_diabetes", "name": "糖尿病知识库", "description": "糖尿病管理与治疗"},
     {"id": "kb_cardiology", "name": "心血管疾病知识库", "description": "心血管疾病诊疗指南"}
   ]
   ```
3. **搜索时**：用户指定 `kb_id`，系统找到对应的 API Key 和 Topic ID

#### 优点
- ✅ 配置简洁，共享 API Key 的知识库只需配置一次
- ✅ 20 个知识库可能只需要几组配置（取决于有多少个不同的 API Key）
- ✅ 对用户透明，`list_knowledge_bases` 显示所有独立的知识库
- ✅ 符合 API 限制
- ✅ 易于维护（修改 API Key 只需改一处）

#### 缺点
- ❌ 配置结构稍复杂
- ❌ 需要额外的展开逻辑

---

## 使用流程

### 1. 配置知识库
管理员在 `knowledge_bases.json` 中配置所有知识库。

### 2. 列出可用知识库
用户（或 LLM）调用 `list_knowledge_bases` 工具：
```json
{
  "name": "list_knowledge_bases"
}
```

返回：
```json
[
  {"id": "kb_pancrepal", "name": "PancrePal 胰腺癌知识库", "description": "..."},
  {"id": "kb_diabetes", "name": "糖尿病知识库", "description": "..."},
  {"id": "kb_cardiology", "name": "心血管疾病知识库", "description": "..."}
  // ... 共 20 个
]
```

### 3. 搜索特定知识库
用户（或 LLM）选择一个知识库进行搜索：
```json
{
  "name": "search_knowledge",
  "arguments": {
    "kb_id": "kb_pancrepal",
    "question": "胰腺癌术后多少天后启动化疗？"
  }
}
```

系统：
1. 根据 `kb_id` 找到对应的 API Key 和 Topic ID
2. 调用 Get Notes API，传递单个 Topic ID
3. 返回搜索结果

### 4. 多知识库搜索（可选）
如果 LLM 判断需要在多个知识库中搜索同一个问题：
```
第1次调用: kb_id="kb_pancrepal" + question
第2次调用: kb_id="kb_diabetes" + question
第3次调用: kb_id="kb_cardiology" + question
```

LLM 综合所有结果后给出答案。

---

## 环境变量支持

### 简单配置（单知识库）
```bash
GET_API_KEY="your_key"
GET_NOTE_TOPIC_ID="your_topic_id_1"
```

系统自动创建一个名为 `default_env_kb` 的知识库。

### 复杂配置（多知识库）
使用 `GET_KNOWLEDGE_BASES` 环境变量（JSON 格式）：

**方案1格式：**
```bash
GET_KNOWLEDGE_BASES='[
  {"id":"kb1","name":"KB 1","config":{"api_key":"KEY_1","topic_id":"topic1"}},
  {"id":"kb2","name":"KB 2","config":{"api_key":"KEY_1","topic_id":"topic2"}}
]'
```

**方案3格式：**
```bash
GET_KNOWLEDGE_BASES='[
  {
    "id":"group1",
    "name":"Group 1",
    "config":{
      "api_key":"KEY_1",
      "topics":[
        {"id":"kb1","name":"KB 1","topic_id":"topic1"},
        {"id":"kb2","name":"KB 2","topic_id":"topic2"}
      ]
    }
  }
]'
```

---

## 技术实现要点

### 配置加载（方案3）
```javascript
// src/config/knowledgeBases.js
function expandKnowledgeBases(rawConfig) {
  const expanded = [];
  
  for (const group of rawConfig) {
    if (group.config.topics) {
      // 展开分组配置
      for (const topic of group.config.topics) {
        expanded.push({
          id: topic.id,
          name: topic.name,
          description: topic.description,
          config: {
            api_key: group.config.api_key,
            api_endpoint: group.config.api_endpoint,
            topic_id: topic.topic_id
          }
        });
      }
    } else {
      // 保留普通配置
      expanded.push(group);
    }
  }
  
  return expanded;
}
```

### 工具调用
```javascript
// index.js
case 'search_knowledge': {
  const { kb_id, ...params } = args;
  const kb = getKnowledgeBaseById(kb_id);
  
  const client = new ApiClient({
    apiKey: kb.config.api_key,
    baseUrl: kb.config.api_endpoint
  });
  
  // 只传递单个 topic_id
  params.topic_ids = [kb.config.topic_id];
  
  const response = await client.searchKnowledge(params);
  return { content: [{ type: 'text', text: JSON.stringify(response.data) }] };
}
```

---

## 推荐方案

**推荐使用方案3（分组配置 + 自动展开）**，原因：

1. **配置效率高**：20 个知识库可能只需要 3-5 组配置（取决于有多少个不同的 API Key）
2. **易于维护**：修改 API Key 只需改一处
3. **用户体验好**：`list_knowledge_bases` 显示所有独立的知识库，用户无需关心底层分组
4. **符合 API 限制**：每次只查询一个 Topic ID
5. **灵活性强**：既支持分组配置，也支持独立配置（方案1），两者可以混用

---

## 后续优化方向

1. **智能路由**：LLM 根据问题自动选择最相关的知识库
2. **并行搜索**：支持同时搜索多个知识库并合并结果（需要 LLM 多次调用工具）
3. **缓存机制**：对常见问题的搜索结果进行缓存
4. **知识库元数据**：添加标签、分类等元数据，帮助 LLM 更好地选择知识库
