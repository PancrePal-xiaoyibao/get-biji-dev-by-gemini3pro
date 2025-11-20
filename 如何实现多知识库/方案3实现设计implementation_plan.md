# 实现方案3：分组配置 + 自动展开

## 目标

实现支持分组配置的多知识库系统，允许共享 API Key 的知识库在配置中分组，但对用户呈现为独立的知识库。

## 用户审核要点

> [!IMPORTANT]
> **关键设计决策**
> 
> 1. **配置结构变更**：引入 `topics` 数组字段，允许一个配置组包含多个知识库
> 2. **自动展开机制**：系统加载时自动将分组配置展开为独立的知识库条目
> 3. **向后兼容**：保留对现有配置格式的支持（单个 `topic_id` 字段）
> 4. **API 调用**：确保每次只传递单个 `topic_id`（符合 API 限制）

## 实施变更

### 1. 配置加载器 (`src/config/knowledgeBases.js`)

#### [MODIFY] [knowledgeBases.js](file:///Users/qinxiaoqiang/Downloads/get_mcp_gemini3/src/config/knowledgeBases.js)

**变更内容：**
- 添加 `expandKnowledgeBases()` 函数，用于展开分组配置
- 修改 `loadKnowledgeBases()` 函数，在加载后调用展开逻辑
- 保留对现有配置格式的支持（`topic_id` 字段）

**展开逻辑：**
```javascript
function expandKnowledgeBases(rawConfig) {
  const expanded = [];
  
  for (const group of rawConfig) {
    if (group.config && group.config.topics && Array.isArray(group.config.topics)) {
      // 分组配置：展开为多个独立的知识库
      for (const topic of group.config.topics) {
        expanded.push({
          id: topic.id,
          name: topic.name,
          description: topic.description || '',
          config: {
            api_key: group.config.api_key,
            api_endpoint: group.config.api_endpoint || 'https://open-api.biji.com/getnote/openapi',
            topic_id: topic.topic_id
          }
        });
      }
    } else {
      // 普通配置：直接保留
      expanded.push(group);
    }
  }
  
  return expanded;
}
```

**规范化逻辑更新：**
- 移除 `topic_ids` 数组的支持（因为 API 不支持）
- 保留 `topic_id` 字段的规范化

---

### 2. 主入口文件 (`index.js`)

#### [MODIFY] [index.js](file:///Users/qinxiaoqiang/Downloads/get_mcp_gemini3/index.js)

**变更内容：**
- 确保 `search_knowledge` 和 `recall_knowledge` 只传递单个 `topic_id`
- 移除 `topic_ids` 数组的处理逻辑

**修改前：**
```javascript
if (kb.config.topic_ids && kb.config.topic_ids.length > 0) {
    params.topic_ids = kb.config.topic_ids;
}
```

**修改后：**
```javascript
if (kb.config.topic_id) {
    params.topic_ids = [kb.config.topic_id];  // API 要求数组格式，但只传一个
}
```

---

### 3. 配置文件示例 (`knowledge_bases.json`)

#### [MODIFY] [knowledge_bases.json](file:///Users/qinxiaoqiang/Downloads/get_mcp_gemini3/knowledge_bases.json)

**更新为方案3格式：**
```json
[
  {
    "id": "demo_group",
    "name": "示例知识库组",
    "description": "使用同一个 API Key 的示例知识库",
    "config": {
      "api_key": "YOUR_API_KEY_HERE",
      "api_endpoint": "https://open-api.biji.com/getnote/openapi",
      "topics": [
        {
          "id": "kb_example_1",
          "name": "示例知识库1",
          "description": "第一个示例知识库",
          "topic_id": "TOPIC_ID_1"
        },
        {
          "id": "kb_example_2",
          "name": "示例知识库2",
          "description": "第二个示例知识库",
          "topic_id": "TOPIC_ID_2"
        }
      ]
    }
  }
]
```

---

### 4. 测试文件 (`tests/multi_kb.test.js`)

#### [MODIFY] [multi_kb.test.js](file:///Users/qinxiaoqiang/Downloads/get_mcp_gemini3/tests/multi_kb.test.js)

**新增测试用例：**
1. 测试分组配置的展开功能
2. 测试展开后的知识库可以被正确检索
3. 测试混合配置（分组 + 普通配置）
4. 移除或更新 `topic_ids` 数组相关的测试

