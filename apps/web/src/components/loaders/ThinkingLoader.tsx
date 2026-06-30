export default function ThinkingLoader() {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="relative h-5 w-5">
        <div className="absolute inset-0 rounded-full border-2 border-blue-500/20"></div>

        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 animate-spin"></div>
      </div>

      <div className="flex flex-col">
        <span className="text-sm font-medium">
          Thinking
        </span>

        <span className="text-xs text-gray-500">
          Analyzing your documents...
        </span>
      </div>
    </div>
  );
}