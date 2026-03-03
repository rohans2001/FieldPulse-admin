"use client";

import { useEffect, useState } from "react";
import {
    collection,
    query,
    where,
    onSnapshot,
    doc,
    getDoc,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

/* ── Action badge config ────────────────────────────────────────── */
const ACTION_CONFIG: Record<string, { label: string; bg: string; color: string; dot: string }> = {
    created: { label: "Created", bg: "#DBEAFE", color: "#1D4ED8", dot: "#3B82F6" },
    updated: { label: "Updated", bg: "#F1F5F9", color: "#475569", dot: "#94A3B8" },
    status_changed: { label: "Status Changed", bg: "#FEF3C7", color: "#92400E", dot: "#F59E0B" },
    deleted: { label: "Deleted", bg: "#FEE2E2", color: "#991B1B", dot: "#EF4444" },
};

function ActionBadge({ action }: { action: string }) {
    const cfg = ACTION_CONFIG[action] ?? { label: action, bg: "#F1F5F9", color: "#475569", dot: "#94A3B8" };
    return (
        <span style={{
            display: "inline-flex", alignItems: "center", gap: "6px",
            padding: "4px 10px", borderRadius: "9999px",
            fontSize: "12px", fontWeight: 500,
            backgroundColor: cfg.bg, color: cfg.color,
        }}>
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: cfg.dot, flexShrink: 0 }} />
            {cfg.label}
        </span>
    );
}

/* ── Relative timestamp ─────────────────────────────────────────── */
function timeAgo(ts: any): string {
    if (!ts?.toDate) return "—";
    const diff = Math.floor((Date.now() - ts.toDate().getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return ts.toDate().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/* ── Skeleton rows ──────────────────────────────────────────────── */
function SkeletonRows() {
    return (
        <>
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <tr key={i}>
                    {[80, 120, 160, 80].map((w, j) => (
                        <td key={j} style={{ padding: "16px 20px" }}>
                            <div className="skeleton" style={{ height: "14px", width: `${w}px` }} />
                        </td>
                    ))}
                </tr>
            ))}
        </>
    );
}

/* ── Pagination bar ─────────────────────────────────────────────── */
function PaginationBar({
    page, totalPages, startEntry, endEntry, total, label,
    onPrev, onNext,
}: {
    page: number; totalPages: number; startEntry: number; endEntry: number;
    total: number; label: string; onPrev: () => void; onNext: () => void;
}) {
    const btnBase: React.CSSProperties = {
        padding: "6px 14px", borderRadius: "8px", fontSize: "13px", fontWeight: 500,
        border: "1px solid var(--border)", backgroundColor: "var(--card)",
        transition: "all 0.12s ease", cursor: "pointer",
    };
    return (
        <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 20px", borderTop: "1px solid var(--border)",
            backgroundColor: "#F8FAFC",
        }}>
            <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0 }}>
                Showing{" "}
                <strong style={{ color: "var(--foreground)" }}>{startEntry}–{endEntry}</strong>
                {" "}of{" "}
                <strong style={{ color: "var(--foreground)" }}>{total}</strong> {label}
            </p>
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <button onClick={onPrev} disabled={page === 1} className="page-btn"
                    style={{ ...btnBase, color: page === 1 ? "var(--muted)" : "var(--foreground)", opacity: page === 1 ? 0.45 : 1, cursor: page === 1 ? "default" : "pointer" }}>
                    ← Prev
                </button>
                <span style={{ padding: "6px 12px", fontSize: "13px", fontWeight: 500, color: "var(--foreground)" }}>
                    {page} / {totalPages}
                </span>
                <button onClick={onNext} disabled={page === totalPages} className="page-btn"
                    style={{ ...btnBase, color: page === totalPages ? "var(--muted)" : "var(--foreground)", opacity: page === totalPages ? 0.45 : 1, cursor: page === totalPages ? "default" : "pointer" }}>
                    Next →
                </button>
            </div>
        </div>
    );
}

/* ── Page ───────────────────────────────────────────────────────── */
const PAGE_SIZE = 20;

