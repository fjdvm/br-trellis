import Link from "next/link";

export function HeaderTabs() {
  return (
    <header className="border-b border-gray-200 bg-white px-6 py-4 flex items-center justify-between shadow-xs">
      <div className="flex items-center space-x-6">
        <span className="font-bold text-lg text-slate-900 tracking-tight">OOS Portal</span>
        <nav className="flex space-x-4">
          <Link href="/" className="text-sm font-medium text-slate-700 hover:text-slate-900">
            Dashboard
          </Link>
          <Link href="/orders" className="text-sm font-medium text-slate-500 hover:text-slate-900">
            Orders
          </Link>
        </nav>
      </div>
    </header>
  );
}
