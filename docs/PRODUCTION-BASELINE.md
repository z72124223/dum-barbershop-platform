# MVP3 Production Baseline

狀態：**Proposed / eight values approved / Production domain required / not activated**

提案日期：2026-08-01（Asia/Taipei）

Git authority：Epic #31、Issue #32、proposed Decision D-017

本文件把讓 MVP3 可以施工的最小正式上線選擇整理成一組 Owner approval proposal。Owner 於 2026-08-01 在 Codex 回覆「同意」，並已由 Codex 如實記錄於 [Issue #32](https://github.com/z72124223/dum-barbershop-platform/issues/32#issuecomment-5150975055)：八項提案、Owner 責任、個資窗口管理與 A／B 備份安排均已核准。正式 Production domain／hostname 尚未提供，因此 D-017 仍不得標為 Accepted、#32 不得完成、#33 不得開始。它不代表網站已公開、不授權輸入真實客戶資料，也不取代 #37 的正式 GO / NO-GO。

## 1. Owner-approved proposed decisions

| # | Owner 於 2026-08-01 核准的選擇 | 理由與界線 |
|---:|---|---|
| 1 | 此 Windows 電腦是第一版正式 origin；接受單機維護、停電或硬體故障期間會中斷服務。Owner 對營運負責，`production-maintainer` 角色執行維護；預設維護窗為每週一 03:00–04:00（台北時間）。 | 符合 Owner 要求與最快 MVP；#36 必須驗證自動重啟、備份還原與告警。實際維護者姓名不寫入 Git。 |
| 2 | 公開入口採 Cloudflare Tunnel：正式網域 / HTTPS → outbound-only tunnel → `127.0.0.1`。不做 router port-forward，不直接公開 Next.js 或資料庫 port。Staging 與 Production 使用不同 hostname。 | 降低家用網路、動態 IP、CGNAT 與入站防火牆設定耦合。正式 hostname 必須記錄於 #32；實際帳號與密鑰在 #36 以部署設定安全提供。 |
| 3 | MVP3 資料庫採本機固定 NTFS 磁碟上的 SQLite、WAL、單一 App process，Node driver 採 `better-sqlite3`；Repository port 保留 PostgreSQL 遷移能力。 | 適合單店低寫入量、部署最快；不得放在 OneDrive、NAS 或網路分享。第二個 App node、持續寫入壅塞或高可用需求出現時再遷移 PostgreSQL。 |
| 4 | 角色固定為 `owner` 與 `staff`，兩筆 Staff member 使用 server-generated opaque ID，公開標籤維持「老闆」與「職員」，不公開真實姓名。顯示包含今天在內的未來 7 個台北日；每日開始時段為 10:00–18:00、每格 60 分鐘，最後一格是 18:00–19:00。 | 角色、登入帳號與可被預約的人員是不同欄位；直接延續已驗收 UI，避免加入人物介紹、照片、服務目錄、價格或排班系統。手動註記不占用 booking slot。 |
| 5 | 客戶預約成功寫入共用資料庫後即自動成立；同一職員／日期／時段競態只允許一筆成功。 | 「待確認」會需要通知與狀態查詢，超出本 MVP；成功畫面必須只在 transaction commit 後出現。 |
| 6 | 客戶必填姓名與電話，可選填預約註記；系統另存職員、台北時段、來源、版本與必要 audit metadata。老闆／職員在受保護工作台具有相同資料可見權；公開端永不回傳客戶個資。可識別資料保留至預約日起 12 個月，之後刪除姓名、電話與客戶註記；備份中的刪除資料最多隨 28 日備份週期消失。 | 只收完成預約與聯絡所需資料。客戶可提出查詢、更正、停止利用或刪除請求；正式啟用前必須在預約頁提供蒐集告知。 |
| 7 | 正式登入採 Better Auth + SQLite + Username plugin，關閉公開註冊、重設密碼與帳號管理 UI；只由受控 CLI 建立一個老闆與一個職員帳號。Session 絕對期限 8 小時、不滑動延長、不使用 cookie session cache，停用帳號或重設密碼立即撤銷 Sessions。 | Next.js 建議使用 auth library；Provider 保持在 Identity adapter 後。兩角色第一版共用 schedule read/write 與 note update 權限，不自行增加 owner-only 功能。 |
| 8 | Staging／Production 分離 hostname、DB、secret 與 service config。每日 SQLite online backup 寫入兩顆 Owner 控制的加密卸除式磁碟 A／B，按週輪替且始終有一顆離機、離站保存；每月實際還原。RPO 24 小時；健康主機或已備妥替代主機的軟體／資料 RTO 4 小時，完整硬體更換不承諾 4 小時。外部監控告警送給具名 Owner，maintainer 可在資料或安全風險下依 runbook 回滾。 | 這是不用新增雲端備份 API 的最小 off-PC 目標。磁碟識別、告警地址、密碼與 recovery material 不進 Git；#36 必須驗證輪替、最大 28 日、解密還原與告警送達。 |

### Remaining Owner input

Issue #32 已記錄 Owner 對八項提案的核准，並確認：

1. GitHub Owner `@z72124223` 同時是 maintenance、alert recipient 與 rollback accountable owner。
2. 客戶個資請求聯絡管道由同一 Owner 管理；實際電話／Email 不寫入 Git，只在 Production config／頁面內容安全提供。
3. 採用兩顆加密卸除式磁碟 A／B、每週輪替且一顆離站的備份目的地。

唯一未完成輸入是正式 Production domain／hostname。這不是密碼；若尚未持有，#32 保持未完成。

## 2. Stable product contract

- Customer routes remain `/` and `/booking`; customers do not create accounts.
- Staff routes remain `/staff/login` and `/staff`.
- Timezone is always `Asia/Taipei`; UTC timestamps are stored alongside the Taipei operating date and time.
- A booking references the immutable internal `standard_booking` service, has explicit `confirmed` status, and occupies one fixed slot. This does not create a customer-facing service selector or status workflow.
- Each staff member has an independent availability schedule and time-block boundary. MVP3 seeds the same approved daily hours for both roles; there is no scheduling／leave UI in this milestone.
- A manual note can share a booking time and never blocks availability.
- The server assigns IDs, source, created timestamps and audit metadata, and rechecks elapsed time and conflicts.
- Writes use transactions, a database unique constraint and an `idempotency_requests` record in the same transaction. Note edits use a version for optimistic concurrency.
- Existing browser `localStorage` Mock data is never silently imported into Production.
- Production starts empty except for the two server-provisioned staff accounts and approved schedule configuration.

The initial fixed booking is an internal `standard_booking` record only. There is no customer-facing service selector, price, variable duration, cancellation flow or service catalog in MVP3.

## 3. Data governance

### Customer collection notice contract

Before #37 activation, `/booking` must clearly disclose:

- collector: DUM BARBERSHOP and the Owner-provided contact channel;
- purpose: create, operate and contact the customer about the selected appointment;
- data: name, phone, selected staff/date/time and optional note;
- period: 12 months from the appointment date, plus no more than 28 days in rotating backups;
- region and recipients: Taiwan origin plus Cloudflare's global network／processors, including connection-metadata processing that may occur in the United States or Europe; application records are available only to authenticated Owner／Staff;
- method of use: the same-site website sends the selected appointment data through HTTPS／Cloudflare Tunnel to the Taiwan origin, stores it in the booking database, and allows authenticated Staff to use it only for appointment administration and customer contact; no marketing use;
- rights and request channel: query／review, request a copy, supplement or correct, stop collection／processing／use, and request deletion through the Owner-provided contact channel;
- effect of not providing data: name and phone are required to create the booking; note is optional.

The policy follows the minimum-purpose, notice, correction and deletion boundaries in Taiwan's Personal Data Protection Act. This project record is an engineering baseline, not a substitute for professional legal review before public activation.

Cloudflare is an infrastructure processor, not a business recipient. #36 must record the accepted Cloudflare terms／DPA, enabled products, applicable metadata retention and cross-border boundary before activation.

### Staff visibility and logging

- Both roles may view customer name, phone and note only inside the authenticated workspace.
- Public availability returns only staff label, date, time and availability state.
- Audit events record actor, action, record ID, timestamp and version; they do not copy complete phone numbers or note text.
- Application, tunnel, health and error logs must redact secrets, session tokens, phone numbers and customer notes.
- Screenshots, Issues, PRs, tests and staging use fictional data only.

### Deletion and backup behavior

- A daily retention job anonymizes booking／customer-linked note rows as soon as the 12-month period is due by removing customer name, phone and customer note.
- A validated deletion request for a future booking anonymizes the customer fields but keeps the slot occupied; it does not silently create the excluded cancellation feature. Owner may revise this proposed policy before approval.
- Audit events without copied customer content are retained 12 months. Expired/revoked auth sessions are purged daily; login-rate-limit records are purged within 24 hours; origin application logs are retained no more than 30 days.
- Deleted data can remain only inside the bounded backup retention window; restore runbooks must reapply due retention jobs before restored data serves traffic.
- Production data volume uses Windows full-disk encryption. The retention task uses SQLite `secure_delete`, then performs a WAL truncate checkpoint; scheduled maintenance runs a verified `VACUUM` when required so superseded payload is not left indefinitely in free pages. This does not shorten the separately bounded backup lifecycle.

## 4. Authentication contract

- Better Auth is isolated behind the Staff Identity adapter.
- Use the stable `better-sqlite3` adapter path; do not use Node's release-candidate built-in SQLite driver for this milestone.
- Username sign-in is enabled; sign-up and username-availability endpoints are disabled.
- Internal non-delivery identifiers may satisfy library schema requirements but are never displayed or used for Email delivery.
- Session configuration: `expiresIn = 8 hours`, session refresh disabled, cookie cache disabled.
- Auth handler exposes only username sign-in, get-session and sign-out. Public sign-up／email, username-availability, user update／delete, Email change and password request／reset HTTP paths are rejected; provisioning, deactivation and rotation use server CLI only.
- Production `baseURL` is exactly `DUM_PUBLIC_BASE_URL`; Staging uses exactly `DUM_STAGING_BASE_URL`. `trustedOrigins` contains only those exact origins, with no wildcard or sibling-subdomain trust.
- Production and Staging use distinct host-only `__Host-` session cookie names. Each cookie is `Secure`, `HttpOnly`, `SameSite=Strict`, `Path=/` and has no `Domain`; #34 pins and tests the exact names against the selected Better Auth version.
- CSRF, Origin and Fetch Metadata protections remain enabled.
- Login allows at most 5 failed attempts per normalized username + client IP in 15 minutes, then blocks that pair for 15 minutes. #34 stores and tests the limiter in the same DB.
- Behind Tunnel, the app trusts only the loopback proxy hop and Cloudflare's `CF-Connecting-IP`; it never accepts arbitrary client-supplied `X-Forwarded-For` as the limiter identity.
- The request guard rejects an unexpected `Host`. A public request is treated as secure only when the trusted loopback proxy supplies `X-Forwarded-Proto: https`; direct non-loopback origin access remains blocked.
- Authorization is checked at the server data boundary, not only by Proxy redirects or hidden UI.

## 5. Data and deployment contract

The #33 relational boundary contains:

- `staff_members` with opaque ID, public label, `owner | staff` role and active state;
- immutable internal `standard_booking` service configuration;
- per-staff availability windows and time blocks;
- schedule entries for `booking` and `note`, with booking status fixed to `confirmed`;
- `idempotency_requests` with scope + key unique constraint, canonical request hash, resource／result, creation and expiry timestamps;
- version metadata;
- audit events without copied customer content;
- schema migrations with checksums.

#34 adds the version-pinned Better Auth user／account／session／username schema, `auth_rate_limits`, and a unique nullable `staff_members.auth_user_id` reference. Account deactivation atomically marks the staff/account inactive and revokes every session; each Staff DAL check rejects inactive accounts. Better Auth-generated SQL must be reviewed, checked into the single application migration chain with a checksum, and never run ad hoc against Production.

Idempotency behavior is exact: same scope + key + same canonical request hash replays the original resource／result; the same key with a different request hash returns 409; creation of the idempotency row and booking commit or roll back together.

SQLite runtime requirements:

- local fixed NTFS path;
- `foreign_keys=ON`;
- `journal_mode=WAL`;
- `synchronous=FULL`;
- `secure_delete=ON`;
- every Repository and Better Auth connection comes from one controlled connection factory that applies the connection-scoped pragmas;
- `busy_timeout=5000` milliseconds; remaining `SQLITE_BUSY` returns a retryable 503 and relies on the idempotency contract for a safe retry;
- one production App process;
- canonical `slot_time_minutes` integer with range／approved-slot checks; UI `HH:MM` values are converted by the server;
- partial unique index for booking `(staff_member_id, slot_date, slot_time_minutes) WHERE kind='booking'` while notes remain non-blocking;
- note update executes `WHERE id=? AND version=?`, atomically increments version and writes audit; zero updated rows returns 409.

The backup contract requires a hard maximum object age of 28 days across both removable drives, including any recycle-bin or version history, with encryption before leaving the host. The encryption recovery material is held by Owner in an approved password manager plus one offline recovery copy. The pipeline is SQLite online backup → close output → integrity check／hash → encrypt → copy → decrypt and verify from the destination. A restore revokes all existing Staff sessions, reruns due retention, checks integrity and completes smoke tests before serving traffic. RTO 4 hours applies only when a healthy origin or prepared replacement host is available; complete hardware replacement has no guaranteed RTO.

## 6. Configuration ownership

Git records keys and validation rules, never values:

- `DUM_PUBLIC_BASE_URL`
- `DUM_STAGING_BASE_URL`
- `DUM_DATABASE_PATH`
- `DUM_BACKUP_TARGET`
- `DUM_ALERT_RECIPIENT`
- `BETTER_AUTH_SECRET`

Staging uses fictional data and separate values. Production fails closed when a required value is absent. Passwords, tokens and filesystem secrets are entered out of band during #36／#37. The actual domain plus accountable maintenance／alert／rollback owner are not secrets and must be named in Issue #32 before this proposal can be accepted.

## 7. Delivery gates

1. #33 may start only after Owner explicitly approves all eight rows, the non-secret deployment owners/domain are recorded in Issue #32, and this baseline merges.
2. #34 must validate the exact Better Auth version, generated schema and security configuration before merge.
3. #35 must implement the collection notice, cross-device data minimization, verified manual anonymization use case and tests. A requester is verified out of band by Owner against control of the recorded contact channel; no unauthenticated deletion endpoint or deletion UI is added.
4. #36 schedules the daily retention job, reruns it after restore, alerts on failure, and cannot complete without the real domain, two encrypted backup drives and alert destination.
5. #37 is the only Issue that may accept real data or enable Production traffic, and requires explicit Owner GO.

## 8. Explicit exclusions

AI／AI API、LINE、Email／SMS notifications、payment／finance、membership、photos／works, customer accounts, Calendar, CRM, analytics, reports, exports, service／price selection, cancellation, rescheduling, waitlist, WebSocket, Redis, microservices and multi-node HA remain out of scope. MVP3 adds only same-site internal server routes required by the customer and Staff pages; it does not expose a third-party/public product API.

## 9. Primary references

- [Next.js self-hosting](https://nextjs.org/docs/app/guides/self-hosting)
- [Next.js authentication](https://nextjs.org/docs/app/guides/authentication)
- [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/)
- [Cloudflare Data Processing Addendum](https://www.cloudflare.com/cloudflare-customer-dpa/)
- [Node.js release status](https://nodejs.org/en/about/previous-releases)
- [SQLite WAL](https://www.sqlite.org/wal.html)
- [SQLite Online Backup](https://www.sqlite.org/backup.html)
- [SQLite secure_delete](https://www.sqlite.org/pragma.html#pragma_secure_delete)
- [SQLite partial indexes](https://www.sqlite.org/partialindex.html)
- [Better Auth SQLite](https://better-auth.com/docs/adapters/sqlite)
- [Better Auth username plugin](https://better-auth.com/docs/plugins/username)
- [Better Auth session management](https://better-auth.com/docs/concepts/session-management)
- [Taiwan Personal Data Protection Act](https://law.moj.gov.tw/LawClass/LawAll.aspx?pcode=I0050021)
