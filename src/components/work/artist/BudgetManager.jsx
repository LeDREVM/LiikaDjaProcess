import React, { useState } from 'react';
import { Plus, X, DollarSign, Utensils, Package, Car, Download } from 'lucide-react';

const BudgetManager = ({ budgets, setBudgets, shootings, projects = [] }) => {
  const [showForm, setShowForm] = useState(false);
  const [selectedProject, setSelectedProject] = useState('all');
  const [formData, setFormData] = useState({
    shootingId: '',
    projectId: '',
    category: 'production',
    amount: 0,
    spent: 0,
    meals: 0,
    supplies: 0,
    transport: 0,
    equipment: 0,
    other: 0,
    notes: ''
  });

  // Filtrer les budgets par projet
  const filteredBudgets = selectedProject === 'all' 
    ? budgets 
    : budgets.filter(b => {
        const project = projects.find(p => p.id === parseInt(selectedProject));
        return project?.budgetIds?.includes(b.id);
      });

  const resetForm = () => {
    setFormData({
      shootingId: '',
      projectId: '',
      category: 'production',
      amount: 0,
      spent: 0,
      meals: 0,
      supplies: 0,
      transport: 0,
      equipment: 0,
      other: 0,
      notes: ''
    });
    setShowForm(false);
  };

  const calculateTotal = (data) => {
    return parseFloat(data.meals) + parseFloat(data.supplies) + 
           parseFloat(data.transport) + parseFloat(data.equipment) + 
           parseFloat(data.other);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const total = calculateTotal(formData);
    const shooting = shootings.find(s => s.id === parseInt(formData.shootingId));
    
    setBudgets([...budgets, { 
      ...formData,
      shootingId: parseInt(formData.shootingId),
      shootingTitle: shooting?.title || 'Tournage inconnu',
      total,
      id: Date.now(), 
      createdAt: new Date().toISOString() 
    }]);
    
    resetForm();
  };

  const deleteBudget = (id) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce budget ?')) {
      setBudgets(budgets.filter(b => b.id !== id));
    }
  };

  const exportBudgetCSV = (budget) => {
    const headers = ['Catégorie', 'Montant (€)'];
    const rows = [
      ['Repas', budget.meals],
      ['Fournitures', budget.supplies],
      ['Transport', budget.transport],
      ['Matériel', budget.equipment],
      ['Autres', budget.other],
      ['TOTAL', budget.total]
    ];

    const csvContent = [
      `Budget: ${budget.shootingTitle}`,
      `Date: ${new Date(budget.createdAt).toLocaleDateString('fr-FR')}`,
      '',
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `budget_${budget.shootingTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const totalAllBudgets = budgets.reduce((acc, b) => acc + b.total, 0);

  return (
    <div className="space-y-6">
      {/* En-tête avec stats */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold text-green-400">
            Budgets ({budgets.length})
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Total: <span className="text-green-400 font-bold">{totalAllBudgets.toLocaleString()}€</span>
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          {showForm ? <X size={20} /> : <Plus size={20} />}
          {showForm ? 'Annuler' : 'Nouveau Budget'}
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 rounded-xl p-6 border border-green-700/30">
          <h4 className="text-lg font-bold text-green-400 mb-4">Nouveau budget</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm text-gray-400 block mb-2">Tournage *</label>
              <select
                required
                value={formData.shootingId}
                onChange={(e) => setFormData({...formData, shootingId: e.target.value})}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
              >
                <option value="">Sélectionner un tournage</option>
                {shootings.map(shooting => (
                  <option key={shooting.id} value={shooting.id}>
                    {shooting.title} - {new Date(shooting.date).toLocaleDateString('fr-FR')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                <Utensils size={16} />
                Repas (€)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.meals}
                onChange={(e) => setFormData({...formData, meals: e.target.value})}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                <Package size={16} />
                Fournitures (€)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.supplies}
                onChange={(e) => setFormData({...formData, supplies: e.target.value})}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                <Car size={16} />
                Transport (€)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.transport}
                onChange={(e) => setFormData({...formData, transport: e.target.value})}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">Matériel (€)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.equipment}
                onChange={(e) => setFormData({...formData, equipment: e.target.value})}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-2">Autres (€)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.other}
                onChange={(e) => setFormData({...formData, other: e.target.value})}
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm text-gray-400 block mb-2">Total calculé</label>
              <div className="bg-green-900/30 border border-green-700/50 rounded-lg px-4 py-3 text-center">
                <span className="text-3xl font-bold text-green-400">
                  {calculateTotal(formData).toFixed(2)}€
                </span>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="text-sm text-gray-400 block mb-2">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows="2"
                className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-green-500"
                placeholder="Détails supplémentaires..."
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 font-semibold"
          >
            <Plus size={20} />
            Créer le budget
          </button>
        </form>
      )}

      {/* Liste des budgets */}
      {budgets.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <DollarSign size={48} className="mx-auto mb-4 opacity-50" />
          <p>Aucun budget enregistré</p>
          <p className="text-sm">Cliquez sur "Nouveau Budget" pour commencer</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {budgets.map(budget => (
            <div
              key={budget.id}
              className="bg-gradient-to-br from-gray-800/50 to-slate-800/50 rounded-xl p-6 border border-gray-700 hover:border-green-600 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h4 className="font-bold text-white text-lg mb-1">{budget.shootingTitle}</h4>
                  <p className="text-xs text-gray-400">
                    {new Date(budget.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => exportBudgetCSV(budget)}
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                    title="Exporter CSV"
                  >
                    <Download size={16} />
                  </button>
                  <button
                    onClick={() => deleteBudget(budget.id)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 flex items-center gap-2">
                    <Utensils size={14} />
                    Repas
                  </span>
                  <span className="text-white font-semibold">{parseFloat(budget.meals).toFixed(2)}€</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 flex items-center gap-2">
                    <Package size={14} />
                    Fournitures
                  </span>
                  <span className="text-white font-semibold">{parseFloat(budget.supplies).toFixed(2)}€</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400 flex items-center gap-2">
                    <Car size={14} />
                    Transport
                  </span>
                  <span className="text-white font-semibold">{parseFloat(budget.transport).toFixed(2)}€</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Matériel</span>
                  <span className="text-white font-semibold">{parseFloat(budget.equipment).toFixed(2)}€</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Autres</span>
                  <span className="text-white font-semibold">{parseFloat(budget.other).toFixed(2)}€</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-300">TOTAL</span>
                  <span className="text-2xl font-bold text-green-400">{budget.total.toFixed(2)}€</span>
                </div>
              </div>

              {budget.notes && (
                <div className="mt-4 pt-4 border-t border-gray-700 text-xs text-gray-500 italic">
                  {budget.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BudgetManager;
