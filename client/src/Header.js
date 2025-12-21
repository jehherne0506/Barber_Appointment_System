import { Link } from "react-router-dom";

import homePage4 from "./public/homePage4.webp";
import phoneCall from "./public/phoneCall.png";
import logoHuman from "./public/logoHuman.webp";
import { BiLogoFacebook } from "react-icons/bi";
import { FaInstagram } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { FaYoutube } from "react-icons/fa";
import Hamburger from 'hamburger-react'

export default function Header({ isOpenHamburgerMenu, setOpenHamburgerMenu, homePage=false }){
    return(
        <div className="flex flex-col text-white bg-cover bg-center" style={{backgroundImage: `url(${homePage4})`}}>
            <div className="flex p-4 lg:py-4 lg:px-16 max-w-full justify-between items-center text-lg font-geom relative bg-white lg:bg-transparent">
                <div className="hidden lg:flex items-center gap-2 hover:cursor-pointer">
                    <img className="w-5" src={phoneCall} alt="Phone Call Icon" />
                    <p>1800 222 000</p>
                </div>
                <div className="lg:hidden">
                    <img className="w-14" src={logoHuman} alt="Logo" />
                </div>
                <div className="hidden lg:flex gap-10 items-center">
                    <Link className="text-inherit no-underline cursor-pointer hover:text-yellow-700 transition-colors duration-300 ease-in-out" to="/">Home</Link>
                    <Link className="text-inherit no-underline cursor-pointer hover:text-yellow-700 transition-colors duration-300 ease-in-out">About</Link>
                    <img className="w-20" src={logoHuman} alt="Logo" />
                    <Link className="text-inherit no-underline cursor-pointer hover:text-yellow-700 transition-colors duration-300 ease-in-out" to="/appointment">Appointment</Link>
                    <Link className="text-inherit no-underline cursor-pointer hover:text-yellow-700 transition-colors duration-300 ease-in-out">Profile</Link>
                </div>
                <div className="flex gap-3 items-center text-black lg:text-white">
                    <FaInstagram className="w-5 cursor-pointer hover:text-yellow-700 transition-colors duration-300 ease-in-out" onClick={()=>{window.open("https://instagram.com")}} />
                    <BiLogoFacebook className="w-5 cursor-pointer hover:text-yellow-700 transition-colors duration-300 ease-in-out" onClick={()=>{window.open("https://facebook.com")}} />
                    <FaXTwitter className="w-5 cursor-pointer hover:text-yellow-700 transition-colors duration-300 ease-in-out" onClick={()=>{window.open("https://x.com")}} />
                    <FaYoutube className="w-5 cursor-pointer hover:text-yellow-700 transition-colors duration-300 ease-in-out" onClick={()=>{window.open("https://youtube.com")}} />
                    <div className="lg:hidden">
                        <Hamburger size={20} toggled={isOpenHamburgerMenu} toggle={setOpenHamburgerMenu} /> 
                    </div>
                </div>
                {isOpenHamburgerMenu && (
                    <div className="absolute top-full left-0 w-full bg-white text-black z-10">
                        <div className="flex flex-col gap-5 p-4">
                            <Link className="text-inherit no-underline cursor-pointer hover:text-yellow-700 transition-colors duration-300 ease-in-out" to="/">Home</Link>
                            <Link className="text-inherit no-underline cursor-pointer hover:text-yellow-700 transition-colors duration-300 ease-in-out">About</Link>
                            <Link className="text-inherit no-underline cursor-pointer hover:text-yellow-700 transition-colors duration-300 ease-in-out">Services</Link>
                            <Link className="text-inherit no-underline cursor-pointer hover:text-yellow-700 transition-colors duration-300 ease-in-out">Pricing</Link>
                            <Link className="text-inherit no-underline cursor-pointer hover:text-yellow-700 transition-colors duration-300 ease-in-out">Barber</Link>
                            <Link className="text-inherit no-underline cursor-pointer hover:text-yellow-700 transition-colors duration-300 ease-in-out">Contact</Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}