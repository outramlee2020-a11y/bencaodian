export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-amber-200 border-t-amber-800" />
        <p className="mt-4 text-sm text-gray-500">加载中...</p>
      </div>
    </div>
  )
}
