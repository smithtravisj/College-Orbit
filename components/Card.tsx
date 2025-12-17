export default function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-950">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
        {title}
      </h3>
      {children}
    </div>
  );
}
