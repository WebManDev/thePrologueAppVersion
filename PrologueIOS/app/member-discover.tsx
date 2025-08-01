import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, Pressable,
  TextInput, Alert, ActivityIndicator, FlatList, RefreshControl, Dimensions
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, updateDoc, arrayUnion, arrayRemove, deleteDoc, where, getDocs, Timestamp } from 'firebase/firestore';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { Home, BookOpen, Eye, MessageSquare, MessageCircle, User, Search, Settings, LogOut, ChevronDown, Heart, MessageCircle as MessageCircleIcon, Share, MoreHorizontal, Edit, Trash2, Camera, Video, Target, Crown, Zap, Bookmark, Send, Repeat2, X, Plus, Star, Clock, CheckCircle, AlertCircle, Filter, MapPin, Calendar, Upload, FileText, Users, ThumbsUp, ThumbsDown, Phone, Paperclip, Smile, Archive, MoreVertical, TrendingUp, Verified } from 'lucide-react-native';
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

interface Athlete {
  id: string;
  name: string;
  sport: string;
  specialty: string;
  bio: string;
  location: string;
  university?: string;
  avatar: string;
  coverImage: string;
  rating: number;
  ratingsCount: number;
  followers: string;
  following: string;
  type: string;
  experience: string;
  responseRate: string;
  totalContent: number;
  totalPosts: number;
  totalVideos: number;
  totalArticles: number;
  totalCourses: number;
  totalViews: number;
  engagementRate: string;
  languages?: string[];
  certifications?: string[];
  stripeAccountId?: string;
  subscriptionPrice: number;
  joinedDate: string;
}

