const Expense = require('../models/Expense');
const { extractBillData } = require('../services/aiService');

exports.uploadBill = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const imageBuffer = req.file.buffer;
    const mimeType = req.file.mimetype;

    const extractedData = await extractBillData(imageBuffer, mimeType);

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
      imageUrl: `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
      items: extractedData.items || [],
      extractedText: extractedData
    });

    const savedExpense = await newExpense.save();
    res.status(201).json(savedExpense);
  } catch (error) {
    console.error("Upload Error:", error.message);
    if (error.message.includes('Quota Exceeded')) {
      return res.status(429).json({ error: error.message });
    }
    if (error.message.includes('Permission Denied')) {
      return res.status(403).json({ error: error.message });
    }
    res.status(500).json({ error: error.message || 'Server error during upload and processing' });
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
    console.error("Manual Expense Error:", error);
    res.status(500).json({ error: 'Failed to create manual expense', details: error.message });
  }
};

exports.getAllExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find().sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    console.error("Get All Expenses Error:", error);
    res.status(500).json({ error: 'Failed to fetch expenses', details: error.message });
  }
};

exports.getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ error: 'Expense not found' });
    res.json(expense);
  } catch (error) {
    console.error("Get Expense By Id Error:", error);
    res.status(500).json({ error: 'Failed to fetch expense', details: error.message });
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
    console.error("Update Expense Error:", error);
    res.status(500).json({ error: 'Failed to update expense', details: error.message });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return res.status(404).json({ error: 'Expense not found' });

    await expense.deleteOne();
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error("Delete Expense Error:", error);
    res.status(500).json({ error: 'Failed to delete expense', details: error.message });
  }
};
