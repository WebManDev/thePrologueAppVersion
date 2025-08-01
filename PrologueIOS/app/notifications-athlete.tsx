import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  Alert, 
  StyleSheet, 
  SafeAreaView,
  RefreshControl,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { 
  Search,
  Filter,
  X,
  Home,
  FileText,
  MessageSquare,
  MessageCircle,
  User,
  Heart,
  Trophy,
  Users,
  UserPlus,
  MoreVertical,
  Check,
  Trash2,
  ChevronDown,
  Clock,
  Star
} from "lucide-react-native";
import { auth, db } from "../firebaseConfig";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  addDoc, 
  serverTimestamp, 
  doc, 
  getDoc, 
  updateDoc,
  getDocs
} from "firebase/firestore";

const { width } = Dimensions.get('window');

// Notification types for athletes
const NOTIFICATION_TYPES = [
  { value: "all", label: "All Notifications" },
  { value: "subscriber", label: "Subscribers" },
  { value: "social", label: "Social" },
  { value: "message", label: "Messages" },
  { value: "feedback", label: "Feedback" },
  { value: "achievement", label: "Achievements" },
  { value: "system", label: "System" },
  { value: "payment", label: "Payments" },
];

const QUICK_SEARCHES = [
  "New Subscribers",
  "Post Engagement", 
  "Message Requests",
  "Feedback Requests",
  "Training Updates",
  "Achievement Unlocked",
  "Payment Notifications",
  "System Alerts",
];

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  senderName?: string;
  senderId?: string;
  recipientId: string;
  priority: string;
  category: string;
  actionType?: string;
  actionUrl?: string;
  metadata?: any;
  read: boolean;
  createdAt: any;
  timestamp?: string;
}

interface Profile {
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
}

