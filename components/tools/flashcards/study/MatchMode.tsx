'use client';

import { useState, useEffect, useCallback } from 'react';
import { Clock, Check, RotateCcw } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Flashcard } from '../types';
import { shuffleArray } from '../utils';
import StudyProgress from './StudyProgress';

interface MatchModeProps {
  cards: Flashcard[];
  onRate: (cardId: string, quality: number) => void;
  onExit: () => void;
  onComplete: () => void;
  theme?: string;
  isMobile?: boolean;
  celebrations?: boolean;
}

interface MatchTile {
  id: string;
  cardId: string;
  content: string;
  type: 'front' | 'back';
  isMatched: boolean;
  isSelected: boolean;
}

export default function MatchMode({
  cards,
  onRate,
  onExit,
  onComplete,
  isMobile = false,
}: MatchModeProps) {
  const [tiles, setTiles] = useState<MatchTile[]>([]);
  const [selectedTile, setSelectedTile] = useState<MatchTile | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set());
  const [mistakes, setMistakes] = useState(0);
  const [startTime] = useState(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [showIncorrect, setShowIncorrect] = useState<string[]>([]);

  // Take first 6 cards max for a manageable grid
  const gameCards = cards.slice(0, 6);

  // Initialize tiles
  useEffect(() => {
    const frontTiles: MatchTile[] = gameCards.map(card => ({
      id: `front-${card.id}`,
      cardId: card.id,
      content: card.front,
      type: 'front',
      isMatched: false,
      isSelected: false,
    }));

    const backTiles: MatchTile[] = gameCards.map(card => ({
      id: `back-${card.id}`,
      cardId: card.id,
      content: card.back,
      type: 'back',
      isMatched: false,
      isSelected: false,
    }));

    setTiles(shuffleArray([...frontTiles, ...backTiles]));
  }, []);

  // Timer
  useEffect(() => {
    if (gameComplete) return;

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, gameComplete]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTileClick = useCallback((tile: MatchTile) => {
    if (tile.isMatched || showIncorrect.length > 0) return;

    if (!selectedTile) {
      // First selection
      setSelectedTile(tile);
      setTiles(prev => prev.map(t =>
        t.id === tile.id ? { ...t, isSelected: true } : t
      ));
    } else if (selectedTile.id === tile.id) {
      // Deselect same tile
      setSelectedTile(null);
      setTiles(prev => prev.map(t =>
        t.id === tile.id ? { ...t, isSelected: false } : t
      ));
    } else if (selectedTile.type === tile.type) {
      // Same type (both fronts or both backs) - can't match
      // Switch selection to new tile
      setTiles(prev => prev.map(t => ({
        ...t,
        isSelected: t.id === tile.id,
      })));
      setSelectedTile(tile);
    } else {
      // Different types - check for match
      if (selectedTile.cardId === tile.cardId) {
        // Match found!
        const cardId = tile.cardId;
        setMatchedPairs(prev => new Set(prev).add(cardId));
        setTiles(prev => prev.map(t =>
          t.cardId === cardId ? { ...t, isMatched: true, isSelected: false } : t
        ));
        setSelectedTile(null);

        // Rate the card as correctly matched
        onRate(cardId, 4);

        // Check if game is complete
        if (matchedPairs.size + 1 === gameCards.length) {
          setGameComplete(true);
        }
      } else {
        // No match
        setMistakes(prev => prev + 1);
        setShowIncorrect([selectedTile.id, tile.id]);
        setTiles(prev => prev.map(t => ({
          ...t,
          isSelected: t.id === selectedTile.id || t.id === tile.id,
        })));

        // Clear incorrect state after brief delay
        setTimeout(() => {
          setShowIncorrect([]);
          setTiles(prev => prev.map(t => ({ ...t, isSelected: false })));
          setSelectedTile(null);
        }, 800);
      }
    }
  }, [selectedTile, showIncorrect, gameCards.length, matchedPairs.size, onRate]);

  const restartGame = () => {
    const frontTiles: MatchTile[] = gameCards.map(card => ({
      id: `front-${card.id}`,
      cardId: card.id,
      content: card.front,
      type: 'front',
      isMatched: false,
      isSelected: false,
    }));

    const backTiles: MatchTile[] = gameCards.map(card => ({
      id: `back-${card.id}`,
      cardId: card.id,
      content: card.back,
      type: 'back',
      isMatched: false,
      isSelected: false,
    }));

    setTiles(shuffleArray([...frontTiles, ...backTiles]));
    setSelectedTile(null);
    setMatchedPairs(new Set());
    setMistakes(0);
    setGameComplete(false);
    setShowIncorrect([]);
  };

  if (gameComplete) {
    const accuracy = Math.round((gameCards.length / (gameCards.length + mistakes)) * 100);

    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '24px' : '48px',
        textAlign: 'center',
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          backgroundColor: 'var(--success)20',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px',
        }}>
          <Check size={40} style={{ color: 'var(--success)' }} />
        </div>

        <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text)', marginBottom: '8px' }}>
          All Pairs Matched!
        </div>

        <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--link)' }}>
              {formatTime(elapsedTime)}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Time</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text)' }}>
              {accuracy}%
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Accuracy</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '20px', fontWeight: 600, color: mistakes === 0 ? 'var(--success)' : 'var(--warning)' }}>
              {mistakes}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Mistakes</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', maxWidth: '250px' }}>
          <Button onClick={restartGame} size="lg">
            <RotateCcw size={18} />
            Play Again
          </Button>
          <Button variant="secondary" onClick={onComplete} size="lg">
            Done
          </Button>
        </div>
      </div>
    );
  }

  const columns = isMobile ? 3 : 4;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <StudyProgress
        current={matchedPairs.size}
        total={gameCards.length}
        xpEarned={matchedPairs.size}
        onExit={onExit}
      />

      {/* Game stats */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '24px',
        padding: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
          <Clock size={16} />
          <span style={{ fontSize: '14px', fontWeight: 500 }}>{formatTime(elapsedTime)}</span>
        </div>
        <div style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
          Mistakes: <span style={{ fontWeight: 500, color: mistakes === 0 ? 'var(--success)' : 'var(--warning)' }}>{mistakes}</span>
        </div>
      </div>

      {/* Game grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: isMobile ? '8px' : '12px',
      }}>
        {tiles.map((tile) => {
          const isIncorrect = showIncorrect.includes(tile.id);

          return (
            <button
              key={tile.id}
              onClick={() => handleTileClick(tile)}
              disabled={tile.isMatched}
              style={{
                padding: isMobile ? '12px 8px' : '16px 12px',
                minHeight: isMobile ? '60px' : '80px',
                borderRadius: '10px',
                border: '2px solid',
                borderColor: tile.isMatched
                  ? 'var(--success)'
                  : isIncorrect
                    ? 'var(--danger)'
                    : tile.isSelected
                      ? 'var(--link)'
                      : 'var(--border)',
                backgroundColor: tile.isMatched
                  ? 'var(--success)15'
                  : isIncorrect
                    ? 'var(--danger)15'
                    : tile.isSelected
                      ? 'var(--link)15'
                      : 'var(--panel-2)',
                cursor: tile.isMatched ? 'default' : 'pointer',
                opacity: tile.isMatched ? 0.5 : 1,
                transition: 'all 0.15s ease',
                fontSize: isMobile ? '12px' : '14px',
                fontWeight: 500,
                color: 'var(--text)',
                textAlign: 'center',
                wordBreak: 'break-word',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {tile.content}
            </button>
          );
        })}
      </div>

      <div style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
        Match terms with their definitions
      </div>
    </div>
  );
}