export default function AuditPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [companyId, setCompanyId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);

    // Get companyId
    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (user) => {
            if (!user) return;
            const snap = await getDoc(doc(db, "users", user.uid));
            if (snap.exists()) setCompanyId(snap.data().companyId);
        });
        return () => unsub();
    }, []);

    // Real-time logs listener
    useEffect(() => {
        if (!companyId) return;
        setIsLoading(true);
        const q = query(
            collection(db, "audit_logs"),
            where("companyId", "==", companyId)
        );
        const unsub = onSnapshot(q, (snapshot) => {
            const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
            docs.sort((a: any, b: any) => {
                const ta = a.timestamp?.toMillis?.() ?? 0;
                const tb = b.timestamp?.toMillis?.() ?? 0;
                return tb - ta;
            });
            setLogs(docs);
            setIsLoading(false);
        }, (err) => {
            console.error("[AuditLog] onSnapshot error:", err);
            setIsLoading(false);
        });
        return () => unsub();
    }, [companyId]);

    // Pagination derived values
    const totalPages = Math.max(1, Math.ceil(logs.length / PAGE_SIZE));
    const paginatedLogs = logs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const startEntry = logs.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
    const endEntry = Math.min(page * PAGE_SIZE, logs.length);

    return (
        <div className="animate-fade-in" style={{ maxWidth: "1200px", margin: "0 auto" }}>

            {/* ── Header ─────────────────────────────────────────── */}
            <div style={{ marginBottom: "32px" }}>
                <p style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "6px", letterSpacing: "0.02em" }}>
                    Admin / <span style={{ color: "var(--foreground)" }}>Activity</span>
                </p>
                <h2 style={{ fontSize: "26px", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--foreground)", margin: 0, lineHeight: 1.2 }}>
                    Activity Log
                </h2>
                <p style={{ fontSize: "13.5px", color: "var(--muted)", marginTop: "4px" }}>
                    Real-time audit trail of all employee actions
                </p>
            </div>

            {/* ── Table card ─────────────────────────────────────── */}
            <div style={{
                backgroundColor: "var(--card)", borderRadius: "14px",
                border: "1px solid var(--border)", overflow: "hidden",
                boxShadow: "0 1px 3px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.04)",
            }}>
                <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ backgroundColor: "#F8FAFC", borderBottom: "1px solid var(--border)" }}>
                                {["Action", "Employee", "Admin", "Time"].map((col, i) => (
                                    <th key={col} style={{
                                        padding: "13px 20px",
                                        fontSize: "11px", fontWeight: 600,
                                        letterSpacing: "0.07em", textTransform: "uppercase",
                                        color: "var(--muted)",
                                        textAlign: i === 3 ? "right" : "left",
                                        whiteSpace: "nowrap",
                                    }}>
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <SkeletonRows />
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} style={{ padding: "56px 24px", textAlign: "center", color: "var(--muted)" }}>
                                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                                            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.35 }}>
                                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                                <polyline points="14 2 14 8 20 8" />
                                                <line x1="16" y1="13" x2="8" y2="13" />
                                                <line x1="16" y1="17" x2="8" y2="17" />
                                            </svg>
                                            <p style={{ fontSize: "14px" }}>No activity logged yet.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedLogs.map((log, idx) => (
                                    <tr key={log.id} className="audit-row" style={{
                                        borderBottom: idx < paginatedLogs.length - 1 ? "1px solid var(--border)" : "none",
                                        backgroundColor: idx % 2 === 0 ? "var(--card)" : "rgba(248,250,252,0.6)",
                                        transition: "background-color 0.12s ease",
                                    }}>
                                        <td style={{ padding: "14px 20px" }}>
                                            <ActionBadge action={log.action} />
                                        </td>
                                        <td style={{ padding: "14px 20px", fontSize: "13.5px", fontWeight: 600, color: "var(--foreground)" }}>
                                            {log.targetName || "—"}
                                        </td>
                                        <td style={{ padding: "14px 20px", fontSize: "13px", color: "var(--muted)" }}>
                                            {log.adminEmail || "—"}
                                        </td>
                                        <td style={{ padding: "14px 20px", fontSize: "12.5px", color: "var(--muted)", textAlign: "right", whiteSpace: "nowrap" }}>
                                            {timeAgo(log.timestamp)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ── Pagination bar ──────────────────────────────── */}
                {!isLoading && logs.length > 0 && (
                    <PaginationBar
                        page={page} totalPages={totalPages}
                        startEntry={startEntry} endEntry={endEntry}
                        total={logs.length} label="entries"
                        onPrev={() => setPage(p => Math.max(1, p - 1))}
                        onNext={() => setPage(p => Math.min(totalPages, p + 1))}
                    />
                )}
            </div>

            {/* ── Styles ──────────────────────────────────────────── */}
            <style>{`
                .audit-row:hover { background-color: #EFF6FF !important; }
                .page-btn:not(:disabled):hover { background-color: #F1F5F9 !important; }
                @media (prefers-color-scheme: dark) {
                    .audit-row:hover { background-color: rgba(37,99,235,0.07) !important; }
                    .page-btn:not(:disabled):hover { background-color: rgba(255,255,255,0.05) !important; }
                }
            `}</style>
        </div>
    );
}
