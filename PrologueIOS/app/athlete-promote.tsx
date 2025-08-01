import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { TrendingUp, BarChart3, Share2, Copy, Calendar, Heart, MessageCircle, Users, Target, Eye, Download, X, Instagram, Twitter, Facebook, Youtube, Filter, Plus, Send } from 'lucide-react-native';
import { useRouter } from 'expo-router';

const promotionStats = {
  totalReach: 15420,
  engagement: 8.7,
  clicks: 1240,
  conversions: 89,
};

const socialPosts = [
  {
    id: 1,
    platform: 'instagram',
    content: 'Just dropped a new video on mental performance! 🧠💪 Link in bio',
    likes: 234,
    comments: 18,
    shares: 12,
    timestamp: '2 hours ago',
    status: 'published',
  },
  {
    id: 2,
    platform: 'twitter',
    content:
      "The key to peak performance isn't just physical training - it's mental preparation. New content coming soon! 🎯",
    likes: 89,
    comments: 7,
    shares: 23,
    timestamp: '1 day ago',
    status: 'published',
  },
  {
    id: 3,
    platform: 'youtube',
    content: 'Complete Guide to College Recruitment - Everything You Need to Know',
    likes: 456,
    comments: 34,
    shares: 67,
    timestamp: '3 days ago',
    status: 'scheduled',
  },
];

const contentTemplates = [
  {
    id: 1,
    title: 'Instagram Story Template',
    description: 'Promote your latest content with this engaging story template',
    platform: 'instagram',
    type: 'story',
  },
  {
    id: 2,
    title: 'YouTube Thumbnail',
    description: 'Eye-catching thumbnail for your training videos',
    platform: 'youtube',
    type: 'thumbnail',
  },
  {
    id: 3,
    title: 'Twitter Post Template',
    description: 'Professional template for sharing insights',
    platform: 'twitter',
    type: 'post',
  },
];

const getPlatformIcon = (platform: string) => {
  switch (platform) {
    case 'instagram':
      return <Instagram size={16} color="#E1306C" />;
    case 'twitter':
      return <Twitter size={16} color="#1DA1F2" />;
    case 'facebook':
      return <Facebook size={16} color="#1877F3" />;
    case 'youtube':
      return <Youtube size={16} color="#FF0000" />;
    default:
      return <Share2 size={16} color="#6B7280" />;
  }
};

