const { body, validationResult } = require('express-validator')

const handleValidation = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg })
  }
  next()
}

const emailField = body('email')
  .isEmail().withMessage("Le format de l'email est invalide")
  .normalizeEmail()

const passwordComplex = body('password')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{12,}$/)
  .withMessage('Le mot de passe doit contenir au moins 12 caractères, une majuscule, un chiffre et un caractère spécial.')

const firstNameField = body('firstName')
  .trim().notEmpty().withMessage('Le prénom est requis')
  .isLength({ max: 100 }).withMessage('Le prénom ne doit pas dépasser 100 caractères')

const lastNameField = body('lastName')
  .trim().notEmpty().withMessage('Le nom est requis')
  .isLength({ max: 100 }).withMessage('Le nom ne doit pas dépasser 100 caractères')

// --- Auth ---

const loginValidator = [
  emailField,
  body('password').notEmpty().withMessage('Le mot de passe est requis'),
  handleValidation,
]

const registerAdminValidator = [
  firstNameField,
  lastNameField,
  emailField,
  passwordComplex,
  handleValidation,
]

// --- Admin ---

const createAccountValidator = [
  firstNameField,
  lastNameField,
  emailField,
  passwordComplex,
  body('role')
    .isIn(['admin', 'dentiste', 'prothesiste']).withMessage("Ce rôle n'existe pas"),
  body('siret').optional()
    .isLength({ min: 14, max: 14 }).withMessage('Le SIRET doit contenir exactement 14 caractères')
    .isNumeric().withMessage('Le SIRET doit être composé uniquement de chiffres'),
  body('dentisteId').optional()
    .isInt({ min: 1 }).withMessage('dentisteId invalide'),
  handleValidation,
]

const updateUserValidator = [
  firstNameField,
  lastNameField,
  emailField,
  handleValidation,
]

const createActeAdminValidator = [
  body('acteName')
    .trim().notEmpty().withMessage("Le nom de l'acte est requis")
    .isLength({ max: 255 }).withMessage("Le nom de l'acte ne doit pas dépasser 255 caractères"),
  body('acteDescription').optional()
    .isLength({ max: 1000 }).withMessage('La description ne doit pas dépasser 1000 caractères'),
  handleValidation,
]

// --- Actes prothésiste ---

const addActeValidator = [
  body('acteName').trim().notEmpty().withMessage("Le nom de l'acte est requis"),
  body('price')
    .notEmpty().withMessage('Le prix est requis')
    .isFloat({ min: 0 }).withMessage('Le prix doit être un nombre positif'),
  handleValidation,
]

const updateActePriceValidator = [
  body('price')
    .notEmpty().withMessage('Le prix est requis')
    .isFloat({ min: 0 }).withMessage('Le prix doit être un nombre positif'),
  handleValidation,
]

// --- Fiches de travail ---

const patientFields = [
  body('patientFirstName')
    .trim().notEmpty().withMessage('Le prénom du patient est requis')
    .isLength({ max: 100 }).withMessage('Le prénom ne doit pas dépasser 100 caractères'),
  body('patientLastName')
    .trim().notEmpty().withMessage('Le nom du patient est requis')
    .isLength({ max: 100 }).withMessage('Le nom ne doit pas dépasser 100 caractères'),
  body('patientEmail')
    .isEmail().withMessage("Le format de l'email du patient est invalide")
    .normalizeEmail(),
  body('patientNumSecu')
    .trim().notEmpty().withMessage('Le numéro de sécurité sociale est requis')
    .isLength({ min: 15, max: 15 }).withMessage('Le numéro de sécurité sociale doit contenir 15 caractères')
    .isNumeric().withMessage('Le numéro de sécurité sociale doit être composé uniquement de chiffres'),
]

const createWorksheetValidator = [
  ...patientFields,
  body('comment').optional().isLength({ max: 2000 }),
  body('actes').optional().isArray().withMessage('Les actes doivent être une liste'),
  handleValidation,
]

const updateWorksheetValidator = [
  ...patientFields,
  body('comment').optional().isLength({ max: 2000 }),
  body('actes').optional().isArray().withMessage('Les actes doivent être une liste'),
  handleValidation,
]

const updateStatusValidator = [
  body('status')
    .isIn(['En attente', 'En cours', 'Termine']).withMessage('Statut invalide'),
  handleValidation,
]

module.exports = {
  loginValidator,
  registerAdminValidator,
  createAccountValidator,
  updateUserValidator,
  createActeAdminValidator,
  addActeValidator,
  updateActePriceValidator,
  createWorksheetValidator,
  updateWorksheetValidator,
  updateStatusValidator,
}
