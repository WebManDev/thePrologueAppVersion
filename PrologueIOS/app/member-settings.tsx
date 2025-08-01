import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, Pressable,
  TextInput, Alert, ActivityIndicator, Switch, Alert as RNAlert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged, updatePassword, reauthenticateWithCredential, EmailAuthProvider, updateEmail, fetchSignInMethodsForEmail, verifyBeforeUpdateEmail } from 'firebase/auth';
import { Home, BookOpen, Eye, MessageSquare, MessageCircle, User, Search, Settings, LogOut, ChevronDown, Heart, MessageCircle as MessageCircleIcon, Share, MoreHorizontal, Edit, Trash2, Camera, Video, Target, Crown, Zap, Bookmark, Send, Repeat2, X, Plus, Star, Clock, CheckCircle, AlertCircle, Filter, MapPin, Calendar, Upload, FileText, Users, ThumbsUp, ThumbsDown, Phone, Paperclip, Smile, Archive, MoreVertical, TrendingUp, Verified, Lock, Save, CreditCard, EyeOff, Loader2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface MemberData {
  firstName?: string;
  lastName?: string;
  name?: string;
  bio?: string;
  email?: string;
  phone?: string;
  profileImageUrl?: string;
  subscriptions?: {[athleteId: string]: any};
  [key: string]: any;
}

interface AthleteData {
  id: string;
  name: string;
  profilePicture?: string;
  [key: string]: any;
}

export default function MemberSettingsScreen() {
  const [memberData, setMemberData] = useState<MemberData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [athleteData, setAthleteData] = useState<Record<string, AthleteData>>({});
  const router = useRouter();

  // Settings state
  const [settings, setSettings] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  // Password change state
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [changingPassword, setChangingPassword] = useState(false);

  // Email change state
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailChangeData, setEmailChangeData] = useState({
    currentPassword: "",
    newEmail: "",
  });
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [changingEmail, setChangingEmail] = useState(false);

  // Portal loading state
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          // Reload user to get latest auth state
          await user.reload();
          
          const docRef = doc(db, "members", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const memberData = docSnap.data();
            setMemberData({ id: user.uid, ...memberData });
            
            // Always use Firebase Auth email as the source of truth
            const authEmail = user.email || "";
            
            // Always keep Firestore in sync with Auth email
            if (authEmail) {
              await updateDoc(docRef, {
                email: authEmail,
                updatedAt: new Date().toISOString()
              });
            }
            
            // Update settings with member data (email always from Firebase Auth)
            setSettings({
              firstName: memberData.firstName || "",
              lastName: memberData.lastName || "",
              email: authEmail,
              phone: memberData.phone || "",
            });

            // Fetch athlete data for subscriptions
            if (memberData.subscriptions) {
              const athleteIds = Object.keys(memberData.subscriptions);
              const newAthleteData: Record<string, AthleteData> = {};
              for (const athleteId of athleteIds) {
                try {
                  const athleteDoc = await getDoc(doc(db, "athletes", athleteId));
                  if (athleteDoc.exists()) {
                                      const athleteData = athleteDoc.data();
                  newAthleteData[athleteId] = {
                    id: athleteId,
                    name: athleteData.name || "Athlete",
                    ...athleteData
                  };
                  }
                } catch (e) {
                  console.error("Error fetching athlete data:", e);
                }
              }
              setAthleteData(newAthleteData);
            }
          }
          setLoading(false);
        } catch (error) {
          console.error('Error fetching member data:', error);
          setLoading(false);
        }
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const getInitials = (firstName?: string, lastName?: string): string => {
    if (!firstName && !lastName) return 'ML';
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return first + last || 'ML';
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await auth.signOut();
      router.replace('/');
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      setLogoutLoading(false);
      setShowUserMenu(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!auth.currentUser) {
      Alert.alert("Not Logged In", "Please log in to save settings.");
      return;
    }

    setSaving(true);
    try {
      const memberRef = doc(db, "members", auth.currentUser.uid);
      await updateDoc(memberRef, {
        firstName: settings.firstName,
        lastName: settings.lastName,
        phone: settings.phone,
        // Email is always synced from Firebase Auth automatically
        email: auth.currentUser.email || "",
        updatedAt: new Date().toISOString()
      });
      Alert.alert("Success", "Your profile settings have been updated successfully.");
    } catch (error) {
      console.error("Error saving settings:", error);
      Alert.alert("Error", "Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!auth.currentUser) {
      Alert.alert("Not Logged In", "Please log in to change your password.");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert("Password Mismatch", "New passwords don't match. Please try again.");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      Alert.alert("Password Too Short", "Password must be at least 6 characters long.");
      return;
    }

    setChangingPassword(true);

    try {
      // Re-authenticate the user with their current password
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email!,
        passwordData.currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);

      // Update the password
      await updatePassword(auth.currentUser, passwordData.newPassword);

      // Reset form and close dialog
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setShowPasswordDialog(false);

      Alert.alert("Success", "Your password has been updated successfully.");
    } catch (error: any) {
      console.error("Error changing password:", error);
      let errorMessage = "Failed to change password. Please try again.";
      
      if (error.code === "auth/wrong-password") {
        errorMessage = "Current password is incorrect.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "New password is too weak. Please choose a stronger password.";
      } else if (error.code === "auth/requires-recent-login") {
        errorMessage = "Please log out and log back in, then try changing your password again.";
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleChangeEmail = async () => {
    if (!auth.currentUser) {
      Alert.alert("Not Logged In", "Please log in to change your email.");
      return;
    }

    // Basic validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailChangeData.newEmail)) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    if (emailChangeData.newEmail === auth.currentUser.email) {
      Alert.alert("Same Email", "This is already your current email address.");
      return;
    }

    setChangingEmail(true);

    try {
      // First, check if the new email is already taken
      const signInMethods = await fetchSignInMethodsForEmail(auth, emailChangeData.newEmail);
      if (signInMethods.length > 0) {
        Alert.alert("Email Already Taken", "This email address is already associated with another account.");
        return;
      }

      // Re-authenticate the user with their current password
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email!,
        emailChangeData.currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);

      // Send verification email for the new email address
      await verifyBeforeUpdateEmail(auth.currentUser, emailChangeData.newEmail);

      // Reset form and close dialog
      setEmailChangeData({ currentPassword: "", newEmail: "" });
      setShowEmailDialog(false);

      Alert.alert(
        "Verification Email Sent", 
        `A verification email has been sent to ${emailChangeData.newEmail}. Please check your inbox and click the link to complete the email change.`
      );
    } catch (error: any) {
      console.error("Error changing email:", error);
      let errorMessage = "Failed to change email. Please try again.";
      
      if (error.code === "auth/wrong-password") {
        errorMessage = "Current password is incorrect.";
      } else if (error.code === "auth/email-already-in-use") {
        errorMessage = "This email address is already associated with another account.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "The email address is invalid.";
      } else if (error.code === "auth/requires-recent-login") {
        errorMessage = "Please log out and log back in, then try changing your email again.";
      } else if (error.code === "auth/operation-not-allowed") {
        errorMessage = "Email change is not allowed. Please contact support.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many email change requests. Please try again later.";
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setChangingEmail(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!auth.currentUser) {
      Alert.alert("Not Logged In", "Please log in to delete your account.");
      return;
    }

    RNAlert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Delete Firestore document
              await deleteDoc(doc(db, "members", auth.currentUser.uid));
              // Delete Auth user
              await auth.currentUser.delete();
              // Log out and redirect
              await auth.signOut();
              router.replace('/');
            } catch (error: any) {
              if (error.code === "auth/requires-recent-login") {
                Alert.alert("Error", "Please re-authenticate and try again.");
              } else {
                Alert.alert("Error", error.message || "Account deletion failed. Please try again.");
              }
            }
          }
        }
      ]
    );
  };

  const handleManageSubscriptions = async () => {
    setPortalLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not logged in");
      
      // For now, just show an alert since we don't have the API endpoint
      Alert.alert("Manage Subscriptions", "Subscription management will be available soon.");
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to open subscription portal");
    } finally {
      setPortalLoading(false);
    }
  };

  const initials = getInitials(memberData?.firstName, memberData?.lastName);
  const displayName = memberData?.firstName && memberData?.lastName ? `${memberData.firstName} ${memberData.lastName}` : 'Member';

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
        <TouchableOpacity onPress={() => router.push('/member-settings')} style={styles.logoRow}>
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

      {/* Main Content */}
      <ScrollView style={styles.mainContent}>
        {/* Page Header */}
        <View style={styles.pageHeader}>
          <View style={styles.headerIcon}>
            <Settings size={24} color="#fff" />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.pageTitle}>Settings</Text>
            <Text style={styles.pageSubtitle}>Manage your account preferences and privacy settings</Text>
          </View>
        </View>

        {/* Account Information */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <User size={20} color="#374151" />
            <Text style={styles.sectionTitle}>Account Information</Text>
          </View>
          
          <View style={styles.formSection}>
            <View style={styles.inputRow}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>First Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={settings.firstName}
                  onChangeText={(text) => setSettings({ ...settings, firstName: text })}
                  placeholder="Enter your first name"
                  editable={!saving}
                />
                {!settings.firstName && (
                  <Text style={styles.inputHint}>📝 Add your first name</Text>
                )}
              </View>
              
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Last Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={settings.lastName}
                  onChangeText={(text) => setSettings({ ...settings, lastName: text })}
                  placeholder="Enter your last name"
                  editable={!saving}
                />
                {!settings.lastName && (
                  <Text style={styles.inputHint}>📝 Add your last name</Text>
                )}
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email Address</Text>
                              <TextInput
                  style={[styles.textInput, styles.disabledInput]}
                  value={auth.currentUser?.email || settings.email || ""}
                  editable={false}
                />
              <Text style={styles.inputHint}>
                This email is directly linked to your authentication account. To change it, use the secure change option below.
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.textInput}
                value={settings.phone}
                onChangeText={(text) => setSettings({ ...settings, phone: text })}
                placeholder="Enter your phone number"
                editable={!saving}
                keyboardType="phone-pad"
              />
              {!settings.phone && (
                <Text style={styles.inputHint}>📞 Add your phone number for coaches to contact you</Text>
              )}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={styles.textInput}
                value={settings.phone}
                onChangeText={(text) => setSettings({ ...settings, phone: text })}
                placeholder="Enter your phone number"
                editable={!saving}
                keyboardType="phone-pad"
              />
              {!settings.phone && (
                <Text style={styles.inputHint}>📞 Add your phone number for coaches to contact you</Text>
              )}
            </View>
          </View>
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Lock size={20} color="#374151" />
            <Text style={styles.sectionTitle}>Security</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowEmailDialog(true)}
          >
            <User size={16} color="#6b7280" />
            <Text style={styles.actionButtonText}>Change Email</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowPasswordDialog(true)}
          >
            <Lock size={16} color="#6b7280" />
            <Text style={styles.actionButtonText}>Change Password</Text>
          </TouchableOpacity>
        </View>

        {/* Payments Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CreditCard size={20} color="#374151" />
            <Text style={styles.sectionTitle}>Payments</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleManageSubscriptions}
            disabled={portalLoading}
          >
            <CreditCard size={16} color="#6b7280" />
            <Text style={styles.actionButtonText}>
              {portalLoading ? "Loading..." : "Manage Subscriptions"}
            </Text>
          </TouchableOpacity>

          {/* Subscriptions Table */}
          {memberData?.subscriptions && Object.keys(memberData.subscriptions).length > 0 && (
            <View style={styles.subscriptionsSection}>
              <Text style={styles.subscriptionsTitle}>Your Subscriptions</Text>
              <View style={styles.subscriptionsTable}>
                <View style={styles.tableHeader}>
                  <Text style={styles.tableHeaderText}>Athlete</Text>
                  <Text style={styles.tableHeaderText}>Plan</Text>
                  <Text style={styles.tableHeaderText}>Status</Text>
                </View>
                {Object.entries(memberData.subscriptions).map(([athleteId, sub]: [string, any]) => {
                  const athlete = athleteData[athleteId];
                  return (
                    <View key={athleteId} style={styles.tableRow}>
                      <View style={styles.athleteCell}>
                        {athlete?.profilePicture && (
                          <Image source={{ uri: athlete.profilePicture }} style={styles.athleteAvatar} />
                        )}
                        <Text style={styles.athleteName}>{athlete?.name || athleteId}</Text>
                      </View>
                      <Text style={styles.tableCell}>{sub.plan}</Text>
                      <Text style={styles.tableCell}>{sub.status}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <AlertCircle size={20} color="#EF4444" />
            <Text style={[styles.sectionTitle, styles.dangerText]}>Danger Zone</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.dangerButton]}
            onPress={handleDeleteAccount}
          >
            <Trash2 size={16} color="#EF4444" />
            <Text style={[styles.actionButtonText, styles.dangerText]}>Delete Account</Text>
          </TouchableOpacity>
        </View>

        {/* Save Button */}
        <TouchableOpacity 
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSaveSettings}
          disabled={saving}
        >
          <Save size={16} color="#fff" />
          <Text style={styles.saveButtonText}>
            {saving ? "Saving..." : "Save Settings"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Password Change Modal */}
      <Modal
        visible={showPasswordDialog}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPasswordDialog(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <Text style={styles.modalDescription}>
                Enter your current password and choose a new one. Your password must be at least 6 characters long.
              </Text>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Current Password</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    secureTextEntry={!showPasswords.current}
                    value={passwordData.currentPassword}
                    onChangeText={(text) => setPasswordData({ ...passwordData, currentPassword: text })}
                    placeholder="Enter current password"
                    editable={!changingPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                  >
                    {showPasswords.current ? <EyeOff size={16} color="#6b7280" /> : <Eye size={16} color="#6b7280" />}
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>New Password</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    secureTextEntry={!showPasswords.new}
                    value={passwordData.newPassword}
                    onChangeText={(text) => setPasswordData({ ...passwordData, newPassword: text })}
                    placeholder="Enter new password"
                    editable={!changingPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                  >
                    {showPasswords.new ? <EyeOff size={16} color="#6b7280" /> : <Eye size={16} color="#6b7280" />}
                  </TouchableOpacity>
                </View>
                <Text style={styles.inputHint}>Must be at least 6 characters long</Text>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Confirm New Password</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    secureTextEntry={!showPasswords.confirm}
                    value={passwordData.confirmPassword}
                    onChangeText={(text) => setPasswordData({ ...passwordData, confirmPassword: text })}
                    placeholder="Confirm new password"
                    editable={!changingPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                  >
                    {showPasswords.confirm ? <EyeOff size={16} color="#6b7280" /> : <Eye size={16} color="#6b7280" />}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => {
                  setShowPasswordDialog(false);
                  setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                }}
                disabled={changingPassword}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword || changingPassword) && styles.confirmButtonDisabled
                ]}
                onPress={handleChangePassword}
                disabled={
                  changingPassword ||
                  !passwordData.currentPassword ||
                  !passwordData.newPassword ||
                  !passwordData.confirmPassword
                }
              >
                {changingPassword ? (
                  <>
                    <Loader2 size={16} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.confirmButtonText}>Changing...</Text>
                  </>
                ) : (
                  <Text style={styles.confirmButtonText}>Change Password</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Email Change Modal */}
      <Modal
        visible={showEmailDialog}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEmailDialog(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Email Address</Text>
              <Text style={styles.modalDescription}>
                Enter your current password and your new email address. A verification email will be sent to the new address to complete the change securely.
              </Text>
            </View>
            
            <View style={styles.modalBody}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Current Password</Text>
                <View style={styles.passwordInputContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    secureTextEntry={!showEmailPassword}
                    value={emailChangeData.currentPassword}
                    onChangeText={(text) => setEmailChangeData({ ...emailChangeData, currentPassword: text })}
                    placeholder="Enter your current password"
                    editable={!changingEmail}
                  />
                  <TouchableOpacity
                    style={styles.eyeButton}
                    onPress={() => setShowEmailPassword(!showEmailPassword)}
                  >
                    {showEmailPassword ? <EyeOff size={16} color="#6b7280" /> : <Eye size={16} color="#6b7280" />}
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>New Email Address</Text>
                <TextInput
                  style={styles.textInput}
                  value={emailChangeData.newEmail}
                  onChangeText={(text) => setEmailChangeData({ ...emailChangeData, newEmail: text })}
                  placeholder="Enter your new email address"
                  editable={!changingEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <Text style={styles.inputHint}>A verification link will be sent to this email address</Text>
              </View>
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowEmailDialog(false)}
                disabled={changingEmail}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  (!emailChangeData.currentPassword || !emailChangeData.newEmail || changingEmail) && styles.confirmButtonDisabled
                ]}
                onPress={handleChangeEmail}
                disabled={changingEmail || !emailChangeData.currentPassword || !emailChangeData.newEmail}
              >
                {changingEmail ? (
                  <>
                    <Loader2 size={16} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.confirmButtonText}>Sending Verification...</Text>
                  </>
                ) : (
                  <Text style={styles.confirmButtonText}>Send Verification Email</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/member-discover')}>
          <Eye size={22} color="#666" />
          <Text style={styles.navLabel}>Browse</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/member-feedback')}>
          <MessageSquare size={22} color="#666" />
          <Text style={styles.navLabel}>Feedback</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/member-messaging')}>
          <MessageCircle size={22} color="#666" />
          <Text style={styles.navLabel}>Messages</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => {}}>
          <Settings size={22} color="#4a90e2" />
          <Text style={[styles.navLabel, styles.navActive]}>Settings</Text>
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
  mainContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 16,
    color: '#6b7280',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
  },
  formSection: {
    gap: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputContainer: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
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
    backgroundColor: '#fff',
  },
  disabledInput: {
    backgroundColor: '#f9fafb',
    color: '#6b7280',
  },
  inputHint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    marginBottom: 8,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  dangerButton: {
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  dangerText: {
    color: '#EF4444',
  },
  subscriptionsSection: {
    marginTop: 16,
  },
  subscriptionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  subscriptionsTable: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  athleteCell: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  athleteAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  athleteName: {
    fontSize: 14,
    color: '#374151',
  },
  tableCell: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 24,
    marginBottom: 32,
  },
  saveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  modalContent: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  modalBody: {
    padding: 20,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  eyeButton: {
    padding: 12,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingVertical: 8,
    paddingHorizontal: 16,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
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