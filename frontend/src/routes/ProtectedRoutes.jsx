import { Navigate, Outlet } from "react-router-dom"

const getAccessToken = () => {
    return sessionStorage.getItem("token");
}

export default function ProtectedRoutes() {
    const isAuthenticated = !!getAccessToken();
    
    if (!isAuthenticated) {
        return <Navigate to={"/signup"} replace/>
    }
    
    return <Outlet />;
}