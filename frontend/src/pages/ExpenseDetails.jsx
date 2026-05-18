import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const ExpenseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div className="glass-panel p-8">
      <h2 className="text-2xl font-bold mb-4">Expense Details</h2>
      <p className="text-gray-400 mb-4">Details for ID: {id}</p>
      <button onClick={() => navigate(-1)} className="btn-primary">Back</button>
    </div>
  );
};

export default ExpenseDetails;
