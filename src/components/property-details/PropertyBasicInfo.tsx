
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building, 
  Home, 
  Layers,
  DollarSign
} from 'lucide-react';
import { Property } from '@/types';

interface PropertyBasicInfoProps {
  property: Property;
  formatPrice: (price: number) => string;
}

const PropertyBasicInfo = ({ property, formatPrice }: PropertyBasicInfoProps) => {
  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-3 text-right">פרטים כלליים</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">סוג:</span>
            <span className="font-medium">{property.type || 'לא צוין'}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Home className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">חדרים:</span>
            <span className="font-medium">{property.rooms || 'לא צוין'}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">קומה:</span>
            <span className="font-medium">{property.floor || 'לא צוין'}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-600">מחיר:</span>
            <span className="font-medium text-green-600">
              {property.price ? formatPrice(property.price) : 'לא צוין'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">סוג שיווק:</span>
            <Badge variant="outline" className={property.marketingType === 'מכירה' ? 'text-blue-600 border-blue-200' : 'text-green-600 border-green-200'}>
              {property.marketingType || 'מכירה'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertyBasicInfo;
