import "./globals.css";

export const metadata = {
    title: "FieldPulse Admin",
    description: "Enterprise field workforce management dashboard",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body suppressHydrationWarning>{children}</body>
        </html>
    );
}