export default function MemberDiscoverScreen() {
  const [memberData, setMemberData] = useState<MemberData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [subscriptions, setSubscriptions] = useState<{[athleteId: string]: any}>({});
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSport, setSelectedSport] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedRating, setSelectedRating] = useState<string>("all");
  const [selectedExperience, setSelectedExperience] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"rating" | "students" | "newest">("rating");
  const router = useRouter();

  // Static data
  const CREATORS = [
    {
      id: "1",
      name: "Sarah Martinez",
      sport: "Tennis",
      specialty: "Serve Technique & Mental Game",
      bio: "Former D1 tennis player with 8+ years coaching experience. Specialized in serve mechanics and mental performance.",
      location: "Austin, TX",
      university: "University of Texas",
      avatar: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=150&h=150&fit=crop&crop=face",
      coverImage: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=200&fit=crop",
      rating: 4.9,
      ratingsCount: 127,
      followers: "2.3K",
      following: "156",
      type: "coach",
      experience: "8+ years",
      responseRate: "95%",
      totalContent: 45,
      totalPosts: 23,
      totalVideos: 12,
      totalArticles: 8,
      totalCourses: 2,
      totalViews: 15600,
      engagementRate: "12.5%",
      languages: ["English", "Spanish"],
      certifications: ["USTA Certified Coach", "Sports Psychology Certification"],
      stripeAccountId: "acct_123456789",
      subscriptionPrice: 29.99,
      joinedDate: "2023-01-15"
    },
    {
      id: "2",
      name: "Mike Johnson",
      sport: "Basketball",
      specialty: "Shooting Mechanics & Defense",
      bio: "Ex-NBA player turned coach. Expert in shooting form, defensive positioning, and game strategy.",
      location: "Los Angeles, CA",
      university: "UCLA",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      coverImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=200&fit=crop",
      rating: 4.8,
      ratingsCount: 89,
      followers: "1.8K",
      following: "203",
      type: "athlete",
      experience: "15+ years",
      responseRate: "98%",
      totalContent: 38,
      totalPosts: 19,
      totalVideos: 15,
      totalArticles: 4,
      totalCourses: 1,
      totalViews: 23400,
      engagementRate: "15.2%",
      languages: ["English"],
      certifications: ["NBA Player", "Basketball Coaching Certification"],
      stripeAccountId: "acct_987654321",
      subscriptionPrice: 49.99,
      joinedDate: "2022-11-20"
    },
    {
      id: "3",
      name: "Emma Wilson",
      sport: "Soccer",
      specialty: "Ball Control & Tactical Awareness",
      bio: "Former professional soccer player with international experience. Focus on technical skills and game intelligence.",
      location: "Portland, OR",
      university: "University of Portland",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      coverImage: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=200&fit=crop",
      rating: 4.7,
      ratingsCount: 156,
      followers: "3.1K",
      following: "89",
      type: "coach",
      experience: "6+ years",
      responseRate: "92%",
      totalContent: 52,
      totalPosts: 28,
      totalVideos: 18,
      totalArticles: 6,
      totalCourses: 3,
      totalViews: 18900,
      engagementRate: "14.8%",
      languages: ["English", "French"],
      certifications: ["USSF Licensed Coach", "Tactical Analysis Certification"],
      stripeAccountId: "acct_456789123",
      subscriptionPrice: 34.99,
      joinedDate: "2023-03-10"
    }
  ];

  const EXPERIENCE_LEVELS = ["1-3 years", "3-5 years", "5-8 years", "8+ years"];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const memberDoc = await getDoc(doc(db, 'members', user.uid));
          if (memberDoc.exists()) {
            setMemberData(memberDoc.data() as MemberData);
            const memberData = memberDoc.data();
            setSubscriptions(memberData.subscriptions || {});
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

  // Listen to real-time updates
  useEffect(() => {
    if (!auth?.currentUser) return;

    // Listen to athletes collection
    const unsubscribeAthletes = onSnapshot(collection(db, "athletes"), async (snapshot) => {
      try {
        const athleteIds = snapshot.docs.map(doc => doc.id);
        const athletesWithData = await Promise.all(
          athleteIds.map(async (athleteId) => {
            const athleteDoc = await getDoc(doc(db, "athletes", athleteId));
            if (athleteDoc.exists()) {
              const data = athleteDoc.data();
              return {
                id: athleteId,
                name: data.name || "Athlete",
                sport: data.sport || "Sport",
                specialty: data.specialty || "Training",
                bio: data.bio || "Professional athlete and coach.",
                location: data.location || "Location",
                university: data.university || data.school,
                avatar: data.profileImageUrl || data.profilePic || data.profilePicture || "https://via.placeholder.com/150",
                coverImage: data.coverImage || "https://via.placeholder.com/400x200",
                rating: data.rating || 0,
                ratingsCount: data.ratingsCount || 0,
                followers: data.followers?.toString() || "0",
                following: data.following?.toString() || "0",
                type: data.type || "athlete",
                experience: data.experience || "5+ years",
                responseRate: data.responseRate || "95%",
                totalContent: data.totalContent || 0,
                totalPosts: data.totalPosts || 0,
                totalVideos: data.totalVideos || 0,
                totalArticles: data.totalArticles || 0,
                totalCourses: data.totalCourses || 0,
                totalViews: data.totalViews || 0,
                engagementRate: data.engagementRate || "0%",
                languages: data.languages || [],
                certifications: data.certifications || [],
                stripeAccountId: data.stripeAccountId,
                subscriptionPrice: data.pricing?.pro || data.subscriptionPrice || 0,
                joinedDate: data.joinedDate || "2023-01-01"
              };
            }
            return null;
          })
        );
        
        const validAthletes = athletesWithData.filter(athlete => athlete !== null);
        const merged = [
          ...validAthletes,
          ...CREATORS.filter(staticAthlete => !validAthletes.some(f => f?.id === staticAthlete.id))
        ];
        
        setAthletes(merged);
      } catch (error) {
        console.error("Error fetching athlete data:", error);
        setAthletes(CREATORS);
      }
    });

    // Listen to member subscriptions
    const unsubscribeMember = onSnapshot(doc(db, "members", auth.currentUser.uid), (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        setSubscriptions(userData.subscriptions || {});
      }
    });

    return () => {
      unsubscribeAthletes();
      unsubscribeMember();
    };
  }, [auth?.currentUser]);

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

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const isSubscribedToCreator = (athleteId: string) => {
    return subscriptions[athleteId] && subscriptions[athleteId].status === "active";
  };

  const handleSubscribe = async (athleteId: string) => {
    const athlete = athletes.find((a) => a.id === athleteId);
    if (!athlete) return;

    try {
      // Navigate to subscription plans page
      router.push('/member-subscription-plans' as any);
    } catch (error) {
      console.error("Error subscribing to creator:", error);
      Alert.alert("Error", "Failed to subscribe. Please try again.");
    }
  };

  const handleUnsubscribe = async (athleteId: string) => {
    try {
      const memberRef = doc(db, "members", currentUser.uid);
      await updateDoc(memberRef, {
        [`subscriptions.${athleteId}`]: deleteDoc
      });
      Alert.alert("Success", "Successfully unsubscribed from athlete.");
    } catch (error) {
      console.error("Error unsubscribing:", error);
      Alert.alert("Error", "Failed to unsubscribe. Please try again.");
    }
  };

  const handleCreatorClick = (athlete: Athlete) => {
    router.push('/creator' as any);
  };

  // Get unique sports
  const availableSports = [...new Set(athletes.map((athlete) => athlete.sport))].sort();

  // Filter athletes
  const filteredAthletes = athletes.filter((athlete) => {
    // Only show athletes with a Stripe account ID
    if (!athlete.stripeAccountId) return false;

    // Sport filter
    if (selectedSport !== "all" && athlete.sport !== selectedSport) return false;

    // Type filter
    if (selectedType !== "all" && athlete.type !== selectedType) return false;

    // Rating filter
    if (selectedRating !== "all") {
      const minRating = Number.parseFloat(selectedRating);
      if (athlete.rating < minRating) return false;
    }

    // Experience filter
    if (selectedExperience !== "all" && athlete.experience !== selectedExperience) return false;

    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        athlete.name.toLowerCase().includes(query) ||
        athlete.sport.toLowerCase().includes(query) ||
        athlete.specialty.toLowerCase().includes(query) ||
        athlete.bio.toLowerCase().includes(query) ||
        athlete.location.toLowerCase().includes(query)
      );
    }

    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case "rating":
        return b.rating - a.rating;
      case "students":
        return b.totalContent - a.totalContent;
      case "newest":
        return new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime();
      default:
        return 0;
    }
  });

  const clearAllFilters = () => {
    setSelectedSport("all");
    setSelectedType("all");
    setSelectedRating("all");
    setSelectedExperience("all");
    setSearchQuery("");
  };

  const hasActiveFilters =
    selectedSport !== "all" ||
    selectedType !== "all" ||
    selectedRating !== "all" ||
    selectedExperience !== "all" ||
    searchQuery;

  const initials = getInitials(memberData?.firstName, memberData?.lastName);
  const displayName = memberData?.firstName && memberData?.lastName ? `${memberData.firstName} ${memberData.lastName}` : 'Member';

  const renderAthleteCard = ({ item }: { item: Athlete }) => (
    <View key={item.id} style={styles.athleteCard}>
      {/* Cover Image */}
      <View style={styles.coverImageContainer}>
        <Image source={{ uri: item.coverImage }} style={styles.coverImage} />
        <View style={styles.coverOverlay} />
        <View style={styles.coverBadges}>
          {item.stripeAccountId && (
            <View style={styles.verifiedBadge}>
              <Verified size={12} color="#fff" />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}
          <View style={styles.typeBadge}>
            <Text style={styles.typeBadgeText}>{item.type}</Text>
          </View>
        </View>
        <View style={styles.locationContainer}>
          <MapPin size={14} color="#fff" />
          <Text style={styles.locationText}>{item.location}</Text>
        </View>
      </View>

      {/* Card Content */}
      <View style={styles.cardContent}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <TouchableOpacity style={styles.avatarContainer} onPress={() => handleCreatorClick(item)}>
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
          </TouchableOpacity>
          <View style={styles.profileInfo}>
            <TouchableOpacity onPress={() => handleCreatorClick(item)}>
              <Text style={styles.athleteName}>{item.name}</Text>
            </TouchableOpacity>
            <Text style={styles.sportText}>
              {item.sport}
              {item.university && <Text style={styles.universityText}> • {item.university}</Text>}
            </Text>
            <View style={styles.statsRow}>
              <View style={styles.ratingContainer}>
                <Star size={14} color="#fbbf24" />
                <Text style={styles.ratingText}>{item.rating > 0 ? item.rating.toFixed(1) : "0.0"}</Text>
                <Text style={styles.ratingsCount}>({item.ratingsCount || 0})</Text>
              </View>
              <Text style={styles.followersText}>{item.followers} followers</Text>
              <Text style={styles.contentText}>{item.totalContent || 0} content</Text>
            </View>
          </View>
        </View>

        {/* Specialty and Bio */}
        <View style={styles.bioSection}>
          <Text style={styles.specialtyText}>{item.specialty}</Text>
          <Text style={styles.bioText} numberOfLines={2}>{item.bio}</Text>
          
          <View style={styles.statsRow}>
            <Text style={styles.responseRate}>{item.responseRate} response rate</Text>
            <Text style={styles.experienceText}>{item.experience}</Text>
          </View>
          
          {/* Tags */}
          {((item.languages && item.languages.length > 0) || (item.certifications && item.certifications.length > 0)) && (
            <View style={styles.tagsContainer}>
              {item.languages?.slice(0, 2).map((lang: string, idx: number) => (
                <View key={`lang-${idx}`} style={styles.tag}>
                  <Text style={styles.tagText}>{lang}</Text>
                </View>
              ))}
              {item.certifications?.slice(0, 1).map((cert: string, idx: number) => (
                <View key={`cert-${idx}`} style={styles.certTag}>
                  <Text style={styles.certTagText}>
                    {cert.length > 20 ? cert.substring(0, 20) + "..." : cert}
                  </Text>
                </View>
              ))}
              {item.engagementRate && item.engagementRate !== "0%" && (
                <View style={styles.engagementTag}>
                  <Text style={styles.engagementText}>{item.engagementRate} engagement</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Action Section */}
        <View style={styles.actionSection}>
          {isSubscribedToCreator(item.id) ? (
            <TouchableOpacity
              style={styles.subscribedButton}
              onPress={() => handleUnsubscribe(item.id)}
            >
              <CheckCircle size={16} color="#3b82f6" />
              <Text style={styles.subscribedText}>Subscribed</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.subscribeButton}
              onPress={() => handleSubscribe(item.id)}
            >
              <Crown size={16} color="#fff" />
              <Text style={styles.subscribeText}>Subscribe</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => handleCreatorClick(item)}
          >
            <User size={16} color="#6b7280" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

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
        <TouchableOpacity onPress={() => router.push('/member-discover')} style={styles.logoRow}>
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
      <ScrollView 
        style={styles.mainContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={20} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search athletes, coaches, mentors..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <X size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Controls */}
        <View style={styles.filterControls}>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} color="#6b7280" />
            <Text style={styles.filterButtonText}>Filters</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.sortButton}>
            <TrendingUp size={16} color="#6b7280" />
            <Text style={styles.sortButtonText}>Sort</Text>
          </TouchableOpacity>
        </View>

        {/* Filters Panel */}
        {showFilters && (
          <View style={styles.filtersPanel}>
            <View style={styles.filtersHeader}>
              <Text style={styles.filtersTitle}>Filters</Text>
              {hasActiveFilters && (
                <TouchableOpacity onPress={clearAllFilters}>
                  <Text style={styles.clearFiltersText}>Clear All</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Sport Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Sport</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterOptions}>
                <TouchableOpacity
                  style={[styles.filterOption, selectedSport === "all" && styles.filterOptionActive]}
                  onPress={() => setSelectedSport("all")}
                >
                  <Text style={[styles.filterOptionText, selectedSport === "all" && styles.filterOptionTextActive]}>
                    All Sports
                  </Text>
                </TouchableOpacity>
                {availableSports.map((sport) => (
                  <TouchableOpacity
                    key={sport}
                    style={[styles.filterOption, selectedSport === sport && styles.filterOptionActive]}
                    onPress={() => setSelectedSport(sport)}
                  >
                    <Text style={[styles.filterOptionText, selectedSport === sport && styles.filterOptionTextActive]}>
                      {sport}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Type Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterOptions}>
                <TouchableOpacity
                  style={[styles.filterOption, selectedType === "all" && styles.filterOptionActive]}
                  onPress={() => setSelectedType("all")}
                >
                  <Text style={[styles.filterOptionText, selectedType === "all" && styles.filterOptionTextActive]}>
                    All Types
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterOption, selectedType === "athlete" && styles.filterOptionActive]}
                  onPress={() => setSelectedType("athlete")}
                >
                  <Text style={[styles.filterOptionText, selectedType === "athlete" && styles.filterOptionTextActive]}>
                    Athletes
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterOption, selectedType === "coach" && styles.filterOptionActive]}
                  onPress={() => setSelectedType("coach")}
                >
                  <Text style={[styles.filterOptionText, selectedType === "coach" && styles.filterOptionTextActive]}>
                    Coaches
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterOption, selectedType === "mentor" && styles.filterOptionActive]}
                  onPress={() => setSelectedType("mentor")}
                >
                  <Text style={[styles.filterOptionText, selectedType === "mentor" && styles.filterOptionTextActive]}>
                    Mentors
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* Experience Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Experience</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterOptions}>
                <TouchableOpacity
                  style={[styles.filterOption, selectedExperience === "all" && styles.filterOptionActive]}
                  onPress={() => setSelectedExperience("all")}
                >
                  <Text style={[styles.filterOptionText, selectedExperience === "all" && styles.filterOptionTextActive]}>
                    Any Experience
                  </Text>
                </TouchableOpacity>
                {EXPERIENCE_LEVELS.map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[styles.filterOption, selectedExperience === level && styles.filterOptionActive]}
                    onPress={() => setSelectedExperience(level)}
                  >
                    <Text style={[styles.filterOptionText, selectedExperience === level && styles.filterOptionTextActive]}>
                      {level}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Rating Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Minimum Rating</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterOptions}>
                <TouchableOpacity
                  style={[styles.filterOption, selectedRating === "all" && styles.filterOptionActive]}
                  onPress={() => setSelectedRating("all")}
                >
                  <Text style={[styles.filterOptionText, selectedRating === "all" && styles.filterOptionTextActive]}>
                    Any Rating
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterOption, selectedRating === "4.5" && styles.filterOptionActive]}
                  onPress={() => setSelectedRating("4.5")}
                >
                  <Text style={[styles.filterOptionText, selectedRating === "4.5" && styles.filterOptionTextActive]}>
                    4.5+ Stars
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterOption, selectedRating === "4.0" && styles.filterOptionActive]}
                  onPress={() => setSelectedRating("4.0")}
                >
                  <Text style={[styles.filterOptionText, selectedRating === "4.0" && styles.filterOptionTextActive]}>
                    4.0+ Stars
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterOption, selectedRating === "3.5" && styles.filterOptionActive]}
                  onPress={() => setSelectedRating("3.5")}
                >
                  <Text style={[styles.filterOptionText, selectedRating === "3.5" && styles.filterOptionTextActive]}>
                    3.5+ Stars
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        )}

        {/* Athletes List */}
        <View style={styles.athletesContainer}>
          {filteredAthletes.length === 0 ? (
            <View style={styles.emptyState}>
              <User size={48} color="#9ca3af" />
              <Text style={styles.emptyStateTitle}>No athletes found</Text>
              <Text style={styles.emptyStateText}>Try adjusting your filters or search terms.</Text>
              <TouchableOpacity style={styles.clearFiltersButton} onPress={clearAllFilters}>
                <Text style={styles.clearFiltersButtonText}>Clear Filters</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredAthletes.map((athlete) => (
              <View key={athlete.id}>
                {renderAthleteCard({ item: athlete })}
              </View>
            ))
          )}
        </View>
      </ScrollView>

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
        <TouchableOpacity style={styles.navItem} onPress={() => {}}>
          <Eye size={22} color="#4a90e2" />
          <Text style={[styles.navLabel, styles.navActive]}>Browse</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/member-feedback')}>
          <MessageSquare size={22} color="#666" />
          <Text style={styles.navLabel}>Feedback</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/member-messaging')}>
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
  mainContent: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  filterControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filterButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sortButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  filtersPanel: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  filterOptions: {
    flexDirection: 'row',
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginRight: 8,
    backgroundColor: '#fff',
  },
  filterOptionActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  filterOptionText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterOptionTextActive: {
    color: '#fff',
  },
  athletesContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  athleteCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  coverImageContainer: {
    height: 120,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  coverBadges: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '500',
    marginLeft: 2,
  },
  typeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 10,
    color: '#374151',
    fontWeight: '500',
  },
  locationContainer: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 12,
    color: '#fff',
    marginLeft: 4,
    fontWeight: '500',
  },
  cardContent: {
    padding: 16,
  },
  profileSection: {
    flexDirection: 'row',
    marginTop: -32,
    marginBottom: 12,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: '#fff',
  },
  profileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  athleteName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  sportText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  universityText: {
    color: '#6b7280',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 2,
  },
  ratingsCount: {
    fontSize: 10,
    color: '#9ca3af',
    marginLeft: 2,
  },
  followersText: {
    fontSize: 12,
    color: '#6b7280',
  },
  contentText: {
    fontSize: 10,
    color: '#9ca3af',
  },
  bioSection: {
    marginBottom: 16,
  },
  specialtyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
    marginBottom: 6,
  },
  bioText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  responseRate: {
    fontSize: 12,
    color: '#6b7280',
  },
  experienceText: {
    fontSize: 12,
    color: '#6b7280',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tag: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 10,
    color: '#6b7280',
    fontWeight: '500',
  },
  certTag: {
    borderWidth: 1,
    borderColor: '#3b82f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  certTagText: {
    fontSize: 10,
    color: '#3b82f6',
    fontWeight: '500',
  },
  engagementTag: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  engagementText: {
    fontSize: 10,
    color: '#166534',
    fontWeight: '500',
  },
  actionSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  subscribeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    paddingVertical: 10,
    borderRadius: 8,
  },
  subscribeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 6,
  },
  subscribedButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#3b82f6',
    paddingVertical: 10,
    borderRadius: 8,
  },
  subscribedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
    marginLeft: 6,
  },
  profileButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  clearFiltersButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  clearFiltersButtonText: {
    fontSize: 14,
    color: '#6b7280',
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