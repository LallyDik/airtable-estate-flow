
import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface ImageModalProps {
  selectedImage: string | null;
  onClose: () => void;
}

const ImageModal = ({ selectedImage, onClose }: ImageModalProps) => {
  if (!selectedImage) return null;

  return (
    <Dialog open={!!selectedImage} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] p-2">
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-2 right-2 z-10 bg-white/80 hover:bg-white"
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex items-center justify-center bg-gray-100 rounded-lg min-h-[400px]">
            <img 
              src={selectedImage} 
              alt="תמונה גדולה"
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
              onError={() => {
                console.error('שגיאה בטעינת תמונה גדולה:', selectedImage);
              }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageModal;
