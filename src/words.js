// src/words.js

// Put YOUR custom solution words + hints here.
// Make sure word is 5 letters & uppercase.
export const CUSTOM_WORDS = [
    {
      word: "squeak",
      hint: "noise you make when you sleep",
    },
    {
      word: "marinate",
      hint: "my advice to what you should do to your cava so it taste better",
    },
    {
      word: "ohioo",
      hint: "the dumbest way to spell ohio",
    },
    {
      word: "idiot",
      hint: "best way to describe you",
    },
    {
      word: "dick",
      hint: "something we both want stuck into us",
    },
    {
      word: "whitehouse",
      hint: "best place to have sex",
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
  