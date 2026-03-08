import { useState } from 'react';
import ModuleSelector from './components/ModuleSelector';
import LessonPlayer from './components/LessonPlayer';
import modulesData from './data/modules.json';
import './App.css';

function App() {
  const [activeModule, setActiveModule] = useState(null);

  const handleSelectModule = (module) => {
    setActiveModule(module);
  };

  const handleBackToModules = () => {
    setActiveModule(null);
  };

  return (
    <div className="app-container animate-fade-in">
      <header className="app-header">
        <div className="app-logo" onClick={handleBackToModules} style={{ cursor: 'pointer' }}>
          GemLang
        </div>
      </header>
      
      <main className="main-content">
        {!activeModule ? (
          <ModuleSelector modules={modulesData} onSelect={handleSelectModule} />
        ) : (
          <LessonPlayer module={activeModule} onBack={handleBackToModules} />
        )}
      </main>
    </div>
  );
}

export default App;
