const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const upload = require('../middleware/upload');

router.post('/upload', upload.single('billImage'), expenseController.uploadBill);
router.post('/manual', expenseController.createManualExpense);
router.get('/', expenseController.getAllExpenses);
router.get('/:id', expenseController.getExpenseById);
router.put('/:id', expenseController.updateExpense);
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;
