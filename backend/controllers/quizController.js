const { Quiz, User, QuizResult, QuizProgress } = require('../models');

// ---------------------- QUIZ PROGRESS ----------------------

exports.checkQuizTaken = async (req, res) => {
  const { answers, elapsedTime } = req.body;

  try {
    const quiz = await Quiz.findOne({ where: { quiz_id: req.params.quiz_id } });
    if (!quiz) return res.status(404).json({ msg: 'Quiz not found' });

    const parsedQuestions = Array.isArray(quiz.questions)
      ? quiz.questions
      : JSON.parse(quiz.questions);

    let quizProgress = await QuizProgress.findOne({
      where: { quiz_id: req.params.quiz_id, user_id: req.user.id },
    });

    if (!quizProgress) {
      quizProgress = await QuizProgress.create({
        quiz_id: req.params.quiz_id,
        user_id: req.user.id,
        answers,
        elapsedTime,
      });
    } else {
      quizProgress.answers = answers;
      quizProgress.elapsedTime = elapsedTime;
    }

    if (elapsedTime >= quiz.timeLimit * 60) {
      quizProgress.completed = true;

      let score = 0;
      const answersWithCorrectness = quizProgress.answers.map((answer) => {
        const question = parsedQuestions.find((q) => q.question_id === answer.question_id);
        const isCorrect = question?.correctAnswer === answer.selectedOption;
        if (isCorrect) score++;
        return { ...answer, isCorrect };
      });

      const quizResultExists = await QuizResult.findOne({
        where: { quiz_id: req.params.quiz_id, user_id: req.user.id },
      });

      if (quizResultExists) {
        return res.status(400).json({ msg: 'Quiz already taken' });
      }

      const takenBy = Array.isArray(quiz.takenBy) ? quiz.takenBy : [];
      if (!takenBy.includes(req.user.id)) {
        takenBy.push(req.user.id);
        await quiz.update({ takenBy });
      }

      await QuizResult.create({
        quiz_id: req.params.quiz_id,
        user_id: req.user.id,
        score,
        answers: answersWithCorrectness,
      });
    }

    await quizProgress.save();
    res.json({ msg: 'Quiz progress saved' });
  } catch (err) {
    console.error('❌ Error in checkQuizTaken:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ---------------------- QUIZ DETAILS WITH ANSWERS ----------------------

exports.getQuizDetailsWithAnswers = async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ where: { quiz_id: req.params.quiz_id } });
    if (!quiz) return res.status(404).json({ msg: 'Quiz not found' });

    const questions = Array.isArray(quiz.questions)
      ? quiz.questions
      : JSON.parse(quiz.questions);

    const result = await QuizResult.findOne({
      where: { quiz_id: req.params.quiz_id, user_id: req.user.id }
    });

    let selectedAnswers = [];

    try {
      selectedAnswers = result?.answers
        ? Array.isArray(result.answers)
          ? result.answers
          : JSON.parse(result.answers)
        : [];
    } catch (err) {
      console.error('❌ Failed to parse selectedAnswers:', err);
      selectedAnswers = [];
    }

    const questionsWithSelected = questions.map(q => {
      const selected = selectedAnswers.find(a => a.question_id === q.question_id);
      return {
        ...q,
        selectedOption: selected?.selectedOption || null
      };
    });

    res.json({
      quiz_id: quiz.quiz_id,
      title: quiz.title,
      questions: questionsWithSelected
    });
  } catch (err) {
    console.error('❌ Failed to fetch quiz details with answers:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ---------------------- QUIZ PROGRESS ----------------------

exports.getQuizProgress = async (req, res) => {
  try {
    const quizProgress = await QuizProgress.findOne({
      where: { quiz_id: req.params.quiz_id, user_id: req.user.id },
    });

    if (!quizProgress) {
      return res.status(404).json({ msg: 'Progress not found' });
    }

    res.json(quizProgress);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ---------------------- RESULTS ----------------------

exports.getAllUserResult = async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ where: { quiz_id: req.params.quiz_id } });
    if (!quiz) return res.status(404).json({ msg: 'Quiz not found' });

    if (quiz.createdBy !== req.user.id && !quiz.takenBy.includes(req.user.id)) {
      return res.status(403).json({ msg: 'Unauthorized access' });
    }

    const results = await QuizResult.findAll({
      where: { quiz_id: req.params.quiz_id },
      include: [{ model: User, attributes: ['username'] }],
    });

    const formatted = results.map((r) => ({
      username: r.User?.username || 'Unknown',
      score: r.score,
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ---------------------- QUIZ STATUS ----------------------

exports.getQuizStatsById = async (req, res) => {
  try {
    const quiz = await Quiz.findOne({ where: { quiz_id: req.params.quiz_id } });
    if (!quiz) return res.status(404).json({ msg: 'Quiz not found' });

    let status = 'Not taken';
    const quizProgress = await QuizProgress.findOne({
      where: { quiz_id: req.params.quiz_id, user_id: req.user.id },
    });

    if (quizProgress?.completed) {
      status = 'Pending for Evaluation';
    } else if (quizProgress) {
      status = 'In progress';
    }

    if (quiz.takenBy.includes(req.user.id)) {
      status = 'Taken';
    }

    res.json({ status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ---------------------- QUIZ MANAGEMENT ----------------------

exports.deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findOne({
      where: { quiz_id: req.params.quiz_id, createdBy: req.user.id },
    });

    if (!quiz) return res.status(404).json({ msg: 'Quiz not found' });

    await QuizResult.destroy({ where: { quiz_id: req.params.quiz_id } });
    await QuizProgress.destroy({ where: { quiz_id: req.params.quiz_id } });
    await quiz.destroy();

    res.json({ msg: 'Quiz deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ---------------------- SINGLE QUIZ ----------------------

exports.getSingleQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findOne({
      where: { quiz_id: req.params.quiz_id },
      include: [{ model: User, attributes: ['username'] }],
    });

    if (!quiz) return res.status(404).json({ msg: 'Quiz not found' });

    const numberOfParticipants = quiz.takenBy?.length || 0;

    res.json({
      quiz_id: quiz.quiz_id,
      title: quiz.title,
      description: quiz.description,
      createdBy: quiz.User.username,
      questions: quiz.questions,
      timeLimit: quiz.timeLimit,
      lastUpdated: quiz.lastUpdated,
      numberOfParticipants,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// ---------------------- FINAL SUBMISSION ----------------------

exports.markQuizAsTaken = async (req, res) => {
  try {
    const { answers } = req.body;
    const quiz_id = req.params.quiz_id;

    const quiz = await Quiz.findOne({ where: { quiz_id } });
    if (!quiz) return res.status(404).json({ msg: 'Quiz not found' });

    const parsedQuestions = Array.isArray(quiz.questions)
      ? quiz.questions
      : JSON.parse(quiz.questions);

    const existingResult = await QuizResult.findOne({
      where: { quiz_id, user_id: req.user.id },
    });
    if (existingResult) {
      return res.status(400).json({ msg: 'Quiz already submitted' });
    }
    

   let score = 0;
const answersWithCorrectness = answers.map((answer) => {
  const question = parsedQuestions.find((q) => q.question_id === answer.question_id);
  const isCorrect = question?.correctAnswer === answer.selectedOption;
  if (isCorrect) score++;
  return { ...answer, isCorrect };
});

// Store result
await QuizResult.create({
  quiz_id,
  user_id: req.user.id,
  score,
  answers: JSON.stringify(answersWithCorrectness), // ensure stored as JSON string
});

// Safely update takenBy list
let takenBy = Array.isArray(quiz.takenBy) ? quiz.takenBy : [];
if (!takenBy.includes(req.user.id)) {
  takenBy.push(req.user.id);
  await quiz.update({ takenBy });
}

// Clear progress
await QuizProgress.destroy({ where: { quiz_id, user_id: req.user.id } });

res.json({ msg: 'Quiz submitted successfully', score });
} catch (err) {
  console.error('❌ Error submitting quiz:', err);
  res.status(500).json({ msg: 'Server error' });
}
};

exports.createQuiz = async (req, res) => {
try {
  const { title, description, questions, timeLimit } = req.body;

  // Basic validation
  if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
    return res.status(400).json({ msg: 'Title and questions are required' });
  }

  // Create quiz
  const newQuiz = await Quiz.create({
    quiz_id: `quiz_${Date.now()}`, // unique ID
    title,
    description,
    questions: JSON.stringify(questions), // ensure stored as JSON string
    timeLimit,
    createdBy: req.user.id,
    takenBy: [], // initialize empty array
    lastUpdated: new Date(),
  });

  res.status(201).json({ msg: 'Quiz created successfully', quiz: newQuiz });
} catch (err) {
  console.error('❌ Error creating quiz:', err);
  res.status(500).json({ msg: 'Server error' });
}
};

exports.getQuizDetailsWithAnswers = async (req, res) => {
try {
  const quiz = await Quiz.findOne({ where: { quiz_id: req.params.quiz_id } });
  if (!quiz) return res.status(404).json({ msg: 'Quiz not found' });

  // Parse questions safely
  let questions = [];
  try {
    questions = Array.isArray(quiz.questions)
      ? quiz.questions
      : JSON.parse(quiz.questions);
  } catch (err) {
    console.error('❌ Failed to parse quiz.questions:', err);
    return res.status(500).json({ msg: 'Invalid quiz format' });
  }

  const result = await QuizResult.findOne({
    where: { quiz_id: req.params.quiz_id, user_id: req.user.id }
  });

  let selectedAnswers = [];
  try {
    selectedAnswers = result?.answers
      ? Array.isArray(result.answers)
        ? result.answers
        : JSON.parse(result.answers)
      : [];
  } catch (err) {
    console.error('❌ Failed to parse selectedAnswers:', err);
    selectedAnswers = [];
  }

  const questionsWithSelected = questions.map(q => {
    const selected = selectedAnswers.find(a => a.question_id === q.question_id);
    return {
      ...q,
      selectedOption: selected?.selectedOption || null
    };
  });

  res.json({
    quiz_id: quiz.quiz_id,
    title: quiz.title,
    questions: questionsWithSelected
  });
} catch (err) {
  console.error('❌ Failed to fetch quiz details with answers:', err);
  res.status(500).json({ msg: 'Server error' });
}
};
