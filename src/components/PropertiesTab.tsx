import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Search, Loader2, Home, AlertCircle } from 'lucide-react';
import { Property, User } from '@/types';
import { AirtableService } from '@/services/airtable';
import PropertyCard from './PropertyCard';
import CreatePropertyModal from './CreatePropertyModal';
import PropertyDetailsModal from './PropertyDetailsModal';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

interface PropertiesTabProps {
  user: User;
}

const PropertiesTab = ({ user }: PropertiesTabProps) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | undefined>();
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadProperties();
  }, [user]);

  const loadProperties = async () => {
    try {
      setLoading(true);
      const data = await AirtableService.getProperties(user.id);
      setProperties(data);
    } catch (error) {
      toast({
        title: "שגיאה בטעינת נכסים",
        description: "לא ניתן לטעון את הנכסים. בדוק את החיבור ל-Airtable.",
        variant: "destructive"
      });
      console.error('Error loading properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProperty = async (propertyData: Omit<Property, 'id'>) => {
    try {
      if (editingProperty) {
        await AirtableService.updateProperty(editingProperty.id, propertyData);
        toast({
          title: "נכס עודכן",
          description: "הנכס עודכן בהצלחה במערכת"
        });
      } else {
        await AirtableService.createProperty(propertyData);
        toast({
          title: "נכס נוסף",
          description: "הנכס נוסף בהצלחה למערכת"
        });
      }
      loadProperties();
      setEditingProperty(undefined);
    } catch (error) {
      toast({
        title: "שגיאה בשמירת נכס",
        description: "לא ניתן לשמור את הנכס. נסה שנית.",
        variant: "destructive"
      });
      console.error('Error saving property:', error);
    }
  };

  const handleDeleteProperty = async (id: string) => {
    if (confirm('האם אתה בטוח שברצונך למחוק את הנכס? פעולה זו אינה הפיכה.')) {
      try {
        await AirtableService.deleteProperty(id);
        toast({
          title: "נכס נמחק",
          description: "הנכס נמחק בהצלחה מהמערכת"
        });
        loadProperties();
      } catch (error) {
        toast({
          title: "שגיאה במחיקת נכס",
          description: "לא ניתן למחוק את הנכס. נסה שנית.",
          variant: "destructive"
        });
        console.error('Error deleting property:', error);
      }
    }
  };

  const handleEditProperty = (property: Property) => {
    setEditingProperty(property);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProperty(undefined);
  };

  const handleViewProperty = (property: Property) => {
    setSelectedPropertyId(property.id);
  };

  const filteredProperties = properties.filter(property =>
    property.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12" dir="rtl">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2 text-right">טוען נכסים...</h3>
            <p className="text-gray-600 text-center">
              מתחבר ל-Airtable ומביא את הנכסים שלך
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="text-right">
          <h2 className="text-3xl font-bold text-gray-800 mb-2 text-right">הנכסים שלי</h2>
          <p className="text-gray-600 text-right">
            ניהול וצפייה בנכסים שלך
          </p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg"
          size="lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          הוסף נכס חדש
        </Button>
      </div>

      {/* Search and Stats */}
      {properties.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Home className="h-4 w-4" />
              <span className="font-medium">{properties.length}</span>
              <span>נכסים</span>
            </div>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="חיפוש נכסים..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10 text-right"
            />
          </div>
        </div>
      )}

      {/* Content */}
      {properties.length === 0 ? (
        <Card className="w-full">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-blue-50 p-4 mb-4">
              <Home className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2 text-right">
              טרם הוספת נכסים
            </h3>
            <p className="text-gray-600 text-center mb-6 max-w-md">
              התחל בהוספת הנכס הראשון שלך למערכת כדי לנהל אותו ולפרסם אותו בקלות
            </p>
            <Button 
              onClick={() => setIsModalOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              הוסף נכס ראשון
            </Button>
          </CardContent>
        </Card>
      ) : filteredProperties.length === 0 ? (
        <Card className="w-full">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-8 w-8 text-gray-400 mb-3" />
            <p className="text-gray-600 text-right">לא נמצאו נכסים התואמים את החיפוש</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              onEdit={handleEditProperty}
              onDelete={handleDeleteProperty}
              onView={handleViewProperty}
            />
          ))}
        </div>
      )}

      <CreatePropertyModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleCreateProperty}
        editProperty={editingProperty}
        brokerEmail={user.email} // <-- זה השדה הנכון!
      />

      {selectedPropertyId && (
        <PropertyDetailsModal
          isOpen={!!selectedPropertyId}
          onClose={() => setSelectedPropertyId(null)}
          propertyId={selectedPropertyId}
          properties={properties}
        />
      )}
    </div>
  );
};

export default PropertiesTab;
