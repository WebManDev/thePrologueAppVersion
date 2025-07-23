import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Image,
} from 'react-native';
import { auth, db } from '../firebaseConfig';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  onSnapshot,
  orderBy,
  doc,
  getDoc,
} from 'firebase/firestore';
import { MessageSquare, Send, Smile, Users, Clock } from 'lucide-react-native';

export default function AthleteMessagingScreen() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // Fetch current user and conversations
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setCurrentUser(user);
        // Fetch subscribers for this athlete
        const subsQuery = query(collection(db, 'subscribers'), where('athleteId', '==', user.uid));
        const subsSnap = await getDocs(subsQuery);
        const conversationsData = subsSnap.docs.map((doc) => {
          const data = doc.data();
          return {
            id: data.memberId,
            name: data.memberName || 'Member',
            avatar: data.memberProfilePic || undefined,
            lastMessage: 'Click to start a conversation',
            unread: 0,
            online: false,
            email: data.memberEmail || '',
            sport: data.memberSport || 'Sport',
          };
        });
        setConversations(conversationsData);
        if (!selectedConversation && conversationsData.length > 0) {
          setSelectedConversation(conversationsData[0]);
        }
        setLoading(false);
      } else {
        setCurrentUser(null);
        setConversations([]);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen for messages
  useEffect(() => {
    if (!selectedConversation || !currentUser) return;
    const chatId = `${currentUser.uid}_${selectedConversation.id}`;
    const msgsQuery = query(
      collection(db, 'messages', chatId, 'chat'),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(msgsQuery, (snapshot) => {
      setMessages(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [selectedConversation, currentUser]);

  // Send message
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || !currentUser) return;
    const chatId = `${currentUser.uid}_${selectedConversation.id}`;
    try {
      await addDoc(collection(db, 'messages', chatId, 'chat'), {
        senderId: currentUser.uid,
        receiverId: selectedConversation.id,
        content: messageInput.trim(),
        createdAt: serverTimestamp(),
      });
      setMessageInput('');
    } catch (error) {
      alert('Failed to send message.');
    }
  };

  // Filter conversations
  const filteredConversations = searchQuery
    ? conversations.filter((conv) =>
        conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={() => setShowSearch(true)}
        />
      </View>
      <View style={styles.mainRow}>
        {/* Conversations List */}
        <View style={styles.conversationsCol}>
          {loading ? (
            <View style={styles.centered}><Clock size={24} color="#3B82F6" /><Text>Loading...</Text></View>
          ) : filteredConversations.length === 0 ? (
            <View style={styles.centered}><MessageSquare size={48} color="#9CA3AF" /><Text>No conversations</Text></View>
          ) : (
            <FlatList
              data={filteredConversations}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.conversationItem, selectedConversation?.id === item.id && styles.conversationItemActive]}
                  onPress={() => setSelectedConversation(item)}
                >
                  <View style={styles.avatarCircle}>
                    {item.avatar ? (
                      <Image source={{ uri: item.avatar }} style={styles.avatarImg} />
                    ) : (
                      <Users size={24} color="#9CA3AF" />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.conversationName}>{item.name}</Text>
                    <Text style={styles.conversationEmail}>{item.email}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
        {/* Chat Area */}
        <View style={styles.chatCol}>
          {selectedConversation ? (
            <View style={styles.chatArea}>
              <View style={styles.chatHeader}>
                <Text style={styles.chatName}>{selectedConversation.name}</Text>
                <Text style={styles.chatEmail}>{selectedConversation.email}</Text>
              </View>
              <FlatList
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <View style={[styles.messageBubble, item.senderId === currentUser?.uid ? styles.messageBubbleRight : styles.messageBubbleLeft]}>
                    <Text style={styles.messageText}>{item.content}</Text>
                    <Text style={styles.messageTime}>{item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleTimeString() : ''}</Text>
                  </View>
                )}
                contentContainerStyle={{ paddingVertical: 8 }}
              />
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={80}
              >
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    placeholder="Type a message..."
                    value={messageInput}
                    onChangeText={setMessageInput}
                    onSubmitEditing={handleSendMessage}
                  />
                  <TouchableOpacity style={styles.sendBtn} onPress={handleSendMessage} disabled={!messageInput.trim()}>
                    <Send size={22} color="#fff" />
                  </TouchableOpacity>
                </View>
              </KeyboardAvoidingView>
            </View>
          ) : (
            <View style={styles.centered}><Text>Select a conversation</Text></View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1F2937', marginBottom: 8 },
  searchInput: { backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 10, fontSize: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  mainRow: { flex: 1, flexDirection: 'row' },
  conversationsCol: { width: 220, backgroundColor: '#fff', borderRightWidth: 1, borderRightColor: '#E5E7EB' },
  chatCol: { flex: 1, backgroundColor: '#F9FAFB' },
  conversationItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  conversationItemActive: { backgroundColor: '#E0E7FF' },
  avatarCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarImg: { width: 40, height: 40, borderRadius: 20 },
  conversationName: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  conversationEmail: { fontSize: 12, color: '#6B7280' },
  chatArea: { flex: 1 },
  chatHeader: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', backgroundColor: '#fff' },
  chatName: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  chatEmail: { fontSize: 13, color: '#6B7280' },
  messageBubble: { maxWidth: '80%', marginVertical: 4, padding: 10, borderRadius: 12 },
  messageBubbleLeft: { backgroundColor: '#E5E7EB', alignSelf: 'flex-start' },
  messageBubbleRight: { backgroundColor: '#3B82F6', alignSelf: 'flex-end' },
  messageText: { color: '#1F2937', fontSize: 15 },
  messageTime: { fontSize: 11, color: '#6B7280', marginTop: 2 },
  inputRow: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  input: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 16, borderWidth: 1, borderColor: '#E5E7EB', marginRight: 8 },
  sendBtn: { backgroundColor: '#3B82F6', borderRadius: 20, padding: 10 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
}); 