import React, { useState, useEffect } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, ArcElement, Tooltip, Legend);

function CostingPricingForm({ selectedProduct }) {
  // Set all initial values to 0
  const [unitCost, setUnitCost] = useState(0);
  const [totalUnits, setTotalUnits] = useState(0);

  const [directorPct, setDirectorPct] = useState(0);
  const [staffPct, setStaffPct] = useState(0);
  const [accountingPct, setAccountingPct] = useState(0);
  const [domainPct, setDomainPct] = useState(0);
  const [dataPct, setDataPct] = useState(0);

  const [airtimeAmount, setAirtimeAmount] = useState(0);
  const [otherActualCost, setOtherActualCost] = useState(0);

  // New state for custom expenses
  const [customExpenses, setCustomExpenses] = useState([]);
  const [newCustomExpenseName, setNewCustomExpenseName] = useState('');
  const [newCustomExpenseAmount, setNewCustomExpenseAmount] = useState(0);

  const [markup, setMarkup] = useState(0);

  // State for pricing data from API
  const [pricingData, setPricingData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [totalDirectCost, setTotalDirectCost] = useState(0);
  const [totalOperatingExpenses, setTotalOperatingExpenses] = useState(0);
  const [totalCostAfterOperating, setTotalCostAfterOperating] = useState(0);
  const [costPerUnitAfterOperating, setCostPerUnitAfterOperating] = useState(0);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [netProfit, setNetProfit] = useState(0);

  const [expenseBreakdown, setExpenseBreakdown] = useState([]);

  const [customMargin, setCustomMargin] = useState(0);
  const [customPrice, setCustomPrice] = useState(0);
  const [customProfitPerUnit, setCustomProfitPerUnit] = useState(0);
  const [useMargin, setUseMargin] = useState(true);

  // Get the product name - fallback to "No Product Selected" if none provided
  const productName = selectedProduct?.product_name || "No Product Selected";

  // Fetch pricing data when selected product changes
  useEffect(() => {
    const fetchPricingData = async () => {
      if (!selectedProduct?.product_name) {
        setPricingData(null);
        // Reset all fields when no product is selected
        setUnitCost(0);
        setTotalUnits(0);
        setDirectorPct(0);
        setStaffPct(0);
        setAccountingPct(0);
        setDomainPct(0);
        setDataPct(0);
        setAirtimeAmount(0);
        setOtherActualCost(0);
        setMarkup(0);
        setCustomExpenses([]); // Reset custom expenses too
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `http://localhost:5000/pricing-data/${encodeURIComponent(selectedProduct.product_name)}`
        );
        const json = await response.json();

        if (json.success && json.data.length > 0) {
          setPricingData(json);

          // Auto-populate fields based on API data
          const data = json.data[0]; // Use first row of data

          // Set unit cost from API or product base cost
          if (json.costPerUnit !== null && json.costPerUnit !== undefined) {
            setUnitCost(Number(json.costPerUnit));
          } else if (selectedProduct.base_cost) {
            setUnitCost(Number(selectedProduct.base_cost));
          }

          // Try to populate other fields from CSV data if available
          setTotalUnits(Number(data.total_units || data.Total_Units || data.units || 0));
          setDirectorPct(Number(data.director_pct || data.Director_Pct || 0) / 100);
          setStaffPct(Number(data.staff_pct || data.Staff_Pct || 0) / 100);
          setAccountingPct(Number(data.accounting_pct || data.Accounting_Pct || 0) / 100);
          setDomainPct(Number(data.domain_pct || data.Domain_Pct || 0) / 100);
          setDataPct(Number(data.data_pct || data.Data_Pct || 0) / 100);
          setAirtimeAmount(Number(data.airtime || data.Airtime || 0));
          setOtherActualCost(Number(data.other_cost || data.Other_Cost || 0));
          setMarkup(Number(data.markup || data.Markup || 0) / 100);

          // TODO: If your API returns custom expenses, you would parse and set them here.
          // For now, custom expenses will be reset to empty if fetched data doesn't include them.
          setCustomExpenses([]);

        } else {
          // If no CSV data, use product base cost and reset other fields
          setPricingData(null);
          setUnitCost(Number(selectedProduct.base_cost || 0));
          setTotalUnits(0);
          setDirectorPct(0);
          setStaffPct(0);
          setAccountingPct(0);
          setDomainPct(0);
          setDataPct(0);
          setAirtimeAmount(0);
          setOtherActualCost(0);
          setMarkup(0);
          setCustomExpenses([]);
        }
      } catch (error) {
        console.error('Error fetching pricing data:', error);
        setPricingData(null);
        // Fallback to product base cost and reset other fields
        setUnitCost(Number(selectedProduct.base_cost || 0));
        setTotalUnits(0);
        setDirectorPct(0);
        setStaffPct(0);
        setAccountingPct(0);
        setDomainPct(0);
        setDataPct(0);
        setAirtimeAmount(0);
        setOtherActualCost(0);
        setMarkup(0);
        setCustomExpenses([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPricingData();
  }, [selectedProduct]);

  useEffect(() => {
    const directCost = unitCost * totalUnits;
    setTotalDirectCost(directCost);

    const directorCost = directCost * directorPct;
    const staffCost = directCost * staffPct;
    const accountingCost = directCost * accountingPct;
    const domainCost = directCost * domainPct;
    const dataCost = directCost * dataPct;

    // Calculate total for custom expenses
    const totalCustomExpensesAmount = customExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

    const totalOpExpenses = directorCost + staffCost + accountingCost + domainCost + dataCost + airtimeAmount + otherActualCost + totalCustomExpensesAmount;
    setTotalOperatingExpenses(totalOpExpenses);

    const totalCost = directCost + totalOpExpenses;
    setTotalCostAfterOperating(totalCost);

    const costPerUnit = totalUnits > 0 ? totalCost / totalUnits : 0;
    setCostPerUnitAfterOperating(costPerUnit);

    const price = totalCost * (1 + markup);
    setSellingPrice(price);

    const profit = price - totalCost;
    setNetProfit(profit);

    // Update expense breakdown to include custom expenses
    const updatedExpenseBreakdown = [
      { label: 'Director', value: directorCost },
      { label: 'Staff/Admin', value: staffCost },
      { label: 'Accounting', value: accountingCost },
      { label: 'Domain', value: domainCost },
      { label: 'Data', value: dataCost },
      { label: 'Airtime', value: airtimeAmount },
      { label: 'Other', value: otherActualCost },
      // Add custom expenses to the breakdown
      ...customExpenses.map(exp => ({ label: exp.name, value: Number(exp.amount) }))
    ];
    setExpenseBreakdown(updatedExpenseBreakdown);

  }, [unitCost, totalUnits, directorPct, staffPct, accountingPct, domainPct, dataPct, airtimeAmount, otherActualCost, markup, customExpenses]); // Add customExpenses to dependencies

  useEffect(() => {
    let price = 0;
    // Prevent division by zero or negative values for margin > 100%
    if (useMargin && customMargin >= 1) { // customMargin is already a decimal (e.g., 0.25 for 25%)
        setCustomPrice(Infinity); // Or a very large number, or error message
        setCustomProfitPerUnit(-costPerUnitAfterOperating); // Indicate a loss if margin target is impossible
        return;
    }

    if (useMargin) {
      price = costPerUnitAfterOperating / (1 - customMargin);
    } else {
      price = costPerUnitAfterOperating * (1 + customMargin);
    }
    setCustomPrice(price);
    setCustomProfitPerUnit(price - costPerUnitAfterOperating);
  }, [customMargin, costPerUnitAfterOperating, useMargin]);


  // Handler to add a new custom expense
  const handleAddCustomExpense = () => {
    if (newCustomExpenseName.trim() && newCustomExpenseAmount >= 0) {
      setCustomExpenses(prevExpenses => [
        ...prevExpenses,
        { name: newCustomExpenseName.trim(), amount: Number(newCustomExpenseAmount) }
      ]);
      setNewCustomExpenseName('');
      setNewCustomExpenseAmount(0);
    } else {
      alert("Please enter a valid name and a non-negative amount for the custom expense.");
    }
  };

  // Handler to remove a custom expense
  const handleRemoveCustomExpense = (index) => {
    setCustomExpenses(prevExpenses => prevExpenses.filter((_, i) => i !== index));
  };


  // --- Styles ---
  const containerStyle = {
    maxWidth: 1400,
    margin: '2rem auto',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    backgroundColor: '#fff',
    borderRadius: 12,
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
    padding: 24,
    color: '#333',
  };

  const gridContainer = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 24,
    marginBottom: 24,
  };

  const sectionTitleStyle = {
    fontSize: 20,
    fontWeight: '700',
    borderBottom: '2px solid #c88a31',
    paddingBottom: 6,
    marginBottom: 16,
    color: '#c88a31',
  };

  const labelStyle = {
    display: 'block',
    marginBottom: 6,
    fontWeight: '600',
    color: '#555',
  };

  const inputStyle = {
    width: '100%',
    padding: '8px 10px',
    borderRadius: 6,
    border: '1.5px solid #ddd',
    fontSize: 14,
    boxSizing: 'border-box', // Crucial for inputs within grid
  };

  const chartSection = {
    display: 'flex',
    flexDirection: 'row',
    gap: 32,
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginTop: 32,
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: 24,
  };

  const thtdStyle = {
    border: '1px solid #ddd',
    padding: '8px 12px',
    textAlign: 'left',
  };

  const calculatedRows = [
    { label: 'Total Direct Cost (R)', value: totalDirectCost },
    { label: 'Total Operating Expenses (R)', value: totalOperatingExpenses },
    { label: 'Total Cost After Operating Expenses (R)', value: totalCostAfterOperating },
    { label: 'Cost Per Unit After Operating Costs (R)', value: costPerUnitAfterOperating },
    { label: 'Selling Price (R)', value: sellingPrice },
    { label: 'Net Profit After Costs (R)', value: netProfit },
  ];

  const barData = {
    labels: expenseBreakdown.map((e) => e.label),
    datasets: [
      {
        label: 'Operating Expenses (R)',
        data: expenseBreakdown.map((e) => e.value),
        backgroundColor: '#c88a31',
      },
    ],
  };

  const pieData = {
    labels: ['Direct Cost', 'Operating Expenses', 'Profit'],
    datasets: [
      {
        data: [totalDirectCost, totalOperatingExpenses, netProfit],
        backgroundColor: ['#c88a31', '#f4c87f', '#8dc88a'],
      },
    ],
  };

  return (
    <div style={containerStyle}>
      <h2 style={{ textAlign: 'center', color: '#c88a31', marginBottom: 32 }}>
        Costing & Pricing Customized
      </h2>

      <div style={{ marginBottom: 32 }}>
        <strong style={{ fontSize: 16, color: '#444' }}>Product Inputs:</strong>
        <div style={{ marginTop: 8, fontWeight: '600', color: '#666' }}>
          Product Name: {productName}
        </div>
        {isLoading && (
          <div style={{ marginTop: 8, color: '#c88a31', fontStyle: 'italic' }}>
            Loading pricing data...
          </div>
        )}
        {pricingData && (
          <div style={{ marginTop: 8, color: '#28a745', fontSize: 14 }}>
            ✓ Pricing data loaded and applied
          </div>
        )}
      </div>

      {/* Inputs */}
      <div style={gridContainer}>
        <div>
          <label style={labelStyle}>Unit Cost (R)</label>
          <input style={inputStyle} type="number" value={unitCost} onChange={(e) => setUnitCost(Number(e.target.value))} />
        </div>
        <div>
          <label style={labelStyle}>Total Units Purchased</label>
          <input style={inputStyle} type="number" value={totalUnits} onChange={(e) => setTotalUnits(Number(e.target.value))} />
        </div>
        <div>
          <label style={labelStyle}>Markup (%)</label>
          <input style={inputStyle} type="number" step="0.01" value={markup * 100} onChange={(e) => setMarkup(Number(e.target.value) / 100)} />
        </div>
      </div>

      <h3 style={sectionTitleStyle}>Operating Expense Percentages</h3>
      <div style={gridContainer}>
        <div>
          <label style={labelStyle}>Director</label>
          <input style={inputStyle} type="number" value={directorPct * 100} onChange={(e) => setDirectorPct(Number(e.target.value) / 100)} />
        </div>
        <div>
          <label style={labelStyle}>Staff/Admin</label>
          <input style={inputStyle} type="number" value={staffPct * 100} onChange={(e) => setStaffPct(Number(e.target.value) / 100)} />
        </div>
        <div>
          <label style={labelStyle}>Accounting</label>
          <input style={inputStyle} type="number" value={accountingPct * 100} onChange={(e) => setAccountingPct(Number(e.target.value) / 100)} />
        </div>
        <div>
          <label style={labelStyle}>Domain</label>
          <input style={inputStyle} type="number" value={domainPct * 100} onChange={(e) => setDomainPct(Number(e.target.value) / 100)} />
        </div>
        <div>
          <label style={labelStyle}>Data</label>
          <input style={inputStyle} type="number" value={dataPct * 100} onChange={(e) => setDataPct(Number(e.target.value) / 100)} />
        </div>
      </div>

      <h3 style={sectionTitleStyle}>Actual Costs</h3>
      <div style={gridContainer}>
        <div>
          <label style={labelStyle}>Airtime (R)</label>
          <input style={inputStyle} type="number" value={airtimeAmount} onChange={(e) => setAirtimeAmount(Number(e.target.value))} />
        </div>
        <div>
          <label style={labelStyle}>Other (R)</label>
          <input style={inputStyle} type="number" value={otherActualCost} onChange={(e) => setOtherActualCost(Number(e.target.value))} />
        </div>
      </div>

      {/* --- Custom Expenses Section --- */}
      <h3 style={sectionTitleStyle}>Custom Expenses</h3>
      <div style={{ marginBottom: 16 }}>
        {customExpenses.map((expense, index) => (
          <div key={index} style={styles.customExpenseItem}>
            <span style={styles.customExpenseLabel}>{expense.name}:</span>
            <span style={styles.customExpenseValue}>R {Number(expense.amount).toFixed(2)}</span>
            <button onClick={() => handleRemoveCustomExpense(index)} style={styles.removeExpenseButton}>
              &times;
            </button>
          </div>
        ))}
      </div>

      <div style={styles.addCustomExpenseSection}>
        <input
          type="text"
          placeholder="Expense Name"
          value={newCustomExpenseName}
          onChange={(e) => setNewCustomExpenseName(e.target.value)}
          style={styles.newExpenseInput}
        />
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="Amount (R)"
          value={newCustomExpenseAmount}
          onChange={(e) => setNewCustomExpenseAmount(Number(e.target.value))}
          style={styles.newExpenseInput}
        />
        <button onClick={handleAddCustomExpense} style={styles.addExpenseButton}>
          Add Custom Expense
        </button>
      </div>

      {/* --- End Custom Expenses Section --- */}


      <h3 style={sectionTitleStyle}>Summary Table</h3>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thtdStyle}>Metric</th>
            <th style={thtdStyle}>Amount (R)</th>
          </tr>
        </thead>
        <tbody>
          {calculatedRows.map((row, idx) => (
            <tr key={idx}>
              <td style={thtdStyle}>{row.label}</td>
              <td style={thtdStyle}>{row.value.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 style={sectionTitleStyle}>Visual Breakdown</h3>
      <div style={chartSection}>
        <div style={{ flex: '1 1 300px' }}>
          <Bar data={barData} options={{ responsive: true }} />
        </div>
        <div style={{ flex: '1 1 300px' }}>
          <Pie data={pieData} options={{ responsive: true }} />
        </div>
      </div>

      <h3 style={sectionTitleStyle}>Custom Pricing Based on Margin/Markup</h3>
      <div style={{ marginBottom: 12 }}>
        <label style={{ ...labelStyle, marginBottom: 0 }}>
          <input
            type="checkbox"
            checked={useMargin}
            onChange={() => setUseMargin(!useMargin)}
            style={{ marginRight: 8 }}
          />
          Use Margin Instead of Markup
        </label>
      </div>
      <div style={gridContainer}>
        <div>
          <label style={labelStyle}>{useMargin ? 'Margin (%)' : 'Markup (%)'}</label>
          <input
            style={inputStyle}
            type="number"
            step="0.01"
            value={customMargin * 100}
            onChange={(e) => setCustomMargin(Number(e.target.value) / 100)}
          />
        </div>
        <div>
          <label style={labelStyle}>Suggested Selling Price (R)</label>
          <input
            style={inputStyle}
            type="number"
            readOnly
            value={customPrice.toFixed(2)}
          />
        </div>
        <div>
          <label style={labelStyle}>Profit Per Unit (R)</label>
          <input
            style={inputStyle}
            type="number"
            readOnly
            value={customProfitPerUnit.toFixed(2)}
          />
        </div>
      </div>
    </div>
  );
}

const styles = {
  // ... (Keep your existing styles like containerStyle, gridContainer, sectionTitleStyle, labelStyle, inputStyle, chartSection, tableStyle, thtdStyle, etc.)
  // Ensure inputStyle has boxSizing: 'border-box' for better layout in grids

  // New styles for custom expenses
  customExpenseItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    border: '1px solid #eee',
    borderRadius: '8px',
    padding: '10px 15px',
    marginBottom: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  customExpenseLabel: {
    fontWeight: '600',
    color: '#333',
    flexGrow: 1,
  },
  customExpenseValue: {
    fontWeight: '500',
    color: '#c88a31',
    marginRight: '15px',
  },
  removeExpenseButton: {
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '24px',
    height: '24px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 'bold',
    transition: 'background-color 0.2s ease',
  },
  removeExpenseButtonHover: { // Not directly used in inline style, but for reference if using CSS modules
    backgroundColor: '#c82333',
  },
  addCustomExpenseSection: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr auto', // Three columns for name, amount, and button
    gap: '10px',
    marginBottom: '20px',
    alignItems: 'flex-end', // Align items to the bottom
  },
  newExpenseInput: {
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #ccc',
    fontSize: '14px',
    boxSizing: 'border-box',
  },
  addExpenseButton: {
    backgroundColor: '#28a745',
    color: 'white',
    padding: '10px 15px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'background-color 0.2s ease',
  },
  addExpenseButtonHover: { // Not directly used in inline style
    backgroundColor: '#218838',
  },
};

export default CostingPricingForm;