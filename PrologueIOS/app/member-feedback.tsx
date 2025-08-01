import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, Pressable,
  TextInput, Alert, ActivityIndicator, FlatList, RefreshControl
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, updateDoc, arrayUnion, arrayRemove, deleteDoc, where, getDocs, Timestamp } from 'firebase/firestore';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { Home, BookOpen, Eye, MessageSquare, MessageCircle, User, Search, Settings, LogOut, ChevronDown, Heart, MessageCircle as MessageCircleIcon, Share, MoreHorizontal, Edit, Trash2, Camera, Video, Target, Crown, Zap, Bookmark, Send, Repeat2, X, Plus, Star, Clock, CheckCircle, AlertCircle, Filter, MapPin, Calendar, Upload, FileText, Users, ThumbsUp, ThumbsDown } from 'lucide-react-native';
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

interface FeedbackRequest {
  id: string;
  coach: {
    name: string;
    sport: string;
    rating: number;
    location: string;
    avatar: string;
    verified: boolean;
    experience: string;
    specialties: string[];
  };
  session: {
    title: string;
    description: string;
    duration: number;
    type: "technique" | "strategy" | "mental" | "fitness";
    scheduledDate?: string;
  };
  status: "pending" | "accepted" | "completed" | "declined";
  requestedDate: string;
  priority: "low" | "medium" | "high";
  notes?: string;
}

interface ReceivedFeedback {
  id: string;
  requestId: string;
  title: string;
  rating: number;
  comment: string;
  createdAt?: { seconds: number };
  athleteId?: string;
}

