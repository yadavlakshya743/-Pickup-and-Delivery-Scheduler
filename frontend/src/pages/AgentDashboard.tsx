import { useState, useEffect } from 'react';
import { Package, MapPin, CheckCircle, Navigation } from 'lucide-react';
import api from '../lib/api';

const AgentDashboard = ({ user }: { user: any }) => {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchTasks = async () => {
        try {
            const res = await api.get('/orders');
            if (res.data.success) {
                setOrders(res.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch tasks:', err);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const updateStatus = async (orderId: string, newStatus: string) => {
        setLoading(true);
        try {
            await api.put(`/orders/${orderId}/status`, { status: newStatus });
            fetchTasks();
        } catch (err) {
            console.error('Failed to update status', err);
        } finally {
            setLoading(false);
        }
    };

    const pingLocation = async () => {
        try {
            await api.put(`/agents/location`, { latitude: 40.7128, longitude: -74.0060 });
            alert("Location updated successfully!");
        } catch (err) {
            console.error('Failed to ping location', err);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Agent Dashboard</h2>
                    <p className="text-slate-500">Welcome, {user.name}</p>
                </div>
                <button
                    onClick={pingLocation}
                    className="flex items-center space-x-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-md font-medium hover:bg-indigo-100 transition-colors"
                >
                    <MapPin className="w-4 h-4" />
                    <span>Ping Location</span>
                </button>
            </div>

            <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-800">Your Assigned Tasks</h3>
                {orders.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 bg-white rounded-xl shadow-sm border border-slate-100">
                        No active tasks assigned to you right now.
                    </div>
                ) : (
                    orders.map(order => (
                        <div key={order.order_id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-md">
                                        ID: {order.order_id.substring(0, 8)}
                                    </span>
                                    <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded-md">
                                        {order.priority}
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                                    <div>
                                        <p className="text-xs text-slate-500 font-medium uppercase">Pickup</p>
                                        <p className="font-semibold text-slate-800">{order.pickup_location}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-medium uppercase">Delivery</p>
                                        <p className="font-semibold text-slate-800">{order.delivery_location}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-end space-y-3 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                                <span className={`flex items-center space-x-1 font-bold ${order.status === 'DELIVERED' ? 'text-green-600' : 'text-amber-600'}`}>
                                    {order.status === 'DELIVERED' ? <CheckCircle className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                                    <span>{order.status}</span>
                                </span>

                                {order.status === 'ASSIGNED' && (
                                    <button
                                        disabled={loading}
                                        onClick={() => updateStatus(order.order_id, 'PICKED_UP')}
                                        className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-blue-700 w-full md:w-auto"
                                    >
                                        Mark Picked Up
                                    </button>
                                )}
                                {order.status === 'PICKED_UP' && (
                                    <button
                                        disabled={loading}
                                        onClick={() => updateStatus(order.order_id, 'DELIVERED')}
                                        className="bg-green-600 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-green-700 w-full md:w-auto flex items-center justify-center space-x-1"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        <span>Complete Delivery</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AgentDashboard;
