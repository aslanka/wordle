// src/words.js

// Put YOUR custom solution words + hints here.
// Make sure word is 5 letters & uppercase.
export const CUSTOM_WORDS = [
    {
      word: "elevator",
      hint: "What goes up, lets out load, and then goes back",
    },
    
  ];
  
  // Valid guesses are just the words themselves.
  // If you have a bigger guess list, merge it here.
  export const VALID_GUESSES = CUSTOM_WORDS.map((w) => w.word);

  // Daily Word (same logic as before)
  export function getDailyWordEntry(date = new Date()) {
    const epoch = new Date(2024, 0, 1);
    const msPerDay = 86400000;
  
    const dayNumber = Math.floor(
      (date.setHours(0, 0, 0, 0) - epoch.setHours(0, 0, 0, 0)) / msPerDay
    );
  
    const index =
      ((dayNumber % CUSTOM_WORDS.length) + CUSTOM_WORDS.length) %
      CUSTOM_WORDS.length;
  
    return CUSTOM_WORDS[index];
  }
  