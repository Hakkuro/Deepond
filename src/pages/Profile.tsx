import React from 'react';
import { ProfileHero } from '../components/profile/ProfileHero';
import { ProfileForm } from '../components/profile/ProfileForm';
import { AccountSettings } from '../components/profile/AccountSettings';
import { NotificationPanel } from '../components/profile/NotificationPanel';

export default function Profile() {
  return (
    <div className="min-h-[calc(100vh-73px)] bg-white dark:bg-black font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black transition-colors duration-500 flex flex-col">
      <main className="max-w-6xl w-full mx-auto px-8 py-12 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12 h-full">
          
          {/* 左侧布局：个人资料展示、修改以及安全设置 */}
          <div className="flex flex-col gap-12">
            <ProfileHero />
            <ProfileForm />
            <AccountSettings />
          </div>

          {/* 右侧布局：悬浮（Sticky）的消息通知面板 */}
          <aside className="relative">
             <div className="sticky top-[100px] h-[calc(100vh-140px)] flex flex-col">
               <NotificationPanel />
             </div>
          </aside>
          
        </div>
      </main>
    </div>
  );
}
