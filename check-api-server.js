// Quick check script to see what the API server is doing
import fetch from 'node-fetch';

async function checkAPI() {
  try {
    console.log('Checking API server...');
    
    // Test health
    const health = await fetch('http://localhost:3001/api/health');
    const healthData = await health.json();
    console.log('✅ Health check:', healthData);
    
    // Test balance
    try {
      const balance = await fetch('http://localhost:3001/api/account/balance');
      const balanceData = await balance.json();
      console.log('Balance response:', balanceData);
      
      if (balanceData.error) {
        console.log('❌ Error:', balanceData.error);
        console.log('Message:', balanceData.message);
        console.log('Code:', balanceData.code);
        console.log('Hint:', balanceData.hint);
      } else {
        console.log('✅ Balance:', balanceData.balance);
      }
    } catch (error) {
      console.error('❌ Failed to get balance:', error.message);
    }
    
  } catch (error) {
    console.error('❌ API server not responding:', error.message);
    console.log('💡 Make sure API server is running: npm run dev:api');
  }
}

checkAPI();

