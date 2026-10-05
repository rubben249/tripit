import { Screen } from '@/components/Screen';
import { ScreenTitle } from '@/components/ScreenTitle';
import { QuickAddMenu } from '@/features/quickAdd/QuickAddMenu';

export default function AddModal() {
  return (
    <Screen scroll>
      <ScreenTitle>Quick add</ScreenTitle>
      <QuickAddMenu />
    </Screen>
  );
}
