import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import fetchWithRateLimit from "./fetchWithRateLimit";
import logoImg from "./public/logoTransparent.png";
import eyeOpen from "./public/eyeOpen.png";
import eyeClose from "./public/eyeClose.png"

export default function Login(){
    const [passwordView, setPasswordView] = useState(true);

    const emailRef = useRef(null);
    const passwordRef = useRef(null);
    const navigate = useNavigate();

    async function handleSubmit(e){
        e.preventDefault();
        const response = await fetchWithRateLimit("http://localhost:5000/auth/login", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({email: emailRef.current.value, password: passwordRef.current.value})
        });

        const result = await response.json();
        if(result.status === "success"){
            if(result.role === "ADMIN"){
                navigate("/admin")
            } else{
                navigate("/");
            }
        } else if(result.status === "fail" && result.message === "email not verified"){
            console.log("email not verified");
        } else{
            console.log("error");
        }
    }

    return(
        <div className="min-h-screen w-full bg-stone-900 flex items-center justify-center p-4">
            <div className="flex flex-col sm:flex-row rounded-xl font-sans shadow-2xl w-full max-w-5xl text-white">
                <div className="hidden sm:flex flex-1">
                    <img className="w-full h-full object-cover opacity-80" src="https://images.pexels.com/photos/1813272/pexels-photo-1813272.jpeg?cs=srgb&dl=pexels-thgusstavo-1813272.jpg&fm=jpg" alt="Barber Service" />
                </div>

                <div className="flex-1 p-4 justify-center items-center bg-stone-800">
                    <form className="flex flex-col items-center gap-5 mx-5" onSubmit={(e)=>{handleSubmit(e)}}>
                        <img className="w-72" src={logoImg} alt="Brand Logo" />
                        <div className="flex flex-col gap-1 w-full items-start">
                            <label htmlFor="email">Email</label>
                            <input className="h-10 w-full rounded-md bg-stone-700 px-2" id="email" type="email" ref={emailRef} required />
                        </div>
                        <div className="flex flex-col gap-1 w-full items-start">
                            <label htmlFor="password">Password</label>
                            <div className="relative w-full">
                                <input className="h-10 w-full rounded-md bg-stone-700 px-2" id="password" type={passwordView ? "text" : "password"} ref={passwordRef} required minLength={8} />
                                <img className="absolute top-2 right-2 w-6 cursor-pointer" src={passwordView ? eyeOpen : eyeClose} onClick={()=>{setPasswordView(prevPasswordView => !prevPasswordView)}} />
                            </div>
                        </div>
                        <div className="flex w-full justify-end">
                            <a className="text-inherit no-underline cursor-inherit">Forgot Password?</a>
                        </div>
                        <button type="submit" className="bg-yellow-500 py-4 border-yellow-600 border-2 w-full font-bold text-lg rounded-md">Login</button> 
                    </form>

                    <br></br> 

                    <div className="flex gap-5 justify-center my-2">
                        <a className="bg-white rounded-full p-2" href="http://localhost:5000/auth/google"><img className="w-8" src="https://img.icons8.com/?size=100&id=17949&format=png&color=000000" alt="Google Logo" /></a>
                        <a className="bg-white rounded-full p-2" href="http://localhost:5000/auth/facebook"><img className="w-8" src="https://img.icons8.com/?size=100&id=118497&format=png&color=000000" alt="Facebook Logo" /></a>
                    </div>

                    <div className="mt-4">
                        <p>Don't have an account? <a href="./register" className="font-bold">Sign Up</a></p>
                    </div>
                </div>
            </div>
        </div>
    )
}