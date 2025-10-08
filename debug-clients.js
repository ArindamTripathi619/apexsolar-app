const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugClients() {
  try {
    console.log('🔍 Checking clients table...');
    
    // Check if any clients exist
    const clientCount = await prisma.client.count();
    console.log(`📊 Total clients in database: ${clientCount}`);
    
    // Fetch all clients
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10 // Limit to 10 most recent
    });
    
    console.log('📋 Recent clients:');
    clients.forEach((client, index) => {
      console.log(`${index + 1}. ${client.companyName} (ID: ${client.id})`);
      console.log(`   GST: ${client.gstNumber || 'Not provided'}`);
      console.log(`   Created: ${client.createdAt}`);
      console.log('');
    });
    
    // Test creating a simple client
    console.log('🧪 Testing client creation...');
    const testClient = await prisma.client.create({
      data: {
        companyName: 'Test Company Debug',
        addressLine1: 'Test Address',
        gstNumber: '19AACN8612L1Z5'
      }
    });
    
    console.log('✅ Test client created successfully:', testClient.id);
    
    // Clean up test client
    await prisma.client.delete({
      where: { id: testClient.id }
    });
    
    console.log('🧹 Test client cleaned up');
    
  } catch (error) {
    console.error('❌ Error debugging clients:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugClients();
