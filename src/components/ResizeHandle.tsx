export function ResizeHandle() {
  return (
    <div className="absolute left-[1px] top-[50%] flex h-4 flex-col justify-between">
      <div className="h-1 w-1 rounded bg-gray-4" />
      <div className="h-1 w-1 rounded bg-gray-4" />
      <div className="h-1 w-1 rounded bg-gray-4" />
    </div>
  );
}
