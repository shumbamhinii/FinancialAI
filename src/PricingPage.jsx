import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Tabs,
  Tab,
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Alert,
  CircularProgress,
  Switch,
  FormControlLabel,
  createTheme,
  ThemeProvider,
  CssBaseline
} from '@mui/material';
import { motion } from 'framer-motion';
// import axios from 'axios'; // Not used in this client-side code directly
import ClearIcon from '@mui/icons-material/Clear';

import ResultsTab from './ResultsTab';
import WhatIfScenariosTab from './WhatIfScenariosTab';
import CompetitorPricingTab from './CompetitorPricingTab';
import SnapshotManager from './SnapshotManager';
// import GBMSimulationTab from './GBMSimulationTab'; // Uncomment if you have this component

const theme = createTheme({
  palette: {
    primary: {
      main: '#c88a31',
      contrastText: '#fff',
    },
    secondary: {
      main: '#1a1919',
      contrastText: '#c88a31',
    },
    background: {
      default: '#f5f5f5',
      paper: '#fff',
    },
    text: {
      primary: '#1a1919',
      secondary: '#555',
    },
    error: {
      main: '#d32f2f',
    },
    warning: {
      main: '#ff9800',
    },
    success: {
      main: '#4caf50',
    },
  },
  typography: {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    h3: {
      fontWeight: 900,
      letterSpacing: '0.1rem',
      color: '#c88a31',
      textShadow: '0 2px 6px rgba(200, 138, 49, 0.5)',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          fontWeight: 'bold',
          transition: 'transform 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease, color 0.3s ease',
          '&:hover': {
            transform: 'scale(1.03)',
          },
        },
        containedPrimary: {
          backgroundColor: '#1a1919',
          color: '#c88a31',
          boxShadow: '0 8px 20px rgba(200, 138, 49, 0.3)',
          '&:hover': {
            backgroundColor: '#000',
            boxShadow: '0 15px 30px rgba(200, 138, 49, 0.6)',
          },
        },
        outlinedPrimary: {
          borderColor: '#c88a31',
          color: '#c88a31',
          backgroundColor: 'transparent',
          boxShadow: '0 8px 20px rgba(200, 138, 49, 0.3)',
          '&:hover': {
            backgroundColor: 'rgba(200, 138, 49, 0.1)',
            boxShadow: '0 15px 30px rgba(200, 138, 49, 0.6)',
            borderColor: '#c88a31',
          },
        },
        containedSecondary: {
          backgroundColor: '#c88a31',
          color: '#1a1919',
          '&:hover': {
            backgroundColor: '#e09a40',
          }
        }
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          color: '#1a1919',
          padding: '12px 24px',
          justifyContent: 'flex-start',
          textAlign: 'left',
          '&.Mui-selected': {
            color: '#c88a31',
            fontWeight: 'bold',
            backgroundColor: 'rgba(200, 138, 49, 0.1)',
          },
          '&:hover': {
            backgroundColor: 'rgba(200, 138, 49, 0.05)',
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: '#c88a31',
          left: 0,
          width: '4px',
          right: 'auto',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          backgroundColor: '#fff',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& label.Mui-focused': {
            color: '#c88a31',
          },
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: '#ccc',
            },
            '&:hover fieldset': {
              borderColor: '#c88a31',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#c88a31',
            },
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: '16px',
        },
      },
    },
    MuiList: {
      styleOverrides: {
        root: {
          backgroundColor: '#fff',
          borderRadius: '8px',
          border: '1px solid #eee',
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          '&:not(:last-child)': {
            borderBottom: '1px solid #eee',
          },
        },
      },
    },
  },
});

