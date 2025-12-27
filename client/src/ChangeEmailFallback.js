import { useEffect } from "react"
import { useNavigate } from "react-router-dom"

export default function ChangeEmailFallback(){
    const navigate = useNavigate();

    useEffect(()=>{
          navigate("/auth/login", {state: {successModalOpen: true, successModalType: "changeEmailSuccess"}})
        }, []);
}