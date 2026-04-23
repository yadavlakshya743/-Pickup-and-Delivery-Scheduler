import { useState, useEffect } from 'react';
import { Package, MapPin, CheckCircle, Power, XCircle, Shield } from 'lucide-react';
import api from '../lib/api';

const AgentDashboard = ({ user }: { user: any }) => {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOnline, setIsOnline] = useState(false);
    const [toggling, setToggling] = useState(false);

    // Service area
    const [serviceCity, setServiceCity] = useState('');
    const [serviceCityInput, setServiceCityInput] = useState('');
    const [savingArea, setSavingArea] = useState(false);

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

    const fetchAgentProfile = async () => {
        try {
            const res = await api.get('/agents/me');
            if (res.data.success) {
                setIsOnline(res.data.data.is_online);
                setServiceCity(res.data.data.service_city || '');
                setServiceCityInput(res.data.data.service_city || '');
            }
        } catch (err) {
            console.error('Failed to fetch agent profile:', err);
        }
    };

    useEffect(() => {
        fetchTasks();
        fetchAgentProfile();
    }, []);

    const handleToggleOnline = async () => {
        setToggling(true);
        try {
            const res = await api.put('/agents/online-status', { is_online: !isOnline });
            if (res.data.success) {
                setIsOnline(res.data.data.is_online);
                fetchTasks();
            }
        } catch (err) {
            console.error('Failed to toggle online status:', err);
        } finally {
            setToggling(false);
        }
    };

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

    const rejectOrder = async (orderId: string) => {
        if (!confirm('Are you sure you want to reject this order? It will be reassigned to another agent.')) return;
        setLoading(true);
        try {
            await api.put(`/orders/${orderId}/reject`);
            fetchTasks();
        } catch (err) {
            console.error('Failed to reject order', err);
        } finally {
            setLoading(false);
        }
    };

    const saveServiceArea = async () => {
        if (!serviceCityInput.trim()) return;
        setSavingArea(true);
        try {
            const res = await api.put('/agents/service-area', { service_city: serviceCityInput.trim() });
            if (res.data.success) {
                setServiceCity(res.data.data.service_city || '');
            }
        } catch (err) {
            console.error('Failed to save service area', err);
        } finally {
            setSavingArea(false);
        }
    };

    const pingLocation = async () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser.');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    await api.put('/agents/location', {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                    alert(`Location updated! (${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)})`);
                } catch (err) {
                    console.error('Failed to send location', err);
                    alert('Failed to update location on server.');
                }
            },
            (err) => {
                console.error('Geolocation error:', err);
                alert('Could not get your location. Please allow location access in your browser.');
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header Card */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Agent Dashboard</h2>
                        <p className="text-slate-500">Welcome, {user.name}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={pingLocation}
                            className="flex items-center space-x-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-md font-medium hover:bg-indigo-100 transition-colors"
                        >
                            <MapPin className="w-4 h-4" />
                            <span>Ping Location</span>
                        </button>
                        <button
                            onClick={handleToggleOnline}
                            disabled={toggling}
                            className={`flex items-center space-x-2 px-5 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${isOnline
                                ? 'bg-green-500 text-white hover:bg-green-600 shadow-md shadow-green-200'
                                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                                } disabled:opacity-50`}
                        >
                            <Power className="w-4 h-4" />
                            <span>{toggling ? 'Switching...' : isOnline ? 'Online' : 'Offline'}</span>
                            <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-200 animate-pulse' : 'bg-slate-400'}`}></span>
                        </button>
                    </div>
                </div>
                {!isOnline && (
                    <div className="mt-4 bg-amber-50 text-amber-700 text-sm px-4 py-3 rounded-lg border border-amber-200">
                        ⚠️ You are currently <strong>offline</strong>. No new orders will be assigned to you. Go online to start receiving deliveries.
                    </div>
                )}
            </div>

            {/* Service Area Card */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-lg font-bold text-slate-800">Service Area</h3>
                    {serviceCity && (
                        <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-full ml-2">
                            {serviceCity}
                        </span>
                    )}
                </div>
                <p className="text-sm text-slate-500 mb-3">
                    Set the city you deliver in. Only orders from this city will be assigned to you.
                </p>
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={serviceCityInput}
                        onChange={(e) => setServiceCityInput(e.target.value)}
                        placeholder="e.g. Pune, Delhi, Mumbai"
                        className="flex-1 px-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none"
                    />
                    <button
                        onClick={saveServiceArea}
                        disabled={savingArea || !serviceCityInput.trim()}
                        className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                        {savingArea ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>

            {/* Tasks List */}
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
                                        <p className="font-semibold text-slate-800 text-sm">{order.pickup_location}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-slate-500 font-medium uppercase">Delivery</p>
                                        <p className="font-semibold text-slate-800 text-sm">{order.delivery_location}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-end space-y-3 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                                <span className={`flex items-center space-x-1 font-bold ${order.status === 'DELIVERED' ? 'text-green-600' : 'text-amber-600'}`}>
                                    {order.status === 'DELIVERED' ? <CheckCircle className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                                    <span>{order.status}</span>
                                </span>

                                {order.status === 'ASSIGNED' && (
                                    <div className="flex gap-2 w-full md:w-auto">
                                        <button
                                            disabled={loading}
                                            onClick={() => updateStatus(order.order_id, 'PICKED_UP')}
                                            className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium text-sm hover:bg-blue-700 flex-1 md:flex-none"
                                        >
                                            Mark Picked Up
                                        </button>
                                        <button
                                            disabled={loading}
                                            onClick={() => rejectOrder(order.order_id)}
                                            className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-md font-medium text-sm hover:bg-red-100 flex items-center justify-center gap-1 flex-1 md:flex-none"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            Reject
                                        </button>
                                    </div>
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
