
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Image as ImageIcon } from 'lucide-react';

interface PropertyImageGalleryProps {
  images: any[];
  onImageClick: (image: any) => void;
}

const PropertyImageGallery = ({ images, onImageClick }: PropertyImageGalleryProps) => {
  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-right">
          <ImageIcon className="h-5 w-5" />
          גלריית תמונות ({images.length})
        </h3>
        {images.length > 0 ? (
          <Carousel className="w-full max-w-5xl mx-auto">
            <CarouselContent>
              {images.map((image, index) => (
                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                  <div 
                    className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity border"
                    onClick={() => onImageClick(image)}
                  >
                    <img 
                      src={image.url} 
                      alt={`תמונה ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.error('שגיאה בטעינת תמונה:', image);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
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
        ) : (
          <div className="text-center py-8 text-gray-500">
            <ImageIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>אין תמונות זמינות לנכס זה</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PropertyImageGallery;
