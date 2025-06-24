
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileUp, X } from 'lucide-react';
import { Property } from '@/types';

interface CreatePropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (property: Omit<Property, 'id'>) => void;
  editProperty?: Property;
  brokerId: string;
}

const CreatePropertyModal = ({ isOpen, onClose, onSubmit, editProperty, brokerId }: CreatePropertyModalProps) => {
  const [formData, setFormData] = useState({
    neighborhood: editProperty?.neighborhood || '',
    city: editProperty?.city || 'חריש',
    street: editProperty?.street || '',
    number: editProperty?.number || '',
    floor: editProperty?.floor || '',
    rooms: editProperty?.rooms || '',
    type: editProperty?.type || '',
    price: editProperty?.price || 0,
    offersUntil: editProperty?.offersUntil || '',
    description: editProperty?.description || '',
    title: editProperty?.title || '',
    address: editProperty?.address || '',
    size: editProperty?.size || 0,
  });

  const [exclusivityDocument, setExclusivityDocument] = useState<File | null>(null);
  const [exclusivityDocumentUrl, setExclusivityDocumentUrl] = useState<string>(editProperty?.exclusivityDocument || '');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setExclusivityDocument(file);
      // In a real app, you would upload this to a file storage service
      // For now, we'll create a temporary URL
      const tempUrl = URL.createObjectURL(file);
      setExclusivityDocumentUrl(tempUrl);
    }
  };

  const removeFile = () => {
    setExclusivityDocument(null);
    setExclusivityDocumentUrl('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create full address from components
    const fullAddress = `${formData.street} ${formData.number}, ${formData.neighborhood}, ${formData.city}`;
    
    onSubmit({
      title: formData.title || `${formData.type} ב${formData.neighborhood}`,
      description: formData.description,
      address: fullAddress,
      price: formData.price,
      type: formData.type,
      size: formData.size,
      broker: brokerId,
      createdAt: editProperty?.createdAt || new Date().toISOString(),
      neighborhood: formData.neighborhood,
      city: formData.city,
      street: formData.street,
      number: formData.number,
      floor: formData.floor,
      rooms: formData.rooms,
      offersUntil: formData.offersUntil,
      exclusivityDocument: exclusivityDocumentUrl,
    });
    
    // Reset form
    setFormData({
      neighborhood: '',
      city: 'חריש',
      street: '',
      number: '',
      floor: '',
      rooms: '',
      type: '',
      price: 0,
      offersUntil: '',
      description: '',
      title: '',
      address: '',
      size: 0,
    });
    setExclusivityDocument(null);
    setExclusivityDocumentUrl('');
    onClose();
  };

  const propertyTypes = [
    'דירה',
    'בית פרטי',
    'פנטהאוס',
    'דופלקס',
    'סטודיו',
    'לופט',
    'וילה',
    'בניין',
    'משרד',
    'חנות'
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
              <Select value={formData.city} onValueChange={(value) => setFormData({...formData, city: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="חריש">חריש</SelectItem>
                  <SelectItem value="תל אביב">تل אביב</SelectItem>
                  <SelectItem value="ירושלים">ירושלים</SelectItem>
                  <SelectItem value="חיפה">חיפה</SelectItem>
                  <SelectItem value="באר שבע">באר שבע</SelectItem>
                  <SelectItem value="פתח תקווה">פתח תקווה</SelectItem>
                  <SelectItem value="נתניה">נתניה</SelectItem>
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
                onChange={(e) => setFormData({...formData, street: e.target.value})}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="number">מספר</Label>
              <Input
                id="number"
                type="number"
                value={formData.number}
                onChange={(e) => setFormData({...formData, number: e.target.value})}
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
              <Label htmlFor="type">סוג נכס</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                <SelectTrigger>
                  <SelectValue />
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
                onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="offersUntil">מוכן לקבל הצעות עד</Label>
              <Input
                id="offersUntil"
                type="number"
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
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Button type="button" variant="outline" className="mb-2">
              הוסף +
            </Button>
            <p className="text-sm text-gray-600">תמונות / סרטונים</p>
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
