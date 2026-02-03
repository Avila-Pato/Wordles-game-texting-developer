"use client";
import { useEffect, useState, useCallback } from "react";

const api = "https://api.frontendexpert.io/api/fe/wordle-words";
const WORD_LENGTH = 5;

// Palabras de respaldo en caso de que la API falle
const fallbackWords = ["house", "plant", "music", "water", "light", "dream", "stone", "cloud", "flame", "storm"];

export default function App() {
  const [solution, setSolution] = useState("");
  const [guesses, setGuesses] = useState<(string | null)[]>(Array(6).fill(null));
  const [currentGuess, setCurrentGuess] = useState("");
  const [isGameOver, setIsGameOver] = useState(false);
  const [hasWon, setHasWon] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNewWord = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(api);
      if (!res.ok) throw new Error(`Error de estado http ${res.status}`);
      const words = await res.json();
      const randomWord = words[Math.floor(Math.random() * words.length)];
      setSolution(randomWord.toLowerCase());
      console.log("Palabra cargada:", randomWord.toLowerCase());
    } catch (error) {
      console.log("Error al obtener palabra, usando fallback:", error);
      // Usar palabra de respaldo si la API falla
      const randomFallback = fallbackWords[Math.floor(Math.random() * fallbackWords.length)];
      setSolution(randomFallback);
      console.log("Palabra fallback:", randomFallback);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetGame = useCallback(() => {
    setGuesses(Array(6).fill(null));
    setCurrentGuess("");
    setIsGameOver(false);
    setHasWon(false);
    fetchNewWord();
  }, [fetchNewWord]);

  useEffect(() => {
    const handleType = (event: KeyboardEvent) => {
      if (isGameOver || isLoading || !solution) {
        return;
      }
      if (event.key === "Enter") {
        if (currentGuess.length !== 5) {
          return;
        }
        const newGuesses = [...guesses];
        const currentGuessIndex = guesses.findIndex((val) => val === null);
        newGuesses[currentGuessIndex] = currentGuess;
        setGuesses(newGuesses);
        setCurrentGuess("");

        const isCorrect = solution === currentGuess;
        if (isCorrect) {
          setIsGameOver(true);
          setHasWon(true);
        }

        // Detectar si el jugador perdió (último intento incorrecto)
        const isLastGuess = currentGuessIndex === 5;
        if (isLastGuess && !isCorrect) {
          setIsGameOver(true);
          setHasWon(false);
        }
      }

      if (event.key === "Backspace") {
        setCurrentGuess(currentGuess.slice(0, -1));
        return;
      }
      if (currentGuess.length >= 5) {
        return;
      }
      const isLetter = event.key.match(/^[a-z]{1}$/) != null;
      if (isLetter) {
        setCurrentGuess(currentGuess + event.key);
      }
    };

    window.addEventListener("keydown", handleType);

    return () => window.removeEventListener("keydown", handleType);
  }, [currentGuess, isGameOver, isLoading, solution, guesses]);

  useEffect(() => {
    fetchNewWord();
  }, [fetchNewWord]);

  return (
    <div className="game-container">
      <h1 className="title">WORDLE</h1>

      {isLoading && <p className="loading">Cargando palabra...</p>}

      <div className="game-content">
        <div className="board">
          {guesses.map((guess, i) => {
            const isCurrentGuess = i === guesses.findIndex((val) => val === null);
            return (
              <Line
                key={i}
                guess={isCurrentGuess ? currentGuess : guess ?? ""}
                isFinal={!isCurrentGuess && guess != null}
                solution={solution}
              />
            );
          })}
        </div>

        <div className="instructions">
          <h2>Cómo jugar</h2>
          <p>Adivina la palabra oculta en 6 intentos.</p>
          <ul>
            <li>Escribe una palabra de <strong>5 letras</strong></li>
            <li>Presiona <strong>Enter</strong> para confirmar</li>
            <li>Usa <strong>Backspace</strong> para borrar</li>
          </ul>

          <h3>Colores</h3>
          <div className="color-guide">
            <div className="color-item">
              <span className="tile correct">A</span>
              <span>Letra correcta y en posición correcta</span>
            </div>
            <div className="color-item">
              <span className="tile close">B</span>
              <span>Letra correcta pero en posición incorrecta</span>
            </div>
            <div className="color-item">
              <span className="tile incorrect">C</span>
              <span>Letra no está en la palabra</span>
            </div>
          </div>
        </div>
      </div>

      {isGameOver && (
        <div className="game-over">
          {hasWon ? (
            <p className="win-message">¡Felicidades! ¡Adivinaste la palabra!</p>
          ) : (
            <p className="lose-message">¡Game Over! La palabra era: <strong>{solution.toUpperCase()}</strong></p>
          )}
          <button className="reset-button" onClick={resetGame}>
            Jugar de nuevo
          </button>
        </div>
      )}
    </div>
  );
}

function Line({
  guess,
  isFinal,
  solution,
}: {
  guess: string;
  isFinal: boolean;
  solution: string;
}) {
  const tiles = [];

  for (let i = 0; i < WORD_LENGTH; i++) {
    const char = guess[i];
    let className = "tile";

    if (isFinal) {
      if (char === solution[i]) {
        className += " correct";
      } else if (solution.includes(char)) {
        className += " close";
      } else {
        className += " incorrect";
      }
    }

    tiles.push(
      <div key={i} className={className}>
        {char}
      </div>
    );
  }

  return <div className="line">{tiles}</div>;
}
