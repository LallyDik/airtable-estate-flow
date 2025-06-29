
// שירות העלאת קבצים לשרת חיצוני
export class FileUploadService {
  private static readonly UPLOAD_URL = 'https://files.thinka.co.il/upload';

  /**
   * העלאת קובץ יחיד לשרת
   */
  static async uploadFile(file: File): Promise<string> {
    console.log('📤 מעלה קובץ:', file.name, 'גודל:', file.size);
    
    try {
      const formData = new FormData();
      formData.append('file', file, file.name);
      
      console.log('🔄 שולח בקשה לשרת:', this.UPLOAD_URL);
      
      const response = await fetch(this.UPLOAD_URL, {
        method: 'POST',
        body: formData
      });
      
      console.log('📊 סטטוס תגובה:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ שגיאה בהעלאת קובץ:', errorText);
        throw new Error(`Failed to upload file: ${response.status} ${response.statusText}`);
      }
      
      // קריאת התגובה
      const responseText = await response.text();
      console.log('📄 תגובה גולמית מהשרת:', responseText);
      
      try {
        const jsonResponse = JSON.parse(responseText);
        console.log('✅ JSON שפורסר:', jsonResponse);
        
        // בדיקה לפי המבנה החדש: { "fields": { "מסמך בלעדיות": [{ "url": "..." }] } }
        if (jsonResponse.fields && jsonResponse.fields['מסמך בלעדיות'] && 
            Array.isArray(jsonResponse.fields['מסמך בלעדיות']) &&
            jsonResponse.fields['מסמך בלעדיות'][0] && 
            jsonResponse.fields['מסמך בלעדיות'][0].url) {
          const fileUrl = jsonResponse.fields['מסמך בלעדיות'][0].url;
          console.log('✅ קובץ הועלה בהצלחה (פורמט Airtable):', fileUrl);
          return fileUrl;
        }
        
        // בדיקה לפי המבנה הפשוט: { "url": "..." }
        if (jsonResponse.url) {
          console.log('✅ קובץ הועלה בהצלחה (פורמט פשוט):', jsonResponse.url);
          return jsonResponse.url;
        }
        
        // אם יש link במקום url
        if (jsonResponse.link) {
          console.log('✅ קובץ הועלה בהצלחה (link):', jsonResponse.link);
          return jsonResponse.link;
        }
        
        console.error('❌ לא נמצא URL בתגובת JSON:', jsonResponse);
        throw new Error('No URL found in server response');
        
      } catch (parseError) {
        console.log('⚠️ התגובה אינה JSON תקין, מנסה כטקסט רגיל');
        
        // אם זה לא JSON, בודקים אם זה URL ישירות
        if (responseText.startsWith('http')) {
          console.log('✅ קובץ הועלה בהצלחה (טקסט):', responseText.trim());
          return responseText.trim();
        }
        
        console.error('❌ תגובה לא מובנת:', responseText);
        throw new Error('Invalid response format from upload server');
      }
      
    } catch (error) {
      console.error('❌ שגיאה בהעלאת קובץ:', error);
      
      // הוספת פרטים נוספים על השגיאה
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        console.error('❌ שגיאת רשת - בדוק חיבור לאינטרנט או CORS');
        throw new Error('Network error: Unable to connect to upload server. Check CORS configuration.');
      }
      
      throw error;
    }
  }

  /**
   * העלאת מספר קבצים בבת אחת
   */
  static async uploadMultipleFiles(files: File[]): Promise<string[]> {
    console.log('📤 מעלה', files.length, 'קבצים');
    
    const uploadPromises = files.map(file => this.uploadFile(file));
    
    try {
      const urls = await Promise.all(uploadPromises);
      console.log('✅ כל הקבצים הועלו בהצלחה:', urls.length);
      return urls;
    } catch (error) {
      console.error('❌ שגיאה בהעלאת קבצים:', error);
      throw error;
    }
  }

  /**
   * בדיקה אם קובץ בגודל מתאים
   */
  static isFileSizeValid(file: File, maxSizeMB: number = 10): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  }

  /**
   * בדיקה אם סוג הקובץ מתאים
   */
  static isFileTypeValid(file: File, allowedTypes: string[]): boolean {
    return allowedTypes.some(type => {
      if (type.includes('*')) {
        const mimeCategory = type.split('/')[0];
        return file.type.startsWith(mimeCategory);
      }
      return file.type === type;
    });
  }
}
