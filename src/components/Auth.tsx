
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from '@/types';

interface AuthProps {
  onLogin: (user: User) => void;
}

const Auth = ({ onLogin }: AuthProps) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && name) {
      onLogin({
        id: email, // Using email as ID for demo
        email,
        name
      });
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="text"
                placeholder="שם מלא"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full"
                required
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
              />
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
              כניסה למערכת
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
