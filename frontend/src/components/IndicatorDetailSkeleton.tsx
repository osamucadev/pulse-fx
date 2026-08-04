export function IndicatorDetailSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-3 w-24 rounded bg-gray-200" />
      <div className="mt-2 h-7 w-64 rounded bg-gray-200" />
      <div className="mt-3 h-4 w-full max-w-md rounded bg-gray-200" />

      <div className="mt-6 flex flex-wrap gap-6">
        <div className="h-10 w-32 rounded bg-gray-200" />
        <div className="h-10 w-32 rounded bg-gray-200" />
        <div className="h-10 w-32 rounded bg-gray-200" />
      </div>

      <div className="mt-8 h-[300px] w-full rounded-lg bg-gray-200" />
    </div>
  )
}