const PricingPage = () => {
  const [totalCost, setTotalCost] = useState(0); // Fixed monthly cost
  const [targetProfit, setTargetProfit] = useState(0); // Overall target profit
  const [targetMargin, setTargetMargin] = useState(0); // Overall target margin
  const [useMargin, setUseMargin] = useState(false); // Toggle between profit/margin
  const [useBreakdown, setUseBreakdown] = useState(false); // Toggle for fixed cost breakdown
  const [individualCosts, setIndividualCosts] = useState([{ label: '', amount: 0 }]); // Breakdown of fixed costs
  const [activeTab, setActiveTab] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0); // Calculated total revenue
  const [products, setProducts] = useState([
    { name: 'Product A', percentage: 0, expectedUnits: 1, price: 0, costPerUnit: 0, unitsNeeded: 0, suggestedPrice: 0, percentageRevenue: 0, calculationMethod: 'percentage', suggestedProfit: 0 },
  ]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [competitorPrices, setCompetitorPrices] = useState({});

  // Derived state for actual fixed cost
  const totalFromBreakdown = individualCosts.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
  const actualCost = useBreakdown ? totalFromBreakdown : totalCost; // This is the fixed monthly cost

  // Derived state for total percentage of percentage-based products (used in JSX)
  const totalPercentage = products.filter(p => p.calculationMethod === 'percentage').reduce((acc, p) => acc + (p.percentage || 0), 0);


  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, successMessage]);

  const calculatePrices = useCallback(() => {
    if (products.length === 0) {
      setError('Please add at least one product.');
      setSuccessMessage('');
      return;
    }

    const percentageBasedProducts = products.filter(p => p.calculationMethod === 'percentage');
    const costPlusBasedProducts = products.filter(p => p.calculationMethod === 'cost-plus');

    const currentTotalPercentage = percentageBasedProducts.reduce((acc, p) => acc + (p.percentage || 0), 0);

    // Validate percentage sum only if there are percentage-based products
    if (percentageBasedProducts.length > 0 && Math.round(currentTotalPercentage) !== 100) {
      setError(`Total revenue percentages for percentage-based products must sum up to 100%. Currently: ${currentTotalPercentage.toFixed(2)}%.`);
      setSuccessMessage('');
      return;
    } else {
      setError('');
    }

    // --- Step 1: Calculate Total Costs (Fixed + Variable) ---
    const totalVariableCosts = products.reduce((sum, product) => {
        return sum + (product.costPerUnit * (product.expectedUnits || 0)); // Ensure expectedUnits is not undefined
    }, 0);

    const overallTotalCost = actualCost + totalVariableCosts; // actualCost is fixed costs + all variable costs

    // --- Step 2: Determine Overall Target Revenue based on Total Costs and Setup Target Profit/Margin ---
    let overallTargetRevenue;
    let effectiveTargetProfitAmount; // The actual R amount of profit we need to achieve

    if (useMargin) {
      if (targetMargin >= 100) {
        setError('Target margin must be less than 100%.');
        setSuccessMessage('');
        return;
      }
      overallTargetRevenue = overallTotalCost / (1 - targetMargin / 100);
      effectiveTargetProfitAmount = overallTargetRevenue - overallTotalCost;
    } else {
      effectiveTargetProfitAmount = parseFloat(targetProfit.toString()); // Use the direct target profit
      overallTargetRevenue = overallTotalCost + effectiveTargetProfitAmount;
    }

    setTotalRevenue(overallTargetRevenue);

    // --- Step 3: Allocate Fixed Costs and Overall Target Profit/Margin ---

    // Total expected units from ALL cost-plus products
    const totalExpectedUnitsCostPlus = costPlusBasedProducts.reduce((sum, p) => sum + (p.expectedUnits || 0), 0);

    // Calculate fixed cost allocated to percentage-based products based on their % revenue share
    // This assumes fixed costs are recovered through the revenue generated by these products
    const fixedCostAllocatedToPercentageProducts = percentageBasedProducts.reduce((sum, p) => {
        return sum + (p.percentage / 100 * actualCost);
    }, 0);

    // Remaining fixed costs to be covered by cost-plus products
    const fixedCostAllocatedToCostPlusProducts = actualCost - fixedCostAllocatedToPercentageProducts;

    // Calculate the profit generated by percentage-based products (based on their revenue share of overall target profit)
    const profitFromPercentageProducts = percentageBasedProducts.reduce((sum, p) => {
        const productRevenueShare = (p.percentage / 100) * overallTargetRevenue;
        const productVariableCost = p.costPerUnit * (p.expectedUnits || 0);
        const productAllocatedFixedCost = (p.percentage / 100 * actualCost); // The portion of fixed cost this product 'should' cover
        return sum + (productRevenueShare - productVariableCost - productAllocatedFixedCost);
    }, 0);

    // The remaining profit that MUST be covered by cost-plus products to hit the overall target profit
    const profitNeededFromCostPlusProducts = effectiveTargetProfitAmount - profitFromPercentageProducts;


    const newProducts = products.map((product) => {
      if (product.calculationMethod === 'percentage') {
        const safeExpectedUnits = product.expectedUnits > 0 ? product.expectedUnits : 1;
        const revenueShare = (product.percentage / 100) * overallTargetRevenue;
        const unitPrice = revenueShare / safeExpectedUnits;
        const priceRounded = Math.round(unitPrice * 100) / 100;
        const unitsNeeded = priceRounded > 0 ? Math.ceil(revenueShare / priceRounded) : 0;

        const productRevenue = priceRounded * safeExpectedUnits;
        // Total cost for this percentage product includes its variable cost + its allocated share of fixed costs
        const productTotalCost = (product.costPerUnit * safeExpectedUnits) + (product.percentage / 100 * actualCost);
        const percentageRevenue = productRevenue > 0 ? ((productRevenue - productTotalCost) / productRevenue) * 100 : 0;

        // Suggested profit per unit for display/info for percentage-based products
        const suggestedProfitPerUnit = (productRevenue - productTotalCost) / safeExpectedUnits;

        return {
          ...product,
          price: priceRounded,
          unitsNeeded,
          suggestedPrice: priceRounded,
          percentageRevenue: percentageRevenue,
          suggestedProfit: suggestedProfitPerUnit, // Actual profit generated per unit
        };
      } else { // 'cost-plus' method
        const safeExpectedUnits = product.expectedUnits > 0 ? product.expectedUnits : 1;

        let calculatedProfitPerUnit = 0;
        let fixedCostPerUnitContribution = 0;

        if (totalExpectedUnitsCostPlus > 0) {
            // Distribute the 'profitNeededFromCostPlusProducts' equally per unit among cost-plus products
            calculatedProfitPerUnit = profitNeededFromCostPlusProducts / totalExpectedUnitsCostPlus;
            // Distribute the remaining fixed costs equally per unit among cost-plus products
            fixedCostPerUnitContribution = fixedCostAllocatedToCostPlusProducts / totalExpectedUnitsCostPlus;
        }

        // The suggested profit for cost-plus products now includes its share of remaining overall profit and fixed costs
        const totalSuggestedProfitPerUnit = calculatedProfitPerUnit + fixedCostPerUnitContribution;

        const suggestedPrice = product.costPerUnit + totalSuggestedProfitPerUnit;
        const priceRounded = Math.round(suggestedPrice * 100) / 100;

        const productRevenue = priceRounded * safeExpectedUnits;
        // For cost-plus, productTotalCost is its variable cost + its allocated share of fixed costs
        const productTotalCost = (product.costPerUnit * safeExpectedUnits) + (fixedCostPerUnitContribution * safeExpectedUnits);
        const percentageRevenue = productRevenue > 0 ? ((productRevenue - productTotalCost) / productRevenue) * 100 : 0;

        return {
          ...product,
          price: priceRounded,
          suggestedPrice: priceRounded,
          percentageRevenue: percentageRevenue,
          unitsNeeded: safeExpectedUnits,
          suggestedProfit: totalSuggestedProfitPerUnit, // This is the derived profit per unit needed
        };
      }
    });

    setProducts(newProducts);
    setSuccessMessage('Prices calculated successfully!');
  }, [products, actualCost, useMargin, targetMargin, targetProfit, setError, setSuccessMessage]);

  useEffect(() => {
    // Only trigger recalculation if relevant inputs change
    // Debounce to prevent excessive recalculations during rapid typing
    const timer = setTimeout(() => {
      calculatePrices();
    }, 500); // 500ms debounce
    return () => clearTimeout(timer);
  }, [totalCost, totalFromBreakdown, targetProfit, targetMargin, useMargin, useBreakdown, individualCosts, products, calculatePrices]); // Re-run when these dependencies change

  const handleProductChange = (index, field, value) => {
    const newProducts = [...products];
    if (field === 'name' || field === 'calculationMethod') {
      newProducts[index][field] = value;
    } else {
      const numericValue = parseFloat(value);
      newProducts[index][field] = isNaN(numericValue) ? 0 : numericValue;
    }
    setProducts(newProducts);
  };

  const addProduct = () => {
    setProducts([...products, { name: '', percentage: 0, expectedUnits: 1, price: 0, costPerUnit: 0, unitsNeeded: 0, suggestedPrice: 0, percentageRevenue: 0, calculationMethod: 'percentage', suggestedProfit: 0 }]);
  };

  const removeProduct = (index) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  const clearAllValues = () => {
    setTotalCost(0);
    setTargetProfit(0);
    setTargetMargin(0);
    setUseMargin(false);
    setUseBreakdown(false);
    setIndividualCosts([{ label: '', amount: 0 }]);
    setProducts([
      { name: 'Product A', percentage: 0, expectedUnits: 1, price: 0, costPerUnit: 0, unitsNeeded: 0, suggestedPrice: 0, percentageRevenue: 0, calculationMethod: 'percentage', suggestedProfit: 0 },
    ]);
    setTotalRevenue(0);
    setError('');
    setSuccessMessage('All values cleared!');
  };

  const handleSnapshotLoaded = useCallback((loadedState) => {
    setTotalCost(loadedState.totalCost);
    setUseMargin(loadedState.useMargin);
    setTargetProfit(loadedState.targetProfit);
    setTargetMargin(loadedState.targetMargin);
    setUseBreakdown(loadedState.useBreakdown);
    setProducts(loadedState.products);
    setIndividualCosts(loadedState.individualCosts);
    setCompetitorPrices(loadedState.competitorPrices);
  }, [setTotalCost, setUseMargin, setTargetProfit, setTargetMargin, setUseBreakdown, setProducts, setIndividualCosts, setCompetitorPrices]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container
        maxWidth="false"
        sx={{
          display: 'flex',
          minHeight: '100vh',
          width: '100vw',
          backgroundColor: theme.palette.background.default,
          p: 0,
        }}
      >
        <Box
          sx={{
            width: 240,
            flexShrink: 0,
            backgroundColor: theme.palette.background.paper,
            borderRight: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            flexDirection: 'column',
            pt: 4,
            pb: 2,
          }}
        >
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <Typography variant="h6" align="center" sx={{ mb: 4, color: theme.palette.primary.main }}>
              Financial App
            </Typography>
          </motion.div>
          <Tabs
            orientation="vertical"
            value={activeTab}
            onChange={(e, newVal) => setActiveTab(newVal)}
            aria-label="Vertical tabs example"
            sx={{
              borderRight: 0,
              '& .MuiTabs-flexContainerVertical': {
                alignItems: 'flex-start',
              },
            }}
          >
            <Tab label="Setup" />
            <Tab label="Products" />
            <Tab label="Results" />
            <Tab label="What-If Scenarios" />
            <Tab label="Competitor Pricing" />
            <Tab label="Snapshots" />
          </Tabs>
        </Box>

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 4,
            width: 'calc(100vw - 240px)',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
              <CircularProgress color="primary" />
            </Box>
          )}

          {error && <Alert severity="error" sx={{ mb: 2, maxWidth: '800px', width: '100%' }}>{error}</Alert>}
          {successMessage && <Alert severity="success" sx={{ mb: 2, maxWidth: '800px', width: '100%' }}>{successMessage}</Alert>}

          {activeTab === 0 && (
            <Card elevation={3} sx={{ mb: 4, width: '100%', maxWidth: '800px' }}>
              <CardContent>
                <Box display="flex" flexDirection="column" alignItems="center" gap={3}>
                  <Box display="flex" alignItems="center" gap={2} width="80%">
                    <Button
                      variant={useBreakdown ? 'outlined' : 'contained'}
                      color="primary"
                      onClick={() => setUseBreakdown(false)}
                      fullWidth
                      disabled={loading}
                    >
                      Enter Total Monthly Cost
                    </Button>
                    <Button
                      variant={useBreakdown ? 'contained' : 'outlined'}
                      color="primary"
                      onClick={() => setUseBreakdown(true)}
                      fullWidth
                      disabled={loading}
                    >
                      Enter Individual Expenses
                    </Button>
                  </Box>

                  {!useBreakdown ? (
                    <TextField
                      label="Total Monthly Cost (R)"
                      type="number"
                      value={totalCost === 0 ? '' : totalCost.toString().replace(/^0+/, '')}
                      onChange={(e) => setTotalCost(parseFloat(e.target.value) || 0)}
                      sx={{ width: '80%' }}
                      disabled={loading}
                    />
                  ) : (
                    <Box sx={{ width: '100%' }}>
                      {individualCosts.map((cost, index) => (
                        <Box key={index} display="flex" gap={2} alignItems="center" sx={{ mb: 1, px: '10%' }}>
                          <TextField
                            label="Expense Name"
                            value={cost.label}
                            onChange={(e) => {
                              const newCosts = [...individualCosts];
                              newCosts[index].label = e.target.value;
                              setIndividualCosts(newCosts);
                            }}
                            sx={{ flex: 1 }}
                            disabled={loading}
                          />
                          <TextField
                            label="Amount (R)"
                            type="number"
                            value={cost.amount === 0 ? '' : cost.amount.toString().replace(/^0+/, '')}
                            onChange={(e) => {
                              const newCosts = [...individualCosts];
                              newCosts[index].amount = parseFloat(e.target.value) || 0;
                              setIndividualCosts(newCosts);
                            }}
                            sx={{ width: 120 }}
                            disabled={loading}
                          />
                          <Button
                            color="error"
                            onClick={() => {
                              const newCosts = individualCosts.filter((_, i) => i !== index);
                              setIndividualCosts(newCosts);
                            }}
                            disabled={loading}
                          >
                            X
                          </Button>
                        </Box>
                      ))}
                      <Box textAlign="center" mt={2}>
                        <Button onClick={() => setIndividualCosts([...individualCosts, { label: '', amount: 0 }])} disabled={loading} color="primary">
                          + Add Expense
                        </Button>
                      </Box>
                      <Typography align="center" mt={2} fontWeight={600}>
                        Total Monthly Cost: R{totalFromBreakdown.toFixed(2)}
                      </Typography>
                    </Box>
                  )}

                  <Box display="flex" alignItems="center" gap={2} width="80%">
                    <Button
                      variant={useMargin ? 'outlined' : 'contained'}
                      color="primary"
                      onClick={() => setUseMargin(false)}
                      fullWidth
                      disabled={loading}
                    >
                      Target Profit (R)
                    </Button>
                    <Button
                      variant={useMargin ? 'contained' : 'outlined'}
                      color="primary"
                      onClick={() => setUseMargin(true)}
                      fullWidth
                      disabled={loading}
                    >
                      Target Margin (%)
                    </Button>
                  </Box>

                  {!useMargin ? (
                    <TextField
                      label="Target Profit (R)"
                      type="number"
                      value={targetProfit === 0 ? '' : targetProfit.toString().replace(/^0+/, '')}
                      onChange={(e) => setTargetProfit(parseFloat(e.target.value) || 0)}
                      sx={{ width: '80%' }}
                      disabled={loading}
                    />
                  ) : (
                    <TextField
                      label="Target Margin %"
                      type="number"
                      value={targetMargin === 0 ? '' : targetMargin.toString().replace(/^0+/, '')}
                      onChange={(e) => setTargetMargin(parseFloat(e.target.value) || 0)}
                      sx={{ width: '80%' }}
                      inputProps={{ min: 0, max: 99 }}
                      disabled={loading}
                    />
                  )}

                  <Button variant="contained" color="primary" onClick={calculatePrices} disabled={loading}>
                    Calculate Prices
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={clearAllValues}
                    disabled={loading}
                    startIcon={<ClearIcon />}
                    sx={{ mt: 2 }}
                  >
                    Clear All Values
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}

          {activeTab === 1 && (
            <>
              <Grid container spacing={2} sx={{ maxWidth: '800px', width: '100%' }}>
                {products.map((product, index) => (
                  <Grid item xs={12} key={index}>
                    <Card elevation={2}>
                      <CardContent>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} sm={4}>
                            <TextField
                              fullWidth
                              label="Product Name"
                              value={product.name}
                              onChange={(e) => handleProductChange(index, 'name', e.target.value)}
                              disabled={loading}
                            />
                          </Grid>
                          <Grid item xs={12} sm={8}>
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={product.calculationMethod === 'cost-plus'}
                                  onChange={(e) => handleProductChange(index, 'calculationMethod', e.target.checked ? 'cost-plus' : 'percentage')}
                                  name={`calculationMethod-${index}`}
                                  color="primary"
                                  disabled={loading}
                                />
                              }
                              label={product.calculationMethod === 'cost-plus' ? 'Cost-Plus Calculation' : 'Percentage Revenue Calculation'}
                            />
                          </Grid>

                          {product.calculationMethod === 'percentage' && (
                            <>
                              <Grid item xs={12} sm={3}>
                                <TextField
                                  fullWidth
                                  label="% Revenue Share"
                                  type="number"
                                  value={product.percentage === 0 ? '' : product.percentage.toString().replace(/^0+/, '')}
                                  onChange={(e) => handleProductChange(index, 'percentage', e.target.value)}
                                  inputProps={{ min: 0, max: 100 }}
                                  disabled={loading}
                                />
                              </Grid>
                              <Grid item xs={12} sm={2}>
                                <TextField
                                  fullWidth
                                  label="Units"
                                  type="number"
                                  value={product.expectedUnits === 0 ? '' : product.expectedUnits.toString().replace(/^0+/, '')}
                                  onChange={(e) => handleProductChange(index, 'expectedUnits', e.target.value)}
                                  inputProps={{ min: 1 }}
                                  disabled={loading}
                                />
                              </Grid>
                              <Grid item xs={12} sm={2}>
                                <TextField
                                  fullWidth
                                  label="Cost/Unit (R)"
                                  type="number"
                                  value={product.costPerUnit === 0 ? '' : product.costPerUnit.toString().replace(/^0+/, '')}
                                  onChange={(e) => handleProductChange(index, 'costPerUnit', e.target.value)}
                                  inputProps={{ min: 0 }}
                                  disabled={loading}
                                />
                              </Grid>
                            </>
                          )}

                          {product.calculationMethod === 'cost-plus' && (
                            <>
                              <Grid item xs={12} sm={4}>
                                <TextField
                                  fullWidth
                                  label="Units"
                                  type="number"
                                  value={product.expectedUnits === 0 ? '' : product.expectedUnits.toString().replace(/^0+/, '')}
                                  onChange={(e) => handleProductChange(index, 'expectedUnits', e.target.value)}
                                  inputProps={{ min: 1 }}
                                  disabled={loading}
                                />
                              </Grid>
                              <Grid item xs={12} sm={4}>
                                <TextField
                                  fullWidth
                                  label="Cost/Unit (R)"
                                  type="number"
                                  value={product.costPerUnit === 0 ? '' : product.costPerUnit.toString().replace(/^0+/, '')}
                                  onChange={(e) => handleProductChange(index, 'costPerUnit', e.target.value)}
                                  inputProps={{ min: 0 }}
                                  disabled={loading}
                                />
                              </Grid>
                               {/* This TextField now displays the CALCULATED suggestedProfit, not user input */}
                              <Grid item xs={12} sm={4}>
                                <TextField
                                  fullWidth
                                  label="Suggested Profit per Unit (R)"
                                  type="number"
                                  value={product.suggestedProfit === 0 ? '' : product.suggestedProfit?.toFixed(2).replace(/^0+/, '') || ''} // Display calculated value
                                  InputProps={{
                                      readOnly: true, // Make it read-only as it's now calculated
                                  }}
                                  disabled={loading}
                                />
                              </Grid>
                            </>
                          )}

                          <Grid item xs={12} sm={1}>
                            <Button color="error" variant="outlined" onClick={() => removeProduct(index)} disabled={loading}>
                              X
                            </Button>
                          </Grid>
                        </Grid>
                        <Typography mt={2} fontWeight={600}>
                          Suggested Price: R{product.suggestedPrice.toFixed(2)}
                        </Typography>
                        <Typography mt={1} color="text.secondary">
                          Percentage Revenue: {product.percentageRevenue.toFixed(2)}%
                        </Typography>
                        {product.calculationMethod === 'percentage' && (
                          <Typography mt={1} color="text.secondary">
                            Units Needed to Sell: {product.unitsNeeded} (based on revenue share)
                          </Typography>
                        )}
                         {product.calculationMethod === 'cost-plus' && (
                          <Typography mt={1} color="text.secondary">
                            This product contributes R{product.suggestedProfit.toFixed(2)} profit per unit to the overall target.
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>

              <Box mt={3} textAlign="center" sx={{ maxWidth: '800px', width: '100%' }}>
                <Button variant="contained" onClick={addProduct} color="primary" disabled={loading}>
                  + Add Product
                </Button>
              </Box>
              <Box mt={2} maxWidth="800px" width="100%" textAlign="center">
                <Typography variant="subtitle1">
                  Total Revenue Percentage (for percentage-based products): {totalPercentage.toFixed(2)}%
                </Typography>
                {Math.round(totalPercentage) !== 100 && products.filter(p => p.calculationMethod === 'percentage').length > 0 && (
                  <Alert severity="warning" sx={{ mt: 1 }}>
                    Total percentages for percentage-based products must sum to 100%
                  </Alert>
                )}
              </Box>
              <Box mt={3} textAlign="center" sx={{ maxWidth: '800px', width: '100%' }}>
                <Button variant="contained" color="primary" onClick={calculatePrices} disabled={loading}>
                  Calculate Prices
                </Button>
              </Box>
            </>
          )}

          {activeTab === 2 && (
            <ResultsTab
              products={products}
              totalRevenue={totalRevenue}
              totalCosts={actualCost}
              targetProfit={targetProfit}
            />
          )}

          {activeTab === 3 && (
            <WhatIfScenariosTab
              products={products}
              fixedCosts={actualCost}
              targetProfit={targetProfit}
              useMargin={useMargin}
              targetMargin={targetMargin}
            />
          )}

          {activeTab === 4 && (
            <CompetitorPricingTab
              products={products}
              initialCompetitorPrices={competitorPrices}
              onCompetitorPricesChange={setCompetitorPrices}
            />
          )}

          {/* Uncomment when GBMSimulationTab is ready */}
          {/* {activeTab === 5 && (
            <GBMSimulationTab
              products={products}
            />
          )} */}

          {activeTab === 5 && (
            <Card elevation={3} sx={{ mb: 4, width: '100%', maxWidth: '800px' }}>
              <CardContent>
                <Typography variant="h5" gutterBottom align="center">
                  Manage Snapshots
                </Typography>
                <SnapshotManager
                  loading={loading}
                  setLoading={setLoading}
                  setError={setError}
                  setSuccessMessage={setSuccessMessage}
                  currentPricingState={{
                    totalCost,
                    targetProfit,
                    targetMargin,
                    useMargin,
                    useBreakdown,
                    individualCosts,
                    products,
                    actualCost,
                    competitorPrices,
                  }}
                  onSnapshotLoaded={handleSnapshotLoaded}
                  onCalculatePrices={calculatePrices}
                  setActiveTab={setActiveTab}
                />
              </CardContent>
            </Card>
          )}
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default PricingPage;