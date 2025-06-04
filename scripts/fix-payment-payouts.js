// This script specifically fixes the foreign key constraint
// between Payments and Payouts tables
const fs = require('fs').promises;

async function fixPaymentPayoutRelationship() {
  try {
    // Read the payments and payouts data
    const paymentsStr = await fs.readFile('payments.json', { encoding: 'utf8' });
    const payoutsStr = await fs.readFile('payouts.json', { encoding: 'utf8' });
    
    const payments = JSON.parse(paymentsStr);
    const payouts = JSON.parse(payoutsStr);
    
    console.log(`Found ${payments.length} payments and ${payouts.length} payouts`);
    
    // Get all valid payout IDs
    const validPayoutIds = payouts.map(payout => payout.id);
    console.log('Valid payout IDs:', validPayoutIds);
    
    // Check which payments have invalid payout IDs
    const paymentsWithInvalidPayouts = payments.filter(
      payment => payment.payoutId && !validPayoutIds.includes(payment.payoutId)
    );
    
    console.log(`Found ${paymentsWithInvalidPayouts.length} payments with invalid payout IDs`);
    
    if (paymentsWithInvalidPayouts.length > 0) {
      console.log('Invalid payment-payout relationships:');
      paymentsWithInvalidPayouts.forEach(payment => {
        console.log(`Payment ID: ${payment.id}, Invalid Payout ID: ${payment.payoutId}`);
      });
      
      // Fix the payments
      payments.forEach(payment => {
        if (payment.payoutId && !validPayoutIds.includes(payment.payoutId)) {
          console.log(`Fixing payment ${payment.id} with invalid payout ID ${payment.payoutId}`);
          
          // Either set to null or to a valid payout ID
          if (validPayoutIds.length > 0) {
            // Try to find a matching payout by looking at matching details
            // For now we'll just use the first valid payout ID
            payment.payoutId = null; // First set to null, then we'll fix it below
          } else {
            payment.payoutId = null;
          }
        }
      });
      
      // For the specific error in your logs:
      // Key (payoutId)=(c7d8e9f0-a1b2-9c3d-4e5f-6a7b8c9d0e1f) is not present in table "Payouts"
      // We need to either:
      // 1. Create a matching payout with this ID
      // 2. Update the payment to reference a valid payout ID
      // 3. Set the payoutId to null
      
      // Let's create missing payouts
      const paymentIdToProviderIdMap = {
        'a5b6c7d8-e9f0-8a1b-2c3d-4e5f6a7b8c9d': 'f47ac10b-58cc-4372-a567-0e02b2c3d480', // Jane Smith
        'b6c7d8e9-f0a1-9b2c-3d4e-5f6a7b8c9d0e': 'f47ac10b-58cc-4372-a567-0e02b2c3d482', // Sarah Provider
        'c7d8e9f0-a1b2-0c3d-4e5f-6a7b8c9d0e1f': 'f47ac10b-58cc-4372-a567-0e02b2c3d484'  // Tech Repair
      };
      
      // Create missing payouts for payments that need them
      paymentsWithInvalidPayouts.forEach(payment => {
        // Create a new payout with the same ID that's referenced in the payment
        const missingPayoutId = payment.payoutId;
        const providerId = paymentIdToProviderIdMap[payment.id] || 'f47ac10b-58cc-4372-a567-0e02b2c3d480';
        
        // Calculate payout details based on payment
        const amount = payment.amount || 0;
        const fees = amount * 0.15; // Assuming 15% fee
        const netAmount = amount - fees;
        
        const newPayout = {
          "id": missingPayoutId,
          "providerId": providerId,
          "amount": amount,
          "fees": fees,
          "netAmount": netAmount,
          "currency": "USD",
          "status": "completed",
          "payoutMethod": "bank_transfer",
          "payoutDetails": {
            "bankName": "Bank of America",
            "accountType": "checking",
            "last4": "1234"
          },
          "scheduledDate": payment.paymentDate,
          "processedDate": payment.paymentDate, // Same as payment date
          "reference": `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 1000)}`,
          "createdAt": payment.createdAt,
          "updatedAt": payment.updatedAt
        };
        
        // Add the new payout to our payouts array
        payouts.push(newPayout);
        console.log(`Created new payout ${missingPayoutId} for payment ${payment.id}`);
      });
      
      // Write the updated files
      await fs.writeFile('payments.json', JSON.stringify(payments, null, 2));
      await fs.writeFile('payouts.json', JSON.stringify(payouts, null, 2));
      
      console.log("Successfully fixed payment-payout relationships!");
    } else {
      console.log("No payments with invalid payout IDs found.");
    }
  } catch (error) {
    console.error('Error fixing payment-payout relationships:', error);
  }
}

// Run the function
fixPaymentPayoutRelationship()
  .then(() => console.log('Done!'))
  .catch(error => console.error('Script error:', error));
  