// Add this with your other routes
const paymentRoutes = require('./routes/paymentRoutes');
app.use('/api/payments', paymentRoutes);

app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));