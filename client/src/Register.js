import { useRef, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import fetchWithRateLimit from "./fetchWithRateLimit";

import 'react-phone-number-input/style.css'
import PhoneInput from 'react-phone-number-input'
import { isValidPhoneNumber } from 'react-phone-number-input'
import logoImg from "./public/logoTransparent.png";
import eyeOpen from "./public/eyeOpen.png";
import eyeClose from "./public/eyeClose.png"

import ErrorModal from "./ErrorModal";
import API_URL from './config';

export default function Register(){
    const [passwordView, setPasswordView] = useState(true);
    let usernameRef = useRef(null);
    let emailRef = useRef(null);
    let passwordRef = useRef(null);
    const [phoneNumber, setPhoneNumber] = useState("");
    const [validPhoneNumber, setValidPhoneNumber] = useState(true);

    const [errorModalOpen, setErrorModalOpen] = useState(false);
    const [errorModalType, setErrorModalType] = useState("");

    const navigate = useNavigate();
    const location = useLocation();

    useEffect(()=>{
        if(location?.state?.errorModalOpen){
            setErrorModalOpen(true);
            setErrorModalType(location.state.errorModalType || "error");
        }
    }, [])

    async function handleSubmit(e){console.log("submit")
        e.preventDefault();
        if(!isValidPhoneNumber(phoneNumber)){
            setValidPhoneNumber(false);
            return;
        }
        const response = await fetchWithRateLimit(`${API_URL}/auth/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({"username": usernameRef.current.value, "email": emailRef.current.value, "password": passwordRef.current.value, "phoneNumber": phoneNumber})
        });
        
        const result = await response.json();
        if(result.status === "success"){
            navigate("/auth/login", {state: {successModalOpen: true, successModalType: "emailVerification"}})
        } else{
            if(result.message === "email"){
                setErrorModalOpen(true);
                setErrorModalType("emailRegistered");
            } else{
                setErrorModalOpen(true);
                setErrorModalType("error");
            }
        }
    }

    return(
        <div className="min-h-screen w-full bg-stone-900 flex items-center justify-center p-4">
            <div className="flex flex-col sm:flex-row rounded-xl font-sans shadow-2xl w-full max-w-5xl text-white overflow-hidden min-h-[600px]">
                <div className="flex-1 py-10 px-4 justify-center items-center bg-stone-800">
                    <form className="flex flex-col items-center gap-5 mx-5" onSubmit={(e)=>{handleSubmit(e)}}>
                        <img className="w-72" src={logoImg} alt="Brand Logo" />
                        <div className="flex flex-col gap-1 w-full items-start">
                            <label htmlFor="username">Username</label>
                            <input className="h-10 w-full rounded-md bg-stone-700 px-2" id="username" type="text" ref={usernameRef} required minLength={2} />
                        </div>
                        <div className="flex flex-col gap-1 w-full items-start">
                            <label htmlFor="email">Email</label>
                            <input className="h-10 w-full rounded-md bg-stone-700 px-2" id="email" type="email" ref={emailRef} required />
                        </div>
                        <div className="flex flex-col gap-1 w-full items-start">
                            <label htmlFor="password">Password</label>
                            <div className="relative w-full">
                                <input className="h-10 w-full rounded-md bg-stone-700 px-2" id="text" type={passwordView ? "text" : "password"} ref={passwordRef} required />
                                <img className="absolute top-2 right-2 w-6 cursor-pointer" src={passwordView ? eyeOpen : eyeClose} onClick={()=>{setPasswordView(prevPasswordView => !prevPasswordView)}} />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 w-full items-start text-white">
                            <label htmlFor="phoneNumber">Phone Number</label>
                            <div className="h-10 w-full rounded-md bg-stone-700 flex items-center text-black px-2">
                                <PhoneInput
                                value={phoneNumber}
                                onChange={setPhoneNumber}
                                defaultCountry="MY"
                                numberInputProps={{
                                    className: "w-full h-full bg-transparent border-none outline-none text-white placeholder-gray-400 ml-2"
                                }}

                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    width: '100%',
                                    height: '100%'
                                }}
                                required
                                 />
                            </div>
                            {!validPhoneNumber && (
                                <p className="mt-2 text-sm text-red-500 font-bold animate-pulse">
                                    Please enter a valid phone number.
                                </p>
                            )}
                        </div>
                        <button type="submit" className="bg-yellow-500 py-4 mb-2 border-yellow-600 border-2 w-full font-bold text-lg rounded-md">Register</button>
                    </form>

                    <br></br> 

                    <div className="flex gap-5 justify-center mt-2">
                        <a className="bg-white rounded-full p-2" href={`${API_URL}/auth/google`}><img className="w-8" src="https://img.icons8.com/?size=100&id=17949&format=png&color=000000" alt="Google Logo" /></a>
                        <a className="bg-white rounded-full p-2" href={`${API_URL}/auth/facebook`}><img className="w-8" src="https://img.icons8.com/?size=100&id=118497&format=png&color=000000" alt="Facebook Logo" /></a>
                    </div>

                    <div className="mt-4">
                        <p>Have an account already? <a href="./login" className="font-bold">Login</a></p>
                    </div>
                </div>
                <div className="hidden sm:flex flex-1">
                    <img className="w-full h-full object-cover opacity-80" src="https://images.pexels.com/photos/7518736/pexels-photo-7518736.jpeg" alt="Barber Service" />
                </div>  
            </div>
            {errorModalOpen && <ErrorModal type={errorModalType} errorModalOpen={errorModalOpen} setErrorModalOpen={setErrorModalOpen} />}
        </div>
    )
}