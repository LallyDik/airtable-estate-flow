
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Property, User } from '@/types';
import { AirtableService } from '@/services/airtable';
import PropertyCard from './PropertyCard';
import CreatePropertyModal from './CreatePropertyModal';
import { useToast } from '@/hooks/use-toast';

interface PropertiesTabProps {
  user: User;
}

const PropertiesTab = ({ user }: PropertiesTabProps) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | undefined>();
  const [loading, setLoading] = useState(true);
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
        title: "שגיאה",
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
          title: "הצלחה",
          description: "הנכס עודכן בהצלחה"
        });
      } else {
        await AirtableService.createProperty(propertyData);
        toast({
          title: "הצלחה",
          description: "הנכס נוסף בהצלחה"
        });
      }
      loadProperties();
      setEditingProperty(undefined);
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "לא ניתן לשמור את הנכס",
        variant: "destructive"
      });
      console.error('Error saving property:', error);
    }
  };

  const handleDeleteProperty = async (id: string) => {
    if (confirm('האם אתה בטוח שברצונך למחוק את הנכס?')) {
      try {
        await AirtableService.deleteProperty(id);
        toast({
          title: "הצלחה",
          description: "הנכס נמחק בהצלחה"
        });
        loadProperties();
      } catch (error) {
        toast({
          title: "שגיאה",
          description: "לא ניתן למחוק את הנכס",
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען נכסים...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">הנכסים שלי</h2>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          הוסף נכס
        </Button>
      </div>

      {properties.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">אין לך נכסים עדיין</p>
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            הוסף נכס ראשון
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              onEdit={handleEditProperty}
              onDelete={handleDeleteProperty}
            />
          ))}
        </div>
      )}

      <CreatePropertyModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleCreateProperty}
        editProperty={editingProperty}
        brokerId={user.id}
      />
    </div>
  );
};

export default PropertiesTab;
