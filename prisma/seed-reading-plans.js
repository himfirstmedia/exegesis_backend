import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const prisma = new PrismaClient();

// Check for --force flag to re-seed
const FORCE_RESET = process.argv.includes("--force");

// ──────────────────────────────────────────────
// Plan 1: The Gospel of John – Knowing Jesus (21 days)
// ──────────────────────────────────────────────
const planJohn = {
  planId: "JOHN-21",
  title: "The Gospel of John: Knowing Jesus",
  description:
    "A 21-day journey through the Gospel of John, exploring who Jesus is through His signs, discourses, and miracles. Each day includes passages that reveal His identity as the Son of God and what it means to believe in Him.",
  totalDays: 21,
  questionsEnabled: true,
  category: "New Testament",
  difficulty: "Beginner",
  isActive: true,
  dailyAssignments: [
    // Week 1: The Word Became Flesh
    {
      dayNumber: 1,
      title: "The Word Became Flesh",
      chaptersJson: JSON.stringify([
        { book: "John", startChapter: 1, endChapter: 1, startVerse: 1, endVerse: 18 },
      ]),
      reflectionQuestions: JSON.stringify([
        "What does it mean that Jesus is the 'Word' (Logos)?",
        "How does John's prologue connect creation (Genesis 1) with the coming of Christ?",
      ]),
    },
    {
      dayNumber: 2,
      title: "John the Baptist and the First Disciples",
      chaptersJson: JSON.stringify([
        { book: "John", startChapter: 1, endChapter: 1, startVerse: 19, endVerse: 51 },
      ]),
      reflectionQuestions: JSON.stringify([
        "What does John the Baptist's testimony teach us about humility?",
        "Why do you think the first disciples were so quick to follow Jesus?",
      ]),
    },
    {
      dayNumber: 3,
      title: "The Wedding at Cana",
      chaptersJson: JSON.stringify([
        { book: "John", startChapter: 2, endChapter: 2 },
      ]),
      reflectionQuestions: JSON.stringify([
        "What does Jesus' first miracle reveal about His character?",
        "Why did Jesus say His 'hour had not yet come'?",
      ]),
    },
    {
      dayNumber: 4,
      title: "Nicodemus and Being Born Again",
      chaptersJson: JSON.stringify([
        { book: "John", startChapter: 3, endChapter: 3 },
      ]),
      reflectionQuestions: JSON.stringify([
        "What does it mean to be 'born again'?",
        "John 3:16 is the most famous verse — what makes it so powerful?",
      ]),
    },
    {
      dayNumber: 5,
      title: "The Woman at the Well",
      chaptersJson: JSON.stringify([
        { book: "John", startChapter: 4, endChapter: 4, startVerse: 1, endVerse: 42 },
      ]),
      reflectionQuestions: JSON.stringify([
        "How did Jesus break social barriers in His conversation with the Samaritan woman?",
        "What is the 'living water' Jesus offers?",
      ]),
    },
    {
      dayNumber: 6,
      title: "Healing at the Pool and the Son's Authority",
      chaptersJson: JSON.stringify([
        { book: "John", startChapter: 5, endChapter: 5 },
      ]),
      reflectionQuestions: JSON.stringify([
        "Why did the religious leaders oppose Jesus for healing on the Sabbath?",
        "What does Jesus mean when He says He and the Father are one?",
      ]),
    },
    {
      dayNumber: 7,
      title: "The Feeding of the 5,000",
      chaptersJson: JSON.stringify([
        { book: "John", startChapter: 6, endChapter: 6, startVerse: 1, endVerse: 71 },
      ]),
      reflectionQuestions: JSON.stringify([
        "What does the multiplication of the loaves teach about Jesus' provision?",
        "Why did many disciples turn away after the 'Bread of Life' discourse?",
      ]),
    },
    // Week 2: Light and Life
    {
      dayNumber: 8,
      title: "The Feast of Tabernacles",
      chaptersJson: JSON.stringify([
        { book: "John", startChapter: 7, endChapter: 7 },
      ]),
      reflectionQuestions: JSON.stringify([
        "Why was there so much division among the people about Jesus?",
        "What does Jesus mean by 'rivers of living water'?",
      ]),
    },
    {
      dayNumber: 9,
      title: "The Woman Caught in Adultery",
      chaptersJson: JSON.stringify([
        { book: "John", startChapter: 8, endChapter: 8, startVerse: 1, endVerse: 59 },
      ]),
      reflectionQuestions: JSON.stringify([
        "How does Jesus' response to the accusers demonstrate grace and truth?",
        "What does it mean that 'the truth will set you free'?",
      ]),
    },
    {
      dayNumber: 10,
      title: "Healing the Blind Man",
      chaptersJson: JSON.stringify([
        { book: "John", startChapter: 9, endChapter: 9 },
      ]),
      reflectionQuestions: JSON.stringify([
        "Why did Jesus say the man was born blind 'so that the works of God might be displayed'?",
        "What is the difference between physical and spiritual blindness?",
      ]),
    },
    {
      dayNumber: 11,
      title: "The Good Shepherd",
      chaptersJson: JSON.stringify([
        { book: "John", startChapter: 10, endChapter: 10 },
      ]),
      reflectionQuestions: JSON.stringify([
        "What characteristics of the Good Shepherd stand out to you?",
        "How do you hear the Shepherd's voice in your daily life?",
      ]),
    },
    {
      dayNumber: 12,
      title: "The Raising of Lazarus",
      chaptersJson: JSON.stringify([
        { book: "John", startChapter: 11, endChapter: 11 },
      ]),
      reflectionQuestions: JSON.stringify([
        "Why did Jesus wait two days before going to Lazarus?",
        "What does 'I am the resurrection and the life' mean for us today?",
      ]),
    },
    {
      dayNumber: 13,
      title: "The Triumphal Entry and the Hour Has Come",
      chaptersJson: JSON.stringify([
        { book: "John", startChapter: 12, endChapter: 12 },
      ]),
      reflectionQuestions: JSON.stringify([
        "Why did the crowds welcome Jesus as King, and what changed?",
        "What does the grain of wheat falling to the ground symbolize?",
      ]),
    },
    {
      dayNumber: 14,
      title: "The Last Supper and Foot Washing",
      chaptersJson: JSON.stringify([
        { book: "John", startChapter: 13, endChapter: 13 },
      ]),
      reflectionQuestions: JSON.stringify([
        "What does Jesus' act of washing feet teach about leadership?",
        "Why was Judas's betrayal so significant?",
      ]),
    },
    // Week 3: The Farewell Discourse and Passion
    {
      dayNumber: 15,
      title: "I Am the Way, the Truth, and the Life",
      chaptersJson: JSON.stringify([
        { book: "John", startChapter: 14, endChapter: 14 },
      ]),
      reflectionQuestions: JSON.stringify([
        "What comfort does Jesus offer His disciples in this chapter?",
        "What does it mean that Jesus is preparing a place for us?",
      ]),
    },
    {
      dayNumber: 16,
      title: "The Vine and the Branches",
      chaptersJson: JSON.stringify([
        { book: "John", startChapter: 15, endChapter: 15 },
      ]),
      reflectionQuestions: JSON.stringify([
        "What does it mean to 'abide' in Christ?",
        "How does pruning produce more fruit in our lives?",
      ]),
    },
    {
      dayNumber: 17,
      title: "The Promise of the Holy Spirit",
      chaptersJson: JSON.stringify([
        { book: "John", startChapter: 16, endChapter: 16 },
      ]),
      reflectionQuestions: JSON.stringify([
        "Why is it better for Jesus to go away so the Spirit can come?",
        "What is the role of the Holy Spirit in the believer's life?",
      ]),
    },
    {
      dayNumber: 18,
      title: "Jesus' High Priestly Prayer",
      chaptersJson: JSON.stringify([
        { book: "John", startChapter: 17, endChapter: 17 },
      ]),
      reflectionQuestions: JSON.stringify([
        "What does Jesus' prayer for unity reveal about His heart?",
        "How are we 'in the world but not of the world'?",
      ]),
    },
    {
      dayNumber: 19,
      title: "The Arrest and Trial",
      chaptersJson: JSON.stringify([
        { book: "John", startChapter: 18, endChapter: 18 },
      ]),
      reflectionQuestions: JSON.stringify([
        "Why did Jesus willingly surrender to His arrest?",
        "What does Peter's denial teach us about human weakness?",
      ]),
    },
    {
      dayNumber: 20,
      title: "The Crucifixion",
      chaptersJson: JSON.stringify([
        { book: "John", startChapter: 19, endChapter: 19 },
      ]),
      reflectionQuestions: JSON.stringify([
        "What does Jesus' care for His mother from the cross reveal?",
        "Why is 'It is finished' the most important declaration?",
      ]),
    },
    {
      dayNumber: 21,
      title: "The Resurrection and the Great Commission",
      chaptersJson: JSON.stringify([
        { book: "John", startChapter: 20, endChapter: 20 },
        { book: "John", startChapter: 21, endChapter: 21 },
      ]),
      reflectionQuestions: JSON.stringify([
        "Why is Mary Magdalene's encounter with the risen Jesus so significant?",
        "What does Jesus' restoration of Peter teach about forgiveness and calling?",
        "What does it mean to be sent by Jesus as He was sent by the Father?",
      ]),
    },
  ],
};

