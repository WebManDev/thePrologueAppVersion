import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, Pressable, TextInput, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { Home, FileText, MessageSquare, MessageCircle, User, Search, Settings, LogOut, ChevronDown, TrendingUp, Edit, Star, Award, BookOpen, Target, MapPin, GraduationCap, CheckCircle, Plus, Trash2, Save, X, Camera } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageToFirebase, deleteImageFromFirebase, validateImageFile, testFirebaseStorage } from '../utils/firebaseStorage';

interface AthleteData {
  firstName?: string;
  lastName?: string;
  name?: string;
  bio?: string;
  email?: string;
  phone?: string;
  location?: string;
  school?: string;
  graduationYear?: string;
  sport?: string;
  position?: string;
  experience?: string;
  profilePhotoUrl?: string;
  coverPhotoUrl?: string;
  stripeAccountId?: string;
  certifications?: string[];
  specialties?: string[];
  achievements?: string[];
  lastProfileEdit?: string;
  [key: string]: any;
}

const initialProfileData: AthleteData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  bio: "",
  location: "",
  school: "",
  graduationYear: "",
  sport: "",
  position: "",
  experience: "",
  certifications: [],
  specialties: [],
  achievements: [],
  profilePhotoUrl: "",
  coverPhotoUrl: "",
  stripeAccountId: "",
  lastProfileEdit: "",
};

