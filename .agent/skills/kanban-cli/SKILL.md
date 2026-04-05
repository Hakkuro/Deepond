---
description: 使用 kanban-cli 命令行工具管理 Deepond 看板（创建/查看/修改看板、列、任务等）
---

# Kanban CLI

Deepond 看板的命令行接口。所有输出为 JSON `{ ok, data?, error? }`。

> **⚠️ 敏感信息由 `kanban.bat` 自动注入，你不需要处理 API Key。**

## 前置条件

用户需先完成一次性配置（复制 `.agent\skills\kanban-cli\.env.example` → `.agent\skills\kanban-cli\.env` 并填入 API Key）。
你无需关心此步骤，直接调用即可。

## 调用方式

**方式 A — CLI flags**

```bash
.agent\skills\kanban-cli\kanban.bat <resource> <action> [--key value]
```

**方式 B — JSON stdin（推荐，无需转义）**

```bash
echo '{"resource":"boards","action":"create","name":"Sprint 12"}' | .agent\skills\kanban-cli\kanban.bat
```

## 命令速查

| resource | action | 必需参数 | 可选参数 |
|---|---|---|---|
| boards | list | — | — |
| boards | get | `--id` | — |
| boards | create | `--name` | — |
| boards | rename | `--id --name` | — |
| boards | delete | `--id` | — |
| columns | add | `--boardId --title` | `--position` |
| columns | rename | `--id --title` | — |
| columns | delete | `--id` | — |
| tasks | add | `--columnId --content` | `--description --priority --dueDate --tags` |
| tasks | update | `--id` | `--content --description --priority --dueDate --tags --columnId --position` |
| tasks | delete | `--id` | — |
| collaborators | list | `--boardId` | — |
| collaborators | add | `--boardId --email` | `--permission` |
| collaborators | remove | `--boardId --userId` | — |
| board | export | `--id` | — |
| board | import | `--id --file` | — |
| users | list | — | — |
| users | find | `--email` 或 `--username` | — |
| api | call | `--method --path` | 任意 body 键值对 |

## 参数约定

- **ID**: UUID 格式（从前置命令的返回值中获取）
- **priority**: `low` / `medium` / `high`
- **tags**: 逗号分隔 `"bug,urgent"` 或 JSON 数组 `["bug","urgent"]`
- **permission**: `editor`（默认）/ `viewer`

## 典型工作流

```bash
# 1. 查看所有看板
.agent\skills\kanban-cli\kanban.bat boards list
# → 从返回的 data 中取出目标 board 的 id

# 2. 查看看板详情（含列和任务）
.agent\skills\kanban-cli\kanban.bat boards get --id <board-id>
# → 从返回的 columns 中取出目标 column 的 id

# 3. 添加任务
.agent\skills\kanban-cli\kanban.bat tasks add --columnId <column-id> --content "修复登录Bug" --priority high
```

## 注意事项

- 所有 ID 来自 API 返回值，无需手动构造
- 删除看板会级联删除所有列和任务，**不可恢复**
- 导入操作会**覆盖**目标看板的所有列和任务
