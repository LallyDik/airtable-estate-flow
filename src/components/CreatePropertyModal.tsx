
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    title: editProperty?.title || '',
    description: editProperty?.description || '',
    address: editProperty?.address || '',
    price: editProperty?.price || 0,
    type: editProperty?.type || '',
    size: editProperty?.size || 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      broker: brokerId,
      createdAt: editProperty?.createdAt || new Date().toISOString(),
    });
    setFormData({
      title: '',
      description: '',
      address: '',
      price: 0,
      type: '',
      size: 0,
    });
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
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle>
            {editProperty ? 'עריכת נכס' : 'הוספת נכס חדש'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">כותרת</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="type">סוג נכס</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
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
          
          <div>
            <Label htmlFor="address">כתובת</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">מחיר (₪)</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: Number(e.target.value)})}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="size">שטח (מ"ר)</Label>
              <Input
                id="size"
                type="number"
                value={formData.size}
                onChange={(e) => setFormData({...formData, size: Number(e.target.value)})}
                required
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="description">תיאור</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={3}
            />
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
