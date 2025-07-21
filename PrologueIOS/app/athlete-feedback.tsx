import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  Modal,
  ActivityIndicator
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { 
  MessageSquare,
  Users,
  Star,
  BarChart3,
  Plus,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Home,
  FileText,
  MessageCircle,
  Bell,
  User,
  X,
  Filter,
  TrendingUp
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
  arrayUnion, 
  arrayRemove, 
  getDoc, 
  deleteDoc,
  getDocs,
  where
} from "firebase/firestore";

const { width } = Dimensions.get('window');

interface RequestedFeedback {
  id: string;
  title: string;
  message: string;
  createdAt?: { seconds: number };
  videoUrl?: string;
  memberId?: string;
}

interface GivenFeedback {
  id: string;
  requestId: string;
  title: string;
  rating: number;
  comment: string;
  createdAt?: { seconds: number };
}

interface Profile {
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
}

export default function AthleteFeedbackScreen() {
  const router = useRouter();
  const [profileData, setProfileData] = useState<Profile>({ firstName: "", lastName: "" });
  const [activeTab, setActiveTab] = useState('requested');
  const [refreshing, setRefreshing] = useState(false);

  // Feedback states
  const [requestedFeedback, setRequestedFeedback] = useState<RequestedFeedback[]>([]);
  const [givenFeedback, setGivenFeedback] = useState<GivenFeedback[]>([]);
  
  // Platform feedback form state
  const [platformFeedbackType, setPlatformFeedbackType] = useState("");
  const [platformFeedbackTitle, setPlatformFeedbackTitle] = useState("");
  const [platformFeedbackMessage, setPlatformFeedbackMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Feedback completion state
  const [selectedFeedback, setSelectedFeedback] = useState<RequestedFeedback | null>(null);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [isCompletingFeedback, setIsCompletingFeedback] = useState(false);
  const [showCompleteFeedbackModal, setShowCompleteFeedbackModal] = useState(false);
  const [showPlatformFeedbackModal, setShowPlatformFeedbackModal] = useState(false);
  const [showTypeSelector, setShowTypeSelector] = useState(false);

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
            profileImageUrl: data.profileImageUrl || undefined,
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };
    loadProfile();
  }, []);

  // Load feedback data
  useEffect(() => {
    if (!auth.currentUser) return;
    
    const user = auth.currentUser;
    
    // Fetch requested feedback
    const q1 = query(collection(db, "feedbackToAthlete"), where("athleteId", "==", user.uid));
    const unsubRequested = onSnapshot(q1, (snapshot) => {
      setRequestedFeedback(snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || '',
          message: data.message || '',
          createdAt: data.createdAt,
          videoUrl: data.videoUrl || '',
          memberId: data.memberId || null,
        };
      }));
    });
    
    // Fetch given feedback
    const q2 = query(collection(db, "feedbackGiven"), where("athleteId", "==", user.uid));
    const unsubGiven = onSnapshot(q2, (snapshot) => {
      setGivenFeedback(snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          requestId: data.requestId,
          title: data.title || '',
          rating: data.rating || 0,
          comment: data.comment || '',
          createdAt: data.createdAt,
        };
      }));
    });

    return () => {
      unsubRequested();
      unsubGiven();
    };
  }, []);

  // Navigation handlers
  const handleHomePress = () => {
    router.push('/athlete-home');
  };

  const handleContentPress = () => {
    router.push('/content');
  };

  const handleFeedbackPress = () => {
    // Already on feedback page
  };

  const handleProfilePress = () => {
    router.push('/Dashboard');
  };

  // Platform feedback handler
  const handleSubmitPlatformFeedback = async () => {
    if (!platformFeedbackType || !platformFeedbackTitle || !platformFeedbackMessage) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setIsSubmitting(true);
    
    try {
      await addDoc(collection(db, "platformFeedback"), {
        type: platformFeedbackType,
        title: platformFeedbackTitle,
        message: platformFeedbackMessage,
        userId: auth.currentUser?.uid,
        createdAt: serverTimestamp(),
        status: 'pending'
      });
      
      setPlatformFeedbackType("");
      setPlatformFeedbackTitle("");
      setPlatformFeedbackMessage("");
      setShowPlatformFeedbackModal(false);
      Alert.alert('Success', 'Platform feedback submitted successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
      console.error('Error submitting platform feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Feedback completion handler
  const handleOpenCompleteFeedback = (feedback: RequestedFeedback) => {
    setSelectedFeedback(feedback);
    setFeedbackRating(0);
    setFeedbackComment("");
    setShowCompleteFeedbackModal(true);
  };

  const handleCompleteFeedback = async () => {
    if (!selectedFeedback || feedbackRating === 0) {
      Alert.alert('Error', 'Please provide a rating');
      return;
    }
    
    setIsCompletingFeedback(true);
    const user = auth.currentUser;
    if (!user) return;
    
    try {
      // Save to feedbackGiven collection
      const docRef = await addDoc(collection(db, "feedbackGiven"), {
        athleteId: user.uid,
        requestId: selectedFeedback.id,
        title: selectedFeedback.title,
        rating: feedbackRating,
        comment: feedbackComment,
        createdAt: serverTimestamp(),
        memberId: selectedFeedback.memberId || null,
      });

      // Delete the original feedback request document
      if (selectedFeedback.id) {
        const feedbackRequestRef = doc(db, "feedbackToAthlete", selectedFeedback.id);
        await deleteDoc(feedbackRequestRef);
      }

      // Send notification to the member who requested feedback
      if (selectedFeedback.memberId) {
        await addDoc(collection(db, "notifications"), {
          type: "feedback",
          title: "Feedback Received",
          message: `${getDisplayName(profileData.firstName, profileData.lastName)} has provided feedback on your submission: "${selectedFeedback.title}".`,
          recipientId: selectedFeedback.memberId,
          senderId: user.uid,
          senderName: getDisplayName(profileData.firstName, profileData.lastName),
          priority: "medium",
          category: "Performance Feedback",
          actionType: "view_feedback",
          actionUrl: `/member-feedback?id=${docRef.id}`,
          metadata: {
            feedbackId: docRef.id,
            rating: feedbackRating,
            contentType: "submission",
            feedbackPreview: feedbackComment.substring(0, 100) + (feedbackComment.length > 100 ? "..." : "")
          },
          createdAt: serverTimestamp(),
          read: false
        });
      }

      setShowCompleteFeedbackModal(false);
      setSelectedFeedback(null);
      setFeedbackRating(0);
      setFeedbackComment("");
      Alert.alert('Success', 'Feedback submitted successfully!');
    } catch (error) {
      console.error("Error completing feedback:", error);
      Alert.alert('Error', 'Failed to complete feedback. Please try again.');
    } finally {
      setIsCompletingFeedback(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Refresh will be handled by the useEffect listeners
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // Render stat cards
  const renderStatsCards = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <MessageSquare size={20} color="#6B7280" />
          </View>
          <Text style={styles.statNumber}>{requestedFeedback.length + givenFeedback.length}</Text>
          <Text style={styles.statLabel}>All feedback</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#DBEAFE' }]}>
            <Users size={20} color="#3B82F6" />
          </View>
          <Text style={styles.statNumber}>{requestedFeedback.length}</Text>
          <Text style={styles.statLabel}>From subscribers</Text>
        </View>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#FEF3C7' }]}>
            <Star size={20} color="#F59E0B" />
          </View>
          <Text style={styles.statNumber}>4.6</Text>
          <Text style={styles.statLabel}>Star rating</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#D1FAE5' }]}>
            <BarChart3 size={20} color="#10B981" />
          </View>
          <Text style={styles.statNumber}>78%</Text>
          <Text style={styles.statLabel}>Response rate</Text>
        </View>
      </View>
    </View>
  );

  // Render tabs
  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'requested' && styles.activeTab]}
        onPress={() => setActiveTab('requested')}
      >
        <Users size={16} color={activeTab === 'requested' ? '#3B82F6' : '#6B7280'} />
        <Text style={[styles.tabText, activeTab === 'requested' && styles.activeTabText]}>
          Requested ({requestedFeedback.length})
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'given' && styles.activeTab]}
        onPress={() => setActiveTab('given')}
      >
        <Star size={16} color={activeTab === 'given' ? '#3B82F6' : '#6B7280'} />
        <Text style={[styles.tabText, activeTab === 'given' && styles.activeTabText]}>
          Given ({givenFeedback.length})
        </Text>
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.tab, activeTab === 'platform' && styles.activeTab]}
        onPress={() => setActiveTab('platform')}
      >
        <Plus size={16} color={activeTab === 'platform' ? '#3B82F6' : '#6B7280'} />
        <Text style={[styles.tabText, activeTab === 'platform' && styles.activeTabText]}>
          Platform Feedback
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Render requested feedback tab
  const renderRequestedFeedback = () => (
    <View style={styles.tabContent}>
      {requestedFeedback.length > 0 ? (
        requestedFeedback.map((request) => (
          <View key={request.id} style={styles.feedbackCard}>
            <View style={styles.feedbackHeader}>
              <Text style={styles.feedbackTitle}>{request.title}</Text>
              <Text style={styles.feedbackTime}>
                {request.createdAt ? new Date(request.createdAt.seconds * 1000).toLocaleDateString() : ''}
              </Text>
            </View>
            <Text style={styles.feedbackMessage}>{request.message}</Text>
            
            {request.videoUrl && (
              <View style={styles.videoContainer}>
                <View style={styles.videoPlaceholder}>
                  <Text style={styles.videoText}>Video Content Available</Text>
                </View>
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.completeFeedbackButton}
              onPress={() => handleOpenCompleteFeedback(request)}
            >
              <Text style={styles.completeFeedbackButtonText}>Complete Feedback</Text>
            </TouchableOpacity>
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Users size={64} color="#D1D5DB" />
          <Text style={styles.emptyStateTitle}>No feedback requested</Text>
          <Text style={styles.emptyStateText}>
            Start requesting feedback from your subscribers to improve your content.
          </Text>
        </View>
      )}
    </View>
  );

  // Render given feedback tab
  const renderGivenFeedback = () => (
    <View style={styles.tabContent}>
      {givenFeedback.length > 0 ? (
        givenFeedback.map((feedback) => (
          <View key={feedback.id} style={styles.feedbackCard}>
            <View style={styles.feedbackHeader}>
              <View style={styles.titleRow}>
                <Text style={styles.feedbackTitle}>{feedback.title}</Text>
                <View style={styles.givenBadge}>
                  <Text style={styles.givenBadgeText}>Given</Text>
                </View>
              </View>
              <Text style={styles.feedbackTime}>
                {feedback.createdAt ? new Date(feedback.createdAt.seconds * 1000).toLocaleDateString() : ''}
              </Text>
            </View>
            
            <View style={styles.ratingContainer}>
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  color={i < feedback.rating ? "#F59E0B" : "#D1D5DB"}
                  fill={i < feedback.rating ? "#F59E0B" : "transparent"}
                />
              ))}
              <Text style={styles.ratingText}>({feedback.rating}/5)</Text>
            </View>
            
            <Text style={styles.feedbackComment}>{feedback.comment}</Text>
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Star size={64} color="#D1D5DB" />
          <Text style={styles.emptyStateTitle}>No feedback given yet</Text>
          <Text style={styles.emptyStateText}>
            Feedback you've given to other creators will appear here.
          </Text>
        </View>
      )}
    </View>
  );

  // Render platform feedback tab
  const renderPlatformFeedback = () => (
    <View style={styles.tabContent}>
      <TouchableOpacity 
        style={styles.submitFeedbackButton}
        onPress={() => setShowPlatformFeedbackModal(true)}
      >
        <Plus size={20} color="white" />
        <Text style={styles.submitFeedbackButtonText}>Submit Platform Feedback</Text>
      </TouchableOpacity>
      
      <View style={styles.emptyState}>
        <MessageSquare size={64} color="#D1D5DB" />
        <Text style={styles.emptyStateTitle}>No platform feedback submitted yet</Text>
        <Text style={styles.emptyStateText}>
          Your feedback history will appear here once you submit feedback.
        </Text>
      </View>
    </View>
  );

  // Render feedback type selector
  const renderTypeSelector = () => (
    <Modal visible={showTypeSelector} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.typeSelectorContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Feedback Type</Text>
            <TouchableOpacity onPress={() => setShowTypeSelector(false)}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          {['bug', 'feature', 'suggestion', 'complaint', 'compliment', 'other'].map((type) => (
            <TouchableOpacity
              key={type}
              style={styles.typeOption}
              onPress={() => {
                setPlatformFeedbackType(type);
                setShowTypeSelector(false);
              }}
            >
              <Text style={styles.typeOptionText}>
                {type === 'bug' ? 'Bug Report' :
                 type === 'feature' ? 'Feature Request' :
                 type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );

  // Render complete feedback modal
  const renderCompleteFeedbackModal = () => (
    <Modal visible={showCompleteFeedbackModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Complete Feedback</Text>
            <TouchableOpacity onPress={() => setShowCompleteFeedbackModal(false)}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          {selectedFeedback && (
            <>
              <Text style={styles.modalSubtitle}>{selectedFeedback.title}</Text>
              <Text style={styles.modalDescription}>{selectedFeedback.message}</Text>
              
              <Text style={styles.sectionLabel}>Rate this content</Text>
              <View style={styles.ratingSelector}>
                {[1, 2, 3, 4, 5].map((rating) => (
                  <TouchableOpacity
                    key={rating}
                    onPress={() => setFeedbackRating(rating)}
                    style={styles.starButton}
                  >
                    <Star
                      size={32}
                      color={rating <= feedbackRating ? "#F59E0B" : "#D1D5DB"}
                      fill={rating <= feedbackRating ? "#F59E0B" : "transparent"}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              
              <Text style={styles.sectionLabel}>Additional Comments (Optional)</Text>
              <TextInput
                style={styles.commentInput}
                value={feedbackComment}
                onChangeText={setFeedbackComment}
                placeholder="Share your thoughts about this content..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (feedbackRating === 0 || isCompletingFeedback) && styles.submitButtonDisabled
                ]}
                onPress={handleCompleteFeedback}
                disabled={feedbackRating === 0 || isCompletingFeedback}
              >
                {isCompletingFeedback ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Send size={16} color="white" />
                    <Text style={styles.submitButtonText}>Submit Feedback</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  // Render platform feedback modal
  const renderPlatformFeedbackModal = () => (
    <Modal visible={showPlatformFeedbackModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Submit Platform Feedback</Text>
            <TouchableOpacity onPress={() => setShowPlatformFeedbackModal(false)}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.sectionLabel}>Feedback Type</Text>
          <TouchableOpacity
            style={styles.typeSelector}
            onPress={() => setShowTypeSelector(true)}
          >
            <Text style={[styles.typeSelectorText, !platformFeedbackType && styles.placeholderText]}>
              {platformFeedbackType ? 
                (platformFeedbackType === 'bug' ? 'Bug Report' :
                 platformFeedbackType === 'feature' ? 'Feature Request' :
                 platformFeedbackType.charAt(0).toUpperCase() + platformFeedbackType.slice(1)) :
                'Select feedback type'}
            </Text>
          </TouchableOpacity>
          
          <Text style={styles.sectionLabel}>Title</Text>
          <TextInput
            style={styles.titleInput}
            value={platformFeedbackTitle}
            onChangeText={setPlatformFeedbackTitle}
            placeholder="Brief description of your feedback"
          />
          
          <Text style={styles.sectionLabel}>Message</Text>
          <TextInput
            style={styles.messageInput}
            value={platformFeedbackMessage}
            onChangeText={setPlatformFeedbackMessage}
            placeholder="Please provide detailed feedback..."
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
          <Text style={styles.characterCount}>{platformFeedbackMessage.length}/1000 characters</Text>
          
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!platformFeedbackType || !platformFeedbackTitle || !platformFeedbackMessage || isSubmitting) && 
              styles.submitButtonDisabled
            ]}
            onPress={handleSubmitPlatformFeedback}
            disabled={!platformFeedbackType || !platformFeedbackTitle || !platformFeedbackMessage || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Send size={16} color="white" />
                <Text style={styles.submitButtonText}>Submit Feedback</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerTitleContainer}>
            <View style={styles.headerIcon}>
              <MessageSquare size={24} color="white" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Feedback Center</Text>
              <Text style={styles.headerSubtitle}>Request feedback from subscribers and give testimonials</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={16} color="#3B82F6" />
          <Text style={styles.filterButtonText}>Filter</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.content} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Stats Cards */}
          {renderStatsCards()}
          
          {/* Tabs */}
          {renderTabs()}
          
          {/* Tab Content */}
          {activeTab === 'requested' && renderRequestedFeedback()}
          {activeTab === 'given' && renderGivenFeedback()}
          {activeTab === 'platform' && renderPlatformFeedback()}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={handleHomePress}>
          <Home size={20} color="#666" />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleContentPress}>
          <FileText size={20} color="#666" />
          <Text style={styles.navLabel}>Content</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleFeedbackPress}>
          <MessageSquare size={20} color="#4a90e2" />
          <Text style={[styles.navLabel, styles.navActive]}>Feedback</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <MessageCircle size={20} color="#666" />
          <Text style={styles.navLabel}>Messages</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/notifications-athlete')}>
          <Bell size={20} color="#666" />
          <Text style={styles.navLabel}>Notifications</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleProfilePress}>
          <User size={20} color="#666" />
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      {renderCompleteFeedbackModal()}
      {renderPlatformFeedbackModal()}
      {renderTypeSelector()}
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
    paddingVertical: 16,
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
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  filterButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  statsContainer: {
    padding: 16,
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#EBF8FF',
  },
  tabText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  tabContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  feedbackCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  feedbackHeader: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  feedbackTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  feedbackMessage: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  videoContainer: {
    marginBottom: 12,
  },
  videoPlaceholder: {
    height: 120,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoText: {
    color: '#6B7280',
    fontSize: 14,
  },
  completeFeedbackButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  completeFeedbackButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  givenBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  givenBadgeText: {
    color: '#065F46',
    fontSize: 12,
    fontWeight: '600',
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
    marginLeft: 8,
  },
  feedbackComment: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  submitFeedbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 24,
    gap: 8,
  },
  submitFeedbackButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
    lineHeight: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    marginTop: 16,
  },
  ratingSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  starButton: {
    padding: 4,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    marginBottom: 24,
  },
  typeSelector: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  typeSelectorText: {
    fontSize: 14,
    color: '#1F2937',
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 16,
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 120,
    marginBottom: 8,
  },
  characterCount: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
    marginBottom: 24,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  typeSelectorContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxHeight: '60%',
  },
  typeOption: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  typeOptionText: {
    fontSize: 16,
    color: '#1F2937',
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