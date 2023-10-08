export function BlockedScreen() {
  return (
    <div className="mt-8 flex flex-col items-center">
      <div className="mb-7 p-3 text-center">
        <p>It looks like you no longer have access to Spellbook.</p>
        <p>
          Please reach out to{' '}
          <a href="mailto:success@spellbook.legal">success@spellbook.legal</a>{' '}
          if you have questions or think this was a mistake.
        </p>
      </div>
    </div>
  );
}