// ──────────────────────────────────────────────
// Plan 2: The Life of David (14 days)
// ──────────────────────────────────────────────
const planDavid = {
  planId: "DAVID-14",
  title: "The Life of David: A Heart After God",
  description:
    "A 14-day journey through the life of David — shepherd, warrior, king, poet, and sinner. Learn from his faith, failures, and the grace of God that defines his legacy as a man after God's own heart.",
  totalDays: 14,
  questionsEnabled: true,
  category: "Old Testament",
  difficulty: "Intermediate",
  isActive: true,
  dailyAssignments: [
    {
      dayNumber: 1,
      title: "David's Anointing",
      chaptersJson: JSON.stringify([
        { book: "1 Samuel", startChapter: 16, endChapter: 16 },
      ]),
      reflectionQuestions: JSON.stringify([
        "What does God's choice of David teach us about how He sees people?",
        "How did Samuel's obedience play a role in God's plan?",
      ]),
    },
    {
      dayNumber: 2,
      title: "David and Goliath",
      chaptersJson: JSON.stringify([
        { book: "1 Samuel", startChapter: 17, endChapter: 17 },
      ]),
      reflectionQuestions: JSON.stringify([
        "What was the source of David's courage?",
        "How did David's preparation as a shepherd prepare him for this moment?",
      ]),
    },
    {
      dayNumber: 3,
      title: "Jonathan's Friendship and Saul's Jealousy",
      chaptersJson: JSON.stringify([
        { book: "1 Samuel", startChapter: 18, endChapter: 18 },
        { book: "1 Samuel", startChapter: 19, endChapter: 19, startVerse: 1, endVerse: 7 },
      ]),
      reflectionQuestions: JSON.stringify([
        "What made Jonathan's friendship with David so remarkable?",
        "How did Saul's jealousy consume and destroy him?",
      ]),
    },
    {
      dayNumber: 4,
      title: "David on the Run",
      chaptersJson: JSON.stringify([
        { book: "1 Samuel", startChapter: 21, endChapter: 21 },
        { book: "1 Samuel", startChapter: 22, endChapter: 22 },
      ]),
      reflectionQuestions: JSON.stringify([
        "How did David maintain his faith while being hunted?",
        "What do David's psalms from this period reveal about his trust in God?",
      ]),
    },
    {
      dayNumber: 5,
      title: "David Spares Saul's Life",
      chaptersJson: JSON.stringify([
        { book: "1 Samuel", startChapter: 24, endChapter: 24 },
        { book: "1 Samuel", startChapter: 26, endChapter: 26 },
      ]),
      reflectionQuestions: JSON.stringify([
        "Why did David refuse to kill Saul even when he had the chance?",
        "What does respecting God's anointed mean for us today?",
      ]),
    },
    {
      dayNumber: 6,
      title: "The Death of Saul and David's Lament",
      chaptersJson: JSON.stringify([
        { book: "1 Samuel", startChapter: 31, endChapter: 31 },
        { book: "2 Samuel", startChapter: 1, endChapter: 1 },
      ]),
      reflectionQuestions: JSON.stringify([
        "What does David's lament over Saul reveal about his character?",
        "How did David model forgiveness and honor even toward his enemy?",
      ]),
    },
    {
      dayNumber: 7,
      title: "David Becomes King",
      chaptersJson: JSON.stringify([
        { book: "2 Samuel", startChapter: 2, endChapter: 2, startVerse: 1, endVerse: 11 },
        { book: "2 Samuel", startChapter: 5, endChapter: 5, startVerse: 1, endVerse: 12 },
      ]),
      reflectionQuestions: JSON.stringify([
        "Why did David seek the Lord before every major decision?",
        "What made David a good king in his early reign?",
      ]),
    },
    {
      dayNumber: 8,
      title: "The Ark Returns to Jerusalem",
      chaptersJson: JSON.stringify([
        { book: "2 Samuel", startChapter: 6, endChapter: 6 },
      ]),
      reflectionQuestions: JSON.stringify([
        "Why was Uzzah struck down for touching the Ark?",
        "What does David's uninhibited worship teach us about worshiping God?",
      ]),
    },
    {
      dayNumber: 9,
      title: "God's Covenant with David",
      chaptersJson: JSON.stringify([
        { book: "2 Samuel", startChapter: 7, endChapter: 7 },
      ]),
      reflectionQuestions: JSON.stringify([
        "What was God's promise to David about his throne?",
        "How does this covenant point forward to Jesus?",
      ]),
    },
    {
      dayNumber: 10,
      title: "David's Kindness to Mephibosheth",
      chaptersJson: JSON.stringify([
        { book: "2 Samuel", startChapter: 9, endChapter: 9 },
      ]),
      reflectionQuestions: JSON.stringify([
        "What does David's kindness to Mephibosheth reveal about grace?",
        "How does this story mirror God's grace toward us?",
      ]),
    },
    {
      dayNumber: 11,
      title: "David and Bathsheba",
      chaptersJson: JSON.stringify([
        { book: "2 Samuel", startChapter: 11, endChapter: 11 },
      ]),
      reflectionQuestions: JSON.stringify([
        "How did one moment of temptation lead to a chain of sin?",
        "What warning does this story hold for us?",
      ]),
    },
    {
      dayNumber: 12,
      title: "Nathan's Rebuke and David's Repentance",
      chaptersJson: JSON.stringify([
        { book: "2 Samuel", startChapter: 12, endChapter: 12, startVerse: 1, endVerse: 25 },
        { book: "Psalms", startChapter: 51, endChapter: 51 },
      ]),
      reflectionQuestions: JSON.stringify([
        "How did Nathan's parable pierce David's heart?",
        "What elements of true repentance do you see in Psalm 51?",
      ]),
    },
    {
      dayNumber: 13,
      title: "Absalom's Rebellion",
      chaptersJson: JSON.stringify([
        { book: "2 Samuel", startChapter: 15, endChapter: 15 },
        { book: "2 Samuel", startChapter: 18, endChapter: 18, startVerse: 1, endVerse: 33 },
      ]),
      reflectionQuestions: JSON.stringify([
        "How did David's sin affect his family?",
        "What does David's grief over Absalom reveal about a father's love?",
      ]),
    },
    {
      dayNumber: 14,
      title: "David's Final Days and Legacy",
      chaptersJson: JSON.stringify([
        { book: "2 Samuel", startChapter: 22, endChapter: 22 },
        { book: "2 Samuel", startChapter: 23, endChapter: 23, startVerse: 1, endVerse: 7 },
        { book: "1 Kings", startChapter: 2, endChapter: 2, startVerse: 1, endVerse: 12 },
      ]),
      reflectionQuestions: JSON.stringify([
        "How does David's song in 2 Samuel 22 summarize his walk with God?",
        "What is the legacy David left for future generations?",
        "How does David's life point us to the greater King, Jesus?",
      ]),
    },
  ],
};

