import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { expenseService } from '../services/api';
import { UploadCloud, FileImage, X, CheckCircle, Loader2, Edit3, Plus, Trash2 } from 'lucide-react';

const UploadBill = () => {
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' or 'manual'
  const navigate = useNavigate();

  // Upload State
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef(null);

  // Manual Entry State
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState('');
  const [manualData, setManualData] = useState({
    vendor: '',
    category: '',
    date: new Date().toISOString().substring(0, 10),
    tax: 0,
    items: [{ name: '', quantity: 1, price: 0, amount: 0 }]
  });

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type.startsWith('image/')) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
      setUploadError('');
    } else {
      setUploadError('Please select a valid image file (JPEG, PNG).');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files[0];
    if (dropped && dropped.type.startsWith('image/')) {
      setFile(dropped);
      setPreview(URL.createObjectURL(dropped));
      setUploadError('');
    } else {
      setUploadError('Please drop a valid image file.');
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!file) return setUploadError('No file selected.');

    setUploadLoading(true);
    setUploadError('');
    
    const formData = new FormData();
    formData.append('billImage', file);

    try {
      await expenseService.uploadBill(formData);
      setUploadSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      console.error(err);
      setUploadError('Failed to process the bill. Make sure your API keys are correct.');
    } finally {
      setUploadLoading(false);
    }
  };

  // Manual Entry Logic
  const handleItemChange = (index, field, value) => {
    const newItems = [...manualData.items];
    newItems[index][field] = value;
    
    if (field === 'quantity' || field === 'price') {
      newItems[index].amount = newItems[index].quantity * newItems[index].price;
    }
    
    setManualData({ ...manualData, items: newItems });
  };

  const addItem = () => {
    setManualData({
      ...manualData,
      items: [...manualData.items, { name: '', quantity: 1, price: 0, amount: 0 }]
    });
  };

  const removeItem = (index) => {
    if (manualData.items.length > 1) {
      const newItems = manualData.items.filter((_, i) => i !== index);
      setManualData({ ...manualData, items: newItems });
    }
  };

  const calculateTotal = () => {
    const itemsTotal = manualData.items.reduce((acc, item) => acc + item.amount, 0);
    return itemsTotal + parseFloat(manualData.tax || 0);
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setManualLoading(true);
    setManualError('');
    
    try {
      await expenseService.createManualExpense({
        ...manualData,
        totalAmount: calculateTotal()
      });
      setUploadSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      console.error(err);
      setManualError('Failed to save expense.');
    } finally {
      setManualLoading(false);
    }
  };

  if (uploadSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in glass-panel max-w-2xl mx-auto">
        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 mb-4">
          <CheckCircle size={40} />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">Success!</h3>
        <p className="text-gray-400">Expense processed and saved. Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="glass-panel overflow-hidden">
        <div className="flex border-b border-dark-700">
          <button 
            onClick={() => setActiveTab('upload')} 
            className={`flex-1 py-4 font-semibold text-sm transition-colors flex justify-center items-center gap-2 ${activeTab === 'upload' ? 'bg-primary-500/20 text-primary-400 border-b-2 border-primary-500' : 'text-gray-400 hover:bg-dark-800'}`}
          >
            <UploadCloud size={18} /> Upload Bill Image
          </button>
          <button 
            onClick={() => setActiveTab('manual')} 
            className={`flex-1 py-4 font-semibold text-sm transition-colors flex justify-center items-center gap-2 ${activeTab === 'manual' ? 'bg-accent-500/20 text-accent-400 border-b-2 border-accent-500' : 'text-gray-400 hover:bg-dark-800'}`}
          >
            <Edit3 size={18} /> Enter Manually
          </button>
        </div>

        <div className="p-8">
          {activeTab === 'upload' ? (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold mb-2">Upload AI Bill</h2>
              <p className="text-gray-400 mb-8">Upload a picture of your receipt and let our AI instantly extract all itemized details.</p>

              {uploadError && <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-xl mb-6">{uploadError}</div>}

              <form onSubmit={handleUploadSubmit}>
                {!preview ? (
                  <div 
                    className="border-2 border-dashed border-dark-600 rounded-2xl p-12 text-center hover:border-primary-500 hover:bg-dark-800/50 transition-all cursor-pointer"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="w-20 h-20 bg-dark-700 rounded-full flex items-center justify-center text-primary-400 mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <UploadCloud size={32} />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Click or drag image to upload</h3>
                    <p className="text-gray-400 text-sm">Supports JPG, JPEG, PNG</p>
                    <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileChange} accept="image/jpeg, image/png, image/jpg" />
                  </div>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden bg-dark-800 border border-dark-700">
                    <img src={preview} alt="Preview" className="w-full max-h-96 object-contain" />
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button type="button" onClick={clearFile} className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg shadow-lg transition-colors"><X size={20} /></button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-dark-900 to-transparent p-6 pt-12">
                      <div className="flex items-center gap-3 text-white">
                        <FileImage size={24} className="text-primary-400" />
                        <span className="font-medium">{file.name}</span>
                        <span className="text-gray-400 text-sm ml-auto">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-8 flex justify-end gap-4">
                  <button type="button" onClick={() => navigate('/')} className="px-6 py-2 rounded-xl border border-dark-600 text-white hover:bg-dark-700 transition-colors">Cancel</button>
                  <button type="submit" disabled={!file || uploadLoading} className={`btn-primary flex items-center gap-2 px-8 ${(!file || uploadLoading) ? 'opacity-50 cursor-not-allowed transform-none' : ''}`}>
                    {uploadLoading ? <><Loader2 size={20} className="animate-spin" /> Processing AI...</> : <><UploadCloud size={20} /> Extract Data</>}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="animate-fade-in">
              <h2 className="text-2xl font-bold mb-2">Manual Entry</h2>
              <p className="text-gray-400 mb-8">Enter your bill details and itemized breakdown manually.</p>

              {manualError && <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-xl mb-6">{manualError}</div>}

              <form onSubmit={handleManualSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Vendor Name</label>
                    <input type="text" required value={manualData.vendor} onChange={e => setManualData({...manualData, vendor: e.target.value})} className="w-full input-field" placeholder="e.g. Maar Haba Restaurant" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Date</label>
                    <input type="date" required value={manualData.date} onChange={e => setManualData({...manualData, date: e.target.value})} className="w-full input-field [color-scheme:dark]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Category</label>
                    <input type="text" required value={manualData.category} onChange={e => setManualData({...manualData, category: e.target.value})} className="w-full input-field" placeholder="e.g. Food" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Tax Amount</label>
                    <input type="number" step="0.01" value={manualData.tax} onChange={e => setManualData({...manualData, tax: parseFloat(e.target.value) || 0})} className="w-full input-field" placeholder="0.00" />
                  </div>
                </div>

                <div className="pt-6 border-t border-dark-700">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg">Purchased Items</h3>
                    <button type="button" onClick={addItem} className="text-sm flex items-center gap-1 text-primary-400 hover:text-primary-300"><Plus size={16}/> Add Item</button>
                  </div>
                  
                  <div className="space-y-3">
                    {manualData.items.map((item, idx) => (
                      <div key={idx} className="flex flex-col md:flex-row gap-3 items-end bg-dark-800 p-4 rounded-xl border border-dark-700">
                        <div className="flex-1 w-full space-y-1">
                          <label className="text-xs text-gray-400">Item Name</label>
                          <input type="text" required value={item.name} onChange={e => handleItemChange(idx, 'name', e.target.value)} className="w-full input-field py-1.5" />
                        </div>
                        <div className="w-24 space-y-1">
                          <label className="text-xs text-gray-400">Qty</label>
                          <input type="number" min="1" required value={item.quantity} onChange={e => handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 1)} className="w-full input-field py-1.5" />
                        </div>
                        <div className="w-32 space-y-1">
                          <label className="text-xs text-gray-400">Price ($)</label>
                          <input type="number" step="0.01" required value={item.price} onChange={e => handleItemChange(idx, 'price', parseFloat(e.target.value) || 0)} className="w-full input-field py-1.5" />
                        </div>
                        <div className="w-32 space-y-1">
                          <label className="text-xs text-gray-400">Amount</label>
                          <input type="text" readOnly value={`$${item.amount.toFixed(2)}`} className="w-full input-field py-1.5 bg-dark-900 border-dark-800 text-gray-400" />
                        </div>
                        <button type="button" onClick={() => removeItem(idx)} disabled={manualData.items.length === 1} className={`p-2 rounded-lg mb-0.5 ${manualData.items.length === 1 ? 'text-dark-600' : 'text-red-400 hover:bg-red-500/20'}`}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center bg-dark-800 p-6 rounded-xl border border-primary-500/30">
                  <span className="text-lg text-gray-300">Grand Total</span>
                  <span className="text-3xl font-bold text-primary-400">${calculateTotal().toFixed(2)}</span>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <button type="button" onClick={() => navigate('/')} className="px-6 py-2 rounded-xl border border-dark-600 text-white hover:bg-dark-700 transition-colors">Cancel</button>
                  <button type="submit" disabled={manualLoading} className={`btn-primary flex items-center gap-2 px-8 ${manualLoading ? 'opacity-50 cursor-not-allowed transform-none' : ''}`}>
                    {manualLoading ? <><Loader2 size={20} className="animate-spin" /> Saving...</> : <><CheckCircle size={20} /> Save Expense</>}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadBill;
