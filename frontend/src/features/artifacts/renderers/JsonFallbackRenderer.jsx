/** Used when a module has content but no bespoke renderer has been built yet. */
const JsonFallbackRenderer = ({ content }) => (
  <pre className="overflow-x-auto rounded-lg border border-subtle bg-base/60 p-4 text-xs text-content-secondary">
    {JSON.stringify(content, null, 2)}
  </pre>
);

export default JsonFallbackRenderer;
