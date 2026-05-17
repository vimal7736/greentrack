import { Leaf } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex-1 min-h-[40vh] flex items-center justify-center animate-in fade-in duration-700">
      <Leaf className="h-10 w-10 text-gt-green-500/60 animate-spin" />
    </div>
  );
}
