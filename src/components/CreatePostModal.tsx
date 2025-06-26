import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Property, Post, TimeSlot, TIME_SLOT_LABELS } from '@/types';
import { X, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const [selectedProperty, setSelectedProperty] = useState<string>(
    editPost?.property || ''
  );
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    editPost ? new Date(editPost.date) : undefined
  );
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | ''>
    (editPost?.timeSlot || '');

  useEffect(() => {
    if (editPost) {
      setSelectedProperty(editPost.property || '');
      setSelectedDate(new Date(editPost.date));
      setSelectedTimeSlot(editPost.timeSlot);
    } else {
      setSelectedProperty('');
      setSelectedDate(undefined);
      setSelectedTimeSlot('');
    }
  }, [editPost]);

  // Helper function to get available dates (8 days from today)
  const getAvailableDates = () => {
    const today = new Date();
    const dates: Date[] = [];
    for (let i = 0; i <= 8; i++) {
      const date = new Date();
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  // Check if property can be posted (3 days rule)
  const canPostProperty = (propertyId: string, date: Date) => {
    const property = properties.find(p => p.id === propertyId);
    if (!property) return false;
    
    // Check if property was posted in the last 3 days
    const propertyPosts = existingPosts.filter(post => 
      post.property === propertyId && 
      post.id !== editPost?.id // Exclude current edit
    );
    
    if (propertyPosts.length === 0) return true;
    
    // Find the most recent post for this property
    const latestPost = propertyPosts.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
    
    const latestPostDate = new Date(latestPost.date);
    const daysDifference = (date.getTime() - latestPostDate.getTime()) / (1000 * 3600 * 24);
    
    return daysDifference >= 3;
  };

  // Check daily post limit (2 posts per day)
  const getDailyPostCount = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return existingPosts.filter(post => 
      post.broker === brokerId && 
      post.date.startsWith(dateStr) &&
      post.id !== editPost?.id // Exclude current edit
    ).length;
  };

  const canPostOnDay = (date: Date) => {
    return getDailyPostCount(date) < 2;
  };

  // Get available properties for the selected date
  const getAvailableProperties = () => {
    if (!selectedDate) return properties;
    
    return properties.filter(property => canPostProperty(property.id, selectedDate));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProperty || !selectedDate || !selectedTimeSlot) return;
    
    const property = properties.find(p => p.id === selectedProperty);
    
    // Get proper property title from multiple possible fields
    let propertyTitle = 'נכס לפרסום'; // default fallback
    
    if (property) {
      // Try different field names that might contain the property title
      const possibleTitles = [
        property.title,
        property['שם נכס לתצוגה'],
        property['שם נכס'],
        property.address
      ];
      
      for (const title of possibleTitles) {
        if (title && 
            typeof title === 'string' && 
            title.trim() && 
            !title.includes('rec') && // not an Airtable ID
            title !== 'נכס') {
          propertyTitle = title;
          break;
        }
      }
    }
    
    console.log('CreatePostModal - Selected property:', property);
    console.log('CreatePostModal - Property title:', propertyTitle);
    
    const postData = {
      property: selectedProperty,
      propertyTitle: propertyTitle,
      date: selectedDate.toLocaleDateString('sv-SE'), // <-- זה התיקון!
      timeSlot: selectedTimeSlot as TimeSlot,
      broker: brokerId,
      createdAt: editPost?.createdAt || new Date().toISOString(),
    };
    
    console.log('CreatePostModal - Submitting post data:', postData);
    
    onSubmit(postData);
    
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
    maxDate.setDate(today.getDate() + 8);
    maxDate.setHours(0, 0, 0, 0);
    
    // Outside allowed range
    if (checkDate < today || checkDate > maxDate) return true;
    
    // Block Friday (5) and Saturday (6)
    const dayOfWeek = checkDate.getDay();
    if (dayOfWeek === 5 || dayOfWeek === 6) return true;
    
    // Daily limit reached
    if (!canPostOnDay(date)) return true;
    
    return false;
  };

  const getValidationMessages = () => {
    const messages: string[] = [];
    
    if (selectedDate) {
      const dailyCount = getDailyPostCount(selectedDate);
      if (dailyCount >= 2) {
        messages.push('הגעת למגבלת 2 פרסומים ביום זה');
      }
      
      if (selectedProperty && !canPostProperty(selectedProperty, selectedDate)) {
        messages.push('נכס זה פורסם בתוך 3 הימים האחרונים - יש להמתין');
      }
    }
    
    return messages;
  };

  const validationMessages = getValidationMessages();
  const isFormValid = selectedProperty && selectedDate && selectedTimeSlot && validationMessages.length === 0;

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
            <Select value={selectedProperty} onValueChange={setSelectedProperty} dir="rtl">
              <SelectTrigger dir="rtl">
                <SelectValue placeholder="בחר נכס לפרסום" />
              </SelectTrigger>
              <SelectContent dir="rtl">
                {getAvailableProperties().map((property) => (
                  <SelectItem key={property.id} value={property.id}>
                    {property.title} - {property.address}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedDate && selectedProperty && !canPostProperty(selectedProperty, selectedDate) && (
              <p className="text-xs text-red-600 mt-1">
                נכס זה פורסם בתוך 3 הימים האחרונים
              </p>
            )}
          </div>
          
          <div>
            <Label>בחר תאריך (עד שבוע מהיום)</Label>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={isDateDisabled}
              className={cn("w-full border rounded-md p-3")}
            />
            {selectedDate && !canPostOnDay(selectedDate) && (
              <p className="text-sm text-red-600 mt-2">
                הגעת למגבלת 2 פרסומים ביום זה ({getDailyPostCount(selectedDate)}/2)
              </p>
            )}
          </div>
          
          <div>
            <Label htmlFor="timeSlot">זמן פרסום</Label>
            <Select value={selectedTimeSlot} onValueChange={(value: TimeSlot) => setSelectedTimeSlot(value)} dir="rtl">
              <SelectTrigger dir="rtl">
                <SelectValue placeholder="בחר זמן פרסום" />
              </SelectTrigger>
              <SelectContent dir="rtl">
                {Object.entries(TIME_SLOT_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {validationMessages.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {validationMessages.map((message, index) => (
                    <li key={index}>{message}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          
          <div className="flex gap-2 pt-4">
            <Button 
              type="submit" 
              className="flex-1"
              disabled={!isFormValid}
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
