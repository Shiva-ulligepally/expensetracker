import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { expenseService, BASE_URL } from '../services/api';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Wallet, TrendingUp, Calendar, Upload, Trash2, Edit, ChevronDown, ChevronUp, Image as ImageIcon, Search, CheckCircle, Loader2, Plus, X } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

const Dashboard = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('data:')) return url;
    
    // Convert any old localhost/127.0.0.1 image URLs to relative paths to prevent Mixed Content errors
    if (url.includes('localhost:5000') || url.includes('127.0.0.1:5000')) {
      const parts = url.split('/uploads/');
      if (parts[1]) {
        return `${BASE_URL}/uploads/${parts[1]}`;
      }
    }
    
    if (url.startsWith('http')) return url;
    return `${BASE_URL}${url}`;
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const data = await expenseService.getAllExpenses();
      setExpenses(data);
    } catch (error) {
      console.error('Failed to fetch expenses', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await expenseService.deleteExpense(id);
        fetchExpenses();
        if (selectedExpense && selectedExpense._id === id) {
          setSelectedExpense(null);
          setEditMode(false);
        }
      } catch (error) {
        console.error('Error deleting', error);
      }
    }
  };

  const toggleExpand = (id, e) => {
    e.stopPropagation();
    setExpandedId(expandedId === id ? null : id);
  };

  const handleEditClick = (expense) => {
    let dateStr = '';
    if (expense.date) {
      const d = new Date(expense.date);
      if (!isNaN(d.getTime())) {
        dateStr = d.toISOString().substring(0, 10);
      }
    }

    setEditData({
      vendor: expense.vendor || '',
      category: expense.category || '',
      date: dateStr,
      tax: expense.tax || 0,
      items: expense.items || []
    });
    setEditMode(true);
  };

  const calculateEditTotal = () => {
    const itemsTotal = editData.items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
    return itemsTotal + parseFloat(editData.tax || 0);
  };

  const handleEditItemChange = (index, field, value) => {
    const newItems = [...editData.items];
    newItems[index][field] = value;
    if (field === 'quantity' || field === 'price') {
      newItems[index].amount = newItems[index].quantity * newItems[index].price;
    }
    setEditData({ ...editData, items: newItems });
  };

  const addEditItem = () => {
    setEditData({ ...editData, items: [...editData.items, { name: '', quantity: 1, price: 0, amount: 0 }] });
  };

  const removeEditItem = (index) => {
    setEditData({ ...editData, items: editData.items.filter((_, i) => i !== index) });
  };

  const saveEdit = async () => {
    setEditLoading(true);
    try {
      const updated = {
        ...editData,
        totalAmount: calculateEditTotal()
      };
      await expenseService.updateExpense(selectedExpense._id, updated);
      await fetchExpenses();

      // Update local modal data
      setSelectedExpense({ ...selectedExpense, ...updated });
      setEditMode(false);
    } catch (error) {
      console.error('Failed to update expense', error);
    } finally {
      setEditLoading(false);
    }
  };

  const totalAmount = expenses.reduce((acc, curr) => acc + (curr.totalAmount || curr.amount || 0), 0);

  const categories = {};
  expenses.forEach(e => {
    categories[e.category] = (categories[e.category] || 0) + (e.totalAmount || e.amount || 0);
  });

  const pieData = {
    labels: Object.keys(categories),
    datasets: [{
      data: Object.values(categories),
      backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(139, 92, 246, 0.8)', 'rgba(236, 72, 153, 0.8)', 'rgba(16, 185, 129, 0.8)', 'rgba(245, 158, 11, 0.8)'],
      borderColor: 'rgba(30, 41, 59, 1)',
      borderWidth: 2,
    }]
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12 relative">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 flex items-center gap-4 hover:border-primary-500/50 transition-colors">
          <div className="p-4 bg-primary-500/20 rounded-2xl text-primary-400"><Wallet size={32} /></div>
          <div><p className="text-gray-400 text-sm font-medium">Total Expenses</p><h2 className="text-3xl font-bold">${totalAmount.toFixed(2)}</h2></div>
        </div>
        <div className="glass-panel p-6 flex items-center gap-4 hover:border-accent-500/50 transition-colors">
          <div className="p-4 bg-accent-500/20 rounded-2xl text-accent-400"><TrendingUp size={32} /></div>
          <div><p className="text-gray-400 text-sm font-medium">Monthly Trend</p><h2 className="text-3xl font-bold text-emerald-400">+12.5%</h2></div>
        </div>
        <div className="glass-panel p-6 flex items-center gap-4 hover:border-pink-500/50 transition-colors">
          <div className="p-4 bg-pink-500/20 rounded-2xl text-pink-400"><Calendar size={32} /></div>
          <div><p className="text-gray-400 text-sm font-medium">Total Bills</p><h2 className="text-3xl font-bold">{expenses.length}</h2></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 glass-panel p-6">
          <h3 className="text-xl font-bold mb-6">Category Distribution</h3>
          {expenses.length > 0 ? (
            <div className="h-64 flex justify-center"><Pie data={pieData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: 'white' } } } }} /></div>
          ) : (
            <div className="h-64 flex justify-center items-center text-gray-500">No data available</div>
          )}
        </div>

        <div className="lg:col-span-2 glass-panel p-6 flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h3 className="text-xl font-bold">Recent Uploads</h3>
            <div className="flex gap-2 w-full sm:w-auto">
              <Link to="/upload" className="btn-primary text-sm flex items-center gap-2 whitespace-nowrap px-3 py-1.5"><Upload size={16} /> New Bill</Link>
            </div>
          </div>

          <div className="flex-grow space-y-4">
            {expenses.length === 0 ? (
              <div className="text-center text-gray-500 py-12"><p>No expenses found. Upload or add a bill to get started!</p></div>
            ) : (
              expenses.map((expense) => (
                <div key={expense._id} className="bg-dark-800/80 rounded-xl overflow-hidden border border-dark-700/50 hover:border-primary-500/50 transition-all">
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer" onClick={() => setSelectedExpense(expense)}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-dark-700 rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center text-gray-400">
                        {expense.imageUrl ? <img src={getImageUrl(expense.imageUrl)} alt="bill" className="w-full h-full object-cover" /> : <ImageIcon size={20} />}
                      </div>
                      <div>
                        <h4 className="font-semibold text-lg hover:text-primary-400 transition-colors">{expense.vendor}</h4>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400 mt-1">
                          <span className="bg-primary-500/20 text-primary-400 px-2 py-0.5 rounded">{expense.category}</span>
                          <span>{new Date(expense.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-6 sm:w-auto w-full">
                      <div className="text-right">
                        <p className="font-bold text-xl">${(expense.totalAmount || expense.amount || 0).toFixed(2)}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={(e) => toggleExpand(expense._id, e)} className="p-2 text-gray-400 hover:text-white bg-dark-700 rounded-lg transition-colors">
                          {expandedId === expense._id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setSelectedExpense(expense); handleEditClick(expense); }} className="p-2 text-gray-400 hover:text-primary-400 bg-dark-700 rounded-lg transition-colors">
                          <Edit size={18} />
                        </button>
                        <button onClick={(e) => handleDelete(expense._id, e)} className="p-2 text-gray-400 hover:text-red-400 bg-dark-700 rounded-lg transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>

                  {expandedId === expense._id && (
                    <div className="bg-dark-900/50 p-4 border-t border-dark-700/50 animate-fade-in">
                      <h5 className="text-sm font-semibold text-gray-400 mb-3 uppercase tracking-wider">Items Breakdown</h5>
                      {expense.items && expense.items.length > 0 ? (
                        <div className="space-y-2">
                          {expense.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm bg-dark-800 p-2 rounded-lg">
                              <span className="text-gray-200">{item.name} <span className="text-gray-500 ml-2">x{item.quantity || 1}</span></span>
                              <span className="font-medium">${(item.amount || (item.price * (item.quantity || 1))).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">No specific items extracted.</p>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Detailed Expense Modal */}
      {selectedExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col relative">
            <button onClick={() => { setSelectedExpense(null); setEditMode(false); }} className="absolute top-4 right-4 text-gray-400 hover:text-white bg-dark-800 p-2 rounded-full z-10"><X size={24} /></button>

            <div className="p-6 border-b border-dark-700 flex justify-between items-center pr-16">
              <div>
                <h2 className="text-2xl font-bold">{editMode ? 'Edit Expense' : selectedExpense.vendor}</h2>
                {!editMode && <p className="text-primary-400">{selectedExpense.category} • {new Date(selectedExpense.date).toLocaleDateString()}</p>}
              </div>
            </div>

            <div className="flex-grow overflow-y-auto p-6 flex flex-col md:flex-row gap-8">
              {!editMode && (
                <div className="w-full md:w-5/12 space-y-6">
                  <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
                    <h3 className="font-semibold mb-4 text-gray-400 uppercase tracking-wider text-sm">Receipt Image</h3>
                    {selectedExpense.imageUrl ? (
                      <img src={getImageUrl(selectedExpense.imageUrl)} alt="receipt" className="w-full rounded-lg" />
                    ) : (
                      <div className="h-64 flex items-center justify-center text-gray-500 bg-dark-900 rounded-lg">No Image Provided</div>
                    )}
                  </div>
                </div>
              )}

              <div className={`w-full ${editMode ? '' : 'md:w-7/12'} space-y-6`}>
                {!editMode ? (
                  <div className="bg-dark-800 rounded-xl p-6 border border-dark-700 shadow-xl relative overflow-hidden h-full flex flex-col">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 to-accent-500"></div>
                    <h3 className="font-bold text-lg mb-6 text-center border-b border-dark-700 pb-4">Invoice Details</h3>

                    <div className="flex-grow overflow-y-auto pr-2">
                      {selectedExpense.items && selectedExpense.items.length > 0 ? (
                        <div className="space-y-3 mb-6">
                          {selectedExpense.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm border-b border-dark-700/50 pb-2">
                              <div>
                                <span className="text-white">{item.name}</span>
                                <div className="text-gray-500 text-xs mt-0.5">{item.quantity || 1} x ${item.price?.toFixed(2) || 0}</div>
                              </div>
                              <span className="font-medium text-white">${(item.amount || (item.price * (item.quantity || 1))).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-gray-500 mb-6 italic">No itemized breakdown available.</p>
                      )}
                    </div>

                    <div className="space-y-2 text-sm mt-4">
                      {selectedExpense.tax > 0 && <div className="flex justify-between text-gray-400"><span>Tax</span><span>${selectedExpense.tax.toFixed(2)}</span></div>}
                      <div className="flex justify-between text-lg font-bold text-white pt-4 border-t border-dark-700">
                        <span>Total Amount</span>
                        <span className="text-primary-400">${(selectedExpense.totalAmount || selectedExpense.amount || 0).toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex gap-4 mt-8">
                      <button onClick={() => handleEditClick(selectedExpense)} className="flex-1 btn-primary py-3 flex justify-center gap-2"><Edit size={18} /> Edit Details</button>
                      <button onClick={(e) => handleDelete(selectedExpense._id, e)} className="px-6 py-3 bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-colors"><Trash2 size={18} /></button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-dark-800 rounded-xl p-6 border border-dark-700 relative h-full flex flex-col">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-2">
                        <label className="text-xs text-gray-400 uppercase tracking-wider">Vendor</label>
                        <input type="text" value={editData.vendor} onChange={e => setEditData({ ...editData, vendor: e.target.value })} className="w-full input-field" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-gray-400 uppercase tracking-wider">Date</label>
                        <input type="date" value={editData.date} onChange={e => setEditData({ ...editData, date: e.target.value })} className="w-full input-field [color-scheme:dark]" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-gray-400 uppercase tracking-wider">Category</label>
                        <input type="text" value={editData.category} onChange={e => setEditData({ ...editData, category: e.target.value })} className="w-full input-field" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs text-gray-400 uppercase tracking-wider">Tax</label>
                        <input type="number" step="0.01" value={editData.tax} onChange={e => setEditData({ ...editData, tax: parseFloat(e.target.value) || 0 })} className="w-full input-field" />
                      </div>
                    </div>

                    <div className="flex-grow flex flex-col">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold">Items</h3>
                        <button type="button" onClick={addEditItem} className="text-sm flex items-center gap-1 text-primary-400 hover:text-primary-300"><Plus size={16} /> Add Item</button>
                      </div>
                      <div className="space-y-3 flex-grow overflow-y-auto pr-2 mb-4 max-h-64">
                        {editData.items.map((item, idx) => (
                          <div key={idx} className="flex gap-2 items-center">
                            <input type="text" value={item.name} placeholder="Item" onChange={e => handleEditItemChange(idx, 'name', e.target.value)} className="w-full input-field py-1 text-sm" />
                            <input type="number" min="1" value={item.quantity || 1} onChange={e => handleEditItemChange(idx, 'quantity', parseFloat(e.target.value) || 1)} className="w-16 input-field py-1 text-sm" />
                            <input type="number" step="0.01" value={item.price || 0} onChange={e => handleEditItemChange(idx, 'price', parseFloat(e.target.value) || 0)} className="w-20 input-field py-1 text-sm" />
                            <button type="button" onClick={() => removeEditItem(idx)} className="text-gray-500 hover:text-red-400 p-1"><Trash2 size={16} /></button>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between items-center bg-dark-900 p-4 rounded-xl mb-6">
                        <span className="text-gray-300">Total Calculated</span>
                        <span className="text-2xl font-bold text-primary-400">${calculateEditTotal().toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="flex justify-end gap-4 pt-4 border-t border-dark-700">
                      <button onClick={() => setEditMode(false)} className="px-6 py-2 rounded-xl text-white hover:bg-dark-700 transition-colors">Cancel</button>
                      <button onClick={saveEdit} disabled={editLoading} className={`btn-primary flex items-center gap-2 px-8 ${editLoading ? 'opacity-50' : ''}`}>
                        {editLoading ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />} Save Changes
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
