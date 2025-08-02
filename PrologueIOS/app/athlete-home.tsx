import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert, 
  StyleSheet, 
  Image, 
  SafeAreaView,
  RefreshControl,
  Dimensions,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { 
  Heart, 
  MessageSquare, 
  Share, 
  MoreHorizontal, 
  Eye, 
  Camera, 
  Video, 
  Target,
  Home,
  Search,
  User,
  Zap,
  Send,
  Bookmark,
  ThumbsUp,
  Edit,
  Trash2,
  X,
  FileText,
  MessageCircle,
  TrendingUp,
  ChevronDown
} from "lucide-react-native";
import * as ImagePicker from 'expo-image-picker';
import { auth, db } from "../firebaseConfig";
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  getDoc, 
  deleteDoc,
  getDocs,
  where
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const { width } = Dimensions.get('window');

interface Post {
  id: string;
  content: string;
  createdBy: string;
  createdAt: any;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  likes?: number;
  likedBy?: string[];
  views?: number;
  viewedBy?: string[];
  commentsCount?: number;
  shares?: number;
  editedAt?: any;
}

interface Profile {
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
}

interface Comment {
  id: string;
  content: string;
  createdBy: string;
  createdAt: any;
  likes: string[];
  parentId?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
}

export default function AthleteHomeScreen() {
  const router = useRouter();
  const [profileData, setProfileData] = useState<Profile>({ firstName: "", lastName: "" });
  const [posts, setPosts] = useState<Post[]>([]);
  const [profileCache, setProfileCache] = useState<Record<string, Profile>>({});
  const [postContent, setPostContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [comments, setComments] = useState<{ [postId: string]: Comment[] }>({});
  const [commentInputs, setCommentInputs] = useState<{ [postId: string]: string }>({});
  const [showComments, setShowComments] = useState<{ [postId: string]: boolean }>({});
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editPostContent, setEditPostContent] = useState<{ [key: string]: string }>({});
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('feed');

  // Helper functions for profile display
  const getInitials = (firstName?: string, lastName?: string): string => {
    if (!firstName && !lastName) return 'AL';
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return first + last || 'AL';
  };

  const getDisplayName = (firstName?: string, lastName?: string): string => {
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    return firstName || 'Student Athlete';
  };

  // Load user profile
  useEffect(() => {
    const loadProfile = async () => {
      if (!auth.currentUser) return;
      try {
        const userDoc = await getDoc(doc(db, 'athletes', auth.currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
                      setProfileData({
              firstName: data.firstName || "",
              lastName: data.lastName || "",
              profileImageUrl: data.profilePhotoUrl || data.profileImageUrl || undefined,
            });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };
    loadProfile();
  }, []);

  // Fetch posts
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post)));
    });
    return () => unsub();
  }, []);

  // Fetch user profiles for posts
  useEffect(() => {
    const missingUids = posts
      .map(post => post.createdBy)
      .filter(uid => uid && !profileCache[uid]);
    
    if (missingUids.length === 0) return;
    
    missingUids.forEach(async (uid) => {
      try {
        const userDoc = await getDoc(doc(db, 'athletes', uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setProfileCache(prev => ({ ...prev, [uid]: data as Profile }));
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
    });
  }, [posts, profileCache]);

  // Listen for comments for each post
  useEffect(() => {
    posts.forEach((post) => {
      if (!post.id) return;
      const commentsRef = collection(db, "posts", post.id, "comments");
      const q = query(commentsRef, orderBy("createdAt", "asc"));
      const unsub = onSnapshot(q, (snapshot) => {
        setComments((prev) => ({ 
          ...prev, 
          [post.id]: snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment))
        }));
      });
      return () => unsub();
    });
  }, [posts]);

  // Post submit handler
  const handlePostSubmit = async () => {
    if (!postContent.trim()) return;
    setPosting(true);
    try {
      const user = auth.currentUser;
      
      // Extract media URL from post content if it exists
      const mediaMatch = postContent.match(/\[Media: (.*?)\]/);
      const mediaUrl = mediaMatch ? mediaMatch[1] : null;
      const cleanContent = postContent.replace(/\[Media: .*?\]/, '').trim();
      
      const postData: any = {
        content: cleanContent || postContent,
        createdBy: user?.uid || "anon",
        userType: "athlete",
        createdAt: serverTimestamp(),
        likes: 0,
        likedBy: [],
        views: 0,
        viewedBy: [],
        commentsCount: 0,
        shares: 0,
      };
      
      // Add media information if present
      if (mediaUrl) {
        postData.mediaUrl = mediaUrl;
        postData.mediaType = mediaUrl.includes('.mp4') || mediaUrl.includes('.mov') ? 'video' : 'image';
      }
      
      await addDoc(collection(db, "posts"), postData);
      setPostContent("");
    } catch (err) {
      Alert.alert("Error", "Failed to create post");
      console.error("Failed to post:", err);
    } finally {
      setPosting(false);
    }
  };

  // Upload image to Firebase Storage (direct approach like web app)
  const uploadImage = async (imageUri: string, type: 'post' | 'profile' | 'cover') => {
    console.log('Upload started - Auth state:', auth.currentUser ? 'Authenticated' : 'Not authenticated');
    console.log('Current user UID:', auth.currentUser?.uid);
    
    if (!auth.currentUser) {
      console.error('No authenticated user found');
      Alert.alert('Upload Failed', 'Please log in to upload photos.');
      return null;
    }
    
    try {
      console.log('Starting upload for:', type, 'URI:', imageUri);
      
      // Convert local file URI to Blob (like web app approach)
      const response = await fetch(imageUri);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      
      const blob = await response.blob();
      console.log('Blob created, size:', blob.size, 'type:', blob.type);
      
      // Validate file size (10MB limit like web app)
      const maxSize = 10 * 1024 * 1024;
      if (blob.size > maxSize) {
        Alert.alert('File Too Large', 'Please select a file smaller than 10MB.');
        return null;
      }
      
      // Validate file type
      if (!blob.type.startsWith('image/')) {
        Alert.alert('Invalid File Type', 'Please select a valid image file.');
        return null;
      }
      
      const storage = getStorage();
      const uid = auth.currentUser.uid;
      const timestamp = Date.now();
      const fileName = `${type}-${uid}-${timestamp}.jpg`;
      
      // Use same path structure as web app
      const storageRef = ref(storage, type === 'post' ? `blog-covers/${uid}/${timestamp}_${fileName}` : `athlete-${type}-pics/${fileName}`);
      
      console.log('Uploading to Firebase Storage:', storageRef.fullPath);
      
      // Upload directly like web app
      await uploadBytes(storageRef, blob, {
        contentType: blob.type || 'image/jpeg',
        customMetadata: {
          uploadedBy: uid,
          uploadType: type,
          originalSize: blob.size.toString(),
          uploadedAt: new Date().toISOString(),
        }
      });
      
      // Get download URL
      const downloadURL = await getDownloadURL(storageRef);
      console.log('Upload successful:', downloadURL);
      return downloadURL;
      
    } catch (error) {
      console.error(`Error uploading ${type} photo:`, error);
      Alert.alert('Upload Failed', 'An unexpected error occurred. Please try again.');
      return null;
    }
  };

  // Media picker for posts
  const pickMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant permission to access your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      allowsMultipleSelection: false,
    });

    if (!result.canceled && result.assets[0]) {
      const selectedMedia = result.assets[0];
      
      // Validate file size
      if (selectedMedia.fileSize && selectedMedia.fileSize > 10 * 1024 * 1024) {
        Alert.alert('File Too Large', 'Please select a file smaller than 10MB.');
        return;
      }
      
      // Upload the media
      const uploadResult = await uploadImage(selectedMedia.uri, 'post');
      
      if (uploadResult) {
        // Add the media to the post content
        setPostContent(prev => prev + `\n[Media: ${uploadResult}]`);
        Alert.alert('Success', 'Media uploaded successfully! You can now post it.');
      } else {
        Alert.alert('Upload Failed', 'Failed to upload media. Please try again.');
      }
    }
  };

  // Like handler
  const handleLike = useCallback(async (postId: string) => {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
      const postRef = doc(db, "posts", postId);
      const postSnap = await getDoc(postRef);
      
      if (postSnap.exists()) {
        const postData = postSnap.data();
        const likedBy = postData.likedBy || [];
        const likes = postData.likes || 0;
        
        if (likedBy.includes(user.uid)) {
          // Unlike
          await updateDoc(postRef, {
            likedBy: arrayRemove(user.uid),
            likes: Math.max(likes - 1, 0)
          });
        } else {
          // Like
          await updateDoc(postRef, {
            likedBy: arrayUnion(user.uid),
            likes: likes + 1
          });
        }
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  }, []);

  // Comment handler
  const handleAddComment = useCallback(async (postId: string) => {
    const user = auth.currentUser;
    const content = commentInputs[postId];
    if (!user || !content || !content.trim()) return;
    
    try {
      const commentsRef = collection(db, "posts", postId, "comments");
      await addDoc(commentsRef, {
        content,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        likes: [],
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        profileImageUrl: profileData.profileImageUrl
      });
      
      // Update comment count
      const postRef = doc(db, "posts", postId);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        const currentCount = postSnap.data().commentsCount || 0;
        await updateDoc(postRef, {
          commentsCount: currentCount + 1
        });
      }
      
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  }, [commentInputs, profileData]);

  // Toggle comments visibility
  const toggleComments = (postId: string) => {
    setShowComments(prev => ({ ...prev, [postId]: !prev[postId] }));
  };

  // Edit post handlers
  const handleStartEditPost = useCallback((postId: string, currentContent: string) => {
    setEditingPost(postId);
    setEditPostContent((prev) => ({ ...prev, [postId]: currentContent }));
  }, []);

  const handleEditPost = useCallback(async (postId: string, newContent: string) => {
    const user = auth.currentUser;
    if (!user || !newContent || !newContent.trim()) return;
    const postRef = doc(db, "posts", postId);
    await updateDoc(postRef, {
      content: newContent,
      editedAt: serverTimestamp(),
    });
    setEditingPost(null);
    setEditPostContent((prev) => ({ ...prev, [postId]: "" }));
  }, []);

  const handleCancelEditPost = useCallback(() => {
    setEditingPost(null);
    setEditPostContent({});
  }, []);

  // Delete post
  const handleDeletePost = async (postId: string) => {
    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: async () => {
            await deleteDoc(doc(db, "posts", postId));
          }
        }
      ]
    );
  };

  // Navigation handlers
  const handleHomePress = () => {
    router.push("/Dashboard");
  };

  const handleContentPress = () => {
    router.push("/content");
  };

  const handleProfilePress = () => {
    router.push("/Dashboard");
  };

  // Refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Refresh logic here
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const renderPost = (post: Post) => {
    const profile = profileCache[post.createdBy] || {};
    const isOwner = auth.currentUser && auth.currentUser.uid === post.createdBy;
    const postComments = comments[post.id] || [];
    const commentCount = postComments.length;
    const likeCount = post.likes || 0;
    const isLiked = post.likedBy && auth.currentUser ? post.likedBy.includes(auth.currentUser.uid) : false;
    
    // Check if post is new (within 24 hours)
    let isNew = false;
    if (post.createdAt && post.createdAt.toDate) {
      const now = new Date();
      const created = post.createdAt.toDate();
      isNew = (now.getTime() - created.getTime()) < 24 * 60 * 60 * 1000;
    }

    return (
      <View key={post.id} style={[styles.postCard, isNew && styles.newPostCard]}>
        {/* Post Header */}
        <View style={styles.postHeader}>
          <View style={styles.postUserInfo}>
            <View style={styles.avatarContainer}>
              {profile.profileImageUrl ? (
                <Image 
                  source={{ uri: profile.profileImageUrl }} 
                  style={styles.avatar}
                />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <User size={24} color="#9CA3AF" />
                </View>
              )}
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>
                {profile.firstName && profile.lastName
                  ? `${profile.firstName} ${profile.lastName}`
                  : profile.firstName || "User"}
              </Text>
              <View style={styles.postMeta}>
                <Text style={styles.timeText}>
                  {post.createdAt && post.createdAt.toDate 
                    ? new Date(post.createdAt.toDate()).toLocaleDateString() 
                    : "Just now"}
                </Text>
                <Text style={styles.dotSeparator}>•</Text>
                <View style={styles.viewsContainer}>
                  <Eye size={12} color="#6B7280" />
                  <Text style={styles.viewsText}>{post.views || 0}</Text>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.postActions}>
            {isNew && (
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>New</Text>
              </View>
            )}
            {isOwner && (
              <TouchableOpacity style={styles.moreButton}>
                <MoreHorizontal size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Post Content */}
        <View style={styles.postContent}>
          {editingPost === post.id ? (
            <View style={styles.editContainer}>
              <TextInput
                style={styles.editInput}
                value={editPostContent[post.id] || ""}
                onChangeText={(text) => setEditPostContent(prev => ({ ...prev, [post.id]: text }))}
                placeholder="Edit your post..."
                multiline
                autoFocus
              />
              <View style={styles.editActions}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={handleCancelEditPost}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.saveButton}
                  onPress={() => handleEditPost(post.id, editPostContent[post.id] || "")}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View>
              <Text style={styles.postText}>{post.content}</Text>
              {post.editedAt && (
                <Text style={styles.editedText}>(edited)</Text>
              )}
            </View>
          )}
        </View>

        {/* Media Content */}
        {post.mediaUrl && (
          <View style={styles.mediaContainer}>
            {post.mediaType === 'image' ? (
              <Image source={{ uri: post.mediaUrl }} style={styles.mediaImage} />
            ) : (
              <View style={styles.videoPlaceholder}>
                <Video size={48} color="#6B7280" />
                <Text style={styles.videoText}>Video Content</Text>
              </View>
            )}
          </View>
        )}

        {/* Enhanced Engagement Stats */}
        <View style={styles.engagementStats}>
          <View style={styles.statsLeft}>
            <View style={styles.likesContainer}>
              <View style={styles.reactionIcons}>
                <View style={[styles.reactionIcon, { backgroundColor: '#EF4444' }]}>
                  <Heart size={10} color="white" />
                </View>
                <View style={[styles.reactionIcon, { backgroundColor: '#3B82F6' }]}>
                  <ThumbsUp size={10} color="white" />
                </View>
              </View>
              <Text style={styles.statsText}>{likeCount} {likeCount === 1 ? 'like' : 'likes'}</Text>
            </View>
            <Text style={styles.statsText}>{commentCount} {commentCount === 1 ? 'comment' : 'comments'}</Text>
            <Text style={styles.statsText}>{post.shares || 0} {(post.shares || 0) === 1 ? 'share' : 'shares'}</Text>
          </View>
        </View>

        {/* Enhanced Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, isLiked && styles.likedButton]}
            onPress={() => handleLike(post.id)}
          >
            <Heart size={20} color={isLiked ? "#EF4444" : "#6B7280"} />
            <Text style={[styles.actionText, isLiked && styles.likedText]}>Like</Text>
            <Text style={styles.actionCount}>{likeCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => toggleComments(post.id)}
          >
            <MessageSquare size={20} color="#6B7280" />
            <Text style={styles.actionText}>Comment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Share size={20} color="#6B7280" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Bookmark size={20} color="#6B7280" />
            <Text style={styles.actionText}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Comments Section */}
        {showComments[post.id] && (
          <View style={styles.commentsSection}>
            <View style={styles.commentInput}>
              <View style={styles.commentAvatar}>
                {profileData.profileImageUrl ? (
                  <Image 
                    source={{ uri: profileData.profileImageUrl }} 
                    style={styles.smallAvatar}
                  />
                ) : (
                  <View style={[styles.smallAvatar, styles.avatarPlaceholder]}>
                    <User size={16} color="#9CA3AF" />
                  </View>
                )}
              </View>
              <View style={styles.commentInputContainer}>
                <TextInput
                  style={styles.commentTextInput}
                  placeholder="Write a comment..."
                  value={commentInputs[post.id] || ""}
                  onChangeText={(text) => setCommentInputs(prev => ({ ...prev, [post.id]: text }))}
                  onSubmitEditing={() => handleAddComment(post.id)}
                />
                <TouchableOpacity 
                  style={styles.sendButton}
                  onPress={() => handleAddComment(post.id)}
                >
                  <Send size={16} color="#3B82F6" />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Comments List */}
            <View style={styles.commentsList}>
              {postComments.map((comment) => (
                <View key={comment.id} style={styles.commentItem}>
                  <View style={styles.commentAvatar}>
                    {comment.profileImageUrl ? (
                      <Image 
                        source={{ uri: comment.profileImageUrl }} 
                        style={styles.smallAvatar}
                      />
                    ) : (
                      <View style={[styles.smallAvatar, styles.avatarPlaceholder]}>
                        <User size={16} color="#9CA3AF" />
                      </View>
                    )}
                  </View>
                  <View style={styles.commentContent}>
                    <View style={styles.commentBubble}>
                      <Text style={styles.commentAuthor}>
                        {comment.firstName && comment.lastName 
                          ? `${comment.firstName} ${comment.lastName}`
                          : "User"}
                      </Text>
                      <Text style={styles.commentText}>{comment.content}</Text>
                    </View>
                    <View style={styles.commentActions}>
                      <Text style={styles.commentTime}>
                        {comment.createdAt && comment.createdAt.toDate
                          ? new Date(comment.createdAt.toDate()).toLocaleDateString()
                          : "Just now"}
                      </Text>
                      <TouchableOpacity style={styles.commentActionButton}>
                        <Text style={styles.commentActionText}>Like</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.commentActionButton}>
                        <Text style={styles.commentActionText}>Reply</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
              {/* Enhanced Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.logoRow}>
            <Image source={require('../assets/p.png')} style={styles.logoImage} />
            <Text style={styles.logoText}>PROLOGUE</Text>
          </TouchableOpacity>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerIconBtn}>
              <Search size={22} color="#6B7280" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerProfileBtn} onPress={handleProfilePress}>
              {profileData.profileImageUrl ? (
                <Image source={{ uri: profileData.profileImageUrl }} style={styles.headerProfileImage} />
              ) : (
                <View style={styles.headerProfilePlaceholder}>
                  <User size={16} color="#6B7280" />
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerIconBtn} onPress={handleProfilePress}>
              <ChevronDown size={16} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Enhanced Create Post Section */}
                      <View style={styles.createPostCard}>
              <View style={styles.createPostHeader}>
                <View style={styles.profileImageContainer}>
                  <View style={styles.profileImageWrapper}>
                    {profileData.profileImageUrl ? (
                      <Image source={{ uri: profileData.profileImageUrl }} style={styles.profileImage} />
                    ) : (
                      <View style={styles.profileImagePlaceholder}>
                        <User size={40} color="#3B82F6" />
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.createPostContent}>
                  <TextInput
                    style={styles.createPostInput}
                    placeholder="What's on your mind?"
                    value={postContent}
                    onChangeText={setPostContent}
                    multiline
                    placeholderTextColor="#9CA3AF"
                  />
                  <View style={styles.createPostActions}>
                    <TouchableOpacity style={styles.mediaButton} onPress={pickMedia}>
                      <Camera size={16} color="#6B7280" />
                      <Text style={styles.mediaButtonText}>Photo/Video</Text>
                    </TouchableOpacity>
                    <View style={styles.spacer} />
                    <TouchableOpacity 
                      style={[styles.postButton, (!postContent.trim() || posting) && styles.postButtonDisabled]}
                      onPress={handlePostSubmit}
                      disabled={!postContent.trim() || posting}
                    >
                      <Text style={styles.postButtonText}>
                        {posting ? "Posting..." : "Post"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

          {/* Enhanced Tab Navigation */}
          <View style={styles.tabContainer}>
            <TouchableOpacity style={styles.activeTab}>
              <Zap size={16} color="#3B82F6" />
              <Text style={styles.activeTabText}>Feed</Text>
            </TouchableOpacity>
          </View>

          {/* Posts Feed */}
          <View style={styles.postsContainer}>
            {posts.map(renderPost)}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Keep existing Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={handleHomePress}>
          <Home size={20} color="#4a90e2" />
          <Text style={[styles.navLabel, styles.navActive]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleContentPress}>
          <FileText size={20} color="#666" />
          <Text style={styles.navLabel}>Content</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <MessageSquare size={20} color="#666" />
          <Text style={styles.navLabel}>Feedback</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <MessageCircle size={20} color="#666" />
          <Text style={styles.navLabel}>Messages</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleProfilePress}>
          <User size={20} color="#666" />
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
    fontSize: 18,
    fontWeight: '900',
    color: '#1F2937',
    letterSpacing: 0.05,
    fontFamily: 'Impact',
    textTransform: 'uppercase',
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
  headerProfileBtn: {
    padding: 4,
    borderRadius: 16,
    marginLeft: 4,
    marginRight: 4,
  },
  headerProfileImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  headerProfilePlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    letterSpacing: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerButton: {
    padding: 8,
    borderRadius: 8,
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  profileImageContainer: {
    marginBottom: 16,
  },
  profileImageWrapper: {
    position: 'relative',
  },
  profileImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createPostContent: {
    flex: 1,
    marginLeft: 16,
  },
  spacer: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  createPostCard: {
    backgroundColor: 'white',
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  createPostHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatarContainer: {
    marginTop: 4,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E5E7EB',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  createPostInput: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  createPostActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  createPostButtons: {
    flexDirection: 'row',
    gap: 16,
  },
  mediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
  },
  mediaButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  postButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postButtonDisabled: {
    backgroundColor: '#9CA3AF',
    elevation: 0,
    shadowOpacity: 0,
  },
  postButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  tabContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  activeTabText: {
    color: '#3B82F6',
    fontWeight: '600',
    fontSize: 16,
  },
  postsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  postCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  newPostCard: {
    borderColor: '#3B82F6',
    borderWidth: 2,
    shadowColor: '#3B82F6',
    shadowOpacity: 0.2,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    paddingBottom: 12,
  },
  postUserInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  timeText: {
    fontSize: 14,
    color: '#6B7280',
  },
  dotSeparator: {
    fontSize: 14,
    color: '#6B7280',
  },
  viewsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewsText: {
    fontSize: 14,
    color: '#6B7280',
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  newBadge: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  newBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  moreButton: {
    padding: 4,
    borderRadius: 8,
  },
  postContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  postText: {
    fontSize: 16,
    color: '#1F2937',
    lineHeight: 24,
  },
  editedText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 4,
  },
  editContainer: {
    gap: 12,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontWeight: '500',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  mediaContainer: {
    backgroundColor: '#000',
    aspectRatio: 16/9,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  videoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  videoText: {
    color: '#6B7280',
    fontSize: 16,
  },
  engagementStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  statsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  likesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reactionIcons: {
    flexDirection: 'row',
    marginRight: -8,
  },
  reactionIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    marginRight: -8,
  },
  statsText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 4,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 6,
  },
  likedButton: {
    backgroundColor: '#FEF2F2',
  },
  actionText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  likedText: {
    color: '#EF4444',
  },
  actionCount: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  commentsSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 16,
  },
  commentInput: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  commentAvatar: {
    marginTop: 4,
  },
  smallAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
  },
  commentInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  commentTextInput: {
    flex: 1,
    fontSize: 14,
  },
  sendButton: {
    padding: 4,
    borderRadius: 8,
  },
  commentsList: {
    gap: 12,
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentBubble: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  commentText: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 4,
    paddingLeft: 12,
  },
  commentTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  commentActionButton: {
    paddingVertical: 2,
  },
  commentActionText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 12,
    paddingBottom: 34,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  navLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  navActive: {
    color: '#4a90e2',
    fontWeight: '600',
  },
}); 