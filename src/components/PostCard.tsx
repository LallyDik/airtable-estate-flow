
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Post, TIME_SLOT_LABELS } from '@/types';
import { Calendar, Clock, Edit, Trash2 } from 'lucide-react';

interface PostCardProps {
  post: Post;
  onEdit: (post: Post) => void;
  onDelete: (id: string) => void;
  onViewProperty?: (propertyId: string) => void;
  properties?: any[];
}

const PostCard = ({ post, onEdit, onDelete, onViewProperty, properties = [] }: PostCardProps) => {
  const postDate = new Date(post.date);
  const today = new Date();
  const isPast = postDate < today;
  const isToday = postDate.toDateString() === today.toDateString();
  
  const canEdit = !isPast;

  const handleCardClick = () => {
    if (onViewProperty && post.property) {
      onViewProperty(post.property);
    }
  };

  const handleButtonClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  // Get the property title with better fallback logic
  const getPropertyTitle = () => {
    console.log('PostCard - Getting property title for post:', post);
    console.log('PostCard - Post property ID:', post.property);
    console.log('PostCard - Post propertyTitle:', post.propertyTitle);
    console.log('PostCard - Properties available:', properties?.length || 0);
    
    // First try to use propertyTitle from the post if it exists and is meaningful
    if (post.propertyTitle && 
        post.propertyTitle.trim() && 
        post.propertyTitle !== 'נכס' && 
        !post.propertyTitle.includes('rec')) {
      console.log('PostCard - Using propertyTitle from post:', post.propertyTitle);
      return post.propertyTitle;
    }
    
    // Then try to find the property in the properties list
    if (properties && properties.length > 0 && post.property) {
      const property = properties.find(p => p.id === post.property);
      console.log('PostCard - Found property in list:', property);
      if (property && property.title && property.title.trim()) {
        console.log('PostCard - Using property title from list:', property.title);
        return property.title;
      }
    }
    
    // Fallback to a generic title
    console.log('PostCard - Using fallback title');
    return 'נכס לפרסום';
  };

  return (
    <Card 
      className={`hover:shadow-lg transition-shadow duration-200 cursor-pointer ${isPast ? 'opacity-75' : ''}`}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold text-gray-800">
            {getPropertyTitle()}
          </CardTitle>
          <div className="flex gap-2">
            {canEdit && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => handleButtonClick(e, () => onEdit(post))}
                  className="p-2"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => handleButtonClick(e, () => onDelete(post.id))}
                  className="p-2 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">
              {postDate.toLocaleDateString('he-IL', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </span>
            {isToday && <Badge variant="secondary" className="bg-blue-100 text-blue-800">היום</Badge>}
          </div>
          
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="h-4 w-4" />
            <span className="text-sm">{TIME_SLOT_LABELS[post.timeSlot]}</span>
          </div>
          
          <div className="flex items-center justify-between pt-2">
            <Badge 
              variant={isPast ? 'secondary' : isToday ? 'default' : 'outline'}
              className={
                isPast 
                  ? 'bg-gray-100 text-gray-600' 
                  : isToday 
                    ? 'bg-green-100 text-green-800' 
                    : 'border-blue-200 text-blue-700'
              }
            >
              {isPast ? 'פורסם' : isToday ? 'מתפרסם היום' : 'מתוכנן'}
            </Badge>
            
            <span className="text-xs text-gray-500">
              נוצר: {new Date(post.createdAt).toLocaleDateString('he-IL')}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PostCard;
