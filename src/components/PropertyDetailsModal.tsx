import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
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
  X,
  Download,
  ExternalLink,
  Eye
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
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<any | null>(null);

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

      // טען תמונות ומסמכים אם יש
      try {
        const [imagesData, documentsData] = await Promise.all([
          AirtableService.getImages(propertyId).catch(() => []),
          AirtableService.getDocuments?.(propertyId).catch(() => []) || []
        ]);
        setImages(imagesData);
        setDocuments(documentsData);
      } catch (error) {
        console.log('שגיאה בטעינת קבצים:', error);
        setImages([]);
        setDocuments([]);
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

  const handleImageClick = (image: any) => {
    setSelectedImage(image.url || image.thumbnails?.large?.url || null);
  };

  const handleDocumentClick = (document: any) => {
    setSelectedDocument(document);
  };

  const viewDocument = (document: any) => {
    if (document.url) {
      window.open(document.url, '_blank');
    }
  };

  const downloadDocument = (document: any) => {
    if (document.url) {
      window.open(document.url, '_blank');
    }
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
            {/* פרטי הנכס */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

            {/* מסמכים */}
            {(documents.length > 0 || property.exclusivityDocument) && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-right">
                    <FileText className="h-5 w-5" />
                    מסמכים
                  </h3>
                  <div className="space-y-2">
                    {property.exclusivityDocument && (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium">מסמך בלעדיות</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => viewDocument({ name: 'מסמך בלעדיות', url: property.exclusivityDocument })}
                          >
                            <Eye className="h-4 w-4 ml-1" />
                            צפייה
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => downloadDocument({ name: 'מסמך בלעדיות', url: property.exclusivityDocument })}
                          >
                            <Download className="h-4 w-4 ml-1" />
                            הורדה
                          </Button>
                        </div>
                      </div>
                    )}
                    {documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium">{doc.filename || `מסמך ${index + 1}`}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => viewDocument(doc)}
                          >
                            <Eye className="h-4 w-4 ml-1" />
                            צפייה
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => downloadDocument(doc)}
                          >
                            <Download className="h-4 w-4 ml-1" />
                            הורדה
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* גלריית תמונות */}
            {images.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-right">
                    <ImageIcon className="h-5 w-5" />
                    גלריית תמונות ({images.length})
                  </h3>
                  <Carousel className="w-full max-w-5xl mx-auto">
                    <CarouselContent>
                      {images.map((image, index) => (
                        <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                          <div 
                            className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity border"
                            onClick={() => handleImageClick(image)}
                          >
                            {image.thumbnails?.small?.url ? (
                              <img 
                                src={image.thumbnails.small.url} 
                                alt={`תמונה ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <ImageIcon className="h-8 w-8 text-gray-400" />
                              </div>
                            )}
                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 text-center">
                              תמונה {index + 1}
                            </div>
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                  </Carousel>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* מודל להצגת תמונה גדולה */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-6xl max-h-[95vh] p-2">
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
                <img 
                  src={selectedImage} 
                  alt="תמונה גדולה"
                  className="max-w-full max-h-[85vh] object-contain rounded-lg"
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* מודל להצגת מסמך */}
      {selectedDocument && (
        <Dialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="text-right">{selectedDocument.name}</DialogTitle>
            </DialogHeader>
            <div className="text-center py-8">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">מסמך: {selectedDocument.name}</p>
              <Button onClick={() => downloadDocument(selectedDocument)}>
                <Download className="h-4 w-4 mr-2" />
                הורד מסמך
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default PropertyDetailsModal;
