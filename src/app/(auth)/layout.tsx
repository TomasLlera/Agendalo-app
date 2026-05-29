export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="flex min-h-full flex-1 items-center justify-center p-6">
      {children}
    </main>
  );
}
