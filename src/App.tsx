import { useState, useEffect } from 'react';
import './App.css';

const DURATION_SECONDS = 300; // 5 minutes
const MAX_SIPS = 10;

type CoffeeType = 'Americano' | 'Latte' | 'Espresso';

function App() {
  const [selectedCoffee, setSelectedCoffee] = useState<CoffeeType | null>(null);
  const [timeLeft, setTimeLeft] = useState(DURATION_SECONDS);
  const [isRunning, setIsRunning] = useState(false);
  const [sipsLeft, setSipsLeft] = useState(MAX_SIPS);
  const [todayCups, setTodayCups] = useState(0);
  const [message, setMessage] = useState('');

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('coffee-cups-today');
    if (saved) {
      setTodayCups(parseInt(saved, 10));
    }
  }, []);

  // Timer logic
  useEffect(() => {
    let interval: number;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      setMessage("Time's up! Hope you enjoyed your break.");
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const handleStart = () => {
    if (!selectedCoffee) {
      setMessage('Please select a coffee first!');
      return;
    }
    if (sipsLeft === 0) {
      setMessage('Cup is empty. Reset to start again.');
      return;
    }
    setIsRunning(true);
    setMessage('Enjoy your break...');
  };

  const handleSip = () => {
    if (sipsLeft > 0 && isRunning) {
      const newSips = sipsLeft - 1;
      setSipsLeft(newSips);

      if (newSips === 0) {
        setIsRunning(false);
        setMessage('All finished! Delicious.');
        const newTotal = todayCups + 1;
        setTodayCups(newTotal);
        localStorage.setItem('coffee-cups-today', newTotal.toString());
      }
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(DURATION_SECONDS);
    setSipsLeft(MAX_SIPS);
    setMessage('');
    // Keep the coffee selected
  };

  const handleSelectCoffee = (coffee: CoffeeType) => {
    if (isRunning) return; // Prevent changing while running
    setSelectedCoffee(coffee);
    setMessage('');
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Calculate liquid height percentage
  const liquidHeight = (sipsLeft / MAX_SIPS) * 100;

  // Visual style for liquid color based on coffee type
  const getLiquidColor = () => {
    switch (selectedCoffee) {
      case 'Americano': return '#3b2f2f'; // dark black/brown
      case 'Latte': return '#c4a484'; // milky brown
      case 'Espresso': return '#2c1b18'; // very dark
      default: return '#eee';
    }
  };

  return (
    <div className="container">
      <header>
        <h1>5-Minute Coffee Break</h1>
        <div className="timer">{formatTime(timeLeft)}</div>
      </header>

      <div className="coffee-selection">
        <button 
          className={selectedCoffee === 'Americano' ? 'active' : ''} 
          onClick={() => handleSelectCoffee('Americano')}
        >
          Americano
        </button>
        <button 
          className={selectedCoffee === 'Latte' ? 'active' : ''} 
          onClick={() => handleSelectCoffee('Latte')}
        >
          Latte
        </button>
        <button 
          className={selectedCoffee === 'Espresso' ? 'active' : ''} 
          onClick={() => handleSelectCoffee('Espresso')}
        >
          Espresso
        </button>
      </div>

      <div className="main-area">
        {/* Visual Cup */}
        <div className="cup-container">
          <div className="cup-handle"></div>
          <div className="cup-body">
            <div 
              className="liquid" 
              style={{ 
                height: `${liquidHeight}%`, 
                backgroundColor: getLiquidColor(),
                transition: 'height 0.5s ease-out, background-color 0.3s'
              }}
            ></div>
          </div>
        </div>

        <div className="message-area">
          {message || (selectedCoffee ? `Selected: ${selectedCoffee}` : 'Choose a coffee to start')}
        </div>

        <div className="controls">
          {!isRunning && sipsLeft === MAX_SIPS ? (
            <button className="btn-primary" onClick={handleStart}>
              Start 5:00
            </button>
          ) : (
            <div className="active-controls">
              <button 
                className="btn-sip" 
                onClick={handleSip} 
                disabled={!isRunning || sipsLeft === 0}
              >
                Sip
              </button>
              <button className="btn-secondary" onClick={handleReset}>
                Reset
              </button>
            </div>
          )}
        </div>
      </div>

      <footer>
        <p>Today's cups: <strong>{todayCups}</strong></p>
      </footer>
    </div>
  );
}

export default App;