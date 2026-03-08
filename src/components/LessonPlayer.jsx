import React, { useState, useEffect, useCallback, useMemo } from 'react';
import './LessonPlayer.css';

/* ── helpers ─────────────────────────────────────────────── */
const cleanWord = (w) => w.replace(/[.,¿?¡!]/g, '');

/** Collect every unique word→meaning pair from all sentences in a module */
const buildVocabTable = (sentences) => {
  const map = new Map();
  sentences.forEach((s) => {
    const meanings = s.wordMeanings || {};
    Object.entries(meanings).forEach(([word, meaning]) => {
      const key = word.toLowerCase();
      if (!map.has(key)) map.set(key, { word, meaning });
    });
  });
  return Array.from(map.values());
};

/** Deterministic pseudo-random from a seed string */
const seededRandom = (seed) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  return Math.abs(h);
};

/**
 * Build a merged list of regular sentence items + translation-challenge items.
 * A challenge is inserted after every CHALLENGE_INTERVAL sentences.
 * Each challenge picks one sentence from the preceding batch.
 */
const CHALLENGE_INTERVAL = 5;

const buildMergedItems = (sentences, moduleId) => {
  const items = [];
  let sentenceCount = 0;

  for (let i = 0; i < sentences.length; i++) {
    items.push({ type: 'sentence', data: sentences[i], originalIndex: i });
    sentenceCount++;

    if (sentenceCount === CHALLENGE_INTERVAL && i < sentences.length - 1) {
      // Pick one sentence from this batch to quiz on
      const batchStart = i - (CHALLENGE_INTERVAL - 1);
      const seed = `${moduleId}-challenge-${items.length}`;
      const pick = seededRandom(seed) % CHALLENGE_INTERVAL;
      const chosenSentence = sentences[batchStart + pick];

      items.push({
        type: 'challenge',
        data: chosenSentence,
        batchStart,
        batchEnd: i,
      });
      sentenceCount = 0;
    }
  }
  return items;
};

/** Speak a Spanish word/phrase */
const speakSpanish = (text) => {
  if (!text) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'es-ES';
  u.rate = 0.85;
  window.speechSynthesis.speak(u);
};

