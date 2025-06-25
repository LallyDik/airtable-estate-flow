import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, Loader2, AlertCircle, TrendingUp } from 'lucide-react';
import { Post, Property, User } from '@/types';
import { AirtableService } from '@/services/airtable';
import PostCard from './PostCard';
import CreatePostModal from './CreatePostModal';
import PropertyDetailsModal from './PropertyDetailsModal';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PostsTabProps {
  user: User;
}

const PostsTab = ({ user }: PostsTabProps) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | undefined>();
  const [loading, setLoading] = useState(true);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [postsData, propertiesData] = await Promise.all([
        AirtableService.getPosts(user.id),
        AirtableService.getProperties(user.id)
      ]);
      setPosts(postsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setProperties(propertiesData);
    } catch (error) {
      toast({
        title: "שגיאה בטעינת פרסומים",
        description: "לא ניתן לטעון את הפרסומים. בדוק את החיבור ל-Airtable.",
        variant: "destructive"
      });
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (postData: Omit<Post, 'id'>) => {
    try {
      if (editingPost) {
        await AirtableService.updatePost(editingPost.id, postData);
        toast({
          title: "פרסום עודכן",
          description: "הפרסום עודכן בהצלחה במערכת"
        });
      } else {
        await AirtableService.createPost(postData);
        // Update property's last post date
        const property = properties.find(p => p.id === postData.property);
        if (property) {
          await AirtableService.updateProperty(property.id, {
            lastPostDate: postData.date
          });
        }
        toast({
          title: "פרסום נוסף",
          description: "הפרסום נוסף בהצלחה למערכת"
        });
      }
      loadData();
      setEditingPost(undefined);
    } catch (error) {
      toast({
        title: "שגיאה בשמירת פרסום",
        description: "לא ניתן לשמור את הפרסום. נסה שנית.",
        variant: "destructive"
      });
      console.error('Error saving post:', error);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (confirm('האם אתה בטוח שברצונך למחוק את הפרסום? פעולה זו אינה הפיכה.')) {
      try {
        await AirtableService.deletePost(id);
        toast({
          title: "פרסום נמחק",
          description: "הפרסום נמחק בהצלחה מהמערכת"
        });
        loadData();
      } catch (error) {
        toast({
          title: "שגיאה במחיקת פרסום",
          description: "לא ניתן למחוק את הפרסום. נסה שנית.",
          variant: "destructive"
        });
        console.error('Error deleting post:', error);
      }
    }
  };

  const handleEditPost = (post: Post) => {
    setEditingPost(post);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPost(undefined);
  };

  const handleViewProperty = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
  };

  const getTodayPostCount = () => {
    const today = new Date().toISOString().split('T')[0];
    return posts.filter(post => post.date.startsWith(today)).length;
  };

  const canCreateNewPost = () => {
    return getTodayPostCount() < 2 && properties.length > 0;
  };

  const todayPosts = getTodayPostCount();
  const totalPosts = posts.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12" dir="rtl">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2 text-right">טוען פרסומים...</h3>
            <p className="text-gray-600 text-center">
              מתחבר ל-Airtable ומביא את הפרסומים שלך
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
          <h2 className="text-3xl font-bold text-gray-800 mb-2 text-right">הפרסומים שלי</h2>
          <p className="text-gray-600 text-right">
            ניהול וצפייה בכל הפרסומים שלך
          </p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)}
          disabled={!canCreateNewPost()}
          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg disabled:opacity-50"
          size="lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          פרסום חדש
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm text-gray-600 text-right">פרסומים היום</p>
                <p className="text-2xl font-bold text-gray-800">{todayPosts}/2</p>
              </div>
              <div className="rounded-full bg-blue-50 p-3">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="mt-2 text-right">
              <Badge variant={todayPosts >= 2 ? "destructive" : "secondary"}>
                {todayPosts >= 2 ? "הגעת למגבלה" : `נותרו ${2 - todayPosts}`}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm text-gray-600 text-right">סה"כ פרסומים</p>
                <p className="text-2xl font-bold text-gray-800">{totalPosts}</p>
              </div>
              <div className="rounded-full bg-green-50 p-3">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <p className="text-sm text-gray-600 text-right">נכסים זמינים</p>
                <p className="text-2xl font-bold text-gray-800">{properties.length}</p>
              </div>
              <div className="rounded-full bg-purple-50 p-3">
                <Plus className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {!canCreateNewPost() && properties.length === 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <p className="text-yellow-800 font-medium text-right">
                יש להוסיף נכסים לפני יצירת פרסומים
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!canCreateNewPost() && getTodayPostCount() >= 2 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-red-800 font-medium text-right">
                הגעת למגבלת 2 פרסומים ביום. נסה שוב מחר.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      {posts.length === 0 ? (
        <Card className="w-full">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="rounded-full bg-green-50 p-4 mb-4">
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2 text-right">
              טרם יצרת פרסומים
            </h3>
            <p className="text-gray-600 text-center mb-6 max-w-md">
              צור את הפרסום הראשון שלך כדי להתחיל לפרסם נכסים ברשתות החברתיות
            </p>
            {canCreateNewPost() && (
              <Button 
                onClick={() => setIsModalOpen(true)}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                size="lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                צור פרסום ראשון
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onEdit={handleEditPost}
              onDelete={handleDeletePost}
              onViewProperty={handleViewProperty}
            />
          ))}
        </div>
      )}

      <CreatePostModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleCreatePost}
        editPost={editingPost}
        properties={properties}
        brokerId={user.id}
        existingPosts={posts}
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

export default PostsTab;
