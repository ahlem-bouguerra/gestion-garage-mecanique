// src/app/(client)/layout.tsx
'use client'
import { useState } from 'react';
import ClientSidebar from '@/components/Sidebar/ClientSidebar';
import ClientHeader from '@/components/Header/ClientHeader';
import { LayoutWrapper } from "@/components/LayoutWrapper";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <LayoutWrapper>
      <div className="flex h-screen bg-blue-50">
        <ClientSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <ClientHeader setSidebarOpen={setSidebarOpen} userType="client" />
          <main className="flex-1 overflow-x-hidden overflow-y-auto">
            <div className="container mx-auto px-6 py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </LayoutWrapper>
  );
}