// ─────────────────────────────────────────────────────────────────────────────
// Genre & book metadata for the AI template engine.
// Kept in its own module so the template data can grow (new books, richer
// genre descriptions) without touching the orchestration logic.
// ─────────────────────────────────────────────────────────────────────────────

export const BOOK_ALIASES = {
  "1 samuel": "1 Samuel", "2 samuel": "2 Samuel",
  "1 kings": "1 Kings", "2 kings": "2 Kings",
  "1 chronicles": "1 Chronicles", "2 chronicles": "2 Chronicles",
  "1 corinthians": "1 Corinthians", "2 corinthians": "2 Corinthians",
  "1 peter": "1 Peter", "2 peter": "2 Peter",
  "1 john": "1 John", "2 john": "2 John", "3 john": "3 John",
  "1 thessalonians": "1 Thessalonians", "2 thessalonians": "2 Thessalonians",
  "1 timothy": "1 Timothy", "2 timothy": "2 Timothy",
  "1 cor": "1 Corinthians", "2 cor": "2 Corinthians",
  "1 thes": "1 Thessalonians", "2 thes": "2 Thessalonians",
  "1 tim": "1 Timothy", "2 tim": "2 Timothy",
  "1co": "1 Corinthians", "2co": "2 Corinthians",
  "1th": "1 Thessalonians", "2th": "2 Thessalonians",
  "1ti": "1 Timothy", "2ti": "2 Timothy",
  "1sa": "1 Samuel", "2sa": "2 Samuel",
  "1ki": "1 Kings", "2ki": "2 Kings",
  "1ch": "1 Chronicles", "2ch": "2 Chronicles",
  "1pe": "1 Peter", "2pe": "2 Peter",
  "1jo": "1 John", "2jo": "2 John", "3jo": "3 John",
  "song of solomon": "Song of Solomon",
  "song of songs": "Song of Solomon",
  "sos": "Song of Solomon", "song": "Song of Solomon",
  "psalm": "Psalms", "psalms": "Psalms", "ps": "Psalms",
  "ecclesiastes": "Ecclesiastes", "ecc": "Ecclesiastes",
  "revelation": "Revelation", "rev": "Revelation", "revelations": "Revelation",
  "gen": "Genesis", "genesis": "Genesis",
  "exo": "Exodus", "exodus": "Exodus",
  "lev": "Leviticus", "leviticus": "Leviticus",
  "num": "Numbers", "numbers": "Numbers",
  "deu": "Deuteronomy", "deut": "Deuteronomy", "deuteronomy": "Deuteronomy",
  "jos": "Joshua", "josh": "Joshua", "joshua": "Joshua",
  "jdg": "Judges", "judges": "Judges",
  "rut": "Ruth", "ruth": "Ruth",
  "ezr": "Ezra", "ezra": "Ezra",
  "neh": "Nehemiah", "nehemiah": "Nehemiah",
  "est": "Esther", "esther": "Esther",
  "job": "Job",
  "pro": "Proverbs", "prov": "Proverbs", "proverbs": "Proverbs",
  "isa": "Isaiah", "isaiah": "Isaiah",
  "jer": "Jeremiah", "jeremiah": "Jeremiah",
  "lam": "Lamentations", "lamentations": "Lamentations",
  "eze": "Ezekiel", "ezek": "Ezekiel", "ezekiel": "Ezekiel",
  "dan": "Daniel", "daniel": "Daniel",
  "hos": "Hosea", "hosea": "Hosea",
  "joe": "Joel", "joel": "Joel",
  "amo": "Amos", "amos": "Amos",
  "oba": "Obadiah", "obadiah": "Obadiah",
  "jon": "Jonah", "jonah": "Jonah",
  "mic": "Micah", "micah": "Micah",
  "nah": "Nahum", "nahum": "Nahum",
  "hab": "Habakkuk", "habakkuk": "Habakkuk",
  "zep": "Zephaniah", "zeph": "Zephaniah", "zephaniah": "Zephaniah",
  "hag": "Haggai", "haggai": "Haggai",
  "zec": "Zechariah", "zech": "Zechariah", "zechariah": "Zechariah",
  "mal": "Malachi", "malachi": "Malachi",
  "mat": "Matthew", "matt": "Matthew", "matthew": "Matthew",
  "mar": "Mark", "mark": "Mark",
  "luk": "Luke", "luke": "Luke",
  "joh": "John", "john": "John",
  "act": "Acts", "acts": "Acts",
  "rom": "Romans", "romans": "Romans",
  "gal": "Galatians", "galatians": "Galatians",
  "eph": "Ephesians", "ephesians": "Ephesians",
  "phi": "Philippians", "phil": "Philippians", "philippians": "Philippians",
  "col": "Colossians", "colossians": "Colossians",
  "heb": "Hebrews", "hebrews": "Hebrews",
  "jam": "James", "james": "James",
  "tit": "Titus", "titus": "Titus",
  "phm": "Philemon", "philemon": "Philemon",
  "jud": "Jude", "jude": "Jude",
};

