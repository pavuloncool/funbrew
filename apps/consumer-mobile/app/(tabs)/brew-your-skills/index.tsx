import { LearnCoffeeTab } from '../../../src/components/hub/LearnCoffeeTab';
import { AppScrollScreen, AppText } from '../../../src/components/ui/primitives';
import { pageStyles } from '../../../src/theme/pageStyles';

export default function BrewYourSkillsScreen() {
  return (
    <AppScrollScreen contentContainerStyle={pageStyles.content}>
      <AppText variant="h2" weight="700">Learn Coffee</AppText>
      <AppText tone="secondary">
        Static learning content for MVP: a short article shelf with practical coffee basics.
      </AppText>
      <LearnCoffeeTab />
    </AppScrollScreen>
  );
}