export default function AthletePromoteScreen() {
  const [activeTab, setActiveTab] = useState<'overview' | 'posts' | 'templates' | 'schedule'>('overview');
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [promotionType, setPromotionType] = useState('boost');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [postContent, setPostContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['instagram']);
  const router = useRouter();

  const handlePlatformToggle = (platform: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  const handleSchedulePost = () => {
    // Mock scheduling
    setPostContent('');
  };

  const handlePromotePayment = async () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      setShowPromoteModal(false);
    }, 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <TrendingUp size={22} color="#8B5CF6" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Promote</Text>
        <View style={{ width: 32 }} />
      </View>
      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Reach</Text>
          <Text style={styles.statValue}>{promotionStats.totalReach.toLocaleString()}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Engagement</Text>
          <Text style={styles.statValue}>{promotionStats.engagement}%</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Clicks</Text>
          <Text style={styles.statValue}>{promotionStats.clicks}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Conversions</Text>
          <Text style={styles.statValue}>{promotionStats.conversions}</Text>
        </View>
      </View>
      {/* Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity style={[styles.tabBtn, activeTab === 'overview' && styles.tabBtnActive]} onPress={() => setActiveTab('overview')}>
          <BarChart3 size={18} color={activeTab === 'overview' ? '#8B5CF6' : '#6B7280'} />
          <Text style={[styles.tabBtnText, activeTab === 'overview' && styles.tabBtnTextActive]}>Overview</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, activeTab === 'posts' && styles.tabBtnActive]} onPress={() => setActiveTab('posts')}>
          <Share2 size={18} color={activeTab === 'posts' ? '#8B5CF6' : '#6B7280'} />
          <Text style={[styles.tabBtnText, activeTab === 'posts' && styles.tabBtnTextActive]}>Posts</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, activeTab === 'templates' && styles.tabBtnActive]} onPress={() => setActiveTab('templates')}>
          <Copy size={18} color={activeTab === 'templates' ? '#8B5CF6' : '#6B7280'} />
          <Text style={[styles.tabBtnText, activeTab === 'templates' && styles.tabBtnTextActive]}>Templates</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tabBtn, activeTab === 'schedule' && styles.tabBtnActive]} onPress={() => setActiveTab('schedule')}>
          <Calendar size={18} color={activeTab === 'schedule' ? '#8B5CF6' : '#6B7280'} />
          <Text style={[styles.tabBtnText, activeTab === 'schedule' && styles.tabBtnTextActive]}>Schedule</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.content}>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <View style={styles.tabContent}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Recent Performance</Text>
              <Text style={styles.cardDesc}>
                Instagram: +12% engagement{"\n"}
                YouTube: +8% views{"\n"}
                Twitter: +15% retweets
              </Text>
            </View>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Top Performing Content</Text>
              <Text style={styles.cardDesc}>
                Mental Performance Tips: 2.3k views • 89% engagement{"\n"}
                Nutrition Guide: 1.8k views • 76% engagement
              </Text>
            </View>
          </View>
        )}
        {/* Posts Tab */}
        {activeTab === 'posts' && (
          <View style={styles.tabContent}>
            {socialPosts.map((post) => (
              <View key={post.id} style={styles.postCard}>
                <View style={styles.postHeader}>
                  <View style={styles.postPlatform}>{getPlatformIcon(post.platform)}</View>
                  <Text style={styles.postStatus}>{post.status}</Text>
                  <Text style={styles.postTimestamp}>{post.timestamp}</Text>
                </View>
                <Text style={styles.postContent}>{post.content}</Text>
                <View style={styles.postStatsRow}>
                  <View style={styles.postStat}><Heart size={14} color="#EF4444" /><Text style={styles.postStatText}>{post.likes}</Text></View>
                  <View style={styles.postStat}><MessageCircle size={14} color="#3B82F6" /><Text style={styles.postStatText}>{post.comments}</Text></View>
                  <View style={styles.postStat}><Share2 size={14} color="#6B7280" /><Text style={styles.postStatText}>{post.shares}</Text></View>
                </View>
              </View>
            ))}
          </View>
        )}
        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <View style={styles.tabContent}>
            {contentTemplates.map((template) => (
              <View key={template.id} style={styles.templateCard}>
                <View style={styles.templateHeader}>
                  {getPlatformIcon(template.platform)}
                  <Text style={styles.templateTitle}>{template.title}</Text>
                </View>
                <Text style={styles.templateDesc}>{template.description}</Text>
                <View style={styles.templateActions}>
                  <TouchableOpacity style={styles.templateBtn}><Download size={16} color="#fff" /><Text style={styles.templateBtnText}>Use</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.templateBtnOutline}><Eye size={16} color="#3B82F6" /></TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
        {/* Schedule Tab */}
        {activeTab === 'schedule' && (
          <View style={styles.tabContent}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Schedule New Post</Text>
              <TextInput
                style={styles.input}
                placeholder="What would you like to share?"
                value={postContent}
                onChangeText={setPostContent}
                multiline
              />
              <View style={styles.platformRow}>
                {['instagram', 'twitter', 'facebook', 'youtube'].map((platform) => (
                  <TouchableOpacity
                    key={platform}
                    style={[styles.platformBtn, selectedPlatforms.includes(platform) && styles.platformBtnActive]}
                    onPress={() => handlePlatformToggle(platform)}
                  >
                    {getPlatformIcon(platform)}
                    <Text style={styles.platformBtnText}>{platform.charAt(0).toUpperCase() + platform.slice(1)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.scheduleRow}>
                <TextInput style={styles.input} placeholder="Date (YYYY-MM-DD)" />
                <TextInput style={styles.input} placeholder="Time (HH:MM)" />
              </View>
              <View style={styles.scheduleActions}>
                <TouchableOpacity style={styles.scheduleBtn} onPress={handleSchedulePost}>
                  <Calendar size={16} color="#fff" />
                  <Text style={styles.scheduleBtnText}>Schedule</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.scheduleBtnOutline}>
                  <Send size={16} color="#3B82F6" />
                  <Text style={styles.scheduleBtnOutlineText}>Post Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
      {/* Promote Modal */}
      <Modal visible={showPromoteModal} transparent animationType="fade" onRequestClose={() => setShowPromoteModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Promote Your Content</Text>
            <Text style={styles.modalLabel}>Promotion Type</Text>
            <View style={styles.modalSelectRow}>
              <TouchableOpacity style={[styles.modalSelectBtn, promotionType === 'boost' && styles.modalSelectBtnActive]} onPress={() => setPromotionType('boost')}>
                <Text style={styles.modalSelectBtnText}>Content Boost ($20)</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalSelectBtn, promotionType === 'featured' && styles.modalSelectBtnActive]} onPress={() => setPromotionType('featured')}>
                <Text style={styles.modalSelectBtnText}>Featured Post ($20)</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalSelectBtn, promotionType === 'sponsored' && styles.modalSelectBtnActive]} onPress={() => setPromotionType('sponsored')}>
                <Text style={styles.modalSelectBtnText}>Sponsored ($20)</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.modalDesc}>Boost your content visibility and reach more athletes with our promotion service.</Text>
            <View style={styles.modalPriceBox}>
              <Text style={styles.modalPrice}>$20.00</Text>
              <Text style={styles.modalPriceNote}>One-time payment</Text>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowPromoteModal(false)} disabled={isProcessingPayment}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalPayBtn} onPress={handlePromotePayment} disabled={isProcessingPayment}>
                {isProcessingPayment ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalPayBtnText}>Pay $20</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Floating Promote Button */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowPromoteModal(true)}>
        <TrendingUp size={24} color="#fff" />
        <Text style={styles.fabText}>Promote</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
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
  backButton: { padding: 8 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', margin: 16 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 12, marginHorizontal: 4, alignItems: 'center', elevation: 2 },
  statLabel: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#3B82F6' },
  tabsRow: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 8, marginBottom: 8 },
  tabBtn: { flex: 1, alignItems: 'center', paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: '#8B5CF6', backgroundColor: '#F3F4F6' },
  tabBtnText: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  tabBtnTextActive: { color: '#8B5CF6', fontWeight: 'bold' },
  content: { flex: 1, paddingHorizontal: 12 },
  tabContent: { marginTop: 12 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 16, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
  cardDesc: { fontSize: 14, color: '#6B7280', marginBottom: 4 },
  postCard: { backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 12, elevation: 1 },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  postPlatform: { marginRight: 8 },
  postStatus: { fontSize: 12, color: '#3B82F6', marginRight: 8 },
  postTimestamp: { fontSize: 12, color: '#6B7280', marginLeft: 'auto' },
  postContent: { fontSize: 15, color: '#111827', marginBottom: 8 },
  postStatsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  postStat: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
  postStatText: { fontSize: 13, color: '#374151', marginLeft: 4 },
  templateCard: { backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 12, elevation: 1 },
  templateHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  templateTitle: { fontSize: 15, fontWeight: 'bold', color: '#1F2937', marginLeft: 8 },
  templateDesc: { fontSize: 13, color: '#6B7280', marginBottom: 8 },
  templateActions: { flexDirection: 'row', alignItems: 'center' },
  templateBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3B82F6', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 14, marginRight: 8 },
  templateBtnText: { color: '#fff', fontSize: 13, marginLeft: 4 },
  templateBtnOutline: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#3B82F6', borderRadius: 6, paddingVertical: 6, paddingHorizontal: 10 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, backgroundColor: '#fff', marginBottom: 10 },
  platformRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  platformBtn: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingVertical: 6, paddingHorizontal: 12, marginRight: 8, marginBottom: 8, backgroundColor: '#fff' },
  platformBtnActive: { backgroundColor: '#E0E7FF', borderColor: '#8B5CF6' },
  platformBtnText: { fontSize: 13, color: '#374151', marginLeft: 4 },
  scheduleRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  scheduleActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  scheduleBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#8B5CF6', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 18, marginRight: 8 },
  scheduleBtnText: { color: '#fff', fontSize: 15, marginLeft: 6 },
  scheduleBtnOutline: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#3B82F6', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 18 },
  scheduleBtnOutlineText: { color: '#3B82F6', fontSize: 15, marginLeft: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { backgroundColor: '#fff', borderRadius: 12, padding: 24, width: 320, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 },
  modalLabel: { fontSize: 14, color: '#374151', marginBottom: 8 },
  modalSelectRow: { flexDirection: 'row', marginBottom: 12 },
  modalSelectBtn: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, marginRight: 8 },
  modalSelectBtnActive: { backgroundColor: '#E0E7FF', borderColor: '#8B5CF6' },
  modalSelectBtnText: { fontSize: 13, color: '#374151' },
  modalDesc: { fontSize: 13, color: '#6B7280', marginBottom: 12 },
  modalPriceBox: { backgroundColor: '#F3F4F6', borderRadius: 8, padding: 12, alignItems: 'center', marginBottom: 16 },
  modalPrice: { fontSize: 18, fontWeight: 'bold', color: '#3B82F6' },
  modalPriceNote: { fontSize: 13, color: '#6B7280' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  modalCancelBtn: { flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingVertical: 10, alignItems: 'center', marginRight: 8 },
  modalCancelBtnText: { color: '#374151', fontSize: 15 },
  modalPayBtn: { flex: 1, backgroundColor: '#8B5CF6', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  modalPayBtnText: { color: '#fff', fontSize: 15 },
  fab: { position: 'absolute', right: 24, bottom: 32, backgroundColor: '#8B5CF6', borderRadius: 24, flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 20, elevation: 4 },
  fabText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
}); 