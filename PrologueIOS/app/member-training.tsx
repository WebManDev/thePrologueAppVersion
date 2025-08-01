import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, Pressable,
  TextInput, Alert, ActivityIndicator, FlatList, RefreshControl
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, updateDoc, arrayUnion, arrayRemove, deleteDoc, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { Home, BookOpen, Eye, MessageSquare, MessageCircle, User, Search, Settings, LogOut, ChevronDown, Heart, MessageCircle as MessageCircleIcon, Share, MoreHorizontal, Edit, Trash2, Camera, Video, Target, Crown, Zap, Bookmark, Send, Repeat2, X, Plus, Star, Clock, CheckCircle, Trophy, Play, Award, Activity, Users, Edit3, Filter } from 'lucide-react-native';
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

interface WeeklyGoal {
  id: string;
  title: string;
  description: string;
  points: number;
  category: "content" | "engagement" | "learning" | "community" | "progress";
  target: number;
  current: number;
  completed: boolean;
  icon: any;
}

interface TrainingProgram {
  id: string;
  title: string;
  description: string;
  coach: string;
  coachAvatar?: string;
  thumbnail?: string;
  difficulty: string;
  category: string;
  rating: number;
  students: number;
  duration: string;
  sessions: number;
  completed: number;
  type: string;
}

