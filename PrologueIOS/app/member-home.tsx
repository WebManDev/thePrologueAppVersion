import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, Pressable,
  TextInput, Alert, ActivityIndicator, FlatList, RefreshControl
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, updateDoc, arrayUnion, arrayRemove, deleteDoc, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { Home, BookOpen, Eye, MessageSquare, MessageCircle, User, Search, Settings, LogOut, ChevronDown, Heart, MessageCircle as MessageCircleIcon, Share, MoreHorizontal, Edit, Trash2, Camera, Video, Target, Crown, Zap, Bookmark, Send, Repeat2, X, Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface MemberData {
  firstName?: string;
  lastName?: string;
  name?: string;
  bio?: string;
  email?: string;
  profileImageUrl?: string;
  [key: string]: any;
}

interface Post {
  id: string;
  content: string;
  createdBy: string;
  userType: string;
  createdAt: any;
  mediaUrl?: string;
  mediaType?: string;
  likes?: number;
  likedBy?: string[];
  views?: number;
  commentsCount?: number;
  shares?: number;
  editedAt?: any;
}

interface Comment {
  id: string;
  content: string;
  createdBy: string;
  userType: string;
  createdAt: any;
  profileImageUrl?: string;
  firstName?: string;
  lastName?: string;
  parentId?: string;
  likes?: string[];
  editedAt?: any;
}

export default function MemberHomeScreen() {
  const [memberData, setMemberData] = useState<MemberData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [firebasePosts, setFirebasePosts] = useState<Post[]>([]);
  const [profileCache, setProfileCache] = useState<Record<string, any>>({});
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});
  const [comments, setComments] = useState<{ [postId: string]: Comment[] }>({});
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'feed' | 'subscribed'>('feed');
  const [postContent, setPostContent] = useState('');
  const [posting, setPosting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const memberDoc = await getDoc(doc(db, 'members', user.uid));
          if (memberDoc.exists()) {
            setMemberData(memberDoc.data() as MemberData);
          }
        } catch (error) {
          console.error('Error fetching member data:', error);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch posts
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setFirebasePosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post)));
    });
    return () => unsub();
  }, []);

  // Fetch user profiles for posts
  useEffect(() => {
    const missingUids = firebasePosts
      .map(post => post.createdBy)
      .filter(uid => uid && !profileCache[uid]);
    if (missingUids.length === 0) return;
    missingUids.forEach(async (uid) => {
      let profile = null;
      // Try member first
      const memberDoc = await getDoc(doc(db, 'members', uid));
      if (memberDoc.exists()) {
        profile = memberDoc.data();
      } else {
        const athleteDoc = await getDoc(doc(db, 'athletes', uid));
        if (athleteDoc.exists()) {
          profile = athleteDoc.data();
        }
      }
      setProfileCache(prev => ({ ...prev, [uid]: profile }));
    });
  }, [firebasePosts]);

  // Listen for comments for each post
  useEffect(() => {
    firebasePosts.forEach((post) => {
      if (!post.id) return;
      const commentsRef = collection(db, "posts", post.id, "comments");
      const q = query(commentsRef, orderBy("createdAt", "asc"));
      const unsub = onSnapshot(q, (snapshot) => {
        setComments((prev) => ({ ...prev, [post.id]: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment)) }));
      });
      return () => unsub();
    });
  }, [firebasePosts]);

  const getInitials = (firstName?: string, lastName?: string): string => {
    if (!firstName && !lastName) return 'ML';
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return first + last || 'ML';
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await firebaseSignOut(auth);
      router.replace('/');
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      setLogoutLoading(false);
      setShowUserMenu(false);
    }
  };

  const handleLike = async (postId: string) => {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
      const postRef = doc(db, "posts", postId);
      const postSnap = await getDoc(postRef);
      const likedBy = postSnap.data()?.likedBy || [];
      
      if (likedBy.includes(user.uid)) {
        await updateDoc(postRef, { 
          likes: (postSnap.data()?.likes || 1) - 1,
          likedBy: arrayRemove(user.uid) 
        });
      } else {
        await updateDoc(postRef, { 
          likes: (postSnap.data()?.likes || 0) + 1,
          likedBy: arrayUnion(user.uid) 
        });
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleSave = (postId: string) => {
    setSavedPosts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const handleAddComment = async (postId: string, content: string) => {
    const user = auth.currentUser;
    if (!user || !content || !content.trim()) return;
    
    try {
      const commentsRef = collection(db, "posts", postId, "comments");
      await addDoc(commentsRef, {
        content,
        createdBy: user.uid,
        userType: "member",
        createdAt: serverTimestamp(),
        profileImageUrl: memberData?.profileImageUrl,
        firstName: memberData?.firstName,
        lastName: memberData?.lastName,
        likes: [],
      });
      
      // Increment comment count on the post
      const postRef = doc(db, "posts", postId);
      const postSnap = await getDoc(postRef);
      await updateDoc(postRef, { commentsCount: (postSnap.data()?.commentsCount || 0) + 1 });
      
      // Clear input
      setCommentInputs(prev => ({ ...prev, [postId]: "" }));
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deleteDoc(doc(db, "posts", postId));
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleCreatePost = async () => {
    if (!postContent.trim()) return;
    setPosting(true);
    
    try {
      const user = auth.currentUser;
      if (!user) return;
      
      await addDoc(collection(db, "posts"), {
        content: postContent,
        createdBy: user.uid,
        userType: "member",
        createdAt: serverTimestamp(),
        likes: 0,
        views: 0,
        commentsCount: 0,
        shares: 0,
      });
      
      setPostContent('');
      setShowCreatePost(false);
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setPosting(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Refresh logic here
    setTimeout(() => setRefreshing(false), 1000);
  };

  const initials = getInitials(memberData?.firstName, memberData?.lastName);
  const displayName = memberData?.firstName && memberData?.lastName ? `${memberData.firstName} ${memberData.lastName}` : 'Member';

  const renderPost = ({ item }: { item: Post }) => {
    const profile = profileCache[item.createdBy] || {};
    const isOwner = auth.currentUser && auth.currentUser.uid === item.createdBy;
    const likeCount = item.likes || 0;
    const isLiked = item.likedBy && auth.currentUser ? item.likedBy.includes(auth.currentUser.uid) : false;
    const postComments = comments[item.id] || [];
    const commentCount = postComments.length;
    const shareCount = item.shares || 0;
    const commentInput = commentInputs[item.id] || '';

    return (
      <View key={item.id} style={styles.postCard}>
        {/* Post Header */}
        <View style={styles.postHeader}>
          <View style={styles.postUserInfo}>
            <View style={styles.postAvatar}>
              {profile.profileImageUrl ? (
                <Image source={{ uri: profile.profileImageUrl }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {getInitials(profile.firstName, profile.lastName)}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.postUserDetails}>
              <Text style={styles.postUserName}>
                {profile.firstName && profile.lastName
                  ? `${profile.firstName} ${profile.lastName}`
                  : profile.firstName || profile.name || item.createdBy}
              </Text>
              <Text style={styles.postTime}>
                {item.createdAt?.toDate ? 
                  new Date(item.createdAt.toDate()).toLocaleDateString() : 
                  'Just now'}
              </Text>
            </View>
          </View>
          {isOwner && (
            <TouchableOpacity 
              style={styles.postMenuButton}
              onPress={() => Alert.alert(
                'Post Options',
                'What would you like to do?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => handleDeletePost(item.id) },
                ]
              )}
            >
              <MoreHorizontal size={16} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        {/* Post Content */}
        <View style={styles.postContent}>
          <Text style={styles.postText}>{item.content}</Text>
          {item.editedAt && (
            <Text style={styles.editedText}>(edited)</Text>
          )}
        </View>

        {/* Post Media */}
        {item.mediaUrl && item.mediaType === 'image' && (
          <Image source={{ uri: item.mediaUrl }} style={styles.postMedia} />
        )}

        {/* Post Stats */}
        <View style={styles.postStats}>
          <Text style={styles.postStatsText}>
            {likeCount} likes • {commentCount} comments • {shareCount} shares
          </Text>
        </View>

        {/* Post Actions */}
        <View style={styles.postActions}>
          <TouchableOpacity 
            style={[styles.actionButton, isLiked && styles.actionButtonActive]}
            onPress={() => handleLike(item.id)}
          >
            <Heart size={18} color={isLiked ? "#ef4444" : "#666"} />
            <Text style={[styles.actionText, isLiked && styles.actionTextActive]}>Like</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <MessageSquare size={18} color="#666" />
            <Text style={styles.actionText}>Comment</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Share size={18} color="#666" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleSave(item.id)}
          >
            <Bookmark size={18} color={savedPosts.has(item.id) ? "#3b82f6" : "#666"} />
            <Text style={styles.actionText}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          {postComments.slice(0, 3).map((comment) => (
            <View key={comment.id} style={styles.comment}>
              <Text style={styles.commentText}>
                <Text style={styles.commentAuthor}>
                  {comment.firstName && comment.lastName
                    ? `${comment.firstName} ${comment.lastName}`
                    : comment.firstName || 'User'}
                </Text>
                {' '}{comment.content}
              </Text>
            </View>
          ))}
          {postComments.length > 3 && (
            <Text style={styles.viewMoreComments}>
              View all {postComments.length} comments
            </Text>
          )}
        </View>

        {/* Comment Input */}
        <View style={styles.commentInputContainer}>
          <TextInput
            style={styles.commentInput}
            placeholder="Write a comment..."
            value={commentInput}
            onChangeText={(text) => setCommentInputs(prev => ({ ...prev, [item.id]: text }))}
          />
          <TouchableOpacity 
            style={styles.commentButton}
            onPress={() => handleAddComment(item.id, commentInput)}
            disabled={!commentInput.trim()}
          >
            <Send size={16} color={commentInput.trim() ? "#3b82f6" : "#ccc"} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/member-home')} style={styles.logoRow}>
          <Image source={require('../assets/p.png')} style={styles.logoImage} />
          <Text style={styles.logoText}>PROLOGUE</Text>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => {}}>
            <Search size={22} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => setShowUserMenu(true)}>
            <View style={styles.profileCircle}>
              {memberData?.profileImageUrl ? (
                <Image source={{ uri: memberData.profileImageUrl }} style={styles.profileImage} />
              ) : (
                <Text style={styles.profileInitials}>{initials}</Text>
              )}
            </View>
            <ChevronDown size={16} color="#6B7280" style={{ marginLeft: 2 }} />
          </TouchableOpacity>
        </View>
      </View>

      {/* User Menu Modal */}
      <Modal
        visible={showUserMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUserMenu(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowUserMenu(false)}>
          <View style={styles.userMenuCard}>
            <TouchableOpacity style={styles.userMenuItem} onPress={() => { setShowUserMenu(false); }}>
              <Settings size={18} color="#3B82F6" style={{ marginRight: 10 }} />
              <Text style={styles.userMenuText}>Settings</Text>
            </TouchableOpacity>
            <View style={styles.userMenuDivider} />
            <TouchableOpacity style={styles.userMenuItem} onPress={handleLogout} disabled={logoutLoading}>
              <LogOut size={18} color="#EF4444" style={{ marginRight: 10 }} />
              <Text style={[styles.userMenuText, { color: '#EF4444' }]}>
                {logoutLoading ? 'Logging out...' : 'Logout'}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Create Post Button */}
      <TouchableOpacity 
        style={styles.createPostButton}
        onPress={() => setShowCreatePost(true)}
      >
        <Plus size={24} color="#fff" />
      </TouchableOpacity>

      {/* Create Post Modal */}
      <Modal
        visible={showCreatePost}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCreatePost(false)}
      >
        <View style={styles.createPostModal}>
          <View style={styles.createPostContent}>
            <View style={styles.createPostHeader}>
              <Text style={styles.createPostTitle}>Create Post</Text>
              <TouchableOpacity onPress={() => setShowCreatePost(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.createPostForm}>
              <View style={styles.createPostUserInfo}>
                <View style={styles.createPostAvatar}>
                  {memberData?.profileImageUrl ? (
                    <Image source={{ uri: memberData.profileImageUrl }} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Text style={styles.avatarText}>{initials}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.createPostUserName}>{displayName}</Text>
              </View>
              
              <TextInput
                style={styles.createPostInput}
                placeholder="What's on your mind?"
                value={postContent}
                onChangeText={setPostContent}
                multiline
                numberOfLines={4}
              />
              
              <View style={styles.createPostActions}>
                <TouchableOpacity style={styles.createPostAction}>
                  <Camera size={20} color="#666" />
                  <Text style={styles.createPostActionText}>Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.createPostAction}>
                  <Video size={20} color="#666" />
                  <Text style={styles.createPostActionText}>Video</Text>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity
                style={[styles.createPostSubmit, !postContent.trim() && styles.createPostSubmitDisabled]}
                onPress={handleCreatePost}
                disabled={posting || !postContent.trim()}
              >
                {posting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.createPostSubmitText}>Post</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'feed' && styles.tabButtonActive]}
          onPress={() => setActiveTab('feed')}
        >
          <Zap size={16} color={activeTab === 'feed' ? "#3b82f6" : "#666"} />
          <Text style={[styles.tabText, activeTab === 'feed' && styles.tabTextActive]}>Feed</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'subscribed' && styles.tabButtonActive]}
          onPress={() => setActiveTab('subscribed')}
        >
          <Crown size={16} color={activeTab === 'subscribed' ? "#3b82f6" : "#666"} />
          <Text style={[styles.tabText, activeTab === 'subscribed' && styles.tabTextActive]}>Subscribed</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <FlatList
        style={styles.mainContent}
        data={activeTab === 'feed' ? firebasePosts : []}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Home size={48} color="#ccc" />
            <Text style={styles.emptyStateTitle}>Your feed is empty</Text>
            <Text style={styles.emptyStateText}>
              Start following creators and subscribing to content to see updates in your feed.
            </Text>
          </View>
        }
      />

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => {}}>
          <Home size={22} color="#4a90e2" />
          <Text style={[styles.navLabel, styles.navActive]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => {}}>
          <BookOpen size={22} color="#666" />
          <Text style={styles.navLabel}>Training</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => {}}>
          <Eye size={22} color="#666" />
          <Text style={styles.navLabel}>Browse</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => {}}>
          <MessageSquare size={22} color="#666" />
          <Text style={styles.navLabel}>Feedback</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => {}}>
          <MessageCircle size={22} color="#666" />
          <Text style={styles.navLabel}>Messages</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setShowUserMenu(true)}>
          <User size={22} color="#666" />
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingTop: 48,
    paddingBottom: 8,
    paddingHorizontal: 16,
    zIndex: 10,
    elevation: 4,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    width: 28,
    height: 28,
    marginRight: 8,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    letterSpacing: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerIconBtn: {
    padding: 6,
    borderRadius: 8,
    marginLeft: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  profileImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  profileInitials: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  userMenuCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 20,
    elevation: 10,
  },
  userMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  userMenuText: {
    fontSize: 16,
    color: '#374151',
  },
  userMenuDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 8,
  },
  createPostButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    zIndex: 1000,
  },
  createPostModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  createPostContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  createPostHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  createPostTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  createPostForm: {
    gap: 16,
  },
  createPostUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  createPostAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createPostUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  createPostInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  createPostActions: {
    flexDirection: 'row',
    gap: 16,
  },
  createPostAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  createPostActionText: {
    fontSize: 14,
    color: '#666',
  },
  createPostSubmit: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  createPostSubmitDisabled: {
    backgroundColor: '#ccc',
  },
  createPostSubmitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  tabButtonActive: {
    backgroundColor: '#eff6ff',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  tabTextActive: {
    color: '#3b82f6',
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 12,
  },
  postUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  postAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  postUserDetails: {
    flex: 1,
  },
  postUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  postTime: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  postMenuButton: {
    padding: 4,
  },
  postContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  postText: {
    fontSize: 16,
    color: '#1f2937',
    lineHeight: 24,
  },
  editedText: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  postMedia: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  postStats: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  postStatsText: {
    fontSize: 14,
    color: '#6b7280',
  },
  postActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 6,
  },
  actionButtonActive: {
    backgroundColor: '#fef2f2',
  },
  actionText: {
    fontSize: 14,
    color: '#666',
  },
  actionTextActive: {
    color: '#ef4444',
  },
  commentsSection: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  comment: {
    marginBottom: 8,
  },
  commentText: {
    fontSize: 14,
    color: '#1f2937',
    lineHeight: 20,
  },
  commentAuthor: {
    fontWeight: '600',
  },
  viewMoreComments: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    marginRight: 8,
  },
  commentButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  navActive: {
    color: '#4a90e2',
  },
}); 