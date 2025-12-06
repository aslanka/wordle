// src/App.jsx
import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { getDailyWordEntry  } from "./words";

const ROWS = 6;
const KEYBOARD_ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM."];
const LETTER_STATE_PRIORITY = {
  absent: 1,
  present: 2,
  correct: 3,
};

// 🎵 Playlist of songs
// Make sure these files exist in /public
const SONGS = [
  { src: "/music/background.mp3", label: "Earned It" },
  { src: "/music/show.mp3", label: "Enjoy the show" },
  { src: "/music/loft.mp3", label: "Loft" },
  { src: "/music/drake.mp3", label: "Wait For You" },
  { src: "/music/later.mp3", label: "Love Me Later" },
  { src: "/music/strangers.mp3", label: "Strangers" },
];

// 🟩🟨⬛ share emojis
const TILE_EMOJI = {
  correct: "🟩",
  present: "🟨",
  absent: "⬛",
};

// Build the shareable text like NYT Wordle
function buildShareText(history, status, rowsUsed) {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10); // e.g. 2025-12-01

  const attempts = status === "won" ? rowsUsed : "X";
  const header = `Divya's Wordle ${dateStr} ${attempts}/6`;

  const gridLines = history
    .map((row) =>
      row.result.map((state) => TILE_EMOJI[state] || "⬛").join("")
    )
    .join("\n");

  const link = window.location.href;

  return `${header}\n\n${gridLines}\n\n${link}`;
}

