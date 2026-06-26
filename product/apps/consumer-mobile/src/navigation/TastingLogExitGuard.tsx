import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '../components/ui/primitives';
import { visualSystemTokens } from '@funcup/shared';

type PendingNavigationAction = (() => void) | null;

type TastingLogExitGuardContextValue = {
  requestGuardedNavigation: (action: () => void) => void;
  setGuardEnabled: (enabled: boolean) => void;
};

const TastingLogExitGuardContext = createContext<TastingLogExitGuardContextValue | null>(null);

export function TastingLogExitGuardProvider(props: { children: ReactNode }) {
  const pendingNavigationRef = useRef<PendingNavigationAction>(null);
  const [guardEnabled, setGuardEnabledState] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const setGuardEnabled = useCallback((enabled: boolean) => {
    setGuardEnabledState(enabled);
    if (!enabled) {
      pendingNavigationRef.current = null;
      setModalVisible(false);
    }
  }, []);

  const requestGuardedNavigation = useCallback((action: () => void) => {
    if (!guardEnabled) {
      action();
      return;
    }

    pendingNavigationRef.current = action;
    setModalVisible(true);
  }, [guardEnabled]);

  const abortRating = useCallback(() => {
    const nextAction = pendingNavigationRef.current;
    pendingNavigationRef.current = null;
    setModalVisible(false);
    setGuardEnabledState(false);
    nextAction?.();
  }, []);

  const continueRating = useCallback(() => {
    pendingNavigationRef.current = null;
    setModalVisible(false);
  }, []);

  const value = useMemo(() => ({
    requestGuardedNavigation,
    setGuardEnabled,
  }), [requestGuardedNavigation, setGuardEnabled]);

  return (
    <TastingLogExitGuardContext.Provider value={value}>
      {props.children}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={continueRating}
      >
        <View style={styles.modalRoot}>
          <Pressable style={styles.backdrop} onPress={continueRating} />
          <View style={styles.modalContent} pointerEvents="box-none">
            <View style={styles.panel}>
              <View style={styles.messageBlock}>
                <AppText variant="h3" weight="700" style={styles.centerText}>
                  Rating not saved
                </AppText>
              </View>

              <View style={styles.abortButtonWrap}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Abort rating coffee"
                  onPress={abortRating}
                  style={({ pressed }) => [
                    styles.actionButton,
                    styles.abortButton,
                    pressed ? styles.actionButtonPressed : null,
                  ]}
                >
                  <AppText variant="body" weight="700" style={styles.buttonLabel}>
                    Abort rating coffee
                  </AppText>
                </Pressable>
              </View>

              <View style={styles.continueButtonWrap}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Continue rating coffee"
                  onPress={continueRating}
                  style={({ pressed }) => [
                    styles.actionButton,
                    styles.continueButton,
                    pressed ? styles.actionButtonPressed : null,
                  ]}
                >
                  <AppText variant="body" weight="700" style={styles.buttonLabel}>
                    Continue rating coffee
                  </AppText>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </TastingLogExitGuardContext.Provider>
  );
}

export function useTastingLogExitGuardRegistration(enabled: boolean) {
  const context = useContext(TastingLogExitGuardContext);

  useEffect(() => {
    context?.setGuardEnabled(enabled);
    return () => {
      context?.setGuardEnabled(false);
    };
  }, [context, enabled]);
}

export function useTastingLogExitGuardNavigation() {
  const context = useContext(TastingLogExitGuardContext);

  return useCallback((action: () => void) => {
    if (!context) {
      action();
      return;
    }
    context.requestGuardedNavigation(action);
  }, [context]);
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'stretch',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(12, 18, 21, 0.52)',
  },
  modalContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: visualSystemTokens.spacing.xl,
  },
  panel: {
    backgroundColor: '#f2f2f2',
    borderRadius: visualSystemTokens.radius.xl,
    paddingHorizontal: visualSystemTokens.spacing.lg,
    paddingVertical: visualSystemTokens.spacing.xl,
  },
  messageBlock: {
    marginBottom: visualSystemTokens.spacing.lg,
  },
  centerText: {
    textAlign: 'center',
  },
  abortButtonWrap: {
    marginBottom: visualSystemTokens.spacing.xl,
  },
  continueButtonWrap: {
    marginTop: visualSystemTokens.spacing.xl,
  },
  actionButton: {
    minHeight: 56,
    borderRadius: visualSystemTokens.radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: visualSystemTokens.spacing.lg,
  },
  abortButton: {
    backgroundColor: '#e4e4e4',
  },
  continueButton: {
    backgroundColor: '#df6de6',
  },
  actionButtonPressed: {
    opacity: 0.9,
  },
  buttonLabel: {
    color: visualSystemTokens.colors.textPrimary,
    textAlign: 'center',
  },
});
