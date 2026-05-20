let splashCompletedThisSession = false;

export function hasCompletedEntrySplashThisSession(): boolean {
  return splashCompletedThisSession;
}

export function markEntrySplashCompleteForSession(): void {
  splashCompletedThisSession = true;
}

export function resetEntrySplashSessionForTests(): void {
  splashCompletedThisSession = false;
}
