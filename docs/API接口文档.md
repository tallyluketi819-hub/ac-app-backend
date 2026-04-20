# API 接口文档

**项目名称：** 面向大学生的校园记账微信小程序

**文档版本：** V1.0

**编写日期：** 2026年3月

**接口基础URL：** `http://localhost:3000`

**接口风格：** RESTful

**数据格式：** JSON

---

## 目录

1. 认证模块 `/api/auth`
2. 账单模块 `/api/bills`
3. 分账模块 `/api/groups`
4. 校园画像模块 `/api/campus`

---

## 通用说明

### 鉴权方式

需要鉴权的接口，请求时须在 HTTP Header 中携带以下字段：

```
Authorization: Bearer <token>
```

其中 `<token>` 为用户登录后服务端返回的 JWT Token。Token 有效期为 **7天**，过期后需重新登录获取。

### 统一响应格式

```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

请求失败时 `success` 为 `false`，`data` 为 `null`，`message` 为错误描述。

---

## 1. 认证模块 `/api/auth`

### 1.1 用户注册

**请求方式：** `POST /api/auth/register`

**是否需要鉴权：** 否

#### 请求参数（Body，application/json）

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| phone | String | 是 | 手机号，作为登录账号，全局唯一，格式：11位数字 |
| password | String | 是 | 登录密码，长度6~20位 |
| name | String | 是 | 用户昵称，长度2~20位 |
| school | String | 否 | 所在学校名称 |
| grade | String | 否 | 年级，如"2023级"、"大三" |

#### 响应示例

**注册成功（HTTP 200）：**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "张三",
      "phone": "13800138000",
      "school": "某某大学",
      "grade": "2023级"
    }
  },
  "message": "注册成功"
}
```

**手机号已注册（HTTP 400）：**

```json
{
  "success": false,
  "data": null,
  "message": "该手机号已被注册"
}
```

**参数格式错误（HTTP 400）：**

```json
{
  "success": false,
  "data": null,
  "message": "手机号格式不正确"
}
```

---

### 1.2 用户登录

**请求方式：** `POST /api/auth/login`

**是否需要鉴权：** 否

#### 请求参数（Body，application/json）

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| phone | String | 是 | 注册时使用的手机号 |
| password | String | 是 | 登录密码 |

#### 响应示例

**登录成功（HTTP 200）：**

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "name": "张三",
      "phone": "13800138000",
      "school": "某某大学",
      "grade": "2023级",
      "avatar": "https://example.com/avatar.jpg"
    }
  },
  "message": "登录成功"
}
```

**密码错误（HTTP 401）：**

```json
{
  "success": false,
  "data": null,
  "message": "手机号或密码错误"
}
```

---

### 1.3 获取个人信息

**请求方式：** `GET /api/auth/profile`

**是否需要鉴权：** **是**（需携带 Authorization Header）

#### 请求参数

无请求体参数。

#### 响应示例

**获取成功（HTTP 200）：**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "张三",
    "phone": "13800138000",
    "school": "某某大学",
    "grade": "2023级",
    "avatar": "https://example.com/avatar.jpg",
    "created_at": "2025-09-01T08:00:00.000Z"
  },
  "message": "获取成功"
}
```

**Token 无效（HTTP 401）：**

```json
{
  "success": false,
  "data": null,
  "message": "未授权，请重新登录"
}
```

---

### 1.4 修改个人信息

**请求方式：** `PUT /api/auth/profile`

**是否需要鉴权：** **是**（需携带 Authorization Header）

#### 请求参数（Body，application/json）

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| name | String | 否 | 新的用户昵称 |
| school | String | 否 | 新的学校名称 |
| grade | String | 否 | 新的年级信息 |
| avatar | String | 否 | 新的头像图片URL |

#### 响应示例

