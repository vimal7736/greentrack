import Sidebar from "@/components/Sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        userName="Admin"
        userEmail="admin@example.com"
        userRole="admin"
        orgName="Admin Panel"
        orgTier="pro"
      />
      <main className="flex-1 ml-64 p-8">{children}</main>
    </div>
  );
}
