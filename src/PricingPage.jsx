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
  IconButton,
  CssBaseline
} from '@mui/material';
import { motion } from 'framer-motion';
import ClearIcon from '@mui/icons-material/Clear';
import { useNavigate } from 'react-router-dom';

import ArrowBackIcon from '@mui/icons-material/ArrowBack'; // If you want an arrow icon
// Assuming these are separate components you have
import ResultsTab from './ResultsTab';
import WhatIfScenariosTab from './WhatIfScenariosTab';
import CompetitorPricingTab from './CompetitorPricingTab';
import SnapshotManager from './SnapshotManager';

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
  const navigate = useNavigate();
  
  const [totalCost, setTotalCost] = useState(0); // Fixed monthly cost
  const [targetProfit, setTargetProfit] = useState(0); // Overall target profit
  const [targetMargin, setTargetMargin] = useState(0); // Overall target margin
  const [useMargin, setUseMargin] = useState(false); // Toggle between profit/margin
  const [useBreakdown, setUseBreakdown] = useState(false); // Toggle for fixed cost breakdown
  const [individualCosts, setIndividualCosts] = useState([{ label: '', amount: 0 }]); // Breakdown of fixed costs
  const [activeTab, setActiveTab] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0); // Calculated total revenue
  const [products, setProducts] = useState([
    {
      name: 'Product A',
      percentage: 0,
      expectedUnits: 1,
      price: 0,
      costPerUnit: 0,
      directCosts: [], // Array to hold direct costs for this product
      unitsNeeded: 0,
      suggestedPrice: 0,
      percentageRevenue: 0,
      calculationMethod: 'percentage',
      suggestedProfit: 0
    },
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

    const currentTotalPercentage = percentageBasedProducts.reduce((acc, p) => acc + (Number(p.percentage) || 0), 0);

    if (percentageBasedProducts.length > 0 && Math.round(currentTotalPercentage) !== 100) {
      setError(`Total revenue percentages for percentage-based products must sum up to 100%. Currently: ${currentTotalPercentage.toFixed(2)}%.`);
      setSuccessMessage('');
      return;
    } else {
      setError('');
    }

    // --- Step 1: Calculate Total Costs (Fixed + Variable + Direct) ---
    const totalVariableAndDirectCosts = products.reduce((sum, product) => {
      const baseCost = Number(product.costPerUnit || 0);
      const directCostsTotalForProduct = product.directCosts.reduce((dcSum, dc) => dcSum + (Number(dc.amount) || 0), 0);
      const safeExpectedUnits = (Number(product.expectedUnits) || 0) > 0 ? (Number(product.expectedUnits) || 0) : 1;

      // Direct costs are now total for the product, divided by units for per-unit cost
      const directCostsPerUnit = directCostsTotalForProduct / safeExpectedUnits;

      const totalUnitCost = baseCost + directCostsPerUnit;
      return sum + (totalUnitCost * safeExpectedUnits);
    }, 0);

    const overallTotalCost = actualCost + totalVariableAndDirectCosts;

    // --- Step 2: Determine Overall Target Revenue based on Total Costs and Setup Target Profit/Margin ---
    let overallTargetRevenue;
    let effectiveTargetProfitAmount;

    if (useMargin) {
      const parsedTargetMargin = Number(targetMargin) || 0;
      if (parsedTargetMargin >= 100) {
        setError('Target margin must be less than 100%.');
        setSuccessMessage('');
        return;
      }
      overallTargetRevenue = overallTotalCost / (1 - parsedTargetMargin / 100);
      effectiveTargetProfitAmount = overallTargetRevenue - overallTotalCost;
    } else {
      effectiveTargetProfitAmount = Number(targetProfit) || 0;
      overallTargetRevenue = overallTotalCost + effectiveTargetProfitAmount;
    }

    setTotalRevenue(overallTargetRevenue);

    // --- Step 3: Allocate Fixed Costs and Overall Target Profit/Margin ---

    const totalExpectedUnitsCostPlus = costPlusBasedProducts.reduce((sum, p) => sum + (Number(p.expectedUnits) || 0), 0);

    // Calculate fixed cost allocated to percentage-based products based on their % revenue share
    const fixedCostAllocatedToPercentageProducts = percentageBasedProducts.reduce((sum, p) => {
      return sum + ((Number(p.percentage) || 0) / 100 * actualCost);
    }, 0);

    // Remaining fixed costs to be covered by cost-plus products
    const fixedCostAllocatedToCostPlusProducts = actualCost - fixedCostAllocatedToPercentageProducts;

    // Calculate the profit generated by percentage-based products (based on their revenue share of overall target profit)
    const profitFromPercentageProducts = percentageBasedProducts.reduce((sum, p) => {
      const productRevenueShare = ((Number(p.percentage) || 0) / 100) * overallTargetRevenue;
      const baseCost = Number(p.costPerUnit || 0);
      const directCostsTotalForProduct = p.directCosts.reduce((dcSum, dc) => dcSum + (Number(dc.amount) || 0), 0);
      const safeExpectedUnits = (Number(p.expectedUnits) || 0) > 0 ? (Number(p.expectedUnits) || 0) : 1;
      const directCostsPerUnit = directCostsTotalForProduct / safeExpectedUnits;

      const totalUnitCost = baseCost + directCostsPerUnit;
      const productVariableAndDirectCost = totalUnitCost * safeExpectedUnits;
      const productAllocatedFixedCost = ((Number(p.percentage) || 0) / 100 * actualCost);
      return sum + (productRevenueShare - productVariableAndDirectCost - productAllocatedFixedCost);
    }, 0);

    const profitNeededFromCostPlusProducts = effectiveTargetProfitAmount - profitFromPercentageProducts;


    const newProducts = products.map((product) => {
      const safeExpectedUnits = (Number(product.expectedUnits) || 0) > 0 ? (Number(product.expectedUnits) || 0) : 1;
      const baseCost = Number(product.costPerUnit || 0);
      const directCostsTotalForProduct = product.directCosts.reduce((dcSum, dc) => dcSum + (Number(dc.amount) || 0), 0);

      // IMPORTANT CHANGE: Calculate directCostsPerUnit based on total and expectedUnits
      const directCostsPerUnit = directCostsTotalForProduct / safeExpectedUnits;

      const effectiveUnitCost = baseCost + directCostsPerUnit; // This is the total unit cost for this product

      if (product.calculationMethod === 'percentage') {
        const revenueShare = ((Number(product.percentage) || 0) / 100) * overallTargetRevenue;
        const unitPrice = revenueShare / safeExpectedUnits;
        const priceRounded = Math.round(unitPrice * 100) / 100;
        const unitsNeeded = priceRounded > 0 ? Math.ceil(revenueShare / priceRounded) : 0;

        const productRevenue = priceRounded * safeExpectedUnits;
        const productTotalCost = effectiveUnitCost * safeExpectedUnits + ((Number(product.percentage) || 0) / 100 * actualCost);
        const percentageRevenue = productRevenue > 0 ? ((productRevenue - productTotalCost) / productRevenue) * 100 : 0;
        const suggestedProfitPerUnit = (productRevenue - productTotalCost) / safeExpectedUnits;

        return {
          ...product,
          price: priceRounded,
          unitsNeeded,
          suggestedPrice: priceRounded,
          percentageRevenue: percentageRevenue,
          suggestedProfit: suggestedProfitPerUnit,
        };
      } else { // 'cost-plus' method
        let calculatedProfitPerUnit = 0;
        let fixedCostPerUnitContribution = 0;

        if (totalExpectedUnitsCostPlus > 0) {
          calculatedProfitPerUnit = profitNeededFromCostPlusProducts / totalExpectedUnitsCostPlus;
          fixedCostPerUnitContribution = fixedCostAllocatedToCostPlusProducts / totalExpectedUnitsCostPlus;
        }

        const totalSuggestedProfitPerUnit = calculatedProfitPerUnit + fixedCostPerUnitContribution;

        const suggestedPrice = effectiveUnitCost + totalSuggestedProfitPerUnit;
        const priceRounded = Math.round(suggestedPrice * 100) / 100;

        const productRevenue = priceRounded * safeExpectedUnits;
        const productTotalCost = (effectiveUnitCost * safeExpectedUnits) + (fixedCostPerUnitContribution * safeExpectedUnits);
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
    const timer = setTimeout(() => {
      calculatePrices();
    }, 500);
    return () => clearTimeout(timer);
  }, [totalCost, totalFromBreakdown, targetProfit, targetMargin, useMargin, useBreakdown, individualCosts, products, calculatePrices]);

  const handleProductChange = (index, field, value) => {
    const newProducts = [...products];
    if (field === 'name' || field === 'calculationMethod') {
      newProducts[index][field] = value;
    } else {
      const numericValue = parseFloat(value);
      newProducts[index][field] = isNaN(numericValue) ? 0 : numericValue;
    }

    if (field === 'calculationMethod') {
      if (value === 'percentage') {
        newProducts[index].directCosts = []; // Clear direct costs
        newProducts[index].suggestedProfit = 0;
      } else if (value === 'cost-plus') {
        newProducts[index].percentage = 0;
      }
    }

    setProducts(newProducts);
  };

  const handleDirectCostChange = useCallback((productIndex, dcIndex, field, value) => {
    const newProducts = [...products];
    newProducts[productIndex].directCosts[dcIndex][field] = value;
    setProducts(newProducts);
  }, [products]);

  const addDirectCost = useCallback((productIndex) => {
    const newProducts = [...products];
    newProducts[productIndex].directCosts.push({ description: '', amount: 0 });
    setProducts(newProducts);
  }, [products]);

  const removeDirectCost = useCallback((productIndex, dcIndex) => {
    const newProducts = [...products];
    newProducts[productIndex].directCosts = newProducts[productIndex].directCosts.filter((_, i) => i !== dcIndex);
    setProducts(newProducts);
  }, [products]);

  const addProduct = () => {
    setProducts([...products, {
      name: `Product ${products.length + 1}`,
      percentage: 0,
      expectedUnits: 1,
      price: 0,
      costPerUnit: 0,
      directCosts: [], // Initialize directCosts for new products
      unitsNeeded: 0,
      suggestedPrice: 0,
      percentageRevenue: 0,
      calculationMethod: 'percentage',
      suggestedProfit: 0
    }]);
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
      {
        name: 'Product A',
        percentage: 0,
        expectedUnits: 1,
        price: 0,
        costPerUnit: 0,
        directCosts: [], // Clear direct costs here too
        unitsNeeded: 0,
        suggestedPrice: 0,
        percentageRevenue: 0,
        calculationMethod: 'percentage',
        suggestedProfit: 0
      },
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
    setIndividualCosts(loadedState.individualCosts);
    setProducts(loadedState.products.map(p => ({ ...p, directCosts: p.directCosts || [] })) || []);
    setCompetitorPrices(loadedState.competitorPrices);
    setTimeout(() => {
      calculatePrices();
    }, 0);
  }, [
    setTotalCost,
    setUseMargin,
    setTargetProfit,
    setTargetMargin,
    setUseBreakdown,
    setProducts,
    setIndividualCosts,
    setCompetitorPrices,
    calculatePrices
  ]);

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
      <IconButton
        onClick={() => navigate('/')} // <--- ENSURE THIS IS '/'
        aria-label="back to home page"
        sx={{ mr: 1, color: theme.palette.primary.main }}
      >
        <ArrowBackIcon />
      </IconButton>
            <Typography variant="h6" align="center" sx={{ mb: 4, color: theme.palette.primary.main }}>
              PriceMind AI
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
                    Submit
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
                                  label="Base Cost/Unit (R)"
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
                                  label="Base Cost/Unit (R)"
                                  type="number"
                                  value={product.costPerUnit === 0 ? '' : product.costPerUnit.toString().replace(/^0+/, '')}
                                  onChange={(e) => handleProductChange(index, 'costPerUnit', parseFloat(e.target.value) || 0)}
                                  inputProps={{ min: 0 }}
                                  disabled={loading}
                                />
                              </Grid>
                              <Grid item xs={12} sm={4}>
                                <TextField
                                  fullWidth
                                  label="Recommended Profit per Unit (R)"
                                  type="number"
                                  value={
                                    typeof product.suggestedProfit === 'number' && !isNaN(product.suggestedProfit)
                                      ? product.suggestedProfit.toFixed(2)
                                      : ''
                                  }
                                  InputProps={{
                                    readOnly: true,
                                  }}
                                  disabled={loading}
                                />
                              </Grid>
                            </>
                          )}

                          {/* NEW SECTION FOR DIRECT COSTS */}
                          <Grid item xs={12}>
                            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 600 }}>
                              Direct Costs for {product.name} (Total for all {product.expectedUnits} units)
                            </Typography>
                            {product.directCosts.map((directCost, dcIndex) => (
                              <Box key={dcIndex} display="flex" gap={1} alignItems="center" sx={{ mb: 1 }}>
                                <TextField
                                  label="Cost Description"
                                  value={directCost.description}
                                  onChange={(e) => handleDirectCostChange(index, dcIndex, 'description', e.target.value)}
                                  sx={{ flex: 1 }}
                                  disabled={loading}
                                />
                                <TextField
                                  label="Amount (Total R)" 
                                  type="number"
                                  value={directCost.amount === 0 ? '' : directCost.amount.toString().replace(/^0+/, '')}
                                  onChange={(e) => handleDirectCostChange(index, dcIndex, 'amount', parseFloat(e.target.value) || 0)}
                                  sx={{ width: 120 }}
                                  disabled={loading}
                                />
                                <Button
                                  color="error"
                                  onClick={() => removeDirectCost(index, dcIndex)}
                                  disabled={loading}
                                >
                                  -
                                </Button>
                              </Box>
                            ))}
                            <Box textAlign="center" mt={1}>
                              <Button
                                onClick={() => addDirectCost(index)}
                                disabled={loading}
                                color="primary"
                                variant="outlined"
                                size="small"
                              >
                                + Add Direct Cost
                              </Button>
                            </Box>
                          </Grid>
                          {/* END NEW SECTION */}

                          <Grid item xs={12} sm={1}>
                            <Button
                              color="error"
                              onClick={() => removeProduct(index)}
                              disabled={loading}
                            >
                              X
                            </Button>
                          </Grid>
                        </Grid>
                        <Typography mt={2} fontWeight={600}>
                          Recommended Retail Price: R
                          {typeof product.suggestedPrice === 'number' && !isNaN(product.suggestedPrice)
                            ? product.suggestedPrice.toFixed(2)
                            : 'N/A'}
                        </Typography>

                        <Typography mt={1} color="text.secondary">
                          Percentage Revenue:
                          {typeof product.percentageRevenue === 'number' && !isNaN(product.percentageRevenue)
                            ? product.percentageRevenue.toFixed(2)
                            : 'N/A'}
                          %
                        </Typography>

                        {product.calculationMethod === 'percentage' && (
                          <Typography mt={1} color="text.secondary">
                            Units Needed to Sell:
                            {typeof product.unitsNeeded === 'number' && !isNaN(product.unitsNeeded)
                              ? Math.ceil(product.unitsNeeded)
                              : 'N/A'}
                            (based on revenue share)
                          </Typography>
                        )}

                        {product.calculationMethod === 'cost-plus' && (
                          <Typography mt={1} color="text.secondary">
                            This product contributes R
                            {typeof product.suggestedProfit === 'number' && !isNaN(product.suggestedProfit)
                              ? product.suggestedProfit.toFixed(2)
                              : 'N/A'}
                            profit per unit (including its share of fixed costs).
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
                <Grid item xs={12} sx={{ textAlign: 'center' }}>
                  <Button onClick={addProduct} disabled={loading} color="primary" variant="contained">
                    + Add Product
                  </Button>
                </Grid>
                {products.filter(p => p.calculationMethod === 'percentage').length > 0 && (
                  <Grid item xs={12}>
                    <Alert severity={Math.round(totalPercentage) === 100 ? 'success' : 'warning'} sx={{ mt: 2 }}>
                      Total Percentage of Revenue Share: {totalPercentage.toFixed(2)}% (Should be 100%)
                    </Alert>
                  </Grid>
                )}
              </Grid>
            </>
          )}

          {activeTab === 2 && (
            <ResultsTab
              products={products}
              totalRevenue={totalRevenue}
              actualCost={actualCost}
              totalVariableAndDirectCosts={products.reduce((sum, product) => {
                const baseCost = Number(product.costPerUnit || 0);
                const directCostsTotalForProduct = product.directCosts.reduce((dcSum, dc) => dcSum + (Number(dc.amount) || 0), 0);
                const safeExpectedUnits = (Number(product.expectedUnits) || 0) > 0 ? (Number(product.expectedUnits) || 0) : 1;
                const totalUnitCost = baseCost + (directCostsTotalForProduct / safeExpectedUnits);
                return sum + (totalUnitCost * safeExpectedUnits);
              }, 0)}
              useMargin={useMargin}
              targetProfit={targetProfit}
              targetMargin={targetMargin}
              loading={loading}
              error={error}
            />
          )}

          {activeTab === 3 && (
            <WhatIfScenariosTab
              products={products}
              totalCost={totalCost}
              targetProfit={targetProfit}
              targetMargin={targetMargin}
              useMargin={useMargin}
              actualCost={actualCost}
              loading={loading}
              error={error}
              calculatePrices={calculatePrices}
            />
          )}


{activeTab === 4 && (
  <CompetitorPricingTab
    products={products}
    // Change 'competitorPrices' to 'initialCompetitorPrices'
    initialCompetitorPrices={competitorPrices}
    // Change 'setCompetitorPrices' to 'onCompetitorPricesChange'
    // and pass the setter function directly, as it matches the signature
    onCompetitorPricesChange={setCompetitorPrices}
    // REMOVE 'loading' prop if it's not defined in CompetitorPricingTabProps
    // loading={loading} // <--- Remove this line if not used/defined in child
  />
)}

{activeTab === 5 && (
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

          )}
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default PricingPage;