**示例测试：**
```javascript
test('should expand grouped configuration', async () => {
  process.env.GET_KNOWLEDGE_BASES = JSON.stringify([
    {
      id: 'group1',
      name: 'Group 1',
      config: {
        api_key: 'key1',
        topics: [
          { id: 'kb1', name: 'KB 1', topic_id: 'topic1' },
          { id: 'kb2', name: 'KB 2', topic_id: 'topic2' }
        ]
      }
    }
  ]);

  await loadKnowledgeBases();
  const kbs = getKnowledgeBases();
  
  // 应该展开为2个独立的知识库
  expect(kbs.length).toBeGreaterThanOrEqual(2);
  
  const kb1 = kbs.find(kb => kb.id === 'kb1');
  const kb2 = kbs.find(kb => kb.id === 'kb2');
  
  expect(kb1).toBeDefined();
  expect(kb1.config.api_key).toBe('key1');
  expect(kb1.config.topic_id).toBe('topic1');
  
  expect(kb2).toBeDefined();
  expect(kb2.config.api_key).toBe('key1');
  expect(kb2.config.topic_id).toBe('topic2');
});
```

---

### 5. 文档更新

#### [MODIFY] [README.md](file:///Users/qinxiaoqiang/Downloads/get_mcp_gemini3/README.md)

**更新内容：**
1. 添加方案3的配置示例（中英文）
2. 更新 `GET_KNOWLEDGE_BASES` 环境变量的示例
3. 说明分组配置的优势
4. 移除 `topic_ids` 数组的相关说明

**配置示例（中文部分）：**
```markdown
### 方式3：分组配置（推荐用于多知识库）

如果多个知识库共享同一个 API Key，可以使用分组配置：

\`\`\`json
[
  {
    "id": "medical_group",
    "name": "医学知识库组",
    "config": {
      "api_key": "YOUR_API_KEY",
      "topics": [
        {
          "id": "kb_pancrepal",
          "name": "PancrePal 胰腺癌知识库",
          "description": "专注于胰腺癌诊疗",
          "topic_id": "RYk1kmRJ"
        },
        {
          "id": "kb_diabetes",
          "name": "糖尿病知识库",
          "description": "糖尿病管理与治疗",
          "topic_id": "mnyV9OjY"
        }
      ]
    }
  }
]
\`\`\`

系统会自动将其展开为两个独立的知识库，用户可以通过 `kb_id` 分别访问。
```

#### [MODIFY] [walkthrough.md](file:///Users/qinxiaoqiang/.gemini/antigravity/brain/c9e06c74-54f7-4d3e-b409-3d7ef17ee2b2/walkthrough.md)

**更新内容：**
- 添加方案3的实现说明
- 更新测试结果
- 添加分组配置的使用示例

---

## 验证计划

### 自动化测试
1. 运行 `npm test tests/multi_kb.test.js` 验证所有测试通过
2. 确保新增的分组配置测试通过
3. 确保向后兼容性测试通过

### 手动验证
1. 使用 MCP Inspector 测试分组配置
2. 调用 `list_knowledge_bases` 验证展开后的知识库列表
3. 调用 `search_knowledge` 验证每个知识库可以独立搜索
4. 验证环境变量配置方式仍然有效

### 测试场景
1. **纯分组配置**：所有知识库都使用分组格式
2. **混合配置**：部分使用分组，部分使用普通格式
3. **环境变量配置**：验证 `GET_API_KEY` 和 `GET_NOTE_TOPIC_ID` 仍然有效
4. **真实 API 调用**：使用真实的 API Key 和 Topic ID 进行搜索

---

## 向后兼容性

> [!NOTE]
> **兼容性保证**
> 
> - ✅ 现有的单 `topic_id` 配置继续有效
> - ✅ 环境变量 `GET_API_KEY` 和 `GET_NOTE_TOPIC_ID` 继续有效
> - ✅ `GET_KNOWLEDGE_BASES` 环境变量支持新旧两种格式
> - ❌ 移除 `topic_ids` 数组支持（因为 API 不支持，会导致混淆）

---

## 实施顺序

1. ✅ 创建设计文档和实现计划
2. ⏳ 修改 `src/config/knowledgeBases.js` 添加展开逻辑
3. ⏳ 修改 `index.js` 确保只传递单个 `topic_id`
4. ⏳ 更新 `knowledge_bases.json` 示例
5. ⏳ 更新测试文件
6. ⏳ 运行测试验证
7. ⏳ 更新文档（README.md, walkthrough.md）
8. ⏳ 使用 MCP Inspector 进行手动验证
