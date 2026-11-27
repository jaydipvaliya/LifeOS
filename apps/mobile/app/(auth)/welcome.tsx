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
    shortLabel: 'Vault',
    eyebrow: '01 · Vault',
    title: 'Every essential document, organized calmly.',
    body: 'Store invoices, academic certificates, IDs, and policies in private encrypted storage with instant search.',
    icon: FileText,
    variant: 'violet' as const,
    tone: 'violet' as const,
    vibrantTone: 'violetVibrant' as const,
  },
  {
    shortLabel: 'AI',
    eyebrow: '02 · Intelligence',
    title: 'From document to verified action.',
    body: 'LifeOS extracts key dates, warranty periods, and amounts for your confirmation—never guessing or acting silently.',
    icon: Sparkles,
    variant: 'teal' as const,
    tone: 'teal' as const,
    vibrantTone: 'tealVibrant' as const,
  },
  {
    shortLabel: 'Continuity',
    eyebrow: '03 · Continuity',
    title: 'Never miss a renewal or warranty.',
    body: 'Connect purchases to assets, track subscriptions, and receive quiet, timely reminders before deadlines arrive.',
    icon: CalendarCheck,
    variant: 'coral' as const,
    tone: 'coral' as const,
    vibrantTone: 'coralVibrant' as const,
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
          <View style={styles.brandMark}>
            <View
              style={[
                styles.brandDot,
                { backgroundColor: theme.colors.m3.primary, borderRadius: theme.shapes.small },
              ]}
            >
              <Sparkles size={14} strokeWidth={2.2} color={theme.colors.m3.onPrimary} />
            </View>
            <EditorialText variant="labelLarge" tone="primary">
              LifeOS
            </EditorialText>
          </View>
          <Badge label="Your life, organized." tone="cobalt" />
        </View>

        <EditorialText
          variant="displayEditorial"
          tone="primary"
          style={{ marginTop: theme.spacing.xl }}
        >
          Calm clarity for every responsibility.
        </EditorialText>

        <EditorialText variant="bodyLarge" tone="secondary" style={{ marginTop: theme.spacing.sm }}>
          Documents, warranties, deadlines, and subscriptions unified in one expressive workspace.
        </EditorialText>

        {/* Expressive Pillar Pill Switcher */}
        <View style={[styles.pillarTabs, { marginTop: theme.spacing.xl }]}>
          {INTRO_SLIDES.map((item, index) => {
            const active = index === activeSlide;
            const accent = theme.colors.expressive[item.variant];
            return (
              <Pressable
                key={item.eyebrow}
                onPress={() => setActiveSlide(index)}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                style={[
                  styles.pillarTab,
                  {
                    backgroundColor: active
                      ? accent.container
                      : theme.colors.m3.surfaceContainerLow,
                    borderRadius: active ? theme.shapes.full : theme.shapes.medium,
                  },
                ]}
              >
                <EditorialText
                  variant="label"
                  tone={active ? item.tone : 'secondary'}
                  numberOfLines={1}
                >
                  {item.shortLabel}
                </EditorialText>
              </Pressable>
            );
          })}
        </View>

        <EditorialCard
          variant={slide.variant}
          shape="extraLarge"
          style={{ marginTop: theme.spacing.sm }}
        >
          <View style={styles.slideHeader}>
            <EditorialText variant="editorialEyebrow" tone={slide.vibrantTone} uppercase>
              {slide.eyebrow}
            </EditorialText>
            <View
              style={[
                styles.iconPill,
                {
                  backgroundColor: theme.colors.surface.elevated,
                  borderRadius: theme.shapes.medium,
                },
              ]}
            >
              <SlideIcon
                size={22}
                strokeWidth={2}
                color={theme.colors.expressive[slide.variant].base}
              />
            </View>
          </View>

          <EditorialText
            variant="sectionHeading"
            tone={slide.tone}
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
                      width: activeSlide === index ? 26 : 8,
                      backgroundColor:
                        activeSlide === index
                          ? theme.colors.expressive[item.variant].base
                          : theme.colors.m3.outlineVariant,
                    },
                  ]}
                />
              ))}
            </View>

            <Pressable
              onPress={() => setActiveSlide((prev) => (prev + 1) % INTRO_SLIDES.length)}
              accessibilityRole="button"
              hitSlop={8}
              style={[
                styles.nextPill,
                {
                  backgroundColor: theme.colors.surface.elevated,
                  borderColor: theme.colors.border.subtle,
                  borderWidth: theme.borderWidths.hairline,
                  borderRadius: theme.shapes.full,
                },
              ]}
            >
              <EditorialText
                variant="caption"
                tone={slide.tone}
                style={{ fontFamily: theme.fonts.bodySemiBold }}
              >
                Next pillar
              </EditorialText>
            </Pressable>
          </View>
        </EditorialCard>
      </View>

      <View style={[styles.footer, { gap: theme.spacing.sm }]}>
        <View style={styles.trustRow}>
          <ShieldCheck size={16} strokeWidth={1.9} color={theme.colors.m3.secondary} />
          <EditorialText variant="caption" tone="muted">
            Private storage · DPDP consent controls · Zero ad tracking
          </EditorialText>
        </View>

        <Button
          label="Create Account"
          variant="filled"
          size="lg"
          shape="pill"
          fullWidth
          rightIcon={<ArrowRight size={18} strokeWidth={2.2} color={theme.colors.m3.onPrimary} />}
          onPress={() => router.push('/(auth)/register')}
        />
        <Button
          label="I already have an account"
          variant="tonal"
          size="lg"
          shape="pill"
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
    gap: 28,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandMark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandDot: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillarTabs: {
    flexDirection: 'row',
    gap: 8,
  },
  pillarTab: {
    flex: 1,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  slideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconPill: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
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
    height: 7,
    borderRadius: 4,
  },
  nextPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
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
