
import { Property, Post } from '@/types';

// ⚠️ חובה לעדכן את הפרטים הבאים:
const AIRTABLE_BASE_ID = 'appOvCJ87X4ohISLL'; // למשל: appXXXXXXXXXXXXXX
const AIRTABLE_API_KEY = 'path5GRXWyf81Jz1U.2bda996b8605d6d737714d48c82444a362105f15798ce99789aa9b604fe63ac3'; // Personal Access Token מ-Airtable

const BASE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;

const headers = {
  'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
  'Content-Type': 'application/json',
};

export class AirtableService {
  // בדיקת קונפיגורציה
  static checkConfiguration() {
    console.log('🔍 בודק קונפיגורציה של Airtable:');
    console.log('Base ID:', AIRTABLE_BASE_ID);
    console.log('API Key exists:', AIRTABLE_API_KEY ? 'כן' : 'לא');
    console.log('API Key length:', AIRTABLE_API_KEY.length);
    console.log('Base URL:', BASE_URL);
    
    return true;
  }

  // בדיקת חיבור משופרת
  static async testConnection() {
    console.log('🔄 מתחיל בדיקת חיבור ל-Airtable...');
    
    if (!this.checkConfiguration()) {
      return false;
    }
    
    try {
      console.log('📡 שולח בקשה ל-Airtable...');
      // שינוי שם הטבלה לעברית
      const response = await fetch(`${BASE_URL}/אנשי קשר?maxRecords=1`, { headers });
      
      console.log('📊 סטטוס תגובה:', response.status);
      console.log('📊 סטטוס טקסט:', response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ תגובת שגיאה מ-Airtable:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ החיבור ל-Airtable הצליח:', data);
      return true;
    } catch (error) {
      console.error('❌ שגיאה בחיבור ל-Airtable:', error);
      console.error('💡 בדוק שה-Base ID וה-API Key נכונים');
      console.error('💡 וודא שיש לך הרשאות לגשת לטבלה אנשי קשר');
      return false;
    }
  }

  // Users API - שינוי לטבלה "אנשי קשר"
  static async getUsers() {
    const response = await fetch(`${BASE_URL}/אנשי קשר`, { headers });
    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data.records.map((record: any) => ({
      id: record.id,
      ...record.fields
    }));
  }

  // Properties API - שימוש בשדה אימייל ישירות
  static async getProperties(brokerId: string) {
    console.log('🔍 מבקש נכסים עבור ברוקר:', brokerId);
    
    try {
      // נוסחת סינון פשוטה לפי אימייל המתווך
      const filterFormula = `{אימייל (from מתווך בעל בלעדיות)} = '${brokerId}'`;
      console.log('📝 נוסחת סינון:', filterFormula);
      
      const response = await fetch(
        `${BASE_URL}/נכסים?filterByFormula=${encodeURIComponent(filterFormula)}`,
        { headers }
      );
      
      console.log('📊 סטטוס תגובה:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ שגיאה בקבלת נכסים:', errorText);
        return [];
      }
      
      const data = await response.json();
      console.log('✅ נתוני נכסים:', data);
      console.log('📈 מספר נכסים שנמצאו:', data.records?.length || 0);
      
      if (data.records && data.records.length > 0) {
        console.log('🎉 מצאנו נכסים!');
        console.log('🔍 פרטי הנכס הראשון:', data.records[0]);
        
        return data.records.map((record: any) => ({
          id: record.id,
          title: record.fields['שם נכס לתצוגה'] || record.fields['שם נכס'] || 'נכס ללא שם',
          description: record.fields['תיאור חופשי לפרסום'] || '',
          address: `${record.fields['רחוב'] || ''} ${record.fields['עיר'] || ''}`.trim() || 'כתובת לא זמינה',
          price: record.fields['מחיר שיווק'] || 0,
          type: record.fields['סוג נכס'] || 'לא צוין',
          size: record.fields['שטח'] || 0,
          broker: brokerId,
          createdAt: record.fields['create time'] || new Date().toISOString(),
          rooms: record.fields['כמות חדרים'] || '',
          neighborhood: record.fields['שכונה'] || '',
          city: record.fields['עיר'] || '',
          street: record.fields['רחוב'] || '',
          floor: record.fields['קומה'] || '',
          number: record.fields['מספר בית'] || '',
          offersUntil: record.fields['מוכן לקבל הצעות עד'] || '',
          ...record.fields
        }));
      } else {
        console.log('⚠️ לא נמצאו נכסים');
        return [];
      }
    } catch (error) {
      console.error('❌ שגיאה בקבלת נכסים:', error);
      return [];
    }
  }

  static async createProperty(property: Omit<Property, 'id'>) {
    const response = await fetch(`${BASE_URL}/נכסים`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        fields: property
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create property: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return { id: data.id, ...data.fields };
  }

  static async updateProperty(id: string, fields: Partial<Property>) {
    const response = await fetch(`${BASE_URL}/נכסים/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ fields })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update property: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return { id: data.id, ...data.fields };
  }

  static async deleteProperty(id: string) {
    const response = await fetch(`${BASE_URL}/נכסים/${id}`, {
      method: 'DELETE',
      headers
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete property: ${response.status} ${response.statusText}`);
    }
  }

  // Posts API - שימוש בשדה אימייל ישירות
  static async getPosts(brokerId: string) {
    try {
      const filterFormula = `{אימייל (from מתווך בעל בלעדיות)} = '${brokerId}'`;
      const response = await fetch(
        `${BASE_URL}/פרסומים?filterByFormula=${encodeURIComponent(filterFormula)}`,
        { headers }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.records && data.records.length > 0) {
          return data.records.map((record: any) => ({
            id: record.id,
            ...record.fields
          }));
        }
      }
    } catch (error) {
      console.error('שגיאה בקבלת פרסומים:', error);
    }
    
    return [];
  }

  static async createPost(post: Omit<Post, 'id'>) {
    const response = await fetch(`${BASE_URL}/פרסומים`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        fields: post
      })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create post: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return { id: data.id, ...data.fields };
  }

  static async updatePost(id: string, fields: Partial<Post>) {
    const response = await fetch(`${BASE_URL}/פרסומים/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ fields })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update post: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return { id: data.id, ...data.fields };
  }

  static async deletePost(id: string) {
    const response = await fetch(`${BASE_URL}/פרסומים/${id}`, {
      method: 'DELETE',
      headers
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete post: ${response.status} ${response.statusText}`);
    }
  }

  // Images API - שינוי לטבלה "תמונות"
  static async getImages(propertyId: string) {
    const filterFormula = `{property} = '${propertyId}'`;
    const response = await fetch(
      `${BASE_URL}/תמונות?filterByFormula=${encodeURIComponent(filterFormula)}`,
      { headers }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch images: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.records?.map((record: any) => ({
      id: record.id,
      ...record.fields
    })) || [];
  }
}
