import { useLocalSearchParams } from 'expo-router';

import { InlineBackHeader } from '../../src/components/navigation/InlineBackHeader';
import { getLearnArticleBySlug } from '../../src/content/learn/articles';
import { AppScrollScreen, AppText } from '../../src/components/ui/primitives';
import { pageStyles } from '../../src/theme/pageStyles';

export default function LearnArticleScreen() {
  const params = useLocalSearchParams<{ slug?: string }>();
  const article = getLearnArticleBySlug(params.slug ?? '');

  if (!article) {
    return (
      <AppScrollScreen contentContainerStyle={pageStyles.contentCompact}>
        <InlineBackHeader title="Article not found" fallbackHref="/(tabs)/learn" />
        <AppText>Try opening the article from Learn tab again.</AppText>
      </AppScrollScreen>
    );
  }

  return (
    <AppScrollScreen contentContainerStyle={pageStyles.contentCompact}>
      <InlineBackHeader title={article.title} fallbackHref="/(tabs)/learn" />
      <AppText>{article.body}</AppText>
    </AppScrollScreen>
  );
}
