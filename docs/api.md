# API 文档

本文档基于当前代码（`src/server.js` + `src/apiHandlers.js`）整理。

## 统一说明

- Base URL：你的 Worker 域名（如 `https://xxx.workers.dev`）
- 返回格式：成功通常为 JSON；失败通常为纯文本错误
- 认证方式：`mailfree-session` Cookie（服务端签发）
- 权限规则：
  - `/api/login`、`/api/logout`、`/api/session` 无需预先认证
  - 其余 `/api/*` 需要已登录会话
  - `guest` 登录后走演示模式（大量写操作会被拒绝或只改内存）

---

## 1. 认证接口

### `POST /api/login`

登录并设置会话 Cookie。

请求体：

```json
{
  "username": "admin",
  "password": "your-password"
}
```

成功示例：

```json
{
  "success": true,
  "role": "admin",
  "can_send": 1,
  "mailbox_limit": 9999
}
```

说明：

- 严格管理员：`username == ADMIN_NAME` 且密码匹配 `ADMIN_PASSWORD`
- 访客：`username == guest` 且密码匹配 `GUEST_PASSWORD`
- 普通/高级用户：来自 `users` 表

---

### `POST /api/logout`

清理会话 Cookie。

成功示例：

```json
{ "success": true }
```

---

### `GET /api/session`

获取当前会话信息。

成功示例：

```json
{
  "authenticated": true,
  "role": "admin",
  "username": "admin",
  "strictAdmin": true
}
```

未登录：`401 Unauthorized`

---

## 2. 域名管理

### `GET /api/domains`

获取当前可用域名列表（数据库 `domains`）。

成功示例：

```json
["mail.example.com", "tmp.example.net"]
```

---

### `POST /api/domains`

新增域名。

权限：严格管理员（演示模式 guest 可改 mock 数据）

请求体：

```json
{ "domain": "mail.example.com" }
```

成功示例：

```json
{ "success": true, "domain": "mail.example.com" }
```

常见错误：

- `400 缺少 domain 参数`
- `400 域名格式不正确`
- `400 域名已存在`
- `403 Forbidden`

---

### `DELETE /api/domains?domain=mail.example.com`

删除域名。

权限：严格管理员（演示模式 guest 可改 mock 数据）

成功示例：

```json
{ "success": true, "domain": "mail.example.com" }
```

常见错误：

- `400 至少保留一个域名`
- `404 域名不存在`
- `403 Forbidden`

---

## 3. 邮箱管理

### `GET /api/generate?length=8&domainIndex=0&prefix=banana`

按规则生成邮箱地址。

参数：

- `length`：随机字符串长度，范围 `1-30`（默认 8）
- `domainIndex`：域名下标（默认 0）
- `prefix`：可选前缀，允许 `a-zA-Z0-9._-`，最多 32

成功示例：

```json
{
  "email": "bananaxxxxxxxx@mail.example.com",
  "expires": 1743499298000
}
```

常见错误：

- `400 非法前缀`
- `400 暂无可用域名，请先在管理页配置域名`
- `400 已达到邮箱上限`

---

### `POST /api/create`

自定义本地部分创建邮箱。

请求体：

```json
{
  "local": "myname",
  "domainIndex": 0
}
```

说明：

- `local` 规则：`^[a-z0-9._-]{1,64}$`

成功示例：

```json
{
  "email": "myname@mail.example.com",
  "expires": 1743499298000
}
```

---

### `GET /api/mailboxes?limit=10&offset=0`

获取邮箱历史列表。

参数：

- `limit`：最多 100
- `offset`：偏移量

成功示例：

```json
[
  {
    "address": "abc@mail.example.com",
    "created_at": "2026-04-01 10:00:00",
    "is_pinned": 1
  }
]
```

---

### `POST /api/mailboxes/pin?address=abc@mail.example.com`

切换指定邮箱置顶状态。

成功示例：

```json
{ "success": true, "is_pinned": 1 }
```

---

### `DELETE /api/mailboxes?address=abc@mail.example.com`

删除邮箱及其邮件。

权限：

- 严格管理员：可删任意邮箱
- 高级用户（role=admin）：仅可删自己绑定的邮箱

成功示例：

```json
{ "success": true, "deleted": true }
```

---

### `GET /api/user/quota`

获取当前用户邮箱配额。

成功示例：

```json
{ "used": 2, "limit": 10 }
```

---

## 4. 收件邮件接口

### `GET /api/emails?mailbox=abc@mail.example.com`

获取邮箱邮件列表（最多 50 条）。

成功示例：

```json
[
  {
    "id": 1,
    "sender": "noreply@test.com",
    "subject": "验证码",
    "received_at": "2026-04-01 10:20:30",
    "is_read": 0,
    "preview": "Your code is...",
    "verification_code": "123456"
  }
]
```

