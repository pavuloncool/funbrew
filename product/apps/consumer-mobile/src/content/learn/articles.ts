export type LearnArticle = {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
};

export const learnArticles: LearnArticle[] = [
  {
    slug: 'how-to-taste-coffee-like-a-pro',
    title: 'How to Taste Coffee Like a Pro',
    excerpt: 'A practical sensory framework for first-time cuppers.',
    body: `# How to Taste Coffee Like a Pro

Coffee tasting is a structured process, not guessing.

## 1) Start with aroma
Smell dry grounds, then wet grounds. Note what changes.

## 2) Focus on acidity and sweetness
Acidity should feel lively, sweetness should feel natural.

## 3) Finish with texture
Body and aftertaste are where many coffees reveal quality.

> Tip: keep notes short, specific, and repeatable.`,
  },
  {
    slug: 'brew-ratio-basics',
    title: 'Brew Ratio Basics',
    excerpt: 'The quickest way to stabilize cup quality at home.',
    body: `# Brew Ratio Basics

If your cup changes every day, start with ratio first.

## Golden starting points
- Pour-over: 1:16
- Immersion: 1:15
- Espresso: 1:2

## Adjust one variable only
Change either grind size or ratio, never both at once.`,
  },
  {
    slug: 'washed-vs-natural-processing',
    title: 'Washed vs Natural Processing',
    excerpt: 'How processing shapes clarity, fruit intensity, and body.',
    body: `# Washed vs Natural Processing

Processing can shift flavor perception before roast profile even matters.

## Washed
Usually cleaner cup, clearer acidity, more transparent terroir.

## Natural
Usually fuller body, stronger fruit tones, sometimes ferment notes.

Use this as a guide, not a strict rule.`,
  },
];

export function getLearnArticleBySlug(slug: string) {
  return learnArticles.find((article) => article.slug === slug) ?? null;
}
