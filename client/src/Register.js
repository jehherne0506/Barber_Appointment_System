import { useRef, useState } from "react";
import fetchWithRateLimit from "./fetchWithRateLimit";

import 'react-phone-number-input/style.css'
import PhoneInput from 'react-phone-number-input'
import { isValidPhoneNumber } from 'react-phone-number-input'

export default function Register(){
    let usernameRef = useRef(null);
    let emailRef = useRef(null);
    let passwordRef = useRef(null);
    const [phoneNumber, setPhoneNumber] = useState("");

    async function handleSubmit(e){console.log("submit")
        e.preventDefault();
        if(!isValidPhoneNumber(phoneNumber)){
            // error modal
            return;
        }
        const response = await fetchWithRateLimit("http://localhost:5000/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({"username": usernameRef.current.value, "email": emailRef.current.value, "password": passwordRef.current.value, "phoneNumber": phoneNumber})
        });
        
        const result = await response.json();
        if(result.status === "success"){
            console.log("ok");
        } else{
            if(result.message === "email"){
                console.log("Email is Registered.");
            } else{
                console.log("An Error has Occured.");
            }
        }
    }

    return(
        <div className="register">
            <h1>Register</h1>
            <form onSubmit={(e)=>{handleSubmit(e)}}>
                <input ref={usernameRef} type="text" placeholder="Username" required minLength={2} />
                <input ref={emailRef} type="email"  placeholder="Email" required />
                <input ref={passwordRef} type="password"  placeholder="Password" required minLength={8} />
                <PhoneInput
                placeholder="Enter phone number"
                value={phoneNumber}
                onChange={setPhoneNumber}/>
                <button type="submit">Register</button>
            </form>
        </div>
    )
}