// ──────────────────────────────────────────────
// Plan 3: Romans – The Righteousness of God (16 days)
// ──────────────────────────────────────────────
const planRomans = {
  planId: "ROMANS-16",
  title: "Romans: Righteousness by Faith",
  description:
    "A 16-day study through Paul's letter to the Romans — the most comprehensive explanation of the gospel in Scripture. Explore sin, salvation, sanctification, and the sovereignty of God in this foundational New Testament book.",
  totalDays: 16,
  questionsEnabled: true,
  category: "New Testament",
  difficulty: "Advanced",
  isActive: true,
  dailyAssignments: [
    {
      dayNumber: 1,
      title: "The Gospel of God",
      chaptersJson: JSON.stringify([
        { book: "Romans", startChapter: 1, endChapter: 1, startVerse: 1, endVerse: 17 },
      ]),
      reflectionQuestions: JSON.stringify([
        "What is the gospel Paul is 'not ashamed of'?",
        "What does 'the righteousness of God is revealed from faith to faith' mean?",
      ]),
    },
    {
      dayNumber: 2,
      title: "The Wrath of God Against Sin",
      chaptersJson: JSON.stringify([
        { book: "Romans", startChapter: 1, endChapter: 1, startVerse: 18, endVerse: 32 },
      ]),
      reflectionQuestions: JSON.stringify([
        "What does it mean that God 'gave them over'?",
        "How does Paul connect idolatry with moral decay?",
      ]),
    },
    {
      dayNumber: 3,
      title: "God's Righteous Judgment",
      chaptersJson: JSON.stringify([
        { book: "Romans", startChapter: 2, endChapter: 2 },
      ]),
      reflectionQuestions: JSON.stringify([
        "How does Paul address those who judge others while sinning themselves?",
        "What is the difference between outward religion and inward transformation?",
      ]),
    },
    {
      dayNumber: 4,
      title: "All Under Sin",
      chaptersJson: JSON.stringify([
        { book: "Romans", startChapter: 3, endChapter: 3 },
      ]),
      reflectionQuestions: JSON.stringify([
        "Why does Paul conclude that 'no one is righteous'?",
        "What is the purpose of the Law if it cannot save?",
      ]),
    },
    {
      dayNumber: 5,
      title: "Justified by Faith",
      chaptersJson: JSON.stringify([
        { book: "Romans", startChapter: 4, endChapter: 4 },
      ]),
      reflectionQuestions: JSON.stringify([
        "How does Abraham demonstrate justification by faith?",
        "Why is it significant that Abraham was justified before circumcision?",
      ]),
    },
    {
      dayNumber: 6,
      title: "Peace with God Through Christ",
      chaptersJson: JSON.stringify([
        { book: "Romans", startChapter: 5, endChapter: 5, startVerse: 1, endVerse: 11 },
      ]),
      reflectionQuestions: JSON.stringify([
        "What does it mean to have 'peace with God'?",
        "Why does Paul say we rejoice in suffering?",
      ]),
    },
    {
      dayNumber: 7,
      title: "Adam and Christ",
      chaptersJson: JSON.stringify([
        { book: "Romans", startChapter: 5, endChapter: 5, startVerse: 12, endVerse: 21 },
      ]),
      reflectionQuestions: JSON.stringify([
        "How does Paul contrast Adam and Christ?",
        "What does 'where sin abounded, grace abounded much more' mean?",
      ]),
    },
    {
      dayNumber: 8,
      title: "Dead to Sin, Alive to God",
      chaptersJson: JSON.stringify([
        { book: "Romans", startChapter: 6, endChapter: 6 },
      ]),
      reflectionQuestions: JSON.stringify([
        "What does it mean to be 'baptized into Christ's death'?",
        "How can we 'consider ourselves dead to sin but alive to God'?",
      ]),
    },
    {
      dayNumber: 9,
      title: "The Struggle with Sin",
      chaptersJson: JSON.stringify([
        { book: "Romans", startChapter: 7, endChapter: 7 },
      ]),
      reflectionQuestions: JSON.stringify([
        "Why does Paul describe the internal struggle between the flesh and the Spirit?",
        "Who delivers us from this body of death?",
      ]),
    },
    {
      dayNumber: 10,
      title: "Life in the Spirit",
      chaptersJson: JSON.stringify([
        { book: "Romans", startChapter: 8, endChapter: 8, startVerse: 1, endVerse: 17 },
      ]),
      reflectionQuestions: JSON.stringify([
        "What does it mean that 'there is no condemnation for those in Christ Jesus'?",
        "How does the Holy Spirit help us in our weakness?",
      ]),
    },
    {
      dayNumber: 11,
      title: "Future Glory and Present Suffering",
      chaptersJson: JSON.stringify([
        { book: "Romans", startChapter: 8, endChapter: 8, startVerse: 18, endVerse: 39 },
      ]),
      reflectionQuestions: JSON.stringify([
        "How does future glory outweigh present suffering?",
        "What assurance does 'all things work together for good' provide?",
        "Can anything separate us from God's love?",
      ]),
    },
    {
      dayNumber: 12,
      title: "God's Sovereignty in Salvation",
      chaptersJson: JSON.stringify([
        { book: "Romans", startChapter: 9, endChapter: 9 },
      ]),
      reflectionQuestions: JSON.stringify([
        "What does Paul teach about God's sovereign choice?",
        "How do human responsibility and divine sovereignty work together?",
      ]),
    },
    {
      dayNumber: 13,
      title: "The Heart of the Gospel – Israel's Salvation",
      chaptersJson: JSON.stringify([
        { book: "Romans", startChapter: 10, endChapter: 10 },
      ]),
      reflectionQuestions: JSON.stringify([
        "What is the difference between pursuing righteousness by law vs. by faith?",
        "How does 'whoever calls on the name of the Lord will be saved' apply to all people?",
      ]),
    },
    {
      dayNumber: 14,
      title: "Living Sacrifices",
      chaptersJson: JSON.stringify([
        { book: "Romans", startChapter: 12, endChapter: 12 },
      ]),
      reflectionQuestions: JSON.stringify([
        "What does it mean to offer your body as a 'living sacrifice'?",
        "How can we be 'transformed by the renewing of your mind'?",
      ]),
    },
    {
      dayNumber: 15,
      title: "Love and Christian Conduct",
      chaptersJson: JSON.stringify([
        { book: "Romans", startChapter: 13, endChapter: 13 },
        { book: "Romans", startChapter: 14, endChapter: 14 },
      ]),
      reflectionQuestions: JSON.stringify([
        "How does love fulfill the Law?",
        "How should we handle differences of opinion among believers?",
      ]),
    },
    {
      dayNumber: 16,
      title: "Paul's Mission and Final Greetings",
      chaptersJson: JSON.stringify([
        { book: "Romans", startChapter: 15, endChapter: 15, startVerse: 14, endVerse: 33 },
        { book: "Romans", startChapter: 16, endChapter: 16 },
      ]),
      reflectionQuestions: JSON.stringify([
        "What can we learn from Paul's missionary vision?",
        "Why does Paul include so many personal greetings in a theological letter?",
        "How does Romans equip you to live out the gospel?",
      ]),
    },
  ],
};