export default function MemberFeedbackScreen() {
  const [memberData, setMemberData] = useState<MemberData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [showPlatformFeedbackDialog, setShowPlatformFeedbackDialog] = useState(false);
  const [requestFilter, setRequestFilter] = useState("all");
  const [coachFilter, setCoachFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [subscribedAthletes, setSubscribedAthletes] = useState<any[]>([]);
  const [loadingSubscribed, setLoadingSubscribed] = useState(true);
  const [receivedFeedback, setReceivedFeedback] = useState<ReceivedFeedback[]>([]);
  const [sentFeedback, setSentFeedback] = useState<any[]>([]);
  const [platformFeedbackHistory, setPlatformFeedbackHistory] = useState<any[]>([]);
  const [loadingFeedbackHistory, setLoadingFeedbackHistory] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  // Request feedback form state
  const [requestForm, setRequestForm] = useState({
    coachId: "",
    sessionTitle: "",
    sessionDescription: "",
    sessionType: "technique" as const,
    duration: 60,
    priority: "medium" as const,
    notes: "",
    preferredDate: "",
  });

  // Platform feedback form state
  const [platformFeedbackType, setPlatformFeedbackType] = useState("");
  const [platformFeedbackTitle, setPlatformFeedbackTitle] = useState("");
  const [platformFeedbackMessage, setPlatformFeedbackMessage] = useState("");

  // Mock feedback requests data
  const [feedbackRequests, setFeedbackRequests] = useState<FeedbackRequest[]>([
    {
      id: "1",
      coach: {
        name: "Sarah Martinez",
        sport: "Tennis Coach",
        rating: 4.9,
        location: "Los Angeles, CA",
        avatar: "/placeholder.svg?height=60&width=60",
        verified: true,
        experience: "8+ years",
        specialties: ["Serve Technique", "Mental Game", "Tournament Prep"],
      },
      session: {
        title: "Advanced Serve Technique",
        description: "Focus on improving serve consistency and power through proper form and follow-through",
        duration: 90,
        type: "technique",
        scheduledDate: "2024-01-20",
      },
      status: "pending",
      requestedDate: "2024-01-15",
      priority: "high",
      notes: "Need help with serve consistency before upcoming tournament",
    },
    {
      id: "2",
      coach: {
        name: "Mike Chen",
        sport: "Fitness Coach",
        rating: 4.7,
        location: "San Diego, CA",
        avatar: "/placeholder.svg?height=60&width=60",
        verified: false,
        experience: "5+ years",
        specialties: ["Strength Training", "Conditioning", "Injury Prevention"],
      },
      session: {
        title: "Athletic Conditioning Program",
        description: "Develop sport-specific fitness and endurance training plan",
        duration: 60,
        type: "fitness",
        scheduledDate: "2024-01-18",
      },
      status: "accepted",
      requestedDate: "2024-01-12",
      priority: "medium",
    },
    {
      id: "3",
      coach: {
        name: "Emma Wilson",
        sport: "Sports Psychologist",
        rating: 4.8,
        location: "San Francisco, CA",
        avatar: "/placeholder.svg?height=60&width=60",
        verified: true,
        experience: "10+ years",
        specialties: ["Mental Performance", "Competition Anxiety", "Focus Training"],
      },
      session: {
        title: "Pre-Competition Mental Preparation",
        description: "Strategies for managing competition nerves and maintaining focus",
        duration: 45,
        type: "mental",
      },
      status: "completed",
      requestedDate: "2024-01-10",
      priority: "high",
      notes: "Excellent session on visualization techniques",
    },
  ]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const memberDoc = await getDoc(doc(db, 'members', user.uid));
          if (memberDoc.exists()) {
            setMemberData(memberDoc.data() as MemberData);
          }
          fetchSubscribedAthletes(user.uid);
          fetchFeedbackData(user.uid);
          fetchPlatformFeedbackHistory(user.uid);
        } catch (error) {
          console.error('Error fetching member data:', error);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchSubscribedAthletes = async (uid: string) => {
    setLoadingSubscribed(true);
    try {
      const memberDoc = await getDoc(doc(db, 'members', uid));
      const profileData = memberDoc.data();
      const subscriptionsObj = profileData?.subscriptions || {};
      const activeAthleteIds = Object.keys(subscriptionsObj).filter(
        (athleteId) => subscriptionsObj[athleteId]?.status === "active"
      );
      
      if (activeAthleteIds.length === 0) {
        setSubscribedAthletes([]);
        return;
      }

      const athletes = [];
      for (const athleteId of activeAthleteIds) {
        const athleteDoc = await getDoc(doc(db, 'athletes', athleteId));
        if (athleteDoc.exists()) {
          athletes.push({ id: athleteId, ...athleteDoc.data() });
        }
      }
      setSubscribedAthletes(athletes);
    } catch (error) {
      console.error('Error fetching subscribed athletes:', error);
    } finally {
      setLoadingSubscribed(false);
    }
  };

  const fetchFeedbackData = async (uid: string) => {
    try {
      // Fetch feedback received
      const q = query(collection(db, "feedbackGiven"), where("memberId", "==", uid));
      const snapshot = await getDocs(q);
      setReceivedFeedback(snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          requestId: data.requestId || '',
          title: data.title || '',
          rating: data.rating || 0,
          comment: data.comment || '',
          createdAt: data.createdAt,
          athleteId: data.athleteId || '',
        };
      }));

      // Fetch feedback sent to athletes
      const sentQuery = query(
        collection(db, "feedbackToAthlete"),
        where("memberId", "==", uid),
        orderBy("createdAt", "desc")
      );
      const sentSnapshot = await getDocs(sentQuery);
      setSentFeedback(sentSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));
    } catch (error) {
      console.error('Error fetching feedback data:', error);
    }
  };

  const fetchPlatformFeedbackHistory = async (uid: string) => {
    setLoadingFeedbackHistory(true);
    try {
      const q = query(
        collection(db, "platformFeedback"),
        where("userId", "==", uid),
        orderBy("createdAt", "desc")
      );
      const snapshot = await getDocs(q);
      setPlatformFeedbackHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching platform feedback history:', error);
    } finally {
      setLoadingFeedbackHistory(false);
    }
  };

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

  const handleSubmitFeedbackToAthlete = async () => {
    if (!requestForm.coachId) {
      Alert.alert("Error", "Please select an athlete to send feedback to.");
      return;
    }

    setIsSubmitting(true);
    const selectedAthleteData = subscribedAthletes.find((athlete) => athlete.id === requestForm.coachId);
    const memberId = auth.currentUser?.uid || null;
    const memberName = auth.currentUser?.displayName || "";
    let videoUrl = null;

    try {
      // Upload video if selected
      if (selectedFile) {
        try {
          const storage = getStorage();
          const filePath = `feedback-videos/${memberId}/${Date.now()}_${selectedFile.name}`;
          const fileRef = ref(storage, filePath);
          await uploadBytes(fileRef, selectedFile);
          videoUrl = await getDownloadURL(fileRef);
        } catch (e) {
          console.error("Video upload failed:", e);
          Alert.alert("Warning", "Failed to upload video. Feedback will be sent without video.");
        }
      }

      await addDoc(collection(db, "feedbackToAthlete"), {
        athleteId: selectedAthleteData?.id,
        athleteName: selectedAthleteData?.name,
        memberId,
        memberName,
        title: requestForm.sessionTitle,
        message: requestForm.sessionDescription,
        videoUrl,
        createdAt: Timestamp.now(),
      });

      // Create notification for the athlete
      await addDoc(collection(db, "notifications"), {
        userId: selectedAthleteData?.id,
        type: "feedback",
        title: requestForm.sessionTitle,
        message: requestForm.sessionDescription,
        from: memberName,
        createdAt: Timestamp.now(),
        read: false,
      });
      
      // Reset form
      setRequestForm({
        coachId: "",
        sessionTitle: "",
        sessionDescription: "",
        sessionType: "technique",
        duration: 60,
        priority: "medium",
        notes: "",
        preferredDate: "",
      });
      setSelectedFile(null);
      setIsSubmitting(false);
      
      Alert.alert(
        "Success!",
        `Feedback submitted successfully to ${selectedAthleteData?.name}!${videoUrl ? " Video uploaded." : ""}`
      );
    } catch (e) {
      console.error("Feedback submission error:", e);
      setIsSubmitting(false);
      Alert.alert("Error", "Failed to submit feedback. Please try again.");
    }
  };

  const handleSubmitPlatformFeedback = async () => {
    if (!platformFeedbackType || !platformFeedbackTitle || !platformFeedbackMessage) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      await addDoc(collection(db, "platformFeedback"), {
        type: platformFeedbackType,
        title: platformFeedbackTitle,
        message: platformFeedbackMessage,
        createdAt: Timestamp.now(),
        userId: auth.currentUser?.uid || null,
      });

      // Reset form
      setPlatformFeedbackType("");
      setPlatformFeedbackTitle("");
      setPlatformFeedbackMessage("");
      setIsSubmitting(false);

      Alert.alert("Success!", "Platform feedback submitted successfully!");
    } catch (e) {
      console.error("Feedback submission error:", e);
      setIsSubmitting(false);
      Alert.alert("Error", "Failed to submit feedback. Please try again.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return { bg: "#fef3c7", text: "#d97706" };
      case "accepted":
        return { bg: "#dbeafe", text: "#1d4ed8" };
      case "completed":
        return { bg: "#dcfce7", text: "#166534" };
      case "declined":
        return { bg: "#fee2e2", text: "#dc2626" };
      default:
        return { bg: "#f3f4f6", text: "#374151" };
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return { bg: "#fee2e2", text: "#dc2626" };
      case "medium":
        return { bg: "#fed7aa", text: "#ea580c" };
      case "low":
        return { bg: "#dcfce7", text: "#166534" };
      default:
        return { bg: "#f3f4f6", text: "#374151" };
    }
  };

  const getTimeAgo = (timestamp: any) => {
    if (!timestamp) return "Unknown time";
    
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInWeeks = Math.floor(diffInDays / 7);
    
    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "1 day ago";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInWeeks === 1) return "1 week ago";
    if (diffInWeeks < 4) return `${diffInWeeks} weeks ago`;
    return date.toLocaleDateString();
  };

  const filteredRequests = feedbackRequests.filter((request) => {
    const matchesRequestFilter = requestFilter === "all" || request.status === requestFilter;
    const matchesCoachFilter =
      coachFilter === "all" || request.coach.sport.toLowerCase().includes(coachFilter.toLowerCase());
    const matchesSearch =
      searchQuery === "" ||
      request.coach.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.coach.sport.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesRequestFilter && matchesCoachFilter && matchesSearch;
  });

  const onRefresh = async () => {
    setRefreshing(true);
    const user = auth.currentUser;
    if (user) {
      await fetchFeedbackData(user.uid);
      await fetchPlatformFeedbackHistory(user.uid);
    }
    setTimeout(() => setRefreshing(false), 1000);
  };

  const initials = getInitials(memberData?.firstName, memberData?.lastName);
  const displayName = memberData?.firstName && memberData?.lastName ? `${memberData.firstName} ${memberData.lastName}` : 'Member';

  const renderFeedbackRequest = ({ item }: { item: FeedbackRequest }) => {
    const statusColors = getStatusColor(item.status);
    const priorityColors = getPriorityColor(item.priority);

    return (
      <View key={item.id} style={styles.feedbackCard}>
        <View style={styles.feedbackHeader}>
          <View style={styles.coachInfo}>
            <View style={styles.coachAvatar}>
              <User size={24} color="#9ca3af" />
            </View>
            <View style={styles.coachDetails}>
              <Text style={styles.coachName}>{item.coach.name}</Text>
              <Text style={styles.coachSport}>{item.coach.sport}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
            <Text style={[styles.statusText, { color: statusColors.text }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.sessionDetails}>
          <Text style={styles.sessionTitle}>{item.session.title}</Text>
          <Text style={styles.sessionDescription}>{item.session.description}</Text>

          <View style={styles.sessionMeta}>
            <View style={styles.metaItem}>
              <Clock size={16} color="#6b7280" />
              <Text style={styles.metaText}>{item.session.duration} minutes</Text>
            </View>
            <View style={styles.metaItem}>
              <Calendar size={16} color="#6b7280" />
              <Text style={styles.metaText}>
                {item.session.scheduledDate
                  ? `Scheduled: ${new Date(item.session.scheduledDate).toLocaleDateString()}`
                  : `Requested: ${new Date(item.requestedDate).toLocaleDateString()}`}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <MapPin size={16} color="#6b7280" />
              <Text style={styles.metaText}>{item.coach.location}</Text>
            </View>
          </View>
        </View>

        <View style={styles.coachStats}>
          <View style={styles.statItem}>
            <Star size={16} color="#fbbf24" />
            <Text style={styles.statText}>{item.coach.rating}/5.0</Text>
          </View>
          <Text style={styles.experienceText}>{item.coach.experience}</Text>
        </View>

        <View style={styles.actionButtons}>
          {item.status === "pending" && (
            <>
              <TouchableOpacity style={styles.actionButton}>
                <Text style={styles.actionButtonText}>Edit Request</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          )}
          {item.status === "accepted" && (
            <TouchableOpacity style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Join Session</Text>
            </TouchableOpacity>
          )}
          {item.status === "completed" && (
            <TouchableOpacity style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>View Feedback</Text>
            </TouchableOpacity>
          )}
        </View>

        {item.notes && (
          <View style={styles.notesContainer}>
            <Text style={styles.notesText}>
              <Text style={styles.notesLabel}>Notes:</Text> {item.notes}
            </Text>
          </View>
        )}
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
        <TouchableOpacity onPress={() => router.push('/member-feedback')} style={styles.logoRow}>
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

      {/* Request Feedback Modal */}
      <Modal
        visible={showRequestDialog}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRequestDialog(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send Media for Feedback</Text>
              <TouchableOpacity onPress={() => setShowRequestDialog(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Select Creator</Text>
                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerPlaceholder}>Choose a subscribed creator</Text>
                </View>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Upload Media</Text>
                <TouchableOpacity style={styles.uploadContainer}>
                  <Upload size={24} color="#9ca3af" />
                  <Text style={styles.uploadText}>Upload videos or images</Text>
                  <Text style={styles.uploadSubtext}>MP4, MOV, JPG, PNG up to 50MB each</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>What would you like feedback on?</Text>
                <TextInput
                  style={styles.textArea}
                  value={requestForm.sessionDescription}
                  onChangeText={(text) => setRequestForm({ ...requestForm, sessionDescription: text })}
                  placeholder="Describe what specific feedback you're looking for..."
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Urgency</Text>
                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerPlaceholder}>Select urgency level</Text>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowRequestDialog(false)}
              >
                <X size={16} color="#666" />
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.modalSubmitButton,
                  (!requestForm.coachId || !requestForm.sessionDescription || isSubmitting) && 
                  styles.modalSubmitButtonDisabled
                ]}
                onPress={handleSubmitFeedbackToAthlete}
                disabled={!requestForm.coachId || !requestForm.sessionDescription || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Send size={16} color="#fff" />
                    <Text style={styles.modalSubmitButtonText}>Send for Feedback</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Platform Feedback Modal */}
      <Modal
        visible={showPlatformFeedbackDialog}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPlatformFeedbackDialog(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Platform Feedback</Text>
              <TouchableOpacity onPress={() => setShowPlatformFeedbackDialog(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Feedback Type</Text>
                <TextInput
                  style={styles.textInput}
                  value={platformFeedbackType}
                  onChangeText={setPlatformFeedbackType}
                  placeholder="e.g., Bug Report, Feature Request, General Feedback"
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Title</Text>
                <TextInput
                  style={styles.textInput}
                  value={platformFeedbackTitle}
                  onChangeText={setPlatformFeedbackTitle}
                  placeholder="Brief title for your feedback"
                />
              </View>

              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Message</Text>
                <TextInput
                  style={styles.textArea}
                  value={platformFeedbackMessage}
                  onChangeText={setPlatformFeedbackMessage}
                  placeholder="Describe your feedback in detail..."
                  multiline
                  numberOfLines={6}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => setShowPlatformFeedbackDialog(false)}
              >
                <X size={16} color="#666" />
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.modalSubmitButton,
                  (!platformFeedbackType || !platformFeedbackTitle || !platformFeedbackMessage || isSubmitting) && 
                  styles.modalSubmitButtonDisabled
                ]}
                onPress={handleSubmitPlatformFeedback}
                disabled={!platformFeedbackType || !platformFeedbackTitle || !platformFeedbackMessage || isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Send size={16} color="#fff" />
                    <Text style={styles.modalSubmitButtonText}>Submit Feedback</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Main Content */}
      <ScrollView 
        style={styles.mainContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Filters and Search */}
        <View style={styles.filtersSection}>
          <View style={styles.searchContainer}>
            <Search size={20} color="#9ca3af" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search coaches or sessions..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <View style={styles.filterButtons}>
            <TouchableOpacity style={styles.filterButton}>
              <Filter size={16} color="#6b7280" />
              <Text style={styles.filterButtonText}>
                {requestFilter === "all" ? "All Requests" : requestFilter}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterButton}>
              <Star size={16} color="#6b7280" />
              <Text style={styles.filterButtonText}>
                {coachFilter === "all" ? "All Coaches" : coachFilter}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.requestButton}
            onPress={() => setShowRequestDialog(true)}
          >
            <Plus size={16} color="#fff" />
            <Text style={styles.requestButtonText}>Send Media for Feedback</Text>
          </TouchableOpacity>
        </View>

        {/* Feedback Requests List */}
        {filteredRequests.length === 0 ? (
          <View style={styles.emptyState}>
            <MessageSquare size={48} color="#9ca3af" />
            <Text style={styles.emptyStateTitle}>No feedback requests found</Text>
            <Text style={styles.emptyStateText}>
              {searchQuery || requestFilter !== "all" || coachFilter !== "all"
                ? "Try adjusting your filters or search terms"
                : "Start by requesting feedback from your coaches"}
            </Text>
            {!searchQuery && requestFilter === "all" && coachFilter === "all" && (
              <TouchableOpacity 
                style={styles.emptyStateButton}
                onPress={() => setShowRequestDialog(true)}
              >
                <Plus size={16} color="#fff" />
                <Text style={styles.emptyStateButtonText}>Request Your First Feedback</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.requestsList}>
            {filteredRequests.map((item) => renderFeedbackRequest({ item }))}
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/member-home')}>
          <Home size={22} color="#666" />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/member-training')}>
          <BookOpen size={22} color="#666" />
          <Text style={styles.navLabel}>Training</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => {}}>
          <Eye size={22} color="#666" />
          <Text style={styles.navLabel}>Browse</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => {}}>
          <MessageSquare size={22} color="#4a90e2" />
          <Text style={[styles.navLabel, styles.navActive]}>Feedback</Text>
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
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalBody: {
    padding: 20,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#f9fafb',
  },
  pickerPlaceholder: {
    fontSize: 16,
    color: '#9ca3af',
  },
  uploadContainer: {
    borderWidth: 2,
    borderColor: '#d1d5db',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 8,
  },
  uploadSubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  modalCancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  modalCancelButtonText: {
    fontSize: 16,
    color: '#6b7280',
  },
  modalSubmitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalSubmitButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  modalSubmitButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  filtersSection: {
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginBottom: 12,
  },
  searchIcon: {
    marginLeft: 12,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#fff',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#6b7280',
  },
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  requestButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 32,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  requestsList: {
    gap: 16,
  },
  feedbackCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  feedbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  coachInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  coachAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  coachDetails: {
    flex: 1,
  },
  coachName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 2,
  },
  coachSport: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  sessionDetails: {
    marginBottom: 12,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  sessionDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
  },
  sessionMeta: {
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 14,
    color: '#6b7280',
  },
  coachStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    color: '#6b7280',
  },
  experienceText: {
    fontSize: 14,
    color: '#6b7280',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  actionButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#6b7280',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#dc2626',
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  primaryButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  secondaryButtonText: {
    fontSize: 14,
    color: '#6b7280',
  },
  notesContainer: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#6b7280',
  },
  notesLabel: {
    fontWeight: '600',
    color: '#374151',
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