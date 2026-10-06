import { Screen } from '@/components/Screen';
import { ScreenTitle } from '@/components/ScreenTitle';
import { QuickAddMenu } from '@/features/quickAdd/QuickAddMenu';

export default function AddModal() {
  return (
    <Screen scroll>
      <ScreenTitle subtitle="Shortcuts for the trip you are on right now.">Quick add</ScreenTitle>
      <QuickAddMenu />
    </Screen>
  );
}
