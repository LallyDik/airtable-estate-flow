
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

  // בדיקה שהמתווך קיים בטבלת אנשי קשר
  static async verifyBrokerExists(brokerId: string) {
    console.log('🔍 בודק שהמתווך קיים:', brokerId);
    try {
      const filterFormula = `{אימייל} = '${brokerId}'`;
      const response = await fetch(
        `${BASE_URL}/אנשי קשר?filterByFormula=${encodeURIComponent(filterFormula)}`,
        { headers }
      );
      
      if (!response.ok) {
        console.error('❌ שגיאה בבדיקת מתווך:', response.status);
        return false;
      }
      
      const data = await response.json();
      const brokerExists = data.records && data.records.length > 0;
      
      if (brokerExists) {
        console.log('✅ מתווך נמצא בטבלת אנשי קשר');
        console.log('📄 פרטי המתווך מטבלת אנשי קשר:', data.records[0]);
        console.log('📝 שדות המתווך מטבלת אנשי קשר:', data.records[0].fields);
        console.log('🔑 מפתחות השדות בטבלת אנשי קשר:', Object.keys(data.records[0].fields));
        console.log('🆔 Record ID של המתווך:', data.records[0].id);
      } else {
        console.log('❌ מתווך לא נמצא בטבלת אנשי קשר');
      }
      
      return brokerExists;
    } catch (error) {
      console.error('❌ שגיאה בבדיקת מתווך:', error);
      return false;
    }
  }

  // פונקציה חדשה לבדיקת כל הנכסים - לדיבוג
  static async debugAllProperties() {
    console.log('🔍 בודק את כל הנכסים בטבלה:');
    try {
      const response = await fetch(`${BASE_URL}/נכסים?maxRecords=10`, { headers });
      
      if (!response.ok) {
        console.error('❌ שגיאה בקבלת נכסים לדיבוג:', response.status);
        return;
      }
      
      const data = await response.json();
      console.log('🔍 כל הנכסים בטבלה:', data);
      
      if (data.records && data.records.length > 0) {
        console.log('📝 דוגמת נכס ראשון:');
        console.log('Fields:', data.records[0].fields);
        console.log('Available field names:', Object.keys(data.records[0].fields));
      }
    } catch (error) {
      console.error('❌ שגיאה בדיבוג נכסים:', error);
    }
  }

  // Properties API - שינוי לטבלה "נכסים" ושדה "מתווך בעל בלעדיות"
  static async getProperties(brokerId: string) {
    console.log('🔍 מבקש נכסים עבור ברוקר:', brokerId);
    
    // בדיקה שהמתווך קיים
    const brokerExists = await this.verifyBrokerExists(brokerId);
    if (!brokerExists) {
      console.warn('⚠️ מתווך לא נמצא בטבלת אנשי קשר');
      return [];
    }
    
    // הרצת בדיקת דיבוג
    await this.debugAllProperties();
    
    const filterFormula = `{מתווך בעל בלעדיות} = '${brokerId}'`;
    console.log('📝 נוסחת סינון:', filterFormula);
    
    try {
      const response = await fetch(
        `${BASE_URL}/נכסים?filterByFormula=${encodeURIComponent(filterFormula)}`,
        { headers }
      );
      
      console.log('📊 סטטוס תגובה עבור נכסים:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ שגיאה בקבלת נכסים:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ נתוני נכסים התקבלו:', data);
      
      if (!data.records) {
        console.warn('⚠️ אין records בתגובה');
        return [];
      }
      
      return data.records.map((record: any) => ({
        id: record.id,
        ...record.fields
      }));
    } catch (error) {
      console.error('❌ שגיאה בטעינת נכסים:', error);
      throw error;
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

  // Posts API - שינוי לטבלה "פרסומים" ושדה "מתווך בעל בלעדיות"
  static async getPosts(brokerId: string) {
    // בדיקה שהמתווך קיים
    const brokerExists = await this.verifyBrokerExists(brokerId);
    if (!brokerExists) {
      console.warn('⚠️ מתווך לא נמצא בטבלת אנשי קשר');
      return [];
    }
    
    const filterFormula = `{מתווך בעל בלעדיות} = '${brokerId}'`;
    const response = await fetch(
      `${BASE_URL}/פרסומים?filterByFormula=${encodeURIComponent(filterFormula)}`,
      { headers }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch posts: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.records?.map((record: any) => ({
      id: record.id,
      ...record.fields
    })) || [];
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
