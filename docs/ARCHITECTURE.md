# DUM BARBERSHOP Platform — Architecture Baseline

狀態：Proposed Baseline  
原則：模組化、多人工作、可本機重現、外部整合可替換

---

## 1. 架構方向

第一階段採 **Modular Monolith + Monorepo**。先建立清楚領域邊界，不急著拆成微服務。

建議結構：

```text
dum-barbershop-platform/
├─ apps/
│  ├─ web/                  # 客人官方網站與預約 UI
│  └─ staff/                # 員工手機優先 PWA / 管理 UI
├─ packages/
│  ├─ domain-booking/       # 預約規則、狀態與可用時段
│  ├─ domain-customer/      # 客戶主檔與服務歷史
│  ├─ domain-membership/    # 會員預留模型
│  ├─ integrations/         # Calendar、通知、付款、供應商 Adapter
│  ├─ ui/                   # 共用設計系統與元件
│  ├─ config/               # TypeScript、Lint、環境設定
│  └─ test-utils/           # Mock、Fixture、測試工具
├─ docs/
├─ AGENTS.md
├─ README.md
└─ .env.example
```

實際建立時可依本機工具相容性調整，但領域邊界不可被合併成單一巨大頁面或單一 `utils`。

## 2. 建議技術基線

待本機驗證後鎖定版本：

- TypeScript
- Next.js App Router
- React
- Tailwind CSS 或集中式 Design Tokens
- pnpm workspace
- Turborepo（若確有需要）
- PostgreSQL 類關聯式資料庫（正式後端階段）
- Zod 類型驗證
- 單元測試 + 整合測試 + 關鍵 E2E

不得只因「最新」而選擇實驗性版本。

## 3. 核心 Domain

### Booking

主要實體：

- Location
- Barber / StaffMember
- Service
- StaffServiceCapability
- Schedule
- TimeBlock
- Availability
- Booking
- BookingStatus
- DepositStatus
- WaitlistEntry

Booking Domain 負責：

- 可用時段計算
- 重複預約防止
- 狀態轉換
- 服務時長與緩衝
- 設計師排班與封鎖
- 訂金優先的規則入口

### Customer

主要實體：

- Customer
- ContactMethod
- CustomerPreference
- ServiceHistory
- TechnicalNote
- Consent

### Membership

第一階段只保留：

- MemberIdentity
- ExternalMemberLink
- MembershipStatus
- Balance / Points / RemainingVisits 的抽象欄位

不得在未決策前加入正式扣點或儲值邏輯。

## 4. 應用層

### Customer Web

負責顯示與流程，不持有核心商業規則。

- 品牌頁面
- 服務與設計師
- 預約步驟
- 預約成功 / 失敗
- 會員預留入口

### Staff App

- 今日與全日行程
- 下一位客人
- 封鎖時段
- 搜尋客戶
- 更新預約狀態
- 權限感知 UI

## 5. Adapter 邊界

至少定義：

```ts
interface BookingProviderAdapter {}
interface CalendarAdapter {}
interface NotificationAdapter {}
interface PaymentAdapter {}
interface IdentityAdapter {}
interface MembershipAdapter {}
```

第一階段使用 Mock Adapter。正式供應商只能在 `packages/integrations` 或明確 integration module 實作。

## 6. Google Calendar 同步模型

目標方向：

- 預約核心 → Google Calendar：建立、更新、取消對應事件
- Google Calendar → 預約核心：把指定 Busy 事件轉成 TimeBlock
- 每個外部事件保存 Provider ID 與 Sync Metadata
- 同步需具備 Idempotency，避免重複事件
- 失敗需重試並保留錯誤，不得靜默遺失
- 預約核心仍保存完整預約與客戶紀錄

## 7. 時間與時區

- 營運顯示預設：`Asia/Taipei`
- 儲存使用帶時區的標準時間格式
- Availability 計算必須明確指定時區
- Google Calendar 同步需測試夏令時間、全天事件與跨日事件，即使目前店家位於台灣

## 8. 資料安全

- 客戶資料與公開內容分離
- Staff API 需要驗證與角色授權
- 敏感欄位不可進入前端公開 Bundle
- 日誌不得輸出完整電話、Token 或技術備註
- Apple Watch 與通知只顯示最少必要資訊
- 所有外部憑證透過環境變數或 Secret Manager

## 9. 稽核與可靠性

重要操作需保留 Audit Event：

- 建立 / 取消 / 改期預約
- 改變設計師或時間
- 封鎖時段
- 修改客戶備註
- 訂金狀態變更
- 員工權限變更

預約寫入需處理：

- Concurrent booking race
- Idempotency key
- Retry
- External provider timeout
- Partial failure

## 10. 第一階段 Mock 架構

第一階段不建立真實後端，但 Mock 必須模擬正式介面：

- `MockBookingRepository`
- `MockCalendarAdapter`
- `MockNotificationAdapter`
- `MockCustomerRepository`

頁面不得直接 import 一大包硬編碼資料後自行實作狀態規則。

## 11. 未來部署

部署方案尚未鎖定。評估時需滿足：

- Preview deployment
- Production / Staging 分離
- Environment variables
- Database backup
- Logs / Error monitoring
- Rollback
- Domain / HTTPS
- 台灣使用者的延遲與可用性
