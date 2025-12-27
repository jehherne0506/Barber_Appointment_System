import { useEffect } from "react";
import { useNavigate } from "react-router-dom"

export default function VerifyEmailFailFallback(){
    const navigate = useNavigate();

    useEffect(()=>{
          navigate("/auth/register", {state: {errorModalOpen: true, errorModalType: "emailVerifiedFail"}})
    }, []);
}