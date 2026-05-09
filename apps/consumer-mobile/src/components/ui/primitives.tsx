import { visualSystemTokens } from '@funcup/shared';
import { HeaderShownContext } from '@react-navigation/elements';
import { useContext } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, type ScrollViewProps, type TextInputProps, type TextProps, type ViewProps } from 'react-native';
import { SafeAreaView, type Edge, type SafeAreaViewProps } from 'react-native-safe-area-context';

const { colors, spacing, radius, typography, recipes, elevation, motion } = visualSystemTokens;

/** @deprecated Keep aliases for older callsites. */
type TextVariant =
  | 'hero'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'body'
  | 'bodySm'
  | 'caption'
  | 'display'
  | 'label'
  | 'mono';
type TextTone = 'primary' | 'secondary' | 'muted' | 'onPrimary' | 'inverse' | 'danger' | 'success' | 'warning' | 'info';

type ButtonVariant = 'primary' | 'secondary' | 'contrast' | 'ghost';

const toneColor: Record<TextTone, string> = {
  primary: colors.textPrimary,
  secondary: colors.textSecondary,
  muted: colors.textMuted,
  onPrimary: colors.textOnPrimary,
  inverse: colors.textInverse,
  danger: colors.danger,
  success: colors.success,
  warning: colors.warning,
  info: colors.info,
};

const textSize: Record<TextVariant, number> = {
  display: typography.headingXL,
  hero: typography.hero,
  h1: typography.headingXL,
  h2: typography.headingLG,
  h3: typography.headingSM,
  body: typography.bodyMD,
  bodySm: typography.bodySM,
  caption: typography.caption,
  label: typography.bodySM,
  mono: typography.bodySM,
};

const textLineHeight: Record<TextVariant, number> = {
  display: typography.lineHeight.headingXL,
  hero: typography.lineHeight.hero,
  h1: typography.lineHeight.headingXL,
  h2: typography.lineHeight.headingLG,
  h3: typography.lineHeight.headingSM,
  body: typography.lineHeight.bodyMD,
  bodySm: typography.lineHeight.bodySM,
  caption: typography.lineHeight.caption,
  label: typography.lineHeight.bodySM,
  mono: typography.lineHeight.bodySM,
};

const textTracking: Partial<Record<TextVariant, number>> = {
  display: typography.tracking.tight,
  h1: typography.tracking.tight,
  h2: typography.tracking.normal,
  caption: typography.tracking.wide,
  label: typography.tracking.wide,
};

const textFamily: Partial<Record<TextVariant, string>> = {
  display: typography.fontFamily.displayNative,
  hero: typography.fontFamily.displayNative,
  mono: typography.fontFamily.monoNative,
};

function resolveTextFontFamily(variant: TextVariant, weight: '400' | '500' | '600' | '700' | '800'): string {
  if (variant === 'mono') return typography.fontFamily.monoNative;
  if (variant === 'display' || variant === 'hero' || variant === 'h1' || variant === 'h2') {
    return 'SplineSans_700Bold';
  }
  if (weight === '700' || weight === '800') return 'SplineSans_700Bold';
  if (weight === '500' || weight === '600') return 'SplineSans_500Medium';
  return textFamily[variant] ?? typography.fontFamily.bodyNative;
}

const SAFE_AREA_EDGES_ALL: Edge[] = ['top', 'right', 'bottom', 'left'];
const SAFE_AREA_EDGES_UNDER_HEADER: Edge[] = ['right', 'bottom', 'left'];

function resolveSafeAreaEdges(edges: SafeAreaViewProps['edges'], headerShown: boolean): SafeAreaViewProps['edges'] {
  if (edges != null) return edges;
  return headerShown ? SAFE_AREA_EDGES_UNDER_HEADER : SAFE_AREA_EDGES_ALL;
}

export function AppScreen(props: SafeAreaViewProps) {
  const headerShown = useContext(HeaderShownContext);
  const edges = resolveSafeAreaEdges(props.edges, Boolean(headerShown));
  return <SafeAreaView {...props} edges={edges} style={[primitives.safeArea, props.style]} />;
}

export function AppScrollScreen(props: ScrollViewProps & { safeAreaProps?: SafeAreaViewProps }) {
  const headerShown = useContext(HeaderShownContext);
  const { safeAreaProps, style, ...scrollProps } = props;
  const edges = resolveSafeAreaEdges(safeAreaProps?.edges, Boolean(headerShown));
  return (
    <SafeAreaView {...safeAreaProps} edges={edges} style={[primitives.safeArea, safeAreaProps?.style]}>
      <ScrollView {...scrollProps} style={[primitives.scroll, style]} />
    </SafeAreaView>
  );
}

export function AppPanel(props: ViewProps & { padded?: boolean }) {
  return <View {...props} style={[primitives.panel, props.padded !== false && primitives.panelPadded, props.style]} />;
}

