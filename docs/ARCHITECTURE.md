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

## 12. MVP3 最小正式架構

Decision D-017 與 `docs/PRODUCTION-BASELINE.md` 是 Epic #31 的當前 Production 架構。前述較廣 Blueprint 領域仍可作未來參考，但不得把 Service、Membership、Calendar、Payment 或通知功能帶入 MVP3。

```text
Customer / Staff browser
        |
        v
Production domain + HTTPS
        |
        v
Cloudflare Tunnel (Windows service, outbound only)
        |
        v
127.0.0.1 -> single Next.js / Node 24 LTS process
        |
        +-- Public booking server boundary
        +-- Staff auth / schedule server boundary
        |
        v
Repository ports -> SQLite adapter -> local NTFS SQLite WAL
                                      |
                                      v
                              encrypted off-PC backup
```

### 12.1 Application boundary

- 保留 `/`、`/booking`、`/staff/login`、`/staff` 與現有 UI 模組，不建立第二套前後端專案。
- 採 Modular Monolith；UI 不直接存取資料庫，browser adapter 與 production HTTP／server adapter 經同一 application port。
- Same-site internal server boundary 只提供 availability 與 booking create；Staff boundary 提供登入、session、schedule/history read、entry create 與 note update。這不是第三方／公開產品 API。
- 所有 Production 寫入由伺服器指派 ID、來源與 timestamp，並重驗 `Asia/Taipei`、權限、idempotency、版本與時段衝突。

### 12.2 Minimal relational model

#33 建立 App-owned schema：

- `staff_members`
- `service_definitions`（只含 immutable `standard_booking`）
- `staff_availability_windows`
- `staff_time_blocks`
- `schedule_entries`（`booking | note`）
- `idempotency_requests`
- `audit_events`
- `schema_migrations`

Booking 必須關聯 `standard_booking`、Staff、Customer data、time 與固定 `confirmed` status，並建立 `(staff_member_id, slot_date, slot_time)` 的條件唯一約束；manual note 不占用該約束。每位 Staff 有獨立 availability window 與 time-block boundary，但 MVP3 不建立排班／請假 UI。現在的固定 slot 不建立服務目錄、價格、可變 duration 或狀態操作 UI。

#34 選定並固定 Better Auth 版本後，才以新 migration 加入該版本產生並經 review／checksum 的 user／account／session／username schema 與 `auth_rate_limits`；不得由 #33 預建或在 Production 臨時執行套件 CLI。

### 12.3 Identity and authorization

- Better Auth + `better-sqlite3` + Username plugin 隔離於 Identity adapter。
- 公開註冊、重設密碼、外部 SSO 與帳號管理 UI 關閉；帳號由受控 CLI 建立。
- Owner／Staff 第一版具有相同 schedule／booking／note workspace 能力；每個 server data operation 仍須依 session 與 central policy 檢查。
- Staff member 使用 opaque ID，`owner | staff` 是 role 而不是 ID；#34 以唯一 Auth user FK 連結 active Staff member，停用時撤銷全部 Sessions。
- Proxy redirect 只改善 UX，不是正式授權邊界。

### 12.4 Host and recovery boundary

- Next.js 只監聽 loopback，公開流量只經 Tunnel 與 HTTPS。
- Staging／Production 分離 DB、secret、hostname 與 service config。
- SQLite 僅限固定本機 NTFS、WAL、`synchronous=FULL`、foreign keys、busy timeout 與單一 writer process。
- 所有 DB consumers 使用同一 connection factory；booking time 正規化為分鐘整數，partial unique index 只限制 booking，versioned note update 以受影響列數判定 409。
- 備份使用 SQLite online backup，不複製使用中的裸資料檔；還原、integrity check、restart 與 rollback 必須在 #36 演練。
- Cloudflare 會處理連線 metadata；collection notice、trusted proxy headers、跨境處理與 DPA 必須在 #36 驗證，不得宣稱只有本機 Staff 接觸所有 request metadata。
