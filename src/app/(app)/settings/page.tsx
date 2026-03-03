"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

function Spinner() {
    return (
        <svg className="animate-spin" width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
    );
}

export default function SettingsPage() {
    const [companyId, setCompanyId] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) return;

            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const cid = userSnap.data().companyId;
                setCompanyId(cid);

                const companyRef = doc(db, "companies", cid);
                const companySnap = await getDoc(companyRef);

                if (companySnap.exists()) {
                    setCompanyName(companySnap.data().name);
                }
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const handleUpdate = async () => {
        if (!companyId) return;

        await updateDoc(doc(db, "companies", companyId), {
            name: companyName,
        });

        alert("Company name updated successfully!");
    };

    const inputStyle: React.CSSProperties = {
        width: "100%",
        padding: "10px 14px",
        border: "1px solid var(--border)",
        borderRadius: "10px",
        fontSize: "13.5px",
        outline: "none",
        backgroundColor: "#F8FAFC",
        color: "var(--foreground)",
        transition: "all 0.15s ease",
        boxSizing: "border-box",
    };

    if (loading) {
        return (
            <div className="animate-fade-in" style={{ maxWidth: "1200px", margin: "0 auto" }}>
                <div style={{ marginBottom: "32px" }}>
                    <div className="skeleton" style={{ height: "12px", width: "120px", marginBottom: "12px" }} />
                    <div className="skeleton" style={{ height: "28px", width: "200px", marginBottom: "8px" }} />
                    <div className="skeleton" style={{ height: "14px", width: "260px" }} />
                </div>
                <div
                    style={{
                        backgroundColor: "var(--card)",
                        borderRadius: "14px",
                        border: "1px solid var(--border)",
                        padding: "28px",
                        maxWidth: "480px",
                    }}
                >
                    <div className="skeleton" style={{ height: "14px", width: "110px", marginBottom: "10px" }} />
                    <div className="skeleton" style={{ height: "42px", marginBottom: "24px" }} />
                    <div className="skeleton" style={{ height: "42px", width: "150px" }} />
                </div>
            </div>
        );
    }

    return (
        <div
            className="animate-fade-in"
            style={{ maxWidth: "1200px", margin: "0 auto", color: "var(--foreground)" }}
        >
            {/* ── Page Header ─────────────────────────────────────── */}
            <div style={{ marginBottom: "32px" }}>
                <p style={{ fontSize: "12px", color: "var(--muted)", marginBottom: "6px", letterSpacing: "0.02em" }}>
                    Admin / <span style={{ color: "var(--foreground)" }}>Settings</span>
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
                    Company Settings
                </h2>
                <p style={{ fontSize: "13.5px", color: "var(--muted)", marginTop: "4px" }}>
                    Manage your organization settings and preferences
                </p>
            </div>

            {/* ── Settings Card ───────────────────────────────────── */}
            <div
                style={{
                    backgroundColor: "var(--card)",
                    borderRadius: "14px",
                    border: "1px solid var(--border)",
                    padding: "28px",
                    maxWidth: "480px",
                    boxShadow: "0 1px 3px rgba(15,23,42,0.04), 0 4px 16px rgba(15,23,42,0.04)",
                    transition: "box-shadow 0.2s ease",
                    cursor: "default",
                }}
                className="settings-card"
            >
                <div style={{ marginBottom: "20px" }}>
                    <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--foreground)", margin: "0 0 4px" }}>
                        Company Name
                    </h3>
                    <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0 }}>
                        This name appears in your admin sidebar and reports.
                    </p>
                </div>

                <div style={{ marginBottom: "20px" }}>
                    <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "var(--foreground)", marginBottom: "6px" }}>
                        Name
                    </label>
                    <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Enter company name"
                        className="settings-input"
                        style={inputStyle}
                    />
                </div>

                <button
                    onClick={async () => {
                        setIsSaving(true);
                        try {
                            await handleUpdate();
                        } finally {
                            setIsSaving(false);
                        }
                    }}
                    disabled={isSaving}
                    className="save-btn"
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        padding: "10px 20px",
                        borderRadius: "10px",
                        fontSize: "13.5px",
                        fontWeight: 600,
                        color: "#fff",
                        backgroundColor: isSaving ? "#60A5FA" : "var(--primary)",
                        border: "none",
                        cursor: isSaving ? "not-allowed" : "pointer",
                        boxShadow: isSaving ? "none" : "0 1px 3px rgba(37,99,235,0.35), 0 4px 12px rgba(37,99,235,0.2)",
                        transition: "all 0.15s ease",
                    }}
                >
                    {isSaving ? (
                        <>
                            <Spinner />
                            Saving…
                        </>
                    ) : (
                        "Update Company"
                    )}
                </button>
            </div>

            <style>{`
                .settings-card:hover { box-shadow: 0 4px 20px rgba(15,23,42,0.1) !important; }
                .settings-input:focus { outline: none; border-color: #2563EB !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); background-color: #fff !important; }
                .save-btn:not(:disabled):hover { transform: translateY(-1px); }
                .save-btn:not(:disabled):active { transform: scale(0.97); }
            `}</style>
        </div>
    );
}