import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Home, FileText, MessageSquare, MessageCircle, Bell, User } from 'lucide-react-native';

interface AthleteData {
  firstName?: string;
  lastName?: string;
  name?: string;
  bio?: string;
  email?: string;
  coverPhotoUrl?: string;
  [key: string]: any;
}

export default function Dashboard() {
  const [athleteData, setAthleteData] = useState<AthleteData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Fetch athlete data from Firestore
          const athleteDoc = await getDoc(doc(db, 'athletes', user.uid));
          if (athleteDoc.exists()) {
            setAthleteData(athleteDoc.data() as AthleteData);
          }
        } catch (error) {
          console.error('Error fetching athlete data:', error);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Helper function to get initials
  const getInitials = (firstName?: string, lastName?: string): string => {
    if (!firstName && !lastName) return 'AL';
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return first + last || 'AL';
  };

  // Helper function to get display name
  const getDisplayName = (firstName?: string, lastName?: string, name?: string): string => {
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    return name || 'Student Athlete';
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const initials = getInitials(athleteData?.firstName, athleteData?.lastName);
  const displayName = getDisplayName(athleteData?.firstName, athleteData?.lastName, athleteData?.name);
  const bio = athleteData?.bio || 'Golf, Basketball Player • Class of';
  const email = athleteData?.email || '';

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appName}>PROLOGUE</Text>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileImageContainer}>
            {athleteData?.coverPhotoUrl ? (
              <Image source={{ uri: athleteData.coverPhotoUrl }} style={styles.profileImage} />
            ) : (
              <View style={styles.profileImage}>
                <Text style={styles.initials}>{initials}</Text>
              </View>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.role}>Professional Athlete</Text>
            <Text style={styles.description}>Tennis Athlete • Experience</Text>
            <Text style={styles.rating}>⭐ 4.9/5.0 Rating</Text>
          </View>
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editIcon}>✏️</Text>
            <Text style={styles.editText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Bar */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>👥</Text>
            <Text style={styles.statNumber}>18</Text>
            <Text style={styles.statLabel}>Active Athletes</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>⏱️</Text>
            <Text style={styles.statNumber}>Under 2 hours</Text>
            <Text style={styles.statLabel}>Response Time</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>✅</Text>
            <Text style={styles.statNumber}>94%</Text>
            <Text style={styles.statLabel}>Success Rate</Text>
          </View>
        </View>

        {/* Main Stats Cards */}
        <View style={styles.mainStatsContainer}>
          <View style={styles.mainStatCard}>
            <Text style={styles.mainStatNumber}>24</Text>
            <Text style={styles.mainStatLabel}>Total Athletes</Text>
            <Text style={styles.mainStatIcon}>👥</Text>
          </View>
          <View style={styles.mainStatCard}>
            <Text style={styles.mainStatNumber}>12</Text>
            <Text style={styles.mainStatLabel}>This Week</Text>
            <Text style={styles.mainStatIcon}>✅</Text>
          </View>
          <View style={styles.mainStatCard}>
            <Text style={styles.mainStatNumber}>342</Text>
            <Text style={styles.mainStatLabel}>Total Sessions</Text>
            <Text style={styles.mainStatIcon}>📊</Text>
          </View>
          <View style={styles.mainStatCard}>
            <Text style={styles.mainStatNumber}>4.9</Text>
            <Text style={styles.mainStatLabel}>Avg Rating</Text>
            <Text style={styles.mainStatIcon}>⭐</Text>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tab, styles.activeTab]}>
            <Text style={[styles.tabText, styles.activeTabText]}>Overview</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabText}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabText}>Certs</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tab}>
            <Text style={styles.tabText}>Skills</Text>
          </TouchableOpacity>
        </View>

        {/* Content Sections */}
        <View style={styles.contentContainer}>
          {/* About Me Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>👤</Text>
              <Text style={styles.sectionTitle}>About Me</Text>
            </View>
            <Text style={styles.sectionContent}>{bio || 'Professional tennis athlete with years of experience coaching players at all levels.'}</Text>
          </View>

          {/* Key Achievements Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>🏆</Text>
              <Text style={styles.sectionTitle}>Key Achievements</Text>
            </View>
            <View style={styles.achievementsList}>
              <Text style={styles.achievementItem}>• Regional Tennis Championship Winner</Text>
              <Text style={styles.achievementItem}>• Certified Tennis Coach (Level 3)</Text>
              <Text style={styles.achievementItem}>• 5+ Years Coaching Experience</Text>
              <Text style={styles.achievementItem}>• 100+ Students Trained</Text>
            </View>
          </View>

          {/* Quick Info Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Info</Text>
            <View style={styles.quickInfoContainer}>
              <View style={styles.quickInfoItem}>
                <Text style={styles.quickInfoIcon}>📍</Text>
                <Text style={styles.quickInfoText}>Location</Text>
              </View>
              <View style={styles.quickInfoItem}>
                <Text style={styles.quickInfoIcon}>🎓</Text>
                <Text style={styles.quickInfoText}>Class of {athleteData?.graduationYear || '2024'}</Text>
              </View>
              <View style={styles.quickInfoItem}>
                <Text style={styles.quickInfoIcon}>🏃‍♂️</Text>
                <Text style={styles.quickInfoText}>Experience</Text>
              </View>
            </View>
          </View>

          {/* Contact Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact</Text>
            <View style={styles.contactContainer}>
              <Text style={styles.contactLabel}>Email</Text>
              <Text style={styles.contactValue}>{email || '0@gmail.com'}</Text>
              <Text style={styles.contactLabel}>Phone</Text>
              <Text style={styles.contactValue}>{athleteData?.phone || 'Not provided'}</Text>
              
              <TouchableOpacity style={styles.sendMessageButton}>
                <Text style={styles.sendMessageIcon}>💬</Text>
                <Text style={styles.sendMessageText}>Send Message</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Profile Completion */}
        <View style={styles.completionCard}>
          <View style={styles.completionHeader}>
            <Text style={styles.completionIcon}>🎯</Text>
            <Text style={styles.completionTitle}>Profile Completion</Text>
            <Text style={styles.completionArrow}>›</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={styles.progressFill} />
          </View>
          <Text style={styles.progressText}>0/5 completed (0%)</Text>
        </View>

        {/* Debug Info - Remove in production */}
        {athleteData && (
          <View style={styles.debugInfo}>
            <Text style={styles.debugTitle}>Profile Data:</Text>
            <Text style={styles.debugText}>Name: {displayName}</Text>
            <Text style={styles.debugText}>Email: {email}</Text>
            <Text style={styles.debugText}>Bio: {bio}</Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Home color="#666" size={20} />
          <Text style={[styles.navLabel, styles.navActive]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <FileText color="#666" size={20} />
          <Text style={styles.navLabel}>Content</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <MessageSquare color="#666" size={20} />
          <Text style={styles.navLabel}>Feedback</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <MessageCircle color="#666" size={20} />
          <Text style={styles.navLabel}>Messages</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Bell color="#666" size={20} />
          <Text style={styles.navLabel}>Notifications</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <User color="#4a90e2" size={20} />
          <Text style={[styles.navLabel, styles.navActive]}>Profile</Text>
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
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profileHeader: {
    backgroundColor: '#4a90e2',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  profileImageContainer: {
    marginBottom: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4a90e2',
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  role: {
    fontSize: 16,
    color: '#b3d4f1',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  rating: {
    fontSize: 14,
    color: '#fff',
    marginTop: 8,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  editIcon: {
    marginRight: 8,
    fontSize: 16,
  },
  editText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e9ecef',
    marginHorizontal: 12,
  },
  mainStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  mainStatCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  mainStatNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  mainStatLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  mainStatIcon: {
    fontSize: 24,
    marginTop: 12,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  activeTab: {
    backgroundColor: '#4a90e2',
    borderRadius: 10,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#fff',
  },
  contentContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  achievementsList: {
    marginTop: 8,
  },
  achievementItem: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  quickInfoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  quickInfoItem: {
    alignItems: 'center',
  },
  quickInfoIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  quickInfoText: {
    fontSize: 12,
    color: '#666',
  },
  contactContainer: {
    marginTop: 12,
  },
  contactLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  sendMessageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4a90e2',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  sendMessageIcon: {
    marginRight: 8,
    fontSize: 16,
  },
  sendMessageText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  completionCard: {
    backgroundColor: '#e3f2fd',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  completionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  completionIcon: {
    marginRight: 8,
    fontSize: 16,
  },
  completionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#4a90e2',
  },
  completionArrow: {
    fontSize: 18,
    color: '#4a90e2',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#fff',
    borderRadius: 3,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    width: '0%', // Placeholder for progress
    backgroundColor: '#333',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingTop: 12,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  navLabel: {
    fontSize: 12,
    color: '#666',
  },
  navActive: {
    color: '#4a90e2',
    fontWeight: '600',
  },
  debugInfo: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 14,
    marginBottom: 4,
  },
}); 