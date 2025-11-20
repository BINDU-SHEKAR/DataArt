module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Quiz', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    quiz_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    timeLimit: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    takenBy: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    lastUpdated: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    questions: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'created_by', // maps to DB column
    },
  }, {
    tableName: 'quizzes',
    timestamps: true, // adds createdAt and updatedAt
  });
};
