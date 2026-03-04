"use client";

import { useState, useEffect, useRef } from "react";
import { createUserWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, serverTimestamp, collection } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
    const router = useRouter();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [error, setError] = useState("");
    const [passwordStrength, setPasswordStrength] = useState<{ score: number, message: string }>({ score: 0, message: "" });
    const [isLoading, setIsLoading] = useState(false);
    const isSigningUp = useRef(false);

    // Password validation logic
    const validatePassword = (pass: string) => {
        let score = 0;
        if (!pass) return { score: 0, message: "" };

        if (pass.length >= 8) score += 1;
        if (/[A-Z]/.test(pass)) score += 1;
        if (/[0-9]/.test(pass)) score += 1;
        if (/[^a-zA-Z0-9]/.test(pass)) score += 1;

        let message = "Too weak";
        if (score === 1) message = "Weak";
        if (score === 2) message = "Fair";
        if (score === 3) message = "Good";
        if (score === 4) message = "Strong";

        return { score, message };
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setPassword(val);
        setPasswordStrength(validatePassword(val));
    };

    // 🔥 Redirect if already logged in
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user && !isSigningUp.current) {
                router.push("/dashboard");
            }
        });

        return () => unsubscribe();
    }, [router]);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (!fullName || !email || !password || !companyName) {
            setError("All fields are required");
            return;
        }

        if (passwordStrength.score < 3) {
            setError("Please choose a stronger password (must contain at least 8 characters, an uppercase letter, and a number)");
            return;
        }

        setIsLoading(true);
        isSigningUp.current = true;

        try {
            // Step 1: Create Firebase Auth user
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // Generate a new company ID
            const companyRef = doc(collection(db, "companies"));
            const companyId = companyRef.id;

            // Step 2: Create a new company document
            await setDoc(companyRef, {
                name: companyName,
                createdAt: serverTimestamp(),
                createdBy: user.uid,
                status: "active",
                plan: "starter"
            });

            // Step 3: Create a user document
            const userRef = doc(db, "users", user.uid);
            await setDoc(userRef, {
                fullName: fullName,
                email: email,
                companyId: companyId,
                role: "owner",
                createdAt: serverTimestamp()
            });

            // Step 4: Redirect user to /dashboard
            router.push("/dashboard");
        } catch (err: any) {
            console.error("Signup error:", err);
            if (err.code === 'auth/email-already-in-use') {
                setError("Email already exists");
            } else if (err.code === 'auth/weak-password') {
                setError("Password should be at least 6 characters");
            } else {
                setError(err.message || "Failed to create account");
            }
            isSigningUp.current = false;
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
                        Create your Workspace
                    </h1>
                    <p style={{ fontSize: "13.5px", color: "#64748B", margin: 0 }}>
                        Sign up for FieldPulse Admin
                    </p>
                </div>

                <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                    <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>
                            Full Name
                        </label>
                        <input
                            type="text"
                            placeholder="John Doe"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="signup-input"
                            style={inputStyle}
                            required
                        />
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>
                            Work Email
                        </label>
                        <input
                            type="email"
                            placeholder="you@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="signup-input"
                            style={inputStyle}
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "6px" }}>
                            Company Name
                        </label>
                        <input
                            type="text"
                            placeholder="ABC Logistics"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className="signup-input"
                            style={inputStyle}
                            required
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
                            onChange={handlePasswordChange}
                            className="signup-input"
                            style={inputStyle}
                            required
                            autoComplete="new-password"
                        />
                    </div>

                    {/* Password Strength Indicator */}
                    {password && (
                        <div style={{ padding: "0 4px" }}>
                            <div style={{ display: "flex", gap: "4px", marginBottom: "6px" }}>
                                {[1, 2, 3, 4].map((level) => (
                                    <div
                                        key={level}
                                        style={{
                                            height: "4px",
                                            flex: 1,
                                            borderRadius: "2px",
                                            backgroundColor:
                                                passwordStrength.score >= level
                                                    ? (passwordStrength.score < 2 ? "#EF4444" : passwordStrength.score < 3 ? "#F59E0B" : passwordStrength.score < 4 ? "#10B981" : "#059669")
                                                    : "#E2E8F0",
                                            transition: "background-color 0.2s ease"
                                        }}
                                    />
                                ))}
                            </div>
                            <p style={{
                                fontSize: "11px",
                                margin: 0,
                                fontWeight: 500,
                                color: passwordStrength.score < 2 ? "#EF4444" : passwordStrength.score < 3 ? "#F59E0B" : "#10B981"
                            }}>
                                Password strength: {passwordStrength.message}
                            </p>
                        </div>
                    )}

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
                        className="signup-btn"
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
                                Creating company...
                            </>
                        ) : (
                            "Create Company"
                        )}
                    </button>

                    <div style={{ textAlign: "center", marginTop: "16px", fontSize: "13.5px", color: "#64748B" }}>
                        Already have an account?{" "}
                        <Link href="/login" style={{ color: "#2563EB", fontWeight: 500, textDecoration: "none" }}>
                            Login
                        </Link>
                    </div>
                </form>
            </div>

            <style>{`
                @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap");
                .signup-input:focus { outline: none; border-color: #2563EB !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); background-color: #fff !important; }
                .signup-btn:not(:disabled):hover { transform: translateY(-1px); box-shadow: 0 6px 24px rgba(37,99,235,0.35) !important; }
                .signup-btn:not(:disabled):active { transform: scale(0.98); }
                @keyframes scale-in {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-scale-in { animation: scale-in 0.3s ease-out forwards; }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin { animation: spin 1s linear infinite; }
            `}</style>
        </div>
    );
}
