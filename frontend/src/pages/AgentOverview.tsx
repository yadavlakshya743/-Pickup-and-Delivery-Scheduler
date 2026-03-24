import { useState } from 'react';
import { UserPlus, Activity, MapPin } from 'lucide-react';
import api from '../lib/api';

const AgentOverview = () => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [agents, setAgents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    // Note: Similar to Orders, a GET /agents endpoint is needed for a full implementation.
    // We'll mock the state for now for the agents we create in this session.

    const handleRegisterAgent = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: '', type: '' });

        try {
            const response = await api.post('/agents', { name, phone });

            if (response.data.success) {
                setMessage({ text: 'Agent registered successfully', type: 'success' });
                setAgents(prev => [response.data.data, ...prev]);
                setName('');
                setPhone('');
            }
        } catch (err: any) {
            setMessage({ text: err.response?.data?.message || 'Failed to register agent', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Register Agent Form */}
                <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 md:col-span-1">
                    <div className="flex items-center space-x-2 mb-6">
                        <UserPlus className="h-6 w-6 text-indigo-600" />
                        <h2 className="text-xl font-bold text-slate-800">Register Agent</h2>
                    </div>

                    {message.text && (
                        <div className={`p-3 rounded-md mb-6 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                            {message.text}
                        </div>
                    )}

                    <form onSubmit={handleRegisterAgent} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                            <input
                                type="text" required
                                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                            <input
                                type="tel" required
                                className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 text-white font-medium py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 mt-2"
                        >
                            {loading ? 'Registering...' : 'Add Agent'}
                        </button>
                    </form>
                </div>

                {/* Current Agents Viewer */}
                <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 md:col-span-2">
                    <h2 className="text-xl font-bold text-slate-800 mb-6">Active Agents</h2>

                    {agents.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-300 h-full flex items-center justify-center">
                            No agents registered yet offline.
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {agents.map((agent) => (
                                <div key={agent.agent_id} className="flex items-center justify-between p-4 border border-slate-100 rounded-lg bg-slate-50">
                                    <div className="flex items-center space-x-4">
                                        <div className="h-10 w-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold">
                                            {agent.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-800">{agent.name}</h3>
                                            <p className="text-sm text-slate-500 flex items-center">
                                                <MapPin className="w-3 h-3 mr-1 inline" /> {agent.phone}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Activity className={`w-4 h-4 ${agent.status === 'AVAILABLE' ? 'text-green-500' : 'text-amber-500'}`} />
                                        <span className={`text-sm font-medium ${agent.status === 'AVAILABLE' ? 'text-green-600' : 'text-amber-600'}`}>
                                            {agent.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default AgentOverview;
