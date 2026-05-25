import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const Logout = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        logout();
        navigate("/login");
    }, [logout, navigate]);

    return (
        <div className="flex h-screen items-center justify-center">
            <p>Logging out...</p>
        </div>
    );
};

export default Logout;
