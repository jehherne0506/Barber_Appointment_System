import { useRef } from "react";
import { useNavigate } from "react-router";
import fetchWithRateLimit from "./fetchWithRateLimit";

export default function Login(){
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
        <div className="min-h-screen bg-black flex items-center justify-center text-white">
            <form className="flex flex-col p-4 rounded-md bg-yellow-500 w-1/2" onSubmit={(e)=>{handleSubmit(e)}}>
                <h1>💈 Welcome!</h1>
                <p>Let’s get you looking sharp — <span className="font-bold ">Create Your Account ✂️</span></p>
                <input type="email" ref={emailRef} placeholder="Email" required />
                <input type="password"ref={passwordRef} placeholder="Password" required minLength={8} />
                <button type="submit">Login</button>
            </form>
        </div>
    )
}