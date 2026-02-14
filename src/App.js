// src/App.jsx
import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { getDailyWordEntry } from "./words";

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
  { src: "/music/dancing.mp3", label: "Dancing in the smoke" },
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

/* 🌸 FULL-SCREEN FLOWER WIN OVERLAY (dark tint + animated petals) */
function FlowerWinOverlay({ title, subtitle, onClose, onShare }) {
  const petals = Array.from({ length: 52 }).map((_, i) => ({
    id: i,
    left: `${(i * 19) % 100}%`,
    delay: `${(i % 10) * 0.09}s`,
    duration: `${5.2 + (i % 7) * 0.55}s`,
    size: 18 + (i % 8) * 4,
    sway: 16 + (i % 6) * 10,
    emoji: ["🌸", "🌷", "🌺", "🌼", "🪷", "💮"][i % 6],
    opacity: 0.55 + (i % 6) * 0.07,
    blur: i % 9 === 0 ? 1.2 : 0,
  }));

  const sparkles = Array.from({ length: 18 }).map((_, i) => ({
    id: i,
    top: `${(i * 37) % 100}%`,
    left: `${(i * 53) % 100}%`,
    delay: `${(i % 6) * 0.22}s`,
    size: 6 + (i % 6) * 2,
  }));

  return (
    <div className="win-overlay" role="dialog" aria-live="polite">
      {/* dark tint */}
      <div className="win-backdrop" onClick={onClose} />

      {/* dreamy vfx */}
      <div className="win-vfx" aria-hidden="true">
        <div className="glow g1" />
        <div className="glow g2" />
        <div className="glow g3" />

        {sparkles.map((s) => (
          <span
            key={s.id}
            className="sparkle"
            style={{
              top: s.top,
              left: s.left,
              width: s.size,
              height: s.size,
              animationDelay: s.delay,
            }}
          />
        ))}

        {petals.map((p) => (
          <span
            key={p.id}
            className="petal"
            style={{
              left: p.left,
              animationDelay: p.delay,
              animationDuration: p.duration,
              fontSize: `${p.size}px`,
              opacity: p.opacity,
              filter: `drop-shadow(0 10px 14px rgba(0,0,0,0.25)) blur(${p.blur}px)`,
              "--sway": `${p.sway}px`,
            }}
          >
            {p.emoji}
          </span>
        ))}
      </div>

      {/* card */}
      <div className="win-card">
        <div className="win-badge">✨ DIVYA CODED ✨</div>
        <div className="win-title">{title}</div>
        <div className="win-subtitle">{subtitle}</div>

        <div className="win-actions">
          <button className="win-btn primary" onClick={onShare}>
            Share Results
          </button>
          <button className="win-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      <style>{`
        .win-overlay{
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 18px;
        }
        .win-backdrop{
          position: absolute;
          inset: 0;
          background: rgba(0,0,0,0.75);
          backdrop-filter: blur(6px);
        }
        .win-vfx{
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
        }
        .glow{
          position: absolute;
          width: 48vmax;
          height: 48vmax;
          border-radius: 999px;
          filter: blur(55px);
          opacity: 0.35;
          animation: drift 10s ease-in-out infinite;
        }
        .g1{ top:-22vmax; left:-18vmax; background: rgba(255, 140, 200, 0.75); }
        .g2{ bottom:-24vmax; right:-16vmax; background: rgba(140, 200, 255, 0.75); animation-duration: 12s; }
        .g3{ top:18vmax; right:-20vmax; background: rgba(200, 255, 170, 0.65); animation-duration: 13.5s; }
        @keyframes drift{
          0%   { transform: translate(0,0) scale(1); }
          50%  { transform: translate(40px,-30px) scale(1.05); }
          100% { transform: translate(0,0) scale(1); }
        }

        .sparkle{
          position: absolute;
          border-radius: 999px;
          background: rgba(255,255,255,0.85);
          box-shadow: 0 0 18px rgba(255,255,255,0.35);
          opacity: 0;
          animation: twinkle 1.9s ease-in-out infinite;
        }
        @keyframes twinkle{
          0% { transform: scale(0.7); opacity: 0; }
          40% { opacity: 0.95; }
          70% { opacity: 0.25; }
          100% { transform: scale(1.18); opacity: 0; }
        }

        .petal{
          position: absolute;
          top: -12%;
          transform: translateY(-20px);
          animation-name: fallSway;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: transform, opacity;
        }
        @keyframes fallSway{
          0%   { transform: translate(0, -30px) rotate(0deg); opacity: 0; }
          12%  { opacity: 1; }
          50%  { transform: translate(var(--sway), 55vh) rotate(180deg); opacity: 0.95; }
          100% { transform: translate(calc(var(--sway) * -1), 112vh) rotate(360deg); opacity: 0; }
        }

        .win-card{
          position: relative;
          width: min(560px, 94vw);
          border-radius: 22px;
          padding: 20px 18px 16px;
          text-align: center;
          background: rgba(18,18,18,0.88);
          border: 1px solid rgba(255,255,255,0.14);
          box-shadow: 0 24px 90px rgba(0,0,0,0.45);
          animation: pop 260ms ease-out;
        }
        @keyframes pop{
          0% { transform: translateY(10px) scale(0.95); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        .win-badge{
          display: inline-block;
          font-size: 12px;
          letter-spacing: 0.18em;
          font-weight: 800;
          padding: 8px 12px;
          border-radius: 999px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.10);
          margin-bottom: 10px;
        }
        .win-title{
          font-size: 28px;
          font-weight: 900;
          margin-bottom: 8px;
        }
        .win-subtitle{
          font-size: 14px;
          opacity: 0.95;
          line-height: 1.4;
          margin-bottom: 14px;
        }
        .win-actions{
          display: flex;
          gap: 10px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .win-btn{
          border: none;
          border-radius: 14px;
          padding: 10px 14px;
          font-weight: 800;
          cursor: pointer;
          background: rgba(255,255,255,0.10);
          color: white;
          border: 1px solid rgba(255,255,255,0.14);
        }
        .win-btn.primary{
          background: rgba(255,255,255,0.92);
          color: #111;
          border: 1px solid rgba(255,255,255,0.35);
        }
        .win-btn:active{
          transform: translateY(1px);
        }
      `}</style>
    </div>
  );
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

  // 🌸 win overlay state
  const [showWinOverlay, setShowWinOverlay] = useState(false);

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
    setShowWinOverlay(false);
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
      const winMsg =
        "you got it, but prolly in more tries than everyone else";
      setMessage(winMsg);
      setShowWinOverlay(true);
    } else if (newHistory.length === ROWS) {
      // Keep your original roast status text (but make sure logic still works)
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
      } else if ((key.length === 1 && /^[A-Z]$/.test(key)) || key === ".") {
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
          const letters = currentGuess.padEnd(WORD_LENGTH, " ").split("");
          tiles = letters.map((letter, i) => (
            <div
              key={i}
              className={`tile ${letter.trim() ? "current" : "empty"}`}
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
      {/* 🌸 WIN OVERLAY (dark tinted + animated flowers) */}
      {showWinOverlay && status === "won" && (
        <FlowerWinOverlay
          title="you got it 🌸"
          subtitle={message || "ok bestie!!!!"}
          onClose={() => setShowWinOverlay(false)}
          onShare={handleShare}
        />
      )}

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
        {hintUsed && <p className="hint">Hint: {solutionEntry.hint}</p>}

        {status !== "playing" && (
          <button className="share-btn" onClick={handleShare}>
            Share Results
          </button>
        )}
      </div>

      {renderKeyboard()}

      {/* 🎵 Background Audio */}
      <audio ref={audioRef} src={SONGS[currentTrackIndex]?.src} loop />
    </div>
  );
}

export default App;
