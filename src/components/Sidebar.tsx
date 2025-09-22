"use client";

import { useRouter } from "next/navigation";

interface MenuItem {
  id: string;
  label: string;
  icon: string;
}

interface SidebarProps {
  menuItems: MenuItem[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  userProfile: any;
  onSignOut: () => void;
}

export default function Sidebar({
  menuItems,
  activeTab,
  onTabChange,
  userProfile,
  onSignOut,
}: SidebarProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    await onSignOut();
    router.push("/auth/login");
  };

  return (
    <div className="w-64 flex flex-col" style={{ backgroundColor: 'var(--card-bg)', color: 'var(--foreground)', borderRight: '1px solid var(--card-border)' }}>
      <div className="p-4" style={{ borderBottom: '1px solid var(--card-border)' }}>
        <h2 className="text-xl font-bold">Employee Portal</h2>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          {userProfile?.user_role === "admin"
            ? "Admin Panel"
            : "Employee Panel"}
        </p>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onTabChange(item.id)}
                className={`w-full text-left px-3 py-2 rounded-lg flex items-center space-x-3 transition-colors`}
                style={activeTab === item.id ? {
                  backgroundColor: 'var(--focus)',
                  color: '#fff'
                } : {
                  color: 'var(--muted-fore)'
                }}
                onMouseEnter={(e) => { if (activeTab !== item.id) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'color-mix(in oklab, var(--foreground) 6%, transparent)'; }}
                onMouseLeave={(e) => { if (activeTab !== item.id) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent'; }}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4" style={{ borderTop: '1px solid var(--card-border)' }}>
        <button
          onClick={handleSignOut}
          className="w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center space-x-3"
          style={{ color: 'var(--muted-fore)' }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = 'color-mix(in oklab, var(--foreground) 6%, transparent)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent')}
        >
          <span className="text-lg">🚪</span>
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
