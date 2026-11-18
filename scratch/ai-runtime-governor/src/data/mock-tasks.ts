import type { Task } from './types';

export const mockTasks: Task[] = [
  {
    id: 'TSK-10491', name: 'Customer refund analysis', description: 'Analyze customer refund eligibility based on purchase history and policy rules.',
    type: 'Agentic', difficulty: 'Medium', selectedModel: 'Medium', expectedCost: 1.10, actualCost: 0.38, baselineCost: 1.10,
    successProbability: 93, status: 'Success', createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), completedAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
    latency: 1.8, tokensSaved: 1200, inputTokens: 2500, outputTokens: 400, retries: 0,
  },
  {
    id: 'TSK-10492', name: 'Document summarization', description: 'Summarize a 12-page technical document into key points.',
    type: 'Summary', difficulty: 'Easy', selectedModel: 'Small', expectedCost: 0.29, actualCost: 0.08, baselineCost: 0.29,
    successProbability: 96, status: 'Success', createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), completedAt: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
    latency: 0.7, tokensSaved: 400, inputTokens: 1100, outputTokens: 200, retries: 0,
  },
  {
    id: 'TSK-10493', name: 'Financial risk analysis', description: 'Assess portfolio risk exposure using multi-factor analysis.',
    type: 'Reasoning', difficulty: 'Hard', selectedModel: 'Large', expectedCost: 1.48, actualCost: 1.21, baselineCost: 1.48,
    successProbability: 97, status: 'Success', createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), completedAt: new Date(Date.now() - 1000 * 60 * 41).toISOString(),
    latency: 3.9, tokensSaved: 800, inputTokens: 12000, outputTokens: 1500, retries: 0,
  },
  {
    id: 'TSK-10494', name: 'Code debugging', description: 'Identify and fix a null pointer exception in user authentication module.',
    type: 'Coding', difficulty: 'Medium', selectedModel: 'Medium', expectedCost: 0.95, actualCost: 0.44, baselineCost: 0.95,
    successProbability: 91, status: 'Success', createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), completedAt: new Date(Date.now() - 1000 * 60 * 58).toISOString(),
    latency: 2.1, tokensSaved: 1500, inputTokens: 3200, outputTokens: 600, retries: 0,
  },
  {
    id: 'TSK-10495', name: 'Sentiment classification', description: 'Classify customer review sentiment into positive, negative, or neutral.',
    type: 'Classification', difficulty: 'Easy', selectedModel: 'Small', expectedCost: 0.12, actualCost: 0.03, baselineCost: 0.12,
    successProbability: 94, status: 'Success', createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(), completedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    latency: 0.4, tokensSaved: 200, inputTokens: 1000, outputTokens: 50, retries: 0,
  },
  {
    id: 'TSK-10496', name: 'Multi-step research', description: 'Research competitive landscape and synthesize findings into a report.',
    type: 'Agentic', difficulty: 'Hard', selectedModel: 'Large', expectedCost: 2.50, actualCost: 2.10, baselineCost: 2.50,
    successProbability: 96, status: 'Success', createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), completedAt: new Date(Date.now() - 1000 * 60 * 115).toISOString(),
    latency: 5.2, tokensSaved: 1200, inputTokens: 15000, outputTokens: 4000, retries: 0,
  },
  {
    id: 'TSK-10497', name: 'Email draft', description: 'Draft a professional follow-up email to a client regarding project milestones.',
    type: 'Conversational', difficulty: 'Easy', selectedModel: 'Small', expectedCost: 0.18, actualCost: 0.05, baselineCost: 0.18,
    successProbability: 95, status: 'Success', createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(), completedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    latency: 0.6, tokensSaved: 300, inputTokens: 1200, outputTokens: 300, retries: 0,
  },
  {
    id: 'TSK-10498', name: 'Contract analysis', description: 'Review vendor contract for compliance risks and liability clauses.',
    type: 'Reasoning', difficulty: 'Medium', selectedModel: 'Medium', expectedCost: 1.20, actualCost: 0.52, baselineCost: 1.20,
    successProbability: 92, status: 'Success', createdAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(), completedAt: new Date(Date.now() - 1000 * 60 * 237).toISOString(),
    latency: 2.8, tokensSaved: 1800, inputTokens: 4500, outputTokens: 800, retries: 0,
  },
  {
    id: 'TSK-10499', name: 'Automated data pipeline generation', description: 'Generate ETL pipeline code for customer data ingestion.',
    type: 'Agentic', difficulty: 'Hard', selectedModel: 'Large', expectedCost: 2.80, actualCost: 1.50, baselineCost: 2.80,
    successProbability: 68, status: 'Failed', createdAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(), completedAt: new Date(Date.now() - 1000 * 60 * 292).toISOString(),
    latency: 8.4, tokensSaved: 0, inputTokens: 14000, outputTokens: 800, retries: 2,
  },
  {
    id: 'TSK-10500', name: 'Meeting notes summary', description: 'Summarize 45-minute team standup recording into action items.',
    type: 'Summary', difficulty: 'Easy', selectedModel: 'Small', expectedCost: 0.35, actualCost: 0.10, baselineCost: 0.35,
    successProbability: 90, status: 'Running', createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(), completedAt: null,
    latency: 1.2, tokensSaved: 500, inputTokens: 2000, outputTokens: 0, retries: 0,
  },
  {
    id: 'TSK-10501', name: 'React component refactor', description: 'Refactor class components to functional components with hooks.',
    type: 'Coding', difficulty: 'Medium', selectedModel: 'Medium', expectedCost: 1.15, actualCost: 0.65, baselineCost: 1.15,
    successProbability: 78, status: 'Retrying', createdAt: new Date(Date.now() - 1000 * 60 * 420).toISOString(), completedAt: null,
    latency: 3.1, tokensSaved: 0, inputTokens: 3800, outputTokens: 400, retries: 1,
  },
  {
    id: 'TSK-10502', name: 'Support ticket routing', description: 'Classify and route incoming support tickets to appropriate teams.',
    type: 'Classification', difficulty: 'Easy', selectedModel: 'Small', expectedCost: 0.15, actualCost: 0.04, baselineCost: 0.15,
    successProbability: 92, status: 'Success', createdAt: new Date(Date.now() - 1000 * 60 * 480).toISOString(), completedAt: new Date(Date.now() - 1000 * 60 * 480).toISOString(),
    latency: 0.35, tokensSaved: 250, inputTokens: 1100, outputTokens: 20, retries: 0,
  },
  {
    id: 'TSK-10503', name: 'Legal document review', description: 'Analyze a 30-page legal brief for key arguments and precedents.',
    type: 'Reasoning', difficulty: 'Hard', selectedModel: 'Large', expectedCost: 1.85, actualCost: 1.35, baselineCost: 1.85,
    successProbability: 97, status: 'Success', createdAt: new Date(Date.now() - 1000 * 60 * 540).toISOString(), completedAt: new Date(Date.now() - 1000 * 60 * 536).toISOString(),
    latency: 4.1, tokensSaved: 900, inputTokens: 10500, outputTokens: 2100, retries: 0,
  },
  {
    id: 'TSK-10504', name: 'Technical support chat', description: 'Handle a multi-turn technical support conversation about API integration.',
    type: 'Conversational', difficulty: 'Medium', selectedModel: 'Medium', expectedCost: 0.85, actualCost: 0.32, baselineCost: 0.85,
    successProbability: 94, status: 'Success', createdAt: new Date(Date.now() - 1000 * 60 * 600).toISOString(), completedAt: new Date(Date.now() - 1000 * 60 * 598).toISOString(),
    latency: 1.9, tokensSaved: 1100, inputTokens: 2800, outputTokens: 550, retries: 0,
  },
  {
    id: 'TSK-10505', name: 'System health check automation', description: 'Run automated health checks across microservices and generate a report.',
    type: 'Agentic', difficulty: 'Medium', selectedModel: 'Medium', expectedCost: 1.30, actualCost: 0.85, baselineCost: 1.30,
    successProbability: 65, status: 'Failed', createdAt: new Date(Date.now() - 1000 * 60 * 660).toISOString(), completedAt: new Date(Date.now() - 1000 * 60 * 654).toISOString(),
    latency: 6.2, tokensSaved: 400, inputTokens: 4200, outputTokens: 300, retries: 2,
  },
  {
    id: 'TSK-10506', name: 'Quarterly report generation', description: 'Generate Q3 financial summary report with visualizations.',
    type: 'Summary', difficulty: 'Hard', selectedModel: 'Large', expectedCost: 1.60, actualCost: 1.15, baselineCost: 1.60,
    successProbability: 96, status: 'Success', createdAt: new Date(Date.now() - 1000 * 60 * 720).toISOString(), completedAt: new Date(Date.now() - 1000 * 60 * 716).toISOString(),
    latency: 3.8, tokensSaved: 1000, inputTokens: 13000, outputTokens: 1200, retries: 0,
  },
  {
    id: 'TSK-10507', name: 'Regex pattern creation', description: 'Create a regex pattern for validating international phone numbers.',
    type: 'Coding', difficulty: 'Easy', selectedModel: 'Small', expectedCost: 0.30, actualCost: 0.09, baselineCost: 0.30,
    successProbability: 91, status: 'Success', createdAt: new Date(Date.now() - 1000 * 60 * 780).toISOString(), completedAt: new Date(Date.now() - 1000 * 60 * 779).toISOString(),
    latency: 0.8, tokensSaved: 500, inputTokens: 1800, outputTokens: 350, retries: 0,
  },
  {
    id: 'TSK-10508', name: 'Image metadata tagging', description: 'Classify and tag images with appropriate metadata labels.',
    type: 'Classification', difficulty: 'Medium', selectedModel: 'Medium', expectedCost: 0.70, actualCost: 0.25, baselineCost: 0.70,
    successProbability: 89, status: 'Success', createdAt: new Date(Date.now() - 1000 * 60 * 840).toISOString(), completedAt: new Date(Date.now() - 1000 * 60 * 839).toISOString(),
    latency: 1.5, tokensSaved: 1300, inputTokens: 3100, outputTokens: 150, retries: 0,
  },
  {
    id: 'TSK-10509', name: 'Logic puzzle resolution', description: 'Solve a complex logic puzzle with constraint satisfaction.',
    type: 'Reasoning', difficulty: 'Easy', selectedModel: 'Small', expectedCost: 0.40, actualCost: 0.12, baselineCost: 0.40,
    successProbability: 88, status: 'Success', createdAt: new Date(Date.now() - 1000 * 60 * 900).toISOString(), completedAt: new Date(Date.now() - 1000 * 60 * 899).toISOString(),
    latency: 0.95, tokensSaved: 600, inputTokens: 2200, outputTokens: 400, retries: 0,
  },
  {
    id: 'TSK-10510', name: 'End-to-end testing generation', description: 'Generate comprehensive E2E test suite for checkout flow.',
    type: 'Agentic', difficulty: 'Hard', selectedModel: 'Large', expectedCost: 2.90, actualCost: 2.45, baselineCost: 2.90,
    successProbability: 95, status: 'Success', createdAt: new Date(Date.now() - 1000 * 60 * 960).toISOString(), completedAt: new Date(Date.now() - 1000 * 60 * 954).toISOString(),
    latency: 6.5, tokensSaved: 850, inputTokens: 14500, outputTokens: 3800, retries: 0,
  },
];