export default function Dashboard() {
  const [athleteData, setAthleteData] = useState<AthleteData>(initialProfileData);
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [localData, setLocalData] = useState<AthleteData>(initialProfileData);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "athletes", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            const profileData = {
              ...initialProfileData,
              ...data
            };
            setAthleteData(profileData);
            setLocalData(profileData);
          }
          
          // Test Firebase Storage access
          console.log('Testing Firebase Storage...');
          const storageTest = await testFirebaseStorage();
          console.log('Storage test result:', storageTest);
          
        } catch (error) {
          console.error('Error fetching athlete data:', error);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const getInitials = (firstName?: string, lastName?: string): string => {
    if (!firstName && !lastName) return 'AL';
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return first + last || 'AL';
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await firebaseSignOut(auth);
      router.replace('/'); // Redirect to role selection page
    } catch (e) {
      // handle error
    } finally {
      setLogoutLoading(false);
      setShowUserMenu(false);
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing - reset to original data
      setLocalData(athleteData);
    }
    setIsEditing(!isEditing);
  };

  const uploadImage = async (imageUri: string, type: 'profile' | 'cover') => {
    console.log('Upload started - Auth state:', auth.currentUser ? 'Authenticated' : 'Not authenticated');
    console.log('Current user UID:', auth.currentUser?.uid);
    console.log('Current user email:', auth.currentUser?.email);
    
    if (!auth.currentUser) {
      console.error('No authenticated user found');
      Alert.alert('Upload Failed', 'Please log in to upload photos.');
      return null;
    }
    
    setUploadingPhoto(true);
    
    try {
      console.log('Starting upload for:', type, 'URI:', imageUri);
      
      const result = await uploadImageToFirebase(imageUri, type, (progress) => {
        console.log('Upload progress:', progress);
      });
      
      if (result.success && result.downloadURL) {
        console.log('Upload successful:', result.downloadURL);
        return result.downloadURL;
      } else {
        console.error('Upload failed:', result.error);
        Alert.alert('Upload Failed', result.error || 'Failed to upload photo. Please try again.');
        return null;
      }
      
    } catch (error) {
      console.error(`Error uploading ${type} photo:`, error);
      Alert.alert('Upload Failed', 'An unexpected error occurred. Please try again.');
      return null;
    } finally {
      setUploadingPhoto(false);
    }
  };

  const [selectedProfileFile, setSelectedProfileFile] = useState<string | null>(null);
  const [selectedCoverFile, setSelectedCoverFile] = useState<string | null>(null);

  const pickImage = async (type: 'profile' | 'cover') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant permission to access your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'profile' ? [1, 1] : [16, 9],
      quality: 0.8,
      allowsMultipleSelection: false,
    });

    if (!result.canceled && result.assets[0]) {
      const selectedImage = result.assets[0];
      
      // Validate file size only - expo-image-picker ensures we get images
      if (selectedImage.fileSize && selectedImage.fileSize > 5 * 1024 * 1024) {
        Alert.alert('File Too Large', 'Please select an image smaller than 5MB.');
        return;
      }
      
      // Store the file URI for later upload
      if (type === 'profile') {
        setSelectedProfileFile(selectedImage.uri);
      } else {
        setSelectedCoverFile(selectedImage.uri);
      }
      
      // Create immediate preview for UI feedback
      const updatedData = {
        ...localData,
        [type === 'profile' ? 'profilePhotoUrl' : 'coverPhotoUrl']: selectedImage.uri,
      };
      setLocalData(updatedData);
      
      // Upload immediately
      const uploadResult = await uploadImage(selectedImage.uri, type);
      
      if (uploadResult) {
        // Update with the Firebase URL
        const finalData = {
          ...localData,
          [type === 'profile' ? 'profilePhotoUrl' : 'coverPhotoUrl']: uploadResult,
        };
        setLocalData(finalData);
        
        Alert.alert('Success', `${type.charAt(0).toUpperCase() + type.slice(1)} photo uploaded successfully!`);
      } else {
        Alert.alert('Upload Failed', 'Failed to upload image. Please try again.');
      }
    }
  };

  const handleSave = async () => {
    if (!auth.currentUser) return;
    
    setSaving(true);
    try {
      const uid = auth.currentUser.uid;
      let profilePhotoUrl: string = localData.profilePhotoUrl || "";
      let coverPhotoUrl: string = localData.coverPhotoUrl || "";
      
      // Upload profile photo if selected
      if (selectedProfileFile) {
        console.log('Uploading profile photo...');
        const downloadURL = await uploadImage(selectedProfileFile, 'profile');
        if (downloadURL && typeof downloadURL === 'string') {
          profilePhotoUrl = downloadURL;
          setSelectedProfileFile(null);
          // Update athleteData immediately so UI shows the new photo
          setAthleteData(prev => ({ ...prev, profilePhotoUrl: downloadURL }));
        }
      }
      
      // Upload cover photo if selected
      if (selectedCoverFile) {
        console.log('Uploading cover photo...');
        const downloadURL = await uploadImage(selectedCoverFile, 'cover');
        if (downloadURL && typeof downloadURL === 'string') {
          coverPhotoUrl = downloadURL;
          setSelectedCoverFile(null);
          // Update athleteData immediately so UI shows the new photo
          setAthleteData(prev => ({ ...prev, coverPhotoUrl: downloadURL }));
        }
      }
      
      const updatedData = {
        ...localData,
        profilePhotoUrl,
        coverPhotoUrl,
        lastProfileEdit: new Date().toISOString(),
      };
      
      await setDoc(doc(db, 'athletes', uid), updatedData, { merge: true });
      setAthleteData(updatedData);
      setLocalData(updatedData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Save Failed', 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (field: keyof AthleteData, value: string) => {
    setLocalData(prev => ({ ...prev, [field]: value }));
  };

  const handleListChange = (field: "certifications" | "specialties" | "achievements", index: number, value: string) => {
    setLocalData(prev => {
      const updatedList = [...(prev[field] || [])];
      updatedList[index] = value;
      return { ...prev, [field]: updatedList };
    });
  };

  const addListItem = (field: "certifications" | "specialties" | "achievements") => {
    setLocalData(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), ""],
    }));
  };

  const removeListItem = (field: "certifications" | "specialties" | "achievements", index: number) => {
    setLocalData(prev => ({
      ...prev,
      [field]: (prev[field] || []).filter((_, i) => i !== index),
    }));
  };

  const initials = getInitials(athleteData?.firstName, athleteData?.lastName);
  const displayName = athleteData?.firstName && athleteData?.lastName ? `${athleteData.firstName} ${athleteData.lastName}` : 'Student Athlete';
  const currentData = isEditing ? localData : athleteData;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.logoRow}>
          <Image source={require('../assets/p.png')} style={styles.logoImage} />
          <Text style={styles.logoText}>PROLOGUE</Text>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerIconBtn}>
            <Search size={22} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerProfileBtn} onPress={() => setShowUserMenu(true)}>
            {currentData?.profilePhotoUrl ? (
              <Image source={{ uri: currentData.profilePhotoUrl }} style={styles.headerProfileImage} />
            ) : (
              <View style={styles.headerProfilePlaceholder}>
                <User size={16} color="#6B7280" />
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerIconBtn} onPress={() => setShowUserMenu(true)}>
            <ChevronDown size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Section */}
      <ScrollView style={styles.mainContent} showsVerticalScrollIndicator={false}>
        {/* Cover Photo Section */}
        <View style={styles.coverPhotoContainer}>
          {currentData?.coverPhotoUrl ? (
            <Image source={{ uri: currentData.coverPhotoUrl }} style={styles.coverPhoto} />
          ) : (
            <View style={styles.coverPhotoPlaceholder} />
          )}
          <View style={styles.coverPhotoOverlay} />
          {isEditing && (
            <TouchableOpacity 
              style={styles.coverPhotoEditButton}
              onPress={() => pickImage('cover')}
              disabled={uploadingPhoto}
            >
              <Camera size={16} color="#fff" />
              <Text style={styles.coverPhotoEditText}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.profileSection}>
          {/* Profile Image */}
          <View style={styles.profileImageContainer}>
                      <View style={styles.profileImageWrapper}>
            {currentData?.profilePhotoUrl ? (
              <Image source={{ uri: currentData.profilePhotoUrl }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <User size={40} color="#3B82F6" />
              </View>
            )}
              {isEditing && (
                <TouchableOpacity 
                  style={styles.profileImageEditButton}
                  onPress={() => pickImage('profile')}
                  disabled={uploadingPhoto}
                >
                  <Edit size={12} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Profile Info */}
          <View style={styles.profileInfo}>
            {isEditing ? (
              <View style={styles.editFields}>
                <View style={styles.nameRow}>
                  <TextInput
                    style={styles.nameInput}
                    value={localData.firstName || ''}
                    onChangeText={(text) => handleFieldChange('firstName', text)}
                    placeholder="First Name"
                    placeholderTextColor="#9CA3AF"
                  />
                  <TextInput
                    style={styles.nameInput}
                    value={localData.lastName || ''}
                    onChangeText={(text) => handleFieldChange('lastName', text)}
                    placeholder="Last Name"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View style={styles.infoRow}>
                  <TextInput
                    style={styles.infoInput}
                    value={localData.sport || ''}
                    onChangeText={(text) => handleFieldChange('sport', text)}
                    placeholder="Sport"
                    placeholderTextColor="#9CA3AF"
                  />
                  <TextInput
                    style={styles.infoInput}
                    value={localData.experience || ''}
                    onChangeText={(text) => handleFieldChange('experience', text)}
                    placeholder="Experience"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View style={styles.infoRow}>
                  <TextInput
                    style={styles.infoInput}
                    value={localData.location || ''}
                    onChangeText={(text) => handleFieldChange('location', text)}
                    placeholder="Location"
                    placeholderTextColor="#9CA3AF"
                  />
                  <TextInput
                    style={styles.infoInput}
                    value={localData.school || ''}
                    onChangeText={(text) => handleFieldChange('school', text)}
                    placeholder="School"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <TextInput
                  style={styles.bioInput}
                  value={localData.bio || ''}
                  onChangeText={(text) => handleFieldChange('bio', text)}
                  placeholder="Tell athletes about your coaching philosophy..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                />
              </View>
            ) : (
              <>
                <Text style={styles.profileName}>{displayName}</Text>
                <View style={styles.profileSubtitle}>
                  <Text style={styles.profileRole}>Coach • Experience</Text>
                  <View style={styles.ratingContainer}>
                    <Star size={16} color="#F59E0B" fill="#F59E0B" />
                    <Text style={styles.ratingText}>4.9/5.0</Text>
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {!isEditing ? (
              <TouchableOpacity style={styles.editProfileButton} onPress={handleEditToggle}>
                <Edit size={16} color="#3B82F6" />
                <Text style={styles.editProfileText}>Edit Profile</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.saveButtons}>
                <TouchableOpacity 
                  style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
                  onPress={handleSave}
                  disabled={saving}
                >
                  <Save size={16} color="#fff" />
                  <Text style={styles.saveButtonText}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelButton} onPress={handleEditToggle}>
                  <X size={16} color="#6B7280" />
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Recent Posts Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MessageSquare size={20} color="#1F2937" />
            <Text style={styles.sectionTitle}>Recent Posts</Text>
          </View>
          <View style={styles.sectionContent}>
            <Text style={styles.emptyText}>Recent posts are coming soon!</Text>
          </View>
        </View>

        {/* Sport Details Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Award size={20} color="#1F2937" />
            <Text style={styles.sectionTitle}>Sport Details</Text>
          </View>
          <View style={styles.sectionContent}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Primary Sport:</Text>
              <Text style={styles.detailValue}>{currentData?.sport || 'N/A'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Position:</Text>
              <Text style={styles.detailValue}>{currentData?.position || 'N/A'}</Text>
            </View>
          </View>
        </View>

        {/* Key Achievements */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Award size={20} color="#1F2937" />
            <Text style={styles.sectionTitle}>Key Achievements</Text>
          </View>
          <View style={styles.sectionContent}>
            {(currentData?.achievements || []).length > 0 ? (
              (currentData.achievements || []).map((achievement, index) => (
                <View key={index} style={styles.achievementItem}>
                  <Award size={20} color="#F59E0B" />
                  <Text style={styles.achievementText}>{achievement}</Text>
                </View>
              ))
            ) : (
              <View style={styles.achievementItem}>
                <Award size={20} color="#F59E0B" />
                <Text style={styles.achievementText}>No achievements yet</Text>
              </View>
            )}
            {isEditing && (
              <TouchableOpacity style={styles.addButton} onPress={() => addListItem("achievements")}>
                <Plus size={16} color="#3B82F6" />
                <Text style={styles.addButtonText}>Add Achievement</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Professional Certifications */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Award size={20} color="#1F2937" />
            <Text style={styles.sectionTitle}>Professional Certifications</Text>
          </View>
          <View style={styles.sectionContent}>
            {(currentData?.certifications || []).length > 0 ? (
              (currentData.certifications || []).map((cert, index) => (
                <View key={index} style={styles.certificationItem}>
                  <BookOpen size={20} color="#3B82F6" />
                  <Text style={styles.certificationText}>{cert}</Text>
                </View>
              ))
            ) : (
              <View style={styles.certificationItem}>
                <BookOpen size={20} color="#3B82F6" />
                <Text style={styles.certificationText}>No certifications yet</Text>
              </View>
            )}
            {isEditing && (
              <TouchableOpacity style={styles.addButton} onPress={() => addListItem("certifications")}>
                <Plus size={16} color="#3B82F6" />
                <Text style={styles.addButtonText}>Add Certification</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Areas of Expertise */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Star size={20} color="#1F2937" />
            <Text style={styles.sectionTitle}>Areas of Expertise</Text>
          </View>
          <View style={styles.sectionContent}>
            {(currentData?.specialties || []).length > 0 ? (
              (currentData.specialties || []).map((specialty, index) => (
                <View key={index} style={styles.expertiseItem}>
                  <Target size={20} color="#10B981" />
                  <Text style={styles.expertiseText}>{specialty}</Text>
                </View>
              ))
            ) : (
              <View style={styles.expertiseItem}>
                <Target size={20} color="#10B981" />
                <Text style={styles.expertiseText}>No expertise areas defined</Text>
              </View>
            )}
            {isEditing && (
              <TouchableOpacity style={styles.addButton} onPress={() => addListItem("specialties")}>
                <Plus size={16} color="#3B82F6" />
                <Text style={styles.addButtonText}>Add Specialty</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      {/* User Menu Modal */}
      <Modal
        visible={showUserMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUserMenu(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowUserMenu(false)}>
          <View style={styles.userMenuCard}>
            <TouchableOpacity style={styles.userMenuItem} onPress={() => { setShowUserMenu(false); router.push('/athlete-promote'); }}>
              <TrendingUp size={18} color="#8B5CF6" style={{ marginRight: 10 }} />
              <Text style={styles.userMenuText}>Promote</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.userMenuItem} onPress={() => { setShowUserMenu(false); router.push('/athlete-settings'); }}>
              <Settings size={18} color="#3B82F6" style={{ marginRight: 10 }} />
              <Text style={styles.userMenuText}>Settings</Text>
            </TouchableOpacity>
            <View style={styles.userMenuDivider} />
            <TouchableOpacity style={styles.userMenuItem} onPress={handleLogout} disabled={logoutLoading}>
              <LogOut size={18} color="#EF4444" style={{ marginRight: 10 }} />
              <Text style={[styles.userMenuText, { color: '#EF4444' }]}>{logoutLoading ? 'Logging out...' : 'Logout'}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/athlete-home')}>
          <Home size={22} color="#666" />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/content')}>
          <FileText size={22} color="#666" />
          <Text style={styles.navLabel}>Content</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/athlete-messaging')}>
          <MessageCircle size={22} color="#666" />
          <Text style={styles.navLabel}>Messages</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/athlete-feedback')}>
          <MessageSquare size={22} color="#666" />
          <Text style={styles.navLabel}>Feedback</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => setShowUserMenu(true)}>
          <User size={22} color="#4a90e2" />
          <Text style={[styles.navLabel, styles.navActive]}>Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
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
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
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
    letterSpacing: 0.5,
    fontFamily: 'System',
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
  coverPhotoContainer: {
    height: 192,
    backgroundColor: '#3B82F6',
    position: 'relative',
    overflow: 'hidden',
  },
  coverPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  coverPhotoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#3B82F6',
  },
  coverPhotoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  coverPhotoEditButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    backdropFilter: 'blur(10px)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  coverPhotoEditText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  mainContent: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginTop: -16,
    zIndex: 1,
  },
  profileImageContainer: {
    marginBottom: 16,
  },
  profileImageWrapper: {
    position: 'relative',
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileImageEditButton: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  profileSubtitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileRole: {
    fontSize: 16,
    color: '#6B7280',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 16,
    color: '#F59E0B',
    fontWeight: '600',
  },
  editFields: {
    width: '100%',
    gap: 12,
  },
  nameRow: {
    flexDirection: 'row',
    gap: 8,
  },
  nameInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  infoRow: {
    flexDirection: 'row',
    gap: 8,
  },
  infoInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1F2937',
  },
  bioInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1F2937',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actionButtons: {
    width: '100%',
    alignItems: 'center',
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  editProfileText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  saveButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginLeft: 8,
  },
  sectionContent: {
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    width: 120,
  },
  detailValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  achievementText: {
    fontSize: 14,
    color: '#6B7280',
  },
  certificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  certificationText: {
    fontSize: 14,
    color: '#6B7280',
  },
  expertiseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expertiseText: {
    fontSize: 14,
    color: '#6B7280',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingVertical: 8,
    gap: 6,
  },
  addButtonText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 100, // Position below header
  },
  userMenuCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    margin: 16,
    padding: 16,
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  userMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  userMenuText: {
    fontSize: 16,
    color: '#1F2937',
  },
  userMenuDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 8,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
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