---

### `GET /api/emails/batch?ids=1,2,3`

批量查询邮件详情字段。

---

### `GET /api/email/:id`

获取单封邮件详情，并将该邮件标记为已读。

成功示例（字段会因数据来源略有差异）：

```json
{
  "id": 1,
  "sender": "noreply@test.com",
  "to_addrs": "abc@mail.example.com",
  "subject": "验证码",
  "preview": "...",
  "received_at": "2026-04-01 10:20:30",
  "is_read": 1,
  "content": "...",
  "html_content": "...",
  "download": "/api/email/1/download"
}
```

---

### `GET /api/email/:id/download`

下载原始 EML（从 R2 获取）。

常见错误：

- `404 未找到对象`
- `500 R2 未绑定`

---

### `DELETE /api/email/:id`

删除单封邮件。

成功示例：

```json
{
  "success": true,
  "deleted": true,
  "message": "邮件已删除"
}
```

---

### `DELETE /api/emails?mailbox=abc@mail.example.com`

清空某个邮箱的全部邮件。

成功示例：

```json
{
  "success": true,
  "deletedCount": 5,
  "previousCount": 5
}
```

---

## 5. 发件（Resend）接口

说明：

- 需要配置 `RESEND_API_KEY`
- 当前用户需具备发件权限（`can_send=1`），严格管理员默认允许

### `POST /api/send`

发送单封邮件。

请求体示例：

```json
{
  "from": "no-reply@mail.example.com",
  "fromName": "Mailfree",
  "to": ["user@example.com"],
  "subject": "hello",
  "html": "<p>hello</p>",
  "text": "hello",
  "scheduledAt": "2026-04-01T10:30:00.000Z"
}
```

成功示例：

```json
{ "success": true, "id": "re_xxx" }
```

---

### `POST /api/send/batch`

批量发送。

请求体：数组，每项结构同 `/api/send`。

成功示例：

```json
{ "success": true, "result": [] }
```

---

### `GET /api/send/:id`

查询 Resend 侧发送状态（透传 Resend 返回）。

---

### `PATCH /api/send/:id`

更新发送任务：

- 仅更新本地状态：`{ "status": "canceled" }`
- 更新定时发送时间：`{ "scheduledAt": "...ISO..." }`

---

### `POST /api/send/:id/cancel`

取消发送（调用 Resend cancel）。

---

### `GET /api/sent?from=abc@mail.example.com`

查询发件记录列表（本地数据库）。

---

### `GET /api/sent/:id`

查询发件记录详情（本地数据库）。

---

### `DELETE /api/sent/:id`

删除发件记录（本地数据库）。

---

## 6. 用户管理接口（严格管理员）

### `GET /api/users?limit=50&offset=0`

获取用户列表。

---

### `POST /api/users`

创建用户。

请求体示例：

```json
{
  "username": "alice",
  "password": "123456",
  "role": "user",
  "mailboxLimit": 10
}
```

---

### `PATCH /api/users/:id`

更新用户字段（当前后端支持以下字段）：

- `mailboxLimit`
- `role` (`user`/`admin`)
- `can_send` (`0/1`)
- `password`

---

### `DELETE /api/users/:id`

删除用户（会清理用户与邮箱绑定关系，不删除邮箱实体和邮件实体）。

---

### `POST /api/users/assign`

给用户分配邮箱。

请求体：

```json
{
  "username": "alice",
  "address": "alice@mail.example.com"
}
```

---

### `GET /api/users/:id/mailboxes`

查询某用户已绑定邮箱列表。

---

### `POST /api/users/:id/mailboxes/clear`

清空指定用户名下全部邮箱绑定，并尽可能删除相关数据。

权限：严格管理员。

返回示例：

```json
{
  "success": true,
  "clearedBindings": 6,
  "deletedMailboxes": 6,
  "deletedMessages": 42,
  "deletedSentRecords": 5,
  "skippedSharedMailboxes": 0
}
```

说明：

- 若某邮箱仍被其他用户绑定，该邮箱及其数据会被跳过，仅清除当前用户绑定关系。

---

## 7. 调试用收件入口

### `POST /receive`

用于手动写入一封邮件（JSON），常用于调试。

请求体示例：

```json
{
  "to": "abc@mail.example.com",
  "from": "noreply@test.com",
  "subject": "验证码",
  "text": "Your code is 123456",
  "html": "<p>Your code is <b>123456</b></p>"
}
```

注意：该入口在 `fetch` 路由下，需有效会话 Cookie；真实邮件接收主流程是 Worker `email()` 事件。

---

## 8. 常见状态码

- `200` 成功
- `400` 参数错误 / 业务校验失败
- `401` 未登录或会话失效
- `403` 权限不足
- `404` 资源不存在
- `500` 服务端错误
