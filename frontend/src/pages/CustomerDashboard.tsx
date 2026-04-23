import { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle, MapPin, X, Search, Navigation, XCircle } from 'lucide-react';
import api from '../lib/api';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icon issue with webpack/vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const deliveryIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Haversine distance formula (in km)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
};

// Calculate ETA based on distance
const calculateETA = (distanceKm: number) => {
    if (!distanceKm || distanceKm <= 0) return 'Unknown';
    // Assume average speed in city is 30 km/h, plus 15 mins base buffer
    const timeInHours = distanceKm / 30;
    const timeInMins = Math.round(timeInHours * 60) + 15;

    if (timeInMins < 60) {
        return `~${timeInMins} mins`;
    } else {
        const hrs = Math.floor(timeInMins / 60);
        const mins = timeInMins % 60;
        return `~${hrs} hr ${mins} mins`;
    }
};

const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
        const data = await res.json();
        return data.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    } catch {
        return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
};

const searchLocation = async (query: string): Promise<any[]> => {
    if (!query || query.length < 3) return [];
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=in`);
        return await res.json();
    } catch {
        return [];
    }
};

const LocationPicker = ({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) => {
    useMapEvents({
        click(e) {
            onLocationSelect(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
};

const MapFlyTo = ({ center, zoom }: { center: [number, number]; zoom: number }) => {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, zoom, { duration: 1.2 });
    }, [center, zoom, map]);
    return null;
};

const LocationSearchBar = ({
    onSelect,
    placeholder,
    onUseMyLocation,
}: {
    onSelect: (lat: number, lng: number, displayName: string) => void;
    placeholder: string;
    onUseMyLocation: () => void;
}) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        if (query.length < 3) { setResults([]); return; }
        const timer = setTimeout(async () => {
            setSearching(true);
            const data = await searchLocation(query);
            setResults(data);
            setSearching(false);
        }, 500);
        return () => clearTimeout(timer);
    }, [query]);

    return (
        <div className="relative mb-2">
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={placeholder}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none"
                    />
                    {searching && <span className="absolute right-3 top-2.5 text-xs text-slate-400">Searching...</span>}
                </div>
                <button
                    type="button"
                    onClick={onUseMyLocation}
                    className="flex items-center gap-1 px-3 py-2 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors whitespace-nowrap"
                >
                    <Navigation className="w-3.5 h-3.5" />
                    My Location
                </button>
            </div>
            {results.length > 0 && (
                <div className="absolute z-[1000] w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {results.map((r, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => {
                                onSelect(parseFloat(r.lat), parseFloat(r.lon), r.display_name);
                                setQuery(r.display_name.split(',').slice(0, 3).join(','));
                                setResults([]);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 border-b border-slate-100 last:border-0 transition-colors"
                        >
                            <span className="font-medium text-slate-800">{r.display_name.split(',').slice(0, 2).join(',')}</span>
                            <span className="text-slate-400 text-xs block truncate">{r.display_name}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- Order Timeline Component ---
const OrderTimeline = ({ status }: { status: string }) => {
    const steps = [
        { key: 'CREATED', label: 'Order Placed' },
        { key: 'ASSIGNED', label: 'Agent Assigned' },
        { key: 'PICKED_UP', label: 'Out for Delivery' },
        { key: 'DELIVERED', label: 'Delivered' }
    ];

    if (status === 'CANCELLED') {
        return (
            <div className="flex items-center justify-center p-4 bg-red-50 rounded-lg border border-red-100 my-4">
                <XCircle className="w-5 h-5 text-red-500 mr-2" />
                <span className="text-red-700 font-semibold text-sm">This order was cancelled.</span>
            </div>
        );
    }

    const currentStepIndex = steps.findIndex(s => s.key === status);

    return (
        <div className="relative flex justify-between items-center my-6">
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-slate-200 rounded-full z-0"></div>
            <div
                className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-blue-500 rounded-full z-0 transition-all duration-500"
                style={{ width: `${(Math.max(0, currentStepIndex) / (steps.length - 1)) * 100}%` }}
            ></div>

            {steps.map((step, index) => {
                const isActive = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;

                return (
                    <div key={step.key} className="relative z-10 flex flex-col items-center group">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-300 ${isActive ? 'bg-blue-600 shadow-md shadow-blue-200' : 'bg-slate-200 border-2 border-white'
                            }`}>
                            {isActive && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <span className={`absolute top-8 text-[10px] font-bold text-center w-24 left-1/2 transform -translate-x-1/2 uppercase tracking-wide ${isCurrent ? 'text-blue-700' : isActive ? 'text-slate-600' : 'text-slate-400'
                            }`}>
                            {step.label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

const CustomerDashboard = ({ user }: { user: any }) => {
    const [userLat, setUserLat] = useState<number>(20.5937);
    const [userLng, setUserLng] = useState<number>(78.9629);
    const [userZoom, setUserZoom] = useState(5);

    const [pickupLat, setPickupLat] = useState<number | null>(null);
    const [pickupLng, setPickupLng] = useState<number | null>(null);
    const [pickupAddress, setPickupAddress] = useState('');

    const [deliveryLat, setDeliveryLat] = useState<number | null>(null);
    const [deliveryLng, setDeliveryLng] = useState<number | null>(null);
    const [deliveryAddress, setDeliveryAddress] = useState('');

    const [pickupMapCenter, setPickupMapCenter] = useState<[number, number] | null>(null);
    const [pickupMapZoom, setPickupMapZoom] = useState(14);
    const [deliveryMapCenter, setDeliveryMapCenter] = useState<[number, number] | null>(null);
    const [deliveryMapZoom, setDeliveryMapZoom] = useState(14);

    const [dlHouseNo, setDlHouseNo] = useState('');
    const [dlContact, setDlContact] = useState('');
    const [priority, setPriority] = useState('STANDARD');

    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [activeMap, setActiveMap] = useState<'pickup' | 'delivery' | null>(null);

    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setUserLat(pos.coords.latitude);
                    setUserLng(pos.coords.longitude);
                    setUserZoom(14);
                },
                () => console.log('Geolocation permission denied, using default view'),
                { enableHighAccuracy: true, timeout: 8000 }
            );
        }
    }, []);

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

    const handleMapSelect = async (lat: number, lng: number) => {
        const address = await reverseGeocode(lat, lng);
        if (activeMap === 'pickup') {
            setPickupLat(lat); setPickupLng(lng); setPickupAddress(address);
        } else if (activeMap === 'delivery') {
            setDeliveryLat(lat); setDeliveryLng(lng); setDeliveryAddress(address);
        }
    };

    const handleSearchSelect = (lat: number, lng: number, displayName: string, type: 'pickup' | 'delivery') => {
        if (type === 'pickup') {
            setPickupLat(lat); setPickupLng(lng); setPickupAddress(displayName);
            setPickupMapCenter([lat, lng]); setPickupMapZoom(16);
            if (activeMap !== 'pickup') setActiveMap('pickup');
        } else {
            setDeliveryLat(lat); setDeliveryLng(lng); setDeliveryAddress(displayName);
            setDeliveryMapCenter([lat, lng]); setDeliveryMapZoom(16);
            if (activeMap !== 'delivery') setActiveMap('delivery');
        }
    };

    const useMyLocation = (type: 'pickup' | 'delivery') => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser.');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                const address = await reverseGeocode(lat, lng);
                if (type === 'pickup') {
                    setPickupLat(lat); setPickupLng(lng); setPickupAddress(address);
                    setPickupMapCenter([lat, lng]); setPickupMapZoom(16);
                    if (activeMap !== 'pickup') setActiveMap('pickup');
                } else {
                    setDeliveryLat(lat); setDeliveryLng(lng); setDeliveryAddress(address);
                    setDeliveryMapCenter([lat, lng]); setDeliveryMapZoom(16);
                    if (activeMap !== 'delivery') setActiveMap('delivery');
                }
            },
            () => alert('Could not get your location. Please allow location access.'),
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleCreateOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setError(''); setSuccess('');

        if (!pickupLat || !pickupLng || !deliveryLat || !deliveryLng) {
            setError('Please select both pickup and delivery locations.');
            setLoading(false); return;
        }

        try {
            const deliveryLocationStr = dlHouseNo ? `${dlHouseNo}, ${deliveryAddress}` : deliveryAddress;
            const response = await api.post('/orders', {
                pickup_location: pickupAddress,
                pickup_lat: pickupLat, pickup_lng: pickupLng,
                delivery_location: deliveryLocationStr,
                delivery_lat: deliveryLat, delivery_lng: deliveryLng,
                priority,
            });

            if (response.data.success) {
                setSuccess('Order created successfully!');
                fetchOrders(); // Refresh to get full details
                setPickupLat(null); setPickupLng(null); setPickupAddress('');
                setDeliveryLat(null); setDeliveryLng(null); setDeliveryAddress('');
                setDlHouseNo(''); setDlContact(''); setPriority('STANDARD');
                setActiveMap(null); setPickupMapCenter(null); setDeliveryMapCenter(null);

                // Clear success message after 5 seconds
                setTimeout(() => setSuccess(''), 5000);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create order');
        } finally {
            setLoading(false);
        }
    };

    const cancelOrder = async (orderId: string) => {
        if (!confirm('Are you sure you want to cancel this order?')) return;
        try {
            await api.put(`/orders/${orderId}/cancel`);
            fetchOrders();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to cancel order');
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Create Order Form */}
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
                <h2 className="text-2xl font-bold text-slate-800 mb-6">Welcome, {user.name} - Create New Order</h2>

                {error && <div className="bg-red-50 text-red-600 p-3 rounded-md mb-6">{error}</div>}
                {success && <div className="bg-green-50 text-green-600 p-3 rounded-md mb-6 flex items-center gap-2"><CheckCircle className="w-5 h-5" /> {success}</div>}

                <form onSubmit={handleCreateOrder} className="space-y-6">
                    {/* Pickup Location */}
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 transition-all">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-sm font-bold text-blue-800 flex items-center gap-2">
                                <MapPin className="w-4 h-4" /> Pickup Location
                            </h3>
                            <button
                                type="button"
                                onClick={() => setActiveMap(activeMap === 'pickup' ? null : 'pickup')}
                                className="text-xs font-semibold bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors"
                            >
                                {activeMap === 'pickup' ? 'Close Map' : '📍 Pick on Map'}
                            </button>
                        </div>
                        <LocationSearchBar placeholder="Search pickup location..." onSelect={(lat, lng, name) => handleSearchSelect(lat, lng, name, 'pickup')} onUseMyLocation={() => useMyLocation('pickup')} />
                        {pickupAddress && (
                            <div className="flex items-center gap-2 bg-white p-3 rounded-lg border border-blue-100 mb-2">
                                <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
                                <span className="text-sm text-slate-700 truncate">{pickupAddress}</span>
                                <button type="button" onClick={() => { setPickupLat(null); setPickupLng(null); setPickupAddress(''); }} className="ml-auto text-slate-400 hover:text-red-500">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                        {activeMap === 'pickup' && (
                            <div className="rounded-lg overflow-hidden border border-blue-200" style={{ height: '300px' }}>
                                <MapContainer center={pickupLat ? [pickupLat, pickupLng!] : [userLat, userLng]} zoom={pickupLat ? 15 : userZoom} style={{ height: '100%', width: '100%' }}>
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    <LocationPicker onLocationSelect={handleMapSelect} />
                                    {pickupLat && pickupLng && <Marker position={[pickupLat, pickupLng]} />}
                                    {pickupMapCenter && <MapFlyTo center={pickupMapCenter} zoom={pickupMapZoom} />}
                                </MapContainer>
                            </div>
                        )}
                    </div>

                    {/* Delivery Location */}
                    <div className="bg-red-50 p-4 rounded-xl border border-red-200 transition-all">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-sm font-bold text-red-800 flex items-center gap-2">
                                <MapPin className="w-4 h-4" /> Delivery Location
                            </h3>
                            <button
                                type="button"
                                onClick={() => setActiveMap(activeMap === 'delivery' ? null : 'delivery')}
                                className="text-xs font-semibold bg-red-600 text-white px-3 py-1.5 rounded-md hover:bg-red-700 transition-colors"
                            >
                                {activeMap === 'delivery' ? 'Close Map' : '📍 Pick on Map'}
                            </button>
                        </div>
                        <LocationSearchBar placeholder="Search delivery location..." onSelect={(lat, lng, name) => handleSearchSelect(lat, lng, name, 'delivery')} onUseMyLocation={() => useMyLocation('delivery')} />
                        {deliveryAddress && (
                            <div className="flex items-center gap-2 bg-white p-3 rounded-lg border border-red-100 mb-2">
                                <MapPin className="w-4 h-4 text-red-500 flex-shrink-0" />
                                <span className="text-sm text-slate-700 truncate">{deliveryAddress}</span>
                                <button type="button" onClick={() => { setDeliveryLat(null); setDeliveryLng(null); setDeliveryAddress(''); }} className="ml-auto text-slate-400 hover:text-red-500">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                        {activeMap === 'delivery' && (
                            <div className="rounded-lg overflow-hidden border border-red-200" style={{ height: '300px' }}>
                                <MapContainer center={deliveryLat ? [deliveryLat, deliveryLng!] : [userLat, userLng]} zoom={deliveryLat ? 15 : userZoom} style={{ height: '100%', width: '100%' }}>
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    <LocationPicker onLocationSelect={handleMapSelect} />
                                    {deliveryLat && deliveryLng && <Marker position={[deliveryLat, deliveryLng]} icon={deliveryIcon} />}
                                    {deliveryMapCenter && <MapFlyTo center={deliveryMapCenter} zoom={deliveryMapZoom} />}
                                </MapContainer>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">House No. / Flat (Optional)</label>
                            <input type="text" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-none" value={dlHouseNo} onChange={(e) => setDlHouseNo(e.target.value)} placeholder="Apt 12B" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Contact No.</label>
                            <input type="tel" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-none" value={dlContact} onChange={(e) => setDlContact(e.target.value)} placeholder="+91 98765 43210" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1">Priority</label>
                            <select className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-none bg-white" value={priority} onChange={(e) => setPriority(e.target.value)}>
                                <option value="STANDARD">Standard</option>
                                <option value="EXPRESS">Express</option>
                                <option value="SAME_DAY">Same Day</option>
                            </select>
                        </div>
                    </div>

                    <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white font-medium py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm shadow-md">
                        {loading ? 'Creating Order...' : 'Create Order'}
                    </button>
                </form>
            </div>

            {/* Recent Orders List */}
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-800">Your Active Orders</h2>

                {orders.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
                        No orders created yet.
                    </div>
                ) : (
                    orders.map((order) => {
                        // Calculate distance and ETA if coords are available
                        let distanceKm = 0;
                        let etaText = 'Unknown';
                        if (order.pickup_lat && order.pickup_lng && order.delivery_lat && order.delivery_lng) {
                            distanceKm = calculateDistance(order.pickup_lat, order.pickup_lng, order.delivery_lat, order.delivery_lng);
                            etaText = calculateETA(distanceKm);
                        }

                        return (
                            <div key={order.order_id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                                {/* Header */}
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                                                ID: {order.order_id.substring(0, 8)}
                                            </span>
                                            <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${order.priority === 'EXPRESS' ? 'bg-purple-100 text-purple-700' :
                                                order.priority === 'SAME_DAY' ? 'bg-orange-100 text-orange-700' : 'bg-blue-50 text-blue-600'}`}>
                                                {order.priority}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-500">Placed on {new Date(order.created_at).toLocaleDateString()}</p>
                                    </div>

                                    {order.status === 'CREATED' && (
                                        <button
                                            onClick={() => cancelOrder(order.order_id)}
                                            className="text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md transition-colors"
                                        >
                                            Cancel Order
                                        </button>
                                    )}
                                </div>

                                {/* Timeline */}
                                <div className="mb-10 px-4">
                                    <OrderTimeline status={order.status} />
                                </div>

                                {/* Order Details */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                            <Package className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Pickup From</p>
                                            <p className="text-sm text-slate-800 font-medium line-clamp-2">{order.pickup_location}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                            <MapPin className="w-4 h-4 text-red-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Deliver To</p>
                                            <p className="text-sm text-slate-800 font-medium line-clamp-2">{order.delivery_location}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* ETA Footer */}
                                {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                                    <div className="mt-4 flex items-center justify-between text-sm">
                                        <div className="flex items-center text-slate-600 font-medium">
                                            <Clock className="w-4 h-4 text-amber-500 mr-1.5" />
                                            <span>Estimated Time: <span className="text-slate-800 font-bold">{etaText}</span></span>
                                        </div>
                                        {distanceKm > 0 && (
                                            <span className="text-slate-400 text-xs">Distance: {distanceKm.toFixed(1)} km</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default CustomerDashboard;
