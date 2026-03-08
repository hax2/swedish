import React from 'react';
import './ModuleSelector.css';

const ModuleSelector = ({ modules, onSelect }) => {
  return (
    <div className="module-selector">
      <div className="module-header">
        <h1 className="module-main-title">Select a Lesson</h1>
        <p className="module-subtitle">Choose a module to start practicing your listening skills.</p>
      </div>

      <div className="module-grid">
        {modules.map((mod, index) => (
          <div 
            key={mod.id} 
            className="module-card glass-panel"
            onClick={() => onSelect(mod)}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="module-card-content">
              <span className="module-level">{mod.level}</span>
              <h2 className="module-title">{mod.title}</h2>
              <p className="module-description">{mod.description}</p>
              
              <div className="module-meta">
                <span className="sentence-count">
                  {mod.sentences.length} Sentences
                </span>
                <button className="btn-primary btn-sm" onClick={(e) => {
                  e.stopPropagation();
                  onSelect(mod);
                }}>
                  Start Learning
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ModuleSelector;
