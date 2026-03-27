## API 接口

### 🎲 邮箱管理
- `GET /api/generate` - 生成新的临时邮箱（支持自定义前缀）
  - 参数: `length`（随机字符串长度，1-30）、`domainIndex`（域名索引）、`prefix`（可选，邮箱前缀，仅字母/数字/._-，最多32位）
  - 返回: `{ "email": "bananaxxxxxxxx@domain.com", "expires": timestamp }`
- `GET /api/mailboxes` - 获取历史邮箱列表
  - 参数: `limit`（页面大小）, `offset`（偏移量）
  - 返回: 邮箱列表数组
- `DELETE /api/mailbox/{address}` - 删除指定邮箱
  - 返回: `{ "success": true }`

### 📧 邮件操作
- `GET /api/emails?mailbox=email@domain.com` - 获取邮件列表
  - 返回: 邮件列表数组，包含发件人、主题、时间等信息
- `GET /api/email/{id}` - 获取邮件详情
  - 返回: 完整的邮件内容，包括HTML和纯文本
- `DELETE /api/email/{id}` - 删除单个邮件
  - 返回: `{ "success": true, "deleted": true, "message": "邮件已删除" }`
- `DELETE /api/emails?mailbox=email@domain.com` - 清空邮箱所有邮件
  - 返回: `{ "success": true, "deletedCount": 5, "previousCount": 5 }`

### 🔐 认证相关
- `POST /api/login` - 用户登录
  - 参数: `{ "username": "用户名", "password": "密码" }`
  - 返回: `{ success: true, role, can_send, mailbox_limit }` 并设置会话 Cookie
- `POST /api/logout` - 用户退出
  - 返回: `{ "success": true }`

### 🔧 系统接口
- `GET /api/domains` - 获取可用域名列表
  - 返回: 域名数组

### 👤 用户管理（管理后台）
- `GET /api/users` - 获取用户列表
  - 返回: 用户数组（含 id/username/role/mailbox_limit/can_send/mailbox_count/created_at）
- `GET /api/users/{userId}/mailboxes` - 获取指定用户的邮箱列表
  - 返回: 邮箱数组（address/created_at）
- `POST /api/users` - 创建用户
  - 参数: `{ username, password, role }`（role: `user` | `admin`）
  - 返回: `{ success: true }`
- `PATCH /api/users/{userId}` - 更新用户
  - 参数示例: `{ username?, password?, mailboxLimit?, can_send?, role? }`
  - 返回: `{ success: true }`
- `DELETE /api/users/{userId}` - 删除用户
  - 返回: `{ success: true }`
- `POST /api/users/assign` - 给用户分配邮箱
  - 参数: `{ username, address }`
  - 返回: `{ success: true }`