function evaluateGuess(guess, solution) {
  const len = solution.length;
  const result = Array(len).fill("absent");
  const solutionChars = solution.split("");

  // First pass: correct (green)
  for (let i = 0; i < len; i++) {
    if (guess[i] === solution[i]) {
      result[i] = "correct";
      solutionChars[i] = null;
    }
  }

  // Second pass: present (yellow)
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

  const [history, setHistory] = useState([]); // [{ word, result }]
  const [currentGuess, setCurrentGuess] = useState("");
  const [status, setStatus] = useState("playing"); // "playing" | "won" | "lost"
  const [message, setMessage] = useState("");
  const [keyboardState, setKeyboardState] = useState({});
  const [hintUsed, setHintUsed] = useState(false);

  // 🎵 Music state
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(() =>
    SONGS.length > 0 ? Math.floor(Math.random() * SONGS.length) : 0
  );
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
        .catch((err) => {
          console.error("Autoplay blocked:", err);
        });
    }
  };

  // 🎵 Next random track button
  const playNextRandomTrack = () => {
    if (SONGS.length === 0) return;

    setCurrentTrackIndex((prev) => {
      if (SONGS.length === 1) return prev; // nothing else to pick
      let next = prev;
      while (next === prev) {
        next = Math.floor(Math.random() * SONGS.length);
      }
      return next;
    });
  };

  // When track changes & music is "playing", auto play the new song
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = 0;
    if (isMusicPlaying) {
      audio
        .play()
        .then(() => {
          // ok
        })
        .catch((err) => {
          console.error("Error playing new track:", err);
        });
    }
  }, [currentTrackIndex, isMusicPlaying]);

  const resetGame = () => {
    const entry = getDailyWordEntry();
    setSolutionEntry(entry);
    setHistory([]);
    setCurrentGuess("");
    setStatus("playing");
    setMessage("");
    setKeyboardState({});
    setHintUsed(false);
  };

  const submitGuess = useCallback(() => {
    if (status !== "playing") return;

    if (currentGuess.length !== WORD_LENGTH) {
      setMessage(`Word must be ${WORD_LENGTH} letters`);
      return;
    }

    const guess = currentGuess.toUpperCase();
    const result = evaluateGuess(guess, solution);
    const newHistory = [...history, { word: guess, result }];

    setHistory(newHistory);

    // Update keyboard state
    setKeyboardState((prev) => {
      const updated = { ...prev };
      for (let i = 0; i < guess.length; i++) {
        const letter = guess[i];
        const state = result[i];
        const prevState = updated[letter];

        if (!prevState) {
          updated[letter] = state;
        } else if (
          LETTER_STATE_PRIORITY[state] >
          LETTER_STATE_PRIORITY[prevState]
        ) {
          updated[letter] = state;
        }
      }
      return updated;
    });

    setCurrentGuess("");
    setMessage("");

    if (guess === solution) {
      setStatus("won");
      setMessage("you got it, but prolly in more tries than everyone else");
    } else if (newHistory.length === ROWS) {
      setStatus("girl, you dont even know yourself");
      setMessage(`The word was ${solution}`);
    }
  }, [status, currentGuess, WORD_LENGTH, history, solution]);

  const handleKey = useCallback(
    (key) => {
      if (status !== "playing") return;

      if (key === "ENTER") {
        submitGuess();
        return;
      }

      if (key === "BACKSPACE") {
        setCurrentGuess((prev) => prev.slice(0, -1));
        return;
      }

      if (
        (/^[A-Z]$/.test(key) || key === ".") &&
        currentGuess.length < WORD_LENGTH
      ) {
        setCurrentGuess((prev) => prev + key);
      }
      
    },
    [status, currentGuess, WORD_LENGTH, submitGuess]
  );

  useEffect(() => {
    const onKeyDown = (e) => {
      let key = e.key;
    
      // Normalize letters to uppercase, keep "." as "."
      if (key.length === 1 && /^[a-z]$/i.test(key)) {
        key = key.toUpperCase();
      }
    
      if (key === "Enter") {
        handleKey("ENTER");
      } else if (key === "Backspace" || key === "Delete") {
        handleKey("BACKSPACE");
      } else if (
        (key.length === 1 && /^[A-Z]$/.test(key)) ||
        key === "."
      ) {
        handleKey(key);
      }
    };
    

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleKey]);

  const renderBoard = () => (
    <div className="board">
      {Array.from({ length: ROWS }).map((_, rowIndex) => {
        const rowData = history[rowIndex];
        const isCurrentRow =
          rowIndex === history.length && status === "playing";

        let tiles;

        if (rowData) {
          tiles = rowData.word.split("").map((letter, i) => (
            <div key={i} className={`tile ${rowData.result[i]}`}>
              {letter}
            </div>
          ));
        } else if (isCurrentRow) {
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
            <div key={i} className="tile empty" />
          ));
        }

        return (
          <div key={rowIndex} className="board-row">
            {tiles}
          </div>
        );
      })}
    </div>
  );

  const renderKeyboard = () => (
    <div className="keyboard">
      {KEYBOARD_ROWS.map((row, rowIndex) => (
        <div key={rowIndex} className="keyboard-row">
          {rowIndex === 2 && (
            <button
              type="button"
              className="key large-key"
              onClick={() => handleKey("ENTER")}
            >
              ENTER
            </button>
          )}
          {row.split("").map((letter) => {
            const state = keyboardState[letter] || "";
            return (
              <button
                key={letter}
                type="button"
                className={`key ${state}`}
                onClick={() => handleKey(letter)}
              >
                {letter}
              </button>
            );
          })}
          {rowIndex === 2 && (
            <button
              type="button"
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

  // Share results like NYT Wordle
  const handleShare = useCallback(() => {
    if (status === "playing") return;

    const text = buildShareText(history, status, history.length);

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          setMessage("Results copied to clipboard!");
        })
        .catch(() => {
          setMessage("Could not copy automatically. Check console.");
          console.log(text);
        });
    } else {
      setMessage("Copy not supported. Check console for results.");
      console.log(text);
    }
  }, [history, status]);

  return (
    <div className="app">
      <header className="header">
        <h1>Divya's Wordle</h1>

        <div className="header-icons">
          {/* Hint */}
          <button
            className="icon-btn"
            onClick={() => setHintUsed(true)}
            disabled={hintUsed || status !== "playing"}
            title="Hint"
          >
            💡
          </button>

          {/* Reset */}
          <button
            className="icon-btn"
            onClick={resetGame}
            disabled={status !== "playing"}
            title="Reset"
          >
            ↻
          </button>

          {/* Play / Pause */}
          <button
            className="icon-btn"
            onClick={toggleMusic}
            title={isMusicPlaying ? "Pause Music" : "Play Music"}
          >
            {isMusicPlaying ? "⏸️" : "🎵"}
          </button>

          {/* Next track */}
          <button
            className="icon-btn"
            onClick={playNextRandomTrack}
            title="Next Track"
          >
            ⏭️
          </button>
        </div>
      </header>

      <p className="now-playing">
        Now playing: {SONGS[currentTrackIndex]?.label}
      </p>

      {renderBoard()}

      <div className="message-area">
        {message && <p className="message">{message}</p>}
        {hintUsed && (
          <p className="hint">Hint: {solutionEntry.hint}</p>
        )}
      

        {status !== "playing" && (
          <button className="share-btn" onClick={handleShare}>
            Share Results
          </button>
        )}
      </div>

      {renderKeyboard()}

      {/* 🎵 Background Audio */}
      <audio
        ref={audioRef}
        src={SONGS[currentTrackIndex]?.src}
        loop
      />
    </div>
  );
}

export default App;
