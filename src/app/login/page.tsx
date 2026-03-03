"use client";

import { useState, useEffect } from "react";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // 🔥 Redirect if already logged in
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                router.push("/dashboard");
            }
        });

        return () => unsubscribe();
    }, [router]);

    const handleLogin = async (e: any) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push("/dashboard");
        } catch (err: any) {
            setError("Invalid email or password");
        } finally {
            setIsLoading(false);
        }
    };

    const inputStyle: React.CSSProperties = {
        width: "100%",
        padding: "11px 14px",
        border: "1px solid #E2E8F0",
        borderRadius: "10px",
        fontSize: "13.5px",
        outline: "none",
        backgroundColor: "#F8FAFC",
        color: "#0F172A",
        transition: "all 0.15s ease",
        boxSizing: "border-box",
        fontFamily: "inherit",
    };

    return (
        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#F8FAFC",
                padding: "24px",
                fontFamily: `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
            }}
        >
            {/* Background subtle grid pattern */}
            <div
                style={{
                    position: "fixed",
                    inset: 0,
                    backgroundImage: `radial-gradient(#E2E8F0 1px, transparent 1px)`,
                    backgroundSize: "28px 28px",
                    opacity: 0.6,
                    pointerEvents: "none",
                    zIndex: 0,
                }}
            />

            <div
                className="animate-scale-in"
                style={{
                    position: "relative",
                    zIndex: 1,
                    backgroundColor: "#ffffff",
                    borderRadius: "20px",
                    border: "1px solid #E2E8F0",
                    padding: "40px",
                    width: "100%",
                    maxWidth: "420px",
                    boxShadow: "0 4px 6px rgba(15,23,42,0.04), 0 20px 60px rgba(15,23,42,0.08)",
                }}
            >
                {/* Logo / Brand */}
                <div style={{ textAlign: "center", marginBottom: "32px" }}>
                    <div
                        style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "14px",
                            background: "linear-gradient(135deg, #2563EB 0%, #4F46E5 100%)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            margin: "0 auto 16px",
                            boxShadow: "0 4px 14px rgba(37,99,235,0.35)",
                        }}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                        </svg>
                    </div>
                    <h1
                        style={{
                            fontSize: "22px",
                            fontWeight: 800,
                            color: "#0F172A",
                            letterSpacing: "-0.02em",
                            margin: "0 0 6px",
                        }}
                    >
                        FieldPulse Admin
                    </h1>
                    <p style={{ fontSize: "13.5px", color: "#64748B", margin: 0 }}>
                        Sign in to your admin dashboard
                    </p>
                </div>

                <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>
                            Email address
                        </label>
                        <input
                            type="email"
                            placeholder="you@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="login-input"
                            style={inputStyle}
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>
                            Password
                        </label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="login-input"
                            style={inputStyle}
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    {error && (
                        <div
                            style={{
                                padding: "10px 14px",
                                backgroundColor: "#FEF2F2",
                                borderRadius: "8px",
                                border: "1px solid #FECACA",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <p style={{ fontSize: "13px", color: "#B91C1C", margin: 0 }}>{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="login-btn"
                        style={{
                            width: "100%",
                            padding: "12px",
                            borderRadius: "10px",
                            fontSize: "14px",
                            fontWeight: 600,
                            color: "#fff",
                            backgroundColor: isLoading ? "#93C5FD" : "#2563EB",
                            border: "none",
                            cursor: isLoading ? "not-allowed" : "pointer",
                            boxShadow: isLoading ? "none" : "0 1px 3px rgba(37,99,235,0.35), 0 6px 20px rgba(37,99,235,0.2)",
                            transition: "all 0.15s ease",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                            marginTop: "4px",
                            fontFamily: "inherit",
                        }}
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="white" strokeWidth="4" />
                                    <path style={{ opacity: 0.75 }} fill="white" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Signing in…
                            </>
                        ) : (
                            "Sign in"
                        )}
                    </button>
                </form>
            </div>

            <style>{`
                @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap");
                .login-input:focus { outline: none; border-color: #2563EB !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); background-color: #fff !important; }
                .login-btn:not(:disabled):hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(37,99,235,0.35) !important; }
                .login-btn:not(:disabled):active { transform: scale(0.98); }
            `}</style>
        </div>
    );
}