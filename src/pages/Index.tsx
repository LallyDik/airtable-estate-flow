import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { User, LogOut, Building, Calendar } from 'lucide-react';
import Auth from '@/components/Auth';
import PropertiesTab from '@/components/PropertiesTab';
import PostsTab from '@/components/PostsTab';
import { User as UserType } from '@/types';

const Index = () => {
  const [user, setUser] = useState<UserType | null>(null);
  const [activeTab, setActiveTab] = useState('properties');

  // טעינת נתוני המשתמש מ-localStorage בטעינת העמוד
  useEffect(() => {
    const savedUser = localStorage.getItem('userAuth');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('שגיאה בטעינת נתוני המשתמש:', error);
        localStorage.removeItem('userAuth');
      }
    }
  }, []);

  const handleLogin = (userData: UserType) => {
    setUser(userData);
    // שמירת נתוני המשתמש ב-localStorage
    localStorage.setItem('userAuth', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setActiveTab('properties');
    // מחיקת נתוני המשתמש מ-localStorage
    localStorage.removeItem('userAuth');
  };

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Building className="h-8 w-8 text-blue-600 ml-3" />
              <h1 className="text-xl font-bold text-gray-900">
                ניהול נכסים ופרסומים
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>{user.name}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                יציאה
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="properties" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              נכסים
            </TabsTrigger>
            <TabsTrigger value="posts" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              פרסומים
            </TabsTrigger>
          </TabsList>

          <TabsContent value="properties" className="mt-0">
            <PropertiesTab user={user} />
          </TabsContent>

          <TabsContent value="posts" className="mt-0">
            <PostsTab user={user} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-600">
            <p className="text-sm">
              מערכת ניהול נכסים ופרסומים למתווכים | מחובר ל-Airtable
            </p>
            <p className="text-xs mt-2">
              ⚠️ לפני השימוש, עדכן את פרטי ה-Airtable בקובץ services/airtable.ts
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
