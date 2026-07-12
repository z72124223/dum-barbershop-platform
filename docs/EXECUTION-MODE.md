# DUM BARBERSHOP Platform — Execution Mode

版本：1.0.0  
狀態：Accepted

## 1. 主要實作工具

本專案的程式實作工具為 **Codex**，且優先使用 **Codex 本機環境**。

- 網站程式、預約引擎、測試、Build、除錯與整合，由 Codex 在本機 Repository / Worktree 中完成。
- ChatGPT Work 不作為本專案的主要程式實作者。
- Work 可用於非程式交付，例如文件整理、研究、報告或視覺素材，但不得取代 Codex 的本機程式流程。

## 2. 不會自動切換

ChatGPT Work 與 Codex 是使用者選擇的工作模式，不應假設系統會在任務中自動從 Work 切換到 Codex。

進入任何需要修改程式碼、執行終端機、安裝套件、跑測試或建立 Build 的任務時，Owner 應直接選擇 **Codex**。

## 3. Codex 啟動條件

從 M1 起即進入 Codex 實作階段。Codex 必須：

1. 開啟或 Clone `z72124223/dum-barbershop-platform`
2. 使用本機環境
3. 先讀根目錄 `AGENTS.md`
4. 再依 AGENTS.md 指定順序讀取文件
5. 只執行已建立的 GitHub Issue
6. 建立獨立 Branch / Worktree
7. 修改程式並執行驗證
8. 建立 Draft Pull Request
9. 不直接依賴聊天記憶或未提交指令

## 4. 任務延續

Codex 不必回到規劃聊天視窗取得下一步。

完成目前 Issue 後：

- 若 Repository 已有下一個明確、未被阻擋且標記可執行的 Issue，可依優先順序繼續認領。
- 若下一階段需要 Owner 決策，Codex 必須停止該部分並在 GitHub Issue 或 `docs/DECISIONS.md` 留下 `TODO(owner-decision)`。
- Codex 不得自行填補價格、會員、訂金、取消、個資或其他 Reserved 決策。
- 沒有 Issue 的工作不得直接實作。

## 5. Work 的角色

Work 在本專案中是選用工具，適用於：

- 將已確認內容整理成文件
- 比較公開方案並形成研究報告
- 製作非程式交付物
- 協助人工驗收或摘要

Work 不負責：

- 主要網站引擎
- 預約 Domain
- 本機依賴安裝
- 程式 Build 與測試
- Git Worktree 中的日常開發

## 6. Git 是交接面

不同視窗、模型或 Agent 之間不得依賴隱性跨視窗傳話。所有交接都透過：

- Repository 文件
- GitHub Issues
- Branch / Commit
- Pull Requests
- Review comments

完成以上紀錄後，新的 Codex 任務應能單獨從 Git 還原完整上下文。