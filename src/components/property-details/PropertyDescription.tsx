
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Property } from '@/types';

interface PropertyDescriptionProps {
  property: Property;
}

const PropertyDescription = ({ property }: PropertyDescriptionProps) => {
  if (!property.description) return null;

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-3 text-right">תיאור</h3>
        <p className="text-gray-700 leading-relaxed text-right">{property.description}</p>
      </CardContent>
    </Card>
  );
};

export default PropertyDescription;
