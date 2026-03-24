const BASE_URL = 'http://localhost:3000/api/v1';

const apiPost = async (path: string, body: any, token?: string): Promise<any> => {
    const res = await fetch(`${BASE_URL}${path}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(body)
    });
    const data: any = await res.json();
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
};

const apiGet = async (path: string, token: string): Promise<any> => {
    const res = await fetch(`${BASE_URL}${path}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data: any = await res.json();
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
};

const apiPut = async (path: string, body: any, token: string): Promise<any> => {
    const res = await fetch(`${BASE_URL}${path}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
    });
    const data: any = await res.json();
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
};

const runIntegrationTest = async () => {
    try {
        console.log("Starting End-to-End Integration Test for 3-Sided Marketplace...");

        // 1. Register Customer
        console.log("-> Registering Customer...");
        const cRes = await apiPost('/auth/register', {
            name: 'Test Customer', email: `customer_${Date.now()}@test.com`, password: 'password', phone: '111', role: 'CUSTOMER'
        });
        const cLogin = await apiPost('/auth/login', { email: cRes.data.email, password: 'password' });
        const cToken = cLogin.token;

        // 2. Register Agent
        console.log("-> Registering Agent...");
        const aRes = await apiPost('/auth/register', {
            name: 'Test Agent', email: `agent_${Date.now()}@test.com`, password: 'password', phone: '222', role: 'AGENT'
        });
        const aLogin = await apiPost('/auth/login', { email: aRes.data.email, password: 'password' });
        const aToken = aLogin.token;

        // 3. Register Operator
        console.log("-> Registering Operator...");
        const oRes = await apiPost('/auth/register', {
            name: 'Test Operator', email: `operator_${Date.now()}@test.com`, password: 'password', phone: '333', role: 'OPERATOR'
        });
        const oLogin = await apiPost('/auth/login', { email: oRes.data.email, password: 'password' });
        const oToken = oLogin.token;

        // 4. Customer Creates Order
        console.log("-> Customer creating order...");
        const orderRes = await apiPost('/orders', { pickup_location: 'Point A', delivery_location: 'Point B', priority: 'STANDARD' }, cToken);
        const orderId = orderRes.data.order_id;
        console.log(`Order created: ${orderId}`);

        // 5. Operator Views Agents and Orders, then Assigns
        console.log("-> Operator fetching agents and assigning order...");
        const agentsRes = await apiGet('/agents', oToken);
        const agentId = agentsRes.data.find((a: any) => a.user_id === aRes.data.user_id).agent_id;

        await apiPost('/scheduler/assign', { order_id: orderId, agent_id: agentId }, oToken);
        console.log(`Order assigned to agent: ${agentId}`);

        // 6. Agent updates status
        console.log("-> Agent updating status to PICKED_UP then DELIVERED...");
        await apiPut(`/orders/${orderId}/status`, { status: 'PICKED_UP' }, aToken);
        await apiPut(`/orders/${orderId}/status`, { status: 'DELIVERED' }, aToken);

        // 7. Verify final state
        const finalOrder = await apiGet(`/orders/${orderId}`, cToken);
        if (finalOrder.data.status === 'DELIVERED') {
            console.log("✅ INTEGRATION TEST PASSED! Order successfully delivered.");
        } else {
            console.error("❌ TEST FAILED! status not delivered.");
        }
    } catch (err: any) {
        console.error("❌ TEST FAILED WITH ERROR:", err.message || err);
    }
};

runIntegrationTest();
