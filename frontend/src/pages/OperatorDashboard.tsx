import { useState, useEffect } from 'react';
import { Users, Package, AlertCircle, Activity, CheckCircle, Clock, Truck, Filter } from 'lucide-react';
import api from '../lib/api';

type StatusFilter = 'ALL' | 'CREATED' | 'ASSIGNED' | 'PICKED_UP' | 'DELIVERED';

const OperatorDashboard = ({ user }: { user: any }) => {
    const [orders, setOrders] = useState<any[]>([]);
    const [agents, setAgents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [assigning, setAssigning] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [ordersRes, agentsRes] = await Promise.all([
                api.get('/orders'),
                api.get('/agents')
            ]);

            if (ordersRes.data.success) setOrders(ordersRes.data.data);
            if (agentsRes.data.success) setAgents(agentsRes.data.data);
        } catch (err) {
            console.error('Failed to fetch dashboard data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAssign = async (orderId: string, agentId: string) => {
        if (!agentId) {
            alert("Please select an agent from the dropdown first!");
            return;
        }
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

    const availableAgents = agents.filter(a => a.status === 'AVAILABLE' && a.is_online);
    const onlineAgents = agents.filter(a => a.is_online);
    const offlineAgents = agents.filter(a => !a.is_online);

    const orderStats = {
        total: orders.length,
        created: orders.filter(o => o.status === 'CREATED').length,
        assigned: orders.filter(o => o.status === 'ASSIGNED').length,
        pickedUp: orders.filter(o => o.status === 'PICKED_UP').length,
        delivered: orders.filter(o => o.status === 'DELIVERED').length,
    };

    const filteredOrders = statusFilter === 'ALL'
        ? orders
        : orders.filter(o => o.status === statusFilter);

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            CREATED: 'bg-amber-100 text-amber-700',
            ASSIGNED: 'bg-blue-100 text-blue-700',
            PICKED_UP: 'bg-purple-100 text-purple-700',
            DELIVERED: 'bg-green-100 text-green-700',
        };
        return styles[status] || 'bg-slate-100 text-slate-700';
    };

    const filterTabs: { label: string; value: StatusFilter; count: number }[] = [
        { label: 'All Orders', value: 'ALL', count: orderStats.total },
        { label: 'Pending', value: 'CREATED', count: orderStats.created },
        { label: 'Assigned', value: 'ASSIGNED', count: orderStats.assigned },
        { label: 'Picked Up', value: 'PICKED_UP', count: orderStats.pickedUp },
        { label: 'Delivered', value: 'DELIVERED', count: orderStats.delivered },
    ];

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h2 className="text-2xl font-bold text-slate-800">Operator Dashboard</h2>
                <p className="text-slate-500">Welcome, {user.name} | Administrative Privileges</p>
            </div>

            {/* Summary Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 text-center">
                    <Package className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-slate-800">{orderStats.total}</p>
                    <p className="text-xs text-slate-500 font-medium">Total Orders</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 text-center">
                    <Clock className="w-6 h-6 text-amber-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-amber-600">{orderStats.created}</p>
                    <p className="text-xs text-slate-500 font-medium">Pending</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 text-center">
                    <AlertCircle className="w-6 h-6 text-blue-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-blue-600">{orderStats.assigned + orderStats.pickedUp}</p>
                    <p className="text-xs text-slate-500 font-medium">In Progress</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 text-center">
                    <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-green-600">{orderStats.delivered}</p>
                    <p className="text-xs text-slate-500 font-medium">Delivered</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 text-center">
                    <Users className="w-6 h-6 text-green-500 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-green-600">{onlineAgents.length}</p>
                    <p className="text-xs text-slate-500 font-medium">Online Agents</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 text-center">
                    <Users className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-slate-500">{offlineAgents.length}</p>
                    <p className="text-xs text-slate-500 font-medium">Offline Agents</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Orders Section (3 cols) */}
                <div className="lg:col-span-3 space-y-4">
                    {/* Filter Tabs */}
                    <div className="flex items-center space-x-1 bg-white p-2 rounded-xl shadow-sm border border-slate-100 overflow-x-auto">
                        <Filter className="w-4 h-4 text-slate-400 ml-2 mr-1 flex-shrink-0" />
                        {filterTabs.map(tab => (
                            <button
                                key={tab.value}
                                onClick={() => setStatusFilter(tab.value)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${statusFilter === tab.value
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'text-slate-600 hover:bg-slate-100'
                                    }`}
                            >
                                {tab.label} ({tab.count})
                            </button>
                        ))}
                    </div>

                    {/* Orders Table */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Order ID</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Customer</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Pickup</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Delivery</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Priority</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Agent</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Created</th>
                                        <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredOrders.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="px-4 py-12 text-center text-slate-500">
                                                No orders found{statusFilter !== 'ALL' ? ` with status "${statusFilter}"` : ''}.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredOrders.map(order => (
                                            <tr key={order.order_id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-3 text-sm font-mono text-slate-500">
                                                    #{order.order_id.substring(0, 8)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="text-sm font-medium text-slate-800">{order.user?.name || '—'}</p>
                                                    <p className="text-xs text-slate-500">{order.user?.phone || order.user?.email || '—'}</p>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-700 max-w-[150px] truncate" title={order.pickup_location}>
                                                    {order.pickup_location}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-700 max-w-[150px] truncate" title={order.delivery_location}>
                                                    {order.delivery_location}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-0.5 text-xs font-bold rounded-md ${order.priority === 'EXPRESS' ? 'bg-purple-100 text-purple-700' :
                                                            order.priority === 'SAME_DAY' ? 'bg-orange-100 text-orange-700' :
                                                                'bg-slate-100 text-slate-600'
                                                        }`}>
                                                        {order.priority}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-0.5 text-xs font-bold rounded-md ${getStatusBadge(order.status)}`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-slate-700">
                                                    {order.assignments?.[0]?.agent?.user?.name || (
                                                        <span className="text-slate-400 italic">Unassigned</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                                                    {formatDate(order.created_at)}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {order.status === 'CREATED' && (
                                                        <div className="flex items-center space-x-1">
                                                            <select
                                                                className="text-xs border-slate-300 rounded-md py-1 px-2 outline-none border w-24"
                                                                id={`select-${order.order_id}`}
                                                                defaultValue=""
                                                            >
                                                                <option value="" disabled>Agent...</option>
                                                                {availableAgents.map(a => (
                                                                    <option key={a.agent_id} value={a.agent_id}>
                                                                        {a.user?.name}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            <button
                                                                disabled={assigning === order.order_id || availableAgents.length === 0}
                                                                onClick={() => {
                                                                    const select = document.getElementById(`select-${order.order_id}`) as HTMLSelectElement;
                                                                    handleAssign(order.order_id, select.value);
                                                                }}
                                                                className="bg-indigo-600 text-white px-2 py-1 rounded-md text-xs font-medium hover:bg-indigo-700 disabled:opacity-50"
                                                            >
                                                                {assigning === order.order_id ? '...' : 'Assign'}
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Fleet Overview (1 col) */}
                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
                        <Activity className="w-5 h-5 text-slate-500" />
                        <span>Fleet Status</span>
                    </h3>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        <ul className="divide-y divide-slate-50">
                            {agents.length === 0 ? (
                                <li className="p-6 text-center text-slate-500 text-sm">No registered agents.</li>
                            ) : (
                                agents.map(agent => (
                                    <li key={agent.agent_id} className="p-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${agent.is_online ? 'bg-green-500 animate-pulse' : 'bg-slate-300'
                                                    }`}></div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-800">{agent.user?.name}</p>
                                                    <p className="text-xs text-slate-500">{agent.user?.phone}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end space-y-1">
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${agent.is_online ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                                                    }`}>
                                                    {agent.is_online ? 'Online' : 'Offline'}
                                                </span>
                                                <span className={`text-xs px-2 py-0.5 rounded-md ${agent.status === 'AVAILABLE' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                                    }`}>
                                                    {agent.status}
                                                </span>
                                            </div>
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
