// QuotationsPage.jsx
import React, { useState, useEffect } from 'react';
import styles from './PricingPage.module.css'; // Re-use your existing styles
import { useNavigate } from 'react-router-dom';
const QuotationsPage = () => {
    // -----------------------------------------------------------
    // 1. State Management
    // -----------------------------------------------------------

    // This array will hold the selected products for the current quotation
    const [quotedProducts, setQuotedProducts] = useState([]);
    // Counter for unique product IDs in the quote
    const [nextQuoteProductId, setNextQuoteProductId] = useState(1);
    // State to hold potential design costs (e.g., from Aggreneth/Isabel)
    const [designCost, setDesignCost] = useState(0);
    // State to hold potential sample costs and handling fees
    const [sampleCost, setSampleCost] = useState(0);
    const [handlingCost, setHandlingCost] = useState(0);


    // -----------------------------------------------------------
    // 2. Data Definition (from TBS PROCESS FLOW DOCUMENT - MAY 2025.docx)
    //    This could also come from a backend API in a real application.
    // -----------------------------------------------------------

    const allAvailableProducts = [
        // Green Event Branding
        { id: 'expoStands', name: 'EXPO STANDS', category: 'Green Event Branding', unitCost: 0, notes: "Design service is sometimes part of the offering." },
        { id: 'ecoGifts', name: 'ECO GIFTS/MERCH/SEEDED PAPER', category: 'Green Event Branding', unitCost: 0, minQuantity: 10, notes: "Minimum Quantity of 10 units." },
        { id: 'paperBags', name: 'PAPER BAGS', category: 'Green Event Branding', unitCost: 0, minQuantity: 500, notes: "Printed on our paperbag machine – Minimum Quantity of 500 units." },
        { id: 'sustainableFashionBags', name: 'SUSTAINABLE FASHION BAGS & ACCESSORIES', category: 'Green Event Branding', unitCost: 0, minQuantity: 20, maxQuantity: 25, notes: "Minimum Order Quantity 20-25 bags." },
        { id: 'digitalBusinessCards', name: 'DIGITAL BUSINESS CARDS', category: 'Green Event Branding', unitCost: 0, minQuantity: 10, notes: "Minimum Order Quantity is 10 cards." },
        { id: 'upcyclingCollateral', name: 'UPCYCLING OUTDATED COLLATERAL', category: 'Green Event Branding', unitCost: 0, notes: "New offering, supplier is Judy. Need to check available material and make recommendations before quoting." },

        // Outdoor Advertising/Large Format Printing
        { id: 'billboardsSignage', name: 'BILLBOARDS/SIGNAGE', category: 'Outdoor Advertising', unitCost: 0, notes: "Design service is sometimes part of the offering." },
        { id: 'printCollateral', name: 'PRINT COLLATERAL (Fliers, Catalogues, Stickers etc.)', category: 'Outdoor Advertising', unitCost: 0, minQuantity: 250, notes: "MOQ of 250." },
        { id: 'correxBoards', name: 'CORREX BOARDS', category: 'Outdoor Advertising', unitCost: 0, minQuantity: 10, notes: "MOQ of 10." },
        { id: 'posters', name: 'POSTERS', category: 'Outdoor Advertising', unitCost: 0, minQuantity: 10, notes: "MOQ of 10." },
        { id: 'marketingCollateral', name: 'MARKETING COLLATERAL (Flags, Gazebos etc.)', category: 'Outdoor Advertising', unitCost: 0, notes: "Items from National Flag/Adway." },
        { id: 'streetpoleAdvertising', name: 'STREETPOLE/OUTDOOR ADVERTISING', category: 'Outdoor Advertising', unitCost: 0, notes: "Design service is sometimes part of the offering." },

        // ESG Consulting
        { id: 'esgConsulting', name: 'ESG CONSULTING', category: 'ESG Consulting', unitCost: 0, notes: "New offering. Partnering with Tonderirai (ESG Consultant) and Grace (Fair Trade)." }
    ];

    // -----------------------------------------------------------
    // 3. Helper Functions
    // -----------------------------------------------------------

    // Function to add a product to the quote
    const addProductToQuote = (productId) => {
        const productToAdd = allAvailableProducts.find(p => p.id === productId);
        if (productToAdd) {
            setQuotedProducts([
                ...quotedProducts,
                {
                    ...productToAdd,
                    quoteId: nextQuoteProductId, // Unique ID for this specific instance in the quote
                    quantity: productToAdd.minQuantity || 1, // Default to MOQ or 1
                    // For now, unitCost is 0. In a real app, this might come from a pricing matrix
                    // or be an input field for the user to override based on supplier quotes.
                    // For now, let's assume `unitCost` in `allAvailableProducts` is a placeholder.
                    // You'll need an actual method to get supplier costs.
                    supplierCost: 0, // This is what you pay the supplier
                    markupPercentage: 30, // Default markup for now
                }
            ]);
            setNextQuoteProductId(nextQuoteProductId + 1);
        }
    };

    // Function to update quantity or markup for a quoted product
    const updateQuotedProduct = (quoteId, field, value) => {
        setQuotedProducts(quotedProducts.map(p =>
            p.quoteId === quoteId ? { ...p, [field]: value } : p
        ));
    };

    // Function to remove a product from the quote
    const removeQuotedProduct = (quoteId) => {
        setQuotedProducts(quotedProducts.filter(p => p.quoteId !== quoteId));
    };

    // Calculate Selling Price for a single product in the quote
    const calculateProductSellingPrice = (supplierCost, markupPercentage) => {
        if (supplierCost <= 0 || markupPercentage <= 0) return 0;
        return supplierCost / (1 - (markupPercentage / 100)); // Calculate price based on markup
    };

    // Calculate Total Price for a product line item
    const calculateLineItemTotal = (product) => {
        const sellingPrice = calculateProductSellingPrice(product.supplierCost, product.markupPercentage);
        return sellingPrice * product.quantity;
    };

    // Calculate Grand Total for the entire quote
    const calculateGrandTotal = () => {
        const productsTotal = quotedProducts.reduce((sum, product) => sum + calculateLineItemTotal(product), 0);
        return productsTotal + designCost + sampleCost + handlingCost;
    };


    // -----------------------------------------------------------
    // 4. Render UI
    // -----------------------------------------------------------
    return (
        <div className={styles.dashboardContainer}> {/* Re-use main container style */}
            <h1 className={styles.pageTitle}>Generate Quotation</h1>

            <div className={styles.card}>
                <h3 className={styles.cardTitle}>Add Products to Quote</h3>
                <div className={styles.inputGroup}>
                    <label htmlFor="productSelect" className={styles.label}>Select Product:</label>
                    <select
                        id="productSelect"
                        className={styles.select}
                        onChange={(e) => addProductToQuote(e.target.value)}
                        value="" // Reset select after selection
                    >
                        <option value="">-- Choose a Product --</option>
                        {allAvailableProducts.map(product => (
                            <option key={product.id} value={product.id}>
                                {product.name} ({product.category})
                            </option>
                        ))}
                    </select>
                    <p className={styles.inputHelperText}>
                        Select an item from our offerings to add it to your quotation.
                    </p>
                </div>
            </div>

            <div className={styles.card}>
                <h3 className={styles.cardTitle}>Quotation Details</h3>
                {quotedProducts.length === 0 ? (
                    <p className={styles.csvEmptyState}>No products added to the quote yet. Select one above!</p>
                ) : (
                    <>
                        <div className={styles.quotationItemsContainer}> {/* New style for quote items */}
                            {quotedProducts.map(product => (
                                <div key={product.quoteId} className={styles.productInputGroup}> {/* Re-use product group style */}
                                    <h5 className={styles.productGroupTitle}>{product.name}</h5>
                                    {product.notes && (
                                        <p className={styles.inputHelperText} style={{ textAlign: 'center', fontStyle: 'italic', color: '#888' }}>
                                            Note: {product.notes}
                                        </p>
                                    )}

                                    {/* Supplier Cost Input */}
                                    <label className={styles.label}>Supplier Cost (R) (per unit)</label>
                                    <input
                                        type="number"
                                        value={product.supplierCost}
                                        onChange={(e) => updateQuotedProduct(product.quoteId, 'supplierCost', Number(e.target.value))}
                                        className={styles.input}
                                        min="0"
                                        placeholder="e.g., 100"
                                    />

                                    {/* Quantity Input */}
                                    <label className={styles.label}>Quantity</label>
                                    <input
                                        type="number"
                                        value={product.quantity}
                                        onChange={(e) => updateQuotedProduct(product.quoteId, 'quantity', Number(e.target.value))}
                                        className={styles.input}
                                        min={product.minQuantity || 1}
                                        max={product.maxQuantity || undefined}
                                        placeholder={`Min: ${product.minQuantity || 1}`}
                                    />
                                     {product.minQuantity && product.quantity < product.minQuantity && (
                                        <p className={styles.insightText} style={{color: '#dc3545'}}>
                                            Quantity must be at least {product.minQuantity} units.
                                        </p>
                                    )}
                                    {product.maxQuantity && product.quantity > product.maxQuantity && (
                                        <p className={styles.insightText} style={{color: '#dc3545'}}>
                                            Quantity cannot exceed {product.maxQuantity} units.
                                        </p>
                                    )}


                                    {/* Markup Percentage Input */}
                                    <label className={styles.label}>Your Markup Percentage (%)</label>
                                    <input
                                        type="number"
                                        value={product.markupPercentage}
                                        onChange={(e) => updateQuotedProduct(product.quoteId, 'markupPercentage', Number(e.target.value))}
                                        className={styles.input}
                                        min="0"
                                        max="100" // Markup can't be more than 100% on cost (though margin can)
                                        placeholder="e.g., 30"
                                    />

                                    {/* Line Item Summary */}
                                    <div className={styles.metricCardNoBorder}> {/* New style for summary within product group */}
                                        <div className={styles.metricItem}>
                                            <span className={styles.metricLabel}>Selling Price Per Unit:</span>
                                            <span className={styles.metricValue}>
                                                R {calculateProductSellingPrice(product.supplierCost, product.markupPercentage).toFixed(2)}
                                            </span>
                                        </div>
                                        <div className={styles.metricItem}>
                                            <span className={styles.metricLabel}>Line Item Total:</span>
                                            <span className={styles.metricValue}>
                                                R {calculateLineItemTotal(product).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => removeQuotedProduct(product.quoteId)}
                                        className={styles.removeProductButton}
                                    >
                                        Remove Item
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Additional Costs Section */}
                        <h4 className={styles.cardSubTitle}>Additional Costs</h4>
                        <p className={styles.inputHelperText}>
                            (e.g., for graphic design  or samples )
                        </p>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Graphic Design Cost (R) (from Aggreneth/Isabel)</label>
                            <input
                                type="number"
                                value={designCost}
                                onChange={(e) => setDesignCost(Number(e.target.value))}
                                className={styles.input}
                                min="0"
                                placeholder="e.g., 500"
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Sample Cost (R)</label>
                            <input
                                type="number"
                                value={sampleCost}
                                onChange={(e) => setSampleCost(Number(e.target.value))}
                                className={styles.input}
                                min="0"
                                placeholder="e.g., 150"
                            />
                        </div>
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>Handling Cost (R) (for samples)</label>
                            <input
                                type="number"
                                value={handlingCost}
                                onChange={(e) => setHandlingCost(Number(e.target.value))}
                                className={styles.input}
                                min="0"
                                placeholder="e.g., 50"
                            />
                        </div>

                        {/* Grand Total */}
                        <div className={styles.metricCard} style={{ marginTop: '2rem' }}>
                            <h4 className={styles.metricCardTitle}>Quotation Summary</h4>
                            <div className={styles.metricItem}>
                                <span className={styles.metricLabel}>Subtotal (Products):</span>
                                <span className={styles.metricValue}>R {quotedProducts.reduce((sum, product) => sum + calculateLineItemTotal(product), 0).toFixed(2)}</span>
                            </div>
                            <div className={styles.metricItem}>
                                <span className={styles.metricLabel}>Graphic Design Cost:</span>
                                <span className={styles.metricValue}>R {designCost.toFixed(2)}</span>
                            </div>
                            <div className={styles.metricItem}>
                                <span className={styles.metricLabel}>Sample Cost:</span>
                                <span className={styles.metricValue}>R {sampleCost.toFixed(2)}</span>
                            </div>
                            <div className={styles.metricItem}>
                                <span className={styles.metricLabel}>Sample Handling Cost:</span>
                                <span className={styles.metricValue}>R {handlingCost.toFixed(2)}</span>
                            </div>
                            <hr className={styles.divider} />
                            <div className={styles.metricItem}>
                                <span className={styles.metricLabel} style={{ fontSize: '1.2rem', fontWeight: '700' }}>GRAND TOTAL:</span>
                                <span className={styles.metricValue} style={{ fontSize: '1.4rem', color: '#c88a31' }}>R {calculateGrandTotal().toFixed(2)}</span>
                            </div>
                        </div>
                    </>
                )}
            </div>
            {/* You might add a "Print Quote" or "Save Quote" button here later */}
        </div>
    );
};

export default QuotationsPage;