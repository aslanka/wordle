// src/App.jsx
import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { getDailyWordEntry } from "./words";

const ROWS = 6;

const KEYBOARD_ROWS = [
  "QWERTYUIOP",
  "ASDFGHJKL",
  "ZXCVBNM",
];

const LETTER_STATE_PRIORITY = {
  absent: 1,
  present: 2,
  correct: 3,
};

function evaluateGuess(guess, solution) {
  const len = solution.length;
  const result = Array(len).fill("absent");
  const solutionChars = solution.split("");

  // First pass: greens
  for (let i = 0; i < len; i++) {
    if (guess[i] === solution[i]) {
      result[i] = "correct";
      solutionChars[i] = null;
    }
  }

  // Second pass: yellows
  for (let i = 0; i < len; i++) {
    if (result[i] === "correct") continue;
    const idx = solutionChars.indexOf(guess[i]);
    if (idx > -1) {
      result[i] = "present";
      solutionChars[idx] = null;
    }
  }

  return result;
}

function App() {
  const [solutionEntry, setSolutionEntry] = useState(() =>
    getDailyWordEntry()
  );
  const solution = solutionEntry.word.toUpperCase();
  const WORD_LENGTH = solution.length;

  const [history, setHistory] = useState([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [status, setStatus] = useState("playing");
  const [message, setMessage] = useState("");
  const [keyboardState, setKeyboardState] = useState({});
  const [hintUsed, setHintUsed] = useState(false);

  // 🎵 Background Music
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const audioRef = useRef(null);

  const toggleMusic = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMusicPlaying) {
      audio.pause();
      setIsMusicPlaying(false);
    } else {
      audio
        .play()
        .then(() => setIsMusicPlaying(true))
        .catch((err) => console.error("Autoplay blocked:", err));
    }
  };

  const resetGame = () => {
    setSolutionEntry(getDailyWordEntry());
    setHistory([]);
    setCurrentGuess("");
    setStatus("playing");
    setMessage("");
    setKeyboardState({});
    setHintUsed(false);
  };

  const updateKeyboardState = (guess, result) => {
    setKeyboardState((prev) => {
      const upd = { ...prev };
      for (let i = 0; i < guess.length; i++) {
        const letter = guess[i];
        const nextState = result[i];
        const prevState = upd[letter];

        if (!prevState) {
          upd[letter] = nextState;
        } else if (
          LETTER_STATE_PRIORITY[nextState] >
          LETTER_STATE_PRIORITY[prevState]
        ) {
          upd[letter] = nextState;
        }
      }
      return upd;
    });
  };

  const submitGuess = () => {
    if (status !== "playing") return;

    if (currentGuess.length !== WORD_LENGTH) {
      setMessage(`Word must be ${WORD_LENGTH} letters`);
      return;
    }

    const guess = currentGuess.toUpperCase();

    // No dictionary restriction — any guess allowed
    const result = evaluateGuess(guess, solution);
    const newHistory = [...history, { word: guess, result }];
    setHistory(newHistory);
    updateKeyboardState(guess, result);
    setCurrentGuess("");
    setMessage("");

    if (guess === solution) {
      setStatus("won");
      setMessage("You got it!");
    } else if (newHistory.length === ROWS) {
      setStatus("lost");
      setMessage(`The word was ${solution}`);
    }
  };

  const handleKey = useCallback(
    (key) => {
      if (status !== "playing") return;

      if (key === "ENTER") return submitGuess();
      if (key === "BACKSPACE")
        return setCurrentGuess((g) => g.slice(0, -1));

      if (
        /^[A-Z]$/.test(key) &&
        currentGuess.length < WORD_LENGTH
      ) {
        setCurrentGuess((g) => g + key);
      }
    },
    [currentGuess, status, WORD_LENGTH]
  );

  useEffect(() => {
    const onKeyDown = (e) => {
      const key = e.key.toUpperCase();
      if (key === "ENTER") return handleKey("ENTER");
      if (key === "BACKSPACE" || key === "DELETE")
        return handleKey("BACKSPACE");
      if (/^[A-Z]$/.test(key)) return handleKey(key);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleKey]);

  const renderBoard = () => (
    <div className="board">
      {Array.from({ length: ROWS }).map((_, rowIdx) => {
        const rowData = history[rowIdx];
        const isCurrent =
          rowIdx === history.length && status === "playing";

        let tiles;

        if (rowData) {
          tiles = rowData.word.split("").map((letter, i) => (
            <div key={i} className={`tile ${rowData.result[i]}`}>
              {letter}
            </div>
          ));
        } else if (isCurrent) {
          const letters = currentGuess
            .padEnd(WORD_LENGTH, " ")
            .split("");

          tiles = letters.map((letter, i) => (
            <div
              key={i}
              className={`tile ${
                letter.trim() ? "current" : "empty"
              }`}
            >
              {letter}
            </div>
          ));
        } else {
          tiles = Array.from({ length: WORD_LENGTH }).map((_, i) => (
            <div key={i} className="tile empty"></div>
          ));
        }

        return (
          <div key={rowIdx} className="board-row">
            {tiles}
          </div>
        );
      })}
    </div>
  );

  const renderKeyboard = () => (
    <div className="keyboard">
      {KEYBOARD_ROWS.map((row, idx) => (
        <div key={idx} className="keyboard-row">
          {idx === 2 && (
            <button
              className="key large-key"
              onClick={() => handleKey("ENTER")}
            >
              ENTER
            </button>
          )}

          {row.split("").map((letter) => (
            <button
              key={letter}
              className={`key ${keyboardState[letter] || ""}`}
              onClick={() => handleKey(letter)}
            >
              {letter}
            </button>
          ))}

          {idx === 2 && (
            <button
              className="key large-key"
              onClick={() => handleKey("BACKSPACE")}
            >
              ⌫
            </button>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="app">
      <header className="header">
        <h1>Daily Word Puzzle</h1>

        <div className="header-buttons">
          <button
            className="hint-btn"
            onClick={() => setHintUsed(true)}
            disabled={hintUsed || status !== "playing"}
          >
            Hint
          </button>

          <button
            className="reset-btn"
            onClick={resetGame}
            disabled={status !== "playing"}
          >
            Reset
          </button>

          <button
            className="reset-btn"
            onClick={toggleMusic}
          >
            {isMusicPlaying ? "Pause Music" : "Play Music"}
          </button>
        </div>
      </header>

      {renderBoard()}

      <div className="message-area">
        {message && <p className="message">{message}</p>}
        {hintUsed && (
          <p className="hint">Hint: {solutionEntry.hint}</p>
        )}
      </div>

      {renderKeyboard()}

      {/* Background Audio */}
      <audio ref={audioRef} src="/background.mp3" loop />
    </div>
  );
}

export default App;
