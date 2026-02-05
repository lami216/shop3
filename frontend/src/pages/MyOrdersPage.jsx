import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../lib/apiClient";

const MyOrdersPage = () => {
        const [orders, setOrders] = useState([]);

        useEffect(() => {
                apiClient.get("/orders/my").then(setOrders).catch(() => setOrders([]));
        }, []);

        return (
                <div className='mx-auto max-w-4xl px-4 py-10 text-white'>
                        <h1 className='text-2xl font-bold text-payzone-gold'>طلباتي</h1>
                        <div className='mt-6 space-y-3'>
                                {orders.map((order) => (
                                        <div key={order._id} className='rounded border border-white/20 p-4'>
                                                <p>{order.orderNumber}</p>
                                                <p>{order.status}</p>
                                                <Link className='text-payzone-gold underline' to={`/tracking/${order.trackingCode}`}>
                                                        فتح التتبع
                                                </Link>
                                        </div>
                                ))}
                        </div>
                </div>
        );
};

export default MyOrdersPage;