export default function MemberTrainingScreen() {
  const [memberData, setMemberData] = useState<MemberData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [showGoalSelector, setShowGoalSelector] = useState(false);
  const [selectedGoals, setSelectedGoals] = useState<WeeklyGoal[]>([]);
  const [availableGoals, setAvailableGoals] = useState<WeeklyGoal[]>([]);
  const [weekExpiration, setWeekExpiration] = useState<Date>(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [totalPoints, setTotalPoints] = useState(150);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [creators, setCreators] = useState<{[key: string]: any}>({});
  const [refreshing, setRefreshing] = useState(false);
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

  // Initialize available goals
  useEffect(() => {
    const goals: WeeklyGoal[] = [
      {
        id: "1",
        title: "Watch 5 Training Videos",
        description: "Complete 5 educational training videos this week",
        points: 50,
        category: "content",
        target: 5,
        current: 2,
        completed: false,
        icon: Video,
      },
      {
        id: "2",
        title: "Message 3 Coaches",
        description: "Connect with 3 different coaches for guidance",
        points: 40,
        category: "engagement",
        target: 3,
        current: 1,
        completed: false,
        icon: MessageSquare,
      },
      {
        id: "3",
        title: "Complete 2 Courses",
        description: "Finish 2 complete training courses",
        points: 75,
        category: "learning",
        target: 2,
        current: 0,
        completed: false,
        icon: BookOpen,
      },
      {
        id: "4",
        title: "Subscribe to 2 Creators",
        description: "Follow 2 new creators for their content",
        points: 30,
        category: "community",
        target: 2,
        current: 1,
        completed: false,
        icon: Users,
      },
      {
        id: "5",
        title: "Browse Coaches 10 Times",
        description: "Explore coach profiles to find the right fit",
        points: 25,
        category: "engagement",
        target: 10,
        current: 4,
        completed: false,
        icon: Target,
      },
      {
        id: "6",
        title: "Like 15 Posts",
        description: "Engage with community content",
        points: 20,
        category: "community",
        target: 15,
        current: 8,
        completed: false,
        icon: Heart,
      },
      {
        id: "7",
        title: "Complete Profile Setup",
        description: "Finish setting up your member profile",
        points: 60,
        category: "progress",
        target: 1,
        current: 0,
        completed: false,
        icon: Award,
      },
      {
        id: "8",
        title: "Schedule 3 Sessions",
        description: "Book 3 training sessions with coaches",
        points: 80,
        category: "engagement",
        target: 3,
        current: 1,
        completed: false,
        icon: Clock,
      },
    ];

    setAvailableGoals(goals);

    // Set initial selected goals (first 4)
    if (selectedGoals.length === 0) {
      setSelectedGoals(goals.slice(0, 4));
    }
  }, [selectedGoals.length]);

  // Calculate days remaining
  const daysRemaining = Math.max(0, Math.ceil((weekExpiration.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)));

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

  const handleGoalSelection = (goalIds: string[]) => {
    if (goalIds.length > 4) {
      Alert.alert("Maximum Goals Reached", "You can only select up to 4 goals per week.");
      return;
    }

    const newSelectedGoals = availableGoals.filter((goal) => goalIds.includes(goal.id));
    setSelectedGoals(newSelectedGoals);
  };

  const completeGoal = (goalId: string) => {
    setSelectedGoals((prev) =>
      prev.map((goal) => {
        if (goal.id === goalId && !goal.completed) {
          const updatedGoal = { ...goal, completed: true, current: goal.target };

          // Add points to profile
          setTotalPoints((prevPoints) => prevPoints + goal.points);

          Alert.alert(
            "Goal Completed! 🎉",
            `You earned ${goal.points} points! Total: ${totalPoints + goal.points}`
          );

          return updatedGoal;
        }
        return goal;
      }),
    );
  };

  const resetWeeklyGoals = () => {
    setSelectedGoals([]);
    setWeekExpiration(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    setShowGoalSelector(true);

    Alert.alert("New Week Started", "Select your 4 goals for this week!");
  };

  // Auto-reset when week expires
  useEffect(() => {
    if (daysRemaining === 0) {
      resetWeeklyGoals();
    }
  }, [daysRemaining]);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "content":
        return { bg: "#dbeafe", text: "#1d4ed8", border: "#93c5fd" };
      case "engagement":
        return { bg: "#dcfce7", text: "#166534", border: "#86efac" };
      case "learning":
        return { bg: "#f3e8ff", text: "#7c3aed", border: "#c4b5fd" };
      case "community":
        return { bg: "#fed7aa", text: "#ea580c", border: "#fdba74" };
      case "progress":
        return { bg: "#fef3c7", text: "#d97706", border: "#fcd34d" };
      default:
        return { bg: "#f3f4f6", text: "#374151", border: "#d1d5db" };
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Refresh logic here
    setTimeout(() => setRefreshing(false), 1000);
  };

  const initials = getInitials(memberData?.firstName, memberData?.lastName);
  const displayName = memberData?.firstName && memberData?.lastName ? `${memberData.firstName} ${memberData.lastName}` : 'Member';

  const renderGoalCard = (goal: WeeklyGoal) => {
    const IconComponent = goal.icon;
    const progressPercentage = (goal.current / goal.target) * 100;
    const categoryColors = getCategoryColor(goal.category);

    return (
      <View key={goal.id} style={[styles.goalCard, { backgroundColor: categoryColors.bg }]}>
        <View style={styles.goalHeader}>
          <View style={styles.goalIconContainer}>
            <IconComponent size={20} color={categoryColors.text} />
          </View>
          <View style={styles.goalPoints}>
            <Text style={[styles.goalPointsText, { color: categoryColors.text }]}>+{goal.points} pts</Text>
            {goal.completed && <CheckCircle size={20} color="#16a34a" />}
          </View>
        </View>
        
        <Text style={styles.goalTitle}>{goal.title}</Text>
        <Text style={styles.goalDescription}>{goal.description}</Text>
        
        <View style={styles.goalProgress}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressText}>Progress</Text>
            <Text style={styles.progressText}>{goal.current}/{goal.target}</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
          </View>
        </View>
        
        {!goal.completed && goal.current >= goal.target && (
          <TouchableOpacity
            style={styles.completeButton}
            onPress={() => completeGoal(goal.id)}
          >
            <Trophy size={16} color="#fff" />
            <Text style={styles.completeButtonText}>Complete Goal</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderProgramCard = (program: TrainingProgram) => {
    const progressPercentage = (program.completed / program.sessions) * 100;

    return (
      <View key={program.id} style={styles.programCard}>
        <View style={styles.programImageContainer}>
          <Image
            source={{ uri: program.thumbnail || 'https://via.placeholder.com/300x200' }}
            style={styles.programImage}
            resizeMode="cover"
          />
        </View>
        
        <View style={styles.programContent}>
          <View style={styles.programHeader}>
            <View style={styles.programBadges}>
              <View style={[styles.badge, { backgroundColor: program.difficulty === "Advanced" ? "#3b82f6" : "#6b7280" }]}>
                <Text style={styles.badgeText}>{program.difficulty}</Text>
              </View>
              <View style={[styles.badge, styles.badgeOutline]}>
                <Text style={styles.badgeText}>{program.category}</Text>
              </View>
            </View>
          </View>
          
          <Text style={styles.programTitle}>{program.title}</Text>
          <Text style={styles.programDescription}>{program.description}</Text>
          
          <View style={styles.programMeta}>
            <View style={styles.programCoach}>
              <Image
                source={{ uri: program.coachAvatar || 'https://via.placeholder.com/24x24' }}
                style={styles.coachAvatar}
              />
              <Text style={styles.coachName}>{program.coach}</Text>
            </View>
            <View style={styles.programRating}>
              <Star size={16} color="#fbbf24" />
              <Text style={styles.ratingText}>{program.rating}</Text>
            </View>
            <Text style={styles.studentsText}>{program.students} students</Text>
          </View>
          
          <View style={styles.programStats}>
            <View style={styles.statItem}>
              <Clock size={16} color="#6b7280" />
              <Text style={styles.statText}>{program.duration}</Text>
            </View>
            <View style={styles.statItem}>
              <BookOpen size={16} color="#6b7280" />
              <Text style={styles.statText}>{program.sessions} sessions</Text>
            </View>
          </View>
          
          <View style={styles.programProgress}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progress</Text>
              <Text style={styles.progressText}>
                {program.completed}/{program.sessions} completed
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
            </View>
          </View>
          
          <View style={styles.programActions}>
            <TouchableOpacity style={styles.primaryButton}>
              <Play size={16} color="#fff" />
              <Text style={styles.primaryButtonText}>Continue Training</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>View Details</Text>
            </TouchableOpacity>
          </View>
        </View>
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
        <TouchableOpacity onPress={() => router.push('/member-training')} style={styles.logoRow}>
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

      {/* Goal Selector Modal */}
      <Modal
        visible={showGoalSelector}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGoalSelector(false)}
      >
        <View style={styles.goalSelectorModal}>
          <View style={styles.goalSelectorContent}>
            <View style={styles.goalSelectorHeader}>
              <Text style={styles.goalSelectorTitle}>Select Your Weekly Goals (Choose 4)</Text>
              <TouchableOpacity onPress={() => setShowGoalSelector(false)}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.goalSelectorList}>
              {availableGoals.map((goal) => {
                const IconComponent = goal.icon;
                const isSelected = selectedGoals.some((g) => g.id === goal.id);
                const categoryColors = getCategoryColor(goal.category);

                return (
                  <TouchableOpacity
                    key={goal.id}
                    style={[
                      styles.goalSelectorItem,
                      isSelected && { borderColor: '#3b82f6', backgroundColor: '#eff6ff' }
                    ]}
                    onPress={() => {
                      const currentIds = selectedGoals.map((g) => g.id);
                      if (isSelected) {
                        handleGoalSelection(currentIds.filter((id) => id !== goal.id));
                      } else if (currentIds.length < 4) {
                        handleGoalSelection([...currentIds, goal.id]);
                      }
                    }}
                  >
                    <View style={styles.goalSelectorItemContent}>
                      <View style={styles.goalSelectorCheckbox}>
                        {isSelected && <CheckCircle size={20} color="#3b82f6" />}
                      </View>
                      <View style={styles.goalSelectorItemInfo}>
                        <View style={styles.goalSelectorItemHeader}>
                          <IconComponent size={16} color={categoryColors.text} />
                          <Text style={styles.goalSelectorItemTitle}>{goal.title}</Text>
                        </View>
                        <Text style={styles.goalSelectorItemDescription}>{goal.description}</Text>
                        <View style={styles.goalSelectorItemFooter}>
                          <View style={[styles.categoryBadge, { backgroundColor: categoryColors.bg }]}>
                            <Text style={[styles.categoryBadgeText, { color: categoryColors.text }]}>
                              {goal.category}
                            </Text>
                          </View>
                          <View style={styles.pointsBadge}>
                            <Text style={styles.pointsBadgeText}>+{goal.points} pts</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            
            <View style={styles.goalSelectorFooter}>
              <Text style={styles.goalSelectorCount}>{selectedGoals.length}/4 goals selected</Text>
              <TouchableOpacity
                style={[
                  styles.saveGoalsButton,
                  selectedGoals.length !== 4 && styles.saveGoalsButtonDisabled
                ]}
                onPress={() => setShowGoalSelector(false)}
                disabled={selectedGoals.length !== 4}
              >
                <Text style={styles.saveGoalsButtonText}>Save Goals</Text>
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
        {/* Weekly Goals Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>Weekly Goals</Text>
              <View style={styles.goalBadges}>
                <View style={styles.goalBadge}>
                  <Text style={styles.goalBadgeText}>{daysRemaining} {daysRemaining === 1 ? "day" : "days"} remaining</Text>
                </View>
                <View style={styles.pointsBadge}>
                  <Text style={styles.pointsBadgeText}>{totalPoints} points</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity 
              style={styles.editGoalsButton}
              onPress={() => setShowGoalSelector(true)}
            >
              <Edit3 size={16} color="#3b82f6" />
              <Text style={styles.editGoalsButtonText}>Edit Goals</Text>
            </TouchableOpacity>
          </View>

          {selectedGoals.length === 0 ? (
            <View style={styles.emptyGoalsCard}>
              <Target size={48} color="#9ca3af" />
              <Text style={styles.emptyGoalsTitle}>No Goals Selected</Text>
              <Text style={styles.emptyGoalsText}>Choose 4 goals to start your weekly challenge</Text>
              <TouchableOpacity 
                style={styles.selectGoalsButton}
                onPress={() => setShowGoalSelector(true)}
              >
                <Plus size={16} color="#fff" />
                <Text style={styles.selectGoalsButtonText}>Select Goals</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.goalsGrid}>
              {selectedGoals.map(renderGoalCard)}
            </View>
          )}

          {daysRemaining === 0 && (
            <View style={styles.expiredCard}>
              <View style={styles.expiredContent}>
                <Clock size={20} color="#dc2626" />
                <Text style={styles.expiredText}>Week Expired</Text>
              </View>
              <TouchableOpacity style={styles.startNewWeekButton} onPress={resetWeeklyGoals}>
                <Text style={styles.startNewWeekButtonText}>Start New Week</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Training Programs Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Training Programs</Text>
            <TouchableOpacity style={styles.filterButton}>
              <Filter size={16} color="#6b7280" />
              <Text style={styles.filterButtonText}>
                {selectedFilter === "all" ? "All" : selectedFilter.replace("-", " ")}
              </Text>
              <ChevronDown size={16} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.programsList}>
            {programs.length === 0 ? (
              <View style={styles.emptyProgramsCard}>
                <BookOpen size={48} color="#9ca3af" />
                <Text style={styles.emptyProgramsTitle}>No Training Programs</Text>
                <Text style={styles.emptyProgramsText}>Subscribe to coaches to see their training programs</Text>
              </View>
            ) : (
              programs.map(renderProgramCard)
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/member-home')}>
          <Home size={22} color="#666" />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => {}}>
          <BookOpen size={22} color="#4a90e2" />
          <Text style={[styles.navLabel, styles.navActive]}>Training</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => {}}>
          <Eye size={22} color="#666" />
          <Text style={styles.navLabel}>Browse</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => {}}>
          <MessageSquare size={22} color="#666" />
          <Text style={styles.navLabel}>Feedback</Text>
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
  goalSelectorModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  goalSelectorContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  goalSelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  goalSelectorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  goalSelectorList: {
    padding: 20,
  },
  goalSelectorItem: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
  },
  goalSelectorItemContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  goalSelectorCheckbox: {
    width: 24,
    height: 24,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalSelectorItemInfo: {
    flex: 1,
  },
  goalSelectorItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalSelectorItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
  },
  goalSelectorItemDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  goalSelectorItemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  pointsBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  pointsBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#d97706',
  },
  goalSelectorFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  goalSelectorCount: {
    fontSize: 14,
    color: '#6b7280',
  },
  saveGoalsButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveGoalsButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  saveGoalsButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  goalBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  goalBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  goalBadgeText: {
    fontSize: 12,
    color: '#3b82f6',
  },
  editGoalsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  editGoalsButtonText: {
    fontSize: 14,
    color: '#3b82f6',
  },
  emptyGoalsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  emptyGoalsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyGoalsText: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 16,
  },
  selectGoalsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  selectGoalsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  goalCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalPoints: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  goalPointsText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  goalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  goalDescription: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 12,
  },
  goalProgress: {
    marginBottom: 12,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 2,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#16a34a',
    paddingVertical: 8,
    borderRadius: 6,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  expiredCard: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  expiredContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  expiredText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#dc2626',
  },
  startNewWeekButton: {
    backgroundColor: '#dc2626',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-end',
  },
  startNewWeekButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#6b7280',
    textTransform: 'capitalize',
  },
  programsList: {
    gap: 16,
  },
  emptyProgramsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyProgramsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyProgramsText: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
  programCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  programImageContainer: {
    width: '100%',
    height: 160,
  },
  programImage: {
    width: '100%',
    height: '100%',
  },
  programContent: {
    padding: 16,
  },
  programHeader: {
    marginBottom: 12,
  },
  programBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
  },
  badgeOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#6b7280',
  },
  programTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  programDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  programMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  programCoach: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  coachAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  coachName: {
    fontSize: 14,
    color: '#6b7280',
  },
  programRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#6b7280',
  },
  studentsText: {
    fontSize: 14,
    color: '#6b7280',
  },
  programStats: {
    flexDirection: 'row',
    gap: 16,
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
  programProgress: {
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  programActions: {
    flexDirection: 'row',
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
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