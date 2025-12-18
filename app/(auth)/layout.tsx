export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div style={{ backgroundColor: 'var(--bg)' }}>{children}</div>;
}
