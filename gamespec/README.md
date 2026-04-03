# GameSpec 快速入门 / Quick Start Guide

> 5 分钟学会使用 GameSpec 游戏策划文档标准

---

## 什么是 GameSpec？ / What is GameSpec?

GameSpec 是一套游戏策划文档标准，参考 OpenSpec 规范驱动开发思想设计，帮助游戏团队：

- **规范文档格式** - 统一的模板，减少沟通成本
- **追踪设计变更** - Delta 机制记录每次修改
- **场景驱动验证** - 每个规则都有具体场景验证
- **多语言支持** - 中英双语模板，支持本地化

---

## 快速开始 / Getting Started

### 1. 创建目录结构

使用 CLI 工具一键初始化：

```bash
gamespec init 我的游戏
```

这将自动创建以下中文目录结构：

```
gamespec/
├── 项目/
│   └── 我的游戏/
├── 模板/
├── 核心/
└── prompts/
```

### 2. 开始设计

使用专家助手引导设计：

```bash
# 呼叫制作人助手
gamespec ask producer
```

或者直接基于模板创建文档：

```bash
cp gamespec/模板/系统设计规范.md gamespec/项目/我的游戏/07_系统设计_战斗.md
```

### 3. 验证与检查

```bash
gamespec check gamespec/项目/我的游戏
```

---

## 核心概念 / Core Concepts

### 设计先行 / Design First

在开始写文档前，**必须** 阅读 [玩法设计标准 / Gameplay Design Standard](../01_规范标准/玩法设计标准.md)。

- **好玩不是玄学**：使用 3C 手感、心流曲线等科学指标来设计。
- **验证清单**：每份文档写完后，使用标准中的 Checklist 自查。

### 规则 + 场景 / Rule + Scenario

每个设计规则必须有至少一个场景验证：

```markdown
### 规则: 技能冷却 / Rule: Skill Cooldown

玩家 **必须** 在技能冷却完成后才能再次释放同一技能。

#### 场景: 冷却中尝试释放 / Scenario: Cast during cooldown

- **当 / WHEN** 玩家在冷却期间点击技能
- **则 / THEN** 技能释放失败
- **且 / AND** 显示冷却剩余时间
```

### 关键字 / Keywords

| 关键字 | 含义 | 使用场景 |
|--------|------|----------|
| **必须 / MUST** | 强制要求 | 核心规则 |
| **应该 / SHOULD** | 推荐做法 | 最佳实践 |
| **可以 / MAY** | 可选功能 | 扩展内容 |
| **禁止 / MUST NOT** | 明确禁止 | 安全限制 |

### 变更追踪 / Change Tracking

当需要修改设计时，创建变更提案：

```
gamespec/changes/add-combo-system/
├── proposal.md       # 为什么要改，改什么
├── tasks.md          # 实现任务清单
└── specs/            # Delta 规范
    └── combat/
        └── spec.md   # 增量变更
```

Delta 规范使用以下标记：

```markdown
## 新增规则 / ADDED Rules
[新增的规则内容]

## 修改规则 / MODIFIED Rules
[修改后的完整规则]

## 移除规则 / REMOVED Rules
[要移除的规则]
```

---

## 文档类型速查 / Document Types

| 类型 | 模板 | 用途 |
|------|------|------|
| 创意验证 | `01_创意验证书.md` | 验证需求真实性与媒介契合度 |
| 游戏概念 | `02_游戏概念书.md` | 定义愿景、支柱、核心循环 |
| 系统架构 | `03_系统架构图.md` | 定义模块清单与内容量级 |
| 核心玩法 | `04_核心玩法规范.md` | 定义单局体验与原子操作 |
| 世界观 | `05_世界观规范.md` | 定义 21 维度世界观图谱 |
| 叙事 | `06_叙事规范.md` | 定义主题、角色弧光与节拍表 |
| 系统设计 | `系统设计规范.md` | 通用系统设计（战斗、经济、社交等） |
| 内容规划 | `内容规划规范.md` | 量化资产需求与排期 |
| 关卡设计 | `关卡设计规范.md` | 定义空间拓扑与节奏切片 |
| 数值配置 | `数值配置规范.md` | 定义公式、模型与表结构 |

