import { parseFuncupQrScanPayload } from '@funcup/shared';
import { useFocusEffect } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Link, router } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  ActivityIndicator,
} from 'react-native';
import { AppButton, AppScreen, AppText } from '../../../src/components/ui/primitives';
import { visualSystemTokens } from '@funcup/shared';
import { pageStyles } from '../../../src/theme/pageStyles';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      setScanned(false);
      setParseError(null);
    }, [])
  );

  const handleBarcodeScanned = useCallback(
    ({ data }: { data: string }) => {
      if (scanned) return;
      setScanned(true);
      setParseError(null);
      const hash = parseFuncupQrScanPayload(data);
      if (hash) {
        router.push({ pathname: '/q/[hash]', params: { hash } });
        return;
      }
      setParseError(
        'Nie rozpoznano kodu funcup. Zeskanuj kod z aplikacji palarni (adres zakończony na /q/…).'
      );
    },
    [scanned]
  );

  const handleRetry = useCallback(() => {
    setScanned(false);
    setParseError(null);
  }, []);

  if (!permission) {
    return (
      <AppScreen style={pageStyles.centered}>
        <ActivityIndicator size="large" />
        <AppText tone="secondary">Sprawdzanie dostępu do kamery…</AppText>
      </AppScreen>
    );
  }

  if (!permission.granted) {
    return (
      <AppScreen style={styles.pad}>
        <AppText variant="h2" weight="700">Dostęp do kamery</AppText>
        <AppText tone="secondary" style={styles.body}>
          Aby skanować kody QR z opakowań kawy, zezwól aplikacji na użycie aparatu.
        </AppText>
        <AppButton label="Zezwól na kamerę" onPress={() => void requestPermission()} />
        <Link href="/(tabs)/hub" style={styles.link}>
          Wróć do Coffee Hub
        </Link>
      </AppScreen>
    );
  }

  return (
    <AppScreen style={styles.root}>
      <View style={styles.header}>
        <AppText variant="h2" weight="700">Scan Coffee</AppText>
        <AppText tone="secondary" style={styles.body}>
          Scan the QR code from the coffee package for the lot details, brewing instructions, tasting notes and more.
        </AppText>
      </View>

      <View style={styles.cameraBox}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        />
      </View>

      <Link href="/(tabs)/hub" style={styles.linkBelowCamera}>
        Back to My Coffee House.
      </Link>

      {parseError ? (
        <View style={styles.errorBox}>
          <AppText tone="danger">{parseError}</AppText>
          <AppButton label="Skanuj ponownie" onPress={handleRetry} />
        </View>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  root: { 
    flex: 1 
  },
  header: { 
    padding: visualSystemTokens.spacing.lg,
    paddingBottom: visualSystemTokens.spacing.sm,
    gap: visualSystemTokens.spacing.xs,
  },
  body: { 
    lineHeight: 22,
  },
  link: { 
    fontSize: visualSystemTokens.typography.bodyMD,
    color: visualSystemTokens.colors.accentPrimary, 
    fontFamily: 'SplineSans_700Bold',
    marginTop: visualSystemTokens.spacing.xxs,
  },
  linkBelowCamera: {
    fontSize: visualSystemTokens.typography.bodyMD,
    color: visualSystemTokens.colors.accentPrimary,
    fontFamily: 'SplineSans_700Bold',
    marginHorizontal: visualSystemTokens.spacing.lg,
    marginBottom: visualSystemTokens.spacing.sm,
  },
  cameraBox: { 
    marginBottom: visualSystemTokens.spacing.md,
    borderRadius: visualSystemTokens.radius.lg,
    overflow: 'hidden',
    aspectRatio: 1,
    alignSelf: 'stretch',
    marginHorizontal: visualSystemTokens.spacing.xl,
  },
  errorBox: { 
    padding: visualSystemTokens.spacing.md,
    gap: visualSystemTokens.spacing.sm,
    backgroundColor: visualSystemTokens.colors.surfaceMuted,
  },
  pad: { 
    flex: 1, 
    padding: visualSystemTokens.spacing.xl,
    gap: visualSystemTokens.spacing.sm,
    justifyContent: 'center',
  },
});
