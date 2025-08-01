import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, Pressable,
  TextInput, Alert, ActivityIndicator, FlatList, RefreshControl, KeyboardAvoidingView, Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, updateDoc, arrayUnion, arrayRemove, deleteDoc, where, getDocs, Timestamp } from 'firebase/firestore';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { Home, BookOpen, Eye, MessageSquare, MessageCircle, User, Search, Settings, LogOut, ChevronDown, Heart, MessageCircle as MessageCircleIcon, Share, MoreHorizontal, Edit, Trash2, Camera, Video, Target, Crown, Zap, Bookmark, Send, Repeat2, X, Plus, Star, Clock, CheckCircle, AlertCircle, Filter, MapPin, Calendar, Upload, FileText, Users, ThumbsUp, ThumbsDown, Phone, Paperclip, Smile, Archive, MoreVertical } from 'lucide-react-native';
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

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  online: boolean;
  isCoach: boolean;
  role: string;
  email: string;
  sport: string;
  university: string;
  location: string;
  level: string;
  experience: string;
  specialties: string[];
  achievements: string[];
  subscriptionStatus: string;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  senderRole: string;
  timestamp: any;
  time?: string;
}

export default function MemberMessagingScreen() {
  const [memberData, setMemberData] = useState<MemberData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const messagesEndRef = useRef<ScrollView>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const memberDoc = await getDoc(doc(db, 'members', user.uid));
          if (memberDoc.exists()) {
            setMemberData(memberDoc.data() as MemberData);
            const memberData = memberDoc.data();
            const subscriptions = memberData.subscriptions || {};
            
            // Allow messaging for all subscriptions (active and inactive) to preserve history
            const allSubscribedAthleteIds = Object.keys(subscriptions);
            
            if (allSubscribedAthleteIds.length > 0) {
              // Fetch athlete profiles for all subscribed athletes (active and inactive)
              const athletePromises = allSubscribedAthleteIds.map(async (athleteId: string) => {
                const athleteDoc = await getDoc(doc(db, "athletes", athleteId));
                if (athleteDoc.exists()) {
                  const athleteData = athleteDoc.data();
                  const subscriptionStatus = subscriptions[athleteId]?.status || 'inactive';
                  
                  return {
                    id: athleteId,
                    name: athleteData.name || "Athlete",
                    avatar: athleteData.profileImageUrl || athleteData.profilePic || athleteData.profilePicture || "https://via.placeholder.com/48x48",
                    lastMessage: subscriptionStatus === 'active' ? "Click to start a conversation" : "Subscription expired - view history only",
                    timestamp: "Just now",
                    unread: 0,
                    online: subscriptionStatus === 'active', // Show as offline if subscription inactive
                    isCoach: true,
                    role: `${athleteData.sport || "Sport"} Coach`,
                    email: athleteData.email,
                    sport: athleteData.sport || "Sport",
                    university: athleteData.university || athleteData.school || "University",
                    location: athleteData.location || "Location",
                    level: athleteData.level || "Professional",
                    experience: athleteData.experience || "5+ years",
                    specialties: athleteData.specialties || ["Training", "Performance"],
                    achievements: athleteData.achievements || ["Team Captain", "All-Star"],
                    subscriptionStatus: subscriptionStatus, // Add subscription status
                  };
                }
                return null;
              });
              
              const athleteResults = await Promise.all(athletePromises);
              const validAthletes = athleteResults.filter(athlete => athlete !== null);
              setConversations(validAthletes);
              // Auto-select first conversation if none selected
              if (!selectedConversation && validAthletes.length > 0) {
                setSelectedConversation(validAthletes[0].id);
              }
            } else {
              setConversations([]);
            }
          }
          setLoading(false);
        } catch (error) {
          console.error('Error fetching member data:', error);
          setLoading(false);
        }
      } else {
        setCurrentUser(null);
        setConversations([]);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen for messages when conversation is selected
  useEffect(() => {
    if (!selectedConversation || !currentUser) return;

    const chatId = [currentUser.uid, selectedConversation].sort().join('_');
    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        content: doc.data().content || '',
        senderId: doc.data().senderId || '',
        senderRole: doc.data().senderRole || '',
        timestamp: doc.data().timestamp,
        time: doc.data().timestamp?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || 'Just now'
      }));
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [selectedConversation, currentUser]);

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

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || !currentUser) return;
    
    // Check if the selected conversation has an active subscription
    const selectedConversationData = conversations.find(conv => conv.id === selectedConversation);
    if (selectedConversationData?.subscriptionStatus !== 'active') {
      Alert.alert("Subscription Required", "You need an active subscription to send messages to this athlete.");
      return;
    }
    
    try {
      const chatId = [currentUser.uid, selectedConversation].sort().join('_');
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      
      await addDoc(messagesRef, {
        content: messageInput.trim(),
        senderId: currentUser.uid,
        senderRole: "member",
        timestamp: Timestamp.now(),
      });
      
      setMessageInput("");
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert("Error", "Failed to send message. Please try again.");
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Refresh conversations
    setTimeout(() => setRefreshing(false), 1000);
  };

  const filteredConversations = conversations.filter(conv => 
    !searchQuery.trim() || 
    conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.sport?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedConv = conversations.find((conv) => conv.id === selectedConversation);

  const initials = getInitials(memberData?.firstName, memberData?.lastName);
  const displayName = memberData?.firstName && memberData?.lastName ? `${memberData.firstName} ${memberData.lastName}` : 'Member';

  const renderConversation = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      key={item.id}
      onPress={() => setSelectedConversation(item.id)}
      style={[
        styles.conversationItem,
        selectedConversation === item.id && styles.selectedConversation
      ]}
    >
      <View style={styles.conversationContent}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: item.avatar }}
            style={styles.avatar}
            defaultSource={require('../assets/p.png')}
          />
          {item.online && <View style={styles.onlineIndicator} />}
        </View>
        
        <View style={styles.conversationInfo}>
          <View style={styles.conversationHeader}>
            <Text style={styles.conversationName}>{item.name}</Text>
            {item.isCoach && (
              <View style={styles.coachBadge}>
                <Text style={styles.coachBadgeText}>Coach</Text>
              </View>
            )}
            <Text style={styles.timestamp}>{item.timestamp}</Text>
          </View>
          
          <View style={styles.conversationFooter}>
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.lastMessage}
            </Text>
            {item.unread > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{item.unread}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      key={item.id}
      style={[
        styles.messageContainer,
        item.senderId === currentUser?.uid ? styles.sentMessage : styles.receivedMessage
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          item.senderId === currentUser?.uid ? styles.sentBubble : styles.receivedBubble
        ]}
      >
        <Text style={[
          styles.messageText,
          item.senderId === currentUser?.uid ? styles.sentText : styles.receivedText
        ]}>
          {item.content}
        </Text>
        <Text style={[
          styles.messageTime,
          item.senderId === currentUser?.uid ? styles.sentTime : styles.receivedTime
        ]}>
          {item.time || "Just now"}
        </Text>
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
        <TouchableOpacity onPress={() => router.push('/member-messaging')} style={styles.logoRow}>
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
      <View style={styles.mainContent}>
        {/* Conversations List */}
        <View style={styles.conversationsContainer}>
          <View style={styles.conversationsHeader}>
            <Text style={styles.conversationsTitle}>Messages</Text>
            <TouchableOpacity style={styles.headerButton}>
              <MoreVertical size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.searchContainer}>
            <Search size={20} color="#9ca3af" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search conversations..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <ScrollView 
            style={styles.conversationsList}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {filteredConversations.length === 0 ? (
              <View style={styles.emptyState}>
                <MessageSquare size={48} color="#9ca3af" />
                <Text style={styles.emptyStateTitle}>
                  {searchQuery ? "No conversations found" : "No athletes to message yet"}
                </Text>
                <Text style={styles.emptyStateText}>
                  {searchQuery ? "Try a different search term" : "Subscribe to athletes to start messaging"}
                </Text>
              </View>
            ) : (
              filteredConversations.map((item) => renderConversation({ item }))
            )}
          </ScrollView>
        </View>

        {/* Chat Area */}
        <View style={styles.chatContainer}>
          {selectedConv ? (
            <>
              {/* Chat Header */}
              <View style={styles.chatHeader}>
                <View style={styles.chatHeaderInfo}>
                  <View style={styles.chatAvatarContainer}>
                    <Image
                      source={{ uri: selectedConv.avatar }}
                      style={styles.chatAvatar}
                      defaultSource={require('../assets/p.png')}
                    />
                    {selectedConv.online && <View style={styles.chatOnlineIndicator} />}
                  </View>
                  <View style={styles.chatInfo}>
                    <Text style={styles.chatName}>{selectedConv.name}</Text>
                    <Text style={styles.chatStatus}>
                      {selectedConv.online ? "Online" : "Last seen 2 hours ago"}
                    </Text>
                  </View>
                </View>
                <View style={styles.chatActions}>
                  <TouchableOpacity style={styles.chatActionButton}>
                    <Phone size={20} color="#6B7280" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.chatActionButton}>
                    <Video size={20} color="#6B7280" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.chatActionButton}>
                    <MoreVertical size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Messages */}
              <ScrollView 
                ref={messagesEndRef}
                style={styles.messagesContainer}
                onContentSizeChange={() => messagesEndRef.current?.scrollToEnd({ animated: true })}
              >
                {messages.length === 0 ? (
                  <View style={styles.emptyMessages}>
                    <MessageSquare size={48} color="#9ca3af" />
                    <Text style={styles.emptyMessagesTitle}>Start your conversation</Text>
                    <Text style={styles.emptyMessagesText}>
                      Send a message to {selectedConv.name} to get started
                    </Text>
                    <View style={styles.messageSuggestions}>
                      {["Hi there!", "Looking forward to training!", "When's our next session?"].map((suggestion, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.suggestionButton}
                          onPress={() => setMessageInput(suggestion)}
                        >
                          <Text style={styles.suggestionText}>{suggestion}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ) : (
                  <View style={styles.messagesList}>
                    {messages.map((message) => (
                      <View
                        key={message.id}
                        style={[
                          styles.messageContainer,
                          message.senderId === currentUser?.uid ? styles.sentMessage : styles.receivedMessage
                        ]}
                      >
                        <View
                          style={[
                            styles.messageBubble,
                            message.senderId === currentUser?.uid ? styles.sentBubble : styles.receivedBubble
                          ]}
                        >
                          <Text style={[
                            styles.messageText,
                            message.senderId === currentUser?.uid ? styles.sentText : styles.receivedText
                          ]}>
                            {message.content}
                          </Text>
                          <Text style={[
                            styles.messageTime,
                            message.senderId === currentUser?.uid ? styles.sentTime : styles.receivedTime
                          ]}>
                            {message.time || "Just now"}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>

              {/* Message Input */}
              <KeyboardAvoidingView 
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.inputContainer}
              >
                <View style={styles.inputRow}>
                  <TouchableOpacity style={styles.inputButton}>
                    <Paperclip size={20} color="#6B7280" />
                  </TouchableOpacity>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.messageInput}
                      value={messageInput}
                      onChangeText={setMessageInput}
                      placeholder="Type a message..."
                      multiline
                      maxLength={500}
                    />
                    <TouchableOpacity style={styles.emojiButton}>
                      <Smile size={20} color="#6B7280" />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.sendButton,
                      !messageInput.trim() && styles.sendButtonDisabled
                    ]}
                    onPress={handleSendMessage}
                    disabled={!messageInput.trim()}
                  >
                    <Send size={20} color={messageInput.trim() ? "#fff" : "#9ca3af"} />
                  </TouchableOpacity>
                </View>
              </KeyboardAvoidingView>
            </>
          ) : (
            // No conversation selected state
            <View style={styles.noConversationState}>
              <View style={styles.noConversationIcon}>
                <MessageCircle size={40} color="#3B82F6" />
              </View>
              <Text style={styles.noConversationTitle}>Select a conversation</Text>
              <Text style={styles.noConversationText}>
                Choose an athlete from the list to start messaging and get training guidance.
              </Text>
              {conversations.length === 0 && !loading && (
                <View style={styles.noConversationActions}>
                  <Text style={styles.noConversationSubtext}>
                    You haven't subscribed to any athletes yet.
                  </Text>
                  <TouchableOpacity style={styles.discoverButton}>
                    <Users size={20} color="#fff" />
                    <Text style={styles.discoverButtonText}>Discover Athletes</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      </View>

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
          <Eye size={22} color="#666" />
          <Text style={styles.navLabel}>Browse</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/member-feedback')}>
          <MessageSquare size={22} color="#666" />
          <Text style={styles.navLabel}>Feedback</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => {}}>
          <MessageCircle size={22} color="#4a90e2" />
          <Text style={[styles.navLabel, styles.navActive]}>Messages</Text>
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
    flexDirection: 'row',
  },
  conversationsContainer: {
    width: '40%',
    backgroundColor: '#fff',
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  conversationsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  conversationsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  conversationsList: {
    flex: 1,
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
    paddingHorizontal: 32,
  },
  conversationItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  selectedConversation: {
    backgroundColor: '#eff6ff',
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  conversationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#fff',
  },
  conversationInfo: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  conversationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  coachBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 8,
  },
  coachBadgeText: {
    fontSize: 10,
    color: '#3b82f6',
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 12,
    color: '#6b7280',
  },
  conversationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: '#3b82f6',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  unreadText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  chatContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  chatHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  chatAvatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  chatAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  chatOnlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#fff',
  },
  chatInfo: {
    flex: 1,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  chatStatus: {
    fontSize: 14,
    color: '#6b7280',
  },
  chatActions: {
    flexDirection: 'row',
    gap: 8,
  },
  chatActionButton: {
    padding: 8,
    borderRadius: 8,
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  emptyMessages: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyMessagesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessagesText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  messageSuggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  suggestionButton: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  suggestionText: {
    fontSize: 14,
    color: '#6b7280',
  },
  messagesList: {
    gap: 12,
  },
  messageContainer: {
    marginBottom: 8,
  },
  sentMessage: {
    alignItems: 'flex-end',
  },
  receivedMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 16,
  },
  sentBubble: {
    backgroundColor: '#3b82f6',
  },
  receivedBubble: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  messageText: {
    fontSize: 16,
    marginBottom: 4,
  },
  sentText: {
    color: '#fff',
  },
  receivedText: {
    color: '#1f2937',
  },
  messageTime: {
    fontSize: 12,
  },
  sentTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  receivedTime: {
    color: '#6b7280',
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
    padding: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  inputButton: {
    padding: 8,
    borderRadius: 8,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  messageInput: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    textAlignVertical: 'top',
  },
  emojiButton: {
    padding: 4,
  },
  sendButton: {
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#e5e7eb',
  },
  noConversationState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  noConversationIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  noConversationTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  noConversationText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  noConversationActions: {
    alignItems: 'center',
  },
  noConversationSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginBottom: 16,
  },
  discoverButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  discoverButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
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