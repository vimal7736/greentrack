export function PageBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gt-green-500/5 rounded-full blur-[140px] -translate-y-1/2 translate-x-1/4" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-orange/5 rounded-full blur-[120px] translate-y-1/4 -translate-x-1/4" />
    </div>
  );
}
