const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  title: { type: String, default: 'Manual Entry' }, 
  vendor: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  category: { type: String, required: true },
  billType: { type: String },
  paymentMethod: { type: String },
  tax: { type: Number, default: 0 },
  date: { type: Date, required: true },
  currency: { type: String, default: 'USD' },
  location: { type: String },
  imageUrl: { type: String },
  items: [{
    name: String,
    quantity: Number,
    price: Number,
    amount: Number
  }],
  extractedText: { type: Object },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Expense', expenseSchema);
