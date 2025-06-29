import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileUp, X, FileImage, AlertCircle, Loader2 } from 'lucide-react';
import { Property } from '@/types';
import { AirtableService } from '@/services/airtable';
import { FileUploadService } from '@/services/fileUpload';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CreatePropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (property: Omit<Property, 'id'>) => Promise<any>;
  editProperty?: Property;
  brokerEmail: string;
}

const CreatePropertyModal = ({ isOpen, onClose, onSubmit, editProperty, brokerEmail }: CreatePropertyModalProps) => {
  const [formData, setFormData] = useState({
    title: '',
    neighborhood: '',
    city: 'חריש',
    street: '',
    number: '',
    floor: '',
    rooms: '',
    type: '',
    price: '',
    offersUntil: '',
    description: '',
    address: '',
  });

  const [exclusivityDocument, setExclusivityDocument] = useState<File | null>(null);
  const [exclusivityDocumentUrl, setExclusivityDocumentUrl] = useState<string>('');
  const [images, setImages] = useState<File[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [marketingType, setMarketingType] = useState<'מכירה' | 'השכרה'>('מכירה');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    console.log('🔄 עדכון טופס:', { editProperty, isOpen });

    if (isOpen) {
      if (editProperty) {
        console.log('✏️ מעדכן טופס לעריכה:', editProperty);
        setFormData({
          title: editProperty.title || '',
          neighborhood: editProperty.neighborhood || '',
          city: editProperty.city || 'חריש',
          street: editProperty.street || '',
          number: editProperty.number || '',
          floor: editProperty.floor || '',
          rooms: editProperty.rooms || '',
          type: editProperty.type || '',
          price: editProperty.price ? editProperty.price.toString() : '',
          offersUntil: editProperty.offersUntil || '',
          description: editProperty.description || '',
          address: editProperty.address || '',
        });
        setMarketingType((editProperty.marketingType as 'מכירה' | 'השכרה') || 'מכירה');
        setExclusivityDocumentUrl(editProperty.exclusivityDocument || '');
      } else {
        console.log('➕ איפוס טופס לנכס חדש');
        setFormData({
          title: '',
          neighborhood: '',
          city: 'חריש',
          street: '',
          number: '',
          floor: '',
          rooms: '',
          type: '',
          price: '',
          offersUntil: '',
          description: '',
          address: '',
        });
        setExclusivityDocument(null);
        setExclusivityDocumentUrl('');
        setMarketingType('מכירה');
      }
    }
  }, [editProperty, isOpen]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('📎 נבחר מסמך בלעדיות:', file.name);
      
      // בדיקת גודל קובץ (10MB)
      if (!FileUploadService.isFileSizeValid(file, 10)) {
        alert('הקובץ גדול מדי. הגודל המקסימלי הוא 10MB');
        return;
      }

      // בדיקת סוג קובץ
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png'
      ];
      
      if (!FileUploadService.isFileTypeValid(file, allowedTypes)) {
        alert('סוג קובץ לא נתמך. אנא העלה PDF, Word או תמונה');
        return;
      }

      setExclusivityDocument(file);
      // יצירת URL זמני לתצוגה עד להעלאה
      const tempUrl = URL.createObjectURL(file);
      setExclusivityDocumentUrl(tempUrl);
      console.log('✅ מסמך בלעדיות נבחר:', file.name);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      console.log('🖼️ נבחרו תמונות:', files.length);
      const newImages = Array.from(files);
      
      // בדיקת כל תמונה
      for (const file of newImages) {
        if (!FileUploadService.isFileSizeValid(file, 5)) {
          alert(`התמונה ${file.name} גדולה מדי. הגודל המקסימלי הוא 5MB`);
          return;
        }
        
        if (!FileUploadService.isFileTypeValid(file, ['image/*'])) {
          alert(`הקובץ ${file.name} אינו תמונה תקינה`);
          return;
        }
      }
      
      setImages(prevImages => [...prevImages, ...newImages]);
      // יצירת URLs זמניים לתצוגה
      const newUrls = newImages.map(file => URL.createObjectURL(file));
      setImageUrls(prevUrls => [...prevUrls, ...newUrls]);
      console.log('✅ תמונות נבחרו:', newImages.length);
    }
  };

  const removeFile = () => {
    console.log('🗑️ מוחק מסמך בלעדיות');
    setExclusivityDocument(null);
    setExclusivityDocumentUrl('');
  };

  const removeImage = (index: number) => {
    console.log('🗑️ מוחק תמונה:', index);
    setImages(prevImages => prevImages.filter((_, i) => i !== index));
    setImageUrls(prevUrls => prevUrls.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // בדיקה שסוג נכס נבחר
    if (!formData.type || formData.type.trim() === '') {
      alert('יש לבחור סוג נכס');
      return;
    }

    // בדיקה ששם הנכס קיים
    if (!formData.title || formData.title.trim() === '') {
      alert('יש להזין שם נכס');
      return;
    }

    // Create full address from components
    const addressParts = [formData.street, formData.number, formData.neighborhood, formData.city].filter(Boolean);
    const fullAddress = addressParts.join(', ');

    console.log('🔄 שולח נכס עם מתווך:', brokerEmail);
    console.log('📎 מסמך בלעדיות:', exclusivityDocument?.name || 'אין');
    console.log('🖼️ מספר תמונות:', images.length);

    try {
      setIsUploading(true);

      // יצירת אובייקט הנכס
      const propertyData = {
        title: formData.title,
        description: formData.description,
        address: fullAddress,
        price: formData.price ? Number(formData.price) : 0,
        type: formData.type,
        size: 0,
        broker: brokerEmail,
        createdAt: editProperty?.createdAt || new Date().toISOString(),
        neighborhood: formData.neighborhood,
        city: formData.city,
        street: formData.street,
        number: formData.number,
        floor: formData.floor,
        rooms: formData.rooms,
        offersUntil: formData.offersUntil,
        exclusivityDocument: '',
        marketingType: marketingType,
      };

      // ניסיון העלאת מסמך בלעדיות - אם נכשל, נמשיך בלי
      if (exclusivityDocument) {
        try {
          console.log('📤 מעלה מסמך בלעדיות...');
          const documentUrl = await FileUploadService.uploadFile(exclusivityDocument);
          propertyData.exclusivityDocument = documentUrl;
          console.log('✅ מסמך בלעדיות הועלה:', documentUrl);
        } catch (error) {
          console.error('❌ שגיאה בהעלאת מסמך בלעדיות:', error);
          console.log('⚠️ ממשיך ליצור נכס בלי מסמך בלעדיות');
        }
      }

      // קריאה לפונקציה המקורית - כאן מתבצעת הפעולה האמיתית
      console.log('🏠 יוצר נכס עם הנתונים:', propertyData);
      const createdProperty = await onSubmit(propertyData);
      console.log('✅ נכס נוצר - תגובה מהשרת:', createdProperty);

      // קבלת ID הנכס שנוצר - בדיקה מעמיקה יותר
      let propertyId = null;
      
      if (createdProperty?.id) {
        propertyId = createdProperty.id;
        console.log('🆔 ID נמצא ישירות:', propertyId);
      } else if (createdProperty?.record?.id) {
        propertyId = createdProperty.record.id;
        console.log('🆔 ID נמצא ברשומה:', propertyId);
      } else if (typeof createdProperty === 'string' && createdProperty.startsWith('rec')) {
        propertyId = createdProperty;
        console.log('🆔 ID הוא מחרוזת:', propertyId);
      }
      
      console.log('🔍 ID סופי של הנכס:', propertyId);

      // העלאת תמונות לטבלת תמונות אם יש מזהה נכס
      if (images.length > 0) {
        if (!propertyId) {
          console.error('❌ לא נמצא ID לנכס - לא ניתן להעלות תמונות');
          alert('הנכס נוצר אך התמונות לא הועלו בגלל בעיה טכנית');
        } else {
          try {
            console.log('🖼️ מתחיל העלאת תמונות לטבלת תמונות...');
            console.log('🆔 ID הנכס להעלאת תמונות:', propertyId);
            
            // העלאת כל תמונה בנפרד
            for (let i = 0; i < images.length; i++) {
              const image = images[i];
              console.log(`📤 מעלה תמונה ${i + 1}/${images.length}:`, image.name);
              
              try {
                // העלאת התמונה לשרת קבצים
                console.log('📤 מעלה תמונה לשרת קבצים...');
                const imageUrl = await FileUploadService.uploadFile(image);
                console.log('✅ תמונה הועלה לשרת:', imageUrl);
                
                // שמירת התמונה בטבלת תמונות
                console.log('💾 שומר תמונה בטבלת תמונות...', {
                  propertyId,
                  imageUrl,
                  imageName: image.name
                });
                
                const result = await AirtableService.uploadImageToImagesTable(propertyId, imageUrl, image.name);
                console.log('✅ תמונה נשמרה בטבלת תמונות:', result);
                
              } catch (imageError) {
                console.error(`❌ שגיאה בהעלאת תמונה ${i + 1}:`, imageError);
                console.error('📄 פרטי השגיאה:', imageError);
                // ממשיכים עם התמונות הבאות גם אם אחת נכשלה
              }
            }
            
            console.log('✅ סיום תהליך העלאת תמונות');
          } catch (error) {
            console.error('❌ שגיאה כללית בהעלאת תמונות:', error);
            console.log('⚠️ הנכס נוצר בהצלחה אבל התמונות לא הועלו');
          }
        }
      } else {
        console.log('ℹ️ אין תמונות להעלאה');
      }

      onClose();
    } catch (error) {
      console.error('❌ שגיאה בשמירת נכס:', error);
      alert('שגיאה בשמירת הנכס. נסה שנית.');
    } finally {
      setIsUploading(false);
    }
  };

  const propertyTypes = [
    'דירה',
    'דירת גן',
    'גג/פנטהאוז',
    'דופלקס',
    'טריפלקס',
    'מרתף/פרטר',
    'יחידת דיור',
    'סטודיו/לופט'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editProperty ? 'עריכת נכס' : 'הוספת נכס חדש'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">שם הנכס *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="לדוגמה: דירה מהממת עם נוף לפארק"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="neighborhood">שכונה</Label>
              <Input
                id="neighborhood"
                value={formData.neighborhood}
                onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="city">עיר *</Label>
              <Select
                value={formData.city}
                onValueChange={(value) => setFormData({ ...formData, city: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר עיר" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="חריש">חריש</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="street">רחוב</Label>
              <Input
                id="street"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="number">מספר</Label>
              <Input
                id="number"
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="floor">קומה</Label>
              <Input
                id="floor"
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rooms">כמות חדרים *</Label>
              <Input
                id="rooms"
                value={formData.rooms}
                onChange={(e) => setFormData({ ...formData, rooms: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="type">סוג נכס *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="בחר סוג נכס" />
                </SelectTrigger>
                <SelectContent>
                  {propertyTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">מחיר שיווק (₪) *</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="offersUntil">מוכן לקבל הצעות עד (₪)</Label>
              <Input
                id="offersUntil"
                type="number"
                value={formData.offersUntil}
                onChange={(e) => setFormData({ ...formData, offersUntil: e.target.value })}
              />
            </div>
          </div>

          <div dir="rtl">
            <Label htmlFor="marketingType">סוג שיווק *</Label>
            <Select
              value={marketingType}
              onValueChange={(value) => setMarketingType(value as 'מכירה' | 'השכרה')}
              required
              dir="rtl"
            >
              <SelectTrigger dir="rtl">
                <SelectValue placeholder="בחר סוג שיווק" />
              </SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="מכירה">מכירה</SelectItem>
                <SelectItem value="השכרה">השכרה</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">תיאור חופשי לפרסום *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              required
            />
          </div>

          <div>
            <Label htmlFor="exclusivityDocument">מסמך בלעדיות</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              {exclusivityDocumentUrl ? (
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileUp className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-gray-700">
                      {exclusivityDocument?.name || 'מסמך בלעדיות'}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeFile}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <input
                    type="file"
                    id="exclusivityDocument"
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    className="hidden"
                  />
                  <label
                    htmlFor="exclusivityDocument"
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    <FileUp className="h-4 w-4" />
                    העלה מסמך בלעדיות
                  </label>
                  <p className="text-xs text-gray-600 mt-2">PDF, Word או תמונה עד 10MB</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="images">תמונות</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              {/* תצוגת תמונות קיימות */}
              {imageUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {imageUrls.map((url, index) => (
                    <div key={index} className="relative">
                      <img
                        src={url}
                        alt={`תמונה ${index + 1}`}
                        className="w-full h-20 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 text-red-600 hover:text-red-700 bg-white/80 hover:bg-white/90 rounded-full p-1"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* כפתור העלאת תמונות */}
              <div className="text-center">
                <input
                  type="file"
                  id="images"
                  onChange={handleImageUpload}
                  accept=".jpg,.jpeg,.png,.webp"
                  multiple
                  className="hidden"
                />
                <label
                  htmlFor="images"
                  className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <FileImage className="h-4 w-4" />
                  הוסף תמונות
                </label>
                <p className="text-sm text-gray-600 mt-2">תמונות עד 5MB כל אחת</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              type="submit" 
              className="flex-1"
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  מעלה קבצים...
                </>
              ) : (
                editProperty ? 'עדכן' : 'הוסף'
              )}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              className="flex-1"
              disabled={isUploading}
            >
              ביטול
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePropertyModal;
