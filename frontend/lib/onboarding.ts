const WELCOME_KEY = "biblioagent:onboarding:welcome-seen";

function readFlag(key: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    // Storage disabled (private browsing, etc.) — treat as already seen so
    // onboarding doesn't loop or crash.
    return true;
  }
}

function writeFlag(key: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, "1");
  } catch {
    // ignore
  }
}

export function hasSeenWelcome(): boolean {
  return readFlag(WELCOME_KEY);
}

export function markWelcomeSeen(): void {
  writeFlag(WELCOME_KEY);
}
