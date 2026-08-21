# 單機輕量上線

這個版本只支援一台 Windows 主機與一個正式環境。不要建立第二套 staging、A/B 備份或額外監控平台。

1. 以 Node 24.19.0 執行 `pnpm install --frozen-lockfile`、`pnpm build`，再執行 `node scripts/release/assemble-standalone.mjs --sha <目前 SHA>`。
2. 將 release 的 `app` 目錄放入主機固定位置；SQLite、備份與設定檔必須在 release 目錄外，且不在 OneDrive。
3. Owner 提供備份用的 GPG 公鑰檔與 recipient 指紋／email；私鑰只保留在 Owner 的離機位置。將外接硬碟指定為 `BackupTarget`。
4. 管理員執行 `scripts/windows/lite/Install-DumTasks.ps1`，並帶入 `GpgPublicKeyPath` 與 `GpgRecipient`。它將公鑰放入 SYSTEM 可讀的獨立 keyring，並只建立 App 開機自啟與每日 02:30 備份兩個 SYSTEM 工作。
5. 安裝 cloudflared，將 `scripts/cloudflared/config.template.yml` 填入 Tunnel UUID 後放在主機設定目錄，先確認 `cloudflared tunnel ingress validate`。正式 DNS／Tunnel 連線僅能在 #37 Owner GO 後啟用。
6. 用 `http://127.0.0.1:3210/api/health` 確認 `{ "status": "ok" }`，再做一次重開機、外網預約、員工登入／註記與 `Restore-DumDatabase.ps1` 的隔離還原驗證。

`Backup-DumDatabase.ps1` 會短暫停止 App、複製 SQLite 與 WAL、壓縮、用 Owner 公鑰加密、保留 28 天，最後重新啟動 App。備份磁碟未接上時工作會失敗；請接上磁碟後手動執行該工作確認。