export function AppText(props: TextProps & { variant?: TextVariant; tone?: TextTone; weight?: '400' | '500' | '600' | '700' | '800' }) {
  const variant = props.variant ?? 'body';
  const tone = props.tone ?? 'primary';
  const weight = props.weight ?? '500';
  const fontFamily = resolveTextFontFamily(variant, weight);
  return (
    <Text
      {...props}
      style={[
        primitives.text,
        {
          fontSize: textSize[variant],
          lineHeight: textLineHeight[variant],
          letterSpacing: textTracking[variant] ?? typography.tracking.normal,
          fontFamily,
          color: toneColor[tone],
          fontWeight: variant === 'mono' ? '400' : undefined,
        },
        props.style,
      ]}
    />
  );
}

export function AppCard(props: ViewProps & { elevated?: boolean; hero?: boolean }) {
  return (
    <View
      {...props}
      style={[primitives.card, props.elevated !== false && primitives.cardElevated, props.hero && primitives.cardHero, props.style]}
    />
  );
}

export function AppButton(props: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
  accessibilityLabel?: string;
}) {
  const variant = props.variant ?? 'primary';
  const isPrimaryLike = variant === 'primary' || variant === 'contrast';
  return (
    <Pressable
      onPress={props.onPress}
      disabled={props.disabled}
      accessibilityRole="button"
      accessibilityLabel={props.accessibilityLabel ?? props.label}
      style={({ pressed }) => [
        primitives.buttonBase,
        variant === 'primary' && primitives.buttonPrimary,
        variant === 'secondary' && primitives.buttonSecondary,
        variant === 'contrast' && primitives.buttonContrast,
        variant === 'ghost' && primitives.buttonGhost,
        pressed && !props.disabled ? primitives.buttonPressed : null,
        props.disabled ? primitives.buttonDisabled : null,
      ]}
    >
      <AppText variant="body" weight="700" tone={isPrimaryLike ? 'onPrimary' : 'primary'}>
        {props.label}
      </AppText>
    </Pressable>
  );
}

export function AppInput(props: TextInputProps & { hasError?: boolean }) {
  const multilineStyle = props.multiline
    ? {
        height: undefined,
        minHeight: recipes.input.height * 2.4,
        paddingTop: spacing.sm,
        paddingBottom: spacing.sm,
        textAlignVertical: 'top' as const,
      }
    : null;

  return (
    <TextInput
      {...props}
      placeholderTextColor={colors.textSecondary}
      style={[primitives.input, multilineStyle, props.hasError && primitives.inputError, props.style]}
    />
  );
}

export function AppChip(props: { label: string; inverse?: boolean }) {
  return (
    <View style={[primitives.chip, props.inverse && primitives.chipInverse]}>
      <AppText variant="bodySm" tone={props.inverse ? 'inverse' : 'secondary'}>
        {props.label}
      </AppText>
    </View>
  );
}

export const primitives = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: recipes.screen.background,
  },
  scroll: {
    flex: 1,
    width: '100%',
  },
  panel: {
    flex: 1,
    width: '100%',
  },
  panelPadded: {
    paddingHorizontal: recipes.screen.paddingHorizontal,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  text: {
    includeFontPadding: false,
  },
  card: {
    backgroundColor: recipes.card.background,
    borderColor: recipes.card.borderColor,
    borderRadius: recipes.card.borderRadius,
    borderWidth: recipes.card.borderWidth,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  cardElevated: {
    ...elevation.native.sm,
  },
  cardHero: {
    backgroundColor: colors.heroPrimary,
    borderColor: colors.borderInverse,
  },
  buttonBase: {
    minHeight: 48,
    borderRadius: recipes.button.primary.radius,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  buttonPrimary: {
    backgroundColor: recipes.button.primary.background,
  },
  buttonContrast: {
    backgroundColor: recipes.button.contrast.background,
  },
  buttonSecondary: {
    backgroundColor: recipes.button.secondary.background,
    borderWidth: 1,
    borderColor: recipes.button.secondary.borderColor,
  },
  buttonGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  buttonPressed: {
    opacity: motion.press.opacity,
    transform: [{ scale: motion.press.scale }],
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  input: {
    height: recipes.input.height,
    borderWidth: recipes.input.borderWidth,
    borderColor: recipes.input.borderColor,
    borderRadius: recipes.input.borderRadius,
    backgroundColor: recipes.input.background,
    paddingHorizontal: spacing.sm,
    color: recipes.input.text,
    width: '100%',
  },
  inputError: {
    borderColor: recipes.input.borderColorError,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    backgroundColor: colors.surfaceElevated,
  },
  chipInverse: {
    borderColor: colors.borderInverse,
    backgroundColor: colors.heroContrast,
  },
});
