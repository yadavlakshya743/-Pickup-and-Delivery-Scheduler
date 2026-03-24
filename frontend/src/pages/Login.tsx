import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import api from '../lib/api';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await api.post('/auth/login', { email, password });
            if (response.data.success) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                navigate('/dashboard');
                window.location.reload();
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed');
        }
    };

    return (
        <div className="max-w-md mx-auto mt-12 bg-white p-8 rounded-xl shadow-sm border border-slate-100">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-slate-800">Welcome Back</h2>
                <p className="text-sm text-slate-500 mt-2">Sign in to your account</p>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md mb-6 text-sm">
                    {error}
                </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input
                        type="email"
                        required
                        className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                    <input
                        type="password"
                        required
                        className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>

                <button
                    type="submit"
                    className="w-full bg-blue-600 text-white font-medium py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                    Sign In
                </button>
            </form>

            <div className="mt-6">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-slate-500">Or continue with</span>
                    </div>
                </div>

                <div className="mt-6 flex justify-center">
                    <GoogleLogin
                        onSuccess={async (credentialResponse) => {
                            try {
                                const response = await api.post('/auth/google', {
                                    credential: credentialResponse.credential
                                });
                                if (response.data.success) {
                                    localStorage.setItem('token', response.data.token);
                                    localStorage.setItem('user', JSON.stringify(response.data.user));
                                    navigate('/dashboard');
                                    window.location.reload();
                                }
                            } catch (err: any) {
                                setError(err.response?.data?.message || 'Google Login failed');
                            }
                        }}
                        onError={() => {
                            setError('Google Login failed');
                        }}
                    />
                </div>
            </div>

            <p className="mt-6 text-center text-sm text-slate-500">
                Don't have an account? <Link to="/register" className="text-blue-600 hover:text-blue-500 font-medium">Register</Link>
            </p>
        </div>
    );
};

export default Login;
