import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import { motion } from "framer-motion";

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-white dark:bg-black overflow-hidden transition-colors duration-500">
      <Sidebar />
      <main className="flex-1 relative overflow-y-auto scrollbar-hide">
        <div className="min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
