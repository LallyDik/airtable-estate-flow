
import { Property, Post } from '@/types';

// ⚠️ חובה לעדכן את הפרטים הבאים:
const AIRTABLE_BASE_ID = 'appOvCJ87X4ohISLL'; // למשל: appXXXXXXXXXXXXXX
const AIRTABLE_API_KEY = 'path5GRXWyf81Jz1U.2bda996b8605d6d737714d48c82444a362105f15798ce99789aa9b604fe63ac3'; // Personal Access Token מ-Airtable

const BASE_URL = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}`;

const headers = {
  'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
  'Content-Type': 'application/json',
};

// פונקציה למיפוי נתוני הטופס לשדות Airtable
const mapPropertyToAirtableFields = (property: Omit<Property, 'id'>, isUpdate: boolean = false, brokerRecordId?: string) => {
  const fields: Record<string, any> = {
    'שם נכס לתצוגה': property.title,
    'תיאור חופשי לפרסום': property.description,
    'מחיר שיווק': property.price,
    'שכונה': property.neighborhood,
    'עיר': property.city,
    'רחוב': property.street,
    'קומה': property.floor,
  };

  // הוספת קישור למתווך רק בעת יצירת נכס חדש, לא בעדכון
  if (!isUpdate && brokerRecordId) {
    fields['מתווך בעל בלעדיות'] = [brokerRecordId]; // Array format for linked record
  }

  // רק אם יש סוג נכס תקין נוסיף אותו
  if (property.type && property.type.trim() !== '') {
    fields['סוג נכס'] = property.type.trim();
  }

  // תיקון לשדה כמות חדרים - נטפל בו בצורה בטוחה
  if (property.rooms !== undefined && property.rooms !== null && property.rooms !== '') {
    // המרת הערך למחרוזת ראשית
    const roomsStr = String(property.rooms);
    
    // אם זה מחרוזת עם ערך, ננקה אותה
    if (roomsStr.trim() !== '') {
      // נבדוק אם זה מספר תקין
      const roomsAsNumber = parseFloat(roomsStr);
      if (!isNaN(roomsAsNumber)) {
        fields['כמות חדרים'] = roomsAsNumber;
      } else {
        fields['כמות חדרים'] = roomsStr.trim();
      }
    }
  }

  // רק אם יש ערך בשדה "מוכן לקבל הצעות עד" נוסיף אותו
  if (property.offersUntil && property.offersUntil.trim() !== '') {
    fields['מוכן לקבל הצעות עד'] = property.offersUntil.trim();
  }

  console.log('📝 שדות ליצירת/עדכון נכס:', fields);
  return fields;
};

// פונקציה למיפוי נתוני פרסום לשדות Airtable
const mapPostToAirtableFields = (post: Omit<Post, 'id'>, propertyRecordId?: string) => {
  const fields: Record<string, any> = {
    'תאריך פרסום': post.date,
    'זמן פרסום': post.timeSlot === 'morning' ? 'בוקר' : 
                  post.timeSlot === 'afternoon' ? 'צהריים' : 'ערב',
    'סטטוס פרסום': 'פרסום מיידי'
    // הסרנו את 'מועד פרסום' כי זה שדה מחושב
  };

  // הוספת קישור לנכס אם קיים
  if (propertyRecordId) {
    fields['נכסים לפרסום'] = [propertyRecordId];
  } else if (post.property) {
    fields['נכסים לפרסום'] = [post.property];
  }

  console.log('📝 שדות ליצירת פרסום:', fields);
  return fields;
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

  // פונקציה חדשה לקבלת Record ID של מתווך לפי אימייל
  static async getBrokerRecordIdByEmail(email: string): Promise<string | null> {
    try {
      console.log('🔍 מחפש מתווך עבור אימייל:', email);
      
      const filterFormula = `{אימייל} = '${email}'`;
      const response = await fetch(
        `${BASE_URL}/אנשי קשר?filterByFormula=${encodeURIComponent(filterFormula)}`,
        { headers }
      );
      
      if (!response.ok) {
        console.error('❌ שגיאה בחיפוש מתווך:', response.status);
        return null;
      }
      
      const data = await response.json();
      
      if (data.records && data.records.length > 0) {
        const brokerRecordId = data.records[0].id;
        console.log('✅ נמצא מתווך עם Record ID:', brokerRecordId);
        return brokerRecordId;
      } else {
        console.log('⚠️ לא נמצא מתווך עבור האימייל');
        return null;
      }
    } catch (error) {
      console.error('❌ שגיאה בחיפוש מתווך:', error);
      return null;
    }
  }

  // Properties API - השתמש רק בנוסחה של אימייל מתווך
  static async getProperties(userEmail: string) {
    console.log('🔍 מבקש נכסים עבור אימייל:', userEmail);
    
    try {
      // נוסחה פשוטה ויחידה לפי אימייל המתווך
      const filterFormula = `{אימייל (from מתווך בעל בלעדיות)} = '${userEmail}'`;
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
        
        return data.records.map((record: any) => ({
          id: record.id,
          title: record.fields['שם נכס לתצוגה'] || record.fields['שם נכס'] || 'נכס ללא שם',
          description: record.fields['תיאור חופשי לפרסום'] || '',
          address: `${record.fields['רחוב'] || ''} ${record.fields['עיר'] || ''}`.trim() || 'כתובת לא זמינה',
          price: record.fields['מחיר שיווק'] || 0,
          type: record.fields['סוג נכס'] || 'לא צוין',
          size: record.fields['שטח'] || 0,
          broker: userEmail,
          createdAt: record.fields['create time'] || new Date().toISOString(),
          rooms: record.fields['כמות חדרים'] || '',
          neighborhood: record.fields['שכונה'] || '',
          city: record.fields['עיר'] || '',
          street: record.fields['רחוב'] || '',
          floor: record.fields['קומה'] || '',
          number: record.fields['מספר בית'] || '',
          offersUntil: record.fields['מוכן לקבל הצעות עד'] || '',
          exclusivityDocument: record.fields['מסמך בלעדיות'] || '',
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
    console.log('🏠 יוצר נכס חדש:', property.title);
    
    // קבלת Record ID של המתווך לפני יצירת הנכס
    const brokerRecordId = await this.getBrokerRecordIdByEmail(property.broker);
    
    if (!brokerRecordId) {
      throw new Error(`לא נמצא מתווך עבור האימייל: ${property.broker}`);
    }
    
    const airtableFields = mapPropertyToAirtableFields(property, false, brokerRecordId);
    console.log('📝 שדות ליצירת נכס:', airtableFields);
    
    const response = await fetch(`${BASE_URL}/נכסים`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        fields: airtableFields
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ שגיאה ביצירת נכס:', errorText);
      throw new Error(`Failed to create property: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ נכס נוצר בהצלחה:', data.id);
    return { id: data.id, ...data.fields };
  }

  static async updateProperty(id: string, property: Partial<Property>) {
    console.log('📝 מעדכן נכס:', id);
    
    const airtableFields = mapPropertyToAirtableFields(property as Omit<Property, 'id'>, true);
    console.log('📝 שדות לעדכון נכס:', airtableFields);
    
    const response = await fetch(`${BASE_URL}/נכסים/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ 
        fields: airtableFields 
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ שגיאה בעדכון נכס:', errorText);
      throw new Error(`Failed to update property: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ נכס עודכן בהצלחה:', data.id);
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

  // פונקציה חדשה להעלאת מסמך בלעדיות - עם סימון זמני
  static async uploadExclusivityDocument(propertyId: string, documentFile: File) {
    console.log('📎 מעלה מסמך בלעדיות לנכס:', propertyId);
    console.log('⚠️ הערה: זהו קישור זמני - יש צורך בשירות העלאת קבצים חיצוני');
    
    try {
      // כרגע נעדכן רק עם סימון שהמסמך הועלה
      const fields = {
        'מסמך בלעדיות': `זמני - ${documentFile.name} (הועלה ${new Date().toLocaleDateString('he-IL')})`
      };
      
      const response = await fetch(`${BASE_URL}/נכסים/${propertyId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ fields })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ שגיאה בהעלאת מסמך בלעדיות:', errorData);
        throw new Error(`Failed to upload exclusivity document: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ מסמך בלעדיות סומן כהועלה:', data);
      return data;
      
    } catch (error) {
      console.error('❌ שגיאה בהעלאת מסמך בלעדיות:', error);
      throw error;
    }
  }

  // פונקציה להעלאת תמונות לטבלת תמונות - עם קישור זמני
  static async uploadImageToImagesTable(propertyId: string, imageFile: File, imageName: string) {
    console.log('🖼️ מעלה תמונה לטבלת תמונות:', imageName);
    console.log('⚠️ הערה: זהו קישור זמני - יש צורך בשירות העלאת קבצים חיצוני');
    
    try {
      // נשתמש בגישה רגילה עם JSON
      // כרגע נשמור רק פרטי הקישור הזמני
      const fields = {
        'נכסים': [propertyId], // קישור לנכס
        'קישור לתמונה': `זמני - ${imageFile.name} (הועלה ${new Date().toLocaleDateString('he-IL')})`
      };
      
      const response = await fetch(`${BASE_URL}/טבלת תמונות`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ fields })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ שגיאה בהעלאת תמונה:', errorData);
        throw new Error(`Failed to upload image: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ תמונה הועלה בהצלחה לטבלת תמונות:', data);
      return data;
      
    } catch (error) {
      console.error('❌ שגיאה בהעלאת תמונה:', error);
      throw error;
    }
  }

  // פונקציה חדשה לקבלת שמות השדות מטבלת פרסומי נכסים
  static async getPostsTableFields() {
    console.log('🔍 מקבל שמות שדות מטבלת פרסומי נכסים...');
    
    try {
      // נקבל רשומה אחת כדי לראות את שמות השדות
      const response = await fetch(`${BASE_URL}/פרסומי נכסים?maxRecords=1`, { headers });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ שגיאה בקבלת שדות הטבלה:', errorText);
        throw new Error(`Failed to fetch table fields: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ נתוני טבלת פרסומי נכסים:', data);
      
      if (data.records && data.records.length > 0) {
        const fields = Object.keys(data.records[0].fields);
        console.log('📋 שמות השדות בטבלת פרסומי נכסים:', fields);
        return fields;
      } else {
        console.log('⚠️ לא נמצאו רשומות בטבלת פרסומי נכסים');
        return [];
      }
    } catch (error) {
      console.error('❌ שגיאה בקבלת שדות טבלת פרסומי נכסים:', error);
      throw error;
    }
  }

  // Posts API - עדכון לטבלה "פרסומי נכסים" עם השדות הנכונים
  static async getPosts(userEmail: string) {
    console.log('🔍 מבקש פרסומים עבור אימייל:', userEmail);
    
    try {
      // ראשית נבדוק איזה שדות יש בטבלה
      console.log('📋 בודק שדות בטבלת פרסומי נכסים...');
      await this.getPostsTableFields();
      
      // נקבל את כל הפרסומים ונסנן לפי המתווך
      const response = await fetch(`${BASE_URL}/פרסומי נכסים`, { headers });
      
      console.log('📊 סטטוס תגובה לפרסומים:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ נתוני פרסומים:', data);
        
        if (data.records && data.records.length > 0) {
          // קבלת Record ID של המתווך
          const brokerRecordId = await this.getBrokerRecordIdByEmail(userEmail);
          
          // נסנן את הפרסומים לפי Record ID של המתווך
          const userPosts = data.records.filter((record: any) => {
            const recordBrokers = record.fields['מתווך'];
            return recordBrokers && recordBrokers.includes(brokerRecordId);
          });
          
          console.log('📈 מספר פרסומים של המתווך:', userPosts.length);
          
          return userPosts.map((record: any) => ({
            id: record.id,
            property: record.fields['נכסים לפרסום'] ? record.fields['נכסים לפרסום'][0] : '',
            date: record.fields['תאריך פרסום'] || record.fields['Calculation'] || '',
            timeSlot: this.mapTimeSlotFromAirtable(record.fields['זמן פרסום']),
            broker: userEmail,
            createdAt: record.createdTime || new Date().toISOString(),
            propertyTitle: record.fields['שם נכס (from נכסים לפרסום)'] || 'נכס'
          }));
        }
      } else {
        const errorText = await response.text();
        console.error('❌ שגיאה בקבלת פרסומים:', errorText);
      }
    } catch (error) {
      console.error('❌ שגיאה בקבלת פרסומים:', error);
    }
    
    return [];
  }

  // פונקציה למיפוי זמן פרסום מ-Airtable לסוג TimeSlot
  static mapTimeSlotFromAirtable(timeValue: string): 'morning' | 'afternoon' | 'evening' {
    if (!timeValue) return 'morning';
    
    const lowerValue = timeValue.toLowerCase();
    if (lowerValue.includes('בוקר')) return 'morning';
    if (lowerValue.includes('צהריים')) return 'afternoon';
    if (lowerValue.includes('ערב')) return 'evening';
    
    return 'morning'; // ברירת מחדל
  }

  static async createPost(post: Omit<Post, 'id'>) {
    console.log('📝 יוצר פרסום חדש:', post);
    
    // קבלת Record ID של המתווך
    const brokerRecordId = await this.getBrokerRecordIdByEmail(post.broker);
    
    if (!brokerRecordId) {
      throw new Error(`לא נמצא מתווך עבור האימייל: ${post.broker}`);
    }
    
    const airtableFields = mapPostToAirtableFields(post);
    // הוספת המתווך
    airtableFields['מתווך'] = [brokerRecordId];
    
    const response = await fetch(`${BASE_URL}/פרסומי נכסים`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        fields: airtableFields
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ שגיאה ביצירת פרסום:', errorText);
      throw new Error(`Failed to create post: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ פרסום נוצר בהצלחה:', data);
    return { id: data.id, ...data.fields };
  }

  static async updatePost(id: string, fields: Partial<Post>) {
    console.log('📝 מעדכן פרסום:', id);
    
    const airtableFields = mapPostToAirtableFields(fields as Omit<Post, 'id'>);
    
    const response = await fetch(`${BASE_URL}/פרסומי נכסים/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ 
        fields: airtableFields 
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ שגיאה בעדכון פרסום:', errorText);
      throw new Error(`Failed to update post: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ פרסום עודכן בהצלחה:', data);
    return { id: data.id, ...data.fields };
  }

  static async deletePost(id: string) {
    console.log('🗑️ מוחק פרסום:', id);
    
    const response = await fetch(`${BASE_URL}/פרסומי נכסים/${id}`, {
      method: 'DELETE',
      headers
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ שגיאה במחיקת פרסום:', errorText);
      throw new Error(`Failed to delete post: ${response.status} ${response.statusText}`);
    }
    
    console.log('✅ פרסום נמחק בהצלחה');
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
