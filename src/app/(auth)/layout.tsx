export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-background via-background to-blush p-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
