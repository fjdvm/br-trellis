export default function Loading() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-12 space-y-8 animate-pulse">
      <div className="h-48 bg-surface-low rounded-2xl w-full" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-64 bg-surface-low rounded-xl" />
        ))}
      </div>
    </div>
  );
}
