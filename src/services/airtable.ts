
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
    
    if (AIRTABLE_BASE_ID === 'YOUR_BASE_ID_HERE') {
      console.error('❌ Base ID לא עודכן! החלף את YOUR_BASE_ID_HERE עם ה-Base ID האמיתי');
      return false;
    }
    
    if (AIRTABLE_API_KEY === 'YOUR_API_KEY_HERE') {
      console.error('❌ API Key לא עודכן! החלף את YOUR_API_KEY_HERE עם ה-API Key האמיתי');
      return false;
    }
    
    if (AIRTABLE_BASE_ID && !AIRTABLE_BASE_ID.startsWith('app')) {
      console.error('❌ Base ID צריך להתחיל ב-app');
      return false;
    }
    
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
      const response = await fetch(`${BASE_URL}/Users?maxRecords=1`, { headers });
      
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
      console.error('💡 וודא שיש לך הרשאות לגשת לטבלה Users');
      return false;
    }
  }

  // Users API
  static async getUsers() {
    const response = await fetch(`${BASE_URL}/Users`, { headers });
    const data = await response.json();
    return data.records.map((record: any) => ({
      id: record.id,
      ...record.fields
    }));
  }

  // Properties API
  static async getProperties(brokerId: string) {
    const filterFormula = `{broker} = '${brokerId}'`;
    const response = await fetch(
      `${BASE_URL}/Properties?filterByFormula=${encodeURIComponent(filterFormula)}`,
      { headers }
    );
    const data = await response.json();
    return data.records.map((record: any) => ({
      id: record.id,
      ...record.fields
    }));
  }

  static async createProperty(property: Omit<Property, 'id'>) {
    const response = await fetch(`${BASE_URL}/Properties`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        fields: property
      })
    });
    const data = await response.json();
    return { id: data.id, ...data.fields };
  }

  static async updateProperty(id: string, fields: Partial<Property>) {
    const response = await fetch(`${BASE_URL}/Properties/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ fields })
    });
    const data = await response.json();
    return { id: data.id, ...data.fields };
  }

  static async deleteProperty(id: string) {
    await fetch(`${BASE_URL}/Properties/${id}`, {
      method: 'DELETE',
      headers
    });
  }

  // Posts API
  static async getPosts(brokerId: string) {
    const filterFormula = `{broker} = '${brokerId}'`;
    const response = await fetch(
      `${BASE_URL}/Posts?filterByFormula=${encodeURIComponent(filterFormula)}`,
      { headers }
    );
    const data = await response.json();
    return data.records.map((record: any) => ({
      id: record.id,
      ...record.fields
    }));
  }

  static async createPost(post: Omit<Post, 'id'>) {
    const response = await fetch(`${BASE_URL}/Posts`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        fields: post
      })
    });
    const data = await response.json();
    return { id: data.id, ...data.fields };
  }

  static async updatePost(id: string, fields: Partial<Post>) {
    const response = await fetch(`${BASE_URL}/Posts/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ fields })
    });
    const data = await response.json();
    return { id: data.id, ...data.fields };
  }

  static async deletePost(id: string) {
    await fetch(`${BASE_URL}/Posts/${id}`, {
      method: 'DELETE',
      headers
    });
  }

  // Images API
  static async getImages(propertyId: string) {
    const filterFormula = `{property} = '${propertyId}'`;
    const response = await fetch(
      `${BASE_URL}/Images?filterByFormula=${encodeURIComponent(filterFormula)}`,
      { headers }
    );
    const data = await response.json();
    return data.records.map((record: any) => ({
      id: record.id,
      ...record.fields
    }));
  }
}
