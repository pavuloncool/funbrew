import { AppCard, AppScrollScreen, AppText } from '../../../src/components/ui/primitives';
import { pageStyles } from '../../../src/theme/pageStyles';

export default function BrewYourSkillsScreen() {
  return (
    <AppScrollScreen contentContainerStyle={pageStyles.content}>
      <AppText variant="h2" weight="700">Brew Your Skills</AppText>
      <AppCard>
        <AppText tone="secondary">
          Coming soon: your education gateway for brewing, coffee origins, coffee growing, and farms.
        </AppText>
      </AppCard>
    </AppScrollScreen>
  );
}
