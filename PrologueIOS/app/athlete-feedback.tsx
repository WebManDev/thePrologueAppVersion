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
  ActivityIndicator,
  Modal,
  Platform,
} from "react-native";
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
  getDoc,
  deleteDoc,
  getDocs,
  where,
} from "firebase/firestore";
import { Star, CheckCircle, Clock, Plus, MessageSquare } from "lucide-react-native";

const TABS = [
  { key: "requested", label: "Requested" },
  { key: "given", label: "Given" },
  { key: "platform", label: "Platform Feedback" },
];

export default function AthleteFeedbackScreen() {
  const [profileData, setProfileData] = useState({ firstName: "", lastName: "", profileImageUrl: undefined });
  const [activeTab, setActiveTab] = useState("requested");
  const [requestedFeedback, setRequestedFeedback] = useState<Array<any>>([]);
  const [givenFeedback, setGivenFeedback] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [platformFeedbackType, setPlatformFeedbackType] = useState("");
  const [platformFeedbackTitle, setPlatformFeedbackTitle] = useState("");
  const [platformFeedbackMessage, setPlatformFeedbackMessage] = useState("");
  const [isSubmittingPlatform, setIsSubmittingPlatform] = useState(false);

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

  // Fetch feedback data
  useEffect(() => {
    if (!auth.currentUser) return;
    setLoading(true);
    const user = auth.currentUser;
    // Requested feedback
    const q1 = query(collection(db, "feedbackToAthlete"), where("athleteId", "==", user.uid));
    const unsubRequested = onSnapshot(q1, (snapshot) => {
      setRequestedFeedback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    // Given feedback
    const q2 = query(collection(db, "feedbackGiven"), where("athleteId", "==", user.uid));
    const unsubGiven = onSnapshot(q2, (snapshot) => {
      setGivenFeedback(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => {
      unsubRequested();
      unsubGiven();
    };
  }, []);

  // Filtered feedback
  const filteredRequestedFeedback = useMemo<Array<any>>(() => {
    if (!searchQuery) return requestedFeedback;
    return requestedFeedback.filter((req: any) =>
      req.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.message?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, requestedFeedback]);

  const filteredGivenFeedback = useMemo<Array<any>>(() => {
    if (!searchQuery) return givenFeedback;
    return givenFeedback.filter((fb: any) =>
      fb.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fb.comment?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, givenFeedback]);

  // Complete feedback
  const handleCompleteFeedback = (request: any) => {
    setSelectedRequest(request);
    setShowFeedbackModal(true);
  };

  const handleSubmitFeedback = async () => {
    if (!selectedRequest || feedbackRating === 0) return;
    const user = auth.currentUser;
    if (!user) return;
    try {
      // Save to feedbackGiven
      await addDoc(collection(db, "feedbackGiven"), {
        athleteId: user.uid,
        requestId: selectedRequest.id,
        title: selectedRequest.title,
        rating: feedbackRating,
        comment: feedbackComment,
        createdAt: serverTimestamp(),
      });
      // Delete original request
      await deleteDoc(doc(db, "feedbackToAthlete", selectedRequest.id));
      setShowFeedbackModal(false);
      setFeedbackRating(0);
      setFeedbackComment("");
      setSelectedRequest(null);
    } catch (error) {
      Alert.alert("Error", "Failed to submit feedback");
    }
  };

  // Platform feedback
  const handleSubmitPlatformFeedback = async () => {
    if (!platformFeedbackType || !platformFeedbackTitle || !platformFeedbackMessage) {
      Alert.alert("Please fill in all fields");
      return;
    }
    setIsSubmittingPlatform(true);
    try {
      await addDoc(collection(db, "platformFeedback"), {
        type: platformFeedbackType,
        title: platformFeedbackTitle,
        message: platformFeedbackMessage,
        userId: auth.currentUser?.uid,
        createdAt: serverTimestamp(),
      });
      setPlatformFeedbackType("");
      setPlatformFeedbackTitle("");
      setPlatformFeedbackMessage("");
      Alert.alert("Success", "Platform feedback submitted!");
    } catch (error) {
      Alert.alert("Error", "Failed to submit platform feedback");
    } finally {
      setIsSubmittingPlatform(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={{ color: '#6B7280', marginTop: 12 }}>Loading feedback...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Feedback</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search feedback..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      {/* Tabs */}
      <View style={styles.tabsRow}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabBtn, activeTab === tab.key && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabBtnText, activeTab === tab.key && styles.tabBtnTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView style={styles.scroll}>
        {/* Requested Feedback */}
        {activeTab === "requested" && (
          <View style={styles.tabContent}>
            {filteredRequestedFeedback.length === 0 ? (
              <View style={styles.emptyState}>
                <MessageSquare size={48} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>No feedback requests</Text>
                <Text style={styles.emptyDesc}>You haven't requested any feedback yet.</Text>
              </View>
            ) : (
              filteredRequestedFeedback.map((request: any) => (
                <View key={request.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{request.title}</Text>
                    <Text style={styles.cardCategory}>{request.category || 'General'}</Text>
                  </View>
                  <Text style={styles.cardDesc}>{request.message}</Text>
                  {request.videoUrl && (
                    <View style={styles.videoContainer}>
                      <Text style={styles.videoLabel}>Video:</Text>
                      <Text style={styles.videoUrl}>{request.videoUrl}</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.completeBtn}
                    onPress={() => handleCompleteFeedback(request)}
                  >
                    <Text style={styles.completeBtnText}>Complete Feedback</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}
        {/* Given Feedback */}
        {activeTab === "given" && (
          <View style={styles.tabContent}>
            {filteredGivenFeedback.length === 0 ? (
              <View style={styles.emptyState}>
                <CheckCircle size={48} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>No completed feedback</Text>
                <Text style={styles.emptyDesc}>You haven't completed any feedback yet.</Text>
              </View>
            ) : (
              filteredGivenFeedback.map((feedback: any) => (
                <View key={feedback.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{feedback.title}</Text>
                    <Text style={styles.cardCategory}>{feedback.category || 'General'}</Text>
                  </View>
                  <Text style={styles.cardDesc}>{feedback.comment}</Text>
                  <View style={styles.ratingRow}>
                    {[1,2,3,4,5].map(star => (
                      <Star
                        key={star}
                        size={20}
                        color={star <= (feedback.rating || 0) ? '#FBBF24' : '#D1D5DB'}
                        fill={star <= (feedback.rating || 0) ? '#FBBF24' : 'none'}
                      />
                    ))}
                    <Text style={styles.ratingText}>{feedback.rating}/5</Text>
                  </View>
                  <Text style={styles.completedText}>
                    Completed on {feedback.createdAt && feedback.createdAt.seconds ? new Date(feedback.createdAt.seconds * 1000).toLocaleDateString() : 'Unknown'}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}
        {/* Platform Feedback */}
        {activeTab === "platform" && (
          <View style={styles.tabContent}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Platform Feedback</Text>
              <Text style={styles.cardDesc}>Share feedback about the PROLOGUE platform</Text>
              <Text style={styles.label}>Feedback Type</Text>
              <TextInput
                style={styles.input}
                placeholder="Type (bug, feature, improvement, general)"
                value={platformFeedbackType}
                onChangeText={setPlatformFeedbackType}
              />
              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="Brief title for your feedback"
                value={platformFeedbackTitle}
                onChangeText={setPlatformFeedbackTitle}
              />
              <Text style={styles.label}>Message</Text>
              <TextInput
                style={[styles.input, { minHeight: 80 }]}
                placeholder="Describe your feedback in detail..."
                value={platformFeedbackMessage}
                onChangeText={setPlatformFeedbackMessage}
                multiline
              />
              <TouchableOpacity
                style={[styles.completeBtn, (!platformFeedbackType || !platformFeedbackTitle || !platformFeedbackMessage) && { backgroundColor: '#9CA3AF' }]}
                onPress={handleSubmitPlatformFeedback}
                disabled={!platformFeedbackType || !platformFeedbackTitle || !platformFeedbackMessage || isSubmittingPlatform}
              >
                <Text style={styles.completeBtnText}>{isSubmittingPlatform ? 'Submitting...' : 'Submit Feedback'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
      {/* Feedback Modal */}
      <Modal visible={showFeedbackModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Complete Feedback</Text>
            <Text style={styles.label}>Rating</Text>
            <View style={styles.ratingRow}>
              {[1,2,3,4,5].map(star => (
                <TouchableOpacity key={star} onPress={() => setFeedbackRating(star)}>
                  <Star
                    size={28}
                    color={star <= feedbackRating ? '#FBBF24' : '#D1D5DB'}
                    fill={star <= feedbackRating ? '#FBBF24' : 'none'}
                  />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.label}>Comment</Text>
            <TextInput
              style={[styles.input, { minHeight: 60 }]}
              placeholder="Write your feedback..."
              value={feedbackComment}
              onChangeText={setFeedbackComment}
              multiline
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
              <TouchableOpacity style={[styles.completeBtn, { marginRight: 8, backgroundColor: '#9CA3AF' }]} onPress={() => setShowFeedbackModal(false)}>
                <Text style={styles.completeBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.completeBtn} onPress={handleSubmitFeedback}>
                <Text style={styles.completeBtnText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  header: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1F2937', marginBottom: 8 },
  searchInput: { backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, fontSize: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  tabsRow: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  tabBtnActive: { borderBottomWidth: 3, borderBottomColor: '#3B82F6' },
  tabBtnText: { fontSize: 16, color: '#6B7280', fontWeight: '500' },
  tabBtnTextActive: { color: '#3B82F6', fontWeight: 'bold' },
  scroll: { flex: 1 },
  tabContent: { padding: 16 },
  emptyState: { alignItems: 'center', marginTop: 48 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginTop: 16 },
  emptyDesc: { fontSize: 14, color: '#6B7280', marginTop: 4, textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2, borderWidth: 1, borderColor: '#E5E7EB' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  cardCategory: { fontSize: 14, color: '#3B82F6', fontWeight: '600' },
  cardDesc: { fontSize: 15, color: '#374151', marginBottom: 8 },
  videoContainer: { marginTop: 8, marginBottom: 8 },
  videoLabel: { fontSize: 14, color: '#6B7280' },
  videoUrl: { fontSize: 14, color: '#3B82F6' },
  completeBtn: { backgroundColor: '#3B82F6', borderRadius: 12, paddingVertical: 10, paddingHorizontal: 24, alignItems: 'center', marginTop: 12 },
  completeBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 4 },
  ratingText: { fontSize: 16, color: '#FBBF24', marginLeft: 8 },
  completedText: { fontSize: 13, color: '#6B7280', marginTop: 8 },
  label: { fontSize: 14, fontWeight: '600', color: '#1F2937', marginTop: 10, marginBottom: 4 },
  input: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, fontSize: 16, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: '#fff', borderRadius: 20, padding: 24, width: 320, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 16, elevation: 10 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginBottom: 12, textAlign: 'center' },
}); 