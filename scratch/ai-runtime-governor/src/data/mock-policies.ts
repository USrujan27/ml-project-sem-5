import type { Policy } from './types';

export const mockPolicies: Policy[] = [
  {
    id: 'POL-001',
    name: 'Maximum Task Budget',
    description: 'Sets a hard limit on the total cost accumulated for a single task execution.',
    type: 'budget',
    value: 5.00,
    unit: '₹',
    enabled: true,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString()
  },
  {
    id: 'POL-002',
    name: 'Maximum Agent Iterations',
    description: 'Restricts the number of loops an agent can perform before termination.',
    type: 'iteration',
    value: 5,
    enabled: true,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString()
  },
  {
    id: 'POL-003',
    name: 'Minimum Success Probability',
    description: 'Requires models chosen to have at least this estimated success rate.',
    type: 'probability',
    value: 80,
    unit: '%',
    enabled: true,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 40).toISOString()
  },
  {
    id: 'POL-004',
    name: 'Minimum Quality Threshold',
    description: 'Verifies the output meets this minimum quality score before returning.',
    type: 'quality',
    value: 85,
    unit: '/100',
    enabled: true,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString()
  },
  {
    id: 'POL-005',
    name: 'Model Escalation',
    description: 'Automatically routes to a larger model if the initial attempt fails or is below quality.',
    type: 'escalation',
    value: true,
    enabled: true,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString()
  },
  {
    id: 'POL-006',
    name: 'Automatic Context Optimization',
    description: 'Compresses large prompts to reduce token usage when safety margins allow.',
    type: 'optimization',
    value: true,
    enabled: true,
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString()
  }
];
