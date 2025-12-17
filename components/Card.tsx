export default function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-6">
      <h3 className="mb-5 text-base font-semibold tracking-tight text-gray-900 dark:text-white">
        {title}
      </h3>
      <div className="text-gray-700 dark:text-gray-300">
        {children}
      </div>
    </div>
  );
}
