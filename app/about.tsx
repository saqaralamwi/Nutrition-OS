import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { spacing } from '../src/presentation/theme';
import ArabicText from '../src/presentation/components/ArabicText';

// Slate theme palette
const darkTheme = {
  background: '#0F172A',
  surface: '#1E293B',
  surfaceSecondary: '#334155',
  border: '#475569',
  accent: '#10B981', // Emerald green
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  white: '#FFFFFF',
  forestGreen: '#1B6B4A', // Required solid save color
  whatsapp: '#25D366',
  email: '#3B82F6',
  telegram: '#0088cc',
};

export default function AboutScreen() {
  const router = useRouter();

  const handleOpenLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.warn('Cannot open URL: ' + url);
      }
    } catch (error) {
      console.error('Error opening URL: ', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtnRow} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-forward" size={24} color={darkTheme.textPrimary} />
          <ArabicText style={styles.backBtnText}>العودة للرئيسية</ArabicText>
        </TouchableOpacity>
        <ArabicText bold style={styles.headerTitle}>عن المطور</ArabicText>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle-outline" size={72} color={darkTheme.accent} />
          </View>
          <ArabicText bold style={styles.developerName}>أنس منصور الأموي</ArabicText>
          <View style={styles.brandingBlock}>
            <ArabicText style={styles.professionalBranding}>
              {"أخصائي التغذية العلاجية ومستشار الأنظمة (Systems Consultant & Clinical Nutritionist)\nمطور ومصمم نظام إدارة التغذية العلاجية المتكامل (Clinical-ADCN)"}
            </ArabicText>
          </View>
        </View>

        {/* Contact Grid Title */}
        <ArabicText bold style={styles.sectionTitle}>قنوات التواصل الرسمية</ArabicText>

        {/* WhatsApp Card */}
        <TouchableOpacity
          style={styles.contactCard}
          onPress={() => handleOpenLink('https://wa.me/967711113914')}
          activeOpacity={0.8}
        >
          <View style={[styles.iconContainer, { backgroundColor: darkTheme.whatsapp + '20' }]}>
            <Ionicons name="logo-whatsapp" size={28} color={darkTheme.whatsapp} />
          </View>
          <View style={styles.contactInfo}>
            <ArabicText bold style={styles.contactTitle}>تواصل عبر الواتساب</ArabicText>
            <ArabicText style={styles.contactSubtitle}>للاستشارات السريرية الفورية والدعم الفني الميداني</ArabicText>
          </View>
          <Ionicons name="chevron-back" size={20} color={darkTheme.textSecondary} />
        </TouchableOpacity>

        {/* Email Card */}
        <TouchableOpacity
          style={styles.contactCard}
          onPress={() => handleOpenLink('mailto:Anas.umayyad@gmail.com')}
          activeOpacity={0.8}
        >
          <View style={[styles.iconContainer, { backgroundColor: darkTheme.email + '20' }]}>
            <Ionicons name="mail-outline" size={28} color={darkTheme.email} />
          </View>
          <View style={styles.contactInfo}>
            <ArabicText bold style={styles.contactTitle}>البريد الإلكتروني المهني</ArabicText>
            <ArabicText style={styles.contactSubtitle}>للمراسلات الرسمية، طلبات التطوير، والتعاون التقني</ArabicText>
          </View>
          <Ionicons name="chevron-back" size={20} color={darkTheme.textSecondary} />
        </TouchableOpacity>

        {/* Telegram Card */}
        <TouchableOpacity
          style={styles.contactCard}
          onPress={() => handleOpenLink('https://t.me/ANASALAMWI')}
          activeOpacity={0.8}
        >
          <View style={[styles.iconContainer, { backgroundColor: darkTheme.telegram + '20' }]}>
            <Ionicons name="paper-plane-outline" size={28} color={darkTheme.telegram} />
          </View>
          <View style={styles.contactInfo}>
            <ArabicText bold style={styles.contactTitle}>حساب التليجرام الرسمي</ArabicText>
            <ArabicText style={styles.contactSubtitle}>للتنسيق السريع ومتابعة تحديثات المنظومة البرمجية</ArabicText>
          </View>
          <Ionicons name="chevron-back" size={20} color={darkTheme.textSecondary} />
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <ArabicText style={styles.footerText}>
            جميع الحقوق محفوظة © ٢٠٢٦ | Clinical-ADCN v1.1.0
          </ArabicText>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: darkTheme.background,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? 40 : 20,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: darkTheme.surface,
    borderBottomWidth: 1,
    borderBottomColor: darkTheme.border,
  },
  backBtnRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
  },
  backBtnText: {
    fontSize: 14,
    color: darkTheme.textPrimary,
    fontFamily: 'ThmanyahSans-Medium',
  },
  headerTitle: {
    fontSize: 18,
    color: darkTheme.textPrimary,
    fontFamily: 'ThmanyahSans-Bold',
  },
  profileCard: {
    backgroundColor: darkTheme.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: darkTheme.border,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  avatarContainer: {
    marginBottom: spacing.md,
  },
  developerName: {
    fontSize: 22,
    color: darkTheme.white,
    fontFamily: 'ThmanyahSans-Bold',
    textAlign: 'center',
  },
  brandingBlock: {
    backgroundColor: darkTheme.forestGreen,
    borderRadius: 8,
    padding: spacing.md,
    marginTop: spacing.md,
    width: '100%',
  },
  professionalBranding: {
    fontSize: 13,
    color: darkTheme.white,
    fontFamily: 'ThmanyahSans-Medium',
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 16,
    color: darkTheme.textPrimary,
    marginBottom: spacing.md,
    textAlign: 'right',
    fontFamily: 'ThmanyahSans-Bold',
  },
  contactCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: darkTheme.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: darkTheme.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInfo: {
    flex: 1,
    alignItems: 'flex-end',
  },
  contactTitle: {
    fontSize: 15,
    color: darkTheme.white,
    fontFamily: 'ThmanyahSans-Bold',
    textAlign: 'right',
  },
  contactSubtitle: {
    fontSize: 12,
    color: darkTheme.textSecondary,
    fontFamily: 'ThmanyahSans-Medium',
    textAlign: 'right',
    marginTop: 4,
    lineHeight: 16,
  },
  footer: {
    marginTop: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 12,
    color: darkTheme.textSecondary,
    fontFamily: 'ThmanyahSans-Medium',
    textAlign: 'center',
  },
});
