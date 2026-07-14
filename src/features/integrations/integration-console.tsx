"use client";

import { useMemo, useState } from "react";
import { createMockPlatform } from "../../adapters";
import { mockCalendarSyncMetadata, mockIntegrationOperations } from "../../data/mock";
import {
  completeIntegrationOperation,
  retryIntegrationOperation,
  type IntegrationOperation,
  type IntegrationProvider,
  type MockIntegrationOutcome,
} from "../../domain";
import { integrationHealth, pendingIntegrationCount } from "./integration-console-logic";

const providers: Array<{ key: IntegrationProvider; label: string; description: string }> = [
  { key: "booking", label: "Booking Provider", description: "正式預約供應商尚未選定。" },
  { key: "calendar", label: "Calendar", description: "示範雙向同步、版本衝突與重試。" },
  { key: "notification", label: "Notification", description: "只產生訊息預覽，不對外寄送。" },
  { key: "payment", label: "Payment / Deposit", description: "正式金流、金額與退款規則停用。" },
  { key: "membership", label: "Membership", description: "會員權益尚待 Owner 決策。" },
  { key: "identity", label: "Identity", description: "只有本機角色預覽，沒有正式登入。" },
  { key: "line", label: "LINE", description: "未註冊、未綁定，也不會送訊息。" },
];

const healthLabels = { healthy: "Mock 正常", attention: "需要注意", idle: "等待中", disabled: "尚未啟用" } as const;
const MOCK_OPERATION_TIME = "2026-07-14T10:00:00.000Z";

export function IntegrationConsole() {
  const [platform] = useState(createMockPlatform);
  const [operations, setOperations] = useState<IntegrationOperation[]>(() => structuredClone(mockIntegrationOperations));
  const [auditLog, setAuditLog] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const pendingCount = useMemo(() => pendingIntegrationCount(operations), [operations]);

  async function simulate(operation: IntegrationOperation, outcome: MockIntegrationOutcome) {
    setMessage("");
    setError("");
    try {
      const updated = completeIntegrationOperation(operation, outcome, MOCK_OPERATION_TIME);
      await platform.integrations.save(updated);
      setOperations((current) => current.map((item) => item.id === updated.id ? updated : item));
      setAuditLog((current) => [`${operation.provider}/${operation.action}: ${operation.status} → ${updated.status}`, ...current]);
      setMessage(`已完成 ${operation.provider} 的本機「${outcome}」情境。`);
    } catch {
      setError("這筆工作目前不能執行模擬；已完成或停用的工作不會重複送出。");
    }
  }

  async function retry(operation: IntegrationOperation) {
    setMessage("");
    setError("");
    try {
      const updated = retryIntegrationOperation(operation, MOCK_OPERATION_TIME);
      await platform.integrations.save(updated);
      setOperations((current) => current.map((item) => item.id === updated.id ? updated : item));
      setAuditLog((current) => [`${operation.provider}/${operation.action}: retry attempt ${updated.attempt}`, ...current]);
      setMessage("已排入下一次 Mock 重試；超過上限後不會繼續。");
    } catch {
      setError("這筆工作不是可重試狀態，或已達重試上限。");
    }
  }

  return (
    <section className="integration-shell">
      <div className="staff-warning" role="note"><strong>INTEGRATION SIMULATOR · 全部為本機</strong><span>沒有 API Key、沒有正式帳號、沒有對外傳輸；停用不等於故障。</span></div>
      <div className="integration-summary"><article><span>Provider</span><strong>{providers.length}</strong></article><article><span>排隊／重試</span><strong>{pendingCount}</strong></article><article><span>本次稽核</span><strong>{auditLog.length}</strong></article><article><span>外部傳送</span><strong>0</strong></article></div>
      {message ? <p className="staff-message" role="status">{message}</p> : null}
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <div className="provider-grid">
        {providers.map((provider) => {
          const providerOperations = operations.filter((operation) => operation.provider === provider.key);
          const mode = providerOperations[0]?.mode ?? "disabled";
          const health = integrationHealth(mode, providerOperations);
          return <article key={provider.key} className={`provider-card health-${health}`}><header><div><span>{provider.key.toUpperCase()}</span><h2>{provider.label}</h2></div><strong>{healthLabels[health]}</strong></header><p>{provider.description}</p>{providerOperations.map((operation) => <OperationRow key={operation.id} operation={operation} onSimulate={simulate} onRetry={retry} />)}</article>;
        })}
      </div>

      <section className="calendar-sync-panel"><div className="operations-heading"><div><p className="eyebrow">CALENDAR SYNC METADATA</p><h2>日曆同步追蹤</h2></div><span>雙向 · 有版本 · 可辨識衝突</span></div>{mockCalendarSyncMetadata.map((metadata) => <article key={`${metadata.bookingId}-${metadata.direction}`}><strong>{metadata.bookingId}</strong><span>{metadata.direction}</span><span>revision {metadata.revision}</span><span className={`sync-${metadata.status}`}>{metadata.status}</span></article>)}</section>

      <section className="delivery-preview"><div><p className="eyebrow">OUTBOUND DELIVERY / DISABLED</p><h2>訊息流程只看不送</h2><p>以下項目保留文字與排程位置，沒有使用 LINE、簡訊或 Email 帳號。</p></div>{["預約提醒", "到店後評論邀請", "回流關懷", "LINE 預約通知"].map((item) => <article key={item}><strong>{item}</strong><span>Disabled · TODO(owner-decision)</span><button type="button" disabled>外部傳送停用</button></article>)}</section>

      {auditLog.length ? <details className="audit-preview"><summary>查看整合 Mock 稽核（{auditLog.length}）</summary>{auditLog.map((entry) => <p key={entry}>{entry}</p>)}</details> : null}
    </section>
  );
}

function OperationRow({ operation, onSimulate, onRetry }: { operation: IntegrationOperation; onSimulate: (operation: IntegrationOperation, outcome: MockIntegrationOutcome) => void; onRetry: (operation: IntegrationOperation) => void }) {
  return <div className="integration-operation"><div><code>{operation.action}</code><span>{operation.status} · attempt {operation.attempt}/{operation.maxAttempts}</span><small>{operation.idempotencyKey}</small></div>{operation.status === "queued" || operation.status === "running" ? <div className="simulation-actions"><button type="button" onClick={() => onSimulate(operation, "success")}>成功</button><button type="button" onClick={() => onSimulate(operation, "conflict")}>衝突</button><button type="button" onClick={() => onSimulate(operation, "timeout")}>逾時</button><button type="button" onClick={() => onSimulate(operation, "partial_failure")}>部分失敗</button></div> : operation.status === "retry_scheduled" ? <button type="button" className="retry-button" onClick={() => onRetry(operation)}>執行有限重試</button> : <span className="operation-terminal">不會自動重送</span>}</div>;
}
