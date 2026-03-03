export default function Dashboard() {
    const stats = [
        {
            label: "Active Employees",
            value: "12",
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
            ),
            accent: "#2563EB",
            accentBg: "#EFF6FF",
            trend: "+3 this week",
            trendUp: true,
        },
        {
            label: "Total Sites",
            value: "8",
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                </svg>
            ),
            accent: "#7C3AED",
            accentBg: "#F5F3FF",
            trend: "2 added this month",
            trendUp: true,
        },
        {
            label: "Visits Today",
            value: "25",
            icon: (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
            ),
            accent: "#059669",
            accentBg: "#ECFDF5",
            trend: "↑ 12% vs yesterday",
            trendUp: true,
        },
    ];

    return (
        <div className="animate-fade-in" style={{ maxWidth: "1200px", margin: "0 auto" }}>
            {/* ── Page Header ─────────────────────────────────────── */}
            <div style={{ marginBottom: "32px" }}>
                <p style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "6px", letterSpacing: "0.02em" }}>
                    Admin / <span style={{ color: "var(--foreground)" }}>Dashboard</span>
                </p>
                <h2
                    style={{
                        fontSize: "26px",
                        fontWeight: 700,
                        letterSpacing: "-0.02em",
                        color: "var(--foreground)",
                        margin: 0,
                        lineHeight: 1.2,
                    }}
                >
                    Dashboard
                </h2>
                <p style={{ fontSize: "13.5px", color: "var(--muted)", marginTop: "4px" }}>
                    Overview of your field workforce operations
                </p>
            </div>

            {/* ── KPI Cards ───────────────────────────────────────── */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                    gap: "20px",
                }}
            >
                {stats.map(({ label, value, icon, accent, accentBg, trend, trendUp }) => (
                    <div
                        key={label}
                        style={{
                            backgroundColor: "var(--card)",
                            borderRadius: "14px",
                            border: "1px solid var(--border)",
                            padding: "24px",
                            boxShadow: "0 1px 3px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.04)",
                            transition: "all 0.2s ease",
                            cursor: "default",
                        }}
                        className="kpi-card"
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                            <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--muted)", margin: 0 }}>
                                {label}
                            </p>
                            <span
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    width: "38px",
                                    height: "38px",
                                    borderRadius: "10px",
                                    backgroundColor: accentBg,
                                    color: accent,
                                    flexShrink: 0,
                                }}
                            >
                                {icon}
                            </span>
                        </div>

                        <p
                            style={{
                                fontSize: "32px",
                                fontWeight: 800,
                                color: accent,
                                margin: "0 0 8px",
                                letterSpacing: "-0.03em",
                                lineHeight: 1,
                            }}
                        >
                            {value}
                        </p>

                        <p style={{ fontSize: "12px", color: trendUp ? "#059669" : "#EF4444", margin: 0, display: "flex", alignItems: "center", gap: "4px" }}>
                            {trend}
                        </p>
                    </div>
                ))}
            </div>

            <style>{`
                .kpi-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 20px rgba(15,23,42,0.1) !important;
                }
            `}</style>
        </div>
    );
}