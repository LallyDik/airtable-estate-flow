
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Calendar } from 'lucide-react';
import { Property } from '@/types';

interface PropertyLocationInfoProps {
  property: Property;
}

const PropertyLocationInfo = ({ property }: PropertyLocationInfoProps) => {
  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-3 text-right">מיקום</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">עיר:</span>
            <span className="font-medium">{property.city || 'לא צוין'}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">שכונה:</span>
            <span className="font-medium">{property.neighborhood || 'לא צוין'}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">רחוב:</span>
            <span className="font-medium">{property.street || 'לא צוין'}</span>
          </div>

          {property.number && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">מספר:</span>
              <span className="font-medium">{property.number}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">נוצר:</span>
            <span className="font-medium">
              {new Date(property.createdAt).toLocaleDateString('he-IL')}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertyLocationInfo;
