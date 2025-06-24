
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Property, Post, TimeSlot, TIME_SLOT_LABELS } from '@/types';

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
  const [selectedProperty, setSelectedProperty] = useState<string>(editPost?.property || '');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    editPost ? new Date(editPost.date) : undefined
  );
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | ''>
    (editPost?.timeSlot || '');

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

  const canPostOnDate = (date: Date) => {
    if (!selectedProperty) return false;
    
    const property = properties.find(p => p.id === selectedProperty);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProperty || !selectedDate || !selectedTimeSlot) return;
    
    const property = properties.find(p => p.id === selectedProperty);
    
    onSubmit({
      property: selectedProperty,
      propertyTitle: property?.title,
      date: selectedDate.toISOString().split('T')[0],
      timeSlot: selectedTimeSlot as TimeSlot,
      broker: brokerId,
      createdAt: editPost?.createdAt || new Date().toISOString(),
    });
    
    // Reset form
    setSelectedProperty('');
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
    if (!canPostOnDate(date)) return true;
    
    return false;
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
            <Label htmlFor="property">בחר נכס</Label>
            <Select value={selectedProperty} onValueChange={setSelectedProperty}>
              <SelectTrigger>
                <SelectValue placeholder="בחר נכס לפרסום" />
              </SelectTrigger>
              <SelectContent>
                {properties.map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.title} - {property.address}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>בחר תאריך</Label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={isDateDisabled}
              className={cn("w-full border rounded-md p-3 pointer-events-auto")}
              locale={{ localize: { day: () => '' } }}
            />
            {selectedDate && !canPostOnDay(selectedDate) && (
              <p className="text-sm text-red-600 mt-2">
                הגעת למגבלת 2 פרסומים ביום זה
              </p>
            )}
            {selectedDate && !canPostOnDate(selectedDate) && (
              <p className="text-sm text-red-600 mt-2">
                לא ניתן לפרסם נכס זה - נדרש המתנה של 3 ימים מהפרסום האחרון
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
              disabled={!selectedProperty || !selectedDate || !selectedTimeSlot}
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
