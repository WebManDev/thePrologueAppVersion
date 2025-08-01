import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Modal,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../firebaseConfig';
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import {
  updateEmail,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from 'firebase/auth';

interface AthleteData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bio: string;
  location: string;
  school: string;
  graduationYear: string;
  sport: string;
  position: string;
  experience: string;
  specialties: string[];
  certifications: string[];
  achievements: string[];
  profilePhotoUrl: string;
  coverPhotoUrl: string;
  stripeAccountId: string;
  basicPrice: number;
  proPrice: number;
  premiumPrice: number;
}

export default function AthleteSettingsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);

  // Profile data
  const [athleteData, setAthleteData] = useState<AthleteData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: '',
    location: '',
    school: '',
    graduationYear: '',
    sport: '',
    position: '',
    experience: '',
    specialties: [],
    certifications: [],
    achievements: [],
    profilePhotoUrl: '',
    coverPhotoUrl: '',
    stripeAccountId: '',
    basicPrice: 4.99,
    proPrice: 9.99,
    premiumPrice: 19.99,
  });

  // Password data
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    showEmail: false,
    showPhone: false,
    allowMessages: true,
    showOnlineStatus: true,
    dataCollection: true,
  });

  // Load athlete data
  useEffect(() => {
    const loadAthleteData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          router.replace('/');
          return;
        }

        const userDoc = await getDoc(doc(db, 'athletes', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setAthleteData({
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            email: data.email || user.email || '',
            phone: data.phone || '',
            bio: data.bio || '',
            location: data.location || '',
            school: data.school || data.university || '',
            graduationYear: data.graduationYear || '',
            sport: data.sport || '',
            position: data.position || '',
            experience: data.experience || '',
            specialties: data.specialties || [],
            certifications: data.certifications || [],
            achievements: data.achievements || [],
            profilePhotoUrl: data.profilePhotoUrl || data.profileImageUrl || '',
            coverPhotoUrl: data.coverPhotoUrl || '',
            stripeAccountId: data.stripeAccountId || '',
            basicPrice: data.basicPrice || 4.99,
            proPrice: data.proPrice || 9.99,
            premiumPrice: data.premiumPrice || 19.99,
          });
        }
      } catch (error) {
        console.error('Error loading athlete data:', error);
        Alert.alert('Error', 'Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    loadAthleteData();
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      const oldEmail = user.email || '';
      const newEmail = athleteData.email.trim();

      // Check if email changed
      if (newEmail !== oldEmail) {
        // Check if email is already in use
        const q = query(collection(db, 'athletes'), where('email', '==', newEmail));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          Alert.alert('Email Already In Use', 'That email address is already registered. Please use a different one.');
          setSaving(false);
          return;
        }

        // Update email in Firebase Auth
        try {
          await updateEmail(user, newEmail);
        } catch (err: any) {
          if (err.code === 'auth/requires-recent-login') {
            Alert.alert('Re-authentication Required', 'Please log out and log back in to change your email.');
            setSaving(false);
            return;
          } else {
            throw err;
          }
        }
      }

      // Update Firestore
      await updateDoc(doc(db, 'athletes', user.uid), {
        ...athleteData,
        email: newEmail,
      });

      Alert.alert('Success', 'Profile updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters long');
      return;
    }

    setSaving(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      await updatePassword(user, passwordData.newPassword);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      Alert.alert('Success', 'Password changed successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await auth.signOut();
      router.replace('/');
    } catch (error) {
      Alert.alert('Error', 'Failed to logout');
    } finally {
      setLogoutLoading(false);
    }
  };

  const addSpecialty = () => {
    setAthleteData({
      ...athleteData,
      specialties: [...athleteData.specialties, ''],
    });
  };

  const removeSpecialty = (index: number) => {
    const newSpecialties = athleteData.specialties.filter((_, i) => i !== index);
    setAthleteData({ ...athleteData, specialties: newSpecialties });
  };

  const updateSpecialty = (index: number, value: string) => {
    const newSpecialties = [...athleteData.specialties];
    newSpecialties[index] = value;
    setAthleteData({ ...athleteData, specialties: newSpecialties });
  };

  const addCertification = () => {
    setAthleteData({
      ...athleteData,
      certifications: [...athleteData.certifications, ''],
    });
  };

  const removeCertification = (index: number) => {
    const newCertifications = athleteData.certifications.filter((_, i) => i !== index);
    setAthleteData({ ...athleteData, certifications: newCertifications });
  };

  const updateCertification = (index: number, value: string) => {
    const newCertifications = [...athleteData.certifications];
    newCertifications[index] = value;
    setAthleteData({ ...athleteData, certifications: newCertifications });
  };

  const addAchievement = () => {
    setAthleteData({
      ...athleteData,
      achievements: [...athleteData.achievements, ''],
    });
  };

  const removeAchievement = (index: number) => {
    const newAchievements = athleteData.achievements.filter((_, i) => i !== index);
    setAthleteData({ ...athleteData, achievements: newAchievements });
  };

  const updateAchievement = (index: number, value: string) => {
    const newAchievements = [...athleteData.achievements];
    newAchievements[index] = value;
    setAthleteData({ ...athleteData, achievements: newAchievements });
  };

  const savePricing = async () => {
    setSaving(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      await updateDoc(doc(db, 'athletes', user.uid), {
        basicPrice: athleteData.basicPrice,
        proPrice: athleteData.proPrice,
        premiumPrice: athleteData.premiumPrice,
      });

      Alert.alert('Success', 'Pricing updated successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save pricing');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
            onPress={() => setActiveTab('profile')}
          >
            <Ionicons name="person" size={20} color={activeTab === 'profile' ? '#3B82F6' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'profile' && styles.activeTabText]}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'subscription' && styles.activeTab]}
            onPress={() => setActiveTab('subscription')}
          >
            <Ionicons name="card" size={20} color={activeTab === 'subscription' ? '#3B82F6' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'subscription' && styles.activeTabText]}>Subscription</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'banking' && styles.activeTab]}
            onPress={() => setActiveTab('banking')}
          >
            <Ionicons name="wallet" size={20} color={activeTab === 'banking' ? '#3B82F6' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'banking' && styles.activeTabText]}>Banking</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'security' && styles.activeTab]}
            onPress={() => setActiveTab('security')}
          >
            <Ionicons name="shield" size={20} color={activeTab === 'security' ? '#3B82F6' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'security' && styles.activeTabText]}>Security</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <View style={styles.tabContent}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Profile Information</Text>
              
              <View style={styles.formRow}>
                <View style={styles.formField}>
                  <Text style={styles.label}>First Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={athleteData.firstName}
                    onChangeText={(text) => setAthleteData({ ...athleteData, firstName: text })}
                    placeholder="Enter first name"
                  />
                </View>
                <View style={styles.formField}>
                  <Text style={styles.label}>Last Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={athleteData.lastName}
                    onChangeText={(text) => setAthleteData({ ...athleteData, lastName: text })}
                    placeholder="Enter last name"
                  />
                </View>
              </View>

              <View style={styles.formField}>
                <Text style={styles.label}>Email Address *</Text>
                <TextInput
                  style={styles.input}
                  value={athleteData.email}
                  onChangeText={(text) => setAthleteData({ ...athleteData, email: text })}
                  placeholder="Enter email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formRow}>
                <View style={styles.formField}>
                  <Text style={styles.label}>Phone Number</Text>
                  <TextInput
                    style={styles.input}
                    value={athleteData.phone}
                    onChangeText={(text) => setAthleteData({ ...athleteData, phone: text })}
                    placeholder="Enter phone"
                    keyboardType="phone-pad"
                  />
                </View>
                <View style={styles.formField}>
                  <Text style={styles.label}>Location</Text>
                  <TextInput
                    style={styles.input}
                    value={athleteData.location}
                    onChangeText={(text) => setAthleteData({ ...athleteData, location: text })}
                    placeholder="City, State"
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={styles.formField}>
                  <Text style={styles.label}>School/University</Text>
                  <TextInput
                    style={styles.input}
                    value={athleteData.school}
                    onChangeText={(text) => setAthleteData({ ...athleteData, school: text })}
                    placeholder="Your school"
                  />
                </View>
                <View style={styles.formField}>
                  <Text style={styles.label}>Graduation Year</Text>
                  <TextInput
                    style={styles.input}
                    value={athleteData.graduationYear}
                    onChangeText={(text) => setAthleteData({ ...athleteData, graduationYear: text })}
                    placeholder="e.g., 2025"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={styles.formField}>
                  <Text style={styles.label}>Sport</Text>
                  <TextInput
                    style={styles.input}
                    value={athleteData.sport}
                    onChangeText={(text) => setAthleteData({ ...athleteData, sport: text })}
                    placeholder="Your primary sport"
                  />
                </View>
                <View style={styles.formField}>
                  <Text style={styles.label}>Position</Text>
                  <TextInput
                    style={styles.input}
                    value={athleteData.position}
                    onChangeText={(text) => setAthleteData({ ...athleteData, position: text })}
                    placeholder="Your position"
                  />
                </View>
              </View>

              <View style={styles.formField}>
                <Text style={styles.label}>Experience (Years)</Text>
                <TextInput
                  style={styles.input}
                  value={athleteData.experience}
                  onChangeText={(text) => setAthleteData({ ...athleteData, experience: text.replace(/[^0-9]/g, '') })}
                  placeholder="Years of experience"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.label}>Bio</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={athleteData.bio}
                  onChangeText={(text) => setAthleteData({ ...athleteData, bio: text })}
                  placeholder="Tell people about yourself..."
                  multiline
                  numberOfLines={4}
                />
                <Text style={styles.charCount}>{athleteData.bio.length}/500 characters</Text>
              </View>

              {/* Specialties */}
              <View style={styles.formField}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.label}>Specialties</Text>
                  <TouchableOpacity onPress={addSpecialty} style={styles.addButton}>
                    <Ionicons name="add" size={20} color="#3B82F6" />
                  </TouchableOpacity>
                </View>
                {athleteData.specialties.map((specialty, index) => (
                  <View key={index} style={styles.listItem}>
                    <TextInput
                      style={styles.listInput}
                      value={specialty}
                      onChangeText={(text) => updateSpecialty(index, text)}
                      placeholder="Enter specialty"
                    />
                    <TouchableOpacity onPress={() => removeSpecialty(index)} style={styles.removeButton}>
                      <Ionicons name="trash" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              {/* Certifications */}
              <View style={styles.formField}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.label}>Certifications</Text>
                  <TouchableOpacity onPress={addCertification} style={styles.addButton}>
                    <Ionicons name="add" size={20} color="#3B82F6" />
                  </TouchableOpacity>
                </View>
                {athleteData.certifications.map((certification, index) => (
                  <View key={index} style={styles.listItem}>
                    <TextInput
                      style={styles.listInput}
                      value={certification}
                      onChangeText={(text) => updateCertification(index, text)}
                      placeholder="Enter certification"
                    />
                    <TouchableOpacity onPress={() => removeCertification(index)} style={styles.removeButton}>
                      <Ionicons name="trash" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              {/* Achievements */}
              <View style={styles.formField}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.label}>Achievements</Text>
                  <TouchableOpacity onPress={addAchievement} style={styles.addButton}>
                    <Ionicons name="add" size={20} color="#3B82F6" />
                  </TouchableOpacity>
                </View>
                {athleteData.achievements.map((achievement, index) => (
                  <View key={index} style={styles.listItem}>
                    <TextInput
                      style={styles.listInput}
                      value={achievement}
                      onChangeText={(text) => updateAchievement(index, text)}
                      placeholder="Enter achievement"
                    />
                    <TouchableOpacity onPress={() => removeAchievement(index)} style={styles.removeButton}>
                      <Ionicons name="trash" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="save" size={20} color="#fff" />
                    <Text style={styles.saveButtonText}>Save Profile</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Subscription Tab */}
        {activeTab === 'subscription' && (
          <View style={styles.tabContent}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Subscription Pricing</Text>
              <Text style={styles.cardSubtitle}>Set your custom pricing for all tiers</Text>
              
              <View style={styles.pricingNote}>
                <Text style={styles.pricingNoteText}>
                  Basic tier must be at least $4.99/month
                </Text>
              </View>

              <View style={styles.formField}>
                <Text style={styles.label}>Basic Tier Price ($/month)</Text>
                <TextInput
                  style={styles.input}
                  value={athleteData.basicPrice.toString()}
                  onChangeText={(text) => setAthleteData({ ...athleteData, basicPrice: parseFloat(text) || 0 })}
                  placeholder="4.99"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.label}>Pro Tier Price ($/month)</Text>
                <TextInput
                  style={styles.input}
                  value={athleteData.proPrice.toString()}
                  onChangeText={(text) => setAthleteData({ ...athleteData, proPrice: parseFloat(text) || 0 })}
                  placeholder="9.99"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.formField}>
                <Text style={styles.label}>Premium Tier Price ($/month)</Text>
                <TextInput
                  style={styles.input}
                  value={athleteData.premiumPrice.toString()}
                  onChangeText={(text) => setAthleteData({ ...athleteData, premiumPrice: parseFloat(text) || 0 })}
                  placeholder="19.99"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.pricingAlert}>
                <Text style={styles.pricingAlertText}>
                  <Text style={styles.bold}>Note:</Text> Your pricing will be visible to potential subscribers. Consider your expertise, content quality, and market rates when setting your prices.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={savePricing}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="save" size={20} color="#fff" />
                    <Text style={styles.saveButtonText}>Save Pricing</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Banking Tab */}
        {activeTab === 'banking' && (
          <View style={styles.tabContent}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Banking Information</Text>
              <Text style={styles.cardSubtitle}>Add your banking details to receive payments</Text>
              
              <View style={styles.bankingStatus}>
                <Ionicons name="information-circle" size={24} color="#3B82F6" />
                <Text style={styles.bankingStatusText}>
                  {athleteData.stripeAccountId 
                    ? 'Your Stripe Connect account is set up and ready to receive payments.'
                    : 'Connect your Stripe account to start receiving payments from subscribers.'
                  }
                </Text>
              </View>

              <TouchableOpacity style={styles.connectButton}>
                <Ionicons name="card" size={20} color="#fff" />
                <Text style={styles.connectButtonText}>
                  {athleteData.stripeAccountId ? 'Manage Stripe Account' : 'Connect Stripe Account'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <View style={styles.tabContent}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Change Password</Text>
              
              <View style={styles.formField}>
                <Text style={styles.label}>Current Password *</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={passwordData.currentPassword}
                    onChangeText={(text) => setPasswordData({ ...passwordData, currentPassword: text })}
                    placeholder="Enter current password"
                    secureTextEntry={!showPasswords.current}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                    style={styles.eyeButton}
                  >
                    <Ionicons name={showPasswords.current ? "eye-off" : "eye"} size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.formField}>
                <Text style={styles.label}>New Password *</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={passwordData.newPassword}
                    onChangeText={(text) => setPasswordData({ ...passwordData, newPassword: text })}
                    placeholder="Enter new password"
                    secureTextEntry={!showPasswords.new}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    style={styles.eyeButton}
                  >
                    <Ionicons name={showPasswords.new ? "eye-off" : "eye"} size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.helpText}>Must be at least 8 characters long</Text>
              </View>

              <View style={styles.formField}>
                <Text style={styles.label}>Confirm New Password *</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={passwordData.confirmPassword}
                    onChangeText={(text) => setPasswordData({ ...passwordData, confirmPassword: text })}
                    placeholder="Confirm new password"
                    secureTextEntry={!showPasswords.confirm}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    style={styles.eyeButton}
                  >
                    <Ionicons name={showPasswords.confirm ? "eye-off" : "eye"} size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword || saving) && styles.saveButtonDisabled
                ]}
                onPress={handleChangePassword}
                disabled={!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword || saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="shield" size={20} color="#fff" />
                    <Text style={styles.saveButtonText}>Change Password</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '500',
  },
  tabsContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 4,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3B82F6',
  },
  tabText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#3B82F6',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  tabContent: {
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formField: {
    marginBottom: 16,
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
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'right',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addButton: {
    padding: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  listInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  removeButton: {
    padding: 8,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 16,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  pricingNote: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  pricingNoteText: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '500',
  },
  pricingAlert: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  pricingAlertText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  bold: {
    fontWeight: '600',
  },
  bankingStatus: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  bankingStatusText: {
    flex: 1,
    fontSize: 14,
    color: '#1E40AF',
    marginLeft: 12,
    lineHeight: 20,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  eyeButton: {
    padding: 12,
  },
  helpText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
}); 