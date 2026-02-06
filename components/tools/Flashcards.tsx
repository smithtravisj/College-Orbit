'use client';

import FlashcardsDashboard from './flashcards/FlashcardsDashboard';

interface Props {
  theme?: string;
}

export default function Flashcards({ theme = 'dark' }: Props) {
  return <FlashcardsDashboard theme={theme} />;
}
