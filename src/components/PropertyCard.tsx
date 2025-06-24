
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Property } from '@/types';
import { Building, MapPin, DollarSign, Maximize, Edit, Trash2 } from 'lucide-react';

interface PropertyCardProps {
  property: Property;
  onEdit: (property: Property) => void;
  onDelete: (id: string) => void;
}

const PropertyCard = ({ property, onEdit, onDelete }: PropertyCardProps) => {
  const getPostStatus = () => {
    if (property.nextAvailablePostDate) {
      const nextDate = new Date(property.nextAvailablePostDate);
      const today = new Date();
      if (nextDate > today) {
        return { status: 'waiting', label: `זמין לפרסום ב-${nextDate.toLocaleDateString('he-IL')}` };
      }
    }
    return { status: 'available', label: 'זמין לפרסום' };
  };

  const postStatus = getPostStatus();

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold text-gray-800">
            {property.title}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(property)}
              className="p-2"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(property.id)}
              className="p-2 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">{property.address}</span>
          </div>
          
          <div className="flex items-center gap-2 text-gray-600">
            <Building className="h-4 w-4" />
            <span className="text-sm">{property.type}</span>
          </div>
          
          <div className="flex items-center gap-2 text-gray-600">
            <Maximize className="h-4 w-4" />
            <span className="text-sm">{property.size} מ"ר</span>
          </div>
          
          <div className="flex items-center gap-2 text-green-600 font-semibold">
            <DollarSign className="h-4 w-4" />
            <span>{property.price?.toLocaleString('he-IL')} ₪</span>
          </div>
          
          <p className="text-gray-700 text-sm line-clamp-2">
            {property.description}
          </p>
          
          <div className="flex items-center justify-between pt-2">
            <Badge 
              variant={postStatus.status === 'available' ? 'default' : 'secondary'}
              className={postStatus.status === 'available' ? 'bg-green-100 text-green-800' : ''}
            >
              {postStatus.label}
            </Badge>
            
            {property.lastPostDate && (
              <span className="text-xs text-gray-500">
                פורסם לאחרונה: {new Date(property.lastPostDate).toLocaleDateString('he-IL')}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertyCard;
