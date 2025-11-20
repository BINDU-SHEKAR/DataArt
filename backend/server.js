require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const { sequelize, User } = require('./models');

// Routers
const quizRouter = require('./routes/quizRouter');
const userRouter = require('./routes/userRouter');
const resultRoutes = require('./routes/resultRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const formulasRouter = require('./routes/formulas');
const questionBankRouter = require('./routes/questionBank');
const questionRoutes = require('./routes/questionRoutes');

// Initialize app
const app = express();

// ✅ CORS Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT'],
  credentials: true
}));

app.use(express.json());

// ✅ Routes
app.use('/api/users', userRouter);
app.use('/api/quiz', quizRouter);
app.use('/api/quizzes', quizRouter); // optional alias
app.use('/api/results', resultRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/formulas', formulasRouter);
app.use('/api/question-bank', questionBankRouter);
// app.use('/admin', uploadRoutes); // uncomment if needed

app.get('/', (req, res) => {
  res.send('🚀 QuizMaster API is running...');
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;

sequelize.authenticate()
  .then(() => {
    console.log('✅ MySQL connection successful');
    return sequelize.sync({ alter: true });
  })
  .then(async () => {
    console.log('✅ All models synced to MySQL with associations');

    // ✅ Seed admin user
    const existing = await User.findOne({ where: { email: 'meadmin@gmail.com' } });
    if (!existing) {
      await User.create({
        username: 'MeAdmin',
        email: 'meadmin@gmail.com',
        password: await bcrypt.hash('Admin@123', 10),
        role: 'admin'
      });
      console.log('✅ Admin seeded');
    } else {
      console.log('✅ Admin already exists');
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch(err => console.error('❌ DB error:', err));
