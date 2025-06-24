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

  // בדיקה שהמתווך קיים בטבלת אנשי קשר וקבלת ה-Record ID שלו
  static async getBrokerRecordId(brokerId: string) {
    console.log('🔍 מקבל Record ID עבור מתווך:', brokerId);
    try {
      const filterFormula = `{אימייל} = '${brokerId}'`;
      const response = await fetch(
        `${BASE_URL}/אנשי קשר?filterByFormula=${encodeURIComponent(filterFormula)}`,
        { headers }
      );
      
      if (!response.ok) {
        console.error('❌ שגיאה בקבלת Record ID של מתווך:', response.status);
        return null;
      }
      
      const data = await response.json();
      if (data.records && data.records.length > 0) {
        const recordId = data.records[0].id;
        console.log('✅ Record ID של המתווך:', recordId);
        console.log('📄 פרטי המתווך מטבלת אנשי קשר:', data.records[0]);
        console.log('📝 שדות המתווך מטבלת אנשי קשר:', data.records[0].fields);
        console.log('🔑 מפתחות השדות בטבלת אנשי קשר:', Object.keys(data.records[0].fields));
        return recordId;
      } else {
        console.log('❌ מתווך לא נמצא בטבלת אנשי קשר');
        return null;
      }
    } catch (error) {
      console.error('❌ שגיאה בקבלת Record ID של מתווך:', error);
      return null;
    }
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

  // פונקציה חדשה לבדיקת כל הנכסים - לדיבוג מורחב
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
        
        // דיבוג מפורט לשדה מתווך בעל בלעדיות
        data.records.forEach((record, index) => {
          console.log(`🏠 נכס ${index + 1}:`);
          console.log(`  שם: ${record.fields['שם נכס לתצוגה'] || 'לא זמין'}`);
          console.log(`  מתווך בעל בלעדיות:`, record.fields['מתווך בעל בלעדיות']);
          console.log(`  סוג השדה מתווך:`, typeof record.fields['מתווך בעל בלעדיות']);
          if (Array.isArray(record.fields['מתווך בעל בלעדיות'])) {
            console.log(`  ערכי המערך:`, record.fields['מתווך בעל בלעדיות']);
          }
        });
      }
    } catch (error) {
      console.error('❌ שגיאה בדיבוג נכסים:', error);
    }
  }

  // Properties API - עדכון עם נוסחאות סינון מורחבות
  static async getProperties(brokerId: string) {
    console.log('🔍 מבקש נכסים עבור ברוקר:', brokerId);
    
    // קבלת Record ID של המתווך
    const brokerRecordId = await this.getBrokerRecordId(brokerId);
    if (!brokerRecordId) {
      console.warn('⚠️ לא ניתן לקבל Record ID של המתווך');
      return [];
    }
    
    // הרצת בדיקת דיבוג
    await this.debugAllProperties();
    
    // ניסיון נוסחאות סינון מורחבות
    const filterFormulas = [
      // הנוסחה החדשה שהמשתמש הציע
      `FIND('${brokerRecordId}', ARRAYJOIN({מתווך בעל בלעדיות}, ',')) > 0`,
      // נוסחאות קיימות
      `{מתווך בעל בלעדיות} = '${brokerRecordId}'`,
      `FIND('${brokerRecordId}', {מתווך בעל בלעדיות}) > 0`,
      `ARRAYJOIN({מתווך בעל בלעדיות}) = '${brokerRecordId}'`,
      // נוסחאות נוספות עם וריאציות שונות
      `FIND('${brokerRecordId}', CONCATENATE({מתווך בעל בלעדיות})) > 0`,
      `SEARCH('${brokerRecordId}', ARRAYJOIN({מתווך בעל בלעדיות}, '|')) > 0`,
      `IF(ISERROR(FIND('${brokerRecordId}', ARRAYJOIN({מתווך בעל בלעדיות}, ','))), FALSE, TRUE)`,
      // ניסיון עם שדה שם המתווך במקום Record ID
      `{שם המתווך בעל הבלעדיות} = 'נריה אבודרהם'`
    ];
    
    for (let i = 0; i < filterFormulas.length; i++) {
      const filterFormula = filterFormulas[i];
      console.log(`📝 מנסה נוסחת סינון ${i + 1}:`, filterFormula);
      
      try {
        const response = await fetch(
          `${BASE_URL}/נכסים?filterByFormula=${encodeURIComponent(filterFormula)}`,
          { headers }
        );
        
        console.log(`📊 סטטוס תגובה עבור נוסחה ${i + 1}:`, response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ שגיאה בנוסחה ${i + 1}:`, errorText);
          continue;
        }
        
        const data = await response.json();
        console.log(`✅ נתוני נכסים עבור נוסחה ${i + 1}:`, data);
        console.log(`📈 מספר נכסים שנמצאו: ${data.records?.length || 0}`);
        
        if (data.records && data.records.length > 0) {
          console.log(`🎉 מצאנו נכסים עם נוסחה ${i + 1}!`);
          console.log(`🔍 פרטי הנכס הראשון שנמצא:`, data.records[0]);
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
            ...record.fields
          }));
        }
      } catch (error) {
        console.error(`❌ שגיאה בנוסחה ${i + 1}:`, error);
        continue;
      }
    }
    
    console.log('⚠️ לא נמצאו נכסים עם אף אחת מהנוסחאות');
    console.log('💡 ייתכן שהשדה מתווך בעל בלעדיות מכיל ערכים שונים מהצפוי');
    return [];
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

  // Posts API - עדכון עם נוסחאות סינון מורחבות
  static async getPosts(brokerId: string) {
    // קבלת Record ID של המתווך
    const brokerRecordId = await this.getBrokerRecordId(brokerId);
    if (!brokerRecordId) {
      console.warn('⚠️ לא ניתן לקבל Record ID של המתווך');
      return [];
    }
    
    // ניסיון מספר נוסחאות סינון
    const filterFormulas = [
      `FIND('${brokerRecordId}', ARRAYJOIN({מתווך בעל בלעדיות}, ',')) > 0`,
      `{מתווך בעל בלעדיות} = '${brokerRecordId}'`,
      `FIND('${brokerRecordId}', {מתווך בעל בלעדיות}) > 0`
    ];
    
    for (const filterFormula of filterFormulas) {
      try {
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
        continue;
      }
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
