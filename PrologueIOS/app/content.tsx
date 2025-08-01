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
  Platform,
  Modal
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { 
  Search, 
  Plus, 
  Video, 
  FileText, 
  BookOpen, 
  Clock, 
  Users, 
  Star, 
  Play, 
  Eye, 
  TrendingUp,
  Home,
  User,
  MessageSquare,
  MessageCircle,
  X,
  Camera,
  Edit,
  Trash2,
  Save,
  MoreHorizontal,
  ArrowLeft
} from "lucide-react-native";
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
  deleteDoc,
  getDoc,
  getDocs,
  where
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const { width } = Dimensions.get('window');

interface ContentItem {
  id: string;
  type: 'video' | 'article' | 'course';
  title: string;
  description: string;
  category: string;
  tags: string[];
  authorId: string;
  createdAt: any;
  views: number;
  rating: number;
  duration?: string;
  videoUrl?: string;
  imageUrl?: string;
  content?: string;
  lessons?: any[];
  participants?: number;
}

export default function ContentScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'videos' | 'articles' | 'courses'>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Content state
  const [videos, setVideos] = useState<ContentItem[]>([]);
  const [articles, setArticles] = useState<ContentItem[]>([]);
  const [courses, setCourses] = useState<ContentItem[]>([]);
  const [loadingContent, setLoadingContent] = useState(true);
  
  // Profile data
  const [profileData, setProfileData] = useState<{ firstName: string; lastName: string }>({ firstName: "", lastName: "" });

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
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };
    loadProfile();
  }, []);

  // Fetch content from Firestore
  const fetchContent = useCallback(async () => {
    setLoadingContent(true);
    try {
      const videosSnap = await getDocs(query(collection(db, "videos"), orderBy("createdAt", "desc")));
      const articlesSnap = await getDocs(query(collection(db, "articles"), orderBy("createdAt", "desc")));
      const coursesSnap = await getDocs(query(collection(db, "courses"), orderBy("createdAt", "desc")));
      
      setVideos(videosSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'video' } as ContentItem)));
      setArticles(articlesSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'article' } as ContentItem)));
      setCourses(coursesSnap.docs.map(doc => ({ id: doc.id, ...doc.data(), type: 'course' } as ContentItem)));
    } catch (err) {
      console.error("Error fetching content:", err);
    }
    setLoadingContent(false);
  }, []);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // Combine all content for filtering
  const allContent = useMemo(() => {
    return [...videos, ...articles, ...courses];
  }, [videos, articles, courses]);

  // Filter content based on active tab and search
  const filteredContent = useMemo(() => {
    let content = activeTab === 'all' ? allContent : 
                  activeTab === 'videos' ? videos :
                  activeTab === 'articles' ? articles : courses;

    if (searchQuery) {
      content = content.filter(item =>
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return content;
  }, [activeTab, searchQuery, allContent, videos, articles, courses]);

  // Navigation handlers
  const handleHomePress = () => {
    router.push("/Dashboard");
  };

  const handleProfilePress = () => {
    router.push("/Dashboard");
  };

  // Refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchContent().finally(() => setRefreshing(false));
  }, [fetchContent]);

  // Tab selection component
  const TabSelector = () => (
    <View style={styles.tabContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScrollContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'all' && styles.activeTab]}
          onPress={() => setActiveTab('all')}
        >
          <TrendingUp size={16} color={activeTab === 'all' ? "#3B82F6" : "#6B7280"} />
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>All</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'videos' && styles.activeTab]}
          onPress={() => setActiveTab('videos')}
        >
          <Video size={16} color={activeTab === 'videos' ? "#3B82F6" : "#6B7280"} />
          <Text style={[styles.tabText, activeTab === 'videos' && styles.activeTabText]}>Videos</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'articles' && styles.activeTab]}
          onPress={() => setActiveTab('articles')}
        >
          <FileText size={16} color={activeTab === 'articles' ? "#3B82F6" : "#6B7280"} />
          <Text style={[styles.tabText, activeTab === 'articles' && styles.activeTabText]}>Articles</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'courses' && styles.activeTab]}
          onPress={() => setActiveTab('courses')}
        >
          <BookOpen size={16} color={activeTab === 'courses' ? "#3B82F6" : "#6B7280"} />
          <Text style={[styles.tabText, activeTab === 'courses' && styles.activeTabText]}>Courses</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  // Content card component
  const ContentCard = ({ item }: { item: ContentItem }) => {
    const getContentIcon = () => {
      switch (item.type) {
        case 'video':
          return <Video size={16} color="white" />;
        case 'article':
          return <FileText size={16} color="white" />;
        case 'course':
          return <BookOpen size={16} color="white" />;
        default:
          return null;
      }
    };

    const getContentMeta = () => {
      switch (item.type) {
        case 'video':
          return (
            <View style={styles.contentMeta}>
              <View style={styles.metaItem}>
                <Clock size={12} color="#6B7280" />
                <Text style={styles.metaText}>{item.duration || "15:30"}</Text>
              </View>
              <View style={styles.metaItem}>
                <Eye size={12} color="#6B7280" />
                <Text style={styles.metaText}>{item.views || 0}</Text>
              </View>
            </View>
          );
        case 'article':
          return (
            <View style={styles.contentMeta}>
              <View style={styles.metaItem}>
                <Clock size={12} color="#6B7280" />
                <Text style={styles.metaText}>8 min read</Text>
              </View>
              <View style={styles.metaItem}>
                <Eye size={12} color="#6B7280" />
                <Text style={styles.metaText}>{item.views || 0}</Text>
              </View>
            </View>
          );
        case 'course':
          return (
            <View style={styles.contentMeta}>
              <View style={styles.metaItem}>
                <BookOpen size={12} color="#6B7280" />
                <Text style={styles.metaText}>{item.lessons?.length || 0} lessons</Text>
              </View>
              <View style={styles.metaItem}>
                <Users size={12} color="#6B7280" />
                <Text style={styles.metaText}>{item.participants || 0}</Text>
              </View>
            </View>
          );
      }
    };

    return (
      <View style={styles.contentCard}>
        <View style={styles.contentImageContainer}>
          <View style={styles.contentImage}>
            {item.type === 'video' ? (
              <Play size={32} color="#6B7280" />
            ) : item.type === 'article' ? (
              <FileText size={32} color="#6B7280" />
            ) : (
              <BookOpen size={32} color="#6B7280" />
            )}
          </View>
          
          <View style={styles.contentBadge}>
            {getContentIcon()}
            <Text style={styles.contentBadgeText}>{item.type}</Text>
          </View>
          
          {item.type === 'video' && item.duration && (
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>{item.duration}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.contentCardBody}>
          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {item.tags.slice(0, 2).map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
          
          {/* Rating */}
          <View style={styles.ratingContainer}>
            <Star size={12} color="#FCD34D" />
            <Text style={styles.ratingText}>{item.rating || 4.8}</Text>
          </View>
          
          {/* Title */}
          <Text style={styles.contentTitle} numberOfLines={2}>
            {item.title}
          </Text>
          
          {/* Description */}
          <Text style={styles.contentDescription} numberOfLines={2}>
            {item.description}
          </Text>
          
          {/* Meta info */}
          {getContentMeta()}
          
          {/* Footer */}
          <View style={styles.contentFooter}>
            <Text style={styles.authorText}>
              by {profileData.firstName} {profileData.lastName}
            </Text>
            <TouchableOpacity style={styles.viewButton}>
              <Text style={styles.viewButtonText}>View</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // Create Content Modal
  const CreateContentModal = () => {
    const [step, setStep] = useState(1);
    const [contentType, setContentType] = useState<'video' | 'article' | 'course' | ''>('');
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    const contentTypeOptions = [
      { type: 'video', title: 'Video', description: 'Upload and share video content', icon: Video, color: '#EF4444' },
      { type: 'article', title: 'Article', description: 'Write and publish articles', icon: FileText, color: '#10B981' },
      { type: 'course', title: 'Course', description: 'Create structured learning courses', icon: BookOpen, color: '#3B82F6' },
    ];

    const resetForm = () => {
      setStep(1);
      setContentType('');
      setTitle('');
      setCategory('');
      setDescription('');
    };

    const handleCreateContent = async () => {
      if (!title.trim() || !category.trim() || !description.trim()) {
        Alert.alert("Error", "Please fill in all required fields");
        return;
      }

      setIsUploading(true);
      try {
        const user = auth.currentUser;
        const tags = category.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

        const contentData = {
          title,
          category,
          description,
          tags,
          authorId: user?.uid || "anonymous",
          createdAt: serverTimestamp(),
          views: 0,
          rating: 4.8,
        };

        if (contentType === 'video') {
          await addDoc(collection(db, "videos"), {
            ...contentData,
            duration: "15:30",
          });
        } else if (contentType === 'article') {
          await addDoc(collection(db, "articles"), {
            ...contentData,
            content: description,
          });
        } else if (contentType === 'course') {
          await addDoc(collection(db, "courses"), {
            ...contentData,
            lessons: [],
            participants: 0,
          });
        }

        Alert.alert("Success", `${contentType} created successfully!`);
        resetForm();
        setShowCreateModal(false);
        fetchContent();
      } catch (error) {
        console.error("Error creating content:", error);
        Alert.alert("Error", "Failed to create content");
      } finally {
        setIsUploading(false);
      }
    };

    return (
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            {step > 1 && (
              <TouchableOpacity 
                style={styles.modalBackButton}
                onPress={() => setStep(step - 1)}
              >
                <ArrowLeft size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
            <Text style={styles.modalTitle}>
              {step === 1 ? "Create New Content" : `Create ${contentType}`}
            </Text>
            <TouchableOpacity 
              style={styles.modalCloseButton}
              onPress={() => {
                resetForm();
                setShowCreateModal(false);
              }}
            >
              <X size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView 
            style={styles.modalContent}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              {step === 1 ? (
                // Step 1: Content Type Selection
                <View style={styles.typeSelectionContainer}>
                  <Text style={styles.typeSelectionDescription}>
                    Choose the type of content you want to create:
                  </Text>
                  
                  {contentTypeOptions.map((option) => (
                    <TouchableOpacity
                      key={option.type}
                      style={styles.typeOption}
                      onPress={() => {
                        setContentType(option.type as any);
                        setStep(2);
                      }}
                    >
                      <View style={[styles.typeIcon, { backgroundColor: option.color }]}>
                        <option.icon size={24} color="white" />
                      </View>
                      <View style={styles.typeContent}>
                        <Text style={styles.typeTitle}>{option.title}</Text>
                        <Text style={styles.typeDescription}>{option.description}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                // Step 2: Content Creation Form
                <View style={styles.formContainer}>
                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>Title *</Text>
                    <TextInput
                      style={styles.fieldInput}
                      placeholder={`Enter ${contentType} title...`}
                      value={title}
                      onChangeText={setTitle}
                    />
                  </View>

                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>Category *</Text>
                    <TextInput
                      style={styles.fieldInput}
                      placeholder="e.g., Basketball, Mental Training, Nutrition"
                      value={category}
                      onChangeText={setCategory}
                    />
                  </View>

                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>Description *</Text>
                    <TextInput
                      style={[styles.fieldInput, styles.textArea]}
                      placeholder="Describe your content..."
                      value={description}
                      onChangeText={setDescription}
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                    />
                  </View>

                  {contentType === 'video' && (
                    <View style={styles.formField}>
                      <Text style={styles.fieldLabel}>Video File *</Text>
                      <TouchableOpacity style={styles.uploadArea}>
                        <Video size={32} color="#6B7280" />
                        <Text style={styles.uploadText}>Tap to upload video</Text>
                        <Text style={styles.uploadSubtext}>MP4, MOV, AVI up to 500MB</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>

            {step === 2 && (
              <View style={styles.modalFooter}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={() => {
                    resetForm();
                    setShowCreateModal(false);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.createButton, isUploading && styles.createButtonDisabled]}
                  onPress={handleCreateContent}
                  disabled={isUploading || !title.trim() || !category.trim() || !description.trim()}
                >
                  <Save size={16} color="white" />
                  <Text style={styles.createButtonText}>
                    {isUploading ? "Creating..." : `Create ${contentType}`}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.logo}>CONTENT</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Plus size={20} color="white" />
            <Text style={styles.createButtonText}>Create</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInput}>
          <Search size={20} color="#6B7280" />
          <TextInput
            style={styles.searchText}
            placeholder="Search content..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <X size={20} color="#6B7280" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Tab Selector */}
      <TabSelector />

      {/* Content List */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentGrid}>
          {filteredContent.length > 0 ? (
            filteredContent.map((item) => (
              <ContentCard key={`${item.type}-${item.id}`} item={item} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Search size={48} color="#9CA3AF" />
              <Text style={styles.emptyTitle}>No content found</Text>
              <Text style={styles.emptyDescription}>
                Try adjusting your search or filters to find what you're looking for.
              </Text>
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={() => setSearchQuery("")}
              >
                <Text style={styles.clearButtonText}>Clear Search</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Create Content Modal */}
      <CreateContentModal />

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={handleHomePress}>
          <Home size={20} color="#666" />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <FileText size={20} color="#4a90e2" />
          <Text style={[styles.navLabel, styles.navActive]}>Content</Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  createButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  createButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchText: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  tabContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabScrollContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    backgroundColor: '#F3F4F6',
  },
  activeTab: {
    backgroundColor: '#EBF4FF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#3B82F6',
  },
  content: {
    flex: 1,
  },
  contentGrid: {
    padding: 16,
    gap: 16,
  },
  contentCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  contentImageContainer: {
    position: 'relative',
    height: 180,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  contentBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  durationText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  contentCardBody: {
    padding: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  tag: {
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  tagText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    lineHeight: 22,
  },
  contentDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  contentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  contentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorText: {
    fontSize: 12,
    color: '#6B7280',
  },
  viewButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  clearButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  clearButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalBackButton: {
    padding: 8,
    marginRight: 8,
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalCloseButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
  },
  typeSelectionContainer: {
    padding: 24,
  },
  typeSelectionDescription: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 24,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  typeContent: {
    flex: 1,
  },
  typeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  typeDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  formContainer: {
    padding: 24,
    gap: 20,
  },
  formField: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  fieldInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  uploadArea: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 32,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  uploadText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  uploadSubtext: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 24,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  // Bottom Navigation
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