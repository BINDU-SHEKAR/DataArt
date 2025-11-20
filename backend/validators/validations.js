const z = require('zod');

// ✅ Registration Schema (with role)
const registrationSchema = z.object({
  username: z
    .string({
      required_error: 'Username is required',
    })
    .min(3, 'Username should be of minimum 3 characters')
    .max(255, 'Username should be of maximum 255 characters'),
  email: z
    .string({
      required_error: 'Email is required',
    })
    .email('Invalid email address'),
  password: z
    .string({
      required_error: 'Password is required',
    })
    .min(
      6,
      'Password must contain at least 6 characters, including uppercase, lowercase characters and numbers'
    )
    .max(255, 'Password should be of maximum 255 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[\w\W]{6,}$/,
      'Password must contain at least 6 characters, including uppercase, lowercase characters and numbers'
    ),
  role: z.enum(['student', 'admin'], {
    required_error: 'Role is required',
    invalid_type_error: 'Role must be either student or admin',
  }),
});

// ✅ Login Schema
const loginSchema = z.object({
  email: z
    .string({
      required_error: 'Email is required',
    })
    .email('Invalid email address'),
  password: z.string({
    required_error: 'Password is required',
  }),
});


// ✅ Update Username Schema
const updateUsernameSchema = z.object({
  username: z
    .string({
      required_error: 'Username is required',
    })
    .min(3, 'Username should be of minimum 3 characters')
    .max(255, 'Username should be of maximum 255 characters'),
});

// ✅ Update Password Schema
const updatePasswordSchema = z.object({
  oldPassword: z.string({
    required_error: 'Old password is required',
  }),
  password: z
    .string({
      required_error: 'Password is required',
    })
    .min(
      6,
      'Password must contain at least 6 characters, including uppercase, lowercase characters and numbers'
    )
    .max(255, 'Password should be of maximum 255 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[\w\W]{6,}$/,
      'Password must contain at least 6 characters, including uppercase, lowercase characters and numbers'
    ),
});

// ✅ Request Password Reset Schema
const requestPasswordResetSchema = z.object({
  email: z
    .string({
      required_error: 'Email is required',
    })
    .email('Invalid email address'),
});

// ✅ Question Schema
const questionSchema = z.object({
  question: z.string({
    required_error: 'Question is required',
  }),
  options: z
    .array(
      z.string({
        required_error: 'Option is required',
      })
    )
    .min(2, 'At least two options are required'),
  correctAnswer: z
    .string({
      required_error: 'Correct answer is required',
    })
    .min(1, 'Correct answer is required'),
});

// ✅ Quiz Schema
const quizSchema = z.object({
  title: z
    .string({
      required_error: 'Title is required',
    })
    .min(3, 'Title should be of minimum 3 characters')
    .max(255, 'Title should be of maximum 255 characters'),
  questions: z
    .array(questionSchema)
    .nonempty('At least one question is required'),
  timeLimit: z.number({
    required_error: 'Time limit is required',
  }),
});

// ✅ Question Update Schema
const questionUpdateSchema = z.object({
  question: z.string().optional(),
  options: z
    .array(z.string().optional())
    .min(2, 'At least two options are required')
    .optional(),
  correctAnswer: z.string().optional(),
});

// ✅ Quiz Update Schema
const quizUpdateSchema = z.object({
  title: z.string().optional(),
  questions: z.array(questionUpdateSchema).optional(),
  timeLimit: z.number().optional(),
});

// ✅ Export all schemas
module.exports = {
  registrationSchema,
  loginSchema,
  updateUsernameSchema,
  updatePasswordSchema,
  requestPasswordResetSchema,
  quizSchema,
  quizUpdateSchema,
};
