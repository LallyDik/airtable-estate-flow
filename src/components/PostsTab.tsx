
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Post, Property, User } from '@/types';
import { AirtableService } from '@/services/airtable';
import PostCard from './PostCard';
import CreatePostModal from './CreatePostModal';
import { useToast } from '@/hooks/use-toast';

interface PostsTabProps {
  user: User;
}

const PostsTab = ({ user }: PostsTabProps) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | undefined>();
  const [loading, setLoading] = useState(true);
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
        title: "שגיאה",
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
          title: "הצלחה",
          description: "הפרסום עודכן בהצלחה"
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
          title: "הצלחה",
          description: "הפרסום נוסף בהצלחה"
        });
      }
      loadData();
      setEditingPost(undefined);
    } catch (error) {
      toast({
        title: "שגיאה",
        description: "לא ניתן לשמור את הפרסום",
        variant: "destructive"
      });
      console.error('Error saving post:', error);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (confirm('האם אתה בטוח שברצונך למחוק את הפרסום?')) {
      try {
        await AirtableService.deletePost(id);
        toast({
          title: "הצלחה",
          description: "הפרסום נמחק בהצלחה"
        });
        loadData();
      } catch (error) {
        toast({
          title: "שגיאה",
          description: "לא ניתן למחוק את הפרסום",
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

  const getTodayPostCount = () => {
    const today = new Date().toISOString().split('T')[0];
    return posts.filter(post => post.date.startsWith(today)).length;
  };

  const canCreateNewPost = () => {
    return getTodayPostCount() < 2 && properties.length > 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען פרסומים...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">הפרסומים שלי</h2>
          <p className="text-sm text-gray-600 mt-1">
            פרסומים היום: {getTodayPostCount()}/2
          </p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)}
          disabled={!canCreateNewPost()}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          <Plus className="h-4 w-4 mr-2" />
          פרסום חדש
        </Button>
      </div>

      {!canCreateNewPost() && properties.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            יש להוסיף נכסים לפני יצירת פרסומים
          </p>
        </div>
      )}

      {!canCreateNewPost() && getTodayPostCount() >= 2 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            הגעת למגבלת 2 פרסומים ביום
          </p>
        </div>
      )}

      {posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">אין לך פרסומים עדיין</p>
          {canCreateNewPost() && (
            <Button 
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              צור פרסום ראשון
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onEdit={handleEditPost}
              onDelete={handleDeletePost}
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
    </div>
  );
};

export default PostsTab;
