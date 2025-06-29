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
    'שכונה': property.neighborhood || '',
    'עיר': property.city || 'חריש',
    'רחוב': property.street || '',
    'מספר': property.number || '',
    'קומה': property.floor || '',
    'סוג השיווק': property.marketingType || 'מכירה',
    'מוכן לקבל הצעות עד': property.offersUntil ? parseFloat(property.offersUntil) : null,
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

  // הוספת מסמך בלעדיות אם קיים - בפורמט Attachment הנכון
  if (property.exclusivityDocument && property.exclusivityDocument.trim() !== '') {
    // בדיקה אם זה URL תקין
    if (property.exclusivityDocument.startsWith('http')) {
      fields['מסמך בלעדיות'] = [{
        url: property.exclusivityDocument,
        filename: 'מסמך בלעדיות'
      }];
      console.log('📎 מוסיף מסמך בלעדיות בפורמט Attachment:', fields['מסמך בלעדיות']);
    }
  }

  console.log('📝 שדות ליצירת/עדכון נכס:', fields);
  return fields;
};

// פונקציה למיפוי נתוני פרסום לשדות Airtable - עדכון לסכמה החדשה
const mapPostToAirtableFields = (post: Omit<Post, 'id'>, propertyRecordId?: string) => {
  // מיפוי זמן פרסום לערכים המתאימים ב-Airtable
  let timeSlotValue = '';
  switch (post.timeSlot) {
    case 'morning':
      timeSlotValue = 'בוקר';
      break;
    case 'afternoon':
      timeSlotValue = 'צהריים';
      break;
    case 'evening':
      timeSlotValue = 'ערב';
      break;
    case 'נכס חדש':
      timeSlotValue = 'נכס חדש';
      break;
    default:
      timeSlotValue = 'בוקר';
  }

  const fields: Record<string, any> = {
    'תאריך פרסום': post.date,
    'זמן פרסום': timeSlotValue,
    'סטטוס פרסום': 'פרסום מיידי'
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

  // פונקציה חדשה לקבלת Record ID של מתווך לפי אימייל או Record ID
  static async getBrokerRecordIdByEmailOrId(emailOrId: string): Promise<string | null> {
    try {
      console.log('🔍 מחפש מתווך עבור:', emailOrId);
      
      // תחילה נבדוק אם זה Record ID (מתחיל ב-rec)
      if (emailOrId.startsWith('rec')) {
        console.log('🔗 זהו Record ID, מחזיר כמו שהוא:', emailOrId);
        return emailOrId;
      }
      
      // אם זה לא Record ID, נחפש לפי אימייל
      console.log('📧 מחפש לפי אימייל:', emailOrId);
      const filterFormula = `{אימייל} = '${emailOrId}'`;
      const response = await fetch(
        `${BASE_URL}/אנשי קשר?filterByFormula=${encodeURIComponent(filterFormula)}`,
        { headers }
      );
      
      if (!response.ok) {
        console.error('❌ שגיאה בחיפוש מתווך:', response.status);
        return null;
      }
      
      const data = await response.json();
      console.log('📊 תוצאות חיפוש מתווך:', data);
      
      if (data.records && data.records.length > 0) {
        const brokerRecordId = data.records[0].id;
        console.log('✅ נמצא מתווך עם Record ID:', brokerRecordId);
        return brokerRecordId;
      } else {
        console.log('⚠️ לא נמצא מתווך עבור האימייל:', emailOrId);
        return null;
      }
    } catch (error) {
      console.error('❌ שגיאה בחיפוש מתווך:', error);
      return null;
    }
  }

  // Keep the old function for backward compatibility
  static async getBrokerRecordIdByEmail(email: string): Promise<string | null> {
    return this.getBrokerRecordIdByEmailOrId(email);
  }

  // Properties API - השתמש רק בנוסחה של אימייל מתווך
  static async getProperties(userEmail: string) {
    console.log('🔍 מבקש נכסים עבור:', userEmail);

    try {
      // תמיד חפש לפי אימייל
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
        
        return data.records.map((record: any) => {
          const propertyData = {
            id: record.id,
            title: record.fields['שם נכס לתצוגה'] || record.fields['שם נכס'] || 'נכס ללא שם',
            description: record.fields['תיאור חופשי לפרסום'] || '',
            address: `${record.fields['רחוב'] || ''} ${record.fields['מספר'] || ''} ${record.fields['עיר'] || ''}`.trim() || 'כתובת לא זמינה',
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
            number: record.fields['מספר'] || '',
            offersUntil: record.fields['מוכן לקבל הצעות עד'] ? String(record.fields['מוכן לקבל הצעות עד']) : '',
            exclusivityDocument: record.fields['מסמך בלעדיות'] || '',
            marketingType: record.fields['סוג השיווק'] || 'מכירה',
            ...record.fields
          };
          console.log('🏠 נכס נמצא:', propertyData);
          return propertyData;
        });
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
    console.log('👤 מתווך ID/Email:', property.broker);
    
    // קבלת Record ID של המתווך לפני יצירת הנכס - תמיכה גם ב-Record ID וגם באימייל
    const brokerRecordId = await this.getBrokerRecordIdByEmailOrId(property.broker);
    
    console.log('🔍 תוצאת חיפוש מתווך:', { 
      input: property.broker, 
      output: brokerRecordId 
    });
    
    if (!brokerRecordId) {
      const errorMessage = `לא נמצא מתווך עבור: ${property.broker}`;
      console.error('❌', errorMessage);
      throw new Error(errorMessage);
    }
    
    console.log('✅ Record ID של המתווך:', brokerRecordId);
    
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

  // פונקציה להעלאת תמונות לטבלת תמונות - עדכון עם debugging מרחיב
  static async uploadImageToImagesTable(propertyId: string, imageUrl: string, imageName: string) {
    console.log('🖼️ מתחיל שמירת תמונה בטבלת תמונות...');
    console.log('🆔 Property ID:', propertyId);
    console.log('🔗 Image URL:', imageUrl);
    console.log('📝 Image Name:', imageName);
    
    try {
      // בדיקה שכל הפרמטרים קיימים
      if (!propertyId || !imageUrl || !imageName) {
        throw new Error('חסרים פרמטרים חובה לשמירת תמונה');
      }
      
      // בדיקה שה-URL תקין
      if (!imageUrl.startsWith('http')) {
        throw new Error('URL התמונה אינו תקין');
      }
      
      const fields = {
        'נכסים': [propertyId], // קישור לנכס
        'שם התמונה': imageName,
        'תמונות וסרטונים': [{
          url: imageUrl,
          filename: imageName
        }]
      };
      
      console.log('📝 שדות לשמירה בטבלת תמונות:', JSON.stringify(fields, null, 2));
      
      const response = await fetch(`${BASE_URL}/טבלת תמונות`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ fields })
      });
      
      console.log('📊 סטטוס תגובה:', response.status);
      console.log('📊 סטטוס טקסט:', response.statusText);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ שגיאה בשמירת תמונה - תגובת שרת:', errorData);
        throw new Error(`Failed to save image: ${response.status} ${response.statusText} - ${errorData}`);
      }
      
      const data = await response.json();
      console.log('✅ תמונה נשמרה בהצלחה בטבלת תמונות!');
      console.log('📄 נתוני התגובה:', JSON.stringify(data, null, 2));
      return data;
      
    } catch (error) {
      console.error('❌ שגיאה בשמירת תמונה:', error);
      console.error('📄 פרטי השגיאה:', error);
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

  // Posts API - עדכון לטבלה "פרסומי נכסים" עם השדות החדשים
  static async getPosts(userEmailOrId: string) {
    console.log('🔍 מבקש פרסומים עבור:', userEmailOrId);
    
    try {
      // נקבל את כל הפרסומים ונסנן לפי המתווך
      const response = await fetch(`${BASE_URL}/פרסומי נכסים`, { headers });
      
      console.log('📊 סטטוס תגובה לפרסומים:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ נתוני פרסומים:', data);
        
        if (data.records && data.records.length > 0) {
          // קבלת Record ID של המתווך
          const brokerRecordId = await this.getBrokerRecordIdByEmailOrId(userEmailOrId);
          
          // נסנן את הפרסומים לפי Record ID של המתווך
          const userPosts = data.records.filter((record: any) => {
            const recordBrokers = record.fields['מתווך'];
            return recordBrokers && recordBrokers.includes(brokerRecordId);
          });
          
          console.log('📈 מספר פרסומים של המתווך:', userPosts.length);
          
          return userPosts.map((record: any) => {
            // קבלת שם הנכס הנכון מהשדה החדש
            let propertyTitle = 'נכס לפרסום';
            
            // השתמש בשדה החדש מ-Airtable
            if (record.fields['שם נכס (from נכסים לפרסום)']) {
              let title = record.fields['שם נכס (from נכסים לפרסום)'];
              // אם זה מערך, קח את הערך הראשון
              if (Array.isArray(title) && title.length > 0) {
                title = title[0];
              }
              // ודא שזה שם תקין
              if (title && 
                  typeof title === 'string' && 
                  title.trim() && 
                  !title.includes('rec') &&
                  title !== 'נכס' &&
                  title !== 'undefined') {
                propertyTitle = title;
                console.log('📝 נמצא שם נכס מהשדה החדש:', title);
              }
            }
            
            const postData = {
              id: record.id,
              property: record.fields['נכסים לפרסום'] ? record.fields['נכסים לפרסום'][0] : '',
              date: record.fields['תאריך פרסום'] || record.fields['Calculation'] || '',
              timeSlot: this.mapTimeSlotFromAirtable(record.fields['זמן פרסום']),
              broker: userEmailOrId,
              createdAt: record.createdTime || new Date().toISOString(),
              propertyTitle: propertyTitle
            };
            console.log('📝 פרסום נמצא:', postData);
            return postData;
          });
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

  static async createPost(postData: Omit<Post, 'id'>) {
    // קבל מזהה רשומה של המתווך
    const brokerRecordId = await this.getBrokerRecordIdByEmailOrId(postData.broker);

    if (!brokerRecordId) {
      throw new Error('לא נמצא מתווך עבור הפרסום');
    }

    // צור את השדות לפרסום
    const fields = mapPostToAirtableFields(postData);

    // הוסף קישור למתווך
    fields['מתווך'] = [brokerRecordId];

    const response = await fetch(`${BASE_URL}/פרסומי נכסים`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ fields }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ שגיאה ביצירת פרסום:', errorText);
      throw new Error(`Failed to create post: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
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

  // Images API - עדכון לטבלה "טבלת תמונות" עם השדות החדשים
  static async getImages(propertyId: string) {
    console.log('🖼️ מבקש תמונות עבור נכס:', propertyId);
    
    try {
      const filterFormula = `{נכסים} = '${propertyId}'`;
      console.log('📝 נוסחת סינון לתמונות:', filterFormula);
      
      const response = await fetch(
        `${BASE_URL}/טבלת תמונות?filterByFormula=${encodeURIComponent(filterFormula)}`,
        { headers }
      );
      
      console.log('📊 סטטוס תגובה לתמונות:', response.status);
      
      if (!response.ok) {
        console.error('❌ שגיאה בקבלת תמונות:', response.status);
        return [];
      }
      
      const data = await response.json();
      console.log('✅ נתוני תמונות גולמיים:', data);
      
      if (!data.records) {
        console.log('⚠️ לא נמצאו רשומות תמונות');
        return [];
      }
      
      const processedImages = data.records.map((record: any) => {
        console.log('🖼️ מעבד תמונה:', record.fields);
        
        let imageUrl = '';
        let thumbnails = null;
        
        // בדיקת שדה תמונות וסרטונים מסוג Attachment
        if (record.fields['תמונות וסרטונים'] && Array.isArray(record.fields['תמונות וסרטונים']) && record.fields['תמונות וסרטונים'].length > 0) {
          const attachment = record.fields['תמונות וסרטונים'][0];
          imageUrl = attachment.url;
          thumbnails = attachment.thumbnails || null;
          console.log('🖼️ נמצאה תמונה מסוג Attachment:', imageUrl);
        }
        // בדיקת שדה קישור לתמונה מהפורמולה
        else if (record.fields['קישור לתמונה'] && 
                 typeof record.fields['קישור לתמונה'] === 'string' &&
                 !record.fields['קישור לתמונה'].includes('זמני') &&
                 (record.fields['קישור לתמונה'].startsWith('http') || 
                  record.fields['קישור לתמונה'].startsWith('https'))) {
          imageUrl = record.fields['קישור לתמונה'];
          console.log('🖼️ נמצא קישור לתמונה:', imageUrl);
        }
        
        const imageData = {
          id: record.id,
          url: imageUrl,
          filename: record.fields['שם התמונה'] || 'תמונה',
          thumbnails: thumbnails,
          ...record.fields
        };
        
        console.log('🖼️ תמונה מעובדת:', imageData);
        return imageData;
      });
      
      // סינון תמונות עם URL תקין בלבד
      const validImages = processedImages.filter(img => 
        img.url && 
        typeof img.url === 'string' && 
        img.url.trim() !== '' &&
        !img.url.includes('זמני') &&
        (img.url.startsWith('http') || img.url.startsWith('https'))
      );
      
      console.log('✅ תמונות תקינות:', validImages.length, 'מתוך', processedImages.length);
      
      return validImages;
    } catch (error) {
      console.error('❌ שגיאה בקבלת תמונות:', error);
      return [];
    }
  }

  // Add new method for getting documents
  static async getDocuments(propertyId: string) {
    console.log('📄 מבקש מסמכים עבור נכס:', propertyId);
    
    try {
      // נקבל את פרטי הנכס כדי לבדוק אם יש מסמך בלעדיות
      const response = await fetch(`${BASE_URL}/נכסים/${propertyId}`, { headers });
      
      if (!response.ok) {
        console.error('❌ שגיאה בקבלת מסמכים:', response.status);
        return [];
      }
      
      const data = await response.json();
      console.log('📄 נתוני נכס למסמכים:', data.fields);
      const documents = [];
      
      // בדיקה אם יש מסמך בלעדיות
      if (data.fields['מסמך בלעדיות']) {
        const exclusivityDoc = data.fields['מסמך בלעדיות'];
        
        // אם זה מערך של קבצים מצורפים
        if (Array.isArray(exclusivityDoc) && exclusivityDoc.length > 0) {
          exclusivityDoc.forEach((doc, index) => {
            if (doc.url && !doc.url.includes('זמני')) {
              documents.push({
                id: `exclusivity-${index}`,
                name: 'מסמך בלעדיות',
                url: doc.url,
                filename: doc.filename || 'מסמך בלעדיות',
                type: 'document'
              });
            }
          });
        }
        // אם זה קישור טקסט תקין
        else if (typeof exclusivityDoc === 'string' && 
                 exclusivityDoc.trim() !== '' && 
                 !exclusivityDoc.includes('זמני') &&
                 (exclusivityDoc.startsWith('http') || exclusivityDoc.startsWith('https'))) {
          documents.push({
            id: 'exclusivity',
            name: 'מסמך בלעדיות',
            url: exclusivityDoc,
            filename: 'מסמך בלעדיות',
            type: 'document'
          });
        }
      }
      
      console.log('✅ מסמכים תקינים נמצאו:', documents.length);
      return documents;
    } catch (error) {
      console.error('❌ שגיאה בקבלת מסמכים:', error);
      return [];
    }
  }
}