export default function AthleteNotificationsScreen() {
  const router = useRouter();
  const [profileData, setProfileData] = useState<Profile>({ firstName: "", lastName: "" });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filter states
  const [selectedType, setSelectedType] = useState("all");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "priority" | "unread">("newest");
  
  // UI states
  const [showFilters, setShowFilters] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [showPrioritySelector, setShowPrioritySelector] = useState(false);
  const [showSortSelector, setShowSortSelector] = useState(false);
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null);
  
  const searchInputRef = useRef<TextInput>(null);

  // Helper functions
  const getInitials = (firstName?: string, lastName?: string): string => {
    if (!firstName && !lastName) return 'AL';
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return first + last || 'AL';
  };

  const getDisplayName = (firstName?: string, lastName?: string): string => {
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    }
    return firstName || 'Student Athlete';
  };

  // Load user profile
  useEffect(() => {
    const loadProfile = async () => {
      if (!auth.currentUser) return;
      try {
        const userDoc = await getDoc(doc(db, 'athletes', auth.currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setProfileData({
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            profileImageUrl: data.profileImageUrl || undefined,
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };
    loadProfile();
  }, []);

  // Real-time notifications listener
  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const user = auth.currentUser;
    setLoading(true);
    
    const notificationsQuery = query(
      collection(db, "notifications"),
      where("recipientId", "==", user.uid),
      where("deleted", "!=", true),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const notificationsList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: formatTimestamp(data.createdAt)
        } as Notification;
      });
      setNotifications(notificationsList);
      setLoading(false);
    }, (error) => {
      console.error("Error listening to notifications:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Helper function to format timestamps
  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return "Just now";
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  // Enhanced filtering logic
  const filteredNotifications = useMemo(() => {
    const filtered = notifications.filter((notification) => {
      if (selectedType !== "all" && notification.type !== selectedType) return false;
      if (selectedPriority !== "all" && notification.priority !== selectedPriority) return false;
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return (
          notification.title.toLowerCase().includes(query) ||
          notification.message.toLowerCase().includes(query) ||
          notification.senderName?.toLowerCase().includes(query) ||
          notification.category.toLowerCase().includes(query)
        );
      }
      return true;
    });

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt?.toDate?.() || b.createdAt || 0).getTime() - 
                 new Date(a.createdAt?.toDate?.() || a.createdAt || 0).getTime();
        case "oldest":
          return new Date(a.createdAt?.toDate?.() || a.createdAt || 0).getTime() - 
                 new Date(b.createdAt?.toDate?.() || b.createdAt || 0).getTime();
        case "priority":
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority as keyof typeof priorityOrder] - 
                 priorityOrder[a.priority as keyof typeof priorityOrder];
        case "unread":
          return Number(!a.read) - Number(!b.read);
        default:
          return 0;
      }
    });

    return filtered;
  }, [selectedType, selectedPriority, searchQuery, sortBy, notifications]);

  // Get unread count
  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  // Navigation handlers
  const handleHomePress = () => {
    router.push('/athlete-home');
  };

  const handleContentPress = () => {
    router.push('/content');
  };

  const handleFeedbackPress = () => {
    router.push('/athlete-feedback');
  };

  const handleNotificationsPress = () => {
    // Already on notifications page
  };

  const handleProfilePress = () => {
    router.push('/Dashboard');
  };

  // Event handlers
  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    setShowSearchDropdown(text.length > 0);
  }, []);

  const handleQuickSearchSelect = useCallback((searchTerm: string) => {
    setSearchQuery(searchTerm);
    setShowSearchDropdown(false);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    setShowSearchDropdown(false);
  }, []);

  const handleNotificationPress = useCallback(async (notification: Notification) => {
    try {
      // Mark as read if unread
      if (!notification.read) {
        await updateDoc(doc(db, "notifications", notification.id), {
          read: true,
          readAt: serverTimestamp()
        });
      }
      
      // Navigate to action URL if available
      if (notification.actionUrl) {
        // Handle navigation based on action type
        if (notification.actionType === "view_profile") {
          // Navigate to member profile
        } else if (notification.actionType === "provide_feedback") {
          router.push('/athlete-feedback');
        } else if (notification.actionType === "view_message") {
          // Navigate to messages
        }
      }
    } catch (error) {
      console.error("Error handling notification press:", error);
    }
  }, [router]);

  const handleMarkAsRead = useCallback(async (notificationId: string) => {
    try {
      await updateDoc(doc(db, "notifications", notificationId), {
        read: true,
        readAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }, []);

  const handleMarkAsUnread = useCallback(async (notificationId: string) => {
    try {
      await updateDoc(doc(db, "notifications", notificationId), {
        read: false
      });
    } catch (error) {
      console.error("Error marking notification as unread:", error);
    }
  }, []);

  const handleDeleteNotification = useCallback(async (notificationId: string) => {
    try {
      await updateDoc(doc(db, "notifications", notificationId), {
        deleted: true,
        deletedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  }, []);

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      const updatePromises = notifications
        .filter(n => !n.read)
        .map(n => 
          updateDoc(doc(db, "notifications", n.id), {
            read: true,
            readAt: serverTimestamp()
          })
        );
      await Promise.all(updatePromises);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  }, [notifications]);

  const clearAllFilters = useCallback(() => {
    setSelectedType("all");
    setSelectedPriority("all");
    setSearchQuery("");
  }, []);

  const hasActiveFilters = selectedType !== "all" || selectedPriority !== "all" || searchQuery;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // Get notification icon and styling
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "subscriber":
        return { icon: UserPlus, color: "#3B82F6", bg: "#DBEAFE" };
      case "social":
        return { icon: Heart, color: "#EC4899", bg: "#FCE7F3" };
      case "message":
        return { icon: MessageCircle, color: "#8B5CF6", bg: "#EDE9FE" };
      case "feedback":
        return { icon: MessageSquare, color: "#10B981", bg: "#D1FAE5" };
      case "achievement":
        return { icon: Trophy, color: "#F59E0B", bg: "#FEF3C7" };
      case "payment":
        return { icon: Users, color: "#059669", bg: "#ECFDF5" };
      case "system":
        return { icon: Star, color: "#6B7280", bg: "#F3F4F6" };
      default:
        return { icon: Star, color: "#6B7280", bg: "#F3F4F6" };
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "#EF4444";
      case "medium":
        return "#F59E0B";
      case "low":
        return "#6B7280";
      default:
        return "#D1D5DB";
    }
  };

  // Render notification card
  const renderNotificationCard = (notification: Notification) => {
    const { icon: IconComponent, color, bg } = getNotificationIcon(notification.type);
    const priorityColor = getPriorityColor(notification.priority);

    return (
      <TouchableOpacity
        key={notification.id}
        style={[
          styles.notificationCard,
          !notification.read && styles.unreadCard,
          { borderLeftColor: priorityColor }
        ]}
        onPress={() => handleNotificationPress(notification)}
        activeOpacity={0.7}
      >
        <View style={styles.cardContent}>
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: bg }]}>
            <IconComponent size={20} color={color} />
          </View>

          {/* Content */}
          <View style={styles.contentContainer}>
            <View style={styles.headerRow}>
              <Text style={[styles.title, !notification.read && styles.unreadTitle]}>
                {notification.title}
              </Text>
              {!notification.read && <View style={styles.unreadDot} />}
            </View>
            
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{notification.category}</Text>
            </View>
            
            <Text style={[styles.message, !notification.read && styles.unreadMessage]}>
              {notification.message}
            </Text>

            {/* Metadata */}
            {notification.metadata && (
              <View style={styles.metadata}>
                {notification.type === "subscriber" && notification.metadata.subscriptionPrice && (
                  <Text style={styles.metadataText}>
                    Plan: {notification.metadata.subscriptionType} • ${notification.metadata.subscriptionPrice}/month
                  </Text>
                )}
                {notification.type === "feedback" && notification.metadata.contentType && (
                  <Text style={styles.metadataText}>
                    Content: {notification.metadata.contentType}
                  </Text>
                )}
              </View>
            )}

            {/* Footer */}
            <View style={styles.footer}>
              <View style={styles.senderInfo}>
                <View style={styles.senderAvatar}>
                  <User size={12} color="#6B7280" />
                </View>
                <Text style={styles.senderName}>{notification.senderName || "PROLOGUE"}</Text>
              </View>
              <Text style={styles.timestamp}>{notification.timestamp}</Text>
            </View>
          </View>

          {/* Actions */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setSelectedNotificationId(notification.id)}
          >
            <MoreVertical size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // Render search dropdown
  const renderSearchDropdown = () => {
    if (!showSearchDropdown || !searchQuery) return null;

    const filteredSearches = QUICK_SEARCHES.filter((search) => 
      search.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
      <View style={styles.searchDropdown}>
        <Text style={styles.searchDropdownTitle}>Quick Searches</Text>
        {filteredSearches.map((search) => (
          <TouchableOpacity
            key={search}
            style={styles.searchOption}
            onPress={() => handleQuickSearchSelect(search)}
          >
            <Text style={styles.searchOptionText}>{search}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Render type selector modal
  const renderTypeSelector = () => (
    <Modal visible={showTypeSelector} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Type</Text>
            <TouchableOpacity onPress={() => setShowTypeSelector(false)}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          {NOTIFICATION_TYPES.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={styles.optionItem}
              onPress={() => {
                setSelectedType(type.value);
                setShowTypeSelector(false);
              }}
            >
              <Text style={styles.optionText}>{type.label}</Text>
              {selectedType === type.value && <Check size={16} color="#3B82F6" />}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );

  // Render priority selector modal
  const renderPrioritySelector = () => (
    <Modal visible={showPrioritySelector} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Priority</Text>
            <TouchableOpacity onPress={() => setShowPrioritySelector(false)}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          {["all", "high", "medium", "low"].map((priority) => (
            <TouchableOpacity
              key={priority}
              style={styles.optionItem}
              onPress={() => {
                setSelectedPriority(priority);
                setShowPrioritySelector(false);
              }}
            >
              <Text style={styles.optionText}>
                {priority === "all" ? "All Priorities" : priority.charAt(0).toUpperCase() + priority.slice(1)}
              </Text>
              {selectedPriority === priority && <Check size={16} color="#3B82F6" />}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );

  // Render sort selector modal
  const renderSortSelector = () => (
    <Modal visible={showSortSelector} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Sort By</Text>
            <TouchableOpacity onPress={() => setShowSortSelector(false)}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          {[
            { value: "newest", label: "Newest First" },
            { value: "oldest", label: "Oldest First" },
            { value: "priority", label: "By Priority" },
            { value: "unread", label: "Unread First" }
          ].map((sort) => (
            <TouchableOpacity
              key={sort.value}
              style={styles.optionItem}
              onPress={() => {
                setSortBy(sort.value as any);
                setShowSortSelector(false);
              }}
            >
              <Text style={styles.optionText}>{sort.label}</Text>
              {sortBy === sort.value && <Check size={16} color="#3B82F6" />}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );

  // Render notification actions modal
  const renderNotificationActions = () => {
    const notification = notifications.find(n => n.id === selectedNotificationId);
    if (!notification) return null;

    return (
      <Modal visible={!!selectedNotificationId} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notification Actions</Text>
              <TouchableOpacity onPress={() => setSelectedNotificationId(null)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={styles.actionOption}
              onPress={() => {
                if (notification.read) {
                  handleMarkAsUnread(notification.id);
                } else {
                  handleMarkAsRead(notification.id);
                }
                setSelectedNotificationId(null);
              }}
            >
              <Text style={styles.actionOptionText}>
                {notification.read ? "Mark as Unread" : "Mark as Read"}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionOption, styles.deleteAction]}
              onPress={() => {
                handleDeleteNotification(notification.id);
                setSelectedNotificationId(null);
              }}
            >
              <Trash2 size={16} color="#EF4444" />
              <Text style={[styles.actionOptionText, styles.deleteActionText]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Notifications</Text>
            <Text style={styles.headerSubtitle}>{unreadCount} unread notifications</Text>
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity style={styles.markAllButton} onPress={handleMarkAllAsRead}>
              <Check size={16} color="white" />
              <Text style={styles.markAllButtonText}>Mark All Read</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <KeyboardAvoidingView 
        style={styles.content} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Search and Filters */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color="#6B7280" style={styles.searchIcon} />
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="Search notifications..."
              value={searchQuery}
              onChangeText={handleSearchChange}
              onFocus={() => searchQuery.length > 0 && setShowSearchDropdown(true)}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
                <X size={16} color="#6B7280" />
              </TouchableOpacity>
            ) : null}
          </View>
          {renderSearchDropdown()}
        </View>

        {/* Filter Controls */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} color="#6B7280" />
            <Text style={styles.filterButtonText}>Filters</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowSortSelector(true)}
          >
            <Clock size={16} color="#6B7280" />
            <Text style={styles.filterButtonText}>Sort</Text>
            <ChevronDown size={14} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Expandable Filters */}
        {showFilters && (
          <View style={styles.filtersPanel}>
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Type</Text>
              <TouchableOpacity
                style={styles.filterSelector}
                onPress={() => setShowTypeSelector(true)}
              >
                <Text style={styles.filterSelectorText}>
                  {NOTIFICATION_TYPES.find(t => t.value === selectedType)?.label || "All"}
                </Text>
                <ChevronDown size={14} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Priority</Text>
              <TouchableOpacity
                style={styles.filterSelector}
                onPress={() => setShowPrioritySelector(true)}
              >
                <Text style={styles.filterSelectorText}>
                  {selectedPriority === "all" ? "All" : selectedPriority.charAt(0).toUpperCase() + selectedPriority.slice(1)}
                </Text>
                <ChevronDown size={14} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {hasActiveFilters && (
              <TouchableOpacity style={styles.clearFiltersButton} onPress={clearAllFilters}>
                <X size={14} color="#3B82F6" />
                <Text style={styles.clearFiltersText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Notifications List */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.loadingText}>Loading notifications...</Text>
            </View>
          ) : filteredNotifications.length > 0 ? (
            filteredNotifications.map(renderNotificationCard)
          ) : (
            <View style={styles.emptyState}>
              <Star size={64} color="#D1D5DB" />
              <Text style={styles.emptyStateTitle}>
                {hasActiveFilters ? "No notifications found" : "You're all caught up!"}
              </Text>
              <Text style={styles.emptyStateText}>
                {hasActiveFilters 
                  ? "Try adjusting your filters to see more notifications."
                  : "New notifications will appear here as you engage with your audience."}
              </Text>
              {hasActiveFilters && (
                <TouchableOpacity style={styles.clearFiltersButton} onPress={clearAllFilters}>
                  <Text style={styles.clearFiltersText}>Clear Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={handleHomePress}>
          <Home size={20} color="#666" />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleContentPress}>
          <FileText size={20} color="#666" />
          <Text style={styles.navLabel}>Content</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleFeedbackPress}>
          <MessageSquare size={20} color="#666" />
          <Text style={styles.navLabel}>Feedback</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <MessageCircle size={20} color="#666" />
          <Text style={styles.navLabel}>Messages</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={handleProfilePress}>
          <User size={20} color="#666" />
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      {renderTypeSelector()}
      {renderPrioritySelector()}
      {renderSortSelector()}
      {renderNotificationActions()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  markAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  markAllButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    position: 'relative',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  clearButton: {
    padding: 4,
  },
  searchDropdown: {
    position: 'absolute',
    top: 72,
    left: 16,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    zIndex: 1000,
  },
  searchDropdownTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  searchOption: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchOptionText: {
    fontSize: 14,
    color: '#6B7280',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    gap: 6,
  },
  filterButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  filtersPanel: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  filterSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  filterSelectorText: {
    fontSize: 14,
    color: '#1F2937',
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    marginTop: 8,
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  notificationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  unreadCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#3B82F6',
  },
  cardContent: {
    flexDirection: 'row',
    padding: 16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    flex: 1,
  },
  unreadTitle: {
    color: '#1F2937',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginLeft: 8,
  },
  categoryBadge: {
    backgroundColor: '#F3F4F6',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  message: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  unreadMessage: {
    color: '#374151',
  },
  metadata: {
    backgroundColor: '#F9FAFB',
    padding: 8,
    borderRadius: 6,
    marginBottom: 12,
  },
  metadataText: {
    fontSize: 12,
    color: '#6B7280',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  senderAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  senderName: {
    fontSize: 12,
    color: '#6B7280',
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  optionText: {
    fontSize: 16,
    color: '#1F2937',
  },
  actionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  actionOptionText: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 8,
  },
  deleteAction: {
    paddingHorizontal: 0,
  },
  deleteActionText: {
    color: '#EF4444',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    paddingTop: 12,
    paddingBottom: 34,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    gap: 4,
    position: 'relative',
  },
  navLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  navActive: {
    color: '#4a90e2',
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: width / 12 - 20,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
}); 