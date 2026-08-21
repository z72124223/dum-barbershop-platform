# 單機輕量上線

這個版本只支援一台 Windows 主機與一個正式環境。不要建立第二套 staging、備份、A/B 磁碟或額外監控平台。

1. 以 Node 24.19.0 執行 `pnpm install --frozen-lockfile`、`pnpm build`，再執行 `node scripts/release/assemble-standalone.mjs --sha <目前 SHA>`。
2. 將 release 的 `app` 目錄與 SQLite、設定檔放入主機固定位置，且不在 OneDrive。
3. 管理員執行 `scripts/windows/lite/Install-DumTasks.ps1`。它只建立一個 SYSTEM 的 App 開機自啟工作。
4. 將 `cloudflared.exe` 安裝至 `C:\\Cloudflared\\bin\\cloudflared.exe`。建立 Tunnel 後，將 `<TUNNEL_UUID>.json` 憑證複製到 `C:\\Windows\\System32\\config\\systemprofile\\.cloudflared\\`；填妥的 `config.yml` 也放在此目錄，並確認其中的 `credentials-file` 路徑相符。執行 `cloudflared tunnel ingress validate`，再以系統管理員安裝服務，將其 ImagePath 設為 `C:\\Cloudflared\\bin\\cloudflared.exe --config=C:\\Windows\\System32\\config\\systemprofile\\.cloudflared\\config.yml tunnel run`，啟動服務並於重開機後再次確認。正式 DNS／Tunnel 連線僅能在 #37 Owner GO 後啟用。
5. 用 `http://127.0.0.1:3210/api/health` 確認 `{ "status": "ok" }`，再做一次重開機、外網預約與員工登入／註記驗證。
