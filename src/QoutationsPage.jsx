// QuotationsPage.jsx
import React, { useState, useRef } from 'react'; // Added useRef for printing
import styles from './PricingPage.module.css';
import { useNavigate } from 'react-router-dom';

const QuotationsPage = () => {
    const navigate = useNavigate(); // Initialize useNavigate
    // -----------------------------------------------------------
    // 1. State Management
    // -----------------------------------------------------------

    const [quotedProducts, setQuotedProducts] = useState([]);
    const [nextQuoteProductId, setNextQuoteProductId] = useState(1);
    const [designCost, setDesignCost] = useState(0);
    const [sampleCost, setSampleCost] = useState(0);
    const [handlingCost, setHandlingCost] = useState(0);

    // New states for Terms and Conditions and Download
    const [showTerms, setShowTerms] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [customerName, setCustomerName] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [quotationDate, setQuotationDate] = useState(new Date().toISOString().slice(0, 10)); // Default to today's date

    // Ref for the quotation content to be printed/downloaded
    const quotationContentRef = useRef(null);

    // -----------------------------------------------------------
    // 2. Data Definition
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

    const addProductToQuote = (productId) => {
        const productToAdd = allAvailableProducts.find(p => p.id === productId);
        if (productToAdd) {
            setQuotedProducts([
                ...quotedProducts,
                {
                    ...productToAdd,
                    quoteId: nextQuoteProductId,
                    quantity: productToAdd.minQuantity || 1,
                    supplierCost: 0,
                    markupPercentage: 30,
                }
            ]);
            setNextQuoteProductId(nextQuoteProductId + 1);
        }
    };

    const updateQuotedProduct = (quoteId, field, value) => {
        setQuotedProducts(quotedProducts.map(p =>
            p.quoteId === quoteId ? { ...p, [field]: value } : p
        ));
    };

    const removeQuotedProduct = (quoteId) => {
        setQuotedProducts(quotedProducts.filter(p => p.quoteId !== quoteId));
    };

    const calculateProductSellingPrice = (supplierCost, markupPercentage) => {
        if (supplierCost <= 0 || markupPercentage <= 0) return 0;
        return supplierCost / (1 - (markupPercentage / 100));
    };

    const calculateLineItemTotal = (product) => {
        const sellingPrice = calculateProductSellingPrice(product.supplierCost, product.markupPercentage);
        return sellingPrice * product.quantity;
    };

    const calculateGrandTotal = () => {
        const productsTotal = quotedProducts.reduce((sum, product) => sum + calculateLineItemTotal(product), 0);
        return productsTotal + designCost + sampleCost + handlingCost;
    };

    const generateQuotationContent = () => {
        const today = new Date().toLocaleDateString();
        let content = `
            <h1>Quotation for ${customerName || 'Client'}</h1>
            <p>Date: ${quotationDate}</p>
            <p>Email: ${customerEmail || 'N/A'}</p>
            <hr/>
            <h2>Quotation Items:</h2>
            <table border="1" style="width:100%; border-collapse: collapse;">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Category</th>
                        <th>Quantity</th>
                        <th>Supplier Cost (R)</th>
                        <th>Markup (%)</th>
                        <th>Selling Price (R/unit)</th>
                        <th>Line Total (R)</th>
                    </tr>
                </thead>
                <tbody>
        `;

        quotedProducts.forEach(product => {
            const sellingPricePerUnit = calculateProductSellingPrice(product.supplierCost, product.markupPercentage).toFixed(2);
            const lineTotal = calculateLineItemTotal(product).toFixed(2);
            content += `
                <tr>
                    <td>${product.name}</td>
                    <td>${product.category}</td>
                    <td>${product.quantity}</td>
                    <td>${product.supplierCost.toFixed(2)}</td>
                    <td>${product.markupPercentage}%</td>
                    <td>${sellingPricePerUnit}</td>
                    <td>${lineTotal}</td>
                </tr>
            `;
        });

        content += `
                </tbody>
            </table>
            <hr/>
            <h2>Additional Costs:</h2>
            <p>Graphic Design Cost: R ${designCost.toFixed(2)}</p>
            <p>Sample Cost: R ${sampleCost.toFixed(2)}</p>
            <p>Sample Handling Cost: R ${handlingCost.toFixed(2)}</p>
            <hr/>
            <h3>GRAND TOTAL: R ${calculateGrandTotal().toFixed(2)}</h3>
            <hr/>
            <h2>Terms and Conditions:</h2>
            <p>
                This quotation is valid for 30 days from the date of issue. All prices are in ZAR (South African Rand)
                and are subject to change based on material costs and supplier availability.
                A 50% deposit is required upon acceptance of this quotation, with the remaining 50% due upon delivery/completion.
                Lead times will be confirmed upon receipt of deposit.
                Custom designs and specific material requirements may incur additional costs.
                Cancellation of orders after deposit payment may result in forfeiture of the deposit, depending on the stage of production.
                Any changes to quantities or specifications after acceptance may require a revised quotation.
                Errors and omissions excepted (E&OE).
            </p>
            <p>For any queries, please contact Tshepiso Branding at info@tshepi-branding.com or +27 123 456 789.</p>
        `;
        return content;
    };

    const handleDownloadQuotation = () => {
        if (!termsAccepted) {
            alert("Please accept the Terms and Conditions to download the quotation.");
            return;
        }

        const htmlContent = generateQuotationContent();
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Quotation_TshepisoBranding_${customerName.replace(/\s/g, '_') || 'Unnamed'}_${quotationDate}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handlePrintQuotation = () => {
        if (!termsAccepted) {
            alert("Please accept the Terms and Conditions to print the quotation.");
            return;
        }
        // This opens a new window with the content and triggers print
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Tshepiso Branding Quotation</title>
                    <style>
                        body { font-family: sans-serif; margin: 20px; }
                        h1, h2, h3 { color: #c88a31; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f2f2f2; }
                        p { margin-bottom: 5px; }
                    </style>
                </head>
                <body>
                    ${generateQuotationContent()}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    };


    // -----------------------------------------------------------
    // 4. Render UI
    // -----------------------------------------------------------
    return (
        <div className={styles.dashboardContainer}>
            <button onClick={() => navigate('/')} className={styles.backButton}>
                &larr; Back to Home
            </button>
            <h1 className={styles.pageTitle}>Generate Quotation</h1>

            {/* Customer Details */}
            <div className={styles.card}>
                <h3 className={styles.cardTitle}>Customer Information</h3>
                <div className={styles.inputGroup}>
                    <label htmlFor="customerName" className={styles.label}>Customer Name:</label>
                    <input
                        type="text"
                        id="customerName"
                        className={styles.input}
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="e.g., John Doe"
                    />
                </div>
                <div className={styles.inputGroup}>
                    <label htmlFor="customerEmail" className={styles.label}>Customer Email:</label>
                    <input
                        type="email"
                        id="customerEmail"
                        className={styles.input}
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="e.g., john.doe@example.com"
                    />
                </div>
                <div className={styles.inputGroup}>
                    <label htmlFor="quotationDate" className={styles.label}>Quotation Date:</label>
                    <input
                        type="date"
                        id="quotationDate"
                        className={styles.input}
                        value={quotationDate}
                        onChange={(e) => setQuotationDate(e.target.value)}
                    />
                </div>
            </div>

            <div className={styles.card}>
                <h3 className={styles.cardTitle}>Add Products to Quote</h3>
                <div className={styles.inputGroup}>
                    <label htmlFor="productSelect" className={styles.label}>Select Product:</label>
                    <select
                        id="productSelect"
                        className={styles.select}
                        onChange={(e) => addProductToQuote(e.target.value)}
                        value=""
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
                        <div className={styles.quotationItemsContainer}>
                            {quotedProducts.map(product => (
                                <div key={product.quoteId} className={styles.productInputGroup}>
                                    <h5 className={styles.productGroupTitle}>{product.name}</h5>
                                    {product.notes && (
                                        <p className={styles.inputHelperText} style={{ textAlign: 'center', fontStyle: 'italic', color: '#888' }}>
                                            Note: {product.notes}
                                        </p>
                                    )}

                                    <label className={styles.label}>Supplier Cost (R) (per unit)</label>
                                    <input
                                        type="number"
                                        value={product.supplierCost}
                                        onChange={(e) => updateQuotedProduct(product.quoteId, 'supplierCost', Number(e.target.value))}
                                        className={styles.input}
                                        min="0"
                                        placeholder="e.g., 100"
                                    />

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
                                        <p className={styles.insightText} style={{ color: '#dc3545' }}>
                                            Quantity must be at least {product.minQuantity} units.
                                        </p>
                                    )}
                                    {product.maxQuantity && product.quantity > product.maxQuantity && (
                                        <p className={styles.insightText} style={{ color: '#dc3545' }}>
                                            Quantity cannot exceed {product.maxQuantity} units.
                                        </p>
                                    )}

                                    <label className={styles.label}>Your Markup Percentage (%)</label>
                                    <input
                                        type="number"
                                        value={product.markupPercentage}
                                        onChange={(e) => updateQuotedProduct(product.quoteId, 'markupPercentage', Number(e.target.value))}
                                        className={styles.input}
                                        min="0"
                                        max="100"
                                        placeholder="e.g., 30"
                                    />

                                    <div className={styles.metricCardNoBorder}>
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

                        <h4 className={styles.cardSubTitle}>Additional Costs</h4>
                        <p className={styles.inputHelperText}>
                            (e.g., for graphic design or samples)
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

                        {/* Download Quotation Button and Terms */}
                        <div className={styles.card} style={{ marginTop: '2rem', textAlign: 'center' }}>
                            {!showTerms ? (
                                <button
                                    onClick={() => setShowTerms(true)}
                                    className={styles.primaryButton} // Use a primary button style
                                    disabled={quotedProducts.length === 0} // Disable if no products in quote
                                >
                                    Review & Download Quotation
                                </button>
                            ) : (
                                <div className={styles.termsAndConditions}>
                                    <h3 className={styles.cardTitle}>Terms and Conditions</h3>
                                    <div className={styles.termsContent}>
                                        <p>
                                            This quotation is valid for 30 days from the date of issue. All prices are in ZAR (South African Rand)
                                            and are subject to change based on material costs and supplier availability.
                                            A 50% deposit is required upon acceptance of this quotation, with the remaining 50% due upon delivery/completion.
                                            Lead times will be confirmed upon receipt of deposit.
                                            Custom designs and specific material requirements may incur additional costs.
                                            Cancellation of orders after deposit payment may result in forfeiture of the deposit, depending on the stage of production.
                                            Any changes to quantities or specifications after acceptance may require a revised quotation.
                                            Errors and omissions excepted (E&OE).
                                        </p>
                                        <p>
                                            For any queries, please contact Tshepiso Branding at info@tshepi-branding.com or +27 123 456 789.
                                        </p>
                                        {/* You can add more detailed T&Cs here */}
                                    </div>
                                    <div className={styles.checkboxGroup}>
                                        <input
                                            type="checkbox"
                                            id="termsAccept"
                                            checked={termsAccepted}
                                            onChange={(e) => setTermsAccepted(e.target.checked)}
                                        />
                                        <label htmlFor="termsAccept" className={styles.label}>I have read and agree to the Terms and Conditions</label>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '1rem' }}>
                                        <button
                                            onClick={handleDownloadQuotation}
                                            className={styles.secondaryButton} // Use a secondary button style
                                            disabled={!termsAccepted}
                                        >
                                            Download Quotation (HTML)
                                        </button>
                                        <button
                                            onClick={handlePrintQuotation}
                                            className={styles.secondaryButton} // Use a secondary button style
                                            disabled={!termsAccepted}
                                        >
                                            Print Quotation (PDF/Paper)
                                        </button>
                                        <button
                                            onClick={() => setShowTerms(false)}
                                            className={styles.removeProductButton} // Use a less prominent button for close
                                        >
                                            Back to Quotation
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default QuotationsPage;