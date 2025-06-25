
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Property } from '@/types';
import { MapPin, Home, Edit, Trash2, Maximize } from 'lucide-react';

interface PropertyCardProps {
  property: Property;
  onEdit: (property: Property) => void;
  onDelete: (id: string) => void;
  onView?: (property: Property) => void;
}

const PropertyCard = ({ property, onEdit, onDelete, onView }: PropertyCardProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS'
    }).format(price);
  };

  const handleCardClick = () => {
    onView?.(property);
  };

  const handleButtonClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer" onClick={handleCardClick}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-semibold text-gray-800">
            {property.title}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => handleButtonClick(e, () => onEdit(property))}
              className="p-2"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => handleButtonClick(e, () => onDelete(property.id))}
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
            <Home className="h-4 w-4" />
            <span className="text-sm">{property.type}</span>
          </div>
          
          {property.size && (
            <div className="flex items-center gap-2 text-gray-600">
              <Maximize className="h-4 w-4" />
              <span className="text-sm">{property.size} מ"ר</span>
            </div>
          )}
          
          <div className="flex items-center justify-between pt-2">
            <Badge variant="outline" className="text-green-600 border-green-200">
              {formatPrice(property.price)}
            </Badge>
            
            <span className="text-xs text-gray-500">
              נוצר: {new Date(property.createdAt).toLocaleDateString('he-IL')}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertyCard;