**修改成功（HTTP 200）：**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "张三（已改名）",
    "phone": "13800138000",
    "school": "某某大学",
    "grade": "大四",
    "avatar": "https://example.com/new_avatar.jpg"
  },
  "message": "信息修改成功"
}
```

---

## 2. 账单模块 `/api/bills`

> 本模块所有接口均需要鉴权。

### 2.1 新增账单

**请求方式：** `POST /api/bills`

**是否需要鉴权：** **是**

#### 请求参数（Body，application/json）

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| amount | Number | 是 | 金额，单位：元，精确到小数点后两位，必须大于0 |
| type | String | 是 | 收支类型：`income`（收入）或 `expense`（支出） |
| category | String | 是 | 消费类别，如"餐饮"、"交通"、"购物"、"学习"、"娱乐"等 |
| date | String | 是 | 账单日期，格式：YYYY-MM-DD |
| note | String | 否 | 备注说明，最大200个字符 |

#### 响应示例

**新增成功（HTTP 200）：**

```json
{
  "success": true,
  "data": {
    "id": 42,
    "user_id": 1,
    "amount": "15.50",
    "type": "expense",
    "category": "餐饮",
    "note": "食堂午饭",
    "date": "2026-03-08",
    "created_at": "2026-03-08T12:30:00.000Z"
  },
  "message": "账单添加成功"
}
```

---

### 2.2 获取账单列表

**请求方式：** `GET /api/bills`

**是否需要鉴权：** **是**

#### 请求参数（Query String）

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| month | String | 否 | 按月份筛选，格式：YYYY-MM，如 `2026-03`。不传则返回所有账单 |

#### 响应示例

**获取成功（HTTP 200）：**

```json
{
  "success": true,
  "data": {
    "bills": [
      {
        "id": 42,
        "amount": "15.50",
        "type": "expense",
        "category": "餐饮",
        "note": "食堂午饭",
        "date": "2026-03-08"
      },
      {
        "id": 41,
        "amount": "2000.00",
        "type": "income",
        "category": "生活费",
        "note": "父母转账",
        "date": "2026-03-01"
      }
    ],
    "total": 2
  },
  "message": "获取成功"
}
```

---

### 2.3 修改账单

**请求方式：** `PUT /api/bills/:id`

**是否需要鉴权：** **是**

#### 路径参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | Number | 是 | 要修改的账单ID |

#### 请求参数（Body，application/json）

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| amount | Number | 否 | 修改后的金额 |
| type | String | 否 | 修改后的收支类型 |
| category | String | 否 | 修改后的消费类别 |
| date | String | 否 | 修改后的账单日期（YYYY-MM-DD） |
| note | String | 否 | 修改后的备注 |

#### 响应示例

**修改成功（HTTP 200）：**

```json
{
  "success": true,
  "data": {
    "id": 42,
    "amount": "18.00",
    "type": "expense",
    "category": "餐饮",
    "note": "食堂午饭+奶茶",
    "date": "2026-03-08"
  },
  "message": "账单修改成功"
}
```

**账单不存在或无权限（HTTP 403）：**

```json
{
  "success": false,
  "data": null,
  "message": "账单不存在或无权限操作"
}
```

---

### 2.4 删除账单

**请求方式：** `DELETE /api/bills/:id`

**是否需要鉴权：** **是**

#### 路径参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | Number | 是 | 要删除的账单ID |

#### 响应示例

**删除成功（HTTP 200）：**

```json
{
  "success": true,
  "data": null,
  "message": "账单删除成功"
}
```

---

### 2.5 获取统计数据

**请求方式：** `GET /api/bills/stats`

**是否需要鉴权：** **是**

#### 请求参数（Query String）

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| month | String | 否 | 统计月份，格式：YYYY-MM，默认为当前月份 |

#### 响应示例

**获取成功（HTTP 200）：**

```json
{
  "success": true,
  "data": {
    "month": "2026-03",
    "total_income": "2000.00",
    "total_expense": "856.50",
    "balance": "1143.50",
    "category_stats": [
      { "category": "餐饮", "amount": "420.00", "percentage": 49.1 },
      { "category": "交通", "amount": "86.50", "percentage": 10.1 },
      { "category": "购物", "amount": "200.00", "percentage": 23.4 },
      { "category": "学习", "amount": "150.00", "percentage": 17.5 }
    ]
  },
  "message": "获取成功"
}
```

---

## 3. 分账模块 `/api/groups`

> 本模块所有接口均需要鉴权。

### 3.1 创建群组

**请求方式：** `POST /api/groups`

**是否需要鉴权：** **是**

#### 请求参数（Body，application/json）

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| name | String | 是 | 群组名称，长度2~50位 |
| description | String | 否 | 群组描述，最多200字符 |

#### 响应示例

**创建成功（HTTP 200）：**

```json
{
  "success": true,
  "data": {
    "id": 5,
    "name": "寝室日常",
    "description": "寝室日常共同消费记账",
    "creator_id": 1,
    "created_at": "2026-03-08T10:00:00.000Z"
  },
  "message": "群组创建成功"
}
```

---

### 3.2 获取我的群组列表

**请求方式：** `GET /api/groups`

**是否需要鉴权：** **是**

#### 请求参数

无请求体参数。

#### 响应示例

**获取成功（HTTP 200）：**

```json
{
  "success": true,
  "data": [
    {
      "id": 5,
      "name": "寝室日常",
      "description": "寝室日常共同消费记账",
      "creator_id": 1,
      "member_count": 4,
      "created_at": "2026-03-08T10:00:00.000Z"
    },
    {
      "id": 3,
      "name": "毕业旅行基金",
      "description": "班级毕业旅行共同花费",
      "creator_id": 2,
      "member_count": 8,
      "created_at": "2026-01-15T09:00:00.000Z"
    }
  ],
  "message": "获取成功"
}
```

---

### 3.3 获取群组详情

**请求方式：** `GET /api/groups/:id`

**是否需要鉴权：** **是**

#### 路径参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | Number | 是 | 群组ID |

#### 响应示例

**获取成功（HTTP 200）：**

```json
{
  "success": true,
  "data": {
    "id": 5,
    "name": "寝室日常",
    "description": "寝室日常共同消费记账",
    "creator_id": 1,
    "members": [
      { "id": 1, "name": "张三", "phone": "138****8000" },
      { "id": 2, "name": "李四", "phone": "139****9001" },
      { "id": 3, "name": "王五", "phone": "137****7002" }
    ],
    "bills": [
      {
        "id": 10,
        "payer_id": 1,
        "payer_name": "张三",
        "amount": "60.00",
        "description": "买矿泉水",
        "created_at": "2026-03-07T20:00:00.000Z"
      }
    ],
    "debts": [
      {
        "id": 1,
        "from_user_id": 2,
        "from_user_name": "李四",
        "to_user_id": 1,
        "to_user_name": "张三",
        "amount": "20.00",
        "is_settled": 0
      }
    ]
  },
  "message": "获取成功"
}
```

---

### 3.4 添加群组成员

**请求方式：** `POST /api/groups/:id/members`

**是否需要鉴权：** **是**

#### 路径参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | Number | 是 | 群组ID |

#### 请求参数（Body，application/json）

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| phone | String | 是 | 要添加的成员手机号（须已在系统注册） |

#### 响应示例

**添加成功（HTTP 200）：**

```json
{
  "success": true,
  "data": {
    "user_id": 4,
    "name": "赵六",
    "phone": "136****6003",
    "joined_at": "2026-03-08T11:00:00.000Z"
  },
  "message": "成员添加成功"
}
```

**用户不存在（HTTP 404）：**

```json
{
  "success": false,
  "data": null,
  "message": "该手机号用户不存在"
}
```

**成员已在群组中（HTTP 400）：**

```json
{
  "success": false,
  "data": null,
  "message": "该用户已是群组成员"
}
```

---

### 3.5 添加群组账单

**请求方式：** `POST /api/groups/:id/bills`

**是否需要鉴权：** **是**

#### 路径参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | Number | 是 | 群组ID |

#### 请求参数（Body，application/json）

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| payer_id | Number | 是 | 实际付款人的用户ID，须为群组成员 |
| amount | Number | 是 | 本次共同消费总金额，单位：元 |
| description | String | 是 | 消费说明，最多200字符 |
| participants | Array | 是 | 参与分摊的用户ID数组，须均为群组成员，如 [1, 2, 3] |

#### 响应示例

**添加成功，债务自动更新（HTTP 200）：**

```json
{
  "success": true,
  "data": {
    "bill": {
      "id": 11,
      "group_id": 5,
      "payer_id": 1,
      "amount": "90.00",
      "description": "买火锅食材",
      "participants": [1, 2, 3],
      "created_at": "2026-03-08T18:00:00.000Z"
    },
    "updated_debts": [
      { "from_user_id": 2, "to_user_id": 1, "amount": "30.00" },
      { "from_user_id": 3, "to_user_id": 1, "amount": "30.00" }
    ]
  },
  "message": "账单添加成功，债务关系已更新"
}
```

---

### 3.6 结清债务

**请求方式：** `POST /api/groups/:id/debts/:debtId/settle`

**是否需要鉴权：** **是**

#### 路径参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | Number | 是 | 群组ID |
| debtId | Number | 是 | 要结清的债务记录ID |

#### 请求参数

无请求体参数。

#### 响应示例

**结清成功（HTTP 200）：**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "from_user_id": 2,
    "to_user_id": 1,
    "amount": "20.00",
    "is_settled": 1,
    "settled_at": "2026-03-08T20:00:00.000Z"
  },
  "message": "债务结清成功"
}
```

