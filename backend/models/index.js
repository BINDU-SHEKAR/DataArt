const Sequelize = require('sequelize');
const sequelize = require('../config/db');

// Import model factories
const UserModel = require('./User');
const QuizModel = require('./Quiz');
const ResultModel = require('./QuizResult');
const QuizProgressModel = require('./QuizProgress');
const QuestionModel = require('./Question');
const UserResponseModel = require('./UserResponse');

// Initialize models
const User = UserModel(sequelize, Sequelize.DataTypes);
const Quiz = QuizModel(sequelize, Sequelize.DataTypes);
const Result = ResultModel(sequelize, Sequelize.DataTypes);
const QuizProgress = QuizProgressModel(sequelize, Sequelize.DataTypes);
const Question = QuestionModel(sequelize, Sequelize.DataTypes);
const UserResponse = UserResponseModel(sequelize, Sequelize.DataTypes);

// Define associations
User.hasMany(Quiz, { foreignKey: 'created_by' });
Quiz.belongsTo(User, { foreignKey: 'created_by' });

User.hasMany(Result, { foreignKey: 'user_id' });
Result.belongsTo(User, { foreignKey: 'user_id' });

Quiz.hasMany(Result, { foreignKey: 'quiz_id' });
Result.belongsTo(Quiz, { foreignKey: 'quiz_id' });

User.hasMany(QuizProgress, { foreignKey: 'user_id' });
QuizProgress.belongsTo(User, { foreignKey: 'user_id' });

Quiz.hasMany(QuizProgress, { foreignKey: 'quiz_id' });
QuizProgress.belongsTo(Quiz, { foreignKey: 'quiz_id' });

Quiz.hasMany(Question, { foreignKey: 'quiz_id' });
Question.belongsTo(Quiz, { foreignKey: 'quiz_id' });

User.hasMany(UserResponse, { foreignKey: 'user_id' });
Quiz.hasMany(UserResponse, { foreignKey: 'quiz_id' });
UserResponse.belongsTo(User, { foreignKey: 'user_id' });
UserResponse.belongsTo(Quiz, { foreignKey: 'quiz_id' });

module.exports = {
  sequelize,
  Sequelize,
  User,
  Quiz,
  Result,
  QuizProgress,
  Question,
  UserResponse
};
