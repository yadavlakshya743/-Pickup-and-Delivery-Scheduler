import { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle } from 'lucide-react';
import api from '../lib/api';

const CustomerDashboard = ({ user }: { user: any }) => {
    const [pickupLocation, setPickupLocation] = useState('');
    // Detailed Delivery Location States
    const [dlHouseNo, setDlHouseNo] = useState('');
    const [dlState, setDlState] = useState('');
    const [dlCountry, setDlCountry] = useState('');
    const [dlPin, setDlPin] = useState('');
    const [dlContact, setDlContact] = useState('');

    const [priority, setPriority] = useState('STANDARD');
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchOrders = async () => {
        try {
            const res = await api.get('/orders');
            if (res.data.success) {
                setOrders(res.data.data);
            }
        } catch (err) {
            console.error('Failed to fetch orders:', err);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleCreateOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const formattedDeliveryLocation = `${dlHouseNo}, ${dlState}, ${dlCountry} - PIN: ${dlPin} (Contact: ${dlContact})`;
            const response = await api.post('/orders', {
                pickup_location: pickupLocation,
                delivery_location: formattedDeliveryLocation,
                priority
            });

            if (response.data.success) {
                setSuccess('Order created successfully!');
                setOrders(prev => [response.data.data, ...prev]);
                setPickupLocation('');
                setDlHouseNo('');
                setDlState('');
                setDlCountry('');
                setDlPin('');
                setDlContact('');
                setPriority('STANDARD');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create order');
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'DELIVERED': return <CheckCircle className="h-5 w-5 text-green-500" />;
            case 'ASSIGNED': return <Package className="h-5 w-5 text-blue-500" />;
            default: return <Clock className="h-5 w-5 text-amber-500" />;
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Welcome, {user.name} - Create New Order</h2>

                {error && <div className="bg-red-50 text-red-600 p-3 rounded-md mb-6">{error}</div>}
                {success && <div className="bg-green-50 text-green-600 p-3 rounded-md mb-6">{success}</div>}

                <form onSubmit={handleCreateOrder} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Pickup Location</label>
                        <input
                            type="text" required
                            className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                            value={pickupLocation}
                            onChange={(e) => setPickupLocation(e.target.value)}
                            placeholder="123 Main St"
                        />
                    </div>
                    <div className="md:col-span-2 lg:col-span-4 bg-slate-50 p-4 rounded-xl border border-slate-200 mt-2">
                        <h3 className="text-sm font-bold text-slate-800 mb-4 border-b pb-2">Delivery Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">House No. / Street</label>
                                <input
                                    type="text" required
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
                                    value={dlHouseNo} onChange={(e) => setDlHouseNo(e.target.value)}
                                    placeholder="Apt 12B, Maple St"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">State</label>
                                <input
                                    type="text" required
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
                                    value={dlState} onChange={(e) => setDlState(e.target.value)}
                                    placeholder="California"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Country</label>
                                <input
                                    type="text" required
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
                                    value={dlCountry} onChange={(e) => setDlCountry(e.target.value)}
                                    placeholder="USA"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Pin Code</label>
                                <input
                                    type="text" required
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
                                    value={dlPin} onChange={(e) => setDlPin(e.target.value)}
                                    placeholder="90210"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-slate-700 mb-1">Contact No.</label>
                                <input
                                    type="tel" required
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-none"
                                    value={dlContact} onChange={(e) => setDlContact(e.target.value)}
                                    placeholder="+1 234 567 8900"
                                />
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                        <select
                            className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            value={priority}
                            onChange={(e) => setPriority(e.target.value)}
                        >
                            <option value="STANDARD">Standard</option>
                            <option value="EXPRESS">Express</option>
                            <option value="SAME_DAY">Same Day</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Creating...' : 'Create Order'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Recent Orders</h2>

                {orders.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                        No orders created yet.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="pb-3 font-semibold text-slate-600">ID</th>
                                    <th className="pb-3 font-semibold text-slate-600">Pickup</th>
                                    <th className="pb-3 font-semibold text-slate-600">Delivery</th>
                                    <th className="pb-3 font-semibold text-slate-600">Priority</th>
                                    <th className="pb-3 font-semibold text-slate-600 overflow-hidden">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <tr key={order.order_id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                                        <td className="py-4 text-sm text-slate-500 font-mono truncate max-w-[100px]">{order.order_id}</td>
                                        <td className="py-4 font-medium text-slate-800">{order.pickup_location}</td>
                                        <td className="py-4 font-medium text-slate-800">{order.delivery_location}</td>
                                        <td className="py-4">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${order.priority === 'EXPRESS' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'}`}>
                                                {order.priority}
                                            </span>
                                        </td>
                                        <td className="py-4 flex items-center space-x-2">
                                            {getStatusIcon(order.status)}
                                            <span className="font-medium text-slate-700">{order.status}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerDashboard;
