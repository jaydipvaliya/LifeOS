import { useRouter } from 'expo-router';
import { ArrowRight, CalendarCheck, FileText, ShieldCheck, Sparkles } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  Badge,
  Button,
  Divider,
  EditorialCard,
  EditorialText,
  Screen,
} from '../../src/components/ui';
import { useTheme } from '../../src/theme';

const INTRO_SLIDES = [
  {
    eyebrow: '01 · Vault',
    title: 'Every essential document, organized calmly.',
    body: 'Store invoices, academic certificates, IDs, and policies in private encrypted storage with instant search.',
    icon: FileText,
  },
  {
    eyebrow: '02 · Intelligence',
    title: 'From document to verified action.',
    body: 'LifeOS extracts key dates, warranty periods, and amounts for your confirmation—never guessing or acting silently.',
    icon: Sparkles,
  },
  {
    eyebrow: '03 · Continuity',
    title: 'Never miss a renewal or warranty.',
    body: 'Connect purchases to assets, track subscriptions, and receive quiet, timely reminders before deadlines arrive.',
    icon: CalendarCheck,
  },
] as const;

export default function WelcomeScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [activeSlide, setActiveSlide] = useState(0);

  const slide = INTRO_SLIDES[activeSlide] ?? INTRO_SLIDES[0];
  const SlideIcon = slide.icon;

  return (
    <Screen contentStyle={styles.container}>
      <View>
        <View style={styles.topRow}>
          <EditorialText variant="editorialEyebrow" tone="secondaryForest" uppercase>
            LifeOS
          </EditorialText>
          <Badge label="Your life, organized." tone="sage" />
        </View>

        <EditorialText
          variant="displayEditorial"
          tone="primary"
          style={{ marginTop: theme.spacing.xl }}
        >
          Calm clarity for every responsibility.
        </EditorialText>

        <EditorialText variant="bodyLarge" tone="secondary" style={{ marginTop: theme.spacing.sm }}>
          Documents, warranties, deadlines, and subscriptions unified in one editorial workspace.
        </EditorialText>

        <EditorialCard variant="secondary" style={{ marginTop: theme.spacing.xxl }}>
          <View style={styles.slideHeader}>
            <EditorialText variant="editorialEyebrow" tone="secondaryForest" uppercase>
              {slide.eyebrow}
            </EditorialText>
            <SlideIcon size={20} strokeWidth={1.75} color={theme.colors.brand.primaryForest} />
          </View>

          <EditorialText
            variant="sectionHeading"
            tone="primary"
            style={{ marginTop: theme.spacing.sm }}
          >
            {slide.title}
          </EditorialText>

          <EditorialText variant="body" tone="secondary" style={{ marginTop: theme.spacing.xs }}>
            {slide.body}
          </EditorialText>

          <Divider style={{ marginVertical: theme.spacing.md }} />

          <View style={styles.pagerRow}>
            <View style={styles.dotsRow}>
              {INTRO_SLIDES.map((item, index) => (
                <Pressable
                  key={item.eyebrow}
                  onPress={() => setActiveSlide(index)}
                  accessibilityRole="button"
                  accessibilityLabel={`View slide ${index + 1}`}
                  hitSlop={8}
                  style={[
                    styles.dot,
                    {
                      width: activeSlide === index ? 22 : 8,
                      backgroundColor:
                        activeSlide === index
                          ? theme.colors.brand.primaryForest
                          : theme.colors.brand.sage,
                    },
                  ]}
                />
              ))}
            </View>

            <Pressable
              onPress={() => setActiveSlide((prev) => (prev + 1) % INTRO_SLIDES.length)}
              accessibilityRole="button"
              hitSlop={8}
            >
              <EditorialText variant="label" tone="forest">
                Next pillar
              </EditorialText>
            </Pressable>
          </View>
        </EditorialCard>
      </View>

      <View style={[styles.footer, { gap: theme.spacing.sm }]}>
        <View style={styles.trustRow}>
          <ShieldCheck size={16} strokeWidth={1.75} color={theme.colors.brand.secondaryForest} />
          <EditorialText variant="caption" tone="muted">
            Private storage · DPDP consent controls · Zero ad tracking
          </EditorialText>
        </View>

        <Button
          label="Create Account"
          size="lg"
          fullWidth
          rightIcon={<ArrowRight size={18} strokeWidth={2} color={theme.colors.text.inverse} />}
          onPress={() => router.push('/(auth)/register')}
        />
        <Button
          label="I already have an account"
          variant="secondary"
          size="lg"
          fullWidth
          onPress={() => router.push('/(auth)/login')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
    gap: 32,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pagerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 4,
  },
  footer: {
    width: '100%',
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 4,
  },
});
