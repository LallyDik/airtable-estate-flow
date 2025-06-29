
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Eye, Download } from 'lucide-react';

interface PropertyDocumentsProps {
  documents: any[];
  onViewDocument: (document: any) => void;
  onDownloadDocument: (document: any) => void;
}

const PropertyDocuments = ({ documents, onViewDocument, onDownloadDocument }: PropertyDocumentsProps) => {
  if (documents.length === 0) return null;

  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-right">
          <FileText className="h-5 w-5" />
          מסמכים
        </h3>
        <div className="space-y-2">
          {documents.map((doc, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">{doc.name || doc.filename || `מסמך ${index + 1}`}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onViewDocument(doc)}
                  disabled={!doc.url || doc.url.includes('זמני')}
                >
                  <Eye className="h-4 w-4 ml-1" />
                  צפייה
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onDownloadDocument(doc)}
                  disabled={!doc.url || doc.url.includes('זמני')}
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
  );
};

export default PropertyDocuments;
