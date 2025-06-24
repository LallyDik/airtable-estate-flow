
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileUp, X, FileImage } from 'lucide-react';
import { Property } from '@/types';
import { AirtableService } from '@/services/airtable';

interface CreatePropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (property: Omit<Property, 'id'>) => void;
  editProperty?: Property;
  brokerId: string;
}

const CreatePropertyModal = ({ isOpen, onClose, onSubmit, editProperty, brokerId }: CreatePropertyModalProps) => {
  const [formData, setFormData] = useState({
    title: '',
    neighborhood: '',
    city: 'חריש',
    street: '',
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

  // עדכון הטופס כשפותחים לעריכה או יצירה חדשה
  useEffect(() => {
    console.log('🔄 עדכון טופס:', { editProperty, isOpen });
    
    if (isOpen) {
      if (editProperty) {
        console.log('✏️ מעדכן טופס לעריכה:', editProperty);
        setFormData({
          title: editProperty.title || '',
          neighborhood: editProperty.neighborhood || '',
          city: 'חריש', // תמיד חריש
          street: editProperty.street || '',
          floor: editProperty.floor || '',
          rooms: editProperty.rooms || '',
          type: editProperty.type || '',
          price: editProperty.price ? editProperty.price.toString() : '',
          offersUntil: editProperty.offersUntil || '',
          description: editProperty.description || '',
          address: editProperty.address || '',
        });
        setExclusivityDocumentUrl(editProperty.exclusivityDocument || '');
      } else {
        console.log('➕ איפוס טופס לנכס חדש');
        // איפוס הטופס כשיוצרים נכס חדש
        setFormData({
          title: '',
          neighborhood: '',
          city: 'חריש',
          street: '',
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
      }
    }
  }, [editProperty, isOpen]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('📎 העלאת מסמך בלעדיות:', file.name);
      setExclusivityDocument(file);
      
      // יצירת URL זמני לתצוגה
      const tempUrl = URL.createObjectURL(file);
      setExclusivityDocumentUrl(tempUrl);
      
      console.log('✅ מסמך בלעדיות הועלה:', file.name);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      console.log('🖼️ העלאת תמונות:', files.length);
      const newImages = Array.from(files);
      setImages(prevImages => [...prevImages, ...newImages]);
      
      // יצירת URLs זמניים לתצוגה
      const newUrls = newImages.map(file => URL.createObjectURL(file));
      setImageUrls(prevUrls => [...prevUrls, ...newUrls]);
      
      console.log('✅ תמונות הועלו:', newImages.length);
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
    const fullAddress = `${formData.street}, ${formData.neighborhood}, ${formData.city}`;
    
    console.log('🔄 שולח נכס עם מתווך:', brokerId);
    console.log('📎 מסמך בלעדיות:', exclusivityDocument?.name || 'אין');
    console.log('🖼️ מספר תמונות:', images.length);
    
    try {
      // יצירת/עדכון הנכס בלי התמונות והמסמך
      const propertyData = {
        title: formData.title,
        description: formData.description,
        address: fullAddress,
        price: formData.price ? Number(formData.price) : 0,
        type: formData.type,
        size: 0,
        broker: brokerId,
        createdAt: editProperty?.createdAt || new Date().toISOString(),
        neighborhood: formData.neighborhood,
        city: formData.city,
        street: formData.street,
        floor: formData.floor,
        rooms: formData.rooms,
        offersUntil: formData.offersUntil,
        exclusivityDocument: '', // נעדכן בנפרד
      };

      // יצירת/עדכון הנכס
      let propertyResult;
      if (editProperty) {
        propertyResult = await AirtableService.updateProperty(editProperty.id, propertyData);
      } else {
        propertyResult = await AirtableService.createProperty(propertyData);
      }

      const propertyId = propertyResult.id || editProperty?.id;

      // העלאת מסמך בלעדיות אם קיים - עם הפורמט המתוקן
      if (exclusivityDocument && propertyId) {
        try {
          await AirtableService.uploadExclusivityDocument(propertyId, exclusivityDocument);
          console.log('✅ מסמך בלעדיות הועלה בהצלחה');
        } catch (error) {
          console.error('❌ שגיאה בהעלאת מסמך בלעדיות:', error);
          // לא נעצור את התהליך בגלל שגיאה במסמך
        }
      }

      // העלאת תמונות לטבלת תמונות אם קיימות
      if (images.length > 0 && propertyId) {
        try {
          for (let i = 0; i < images.length; i++) {
            const image = images[i];
            const imageName = `${formData.title} - תמונה ${i + 1}`;
            await AirtableService.uploadImageToImagesTable(propertyId, image, imageName);
          }
          console.log('✅ כל התמונות הועלו בהצלחה לטבלת תמונות');
        } catch (error) {
          console.error('❌ שגיאה בהעלאת תמונות:', error);
          // לא נעצור את התהליך בגלל שגיאה בתמונות
        }
      }

      // קריאה לפונקציה המקורית
      onSubmit(propertyData);
      onClose();
    } catch (error) {
      console.error('❌ שגיאה בשמירת נכס:', error);
      alert('שגיאה בשמירת הנכס. נסה שנית.');
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
              onChange={(e) => setFormData({...formData, title: e.target.value})}
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
                onChange={(e) => setFormData({...formData, neighborhood: e.target.value})}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="city">עיר</Label>
              <Input
                id="city"
                value="חריש"
                readOnly
                className="bg-gray-100"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="street">רחוב</Label>
              <Input
                id="street"
                value={formData.street}
                onChange={(e) => setFormData({...formData, street: e.target.value})}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="floor">קומה</Label>
              <Input
                id="floor"
                value={formData.floor}
                onChange={(e) => setFormData({...formData, floor: e.target.value})}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rooms">כמות חדרים *</Label>
              <Input
                id="rooms"
                value={formData.rooms}
                onChange={(e) => setFormData({...formData, rooms: e.target.value})}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="type">סוג נכס *</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value) => setFormData({...formData, type: value})}
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
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="offersUntil">מוכן לקבל הצעות עד</Label>
              <Input
                id="offersUntil"
                type="text"
                value={formData.offersUntil}
                onChange={(e) => setFormData({...formData, offersUntil: e.target.value})}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="description">תיאור חופשי לפרסום *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
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
                <p className="text-sm text-gray-600 mt-2">ניתן לבחור מספר תמונות</p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              {editProperty ? 'עדכן' : 'הוסף'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              ביטול
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePropertyModal;
