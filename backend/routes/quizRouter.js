const express = require('express');
const router = express.Router();
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const Sequelize = require('sequelize');
const { v4: uuidv4 } = require('uuid');

const { Quiz } = require('../models');
const QuizResult = require('../models/QuizResult');
const QuizProgress = require('../models/QuizProgress');
const { Question, SubjectQuizResult } = require('../models');
const authMiddleware = require('../middleware/auth');

// ---------------------- UTIL ----------------------

const safeParseJSON = (value, fallback = []) => {
  if (Array.isArray(value)) return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

// ---------------------- QUIZ ROUTES ----------------------

// Get all quizzes
router.get('/', async (req, res) => {
  try {
    const quizzes = await Quiz.findAll();
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch quizzes', details: err.message });
  }
});

// Get quiz by ID
router.get('/:quiz_id', authMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ where: { quiz_id: req.params.quiz_id } });
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    const questions = safeParseJSON(quiz.questions, []);
    res.json({ quiz_id: quiz.quiz_id, questions });
  } catch (err) {
    console.error('Failed to fetch quiz:', err);
    res.status(500).json({ error: 'Failed to fetch quiz', details: err.message });
  }
});

// Create a new quiz manually
router.post('/', authMiddleware, async (req, res) => {
  const { title, description, questions, timeLimit, category } = req.body;
  const createdBy = req.user.id;

  if (!title || !Array.isArray(questions) || questions.length === 0 || !timeLimit) {
    return res.status(400).json({ message: 'Missing required fields: title, questions[], timeLimit' });
  }

  try {
    const newQuiz = await Quiz.create({
      quiz_id: uuidv4(),
      title,
      description: description || '',
      questions: JSON.stringify(questions),
      timeLimit,
      category: category || null,
      createdBy,
      takenBy: [],
      lastUpdated: new Date(),
    });

    res.status(201).json({ message: 'Quiz created successfully', quiz_id: newQuiz.quiz_id });
  } catch (err) {
    console.error('Quiz creation error:', err);
    res.status(500).json({ error: 'Failed to create quiz', details: err.message });
  }
});

// Generate subject-based quiz (auto quiz creation)
router.post('/generate', authMiddleware, async (req, res) => {
  const { subject } = req.body;
  const createdBy = req.user.id;

  if (!subject) {
    return res.status(400).json({ msg: 'Subject is required' });
  }

  try {
    const questions = await Question.findAll({
      where: { subject },
      order: Sequelize.literal('RAND()'),
      limit: 60 // ✅ LIMIT APPLIED HERE
    });

    if (!questions || questions.length === 0) {
      return res.status(404).json({ msg: 'No questions found for this subject' });
    }

    const rawQuestions = questions.map(q => ({
      question_id: q.id,
      questionText: q.questionText,
      options: q.options,
      correctAnswer: q.correctAnswer,
    }));

    const quiz = await Quiz.create({
      quiz_id: uuidv4(),
      title: `${subject} Quiz`,
      description: `Auto-generated quiz for ${subject}`,
      questions: JSON.stringify(rawQuestions),
      timeLimit: 30,
      createdBy,
      takenBy: [],
      lastUpdated: new Date(),
    });

    res.status(201).json({ quiz_id: quiz.quiz_id });
  } catch (err) {
    console.error('Quiz creation failed:', err);
    res.status(500).json({ msg: 'Quiz creation failed', error: err.message });
  }
});

// Submit quiz result (from SubjectQuiz.js)
router.post('/submit', authMiddleware, async (req, res) => {
  try {
    const { quiz_id, answers, score } = req.body;
    const user_id = req.user.id;

    if (!quiz_id || !Array.isArray(answers)) {
      return res.status(400).json({ message: 'Invalid submission data: quiz_id and answers[] required' });
    }

    const quiz = await Quiz.findOne({ where: { quiz_id } });
    if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

    const existingResult = await QuizResult.findOne({ where: { user_id, quiz_id } });
    if (existingResult) {
      return res.status(400).json({ message: 'Quiz already submitted' });
    }

    // Persist result
    const result = await QuizResult.create({
      user_id,
      quiz_id,
      score: typeof score === 'number' ? score : null,
      answers: JSON.stringify(answers),
    });

    // Update takenBy safely
    const takenBy = Array.isArray(quiz.takenBy) ? quiz.takenBy : safeParseJSON(quiz.takenBy, []);
    if (!takenBy.includes(user_id)) {
      takenBy.push(user_id);
      await quiz.update({ takenBy });
    }

    // Clear progress for this user & quiz
    await QuizProgress.destroy({ where: { quiz_id, user_id } });

    res.status(201).json({ message: 'Quiz submitted successfully', result });
  } catch (err) {
    console.error('Quiz submission error:', err);
    res.status(500).json({ error: 'Submission failed', details: err.message });
  }
});

// ---------------------- SUBJECT QUIZ (direct question feed) ----------------------

// Generate quiz questions by subject (GET: returns 30 random questions without creating a Quiz row)
router.get('/generate-quiz/:subject', async (req, res) => {
  const { subject } = req.params;
  try {
    const questions = await Question.findAll({
      where: { subject },
      order: Sequelize.literal('RAND()'),
      limit: 30,
    });
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate quiz.' });
  }
});

// Submit subject quiz result (for direct subject quizzes)
router.post('/submit-subject-quiz', async (req, res) => {
  const { userId, subject, responses } = req.body;

  if (!userId || !subject || !Array.isArray(responses)) {
    return res.status(400).json({ error: 'userId, subject, and responses[] are required' });
  }

  try {
    let score = 0;
    for (const r of responses) {
      if (r.selected === r.correct) score++;
    }

    await SubjectQuizResult.create({
      userId,
      subject,
      responses: JSON.stringify(responses),
      score,
    });

    res.json({ message: 'Responses saved', score });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save responses', details: err.message });
  }
});

// ---------------------- CSV UPLOAD ----------------------

const upload = multer({ dest: 'uploads/' });

router.post('/upload-csv', authMiddleware, upload.single('file'), async (req, res) => {
  if (!req.file?.path) {
    return res.status(400).json({ error: 'CSV file required' });
  }

  const filePath = req.file.path;
  const questions = [];

  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (row) => {
      try {
        questions.push({
          subject: row.subject,
          topic: row.topic,
          questionText: row.questionText,
          options: safeParseJSON(row.options, []),
          correctAnswer: row.correctAnswer,
        });
      } catch (err) {
        console.error('Error parsing row:', row, err.message);
      }
    })
    .on('end', async () => {
      try {
        await Question.bulkCreate(questions, { validate: true });
        fs.unlinkSync(filePath);
        res.json({ message: `Uploaded ${questions.length} questions.` });
      } catch (err) {
        res.status(500).json({ error: 'Upload failed', details: err.message });
      }
    })
    .on('error', (err) => {
      console.error('CSV read error:', err);
      res.status(500).json({ error: 'Failed to read CSV file', details: err.message });
    });
});

// ---------------------- QUIZ DETAILS ----------------------

const quizController = require('../controllers/quizController');
router.get('/details/:quiz_id', authMiddleware, quizController.getQuizDetailsWithAnswers);

module.exports = router;
