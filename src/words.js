// src/words.js

// Put YOUR custom solution words + hints here.
// Make sure word is 5 letters & uppercase.
export const CUSTOM_WORDS = [
    {
      word: "cowgirl",
      hint: "sexy position you like. YEEHAW",
    },
    {
      word: "Abel",
      hint: "your husband fr.",
    },
    {
      word: "coding",
      hint: "something that puts you to sleep right away. YOU SPECIFICALLY, i think its really cool.",
    },
    {
      word: "happy",
      hint: "one of your fav doggos.",
    },
    {
      word: "vancleef",
      hint: "brand that you really like.",
    },
    {
      word: "lulu",
      hint: "brand you really like.",
    },
    {
      word: "DILDO",
      hint: "if someone got you one, youd be really happy.",
    },
    {
      word: "obx",
      hint: "tv show with hot people",
    },
    {
      word: "jj",
      hint: "your husband fr.",
    },
    {
      word: "garba",
      hint: "one of your fav activites.",
    },
    {
        word: "GREAT",
        hint: "the best wordle guess eve.",
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
  