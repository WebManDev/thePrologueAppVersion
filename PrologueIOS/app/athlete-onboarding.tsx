import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { auth, db } from '../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const sportsList = [
  'Tennis', 'Soccer', 'Swimming', 'Basketball', 'Volleyball', 'Track & Field',
  'Golf', 'Baseball', 'Softball', 'Wrestling', 'Gymnastics', 'Cross Country',
  'Football', 'Hockey', 'Lacrosse',
];

export default function AthleteOnboarding() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    bio: '',
    selectedSports: [] as string[],
    profileImage: null as string | null,
    uploading: false,
    basicTierPrice: '4.99',
    proTierPrice: '9.99',
    premiumTierPrice: '19.99',
  });
  const [submitting, setSubmitting] = useState(false);
  const [showStripeChoice, setShowStripeChoice] = useState(false);

  const handleSportToggle = (sport: string) => {
    setForm((prev) => ({
      ...prev,
      selectedSports: prev.selectedSports.includes(sport)
        ? prev.selectedSports.filter((s) => s !== sport)
        : [...prev.selectedSports, sport],
    }));
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setForm((prev) => ({ ...prev, profileImage: result.assets[0].uri }));
    }
  };

  const uploadProfileImage = async (uid: string, uri: string) => {
    const storage = getStorage();
    const response = await fetch(uri);
    const blob = await response.blob();
    const imageRef = ref(storage, `profilePictures/${uid}`);
    await uploadBytes(imageRef, blob);
    return await getDownloadURL(imageRef);
  };

  const handleSubmit = async () => {
    if (!form.firstName || !form.lastName || !form.bio || form.selectedSports.length === 0) {
      Alert.alert('Please fill all required fields.');
      return;
    }
    if (!auth.currentUser) {
      Alert.alert('No user logged in.');
      return;
    }
    setSubmitting(true);
    try {
      let profileImageUrl = '';
      if (form.profileImage) {
        profileImageUrl = await uploadProfileImage(auth.currentUser.uid, form.profileImage);
      }
      await setDoc(doc(db, 'athletes', auth.currentUser.uid), {
        firstName: form.firstName,
        lastName: form.lastName,
        bio: form.bio,
        specialties: form.selectedSports,
        profileImageUrl,
        role: 'athlete',
        email: auth.currentUser.email || '',
        pricing: {
          basic: parseFloat(form.basicTierPrice),
          pro: parseFloat(form.proTierPrice),
          premium: parseFloat(form.premiumTierPrice),
        },
      }, { merge: true });
      setShowStripeChoice(true);
    } catch (err) {
      Alert.alert('Error', 'Failed to save profile.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetupStripeNow = () => {
    setShowStripeChoice(false);
    // If you have a Stripe onboarding screen, use its route. Otherwise, go to Dashboard.
    router.replace('/Dashboard');
  };

  const handleGoToDashboard = () => {
    setShowStripeChoice(false);
    router.replace('/Dashboard');
  };

  return (
    <ScrollView contentContainerStyle={styles.bg}>
      {/* Progress Steps */}
      <View style={styles.progressContainer}>
        <View style={styles.progressStepActive}><Text style={styles.progressStepTextActive}>1</Text></View>
        <Text style={styles.progressLabelActive}>Profile Setup</Text>
        <View style={styles.progressLine} />
        <View style={styles.progressStep}><Text style={styles.progressStepText}>2</Text></View>
        <Text style={styles.progressLabel}>Dashboard</Text>
      </View>
      <View style={styles.card}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <View style={styles.iconCircle}><Text style={styles.iconText}>🏆</Text></View>
          <Text style={styles.title}>Build Your Champion Profile</Text>
          <Text style={styles.subtitle}>Create your professional profile to start sharing your expertise and connecting with aspiring athletes.</Text>
        </View>
        {/* Profile Section */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionIcon}><Text style={styles.iconText}>👤</Text></View>
          <Text style={styles.sectionTitle}>Athlete Profile</Text>
        </View>
        {/* Profile Image Upload */}
        <View style={styles.profileImageContainer}>
          <TouchableOpacity onPress={pickImage} style={styles.profileImageTouchable}>
            {form.profileImage ? (
              <Image source={{ uri: form.profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Text style={{ color: '#9CA3AF', fontSize: 40 }}>+</Text>
              </View>
            )}
            <View style={styles.uploadOverlay}>
              <Text style={styles.uploadOverlayText}>📤</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.uploadLabel}>Upload Your Profile Picture</Text>
        </View>
        {/* Form Fields */}
        <View style={styles.formFields}>
          <Text style={styles.label}>First Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your first name"
            value={form.firstName}
            onChangeText={(text) => setForm((prev) => ({ ...prev, firstName: text }))}
          />
          <Text style={styles.label}>Last Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your last name"
            value={form.lastName}
            onChangeText={(text) => setForm((prev) => ({ ...prev, lastName: text }))}
          />
          <Text style={styles.label}>Bio *</Text>
          <TextInput
            style={[styles.input, { minHeight: 80 }]}
            placeholder="Tell us about your background, achievements, and coaching philosophy..."
            value={form.bio}
            onChangeText={(text) => setForm((prev) => ({ ...prev, bio: text }))}
            multiline
            maxLength={500}
          />
          <Text style={styles.charCount}>{form.bio.length}/500 characters</Text>
          <Text style={styles.label}>Sports Specialties *</Text>
          <View style={styles.sportsContainer}>
            {sportsList.map((sport) => (
              <TouchableOpacity
                key={sport}
                style={[
                  styles.sportButton,
                  form.selectedSports.includes(sport) && styles.sportButtonSelected,
                ]}
                onPress={() => handleSportToggle(sport)}
              >
                <Text style={[
                  styles.sportButtonText,
                  form.selectedSports.includes(sport) && styles.sportButtonTextSelected,
                ]}>{sport}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        {/* Subscription Pricing Section */}
        <View style={styles.sectionHeaderRow}>
          <View style={[styles.sectionIcon, { backgroundColor: '#fbbf24' }]}><Text style={styles.iconText}>🎯</Text></View>
          <Text style={styles.sectionTitle}>Subscription Pricing</Text>
        </View>
        <Text style={styles.pricingNote}>Set your custom pricing for all tiers. <Text style={{ fontWeight: 'bold' }}>Basic tier must be at least $4.99/month.</Text></Text>
        <View style={styles.pricingRow}>
          <View style={styles.pricingCol}>
            <Text style={styles.label}>Basic Tier Price ($/month)</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              value={form.basicTierPrice}
              onChangeText={(text) => setForm((prev) => ({ ...prev, basicTierPrice: text }))}
            />
          </View>
          <View style={styles.pricingCol}>
            <Text style={styles.label}>Pro Tier Price ($/month)</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              value={form.proTierPrice}
              onChangeText={(text) => setForm((prev) => ({ ...prev, proTierPrice: text }))}
            />
          </View>
          <View style={styles.pricingCol}>
            <Text style={styles.label}>Premium Tier Price ($/month)</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              value={form.premiumTierPrice}
              onChangeText={(text) => setForm((prev) => ({ ...prev, premiumTierPrice: text }))}
            />
          </View>
        </View>
        <View style={styles.pricingAlertBox}>
          <Text style={styles.pricingAlertText}><Text style={{ fontWeight: 'bold' }}>Note:</Text> Your pricing will be visible to potential subscribers. Consider your expertise, content quality, and market rates when setting your prices.</Text>
        </View>
        {/* Save Profile Button */}
        <TouchableOpacity
          style={[styles.saveButton, (submitting || !form.firstName || !form.lastName || !form.bio || form.selectedSports.length === 0) && styles.saveButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting || !form.firstName || !form.lastName || !form.bio || form.selectedSports.length === 0}
        >
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Save Profile</Text>}
        </TouchableOpacity>
        <Text style={styles.saveNote}>You can always update your profile information later from your dashboard</Text>
      </View>
      {/* Stripe Choice Modal */}
      <Modal
        visible={showStripeChoice}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStripeChoice(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconCircle}><Text style={styles.iconText}>💳</Text></View>
            <Text style={styles.modalTitle}>Set Up Payment Processing</Text>
            <Text style={styles.modalSubtitle}>Would you like to set up Stripe Connect now to receive payments, or skip this step and set it up later?</Text>
            <TouchableOpacity style={styles.modalButton} onPress={handleSetupStripeNow}>
              <Text style={styles.modalButtonText}>Set Up Stripe Now</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalButton, styles.modalButtonOutline]} onPress={handleGoToDashboard}>
              <Text style={[styles.modalButtonText, styles.modalButtonTextOutline]}>Skip for Now</Text>
            </TouchableOpacity>
            <Text style={styles.modalNote}>You can always set up payment processing later in your settings</Text>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bg: {
    flexGrow: 1,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    marginTop: 8,
    justifyContent: 'center',
  },
  progressStepActive: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  progressStep: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressStepTextActive: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  progressStepText: {
    color: '#6b7280',
    fontWeight: 'bold',
    fontSize: 16,
  },
  progressLabelActive: {
    color: '#3B82F6',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
    marginRight: 8,
  },
  progressLabel: {
    color: '#6b7280',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 8,
  },
  progressLine: {
    width: 32,
    height: 2,
    backgroundColor: '#d1d5db',
    marginHorizontal: 8,
    borderRadius: 1,
  },
  card: {
    backgroundColor: '#f9fafb',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 18,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconText: {
    fontSize: 28,
    color: 'white',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  profileImageTouchable: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 4,
  },
  profileImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  profileImagePlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  uploadOverlayText: {
    color: 'white',
    fontSize: 18,
  },
  uploadLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    marginBottom: 8,
    fontWeight: '500',
  },
  formFields: {
    width: '100%',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 10,
    marginBottom: 4,
  },
  input: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 4,
  },
  charCount: {
    fontSize: 12,
    color: '#6B7280',
    alignSelf: 'flex-end',
    marginBottom: 2,
  },
  sportsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
    justifyContent: 'flex-start',
  },
  sportButton: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    margin: 4,
    backgroundColor: '#fff',
  },
  sportButtonSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  sportButtonText: {
    color: '#1F2937',
    fontSize: 14,
  },
  sportButtonTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  pricingNote: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
    marginTop: 2,
    textAlign: 'left',
    width: '100%',
  },
  pricingRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  pricingCol: {
    flex: 1,
    marginHorizontal: 2,
  },
  pricingAlertBox: {
    backgroundColor: '#FEF3C7',
    borderLeftWidth: 4,
    borderLeftColor: '#FBBF24',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
    width: '100%',
  },
  pricingAlertText: {
    color: '#92400E',
    fontSize: 12,
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 40,
    marginTop: 16,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  saveNote: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 28,
    width: 320,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
  },
  modalIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 18,
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 8,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonOutline: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#d1d5db',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalButtonTextOutline: {
    color: '#3B82F6',
  },
  modalNote: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 12,
    textAlign: 'center',
  },
}); 