import { useState, useEffect } from 'react';
import { Users, Package, AlertCircle, Activity } from 'lucide-react';
import api from '../lib/api';

const OperatorDashboard = ({ user }: { user: any }) => {
    const [orders, setOrders] = useState<any[]>([]);
    const [agents, setAgents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [assigning, setAssigning] = useState<string | null>(null);

    const fetchData = async () => {
        try {
            const [ordersRes, agentsRes] = await Promise.all([
                api.get('/orders'),
                api.get('/agents')
            ]);

            if (ordersRes.data.success) setOrders(ordersRes.data.data);
            if (agentsRes.data.success) setAgents(agentsRes.data.data);
        } catch (err) {
            console.error('Failed to fetch dashboard data', err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAssign = async (orderId: string, agentId: string) => {
        if (!agentId) return;
        setAssigning(orderId);

        try {
            await api.post('/scheduler/assign', { order_id: orderId, agent_id: agentId });
            fetchData();
        } catch (err) {
            console.error('Failed to assign task', err);
            alert("Failed to assign agent.");
        } finally {
            setAssigning(null);
        }
    };

    const availableAgents = agents.filter(a => a.status === 'AVAILABLE');

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Operator Dashboard</h2>
                    <p className="text-slate-500">Welcome, {user.name} | Administrative Privileges</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg flex items-center space-x-2">
                        <Package className="w-5 h-5" />
                        <span className="font-bold">{orders.length} Total Orders</span>
                    </div>
                    <div className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-lg flex items-center space-x-2">
                        <Users className="w-5 h-5" />
                        <span className="font-bold">{availableAgents.length} Agents Available</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Orders Queue */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
                        <AlertCircle className="w-5 h-5 text-slate-500" />
                        <span>Order Queue</span>
                    </h3>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        <ul className="divide-y divide-slate-100">
                            {orders.length === 0 ? (
                                <li className="p-8 text-center text-slate-500">No active orders in the system.</li>
                            ) : (
                                orders.map(order => (
                                    <li key={order.order_id} className="p-6 hover:bg-slate-50 transition-colors">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center space-x-2">
                                                    <span className="font-mono text-sm text-slate-500">#{order.order_id.substring(0, 8)}</span>
                                                    <span className={`px-2 py-0.5 text-xs font-bold rounded-md ${order.status === 'CREATED' ? 'bg-amber-100 text-amber-700' :
                                                            order.status === 'ASSIGNED' ? 'bg-blue-100 text-blue-700' :
                                                                order.status === 'PICKED_UP' ? 'bg-purple-100 text-purple-700' :
                                                                    'bg-green-100 text-green-700'
                                                        }`}>
                                                        {order.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm font-medium text-slate-800">
                                                    {order.pickup_location} <span className="text-slate-400 mx-1">→</span> {order.delivery_location}
                                                </p>
                                                <p className="text-xs text-slate-500">Customer: {order.user?.name} ({order.user?.phone})</p>
                                            </div>

                                            {/* Assignment Controls */}
                                            {order.status === 'CREATED' ? (
                                                <div className="flex items-center space-x-2 min-w-[200px]">
                                                    <select
                                                        className="w-full text-sm border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 py-2 px-3 outline-none border"
                                                        id={`select-${order.order_id}`}
                                                        defaultValue=""
                                                    >
                                                        <option value="" disabled>Select Agent...</option>
                                                        {availableAgents.map(a => (
                                                            <option key={a.agent_id} value={a.agent_id}>{a.user?.name} (Available)</option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        disabled={assigning === order.order_id || availableAgents.length === 0}
                                                        onClick={() => {
                                                            const select = document.getElementById(`select-${order.order_id}`) as HTMLSelectElement;
                                                            handleAssign(order.order_id, select.value);
                                                        }}
                                                        className="bg-indigo-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                                                    >
                                                        {assigning === order.order_id ? 'Wait...' : 'Assign'}
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="text-sm text-slate-500 flex items-center space-x-1">
                                                    <span>Agent:</span>
                                                    <span className="font-semibold text-slate-800">
                                                        {order.assignments?.[0]?.agent?.user?.name || 'Unknown'}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>
                </div>

                {/* Fleet Overview */}
                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
                        <Activity className="w-5 h-5 text-slate-500" />
                        <span>Fleet Status</span>
                    </h3>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden p-2">
                        <ul className="divide-y divide-slate-50">
                            {agents.length === 0 ? (
                                <li className="p-6 text-center text-slate-500 text-sm">No registered agents.</li>
                            ) : (
                                agents.map(agent => (
                                    <li key={agent.agent_id} className="p-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-2 h-2 rounded-full ${agent.status === 'AVAILABLE' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-800">{agent.user?.name}</p>
                                                    <p className="text-xs text-slate-500">{agent.user?.phone}</p>
                                                </div>
                                            </div>
                                            <span className={`text-xs font-bold px-2 py-1 rounded-md ${agent.status === 'AVAILABLE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'
                                                }`}>
                                                {agent.status}
                                            </span>
                                        </div>
                                    </li>
                                ))
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OperatorDashboard;
