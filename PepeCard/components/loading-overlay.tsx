export default function LoadingOverlay() {
  return (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-8 w-8 rounded-full border-4 border-primary/50 border-t-transparent animate-spin"></div>
        </div>
      </div>
    </div>
  );
}
