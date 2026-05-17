import { Leaf } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center animate-in fade-in duration-700">
      <Leaf className="h-12 w-12 text-gt-green-500/50 animate-spin" />
    </div>
  );
}
