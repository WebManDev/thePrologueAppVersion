import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Home, FileText, MessageSquare, MessageCircle, Bell, User, Plus, Search, Filter } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface AthleteData {
  firstName?: string;
  lastName?: string;
  name?: string;
  bio?: string;
  email?: string;
  coverPhotoUrl?: string;
  [key: string]: any;
}

export default function AthleteHome() {
  const [athleteData, setAthleteData] = useState<AthleteData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
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

  const navigateToProfile = () => {
    router.push('/Dashboard');
  };

  const getInitials = (firstName?: string, lastName?: string): string => {
    if (!firstName && !lastName) return 'AL';
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return first + last || 'AL';
  };

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

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <LinearGradient
        colors={['#f8f9fa', '#ffffff']}
        style={styles.header}
      >
        <View style={styles.headerTop}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Good morning,</Text>
            <Text style={styles.userName}>{athleteData?.firstName || 'Athlete'} 👋</Text>
          </View>
          <TouchableOpacity style={styles.profileButton} onPress={navigateToProfile}>
            {athleteData?.coverPhotoUrl ? (
              <Image source={{ uri: athleteData.coverPhotoUrl }} style={styles.headerProfileImage} />
            ) : (
              <View style={styles.headerProfileImage}>
                <Text style={styles.headerInitials}>{initials}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Search color="#666" size={18} />
            <Text style={styles.searchText}>Search athletes, sessions...</Text>
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Filter color="#4a90e2" size={20} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionCard}>
            <LinearGradient
              colors={['#4a90e2', '#357abd']}
              style={styles.actionGradient}
            >
              <Plus color="#fff" size={24} />
              <Text style={styles.actionText}>New Session</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionCard}>
            <LinearGradient
              colors={['#f59e0b', '#d97706']}
              style={styles.actionGradient}
            >
              <MessageSquare color="#fff" size={24} />
              <Text style={styles.actionText}>Get Feedback</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Performance Overview */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Performance Overview</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.performanceCards}>
            <View style={styles.performanceCard}>
              <Text style={styles.performanceIcon}>🎯</Text>
              <Text style={styles.performanceNumber}>8</Text>
              <Text style={styles.performanceLabel}>Goals This Week</Text>
              <Text style={styles.performanceChange}>+2 from last week</Text>
            </View>
            
            <View style={styles.performanceCard}>
              <Text style={styles.performanceIcon}>📈</Text>
              <Text style={styles.performanceNumber}>94%</Text>
              <Text style={styles.performanceLabel}>Completion Rate</Text>
              <Text style={styles.performanceChange}>+5% improvement</Text>
            </View>
          </View>
        </View>

        {/* Recent Activity Feed */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.activityFeed}>
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Text style={styles.activityEmoji}>🏆</Text>
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Session completed with Coach Sarah</Text>
                <Text style={styles.activityTime}>2 hours ago</Text>
              </View>
              <View style={styles.activityBadge}>
                <Text style={styles.activityBadgeText}>New</Text>
              </View>
            </View>
            
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Text style={styles.activityEmoji}>💪</Text>
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Strength training goal achieved</Text>
                <Text style={styles.activityTime}>1 day ago</Text>
              </View>
            </View>
            
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Text style={styles.activityEmoji}>📝</Text>
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Feedback received on technique</Text>
                <Text style={styles.activityTime}>2 days ago</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Upcoming Sessions */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Schedule</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.sessionCard}>
            <LinearGradient
              colors={['#ffffff', '#f8f9fa']}
              style={styles.sessionGradient}
            >
              <View style={styles.sessionHeader}>
                <View style={styles.sessionCoach}>
                  <View style={styles.coachAvatar}>
                    <Text style={styles.coachInitials}>MJ</Text>
                  </View>
                  <View>
                    <Text style={styles.coachName}>Coach Michael Johnson</Text>
                    <Text style={styles.sessionType}>Tennis • 1-on-1</Text>
                  </View>
                </View>
                <View style={styles.sessionTime}>
                  <Text style={styles.sessionDate}>Today</Text>
                  <Text style={styles.sessionHour}>3:00 PM</Text>
                </View>
              </View>
              
              <View style={styles.sessionActions}>
                <TouchableOpacity style={styles.sessionActionButton}>
                  <Text style={styles.sessionActionText}>Join Session</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.sessionSecondaryButton}>
                  <MessageCircle color="#4a90e2" size={16} />
                  <Text style={styles.sessionSecondaryText}>Message</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Bottom padding for navigation */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Home color="#4a90e2" size={20} />
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
        <TouchableOpacity style={styles.navItem} onPress={navigateToProfile}>
          <User color="#666" size={20} />
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
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  profileButton: {
    marginLeft: 16,
  },
  headerProfileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInitials: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  searchText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#999',
  },
  filterButton: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  quickActions: {
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 32,
  },
  actionCard: {
    flex: 1,
    marginHorizontal: 6,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  actionGradient: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  sectionContainer: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllText: {
    fontSize: 14,
    color: '#4a90e2',
    fontWeight: '600',
  },
  performanceCards: {
    flexDirection: 'row',
  },
  performanceCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 6,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  performanceIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  performanceNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  performanceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  performanceChange: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
  },
  activityFeed: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityEmoji: {
    fontSize: 18,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#666',
  },
  activityBadge: {
    backgroundColor: '#4a90e2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activityBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  sessionCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  sessionGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sessionCoach: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  coachAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4a90e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  coachInitials: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  coachName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  sessionType: {
    fontSize: 14,
    color: '#666',
  },
  sessionTime: {
    alignItems: 'flex-end',
  },
  sessionDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  sessionHour: {
    fontSize: 14,
    color: '#666',
  },
  sessionActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionActionButton: {
    backgroundColor: '#4a90e2',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginRight: 12,
  },
  sessionActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  sessionSecondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  sessionSecondaryText: {
    fontSize: 14,
    color: '#4a90e2',
    marginLeft: 6,
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