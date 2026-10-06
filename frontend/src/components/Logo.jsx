export default function Logo({ compact = false }) {
  return (
    <span className={"wildroot-logo" + (compact ? " compact" : "")}>
      <svg className="wildroot-mark" viewBox="0 0 64 64" aria-hidden="true">
        <circle cx="32" cy="32" r="29" fill="currentColor" fillOpacity=".07" />
        <path d="M6 45 25 12l11 20 8-13 15 26" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="m18 24 7-12 7 13-7-4-7 3Zm22 2 4-7 5 9-5-3-4 1Z" fill="currentColor" />
        <path d="M8 49h19c14 0 16-8 8-10-8-2-9 5-3 6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="m27 50-4 6m9-6 2 7m5-9 6 5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        <circle cx="50" cy="12" r="3" fill="currentColor" />
      </svg>
      <span className="wildroot-wordmark">Wild<span>Root</span></span>
    </span>
  );
}