/* ── component ───────────────────────────────────────────── */
const LessonPlayer = ({ module, modules, moduleIndex, onBack, onNextModule }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [spanishRevealed, setSpanishRevealed] = useState(false);
  const [englishRevealed, setEnglishRevealed] = useState(false);
  const [activeWordIndex, setActiveWordIndex] = useState(null);
  const [challengeAnswerRevealed, setChallengeAnswerRevealed] = useState(false);
  const [extraItems, setExtraItems] = useState([]);

  /* Build merged items list (sentences + challenges + extras) */
  const mergedItems = useMemo(() => {
    const base = buildMergedItems(module.sentences, module.id);
    return [...base, ...extraItems];
  }, [module, extraItems]);

  const currentItem = mergedItems[currentIndex];
  const isChallenge = currentItem?.type === 'challenge';
  const sentence = isChallenge ? null : currentItem?.data;
  const isFinished = currentIndex >= mergedItems.length;
  const hasNextModule = moduleIndex < modules.length - 1;
  const vocabTable = isFinished ? buildVocabTable(module.sentences) : [];

  /* Count only sentence items for progress display */
  const totalSentences = module.sentences.length;
  const sentencesSoFar = isFinished
    ? totalSentences
    : mergedItems.slice(0, currentIndex + 1).filter((it) => it.type === 'sentence').length;

  /* reset + auto-play on item change */
  useEffect(() => {
    setSpanishRevealed(false);
    setEnglishRevealed(false);
    setActiveWordIndex(null);
    setChallengeAnswerRevealed(false);
    if (!isChallenge && sentence?.spanish) speakSpanish(sentence.spanish);
  }, [currentIndex, module]);

  /* reset to item 0 and clear extras when module changes */
  useEffect(() => {
    setCurrentIndex(0);
    setExtraItems([]);
  }, [module]);

  const playAudio = () => sentence && speakSpanish(sentence.spanish);

  const handleNext = () => setCurrentIndex((p) => p + 1);
  const handlePrev = () => setCurrentIndex((p) => Math.max(0, p - 1));

  const handleMarkForLater = () => {
    if (!sentence) return;
    setExtraItems((prev) => [
      ...prev,
      { type: 'sentence', data: sentence, originalIndex: currentItem.originalIndex, isRepeat: true }
    ]);
  };

  const getMeaning = (word) => {
    const cw = cleanWord(word);
    const meanings = sentence?.wordMeanings || {};
    return meanings[cw] ?? meanings[cw.toLowerCase()] ?? meanings[cw.replace(/s$/, '')] ?? null;
  };

  /* ── MODULE COMPLETE SCREEN ─────────────────────────────── */
  if (isFinished) {
    return (
      <div className="lesson-finished animate-fade-in glass-panel">
        <div className="finished-icon">🎉</div>
        <h2 className="finished-title">Module Completed!</h2>
        <p className="finished-subtitle">
          You've successfully finished all sentences in <strong>{module.title}</strong>.
        </p>

        {/* Vocabulary recap table */}
        <div className="vocab-section">
          <h3 className="vocab-heading">Words You've Learned</h3>
          <div className="vocab-table-wrapper">
            <table className="vocab-table">
              <thead>
                <tr>
                  <th>Spanish</th>
                  <th>Meaning</th>
                  <th>Audio</th>
                </tr>
              </thead>
              <tbody>
                {vocabTable.map(({ word, meaning }) => (
                  <tr key={word}>
                    <td className="vocab-word">{word}</td>
                    <td className="vocab-meaning">{meaning}</td>
                    <td className="vocab-audio">
                      <button
                        className="btn-word-audio"
                        onClick={() => speakSpanish(word)}
                        title={`Play "${word}"`}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="finished-actions">
          <button className="btn-secondary" onClick={onBack}>
            ← All Modules
          </button>
          {hasNextModule && (
            <button className="btn-primary" onClick={onNextModule}>
              Next Module →
            </button>
          )}
        </div>
      </div>
    );
  }

  /* ── TRANSLATION CHALLENGE SCREEN ─────────────────────── */
  if (isChallenge) {
    const challengeSentence = currentItem.data;
    const progressPercentage = (sentencesSoFar / totalSentences) * 100;

    return (
      <div className="lesson-player animate-fade-in">
        {/* Header / Progress */}
        <div className="lesson-header">
          <button className="btn-secondary btn-sm" onClick={onBack}>← Back</button>
          <div className="progress-wrapper">
            <div className="progress-container">
              <div className="progress-bar-fill" style={{ width: `${progressPercentage}%` }} />
            </div>
          </div>
          <span className="progress-text">
            {sentencesSoFar} / {totalSentences}
          </span>
        </div>

        <div className="lesson-content glass-panel challenge-panel">
          {/* Challenge badge */}
          <div className="challenge-badge">
            <span className="challenge-icon">🗣️</span>
            <span>Translation Challenge</span>
          </div>

          {/* Prompt */}
          <div className="challenge-prompt">
            <p className="challenge-instruction">Translate this sentence into Spanish:</p>
            <p className="challenge-english">{challengeSentence.english}</p>
          </div>

          {/* Answer area */}
          <div className="challenge-answer-area">
            {!challengeAnswerRevealed ? (
              <button
                className="btn-primary btn-reveal-answer pulse-primary"
                onClick={() => {
                  setChallengeAnswerRevealed(true);
                  speakSpanish(challengeSentence.spanish);
                }}
              >
                Reveal Answer
              </button>
            ) : (
              <div className="challenge-answer animate-fade-in">
                <p className="challenge-spanish">{challengeSentence.spanish}</p>
                <button
                  className="btn-play-answer"
                  onClick={() => speakSpanish(challengeSentence.spanish)}
                  title="Listen to the answer"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  <span>Listen</span>
                </button>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="actions-area">
            <div className="actions-row">
              <button
                className="btn-secondary"
                onClick={handlePrev}
                disabled={currentIndex === 0}
              >
                ← Previous
              </button>
              <button className="btn-primary" onClick={handleNext}>
                Continue →
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── NORMAL LESSON SCREEN ───────────────────────────────── */
  const words = sentence.spanish.split(' ');
  const progressPercentage = (sentencesSoFar / totalSentences) * 100;

  return (
    <div className="lesson-player animate-fade-in">

      {/* Header / Progress */}
      <div className="lesson-header">
        <button className="btn-secondary btn-sm" onClick={onBack}>← Back</button>
        <div className="progress-wrapper">
          <div className="progress-container">
            <div className="progress-bar-fill" style={{ width: `${progressPercentage}%` }} />
          </div>
        </div>
        <span className="progress-text">
          {sentencesSoFar} / {totalSentences}
        </span>
      </div>

      <div className="lesson-content glass-panel">
        {currentItem.isRepeat && (
          <div className="review-badge animate-fade-in">
            <span>🔄</span>
            <span>Reviewing</span>
          </div>
        )}

        {/* Audio section */}
        <div className="audio-section">
          <button
            className="btn-play pulse-primary"
            onClick={playAudio}
            title="Listen to Spanish"
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        </div>

        {/* Spanish Text Area */}
        <div className="spanish-area">
          {!spanishRevealed ? (
            <button className="btn-reveal" onClick={() => setSpanishRevealed(true)}>
              Reveal Spanish text
            </button>
          ) : (
            <div className="spanish-sentence animate-fade-in">
              {words.map((word, idx) => {
                const meaning = getMeaning(word);
                const isActive = activeWordIndex === idx;
                return (
                  <div key={idx} className="word-container">
                    <span
                      className={`spanish-word ${meaning ? 'has-meaning' : ''} ${isActive ? 'active' : ''}`}
                      onClick={() => meaning && setActiveWordIndex(isActive ? null : idx)}
                    >
                      {word}
                    </span>
                    {isActive && meaning && (
                      <div className="word-tooltip animate-fade-in">
                        <button
                          className="tooltip-audio-btn"
                          onClick={(e) => { e.stopPropagation(); speakSpanish(cleanWord(word)); }}
                          title="Play word"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </button>
                        {meaning}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions Area */}
        <div className="actions-area">
          <div className="actions-row">
            <button
              className="btn-secondary"
              onClick={handlePrev}
              disabled={currentIndex === 0}
            >
              ← Previous
            </button>
            <button
              className="btn-mark-later"
              onClick={handleMarkForLater}
              title="See this sentence again at the end"
            >
              Mark for later
            </button>
            <button className="btn-primary" onClick={handleNext}>
              Next →
            </button>
          </div>

          <div className="translation-area">
            {!englishRevealed ? (
              <button className="btn-text-reveal" onClick={() => setEnglishRevealed(true)}>
                Reveal Full Translation
              </button>
            ) : (
              <div className="english-translation animate-fade-in">
                {sentence.english}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default LessonPlayer;
