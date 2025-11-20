module.exports = (sequelize, DataTypes) => {
  const UserResponse = sequelize.define('UserResponse', {
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    quiz_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    question_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    selected_option: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    tableName: 'userresponses',
    timestamps: false
  });

  return UserResponse;
};