export function normalizeBook(book) {
  return BOOK_ALIASES[book.toLowerCase().trim()] || book;
}

export const BOOK_GENRES = {
  "Genesis": "law", "Exodus": "law", "Leviticus": "law", "Numbers": "law", "Deuteronomy": "law",
  "Joshua": "history", "Judges": "history", "Ruth": "history",
  "1 Samuel": "history", "2 Samuel": "history", "1 Kings": "history", "2 Kings": "history",
  "1 Chronicles": "history", "2 Chronicles": "history", "Ezra": "history", "Nehemiah": "history", "Esther": "history",
  "Job": "poetry", "Psalms": "poetry", "Proverbs": "poetry", "Ecclesiastes": "poetry", "Song of Solomon": "poetry",
  "Isaiah": "prophecy", "Jeremiah": "prophecy", "Lamentations": "prophecy", "Ezekiel": "prophecy", "Daniel": "prophecy",
  "Hosea": "prophecy", "Joel": "prophecy", "Amos": "prophecy", "Obadiah": "prophecy", "Jonah": "prophecy",
  "Micah": "prophecy", "Nahum": "prophecy", "Habakkuk": "prophecy", "Zephaniah": "prophecy", "Haggai": "prophecy",
  "Zechariah": "prophecy", "Malachi": "prophecy",
  "Matthew": "gospel", "Mark": "gospel", "Luke": "gospel", "John": "gospel",
  "Acts": "history",
  "Romans": "epistle", "1 Corinthians": "epistle", "2 Corinthians": "epistle", "Galatians": "epistle",
  "Ephesians": "epistle", "Philippians": "epistle", "Colossians": "epistle",
  "1 Thessalonians": "epistle", "2 Thessalonians": "epistle",
  "1 Timothy": "epistle", "2 Timothy": "epistle", "Titus": "epistle", "Philemon": "epistle",
  "Hebrews": "epistle", "James": "epistle", "1 Peter": "epistle", "2 Peter": "epistle",
  "1 John": "epistle", "2 John": "epistle", "3 John": "epistle", "Jude": "epistle",
  "Revelation": "apocalyptic",
};

export function detectGenre(bookName) {
  return BOOK_GENRES[bookName] || "epistle";
}

/**
 * One-line "what kind of book is this" intros, used by buildIntro and the
 * prompt templates to frame the passage naturally.
 */
export const GENRE_INTROS = {
  poetry: "invites us into a moment of sacred song, where the heart of the poet meets the heart of God.",
  gospel: "presents us with the very words and works of Jesus — the Word made flesh who dwells among us.",
  epistle: "brings us apostolic teaching, written to guide the early church and to instruct us in the faith.",
  prophecy: "carries the weight of divine proclamation — a message from God through His chosen messenger.",
  law: "grounds us in the foundations of God's covenant with His people — His commands, His promises, His call.",
  history: "records the unfolding story of God's faithfulness through the triumphs and failures of His people.",
  apocalyptic: "opens a window into the unseen realm, revealing the sovereign purposes of God in symbols and visions.",
};

/**
 * A one-line "tone note" about the genre, used inside explain lessons.
 */
export const GENRE_TAGS = {
  poetry: "This is the language of the soul, set to the music of faith.",
  epistle: "This is the voice of apostolic authority, speaking truth to the church.",
  gospel: "This is the testimony of eyewitnesses, recording the words and works of Jesus.",
  prophecy: "This is the word of the Lord — urgent, necessary, and alive.",
  law: "This is the foundation of covenant, revealing both God's holiness and His grace.",
  history: "This is the testimony of God's faithfulness, written for our instruction.",
  apocalyptic: "This is the unveiling of heaven's perspective on earth's reality.",
};

/**
 * How to hear the "voice" of each genre — used by Prompt 1 (who is speaking?).
 * Written to be read aloud: warm, concrete, and specific.
 */
export const GENRE_VOICES = {
  gospel: "The Gospels are eyewitness testimony — the very words and works of Jesus, recorded so that we might believe. As you read, notice whether Jesus Himself is speaking, whether the narrator is describing Him, or whether others are responding to Him. Every voice in the scene points toward one question: who do you say that He is?",
  epistle: "A letter — written by an apostle or church leader to a real community facing real questions. The author speaks with pastoral authority and personal warmth, addressing specific needs: division, discouragement, false teaching, doubt. When you read, imagine a shepherd writing to a congregation he loves — because that is exactly what is happening.",
  prophecy: "The prophet speaks as God's messenger: 'Thus says the Lord.' The word comes with divine urgency, calling God's people to turn from what is false and embrace what is true. Listen for the twin threads of warning and hope — judgment is never God's final word.",
  law: "God Himself speaks through Moses, establishing the covenant and teaching His people how to live as His redeemed family. These are not cold regulations; they are the shape of a relationship. Behind every command stands the love of the God who rescued them — and rescues us.",
  poetry: "This is the language of the heart — the psalmist or sage speaking to God, about God, or about the human condition. Poetry doesn't just inform; it moves. Let the images and rhythms do their work before you analyze them. Feel first, understand second.",
  history: "Here we watch God at work in real time — in the lives of His people, in victories and failures, in kings and shepherds. The narrator records what happened and why it matters. Ask as you read: what is God doing in this moment, and what does it teach us about His faithfulness?",
  apocalyptic: "Visions and symbols pull back the curtain on the unseen realm, showing that God is sovereign over history. The language is intense and layered, but the message is steady: the Lamb is on the throne, and His purposes will not fail.",
};

