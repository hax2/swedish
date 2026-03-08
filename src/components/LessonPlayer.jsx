import React, { useState, useEffect } from 'react';
import './LessonPlayer.css';

const LessonPlayer = ({ module, onBack }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [spanishRevealed, setSpanishRevealed] = useState(false);
  const [englishRevealed, setEnglishRevealed] = useState(false);
  const [activeWordIndex, setActiveWordIndex] = useState(null);

  const sentence = module.sentences[currentIndex];
  const isFinished = currentIndex >= module.sentences.length;

  useEffect(() => {
    // Reset states when changing sentence
    setSpanishRevealed(false);
    setEnglishRevealed(false);
    setActiveWordIndex(null);
  }, [currentIndex]);

  const playAudio = () => {
    if (!sentence) return;
    window.speechSynthesis.cancel(); // clear queue
    const utterance = new SpeechSynthesisUtterance(sentence.spanish);
    utterance.lang = 'es-ES';
    utterance.rate = 0.85; // Slightly slower for better comprehension
    window.speechSynthesis.speak(utterance);
  };

  const handleNext = () => {
    setCurrentIndex(prev => prev + 1);
  };

  const getMeaning = (word) => {
    // Strip punctuation to match the dictionary keys
    const cleanWord = word.replace(/[.,¿?¡!]/g, '');
    const meanings = sentence.wordMeanings || {};
    return meanings[cleanWord] || meanings[cleanWord.toLowerCase()] || meanings[cleanWord.replace(/s$/, '')] || null;
  };

  if (isFinished) {
    return (
      <div className="lesson-finished animate-fade-in glass-panel">
        <div className="finished-icon">🎉</div>
        <h2 className="finished-title">Module Completed!</h2>
        <p className="finished-subtitle">You've successfully finished all sentences in this module.</p>
        <button className="btn-primary" onClick={onBack}>Back to Modules</button>
      </div>
    );
  }

  // Split sentence into words but keep punctuation attached for rendering
  const words = sentence.spanish.split(' ');

  const progressPercentage = ((currentIndex) / module.sentences.length) * 100;

  return (
    <div className="lesson-player animate-fade-in">
      
      {/* Header / Progress */}
      <div className="lesson-header">
        <button className="btn-secondary btn-sm" onClick={onBack}>← Back</button>
        <div className="progress-wrapper">
          <div className="progress-container">
            <div className="progress-bar-fill" style={{ width: `${progressPercentage}%` }}></div>
          </div>
        </div>
        <span className="progress-text">
          {currentIndex + 1} / {module.sentences.length}
        </span>
      </div>

      <div className="lesson-content glass-panel">
        
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
            <button className="btn-secondary" onClick={handleNext}>
              I understood it
            </button>
            <button className="btn-primary" onClick={handleNext}>
              Next Sentence →
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
