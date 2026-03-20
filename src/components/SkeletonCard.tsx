export const SkeletonCard = () => (
  <div className="rounded-2xl p-5 border" style={{ backgroundColor: '#fff', borderColor: 'rgba(28,58,28,0.12)' }}>
    {/* Top row */}
    <div className="flex items-start justify-between gap-2 mb-4">
      <div className="flex gap-1.5">
        <div className="shimmer h-5 w-14 rounded-full" />
        <div className="shimmer h-5 w-16 rounded-full" />
      </div>
      <div className="flex gap-1">
        <div className="shimmer h-7 w-7 rounded-full" />
        <div className="shimmer h-7 w-7 rounded-full" />
      </div>
    </div>

    {/* Title */}
    <div className="shimmer h-5 w-3/4 rounded-lg mb-1.5" />
    <div className="shimmer h-5 w-1/2 rounded-lg mb-4" />

    {/* Description */}
    <div className="shimmer h-3.5 w-full rounded mb-1.5" />
    <div className="shimmer h-3.5 w-5/6 rounded mb-5" />

    {/* Footer */}
    <div className="flex items-center justify-between">
      <div className="shimmer h-3.5 w-20 rounded" />
      <div className="shimmer h-3.5 w-20 rounded" />
    </div>
  </div>
);
