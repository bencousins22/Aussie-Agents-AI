






import { swarm } from './swarm';







describe('SwarmOrchestrator (Integration)', () => {



  const apiKey = process.env.JULES_API_KEY;



  const itif = (condition: any) => condition ? it : it.skip;







  itif(apiKey)('should use the real Jules API to execute a task', async () => {



    const task = 'Create a simple boba app'; // Use a simple, non-destructive task



    



    const result = await swarm.executeTask(task, 'integration-test', {



      consensusThreshold: 0.5,



      enableQuantum: false, // Keep it simple for the test



    });







    expect(result.status).toBe('success');



    expect(result.details).toBeDefined();



    expect(result.details.id).toBeDefined();







  }, 150000); // Increase timeout significantly for real API calls



});







  