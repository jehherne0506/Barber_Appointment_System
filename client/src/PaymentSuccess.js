import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function PaymentSuccess(){
    const navigate = useNavigate();

    useEffect(()=>{
      navigate("/appointment", {state: {successModalOpen: true}})
    }, []);
}