/**
 * Short display labels for each genre, used to phrase the "what to look for"
 * guide headers (Prompt 3 repetition / Prompt 4 contrasts).
 */
export const GENRE_LABELS = {
  poetry: "poetry",
  gospel: "a Gospel",
  epistle: "a letter",
  prophecy: "a prophecy",
  law: "the Law",
  history: "this story",
  apocalyptic: "this vision",
};

/**
 * Per-genre "what to look for" guides for repetition (Prompt 3).
 * Used when no chapter REPEATED_WORD tools exist and the verse itself shows
 * no repeated words, so the answer still teaches the reader where repetition
 * typically lives in this kind of writing.
 */
export const GENRE_REPETITION_GUIDES = {
  poetry: "Hebrew poetry leans on parallelism — the second line often echoes, sharpens, or completes the first. Watch for a word, image, or phrase returning in consecutive lines; repetition in poetry is how the writer makes you feel the weight of a truth, not just hear it.",
  gospel: "Gospel writers repeat to press one reality home: who Jesus is. Look for titles that recur (Son of Man, Son of God, Lord), scenes that mirror one another, and phrases that return at turning points. When a Gospel repeats something, it is usually the hinge of the story.",
  epistle: "Letters repeat their key exhortations on purpose. Watch for a command stated early and echoed late, a summary phrase the writer comes back to, and parallel sentences that say the same thing two ways. Repetition in a letter is emphasis — the author is driving a point home.",
  prophecy: "Prophets repeat to make the message unmissable: 'Thus says the Lord,' the same warning returning again and again, the same promise sounding twice. In prophecy, repetition is urgency — God keeps saying it because it must be heard.",
  law: "The Law repeats its central commands and their reasons, because these words were meant to be lived and taught aloud. Watch for a command restated with its motivation — 'so that,' 'because,' 'remember that.' Repetition in the Law is covenant loyalty made audible.",
  history: "Biblical narrative repeats to show what the storyteller thinks matters. Watch for recurring summaries (the same formula closing several episodes), repeated patterns of faithfulness and failure, and phrases that return at pivotal moments. What repeats across a story is what the narrator wants you to remember.",
  apocalyptic: "Apocalyptic writing repeats its symbols and numbers because they carry weight — the same image appearing again and again signals something of cosmic importance. Watch for repeated sevens, repeated descriptions of the throne or the Lamb, and refrains that structure the vision.",
};

/**
 * Per-genre "what to look for" guides for contrasts (Prompt 4).
 * Used when no chapter CONTRAST tools exist and the verse shows no contrast
 * pair, so the answer still points the reader to where contrasts typically
 * appear in this kind of writing.
 */
export const GENRE_CONTRAST_GUIDES = {
  poetry: "Poetry is built on contrasts — the righteous and the wicked, light and darkness, life and death, the present and the past. Watch for paired images that pull against each other; Hebrew parallelism often sets two sides of the same truth side by side so you can feel the difference.",
  gospel: "Gospel stories turn on contrasts — belief and unbelief, Jesus and the religious leaders, the kingdom of God and the kingdoms of this world. Watch for people set against one another, and for the narrator's quiet contrast between what the crowd expects and what Jesus does.",
  epistle: "Letters argue by contrast — flesh and Spirit, law and grace, the old self and the new self, the world's way and the way of Christ. Watch for 'but now,' 'not... but,' and pairs of opposites that show what has changed in Christ.",
  prophecy: "Prophets set two futures before their hearers: blessing and curse, obedience and rebellion, what is and what will be. Watch for the explicit 'if... then...' and for judgment placed beside restoration. The contrast is the prophet's way of forcing a choice.",
  law: "The Law itself is framed by the great contrast of blessing and curse — obey and live, disobey and suffer the consequences. Watch for 'clean and unclean,' 'holy and common,' and the two ways set before the people. The contrast is covenant-shaped: it defines the two paths of life.",
  history: "Narrative is shaped by contrasts — the faithful and the faithless, the king who sought the Lord and the one who did not, Israel's obedience and Israel's rebellion. Watch for characters placed side by side whose fates diverge; the narrator is often contrasting two ways of living.",
  apocalyptic: "Apocalyptic visions are drawn in stark contrasts — the Lamb and the beast, the new Jerusalem and fallen Babylon, light and darkness, the throne of God and the powers of earth. Watch for the sharp either/or; in vision literature, contrast reveals which kingdom finally stands.",
};
