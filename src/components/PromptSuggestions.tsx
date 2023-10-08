export function PromptSuggestions({
  promptSuggestions: suggestions,
}: {
  promptSuggestions: { suggestion: string; onClick: () => void }[];
}) {
  return (
    <div className="flex flex-wrap justify-end gap-[5px]">
      {suggestions.map(({ suggestion, onClick }) => (
        <div key={suggestion}>
          <button
            type="button"
            onClick={() => onClick()}
            className="cursor-pointer rounded-full border border-purple-1 px-2.5 text-purple-1"
          >
            {suggestion}
          </button>
        </div>
      ))}
    </div>
  );
}
