
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from '@/types';
import { AirtableService } from '@/services/airtable';
import { useToast } from '@/components/ui/use-toast';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth = ({ onLogin }: AuthProps) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleDemoLogin = () => {
    const demoUser: User = {
      id: 'demo-user',
      email: 'demo@example.com',
      name: 'משתמש דמו'
    };
    
    onLogin(demoUser);
    
    toast({
      title: "כניסה בוצעה בהצלחה",
      description: `ברוך הבא, ${demoUser.name}!`,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && name) {
      setIsLoading(true);
      
      try {
        console.log('🔍 בודק אם המשתמש קיים ב-Airtable:', email);
        
        // בדיקה אם המשתמש קיים בטבלת אנשי קשר
        const users = await AirtableService.getUsers();
        const existingUser = users.find((user: any) => 
          user['אימייל']?.toLowerCase() === email.toLowerCase()
        );
        
        if (!existingUser) {
          console.log('❌ משתמש לא נמצא ב-Airtable');
          toast({
            title: "שגיאה בכניסה",
            description: "משתמש זה לא רשום במערכת. אנא פנה למנהל המערכת.",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }
        
        console.log('✅ משתמש נמצא ב-Airtable:', existingUser);
        
        // אם המשתמש קיים, נתן לו להכנס עם הפרטים מ-Airtable
        const userData: User = {
          id: existingUser.id || email,
          email: existingUser['אימייל'] || email,
          name: existingUser['שם מלא'] || existingUser['שם'] || name
        };
        
        onLogin(userData);
        
        toast({
          title: "כניסה בוצעה בהצלחה",
          description: `ברוך הבא, ${userData.name}!`,
        });
        
      } catch (error) {
        console.error('❌ שגיאה בבדיקת משתמש:', error);
        toast({
          title: "שגיאה בכניסה",
          description: "אירעה שגיאה בבדיקת הרשאות. אנא נסה שוב.",
          variant: "destructive"
        });
      }
      
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-800">
            כניסה למערכת
          </CardTitle>
          <p className="text-gray-600">ניהול נכסים ופרסומים</p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Demo Login Button */}
            <Button 
              type="button" 
              onClick={handleDemoLogin}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              variant="default"
            >
              כניסה כמשתמש דמו
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">או</span>
              </div>
            </div>

            {/* Regular Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder="שם מלא"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full"
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <Input
                  type="email"
                  placeholder="אימייל"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full"
                  required
                  disabled={isLoading}
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? 'בודק פרטים...' : 'כניסה למערכת'}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