// Combine all reading plans
const readingPlans = [planJohn, planDavid, planRomans];

// Quiz questions for each plan (expanded: 7-8 questions per plan spread across days)
const quizData = [
  {
    planId: "JOHN-21",
    questions: [
      {
        dayNumber: 1,
        question: 'According to John 1:1, the Word (Logos) was with God and the Word was...?',
        optionsJson: JSON.stringify(["A prophet", "An angel", "God", "A teacher"]),
        correctAnswer: 2,
        explanation: "John 1:1 declares 'the Word was with God, and the Word was God' — affirming the deity of Christ.",
      },
      {
        dayNumber: 2,
        question: "What did Andrew do immediately after recognizing Jesus as the Messiah?",
        optionsJson: JSON.stringify([
          "He fell at Jesus' feet",
          "He went and found his brother Simon Peter",
          "He began preaching to the crowds",
          "He asked to follow Jesus",
        ]),
        correctAnswer: 1,
        explanation: "Andrew first found his brother Simon and told him 'We have found the Messiah' (John 1:41).",
      },
      {
        dayNumber: 3,
        question: "What did Jesus turn water into at the wedding in Cana?",
        optionsJson: JSON.stringify(["Fresh grape juice", "Milk", "Wine", "Honey"]),
        correctAnswer: 2,
        explanation: "Jesus turned water into wine at the wedding in Cana — His first recorded miracle (John 2:1-11).",
      },
      {
        dayNumber: 4,
        question: "What did Jesus tell Nicodemus was necessary to see the kingdom of God?",
        optionsJson: JSON.stringify([
          "Being a good person",
          "Being born again",
          "Keeping the Law",
          "Being baptized by John",
        ]),
        correctAnswer: 1,
        explanation: "Jesus said 'unless one is born again, he cannot see the kingdom of God' (John 3:3).",
      },
      {
        dayNumber: 7,
        question: "After feeding the 5,000, what did Jesus declare Himself to be?",
        optionsJson: JSON.stringify([
          "The light of the world",
          "The bread of life",
          "The resurrection",
          "The good shepherd",
        ]),
        correctAnswer: 1,
        explanation: "After the feeding of the 5,000, Jesus declared 'I am the bread of life. He who comes to Me shall never hunger' (John 6:35).",
      },
      {
        dayNumber: 10,
        question: "What did Jesus say He is in John 10?",
        optionsJson: JSON.stringify([
          "The gate and the good shepherd",
          "The living water",
          "The bread from heaven",
          "The light of the world",
        ]),
        correctAnswer: 0,
        explanation: "In John 10, Jesus declares 'I am the door' (v.9) and 'I am the good shepherd' (v.11).",
      },
      {
        dayNumber: 15,
        question: "What did Jesus promise to send to His disciples after He left?",
        optionsJson: JSON.stringify([
          "The Holy Spirit (the Helper)",
          "More prophets",
          "Angels to protect them",
          "A new temple",
        ]),
        correctAnswer: 0,
        explanation: "Jesus promised to send the Holy Spirit — the Helper — who would teach them all things and remind them of Jesus' words (John 14:16-17, 26).",
      },
      {
        dayNumber: 21,
        question: "What did Jesus ask Peter three times after the resurrection?",
        optionsJson: JSON.stringify([
          "'Do you believe I am the Son of God?'",
          "'Do you love Me?'",
          "'Will you follow Me?'",
          "'Why did you deny Me?'",
        ]),
        correctAnswer: 1,
        explanation: "Jesus asked Peter 'Do you love Me?' three times, restoring Peter after his denial and commissioning him to feed His sheep (John 21:15-17).",
      },
    ],
  },
  {
    planId: "DAVID-14",
    questions: [
      {
        dayNumber: 1,
        question: "What did God tell Samuel about judging by outward appearance?",
        optionsJson: JSON.stringify([
          "'The Lord looks at the heart'",
          "'A king cannot be hidden'",
          "'The firstborn shall rule'",
          "'Great stature shows great favor'",
        ]),
        correctAnswer: 0,
        explanation: "God told Samuel 'Do not look at his appearance or at his physical stature... For the Lord does not see as man sees; for man looks at the outward appearance, but the Lord looks at the heart' (1 Samuel 16:7).",
      },
      {
        dayNumber: 2,
        question: "What did David take with him to fight Goliath?",
        optionsJson: JSON.stringify([
          "A sword and shield",
          "A sling and five smooth stones",
          "A spear and javelin",
          "A bow and arrows",
        ]),
        correctAnswer: 1,
        explanation: "David chose five smooth stones from the brook and used his sling to defeat Goliath (1 Samuel 17:40).",
      },
      {
        dayNumber: 4,
        question: "While fleeing from Saul, where did David go to inquire of the Lord?",
        optionsJson: JSON.stringify([
          "To the temple in Jerusalem",
          "To the prophet Gad",
          "To the priest Ahimelech at Nob",
          "To the high priest in Shiloh",
        ]),
        correctAnswer: 2,
        explanation: "David went to Ahimelech the priest at Nob, who gave him consecrated bread and the sword of Goliath (1 Samuel 21:1-9).",
      },
      {
        dayNumber: 7,
        question: "What tribe first crowned David as king?",
        optionsJson: JSON.stringify([
          "Benjamin",
          "Judah",
          "Ephraim",
          "Levi",
        ]),
        correctAnswer: 1,
        explanation: "The men of Judah came and anointed David king over the house of Judah first (2 Samuel 2:4).",
      },
      {
        dayNumber: 9,
        question: "What did God promise David in the Davidic Covenant?",
        optionsJson: JSON.stringify([
          "David would be the wealthiest king",
          "David's throne would be established forever",
          "David would never face another enemy",
          "David's son would build the temple immediately",
        ]),
        correctAnswer: 1,
        explanation: "God promised David 'your house and your kingdom shall be established forever before you. Your throne shall be established forever' (2 Samuel 7:16).",
      },
      {
        dayNumber: 11,
        question: "What did David do when he first saw Bathsheba?",
        optionsJson: JSON.stringify([
          "He turned away",
          "He sent messengers to get her",
          "He called for Nathan the prophet",
          "He went to the temple to pray",
        ]),
        correctAnswer: 1,
        explanation: "David saw Bathsheba from his rooftop, inquired about her, and sent messengers to bring her to him (2 Samuel 11:2-4).",
      },
      {
        dayNumber: 12,
        question: "Which psalm did David write after being confronted by Nathan about his sin with Bathsheba?",
        optionsJson: JSON.stringify([
          "Psalm 23",
          "Psalm 51",
          "Psalm 32",
          "Psalm 19",
        ]),
        correctAnswer: 1,
        explanation: "Psalm 51 is David's prayer of repentance after Nathan confronted him (2 Samuel 12, Psalm 51 superscription).",
      },
      {
        dayNumber: 14,
        question: "Who did God promise would sit on David's throne forever?",
        optionsJson: JSON.stringify([
          "Solomon",
          "A descendant who would be God's Son",
          "Absalom",
          "All of David's descendants",
        ]),
        correctAnswer: 1,
        explanation: "God promised David that his throne would be established forever, ultimately fulfilled in Jesus Christ (2 Samuel 7:12-16).",
      },
    ],
  },
  {
    planId: "ROMANS-16",
    questions: [
      {
        dayNumber: 1,
        question: "What did Paul say he was 'not ashamed of'?",
        optionsJson: JSON.stringify([
          "The cross of Christ",
          "The gospel of Christ",
          "His Jewish heritage",
          "His sufferings",
        ]),
        correctAnswer: 1,
        explanation: "Paul declares 'I am not ashamed of the gospel of Christ, for it is the power of God to salvation for everyone who believes' (Romans 1:16).",
      },
      {
        dayNumber: 3,
        question: "According to Romans 2, what does God's kindness lead us toward?",
        optionsJson: JSON.stringify([
          "Greater knowledge",
          "Repentance",
          "Prosperity",
          "Righteous works",
        ]),
        correctAnswer: 1,
        explanation: "Paul writes 'the goodness of God leads you to repentance' (Romans 2:4).",
      },
      {
        dayNumber: 5,
        question: "According to Romans 4, how was Abraham justified?",
        optionsJson: JSON.stringify([
          "By keeping the Law",
          "By being circumcised",
          "By faith",
          "By his good works",
        ]),
        correctAnswer: 2,
        explanation: "Paul uses Abraham as the prime example of justification by faith — he believed God and it was credited to him as righteousness (Romans 4:3).",
      },
      {
        dayNumber: 7,
        question: "What did Paul say abounded much more than sin?",
        optionsJson: JSON.stringify([
          "The Law",
          "Grace",
          "Prophets",
          "Works",
        ]),
        correctAnswer: 1,
        explanation: "Paul declares 'where sin abounded, grace abounded much more' (Romans 5:20).",
      },
      {
        dayNumber: 9,
        question: "How did Paul describe the internal struggle he experienced?",
        optionsJson: JSON.stringify([
          "I cannot stop sinning",
          "The good that I will to do, I do not do",
          "My flesh is too weak",
          "I have given up trying",
        ]),
        correctAnswer: 1,
        explanation: "Paul describes 'the good that I will to do, I do not do; but the evil I will not to do, that I practice' (Romans 7:19).",
      },
      {
        dayNumber: 11,
        question: "What does Romans 8:28 promise?",
        optionsJson: JSON.stringify([
          "All things work together for good for those who love God",
          "Believers will never face hardship",
          "God will give you whatever you ask",
          "The righteous will never suffer",
        ]),
        correctAnswer: 0,
        explanation: "Romans 8:28 promises that 'all things work together for good to those who love God, who are called according to His purpose.'",
      },
      {
        dayNumber: 14,
        question: "What does Paul urge believers to present as a 'living sacrifice' in Romans 12?",
        optionsJson: JSON.stringify([
          "Their money",
          "Their bodies",
          "Their time",
          "Their talents",
        ]),
        correctAnswer: 1,
        explanation: "Romans 12:1 urges believers to 'present your bodies a living sacrifice, holy, acceptable to God, which is your reasonable service.'",
      },
      {
        dayNumber: 15,
        question: "According to Romans 13, what fulfills the Law?",
        optionsJson: JSON.stringify([
          "Faithful fasting",
          "Love toward others",
          "Regular offerings",
          "Strict Sabbath observance",
        ]),
        correctAnswer: 1,
        explanation: "Paul writes 'love does no harm to a neighbor; therefore love is the fulfillment of the law' (Romans 13:10).",
      },
    ],
  },
];

