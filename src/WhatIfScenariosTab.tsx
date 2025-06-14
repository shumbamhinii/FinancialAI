import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Card,
  CardContent,
  Divider,
  Button,
  Slider,
  Grid,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface Product {
  name: string;
  expectedUnits: number;
  price: number;
  costPerUnit?: number;
}

interface WhatIfScenariosTabProps {
  products: Product[];
  fixedCosts: number;
  targetProfit: number;
  useMargin: boolean;
  targetMargin: number;
}

// Function to generate a standard normal random number (Box-Muller transform)
const generateNormalRandom = () => {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
};

const WhatIfScenariosTab: React.FC<WhatIfScenariosTabProps> = ({
  products,
  fixedCosts,
  targetProfit,
  useMargin,
  targetMargin,
}) => {
  // Local state to hold editable values for each product
  // CORRECTED: Initialize directly from props. This runs only once on initial mount.
  // This ensures that local changes persist and are not overwritten by the prop.
  const [editableProducts, setEditableProducts] = useState<Product[]>(
    products.map(p => ({ ...p, costPerUnit: p.costPerUnit || 0 }))
  );

  // Brownian Motion Parameters
  const [drift, setDrift] = useState(0.05); // Annual drift (e.g., 5%)
  const [volatility, setVolatility] = useState(0.2); // Annual volatility (e.g., 20%)
  const [timeHorizonMonths, setTimeHorizonMonths] = useState(12); // Time horizon in months
  const [numStepsPerMonth, setNumStepsPerMonth] = useState(20); // Steps per month (e.g., trading days)
  const [numSimulations, setNumSimulations] = useState(5); // Number of simulation paths to display

  // State to store simulation results for charting
  const [simulationChartData, setSimulationChartData] = useState<any[]>([]);
  const [allSimulatedPaths, setAllSimulatedPaths] = useState<{ [productName: string]: number[][] }>({});

  // State for simulated financial outcomes
  const [simulatedTotalRevenue, setSimulatedTotalRevenue] = useState<number | null>(null);
  const [simulatedTotalProfit, setSimulatedTotalProfit] = useState<number | null>(null);
  const [simulatedMargin, setSimulatedMargin] = useState<number | null>(null);

  // REMOVED THE PREVIOUS useEffect BLOCK THAT WAS CAUSING THE REVERTING ISSUE.
  // This useEffect was causing `editableProducts` to reset whenever local changes were made
  // because the `products` prop from the parent remained unchanged, triggering the `if` condition.

  // Handler for updating price, costPerUnit, or expected units in THIS tab's state
  const updateProduct = (
    index: number,
    field: 'price' | 'costPerUnit' | 'expectedUnits',
    value: number
  ) => {
    const newProducts = [...editableProducts];
    newProducts[index] = { ...newProducts[index], [field]: value };
    setEditableProducts(newProducts);
  };

  const simulateBrownianMotion = () => {
    const totalSteps = timeHorizonMonths * numStepsPerMonth;
    const dt = 1 / numStepsPerMonth; // Time step for calculation (e.g., if 20 steps/month, dt = 1/20 month)
    const dt_annualized = dt / 12; // Convert monthly dt to fraction of a year for annual drift/volatility

    const allProductPaths: { [key: string]: number[][] } = {};

    editableProducts.forEach(p => { // Use editableProducts for simulation starting points
      const productPaths: number[][] = [];
      const initialPrice = p.price; // Use the current price from editableProducts

      for (let s = 0; s < numSimulations; s++) {
        const path: number[] = [initialPrice];
        let currentValue = initialPrice;

        for (let i = 1; i <= totalSteps; i++) {
          const Z = generateNormalRandom();
          currentValue *= Math.exp(
            (drift - 0.5 * volatility * volatility) * dt_annualized +
            volatility * Math.sqrt(dt_annualized) * Z
          );
          path.push(parseFloat(currentValue.toFixed(2)));
        }
        productPaths.push(path);
      }
      allProductPaths[p.name] = productPaths;
    });

    setAllSimulatedPaths(allProductPaths);

    const chartDataFormatted: any[] = [];
    for (let i = 0; i <= totalSteps; i++) {
      const row: any = {
        step: i,
        time: `${(i / numStepsPerMonth).toFixed(1)}m`
      };
      editableProducts.forEach(p => {
        const averageAtStep = allProductPaths[p.name].reduce((sum, path) => sum + path[i], 0) / numSimulations;
        row[p.name] = parseFloat(averageAtStep.toFixed(2));
      });
      chartDataFormatted.push(row);
    }
    setSimulationChartData(chartDataFormatted);

    // *******************************************************************
    // Calculate simulated total revenue, profit, and margin
    // This uses the average final price from the simulation for each product
    // *******************************************************************
    let currentSimulatedTotalRevenue = 0;
    editableProducts.forEach(p => {
        const finalPrices = allProductPaths[p.name].map(path => path[path.length - 1]);
        const avgFinalPrice = finalPrices.reduce((sum, val) => sum + val, 0) / finalPrices.length;

        // Use the average final price from simulation, and original expected units
        currentSimulatedTotalRevenue += avgFinalPrice * (p.expectedUnits || 0);
    });

    const totalSimulatedCostsVariable = editableProducts.reduce(
        (sum, p) => sum + (p.costPerUnit || 0) * (p.expectedUnits || 0),
        0
    );
    // Ensure fixedCosts is treated as a number, defaulting to 0 if it's not.
    const safeFixedCosts = Number(fixedCosts) || 0;
    const currentSimulatedTotalCosts = totalSimulatedCostsVariable + safeFixedCosts;

    const currentSimulatedProfit = currentSimulatedTotalRevenue - currentSimulatedTotalCosts;
    let currentSimulatedMargin: number | null = null;
    if (useMargin && currentSimulatedTotalRevenue > 0) {
        currentSimulatedMargin = (currentSimulatedProfit / currentSimulatedTotalRevenue) * 100;
    }

    setSimulatedTotalRevenue(currentSimulatedTotalRevenue);
    setSimulatedTotalProfit(currentSimulatedProfit);
    setSimulatedMargin(currentSimulatedMargin);
    // *******************************************************************
  };

  // Calculations based on this tab's editable products (for current "what-if" values)
  const totalRevenue = editableProducts.reduce(
    (sum, p) => sum + (p.price || 0) * (p.expectedUnits || 0),
    0
  );
  const totalCostsVariable = editableProducts.reduce(
    (sum, p) => sum + (p.costPerUnit || 0) * (p.expectedUnits || 0),
    0
  );
  // Ensure fixedCosts is treated as a number, defaulting to 0 if it's not.
  const safeFixedCosts = Number(fixedCosts) || 0;
  const totalCosts = totalCostsVariable + safeFixedCosts;
  const totalProfit = totalRevenue - totalCosts;
  const margin = useMargin && totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : null;

  return (
    <Card sx={{ maxWidth: 900, mx: 'auto' }}>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          What-If Scenarios & Price Volatility Simulation
        </Typography>

        <Typography variant="subtitle1" gutterBottom>
          Adjust product prices, costs, or expected units. Use the simulation to understand potential price volatility.
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          Price Volatility Simulation Parameters
        </Typography>
        <Grid container spacing={3} alignItems="center" mb={2}>
          <Grid item xs={12} sm={6}>
            <Typography gutterBottom>Drift (annual growth %): {drift.toFixed(2)}</Typography>
            <Slider
              value={drift}
              min={-0.1}
              max={0.2}
              step={0.01}
              onChange={(_, newValue) => setDrift(newValue as number)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography gutterBottom>Volatility (annual %): {volatility.toFixed(2)}</Typography>
            <Slider
              value={volatility}
              min={0.01}
              max={0.5}
              step={0.01}
              onChange={(_, newValue) => setVolatility(newValue as number)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography gutterBottom>Time Horizon (months): {timeHorizonMonths}</Typography>
            <Slider
              value={timeHorizonMonths}
              min={1}
              max={24} // Up to 2 years
              step={1}
              onChange={(_, newValue) => setTimeHorizonMonths(newValue as number)}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography gutterBottom>Number of Simulation Paths: {numSimulations}</Typography>
            <Slider
              value={numSimulations}
              min={1}
              max={50} // Show up to 50 paths (can be more for calculations)
              step={1}
              onChange={(_, newValue) => setNumSimulations(newValue as number)}
            />
          </Grid>
        </Grid>

        <Button variant="contained" color="primary" onClick={simulateBrownianMotion} sx={{ mb: 3 }}>
          Run Price Volatility Simulation
        </Button>

        {simulationChartData.length > 0 && (
          <Box mt={4}>
            <Typography variant="h6" gutterBottom>
              Simulated Average Price Paths
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Each line represents the average of {numSimulations} simulated paths for the product's price over time.
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={simulationChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" label={{ value: "Months", position: "insideBottom", offset: -5 }} />
                <YAxis
                    label={{ value: "Price (R)", angle: -90, position: 'insideLeft' }}
                    domain={['auto', 'auto']} // Auto-scale Y-axis for better visibility of multiple lines
                />
                <Tooltip formatter={(value: number) => `R${value.toFixed(2)}`} />
                <Legend />
                {editableProducts.map((product, index) => (
                  <Line
                    key={product.name}
                    type="monotone"
                    dataKey={product.name}
                    stroke={`hsl(${(index * 60) % 360}, 70%, 50%)`}
                    dot={false}
                    strokeWidth={2}
                  />
                ))}
                {/* Add reference lines for initial prices from editableProducts */}
                 {editableProducts.map((product, index) => (
                    <ReferenceLine
                      key={`ref-${product.name}`}
                      y={product.price}
                      stroke={`hsl(${(index * 60) % 360}, 70%, 50%)`}
                      strokeDasharray="3 3"
                      label={{ value: `${product.name} Start: R${product.price.toFixed(2)}`, position: 'insideBottomRight', fill: `hsl(${(index * 60) % 360}, 70%, 50%)`, fontSize: 10 }}
                    />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom>
          Adjust Product What-If Values
        </Typography>

        {editableProducts.map((product, i) => (
          <Box key={i} mb={3} borderBottom="1px solid #ddd" pb={2}>
            <Typography variant="h6">{product.name}</Typography>
            <Box display="flex" gap={2} flexWrap="wrap">
              <TextField
                label="Price"
                type="number"
                size="small"
                value={product.price}
                onChange={(e) => updateProduct(i, 'price', Number(e.target.value))}
                sx={{ width: 120 }}
                inputProps={{ min: 0, step: 0.01 }}
              />
              <TextField
                label="Cost"
                type="number"
                size="small"
                value={product.costPerUnit}
                onChange={(e) => updateProduct(i, 'costPerUnit', Number(e.target.value))}
                sx={{ width: 120 }}
                inputProps={{ min: 0, step: 0.01 }}
              />
              <TextField
                label="Expected Units"
                type="number"
                size="small"
                value={product.expectedUnits}
                onChange={(e) => updateProduct(i, 'expectedUnits', Number(e.target.value))}
                sx={{ width: 150 }}
                inputProps={{ min: 0, step: 1 }}
              />
            </Box>
          </Box>
        ))}

        <Divider sx={{ my: 2 }} />

        <Typography variant="body1">
          <strong>Current Total Revenue:</strong> R{totalRevenue.toFixed(2)}
        </Typography>
        <Typography variant="body1">
          <strong>Current Total Variable Costs:</strong> R{totalCostsVariable.toFixed(2)}
        </Typography>
        <Typography variant="body1">
          <strong>Current Fixed Costs:</strong> R{safeFixedCosts.toFixed(2)}
        </Typography>
        <Typography variant="body1">
          <strong>Current Total Costs:</strong> R{totalCosts.toFixed(2)}
        </Typography>
        <Typography variant="body1">
          <strong>Current Total Profit:</strong> R{totalProfit.toFixed(2)}
        </Typography>
        {useMargin && margin !== null && (
          <Typography variant="body1">
            <strong>Current Margin:</strong> {margin.toFixed(2)}%
          </Typography>
        )}
        
        {Object.keys(allSimulatedPaths).length > 0 && (
            <Box mt={4}>
              <Typography variant="h6" gutterBottom>
                Simulated Ending Price Summary ({timeHorizonMonths} months)
              </Typography>
              <Grid container spacing={2}>
                  {editableProducts.map(p => {
                      const finalPrices = allSimulatedPaths[p.name].map(path => path[path.length - 1]);
                      const avgFinalPrice = finalPrices.reduce((sum, val) => sum + val, 0) / finalPrices.length;
                      const minFinalPrice = Math.min(...finalPrices);
                      const maxFinalPrice = Math.max(...finalPrices);
                      return (
                          <Grid item xs={12} sm={6} md={4} key={`summary-${p.name}`}>
                              <Card variant="outlined" sx={{ p: 2 }}>
                                  <Typography variant="subtitle1" fontWeight="bold">{p.name}</Typography>
                                  <Typography>Avg. End Price: R{avgFinalPrice.toFixed(2)}</Typography>
                                  <Typography>Min End Price: R{minFinalPrice.toFixed(2)}</Typography>
                                  <Typography>Max End Price: R{maxFinalPrice.toFixed(2)}</Typography>
                              </Card>
                          </Grid>
                      );
                  })}
              </Grid>
            </Box>
        )}

        {/* NEW: Display Simulated Financial Outcomes */}
        {simulatedTotalProfit !== null && (
            <Box mt={4}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Simulated Financial Outcome (Average after {timeHorizonMonths} months)
              </Typography>
              <Typography variant="body1">
                <strong>Simulated Total Revenue:</strong> R{simulatedTotalRevenue?.toFixed(2)}
              </Typography>
              <Typography variant="body1">
                <strong>Simulated Total Profit:</strong> R{simulatedTotalProfit?.toFixed(2)}
              </Typography>
              {useMargin && simulatedMargin !== null && (
                  <Typography variant="body1">
                      <strong>Simulated Margin:</strong> {simulatedMargin.toFixed(2)}%
                  </Typography>
              )}
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                *This reflects the average financial outcome if product prices moved according to the simulation parameters, based on your current expected units and costs.
              </Typography>
            </Box>
        )}

      </CardContent>
    </Card>
  );
};

export default WhatIfScenariosTab;
