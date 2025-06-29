
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { Property } from '@/types';
import { AirtableService } from '@/services/airtable';
import PropertyBasicInfo from './property-details/PropertyBasicInfo';
import PropertyLocationInfo from './property-details/PropertyLocationInfo';
import PropertyDescription from './property-details/PropertyDescription';
import PropertyOffersSection from './property-details/PropertyOffersSection';
import PropertyDocuments from './property-details/PropertyDocuments';
import PropertyImageGallery from './property-details/PropertyImageGallery';
import ImageModal from './property-details/ImageModal';

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

  useEffect(() => {
    if (isOpen && propertyId) {
      loadPropertyDetails();
    }
  }, [isOpen, propertyId]);

  const loadPropertyDetails = async () => {
    try {
      setLoading(true);
      console.log('🔄 טוען פרטי נכס:', propertyId);
      
      // מצא את הנכס מהרשימה הקיימת
      const foundProperty = properties.find(p => p.id === propertyId);
      console.log('🏠 נכס נמצא:', foundProperty);
      setProperty(foundProperty || null);

      // טען תמונות ומסמכים
      try {
        console.log('📂 טוען תמונות ומסמכים...');
        const [imagesData, documentsData] = await Promise.all([
          AirtableService.getImages(propertyId).catch((error) => {
            console.error('שגיאה בטעינת תמונות:', error);
            return [];
          }),
          AirtableService.getDocuments?.(propertyId).catch((error) => {
            console.error('שגיאה בטעינת מסמכים:', error);
            return [];
          }) || []
        ]);
        
        console.log('🖼️ תמונות שנטענו:', imagesData);
        console.log('📄 מסמכים שנטענו:', documentsData);
        
        // סינון תמונות תקינות - תמונות עם URL תקין בלבד
        const validImages = imagesData.filter(img => {
          const hasValidUrl = img.url && 
                             typeof img.url === 'string' && 
                             img.url.trim() !== '' &&
                             !img.url.includes('זמני') && // לא קישורים זמניים
                             (img.url.startsWith('http') || img.url.startsWith('https'));
          console.log('🖼️ בודק תמונה:', img, 'תקינה:', hasValidUrl);
          return hasValidUrl;
        });
        
        setImages(validImages);
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
    console.log('🖼️ לוחץ על תמונה:', image);
    setSelectedImage(image.url);
  };

  const viewDocument = (document: any) => {
    console.log('📄 צופה במסמך:', document);
    if (document.url && !document.url.includes('זמני')) {
      window.open(document.url, '_blank');
    } else {
      console.error('מסמך אינו זמין לצפייה');
    }
  };

  const downloadDocument = (document: any) => {
    console.log('📄 מוריד מסמך:', document);
    if (document.url && !document.url.includes('זמני')) {
      const link = document.createElement('a');
      link.href = document.url;
      link.download = document.filename || document.name || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      console.error('מסמך אינו זמין להורדה');
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
              <PropertyBasicInfo property={property} formatPrice={formatPrice} />
              <PropertyLocationInfo property={property} />
            </div>

            {/* תיאור */}
            <PropertyDescription property={property} />

            {/* הצעות עד */}
            <PropertyOffersSection property={property} formatPrice={formatPrice} />

            {/* מסמכים */}
            <PropertyDocuments 
              documents={documents}
              onViewDocument={viewDocument}
              onDownloadDocument={downloadDocument}
            />

            {/* גלריית תמונות */}
            <PropertyImageGallery 
              images={images}
              onImageClick={handleImageClick}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* מודל להצגת תמונה גדולה */}
      <ImageModal 
        selectedImage={selectedImage}
        onClose={() => setSelectedImage(null)}
      />
    </>
  );
};

export default PropertyDetailsModal;