---

## 工作流程 / Workflow

```
1. 需求分析
   └── 确定需要哪类文档

2. 选择模板
   └── 从 templates/ 复制对应模板

3. 填写规范
   ├── 写概述（50-200字）
   ├── 定义规则（使用 必须/MUST）
   ├── 添加场景（每规则至少1个）
   └── 补充引用（配置表、资源）

4. 评审验证
   ├── 检查格式完整性
   ├── 确认场景覆盖
   └── 审批通过

5. 如需修改
   ├── 创建 changes/[id]/ 目录
   ├── 编写 proposal.md
   ├── 编写 Delta 规范
   └── 更新 tasks.md

6. 完成归档
   └── 移动到 changes/archive/
```

---

## 命名规范速查 / Naming Quick Reference

### 文件命名

- **强制中文**：`战斗系统.md`, `05_世界观规范.md`
- **避免**：`combat-system.md` (除非是 Git 分支名或配置表文件名)

### ID 命名

代码引用的 ID 建议使用大写英文。

| 类型 | 格式 | 示例 |
|------|------|------|
| 系统 | `SYS_[NAME]` | `SYS_COMBAT` |
| 关卡 | `LVL_[CH]_[NUM]` | `LVL_01_001` |

---

## 验证清单 / Validation Checklist

每份文档提交前检查：

- [ ] 概述 50-200 字
- [ ] 至少一条规则
- [ ] 每规则至少一个场景
- [ ] 规则使用 必须/MUST 或 应该/SHOULD
- [ ] 配置表有明确引用路径
- [ ] 本地化文本使用 LOC_ 键值

---

## 示例项目结构 / Example Structure

```
gamespec/
├── project.md                      # 项目概述
├── glossary.md                     # 术语表
│
├── systems/
│   ├── combat/
│   │   └── spec.md                 # 战斗系统规范
│   └── inventory/
│       └── spec.md                 # 背包系统规范
│
├── numerics/
│   └── combat/
│       └── spec.md                 # 战斗数值规范
│
├── levels/
│   └── lvl-01-001/
│       └── spec.md                 # 第一章第一关
│
├── quests/
│   └── main-story/
│       └── spec.md                 # 主线任务
│
├── ui/
│   └── battle-hud/
│       └── spec.md                 # 战斗界面
│
├── assets/
│   ├── art/
│   │   └── characters/
│   │       └── spec.md             # 角色美术需求
│   └── audio/
│       └── combat/
│           └── spec.md             # 战斗音效需求
│
├── changes/
│   ├── add-combo-system/           # 进行中的变更
│   │   ├── proposal.md
│   │   ├── tasks.md
│   │   └── specs/
│   │       └── combat/
│   │           └── spec.md
│   └── archive/                    # 已完成的变更
│       └── 2026-01-01-add-skills/
│
└── templates/                      # 模板文件
    ├── system-spec.md
    ├── numeric-spec.md
    ├── level-spec.md
    ├── quest-spec.md
    ├── ui-spec.md
    ├── asset-spec.md
    └── change-proposal.md
```

---

## 常见问题 / FAQ

### Q: 小改动也需要创建变更提案吗？

不需要。以下情况可以直接修改规范：
- 修复错别字
- 补充说明文字
- 调整格式

需要创建变更提案的情况：
- 新增/修改/删除规则
- 影响多个系统
- 破坏性变更

### Q: 数值应该写在文档里还是 Excel？

推荐外链式：文档写设计意图，具体数值在 Excel 配置。
- 文档：公式含义、设计目标、验证场景
- Excel：具体参数、配置表

### Q: 如何处理跨系统的设计？

在每个相关系统的规范中添加"关联系统"引用，并在变更提案中列出所有影响范围。

---

## 更多资源 / Resources

- 完整规范文档：`游戏规范标准.md`
- 模板文件目录：`templates/`
- 参考项目：OpenSpec (`../规范要求.md`)

---

*GameSpec v1.0.0*
