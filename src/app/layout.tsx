import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: {
        default: 'Yodha',
        template: '%s | Yodha',
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html>
            <body>{children}</body>
        </html>
    );
}
