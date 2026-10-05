import { Redirect } from 'expo-router';

/**
 * Dummy tab route: the tab bar always intercepts this press (see
 * `(tabs)/_layout.tsx` `listeners.tabPress`) and opens the `/add` modal
 * instead. This only renders if something navigates here directly.
 */
export default function QuickAddRedirect() {
  return <Redirect href="/" />;
}
