import React from 'react';
import {
  Box,
  Typography,
  Alert,
  Button,
  Card,
  CardContent,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface Product {
  name: string;
  expectedUnits: number;
  cost: number; // This might represent initial cost if costPerUnit is not set
  price: number;
  costPerUnit?: number; // Cost per unit (variable cost)
  percentage?: number;  // % revenue assigned (optional)
}

interface ResultsTabProps {
  products: Product[];
  totalRevenue: number;
  // totalCosts: number; // This prop is now redundant as we calculate overall costs here
  targetProfit: number;
  actualCost: number; // This is your fixed cost (from totalCost or individualCosts sum)
  useMargin: boolean;
  targetMargin: number;
  calculatePrices: () => void;
  error?: string;
}

const ResultsTab: React.FC<ResultsTabProps> = ({
  products,
  totalRevenue, // This is the total revenue calculated by calculatePrices (which now includes all costs)
  // totalCosts, // Removed, as we will derive the total from fixed and variable costs
  targetProfit,
  actualCost, // This is explicitly your fixed cost
  useMargin,
  targetMargin,
  calculatePrices,
  error
}) => {
  // Safe number parser
  const safeNumber = (value: any) => {
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  // Calculate total variable costs based on current product data
  const currentTotalVariableCosts = products.reduce((sum, product) => {
    const costPerUnit = safeNumber(product.costPerUnit ?? product.cost);
    const expectedUnits = safeNumber(product.expectedUnits);
    return sum + (costPerUnit * expectedUnits);
  }, 0);

  // Overall total costs (Fixed + Variable)
  const currentOverallTotalCosts = safeNumber(actualCost) + currentTotalVariableCosts;

  // Calculate total revenue required based on margin or profit
  // This needs to use the overall total costs to be consistent with PricingPage's calculatePrices
  const totalRevenueRequired = useMargin
    ? currentOverallTotalCosts / (1 - safeNumber(targetMargin) / 100)
    : currentOverallTotalCosts + safeNumber(targetProfit);

  // Calculate the actual profit and margin based on the totalRevenue (from PricingPage)
  const currentTotalProfit = safeNumber(totalRevenue) - currentOverallTotalCosts;
  const currentMargin = safeNumber(totalRevenue) > 0 ? (currentTotalProfit / safeNumber(totalRevenue)) * 100 : 0;


  // Calculate units needed per product to meet revenue target
  const productsWithUnitsNeeded = products.map((product) => {
    const price = safeNumber(product.price);
    const cost = safeNumber(product.costPerUnit ?? product.cost); // Use costPerUnit
    const pct = product.percentage ?? (100 / products.length); // Fallback if percentage is missing

    // Revenue expected from this product based on its percentage share of the overall totalRevenue
    const expectedRevenue = (pct / 100) * safeNumber(totalRevenue);

    // Units needed = revenue needed / price per unit (avoid division by zero)
    const unitsNeeded = price > 0 ? Math.ceil(expectedRevenue / price) : 0;

    // Calculate break-even units for THIS PRODUCT to cover *its share of fixed costs*
    // This is a bit tricky. A common break-even analysis covers total fixed costs.
    // If you want break-even per product, it's typically (Product's Share of Fixed Costs) / (Unit Contribution Margin)
    // Or, to cover ALL fixed costs (actualCost) with this product ONLY:
    // breakEvenUnits = actualCost / (price - cost)
    // Let's refine break-even units calculation:
    const contributionMarginPerUnit = price - cost;
    // Break-even to cover *total fixed costs* with just this product (simplistic but common understanding)
    const breakEvenUnitsForFixedCosts = contributionMarginPerUnit > 0 ?
                                        Math.ceil(safeNumber(actualCost) / contributionMarginPerUnit) :
                                        Infinity; // If no contribution margin, can't break even

    // Calculate margin % for the individual product
    const productMargin = price > 0 ? ((price - cost) / price) * 100 : 0;

    return {
      ...product,
      price,
      cost, // This will be the cost per unit
      margin: productMargin, // Renamed to productMargin to avoid confusion
      unitsNeeded,
      expectedRevenue,
      breakEvenUnits: breakEvenUnitsForFixedCosts, // Using the fixed cost break-even
    };
  });

  // Sort products by margin descending for profitability ranking
  const productsSortedByMargin = [...productsWithUnitsNeeded].sort((a, b) => b.margin - a.margin);

  // Prepare chart data for revenue vs cost using expectedUnits (actual planned sales)
  const chartData = productsWithUnitsNeeded.map((p) => ({
    name: p.name || 'Unnamed',
    Revenue: p.price * (p.expectedUnits || 1),
    Cost: (p.costPerUnit ?? p.cost) * (p.expectedUnits || 1), // Use costPerUnit for product cost
  }));

  return (
    <Card elevation={3} sx={{ width: '100%', maxWidth: '800px', mx: 'auto' }}>
      <CardContent>
        <Box display="flex" flexDirection="column" alignItems="center">
          <Typography variant="h5" gutterBottom>
            Calculated Prices & Insights
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
              {error}
            </Alert>
          )}

          {/* Product Profitability & Units Needed */}
          <Box width="100%" mb={3}>
            {productsWithUnitsNeeded.map((product, index) => {
              const margin = product.margin; // Using productMargin here
              const marginColor =
                margin < 0 ? 'red' : margin < 20 ? 'orange' : 'green';
              const insight =
                margin < 0
                  ? 'Unprofitable: Increase price or reduce cost.'
                  : margin < 20
                  ? 'Low margin: Consider adjusting price.'
                  : 'Good margin.';
              const insightSeverity =
                margin < 0 ? 'error' : margin < 20 ? 'warning' : 'success';

              return (
                <Box
                  key={index}
                  display="flex"
                  flexDirection="column"
                  justifyContent="space-between"
                  alignItems="flex-start"
                  py={1}
                  sx={{ borderBottom: '1px solid #ddd', mb: 1 }}
                >
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    width="100%"
                    alignItems="center"
                  >
                    <Box>
                      <Typography fontWeight={600}>
                        {product.name || 'Unnamed Product'}
                      </Typography>
                      <Typography fontSize="0.875rem" color="text.secondary">
                        Cost per Unit: R{product.cost.toFixed(2)} | Price: R{product.price.toFixed(2)}
                      </Typography>
                      <Typography fontSize="0.875rem" color="text.secondary">
                        Expected Revenue Contribution: R{product.expectedRevenue.toFixed(2)}
                      </Typography>
                    </Box>
                    <Typography fontWeight={600} color={marginColor}>
                      Margin: {margin.toFixed(1)}%
                    </Typography>
                  </Box>

                  <Alert severity={insightSeverity as any} sx={{ mt: 1, width: '100%' }}>
                    {insight}
                  </Alert>

                  <Typography mt={1} fontStyle="italic">
                    Units Needed to Sell to Meet Target: <strong>{product.unitsNeeded}</strong>
                  </Typography>

                  {/* New break-even units display, handle Infinity */}
                  <Typography mt={0.5} fontStyle="italic" color={product.breakEvenUnits === Infinity ? 'error.main' : 'text.secondary'}>
                    Break-Even Units to Cover Total Fixed Costs (for this product only): <strong>
                      {product.breakEvenUnits === Infinity ? 'N/A (Product Unprofitable)' : product.breakEvenUnits}
                    </strong>
                  </Typography>
                </Box>
              );
            })}
          </Box>

          {/* Profitability Ranking */}
          <Box width="100%" mb={3}>
            <Typography variant="h6" gutterBottom>
              Profitability Ranking (by Margin %)
            </Typography>
            {productsSortedByMargin.map((p, i) => (
              <Typography key={p.name + i} color={p.margin < 0 ? 'error.main' : 'inherit'}>
                {i + 1}. {p.name}: {p.margin.toFixed(1)}%
              </Typography>
            ))}
          </Box>

          {/* Revenue vs Cost Chart */}
          <Box width="100%" height={300} mb={3}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="Revenue" fill="#4caf50" />
                <Bar dataKey="Cost" fill="#f44336" />
              </BarChart>
            </ResponsiveContainer>
          </Box>

          {/* Summary & Calculation */}
          <Box mt={3} width="100%">
            <Typography>
              <strong>Total Revenue Calculated:</strong> R{safeNumber(totalRevenue).toFixed(2)}
            </Typography>
            <Typography>
              <strong>Current Fixed Costs:</strong> R{safeNumber(actualCost).toFixed(2)}
            </Typography>
            <Typography>
              <strong>Current Total Variable Costs:</strong> R{currentTotalVariableCosts.toFixed(2)}
            </Typography>
            <Typography>
              <strong>Current Overall Total Costs:</strong> R{currentOverallTotalCosts.toFixed(2)}
            </Typography>
            <Typography>
              <strong>Current Total Profit:</strong> R{currentTotalProfit.toFixed(2)}
            </Typography>
            <Typography>
              <strong>Current Margin:</strong> {currentMargin.toFixed(2)}%
            </Typography>
            <Typography sx={{ mt: 2, fontStyle: 'italic' }}>
              {useMargin
                ? `Target margin used: ${targetMargin}%`
                : 'Target profit used'}
            </Typography>
          </Box>

          <Button
            variant="contained"
            color="success"
            onClick={calculatePrices}
            sx={{ mt: 3, width: '100%' }}
          >
            Recalculate Prices
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ResultsTab;