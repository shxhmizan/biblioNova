import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** True only after client hydration — avoids the setState-in-effect anti-pattern
 * for the common "don't render theme/client-only UI until mounted" guard. */
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
