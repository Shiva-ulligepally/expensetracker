const Expense = require('../models/Expense');
const { extractBillData } = require('../services/aiService');
const path = require('path');
const fs = require('fs');

exports.uploadBill = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const imagePath = req.file.path;
    const mimeType = req.file.mimetype;

    const extractedData = await extractBillData(imagePath, mimeType);
    
    let expenseDate = new Date();
    if (extractedData.date) {
      const parsedDate = new Date(extractedData.date);
      if (!isNaN(parsedDate.getTime())) {
        expenseDate = parsedDate;
      }
    }

    const newExpense = new Expense({
      title: extractedData.title || 'Expense',
      vendor: extractedData.vendor || 'Unknown Vendor',
      totalAmount: extractedData.totalAmount || extractedData.amount || 0,
      category: extractedData.category || 'Other',
      billType: extractedData.billType || 'Receipt',
      paymentMethod: extractedData.paymentMethod || 'Unknown',
      tax: extractedData.tax || 0,
      date: expenseDate,
      currency: extractedData.currency || 'USD',
      location: extractedData.location || '',
      imageUrl: `/uploads/${req.file.filename}`,
      items: extractedData.items || [],
      extractedText: extractedData
    });

    const savedExpense = await newExpense.save();
    res.status(201).json(savedExpense);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during upload and processing' });
  }
};

exports.createManualExpense = async (req, res) => {
  try {
    const { vendor, category, date, items, tax, totalAmount } = req.body;
    
    const newExpense = new Expense({
      title: 'Manual Entry',
      vendor: vendor || 'Unknown Vendor',
      totalAmount: totalAmount || 0,
      category: category || 'Other',
      tax: tax || 0,
      date: date ? new Date(date) : new Date(),
      items: items || [],
      extractedText: req.body
    });

    const savedExpense = await newExpense.save();
    res.status(201).json(savedExpense);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create manual expense' });
  }
};

exports.getAllExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
};

exports.getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch expense' });
  }
};

exports.updateExpense = async (req, res) => {
  try {
    const updatedExpense = await Expense.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedExpense) return res.status(404).json({ error: 'Expense not found' });
    res.json(updatedExpense);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update expense' });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    
    if (expense.imageUrl) {
        const filename = path.basename(expense.imageUrl);
        const filePath = process.env.VERCEL ? path.join('/tmp', filename) : path.join(__dirname, '..', expense.imageUrl);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }

    await expense.deleteOne();
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
};