async function main() {
  console.log("🌱 Seeding reading plans...\n");

  // If --force is passed, delete existing plans (cascades to assignments, questions, progress)
  if (FORCE_RESET) {
    console.log("  ⚠ --force flag detected. Removing existing reading plans...");
    await prisma.dailyAssignment.deleteMany();
    await prisma.quizQuestion.deleteMany();
    await prisma.userPlanProgress.deleteMany();
    await prisma.readingPlan.deleteMany();
    console.log("  ✅ Existing plans cleared.\n");
  }

  for (const plan of readingPlans) {
    try {
      // Check if plan already exists
      const existing = await prisma.readingPlan.findUnique({
        where: { planId: plan.planId },
      });

      if (existing) {
        console.log(`  ⚠ Plan "${plan.title}" (${plan.planId}) already exists — skipping.`);
        continue;
      }

      const { dailyAssignments, ...planData } = plan;

      // Create the reading plan
      const createdPlan = await prisma.readingPlan.create({
        data: {
          ...planData,
          createdOn: new Date(),
          updatedOn: new Date(),
          // Create daily assignments
          dailyAssignments: {
            create: dailyAssignments.map((da) => ({
              dayNumber: da.dayNumber,
              title: da.title,
              chaptersJson: da.chaptersJson,
              reflectionQuestions: da.reflectionQuestions,
              createdOn: new Date(),
              updatedOn: new Date(),
            })),
          },
        },
      });

      console.log(`  ✅ Created plan: "${createdPlan.title}" (${createdPlan.totalDays} days)`);
    } catch (error) {
      console.error(`  ❌ Failed to create plan "${plan.title}": ${error.message}`);
    }
  }

  // Seed quiz questions
  console.log("\n📝 Seeding quiz questions...\n");

  for (const quiz of quizData) {
    const planExists = await prisma.readingPlan.findUnique({
      where: { planId: quiz.planId },
    });

    if (!planExists) {
      console.log(`  ⚠ Plan "${quiz.planId}" not found — skipping quiz questions.`);
      continue;
    }

    for (const q of quiz.questions) {
      try {
        // Check if this question already exists for this plan/day
        const existingQuestion = await prisma.quizQuestion.findFirst({
          where: {
            planId: quiz.planId,
            dayNumber: q.dayNumber,
            question: q.question,
          },
        });

        if (existingQuestion) {
          console.log(`  ⚠ Quiz Q${q.dayNumber} already exists — skipping.`);
          continue;
        }

        await prisma.quizQuestion.create({
          data: {
            planId: quiz.planId,
            dayNumber: q.dayNumber,
            question: q.question,
            optionsJson: q.optionsJson,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            createdOn: new Date(),
            updatedOn: new Date(),
          },
        });
        console.log(`  ✅ Quiz Q${q.dayNumber}: ${q.question.substring(0, 60)}...`);
      } catch (error) {
        console.error(`  ❌ Failed to create quiz question: ${error.message}`);
      }
    }
  }

  // Summary
  const planCount = await prisma.readingPlan.count();
  const assignmentCount = await prisma.dailyAssignment.count();
  const quizCount = await prisma.quizQuestion.count();

  console.log("\n" + "═".repeat(50));
  console.log("📊 Seed Summary:");
  console.log(`   Reading Plans: ${planCount}`);
  console.log(`   Daily Assignments: ${assignmentCount}`);
  console.log(`   Quiz Questions: ${quizCount}`);
  console.log("═".repeat(50));
  console.log("\n✅ Reading plan seeding completed!");
}

main()
  .catch((e) => {
    console.error("\n❌ Error seeding reading plans:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
