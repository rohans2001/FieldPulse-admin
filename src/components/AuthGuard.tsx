"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import {
    doc,
    getDoc,
    setDoc,
    addDoc,
    collection,
    serverTimestamp,
} from "firebase/firestore";

export default function AuthGuard({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                router.push("/login");
                return;
            }

            // 🔥 Check if user profile exists
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                // 🔥 Create new company
                const companyRef = await addDoc(collection(db, "companies"), {
                    name: "My Company",
                    plan: "starter",
                    createdAt: serverTimestamp(),
                });

                // 🔥 Create user profile
                await setDoc(userRef, {
                    email: user.email,
                    role: "admin",
                    companyId: companyRef.id,
                    createdAt: serverTimestamp(),
                });
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, [router]);

    if (loading) return null;

    return <>{children}</>;
}