const express = require('express');
const cors = require('cors');
const path = require('path');
const formulaRouter = require('./routes/formulaRouter');

require('dotenv').config();


const app = express();

// ✅ Add this CORS middleware early
app.use(cors({
  origin: 'http://localhost:3000', // or your frontend URL
  methods: ['GET', 'POST'],
  credentials: true
}));

// Other middleware
app.use(express.json());
app.use('/api/questions', require('./routes/questionRoutes'));

// Start server

const sequelize = require('./config/db');
const { Sequelize, DataTypes } = require('sequelize');
const defineQuizProgress = require('./models/QuizProgress');
const QuizProgress = defineQuizProgress(sequelize, DataTypes);

const Quiz = require('./models');
const QuizResult = require('./models/QuizResult');
const Question = require('./models/Question');

const userRouter = require('./routes/userRouter');
const quizRouter = require('./routes/quizRouter');
const uploadRoutes = require('./routes/uploadRoutes'); // ✅ NEW
const questionBankRouter = require('./routes/questionBankRouter'); // optional
const formulasRouter = require('./routes/formulas'); // optional

app.use(express.json());
app.use(cors());

// ✅ Mount API routes
app.use('/api/users', userRouter);
app.use('/api/quizzes', quizRouter);
app.use('/api/questions', uploadRoutes); // ✅ Mount upload route correctly
app.use('/api/question-bank', questionBankRouter); // optional
app.use('/api/formulas', formulasRouter); // optional

app.get('/', (req, res) => res.send('Hello World!'));

// ✅ Auto-submit logic
async function autoSubmitQuizzes() {
  try {
    const quizProgressList = await QuizProgress.findAll({ where: { completed: false } });

    for (const quizProgress of quizProgressList) {
      const quiz = await Quiz.findByPk(quizProgress.quiz_id);
      if (!quiz) continue;

      const elapsedTime = (Date.now() - new Date(quizProgress.last_updated).getTime()) / 1000;
      const totalElapsedTime = quizProgress.elapsed_time + elapsedTime;

      if (totalElapsedTime >= quiz.time_limit * 60) {
        quizProgress.elapsed_time = totalElapsedTime;
        quizProgress.completed = true;

        const questions = JSON.parse(quiz.questions);
        const answers = JSON.parse(quizProgress.answers);

        let score = 0;
        const answersWithCorrectness = answers.map(answer => {
          const question = questions.find(q => q.question_id === answer.question_id);
          const isCorrect = question && question.correctAnswer === answer.selectedOption;
          if (isCorrect) score += 1;
          return { ...answer, isCorrect };
        });

        const existingResult = await QuizResult.findOne({
          where: { quiz_id: quizProgress.quiz_id, user_id: quizProgress.user_id }
        });

        if (existingResult) {
          console.log(`Quiz ${quizProgress.quiz_id} already taken by user ${quizProgress.user_id}`);
          continue;
        }

        await QuizResult.create({
          quiz_id: quizProgress.quiz_id,
          user_id: quizProgress.user_id,
          score,
          answers: JSON.stringify(answersWithCorrectness)
        });

        const takenBy = Array.isArray(quiz.taken_by) ? quiz.taken_by : [];
        if (!takenBy.includes(quizProgress.user_id)) {
          takenBy.push(quizProgress.user_id);
          await quiz.update({ taken_by: takenBy });
        }
      } else {
        quizProgress.elapsed_time = totalElapsedTime;
      }

      quizProgress.last_updated = new Date();
      await quizProgress.save();
    }
  } catch (err) {
    console.error('Error in autoSubmitQuizzes:', err);
  }
  console.log('autoSubmitQuizzes ran');
}

// ✅ Run every minute
setInterval(autoSubmitQuizzes, 60 * 1000);

// ✅ Sync models and start server
sequelize.sync().then(() => {
  console.log('MySQL connected and models synced');

  const PORT = process.env.PORT || 5000;

  // ✅ Serve frontend
  app.use(express.static(path.join(__dirname, '../quiz-maker/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../quiz-maker/build', 'index.html'));
  });

  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
