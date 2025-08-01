import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { auth, db } from '../firebaseConfig';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

interface MemberData {
  firstName: string;
  lastName: string;
  email: string;
  bio: string;
  sports: string[];
  goals: string[];
  experience: string;
  location: string;
  school: string;
  graduationYear: string;
  profilePhotoUrl: string;
  onboardingCompleted: boolean;
}

const sports = [
  'Basketball', 'Football', 'Soccer', 'Tennis', 'Swimming', 'Volleyball',
  'Track & Field', 'Golf', 'Baseball', 'Softball', 'Wrestling', 'Gymnastics',
  'Cross Country', 'Hockey', 'Lacrosse'
];

const goals = [
  'Improve Skills', 'Get Recruited', 'Win Championships', 'Stay Fit',
  'Learn New Techniques', 'Build Confidence', 'Make Team', 'Get Scholarship'
];

export default function MemberOnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [memberData, setMemberData] = useState<MemberData>({
    firstName: '',
    lastName: '',
    email: '',
    bio: '',
    sports: [],
    goals: [],
    experience: '',
    location: '',
    school: '',
    graduationYear: '',
    profilePhotoUrl: '',
    onboardingCompleted: false,
  });

  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'members', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setMemberData({
              firstName: data.firstName || '',
              lastName: data.lastName || '',
              email: data.email || user.email || '',
              bio: data.bio || '',
              sports: data.sports || [],
              goals: data.goals || [],
              experience: data.experience || '',
              location: data.location || '',
              school: data.school || '',
              graduationYear: data.graduationYear || '',
              profilePhotoUrl: data.profilePhotoUrl || '',
              onboardingCompleted: data.onboardingCompleted || false,
            });
          }
        } catch (error) {
          console.error('Error loading member data:', error);
        }
      } else {
        router.replace('/');
      }
    });

    return () => unsubscribe();
  }, []);

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      await updateDoc(doc(db, 'members', user.uid), {
        ...memberData,
        onboardingCompleted: true,
      });

      Alert.alert('Success', 'Profile completed! Welcome to PROLOGUE.');
      router.replace('/member-dashboard');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const toggleSport = (sport: string) => {
    setMemberData(prev => ({
      ...prev,
      sports: prev.sports.includes(sport)
        ? prev.sports.filter(s => s !== sport)
        : [...prev.sports, sport]
    }));
  };

  const toggleGoal = (goal: string) => {
    setMemberData(prev => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal]
    }));
  };

  const getProgressPercentage = () => {
    return (currentStep / 4) * 100;
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return memberData.firstName && memberData.lastName;
      case 2:
        return memberData.sports.length > 0;
      case 3:
        return memberData.goals.length > 0;
      case 4:
        return memberData.bio;
      default:
        return false;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Member Onboarding</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${getProgressPercentage()}%` }]} />
        </View>
        <Text style={styles.progressText}>Step {currentStep} of 4</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <View style={styles.stepIcon}>
                <Ionicons name="person" size={24} color="#3B82F6" />
              </View>
              <Text style={styles.stepTitle}>Tell us about yourself</Text>
              <Text style={styles.stepSubtitle}>Let's start with your basic information</Text>
            </View>

            <View style={styles.formSection}>
              <View style={styles.inputRow}>
                <View style={styles.inputField}>
                  <Text style={styles.label}>First Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={memberData.firstName}
                    onChangeText={(text) => setMemberData({ ...memberData, firstName: text })}
                    placeholder="Enter your first name"
                  />
                </View>
                <View style={styles.inputField}>
                  <Text style={styles.label}>Last Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={memberData.lastName}
                    onChangeText={(text) => setMemberData({ ...memberData, lastName: text })}
                    placeholder="Enter your last name"
                  />
                </View>
              </View>

              <View style={styles.inputField}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={memberData.email}
                  onChangeText={(text) => setMemberData({ ...memberData, email: text })}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputField}>
                <Text style={styles.label}>Location</Text>
                <TextInput
                  style={styles.input}
                  value={memberData.location}
                  onChangeText={(text) => setMemberData({ ...memberData, location: text })}
                  placeholder="City, State"
                />
              </View>

              <View style={styles.inputRow}>
                <View style={styles.inputField}>
                  <Text style={styles.label}>School</Text>
                  <TextInput
                    style={styles.input}
                    value={memberData.school}
                    onChangeText={(text) => setMemberData({ ...memberData, school: text })}
                    placeholder="Your school"
                  />
                </View>
                <View style={styles.inputField}>
                  <Text style={styles.label}>Graduation Year</Text>
                  <TextInput
                    style={styles.input}
                    value={memberData.graduationYear}
                    onChangeText={(text) => setMemberData({ ...memberData, graduationYear: text })}
                    placeholder="e.g., 2025"
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Step 2: Sports Selection */}
        {currentStep === 2 && (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <View style={styles.stepIcon}>
                <Ionicons name="basketball" size={24} color="#3B82F6" />
              </View>
              <Text style={styles.stepTitle}>What sports do you play?</Text>
              <Text style={styles.stepSubtitle}>Select all that apply</Text>
            </View>

            <View style={styles.sportsGrid}>
              {sports.map((sport) => (
                <TouchableOpacity
                  key={sport}
                  style={[
                    styles.sportCard,
                    memberData.sports.includes(sport) && styles.sportCardSelected
                  ]}
                  onPress={() => toggleSport(sport)}
                >
                  <Text style={[
                    styles.sportText,
                    memberData.sports.includes(sport) && styles.sportTextSelected
                  ]}>
                    {sport}
                  </Text>
                  {memberData.sports.includes(sport) && (
                    <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Step 3: Goals */}
        {currentStep === 3 && (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <View style={styles.stepIcon}>
                <Ionicons name="flag" size={24} color="#3B82F6" />
              </View>
              <Text style={styles.stepTitle}>What are your goals?</Text>
              <Text style={styles.stepSubtitle}>Select your primary objectives</Text>
            </View>

            <View style={styles.goalsGrid}>
              {goals.map((goal) => (
                <TouchableOpacity
                  key={goal}
                  style={[
                    styles.goalCard,
                    memberData.goals.includes(goal) && styles.goalCardSelected
                  ]}
                  onPress={() => toggleGoal(goal)}
                >
                  <Text style={[
                    styles.goalText,
                    memberData.goals.includes(goal) && styles.goalTextSelected
                  ]}>
                    {goal}
                  </Text>
                  {memberData.goals.includes(goal) && (
                    <Ionicons name="checkmark-circle" size={20} color="#3B82F6" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Step 4: Bio */}
        {currentStep === 4 && (
          <View style={styles.stepContent}>
            <View style={styles.stepHeader}>
              <View style={styles.stepIcon}>
                <Ionicons name="chatbubble" size={24} color="#3B82F6" />
              </View>
              <Text style={styles.stepTitle}>Tell us about yourself</Text>
              <Text style={styles.stepSubtitle}>Share your story and what motivates you</Text>
            </View>

            <View style={styles.formSection}>
              <View style={styles.inputField}>
                <Text style={styles.label}>Bio *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={memberData.bio}
                  onChangeText={(text) => setMemberData({ ...memberData, bio: text })}
                  placeholder="Tell us about your athletic journey, goals, and what you hope to achieve..."
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
                <Text style={styles.charCount}>{memberData.bio.length}/500 characters</Text>
              </View>

              <View style={styles.inputField}>
                <Text style={styles.label}>Experience Level</Text>
                <TextInput
                  style={styles.input}
                  value={memberData.experience}
                  onChangeText={(text) => setMemberData({ ...memberData, experience: text })}
                  placeholder="e.g., Beginner, Intermediate, Advanced"
                />
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.navigation}>
        {currentStep > 1 && (
          <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
            <Ionicons name="arrow-back" size={20} color="#6B7280" />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>
        )}

        {currentStep < 4 ? (
          <TouchableOpacity
            style={[styles.nextBtn, !canProceed() && styles.nextBtnDisabled]}
            onPress={handleNext}
            disabled={!canProceed()}
          >
            <Text style={[styles.nextBtnText, !canProceed() && styles.nextBtnTextDisabled]}>
              Next
            </Text>
            <Ionicons name="arrow-forward" size={20} color={canProceed() ? "#fff" : "#9CA3AF"} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.saveBtn, !canProceed() && styles.saveBtnDisabled]}
            onPress={handleSaveProfile}
            disabled={!canProceed() || saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.saveBtnText}>Complete Profile</Text>
                <Ionicons name="checkmark" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        )}
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  progressContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  stepContent: {
    flex: 1,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  stepIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  formSection: {
    marginBottom: 24,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  inputField: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'right',
  },
  sportsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  sportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: '45%',
  },
  sportCardSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  sportText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  sportTextSelected: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: '45%',
  },
  goalCardSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  goalText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  goalTextSelected: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backBtnText: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 8,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  nextBtnDisabled: {
    backgroundColor: '#E5E7EB',
  },
  nextBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginRight: 8,
  },
  nextBtnTextDisabled: {
    color: '#9CA3AF',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  saveBtnDisabled: {
    backgroundColor: '#E5E7EB',
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginRight: 8,
  },
}); 