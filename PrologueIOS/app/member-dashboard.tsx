import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Modal,
  Pressable,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { Home, BookOpen, Eye, MessageSquare, MessageCircle, User, Search, Settings, LogOut, ChevronDown } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface MemberData {
  firstName?: string;
  lastName?: string;
  name?: string;
  bio?: string;
  email?: string;
  profileImageUrl?: string;
  [key: string]: any;
}

export default function MemberDashboard() {
  const [memberData, setMemberData] = useState<MemberData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const memberDoc = await getDoc(doc(db, 'members', user.uid));
          if (memberDoc.exists()) {
            setMemberData(memberDoc.data() as MemberData);
          }
        } catch (error) {
          console.error('Error fetching member data:', error);
        }
      }
      setLoading(false);
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
      await firebaseSignOut(auth);
      router.replace('/');
    } catch (e) {
      // handle error
    } finally {
      setLogoutLoading(false);
      setShowUserMenu(false);
    }
  };

  const initials = getInitials(memberData?.firstName, memberData?.lastName);
  const displayName = memberData?.firstName && memberData?.lastName ? `${memberData.firstName} ${memberData.lastName}` : 'Member';

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      {/* Sticky Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/member-dashboard')} style={styles.logoRow}>
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
              <Text style={[styles.userMenuText, { color: '#EF4444' }]}>{logoutLoading ? 'Logging out...' : 'Logout'}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Main Content */}
      <ScrollView style={styles.mainContent} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={styles.dashboardCard}>
          <Text style={styles.dashboardTitle}>Welcome, {displayName}!</Text>
          <Text style={styles.dashboardSubtitle}>This is your member dashboard. Discover athletes and improve your skills.</Text>
        </View>
        {/* Add your dashboard widgets/components here */}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/member-home')}>
          <Home size={22} color="#4a90e2" />
          <Text style={[styles.navLabel, styles.navActive]}>Home</Text>
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
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/member-settings')}>
          <User size={22} color="#666" />
          <Text style={styles.navLabel}>Settings</Text>
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
    padding: 16,
  },
  dashboardCard: {
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
  dashboardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  dashboardSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
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
    fontWeight: '600',
  },
}); 