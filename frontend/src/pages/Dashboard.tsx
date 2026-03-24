import { useEffect, useState } from 'react';
import CustomerDashboard from './CustomerDashboard';
import AgentDashboard from './AgentDashboard';
import OperatorDashboard from './OperatorDashboard';
import { Navigate } from 'react-router-dom';

const Dashboard = () => {
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    if (!user) {
        return <div className="flex h-64 items-center justify-center">Loading...</div>;
    }

    if (user.role === 'CUSTOMER') {
        return <CustomerDashboard user={user} />;
    } else if (user.role === 'AGENT') {
        return <AgentDashboard user={user} />;
    } else if (user.role === 'OPERATOR') {
        return <OperatorDashboard user={user} />;
    } else {
        return <Navigate to="/login" />;
    }
};

export default Dashboard;
