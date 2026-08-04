export function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-gray-200 p-4 shadow-sm">
      <div className="h-4 w-2/3 rounded bg-gray-200" />
      <div className="mt-3 h-7 w-1/2 rounded bg-gray-200" />
      <div className="mt-2 h-3 w-1/3 rounded bg-gray-200" />
      <div className="mt-3 h-4 w-1/4 rounded bg-gray-200" />
    </div>
  )
}
