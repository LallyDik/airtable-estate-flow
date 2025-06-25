
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Property } from '@/types';
import { AirtableService } from '@/services/airtable';
import { 
  Building, 
  MapPin, 
  Home, 
  Maximize, 
  Layers,
  DollarSign,
  Calendar,
  FileText,
  Image as ImageIcon,
  Loader2,
  X
} from 'lucide-react';

interface PropertyDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  properties: Property[];
}

const PropertyDetailsModal = ({ isOpen, onClose, propertyId, properties }: PropertyDetailsModalProps) => {
  const [property, setProperty] = useState<Property | null>(null);
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && propertyId) {
      loadPropertyDetails();
    }
  }, [isOpen, propertyId]);

  const loadPropertyDetails = async () => {
    try {
      setLoading(true);
      
      // מצא את הנכס מהרשימה הקיימת
      const foundProperty = properties.find(p => p.id === propertyId);
      setProperty(foundProperty || null);

      // טען תמונות אם יש
      try {
        const imagesData = await AirtableService.getImages(propertyId);
        setImages(imagesData);
      } catch (error) {
        console.log('לא נמצאו תמונות לנכס זה');
        setImages([]);
      }
    } catch (error) {
      console.error('שגיאה בטעינת פרטי הנכס:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS'
    }).format(price);
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!property) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-right">שגיאה</DialogTitle>
          </DialogHeader>
          <div className="text-center p-4">
            <p className="text-red-600">לא נמצא נכס עם מזהה זה</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-right">
              {property.title}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* תמונות */}
            {images.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  תמונות
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {images.map((image, index) => (
                    <div 
                      key={index}
                      className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setSelectedImage(image.url || `תמונה ${index + 1}`)}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-gray-400" />
                        <span className="text-xs text-gray-500 mt-1">תמונה {index + 1}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* פרטי הנכס */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold mb-3 text-right">פרטים כלליים</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">סוג נכס:</span>
                      <span className="font-medium">{property.type || 'לא צוין'}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">חדרים:</span>
                      <span className="font-medium">{property.rooms || 'לא צוין'}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Maximize className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">שטח:</span>
                      <span className="font-medium">{property.size ? `${property.size} מ"ר` : 'לא צוין'}</span>
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
                  </div>
                </CardContent>
              </Card>

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
            </div>

            {/* תיאור */}
            {property.description && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold mb-3 text-right">תיאור</h3>
                  <p className="text-gray-700 leading-relaxed text-right">{property.description}</p>
                </CardContent>
              </Card>
            )}

            {/* מסמכים */}
            {property.exclusivityDocument && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    מסמכים
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">מסמך בלעדיות</span>
                      <Badge variant="secondary">זמין</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* הצעות עד */}
            {property.offersUntil && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-orange-500" />
                    <span className="text-sm text-gray-600">מוכן לקבל הצעות עד:</span>
                    <Badge variant="outline" className="text-orange-600 border-orange-200">
                      {property.offersUntil}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* מודל להצגת תמונה גדולה */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] p-2">
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedImage(null)}
                className="absolute top-2 right-2 z-10 bg-white/80 hover:bg-white"
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="flex items-center justify-center bg-gray-100 rounded-lg min-h-[400px]">
                <div className="text-center">
                  <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">תמונה: {selectedImage}</p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default PropertyDetailsModal;
