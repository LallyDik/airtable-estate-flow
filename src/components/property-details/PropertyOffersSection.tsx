
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign } from 'lucide-react';
import { Property } from '@/types';

interface PropertyOffersSectionProps {
  property: Property;
  formatPrice: (price: number) => string;
}

const PropertyOffersSection = ({ property, formatPrice }: PropertyOffersSectionProps) => {
  if (!property.offersUntil) return null;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-orange-500" />
          <span className="text-sm text-gray-600">מוכן לקבל הצעות עד:</span>
          <Badge variant="outline" className="text-orange-600 border-orange-200">
            {formatPrice(parseFloat(property.offersUntil))}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertyOffersSection;