**债务已结清（HTTP 400）：**

```json
{
  "success": false,
  "data": null,
  "message": "该债务已结清，无需重复操作"
}
```

---

## 4. 校园画像模块 `/api/campus`

> 本模块所有接口均需要鉴权。返回的同校数据为匿名聚合统计，不涉及任何个人隐私信息。

### 4.1 获取同校统计数据

**请求方式：** `GET /api/campus/stats`

**是否需要鉴权：** **是**

#### 请求参数（Query String）

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| month | String | 否 | 统计月份，格式：YYYY-MM，默认为当前月份 |

#### 响应示例

**获取成功（HTTP 200）：**

```json
{
  "success": true,
  "data": {
    "school": "某某大学",
    "month": "2026-03",
    "sample_size": 128,
    "avg_total_expense": "1253.60",
    "median_total_expense": "1180.00",
    "category_avg": [
      { "category": "餐饮", "avg_amount": "520.00" },
      { "category": "交通", "avg_amount": "98.00" },
      { "category": "购物", "avg_amount": "320.00" },
      { "category": "学习", "avg_amount": "180.00" },
      { "category": "娱乐", "avg_amount": "135.60" }
    ]
  },
  "message": "获取成功"
}
```

**同校数据不足（HTTP 200）：**

```json
{
  "success": true,
  "data": null,
  "message": "同校数据不足（至少需要10名同校用户），暂无对比数据"
}
```

---

### 4.2 获取与同校对比数据

**请求方式：** `GET /api/campus/comparison`

**是否需要鉴权：** **是**

#### 请求参数（Query String）

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| month | String | 否 | 对比月份，格式：YYYY-MM，默认为当前月份 |

#### 响应示例

**获取成功（HTTP 200）：**

```json
{
  "success": true,
  "data": {
    "month": "2026-03",
    "health_score": 78,
    "personal_total": "856.50",
    "school_avg_total": "1253.60",
    "comparison": "偏低",
    "category_comparison": [
      {
        "category": "餐饮",
        "personal": "420.00",
        "school_avg": "520.00",
        "status": "正常"
      },
      {
        "category": "娱乐",
        "personal": "50.00",
        "school_avg": "135.60",
        "status": "偏低"
      }
    ],
    "score_breakdown": {
      "base": 60,
      "food_ratio": 10,
      "study_ratio": 5,
      "entertainment_ratio": 5,
      "balance": 10,
      "consistency": -5,
      "final": 85
    }
  },
  "message": "获取成功"
}
```
