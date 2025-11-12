import { useState } from 'react';
import GameBoard from './components/GameBoard';
import StartScreen from './components/StartScreen';

function App() {
  const [userInfo, setUserInfo] = useState<{ name: string; birthdate: string } | null>(null);

  const handleStart = (name: string, birthdate: string) => {
    setUserInfo({ name, birthdate });
  };

  const handleRestart = () => {
    setUserInfo(null);
  };

  if (!userInfo) {
    return <StartScreen onStart={handleStart} />;
  }

  return (
    <div className="App">
      <GameBoard userInfo={userInfo} onRestart={handleRestart} />
    </div>
  );
}

export default App;
