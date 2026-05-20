import { Link } from 'expo-router';
import { View } from 'react-native';

import { learnArticles } from '../../content/learn/articles';
import { EmptyState } from '../EmptyState';
import { AppText } from '../ui/primitives';

import { discoverHubStyles } from './discoverHub.styles';

export function LearnCoffeeTab() {
  if (learnArticles.length === 0) {
    return (
      <EmptyState
        title="No articles yet"
        description="Learning content will show up here when it is published."
      />
    );
  }

  return (
    <View style={discoverHubStyles.list}>
      {learnArticles.map((article) => (
        <View key={article.slug} style={discoverHubStyles.card}>
          <AppText variant="body" weight="600">{article.title}</AppText>
          <AppText tone="secondary">{article.excerpt}</AppText>
          <Link href={{ pathname: '/learn/[slug]', params: { slug: article.slug } }}>Read article</Link>
        </View>
      ))}
    </View>
  );
}
