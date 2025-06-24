
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Property, Post, TimeSlot, TIME_SLOT_LABELS } from '@/types';
import { X } from 'lucide-react';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (post: Omit<Post, 'id'>) => void;
  editPost?: Post;
  properties: Property[];
  brokerId: string;
  existingPosts: Post[];
}

const CreatePostModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  editPost, 
  properties, 
  brokerId, 
  existingPosts 
}: CreatePostModalProps) => {
  const [selectedProperties, setSelectedProperties] = useState<string[]>(
    editPost?.property ? [editPost.property] : []
  );
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    editPost ? new Date(editPost.date) : undefined
  );
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | ''>
    (editPost?.timeSlot || '');

  useEffect(() => {
    if (editPost) {
      setSelectedProperties(editPost.property ? [editPost.property] : []);
      setSelectedDate(new Date(editPost.date));
      setSelectedTimeSlot(editPost.timeSlot);
    } else {
      setSelectedProperties([]);
      setSelectedDate(undefined);
      setSelectedTimeSlot('');
    }
  }, [editPost]);

  const getAvailableDates = () => {
    const today = new Date();
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 7);
    
    const availableDates: Date[] = [];
    for (let i = 0; i <= 7; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      availableDates.push(date);
    }
    
    return availableDates;
  };

  const canPostProperty = (propertyId: string, date: Date) => {
    const property = properties.find(p => p.id === propertyId);
    if (!property) return false;
    
    // Check if property was posted in the last 3 days
    if (property.lastPostDate) {
      const lastPost = new Date(property.lastPostDate);
      const daysDifference = (date.getTime() - lastPost.getTime()) / (1000 * 3600 * 24);
      if (daysDifference < 3) return false;
    }
    
    return true;
  };

  const getDailyPostCount = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return existingPosts.filter(post => 
      post.broker === brokerId && 
      post.date.startsWith(dateStr)
    ).length;
  };

  const canPostOnDay = (date: Date) => {
    return getDailyPostCount(date) < 2;
  };

  const handlePropertySelect = (propertyId: string) => {
    if (selectedProperties.includes(propertyId)) {
      // Remove property if already selected
      setSelectedProperties(prev => prev.filter(id => id !== propertyId));
    } else if (selectedProperties.length < 2) {
      // Add property if less than 2 selected
      setSelectedProperties(prev => [...prev, propertyId]);
    }
  };

  const removeProperty = (propertyId: string) => {
    setSelectedProperties(prev => prev.filter(id => id !== propertyId));
  };

  const getAvailableProperties = () => {
    if (!selectedDate) return properties;
    
    return properties.filter(property => {
      // Don't show already selected properties in the dropdown
      if (selectedProperties.includes(property.id)) return false;
      return canPostProperty(property.id, selectedDate);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProperties.length === 0 || !selectedDate || !selectedTimeSlot) return;
    
    // For now, we'll submit with the first property (maintaining backward compatibility)
    // In the future, the backend should be updated to handle multiple properties
    const primaryProperty = properties.find(p => p.id === selectedProperties[0]);
    
    onSubmit({
      property: selectedProperties[0],
      propertyTitle: primaryProperty?.title,
      date: selectedDate.toISOString().split('T')[0],
      timeSlot: selectedTimeSlot as TimeSlot,
      broker: brokerId,
      createdAt: editPost?.createdAt || new Date().toISOString(),
    });
    
    // Reset form
    setSelectedProperties([]);
    setSelectedDate(undefined);
    setSelectedTimeSlot('');
    onClose();
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 7);
    maxDate.setHours(0, 0, 0, 0);
    
    if (checkDate < today || checkDate > maxDate) return true;
    if (!canPostOnDay(date)) return true;
    
    return false;
  };

  const canAnyPropertyBePosted = () => {
    if (!selectedDate) return true;
    return selectedProperties.some(propertyId => canPostProperty(propertyId, selectedDate));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle>
            {editPost ? 'עריכת פרסום' : 'פרסום חדש'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="property">בחר נכסים (עד 2)</Label>
            
            {/* Selected Properties */}
            {selectedProperties.length > 0 && (
              <div className="mb-3 space-y-2">
                {selectedProperties.map(propertyId => {
                  const property = properties.find(p => p.id === propertyId);
                  return (
                    <div key={propertyId} className="flex items-center justify-between bg-blue-50 p-2 rounded border">
                      <span className="text-sm font-medium text-right">
                        {property?.title} - {property?.address}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeProperty(propertyId)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Property Selection Dropdown */}
            {selectedProperties.length < 2 && (
              <Select value="" onValueChange={handlePropertySelect}>
                <SelectTrigger>
                  <SelectValue placeholder={
                    selectedProperties.length === 0 
                      ? "בחר נכס לפרסום" 
                      : "בחר נכס נוסף (אופציונלי)"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableProperties().map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.title} - {property.address}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            <p className="text-xs text-gray-500 mt-1 text-right">
              ניתן לבחור עד 2 נכסים לפרסום
            </p>
          </div>
          
          <div>
            <Label>בחר תאריך</Label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={isDateDisabled}
              className={cn("w-full border rounded-md p-3 pointer-events-auto")}
            />
            {selectedDate && !canPostOnDay(selectedDate) && (
              <p className="text-sm text-red-600 mt-2">
                הגעת למגבלת 2 פרסומים ביום זה
              </p>
            )}
            {selectedDate && selectedProperties.length > 0 && !canAnyPropertyBePosted() && (
              <p className="text-sm text-red-600 mt-2">
                לא ניתן לפרסם נכסים אלה - נדרש המתנה של 3 ימים מהפרסום האחרון
              </p>
            )}
          </div>
          
          <div>
            <Label htmlFor="timeSlot">משבצת זמן</Label>
            <Select value={selectedTimeSlot} onValueChange={(value: TimeSlot) => setSelectedTimeSlot(value)}>
              <SelectTrigger>
                <SelectValue placeholder="בחר משבצת זמן" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TIME_SLOT_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button 
              type="submit" 
              className="flex-1"
              disabled={selectedProperties.length === 0 || !selectedDate || !selectedTimeSlot}
            >
              {editPost ? 'עדכן' : 'פרסם'}
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

export default CreatePostModal;
