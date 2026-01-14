# MCP Get Notes 任务分解

## 核心任务

### 1. 环境搭建
- [x] 创建项目目录结构
- [x] 初始化package.json
- [x] 安装MCP SDK依赖
- [x] 配置ES modules支持
- [x] 设置代码格式化工具

### 2. 基础框架
- [x] 创建MCP服务器主入口文件
- [x] 实现基础的服务器配置
- [x] 添加日志记录功能
- [x] 创建错误处理中间件
- [x] 实现健康检查端点 (Implicit in MCP connection)
- [x] **实现限流器 (QPS < 2, Total < 5000)**

### 3. API客户端开发
- [x] 分析Get笔记API文档
- [x] 创建API客户端类
- [x] 实现认证机制 (Bearer Token)
- [x] 添加请求/响应拦截器
- [x] 实现重试机制

### 4. 数据模型定义
- [x] 定义搜索/召回请求参数类型 (In tool schemas)
- [x] 定义API响应类型
- [x] 创建数据验证函数 (Zod schemas)
- [x] 实现数据转换逻辑

### 5. MCP工具实现

#### 5.1 知识库搜索工具 (AI处理)
- [x] 实现 search_knowledge 工具
- [x] 支持 stream 模式处理 (Handled as JSON)
- [x] 参数验证 (question, topic_ids, etc.)

#### 5.2 知识库召回工具 (Raw Recall)
- [x] 实现 recall_knowledge 工具
- [x] 参数验证 (question, topic_id, top_k, etc.)

### 6. 测试开发

#### 6.1 单元测试
- [x] 测试API客户端
- [x] 测试数据验证函数
- [x] 测试限流器逻辑
- [x] 测试错误处理

#### 6.2 集成测试
- [x] 测试MCP服务器启动
- [x] 测试工具调用流程
- [x] 测试API集成
- [x] 测试限流效果

### 7. 文档编写
- [x] 编写API使用文档
- [x] 编写部署指南
- [x] 编写配置说明
- [x] **构建README文档**

### 8. 部署和优化
- [x] 配置生产环境
- [x] 优化响应时间

## 优先级排序
1. 环境搭建和基础框架 (含限流)
2. API客户端和数据模型
3. 核心MCP工具实现
4. 基础测试覆盖
5. 文档和使用说明

## 时间估算
- 基础开发：2-3天
- 测试完善：1-2天
- 文档编写：0.5天
- 总计：3-5天