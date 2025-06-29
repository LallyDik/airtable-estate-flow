
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
      formData.append('file', file);
      
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
      
      // נניח שהשרת מחזיר URL בתגובה
      const responseText = await response.text();
      console.log('✅ תגובה מהשרת:', responseText);
      
      // אם השרת מחזיר JSON עם URL
      try {
        const jsonResponse = JSON.parse(responseText);
        if (jsonResponse.url) {
          console.log('✅ קובץ הועלה בהצלחה:', jsonResponse.url);
          return jsonResponse.url;
        }
      } catch (e) {
        // אם זה לא JSON, נניח שהתגובה היא ה-URL עצמו
        if (responseText.startsWith('http')) {
          console.log('✅ קובץ הועלה בהצלחה:', responseText);
          return responseText.trim();
        }
      }
      
      throw new Error('Invalid response format from upload server');
      
    } catch (error) {
      console.error('❌ שגיאה בהעלאת קובץ:', error);
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
