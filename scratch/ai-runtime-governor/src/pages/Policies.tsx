import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import PageLayout from '../components/layout/PageLayout';
import PolicyCard from '../components/policies/PolicyCard';
import { getPolicies, updatePolicy } from '../services/api';
import type { Policy } from '../data/types';

export default function Policies() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPolicies().then((data) => {
      setPolicies(data);
      setLoading(false);
    });
  }, []);

  const handleToggle = async (id: string, enabled: boolean) => {
    // Optimistic update
    setPolicies(prev => prev.map(p => p.id === id ? { ...p, enabled } : p));
    try {
      await updatePolicy(id, { enabled });
    } catch (err) {
      console.error('Failed to update policy', err);
      // Revert on failure
      setPolicies(prev => prev.map(p => p.id === id ? { ...p, enabled: !enabled } : p));
    }
  };

  const handleEdit = (id: string) => {
    console.log('Edit policy:', id);
  };

  const activeCount = policies.filter(p => p.enabled).length;

  return (
    <PageLayout 
      title="Policies" 
      description="Configure governance rules and cost controls for AI workload execution."
      actions={
        <button className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm px-4 py-2 rounded-md transition-colors">
          <Plus size={16} />
          <span>Add Policy</span>
        </button>
      }
    >
      <div className="space-y-6">
        {loading ? (
          <div className="text-zinc-500 text-center py-12">Loading policies...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {policies.map(policy => (
              <PolicyCard 
                key={policy.id} 
                policy={policy} 
                onToggle={(enabled) => handleToggle(policy.id, enabled)} 
                onEdit={() => handleEdit(policy.id)} 
              />
            ))}
          </div>
        )}

        {!loading && (
          <div className="bg-[#111113] border border-[#1e1e24] rounded-lg p-6">
            <h3 className="text-base font-semibold text-zinc-100 mb-2">Active Governance Summary</h3>
            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
              <span>{activeCount} active policies</span>
              <span>·</span>
              <span>Max budget ₹5.00</span>
              <span>·</span>
              <span>Min quality 85</span>
              <span>·</span>
              <span>Escalation enabled</span>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
