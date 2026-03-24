import { Link, useNavigate } from 'react-router-dom';
import { Truck } from 'lucide-react';

const Navbar = () => {
    const navigate = useNavigate();
    const isAuthenticated = !!localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
        window.location.reload();
    };

    return (
        <nav className="bg-white shadow">
            <div className="container mx-auto px-4">
                <div className="flex justify-between h-16">
                    <div className="flex items-center space-x-2">
                        <Truck className="h-6 w-6 text-blue-600" />
                        <Link to="/" className="text-xl font-bold text-slate-800">
                            PickUp & Delivery
                        </Link>
                    </div>

                    <div className="flex items-center space-x-4">
                        {isAuthenticated ? (
                            <>
                                <Link to="/dashboard" className="text-slate-600 hover:text-blue-600 px-3 py-2 rounded-md font-medium">
                                    Dashboard
                                </Link>
                                <div className="flex items-center space-x-4 ml-4 pl-4 border-l border-slate-200">
                                    <span className="text-sm font-medium text-slate-500">
                                        Welcome, {user?.name || 'User'}
                                    </span>
                                    <button
                                        onClick={handleLogout}
                                        className="text-sm font-medium text-red-600 hover:text-red-500"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="text-slate-600 hover:text-blue-600 px-3 py-2 rounded-md font-medium">
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md font-medium transition-colors"
                                >
                                    Register
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
