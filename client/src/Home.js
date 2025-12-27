import { useState, useRef, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";

import { BiLogoFacebook } from "react-icons/bi";
import { FaInstagram } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { FaYoutube } from "react-icons/fa";
import Hamburger from 'hamburger-react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import checkAuthenticated from './checkAuthenticated';
import fetchWithRateLimit from './fetchWithRateLimit';
import SuccessModal from './SuccessModal';
import ErrorModal from "./ErrorModal";

import logoTransparent from "./public/logoTransparent.png";
import logoHuman from "./public/logoHuman.webp";
import homePage1 from "./public/homePage1.jpg";
import homePage2 from "./public/homePage2.jpg";
import homePage3 from "./public/homePage3.jpg";
import homePage4 from "./public/homePage4.webp";
import yellowBgPaper from "./public/yellowPaperBg.png";
import youtubePreview from "./public/youtubePreview.webp";
import phoneCall from "./public/phoneCall.png";
import calendar from "./public/calendar.png";
import scissors from "./public/scissors.png";
import rightArrow from "./public/rightArrow.png";
import haircut from "./public/haircut.svg";
import shave from "./public/shave.png";
import styling from "./public/style.svg";
import trimming from "./public/trim.svg";
import moustache from "./public/moustache.png";
import location from "./public/location.png";
import manager  from "./public/manager.jpg";
import close from "./public/close.png";
import brand1 from "./public/brand1.webp";
import brand2 from "./public/brand2.webp";
import brand3 from "./public/brand3.webp";
import brand4 from "./public/brand4.webp";
import brand5 from "./public/brand5.webp";
import brand6 from "./public/brand6.webp";
import brand7 from "./public/brand7.webp";
import brand8 from "./public/brand8.webp";
import barber1 from "./public/barber1.webp";
import barber2 from "./public/barber2.webp";
import barber3 from "./public/barber3.webp";
import barber4 from "./public/barber4.webp";
import caroussel1 from "./public/caroussel1.jpg";
import caroussel2 from "./public/caroussel2.jpg";
import caroussel3 from "./public/caroussel3.jpg";
import caroussel4 from "./public/caroussel4.jpg";
import caroussel5 from "./public/caroussel5.jpg";

const humanIcon = L.icon({
    iconUrl: logoHuman,
    className: "jumping-icon",
    iconSize:     [70, 70], // size of the icon
    shadowSize:   [50, 64], // size of the shadow
    iconAnchor:   [35, 70], // point of the icon which will correspond to marker's location
    shadowAnchor: [4, 62],  // the same for the shadow
    popupAnchor:  [0, -76] // point from which the popup should open relative to the iconAnchor
});

L.Marker.prototype.options.icon = humanIcon;

const CustomerReviews = [
    {
        user: "Matthew Taylor - New York",
        review: "Great barber shop. Walked in and they took me immediately without an appointment. Quick haircut, great service and reasonable price. I didn't have to wait at all when I got to the barbershop."
    },
    {
        user: "Leonel Mooney - London",
        review: "Barber was friendly and professional. He asked me what kind of hairstyle I want/used to have and he gave me his input on what he thinks would look good with my head shape. Cheers guys!"
    },
    {
        user: "Herman Miller - Switzerland",
        review: "The Barbers is an affordable, convenient and good quality place to get my hair cut. It is a friendly, laid back environment with great professionals. It is also friendly for all ages from kids to adults!"
    },
];

export default function Home(){
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const userRef = useRef(null);
    const [isOpenHamburgerMenu, setOpenHamburgerMenu] = useState(false);
    const [openVideo, setOpenVideo] = useState(false);
    const [customerReviewIdx, setCustomerReviewIdx] = useState(0);

    const [successModalOpen, setSuccessModalOpen] = useState(false);
    const [successModalType, setSuccessModalType] = useState("");

    const [errorModalOpen, setErrorModalOpen] = useState(false);

    const feedbackName = useRef(null);
    const feedbackEmail = useRef(null);
    const feedbackDate = useRef(null);
    const feedbackService = useRef(null);
    const feedbackComment = useRef(null);

    const navigate = useNavigate();
    const location = useLocation();

    useEffect(()=>{
        if(location.state && Object.keys(location.state).length > 0){console.log("open success")
            if(location.state?.successModalOpen){
                setSuccessModalOpen(true);
                setSuccessModalType(location.state.successModalType || "login");
            }
            navigate(location.pathname, {replace: true, state: {}}); // clear state
        }
    }, [location.state]);

    useEffect(()=>{
        async function checkAuth() {
            const { authenticated } = await checkAuthenticated(setIsAuthenticated, userRef);
            if (!authenticated) {
                navigate("/auth/login", {state: {errorModalOpen: true}});
            }
        }
        checkAuth();
    }, [navigate]);

    async function handleSubmitFeedback(e){
        e.preventDefault(); console.log(feedbackEmail.current.value, feedbackDate.current.value , feedbackService.current.value , feedbackComment.current.value)
        if(feedbackName.current.value && feedbackEmail.current.value && feedbackDate.current.value && feedbackService.current.value && feedbackComment.current.value){
            const response = await fetchWithRateLimit("https://barber-appointment-system-g7f5.onrender.com/feedback", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name: feedbackName.current.value,
                    email: feedbackEmail.current.value,
                    date: feedbackDate.current.value,
                    service: feedbackService.current.value,
                    comment: feedbackComment.current.value
                })
            });

            const result = await response.json(); console.log(result)
            if(result.status === "success"){
                feedbackName.current.value = null;
                feedbackEmail.current.value = null;
                feedbackDate.current.value = null;
                feedbackService.current.value = null;
                feedbackComment.current.value = null;
                setSuccessModalOpen(true);
                setSuccessModalType("feedback");
            } else if(result.status === "fail" && result.message === "auth"){
                navigate("/auth/login", {state: {errorModalOpen: true}});
            } else{
                setErrorModalOpen(true);
            }
        } else{
            setErrorModalOpen(true);
        }
    };

    return(
        <>
            {isAuthenticated && <div className="w-full">
                <div className="flex flex-col text-white min-h-screen bg-cover bg-center" style={{backgroundImage: `url(${homePage1})`}}>
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
                            <Link className="text-inherit no-underline cursor-pointer hover:text-yellow-700 transition-colors duration-300 ease-in-out" to="/profile">Profile</Link>
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
                                    <Link className="text-inherit no-underline cursor-pointer hover:text-yellow-700 transition-colors duration-300 ease-in-out" to="/appointment">Appointment</Link>
                                    <Link className="text-inherit no-underline cursor-pointer hover:text-yellow-700 transition-colors duration-300 ease-in-out" to="/profile">Profile</Link>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="text-white flex flex-col flex-grow justify-center items-center px-8 gap-6 relative z-0">
                        <h1 className="font-roboto font-bold text-2xl sm:text-3xl ">Malaysia Popular Barber</h1>
                        <h1 className="font-bartle text-3xl lg:text-4xl">Talented men's <br></br> barber studio</h1>
                        <button className="group relative overflow-hidden w-fit bg-white text-black font-sans gap-2 font-bold rounded-md" onClick={()=>{navigate("/makeAppointment")}}>
                                <div className="flex items-center gap-2 transition-transform duration-500 ease-in-out p-6 group-hover:-translate-y-full">
                                    <img className="w-5" src={calendar} alt="Calendar Icon" />
                                    <p>Online Appointment</p>
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center gap-2 translate-y-full transition-transform duration-500 ease-in-out p-6 group-hover:translate-y-0">
                                    <img className="w-5 group-hover:translate-y-0" src={calendar} alt="Calendar Icon" />
                                    <p>Online Appointment</p>
                                </div>
                        </button>
                    </div>
                </div>

                <div className="w-full p-6">
                    <div className="flex flex-col lg:flex-row mt-10 lg:mt-20 gap-10 items-center">
                        <div className="flex-1 flex justify-center flex-col items-center">
                            <div className="flex justify-center max-w-lg flex-col gap-8 text-left">
                                <p className="text-[4rem] lg:text-[8rem] relative lg:right-6 font-dela text-yellow-600">2026</p>
                                <h1 className="font-bartle text-3xl">Award <span className="underline underline-offset-4 decoration-yellow-600 decoration-2">winning</span> barber studio.</h1>
                                <p className="font-robotoCondensed text-gray-600">Our barbers are carefully hand-picked to ensure the finest service in our barbershops around Malaysia and the world. We’re well trusted to deliver excellence with over 5000+ customer reviews.</p>
                                <div className="flex gap-4 font-robotoCondensed">
                                    <button className="group relative overflow-hidden w-fit text-white bg-black flex justify-center items-center gap-2 rounded-md">
                                        <div className="flex p-4 group-hover:-translate-y-full items-center justify-center transition-transform duration-500 ease-in-out">
                                            <img className="w-5" src={scissors} alt="Scissors Icon" />
                                            <p className="font-robotoCondensed">Explore Services</p>
                                        </div>
                                        <div className="flex p-4 absolute inset-0 items-center justify-center transition-transform duration-500 ease-in-out translate-y-full group-hover:translate-y-0">
                                            <img className="w-5" src={scissors} alt="Scissors Icon" />
                                            <p className="font-robotoCondensed">Explore Services</p>
                                        </div>
                                    </button>
                                    <button className="group w-fit p-4 flex justify-center items-center gap-2 rounded-md text-black">
                                        <img className="w-0 group-hover:w-4 group-hover:opacity-100 transition-all duration-500 ease-in-out" src={rightArrow} alt="Left Arrow Icon" />
                                        <p className="font-robotoCondensed">Our Barbers</p>
                                        <img className="w-4 group-hover:w-0 group-hover:opacity-0 transition-all duration-500 ease-in-out" src={rightArrow} alt="Right Arrow Icon" />
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="w-full flex-1 relative">
                            <div className="relative top-20 lg:right-20 text-right flex flex-col">
                                <p className="text-[1rem] font-bartle text-black">Since</p>
                                <p className="text-[3rem] font-dela text-yellow-600">2025</p>
                            </div>
                            <img className="w-[50%] shadow-lg rounded-md" src={homePage2} alt="Barber" />
                            <img className="w-[50%] shadow-2xl aspect-square -mt-[40%] ml-[40%] rounded-md" src={homePage3} alt="Barber Equipment" />
                        </div>
                    </div>
                </div>

                <img className="mt-5" src={yellowBgPaper} alt="Yellow Background" />
                <div className="bg-yellow-150">
                    <h1 className="w-full font-bartle text-2xl sm:text-3xl pt-5">Barbershop <span className="underline decoration-yellow-600 underline-offset-4 decoration-2">services</span></h1>
                    <div className="flex flex-wrap justify-center p-12 mt-5">
                        <div className="serviceContainer w-full sm:w-1/2 lg:w-1/4 border-2 border-t-0 border-l-0 border-r-0 md:border-b-0 mb-10 lg:mb-0">
                            <div className="flex flex-col items-center relative">
                                <div className="circle w-[90px] h-[90px] rounded-full bg-white"></div>
                                <img className="w-16 absolute top-10" src={haircut} alt="Haircut Icon" />
                            </div>
                            <div className="my-10 px-5 flex flex-col gap-2 text-lg">
                                <h1 className="font-geom font-bold">Haircutting</h1>
                                <p className="font-robotoCondensed text-gray-600 sm:h-[50px]">Well-crafted haircut defines your look and confidence.</p>
                            </div>
                            <div className="border-2 border-x-0 p-3 border-b-0 sm:border-b-2">
                                <p className="font-geom text-sm font-bold">STARTING FROM RM25</p>
                            </div>
                        </div>
                        <div className="serviceContainer w-full sm:w-1/2 lg:w-1/4 border-2 border-t-0 border-r-0 md:border-b-0 mb-10 lg:mb-0 border-l-0 sm:border-l-2">
                            <div className="flex flex-col items-center relative">
                                <div className="circle w-[90px] h-[90px] rounded-full bg-white"></div>
                                <img className="w-16 absolute top-10" src={shave} alt="Shave Icon" />
                            </div>
                            <div className="my-10 px-5 flex flex-col gap-2 text-lg">
                                <h1 className="font-geom font-bold">Shaving</h1>
                                <p className="font-robotoCondensed text-gray-600 sm:h-[50px]">Your shave defines how clean and confident you look.</p>
                            </div>
                            <div className="border-2 border-x-0 p-3 border-b-0 sm:border-b-2">
                                <p className="font-geom text-sm font-bold">STARTING FROM RM35</p>
                            </div>
                        </div>
                        <div className="serviceContainer w-full sm:w-1/2 lg:w-1/4 border-2 border-t-0 border-r-0 md:border-b-0 border-l-0 lg:border-l-2 mb-10 lg:mb-0">
                            <div className="flex flex-col items-center relative">
                                <div className="circle w-[90px] h-[90px] rounded-full bg-white"></div>
                                <img className="w-16 absolute top-10" src={styling} alt="Styling Icon" />
                            </div>
                            <div className="my-10 px-5 flex flex-col gap-2 text-lg">
                                <h1 className="font-geom font-bold">Styling</h1>
                                <p className="font-robotoCondensed text-gray-600 sm:h-[50px]">The right styling will greatly enhances your overall look.</p>
                            </div>
                            <div className="border-2 border-x-0 p-3 border-b-0 sm:border-b-2">
                                <p className="font-geom text-sm font-bold">STARTING FROM RM35</p>
                            </div>
                        </div>
                        <div className="serviceContainer w-full sm:w-1/2 lg:w-1/4 border-2 border-t-0 border-r-0 md:border-b-0 mb-10 lg:mb-0 border-l-0 sm:border-l-2">
                            <div className="flex flex-col items-center relative">
                                <div className="circle w-[90px] h-[90px] rounded-full bg-white"></div>
                                <img className="w-16 absolute top-10" src={trimming} alt="Trimming Icon" />
                            </div>
                            <div className="my-10 px-5 flex flex-col gap-2 text-lg">
                                <h1 className="font-geom font-bold">Trimming</h1>
                                <p className="font-robotoCondensed text-gray-600 sm:h-[50px]">Proper trimming keeps your style sharp and refined.</p>
                            </div>
                            <div className="border-2 border-x-0 p-3 border-b-0 sm:border-b-2">
                                <p className="font-geom text-sm font-bold">STARTING FROM RM35</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-2 pb-10 w-[80%] mx-[10%]">
                        <img className="w-12" src={moustache} alt="Moustache Icon" />
                        <p className="text-xl font-robotoCondensed text-gray-600">We're dedicated to empowering men to look and feel fantastic.</p>
                    </div>
                </div>

                <div className="flex bg-yellow-150 pt-20 mb-20 sm:mb-40 overflow-hidden relative w-full no-scrollbar">
                    <div className="flex shrink-0 h-[200px] sm:h-[500px] animate-caroussel z-20">
                        <img className="h-full w-auto object-cover pr-8 rounded-md" src={caroussel1} alt="Caroussel 1" />
                        <img className="h-full w-auto object-cover pr-8 rounded-md" src={caroussel2} alt="Caroussel 2" />
                        <img className="h-full w-auto object-cover pr-8 rounded-md" src={caroussel3} alt="Caroussel 3" />
                        <img className="h-full w-auto object-cover pr-8 rounded-md" src={caroussel4} alt="Caroussel 4" />
                        <img className="h-full w-auto object-cover pr-8 rounded-md" src={caroussel5} alt="Caroussel 5" />
                    </div>
                    <div className="flex shrink-0 h-[200px] sm:h-[500px] animate-caroussel z-20" aria-hidden="true">
                        <img className="h-full w-auto object-cover pr-8 rounded-md" src={caroussel1} alt="Caroussel 1" />
                        <img className="h-full w-auto object-cover pr-8 rounded-md" src={caroussel2} alt="Caroussel 2" />
                        <img className="h-full w-auto object-cover pr-8 rounded-md" src={caroussel3} alt="Caroussel 3" />
                        <img className="h-full w-auto object-cover pr-8 rounded-md" src={caroussel4} alt="Caroussel 4" />
                        <img className="h-full w-auto object-cover pr-8 rounded-md" src={caroussel5} alt="Caroussel 5" />
                    </div>
                    <div className="absolute bottom-0 left-0 w-full h-[50%] z-10">
                        <img className="absolute rotate-180 z-20" src={yellowBgPaper} alt="Yellow Background" />
                        <div className="absolute top-1/2 -translate-y-1/2 bg-white z-10 w-full h-full"></div>
                    </div>
                </div>

                <div className="relative bg-white">
                    <div className="absolute h-1/2 bg-yellow-150 bottom-0 left-0 w-full"></div>
                    <img className="relative z-10 w-[80%] mx-[10%] rounded-md cursor-pointer" onClick={()=>{setOpenVideo(true)}} src={youtubePreview} />
                    <div className="flex justify-center items-center absolute z-20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full w-[10%] h-[10%] sm:w-32 sm:h-32 p-10 text-white border-white border-[1px] cursor-pointer" onClick={()=>{setOpenVideo(true)}}>
                        <p>PLAY</p>
                    </div> 
                    <img className="mt-5 absolute top-1/2 -translate-y-1/2 z-1" src={yellowBgPaper} alt="Yellow Background" />
                </div>

                {openVideo && 
                    <div className="fixed inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm z-20">
                        <iframe
                        className="aspect-video mx-5 w-full max-w-4xl z-30"
                        title="The Fade Hub Preview"
                        src="https://www.youtube.com/embed/_GSc3uAm8rQ?rel=0"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" 
                        allowFullScreen>
                        </iframe>

                        <div className="absolute top-10 right-10 cursor-pointer"><button onClick={()=>{setOpenVideo(false)}} className="text-white w-[50px] h-[50px] bg-neutral-800 rounded-full flex justify-center items-center"><img className="w-4" src={close} alt="Close Video Button" /></button></div>

                        <div className="absolute inset-0 z-0" onClick={()=>{setOpenVideo(false)}}></div>
                    </div>
                }

                <div className="pt-20 pb-10 bg-yellow-150">
                    <h1 className="px-10 sm:px-20 font-geom text-2xl sm:text-3xl">We've worked with the world most <span className="font-bartle underline decoration-yellow-600 underline-offset-4 decoration-2">iconic premium brands.</span></h1>
                    <div className="allBrands flex flex-wrap justify-center p-12 lg:px-32">
                        <div className="eachBrand w-full py-5 sm:w-1/2 lg:w-1/4 flex justify-center border-t-0 border-l-0 border-r-0 border-b-2 sm:border-r-2">
                            <img src={brand1} alt="Brand Revlon" />
                        </div>
                        <div className="eachBrand w-full py-5 sm:w-1/2 lg:w-1/4 flex justify-center border-t-0 border-l-0 border-r-0 border-b-2 lg:border-r-2">
                            <img src={brand2} alt="Brand Loreal" />
                        </div>
                        <div className="eachBrand w-full py-5 sm:w-1/2 lg:w-1/4 flex justify-center border-t-0 border-l-0 border-r-0 border-b-2 sm:border-r-2">
                            <img src={brand3} alt="Brand Lakme" />
                        </div>
                        <div className="eachBrand w-full py-5 sm:w-1/2 lg:w-1/4 flex justify-center border-t-0 border-l-0 border-r-0 border-b-2">
                            <img src={brand4} alt="Brand Beyonce" />
                        </div>
                        <div className="eachBrand w-full py-5 sm:w-1/2 lg:w-1/4 flex justify-center border-2 border-t-0 border-l-0 border-b-2 lg:border-b-0 border-r-0 sm:border-r-2">
                            <img src={brand5} alt="Brand Jovan" />
                        </div>
                        <div className="eachBrand w-full py-5 sm:w-1/2 lg:w-1/4 flex justify-center border-2 border-t-0 border-l-0 border-b-2 lg:border-b-0 border-r-0 lg:border-r-2">
                            <img src={brand6} alt="Brand Burberry" />
                        </div>
                        <div className="eachBrand w-full py-5 sm:w-1/2 lg:w-1/4 flex justify-center border-2 border-t-0 border-l-0 border-b-2 lg:border-b-0 border-r-0 sm:border-r-2">
                            <img src={brand7} alt="Brand Biotherm" />
                        </div>
                        <div className="eachBrand w-full py-5 sm:w-1/2 lg:w-1/4 flex justify-center border-2 border-t-0 border-l-0 border-b-2 lg:border-b-0 border-r-0">
                            <img src={brand8} alt="Brand Tonymoly" />
                        </div>
                    </div> 
                </div>
                <img className="rotate-180" src={yellowBgPaper} alt="Yellow Background" />

                <div className="my-20">
                    <h1 className="text-2xl sm:text-3xl font-bartle">Talented <span className="underline underline-offset-4 decoration-yellow-600 decoration-2">Barbers</span></h1>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 w-full justify-center px-10 lg:px-32 py-12">
                        <div className="group hover:-translate-y-3 transition-transform duration-500 flex relative justify-center items-end bg-yellow-150 rounded-md">
                            <img src={barber1} alt="Barber 1" />
                            <div className="absolute inset-0 flex items-end justify-center opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-gradient-to-t from-yellow-600 to-transparent">
                                <div className="hidden group-hover:flex w-full px-10 absolute bottom-5 justify-between">
                                    <div className="flex flex-col text-left">
                                        <p className="text-white font-geom text-lg">Michael Ruheen</p>
                                        <p className="text-gray-200 font-geom">Hair Stylist</p>
                                    </div>
                                    <div className="bg-black p-3 w-[50px] aspect-square flex justify-center items-center rounded-full text-white cursor-pointer">
                                        <FaInstagram className="sm:text-lg" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="group hover:-translate-y-3 transition-transform duration-500 flex relative justify-center items-end bg-yellow-150 rounded-md">
                            <img src={barber2} alt="Barber 2" />
                            <div className="absolute inset-0 flex items-end justify-center opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-gradient-to-t from-yellow-600 to-transparent">
                                <div className="hidden group-hover:flex w-full px-10 absolute bottom-5 justify-between">
                                    <div className="flex flex-col text-left">
                                        <p className="text-white font-geom text-lg">Denver Dover</p>
                                        <p className="text-gray-200 font-geom">Haircut Barber</p>
                                    </div>
                                    <div className="bg-black p-3 w-[50px] aspect-square flex justify-center items-center rounded-full text-white cursor-pointer">
                                        <FaInstagram className="sm:text-lg" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="group hover:-translate-y-3 transition-transform duration-500 flex relative justify-center items-end bg-yellow-150 rounded-md">
                            <img src={barber3} alt="Barber 3" />
                            <div className="absolute inset-0 flex items-end justify-center opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-gradient-to-t from-yellow-600 to-transparent">
                                <div className="hidden group-hover:flex w-full px-10 absolute bottom-5 justify-between">
                                    <div className="flex flex-col text-left">
                                        <p className="text-white font-geom text-lg">Sergio Vincencio</p>
                                        <p className="text-gray-200 font-geom">Shaving Master</p>
                                    </div>
                                    <div className="bg-black p-3 w-[50px] aspect-square flex justify-center items-center rounded-full text-white cursor-pointer">
                                        <FaInstagram className="sm:text-lg" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="group hover:-translate-y-3 transition-transform duration-500 flex relative justify-center items-end bg-yellow-150 rounded-md">
                            <img src={barber4} alt="Barber 4" />
                            <div className="absolute inset-0 flex items-end justify-center opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-gradient-to-t from-yellow-600 to-transparent">
                                <div className="hidden group-hover:flex w-full px-10 absolute bottom-5 justify-between">
                                    <div className="flex flex-col text-left">
                                        <p className="text-white font-geom text-lg">Diogo Zente</p>
                                        <p className="text-gray-200 font-geom">Hair Stylist</p>
                                    </div>
                                    <div className="bg-black p-3 w-[50px] aspect-square flex justify-center items-center rounded-full text-white cursor-pointer">
                                        <FaInstagram className="sm:text-lg" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-2 w-[80%] mx-[10%]">
                        <img className="w-12" src={moustache} alt="Moustache Icon" />
                        <p className="text-xl font-robotoCondensed text-gray-600">Our nearly 80 committed talented barbers are ready to help.</p>
                    </div>
                </div>

                <img src={yellowBgPaper} alt="Yellow Background" />

                <div className="pt-12 pb-20 bg-yellow-150 flex flex-col gap-10 lg:gap-16">
                    <h1 className="text-2xl sm:text-3xl font-bartle">Satisfied <span className="underline underline-offset-4 decoration-yellow-600 decoration-2">Customers</span></h1>
                    <div className="flex flex-col lg:flex-row w-[70%] mx-auto h-full">
                        <div className="flex-1 flex justify-start text-lg">
                            <p className="hidden lg:flex border-r-2 px-4 items-center font-roboto text-sm cursor-pointer hover:text-gray-600" onClick={()=>{setCustomerReviewIdx(prevIdx => prevIdx === 0 ? 2 : prevIdx - 1)}}>PREV</p>
                        </div>
                        <div className="flex-[8] flex justify-center items-center lg:px-20">
                            {
                                CustomerReviews && customerReviewIdx !== null && (
                                    <div key={customerReviewIdx} className="flex flex-col gap-3 animate-fadeInSlide font-robotoCondensed text-lg">
                                        <p className="text-gray-600">{CustomerReviews[customerReviewIdx].review}</p>
                                        <h1 className="font-bold">{CustomerReviews[customerReviewIdx].user}</h1>
                                    </div>
                                )
                            }
                        </div>
                        <div className="flex-1 flex justify-center lg:justify-end mt-5 lg:mt-0 text-lg">
                            <p className="flex lg:hidden px-4 items-center font-roboto text-sm cursor-pointer" onClick={()=>{setCustomerReviewIdx(prevIdx => prevIdx === 0 ? 2 : prevIdx - 1)}}>PREV</p>
                            <p className="border-l-2 px-4 flex items-center font-roboto text-sm cursor-pointer hover:text-gray-600" onClick={()=>{setCustomerReviewIdx(prevIdx => prevIdx + 1 === CustomerReviews.length ? 0 : prevIdx + 1)}}>NEXT</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap justify-between w-[70%] mx-auto">
                        <div className="flex flex-col w-full sm:w-1/2 lg:w-1/4">
                            <h1 className="text-[2rem] font-bartle">737+</h1>
                            <p className="font-robotoCondensed">Haircuts Per Week</p>
                        </div>
                        <div className="flex flex-col w-full sm:w-1/2 lg:w-1/4">
                            <h1 className="text-[2rem] font-bartle">329+</h1>
                            <p className="font-robotoCondensed">Shaved Per Week</p>
                        </div>
                        <div className="flex flex-col w-full sm:w-1/2 lg:w-1/4">
                            <h1 className="text-[2rem] font-bartle">644+</h1>
                            <p className="font-robotoCondensed">Stylization Per Week</p>
                        </div>
                        <div className="flex flex-col w-full sm:w-1/2 lg:w-1/4">
                            <h1 className="text-[2rem] font-bartle">613+</h1>
                            <p className="font-robotoCondensed">Washing Per Week</p>
                        </div>
                    </div>
                </div>

                <div className="w-[-80%] mx-auto sm:w-full overflow-x-hidden">
                    <div className="relative">
                        <div className="h-[300px] lg:h-[600px] w-full relative z-0 mb-10 lg:mb-0">
                            <style>{`
                                .leaflet-container {
                                    height: 100% !important;
                                    width: 100% !important;
                                }

                                .leaflet-pane img {
                                    height: auto !important; 
                                    max-width: none !important; 

                                }

                                .jumping-icon {
                                    animation: jump 1.5s infinite ease-in-out
                                }

                                @keyframes jump{
                                    0%, 100%{
                                        margin-top: 0;
                                    }
                                    50%{
                                        margin-top: -30px;
                                    }
                                }
                            `}</style>

                            <MapContainer 
                                center={[3.140853, 101.693207]} 
                                zoom={15} 
                                scrollWheelZoom={false}
                                style={{ height: "100%", width: "100%" }}
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <Marker position={[3.140853, 101.693207]}>
                                    <Popup className="">
                                        <div className="flex flex-col items-center text-center">
                                            <h1 className="text-lg font-robotoCondensed font-bold pt-2">The Fade Hub</h1>
                                            <p className="font-robotoCondensed">13-1, Jalan Radin Bagus 1, 57000 Kuala Lumpur, Wilayah Persekutuan Kuala Lumpur</p>
                                            <div className="bg-black w-full text-white font-robotoCondensed cursor-pointer" onClick={()=>{window.open("https://maps.app.goo.gl/YMLyMtZyqH2yqkQN9")}}>
                                                <p>VIEW LARGER MAP</p>
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            </MapContainer>
                        </div>

                        <div className="relative mx-5 mb-10 lg:mb-0 rounded-md h-auto text-center lg:text-left lg:max-w-none lg:absolute bg-black lg:top-20 lg:right-20 lg:max-h-[420px] lg:aspect-square p-10 flex flex-col gap-5">
                            <h1 className="text-2xl sm:text-3xl font-bartle text-white">Contact Us</h1>
                            <div className="flex flex-col gap-3 mb-5">
                                <p className="text-lg font-robotoCondensed text-white">The Fade Hub</p>
                                <p className="font-robotoCondensed text-gray-400">13-1, Jalan Radin Bagus 1, Bandar Baru Sri Petaling, 57000 Kuala Lumpur, Wilayah Persekutuan Kuala Lumpur</p>
                                <p className="font-robotoCondensed text-white">Phone: 1-800-222-000</p>
                                <p className="font-robotoCondensed text-white">Email: yeohjehherne@gmail.com</p>
                            </div>
                            <hr></hr>
                            <div className="group flex gap-2 justify-center cursor-pointer" onClick={()=>{window.open("https://maps.app.goo.gl/YMLyMtZyqH2yqkQN9")}}>
                                <img className="w-6 text-white transition-all duration-500 ease-in-out 
                                group-hover:translate-x-4 group-hover:opacity-0 group-hover:w-0" src={location} alt="Location Icon Left" />
                                <p className="font-robotoCondensed text-white">SHOW ON GOOGLE MAP</p>
                                <div className="w-0 overflow-hidden transition-all duration-500 ease-in-out
                                group-hover:w-6 group-hover:opacity-100">
                                    <img className="w-6 min-w-[1.5rem] text-white" src={location} alt="Location Icon Right" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-10 flex flex-col lg:flex-row m-[2%] lg:m-[5%] gap-10 lg:gap-16">
                    <div className="w-full lg:w-1/3 flex flex-col gap-5 items-center sm:items-start flex-wrap text-center sm:text-left">
                        <h1 className="text-2xl sm:text-3xl font-bartle">Make a <span className="underline underline-offset-4 decoration-yellow-600 decoration-2">Feedback</span></h1>
                        <p className="text-gray-600 font-robotoCondensed">Your feedback will be directly forwarded to The Fade Hub Manager.</p>
                        <div className="p-4 rounded-md flex w-full bg-yellow-150 items-center">
                            <div className="w-1/3 ml-2">
                                <img className="w-16 h-16 object-cover rounded-full" src={manager} alt="Manager Portrait" />
                            </div>
                            <div className="w-2/3 text-xl">
                                <p className="font-robotoCondensed text-gray-600">Customer Service</p>
                                <p className="font-robotoCondensed text-black">+1 234 567 8910</p>
                            </div>
                        </div>
                    </div>
                    <form className="w-full lg:w-2/3 flex flex-col sm:flex-row text-gray-400 gap-6 sm:gap-16" onSubmit={(e)=>{handleSubmitFeedback(e)}}>
                        <div className="w-full sm:flex-1 flex flex-col gap-6">
                            <div className="w-full text-black">
                                <input className="w-full p-2 border-2 border-gray-200 focus:border-gray-400 outline-none rounded-md" placeholder="Your Name*" type="text" ref={feedbackName} required minLength={2} />
                            </div>
                            <div className="w-full text-black">
                                <input className="w-full p-2 border-2 border-gray-200 focus:border-gray-400 outline-none rounded-md" placeholder="Your Email Address*" ref={feedbackEmail} type="email" required />
                            </div>
                            <div className="w-full text-black">
                                <input className="w-full p-2 border-2 border-gray-200 focus:border-gray-400 outline-none rounded-md" type='date' min={new Date().toISOString().split("T")[0]} defaultValue={new Date().toISOString().split("T")[0]} ref={feedbackDate} required minLength={10} />
                            </div>
                            <div className="w-full text-left font-robotoCondensed hidden sm:block">
                                <p>We are committed to protecting your privacy. We will never collect information about you.</p>
                            </div> 
                        </div>
                        <div className="w-full sm:flex-1 flex flex-col gap-6">
                            <div className="w-full">
                                <select className="w-full text-black p-2 border-2 border-gray-200 focus:border-gray-400 outline-none rounded-md" defaultValue="" ref={feedbackService} required>
                                    <option disabled value="">Select barber service</option>
                                    <option>Haircut</option>
                                    <option>Shaving</option>
                                    <option>Hair Coloring</option>
                                    <option>Facial</option>
                                </select>
                            </div>
                            <div className="w-full flex-1">
                                <textarea className="w-full h-full text-black p-2 border-2 border-gray-200 focus:border-gray-400 outline-none rounded-md" placeholder="Your Feedback*" ref={feedbackComment} required />
                            </div>
                            <div className="w-full text-left block sm:hidden">
                                <p>We are committed to protecting your privacy. We will never collect information about you.</p>
                            </div> 
                            <button className="group w-full relative flex-1/2 rounded-md text-lg bg-black text-white font-geom hover:-translate-y-1 transition-all duration-200" type="submit">
                                <div className="p-2 flex justify-center items-center group-hover:-translate-y-full transition-all duration-500 ease-in-out">
                                    <p>Submit Feedback</p>
                                </div>
                                <div className="absolute inset-0 p-2 translate-y-full group-hover:translate-y-0 transition-all duration-500 ease-in-out">
                                    <p>Submit Feedback</p>
                                </div>
                            </button>
                        </div>
                    </form>
                </div>

                <div className="w-full py-10 px-5 flex flex-col items-center gap-10" style={{backgroundImage: `url(${homePage4})`}}>
                    <div className="flex flex-col justify-center items-center pb-5">
                        <img className="w-48 sm:w-72" src={logoTransparent} alt="logo" />
                        <h1 className="sm:px-[15%] font-bartle text-2xl sm:text-3xl text-yellow-700 r-in">Award winning barber studio</h1>
                    </div>
                    <div className="flex gap-5 text-white justify-center">
                        <div className="bg-neutral-700 p-5 flex justify-center items-center rounded-full cursor-pointer hover:bg-white hover:text-black transition-colors duration-500 ease-in-out" onClick={()=>{window.open("https://instagram.com")}}>
                            <FaInstagram className="text-lg sm:text-2xl" />
                        </div>
                        <div className="bg-neutral-700 p-5 flex justify-center items-center rounded-full cursor-pointer hover:bg-white hover:text-black transition-colors duration-500 ease-in-out" onClick={()=>{window.open("https://facebook.com")}}>
                            <BiLogoFacebook className="text-lg sm:text-2xl" />
                        </div>
                        <div className="bg-neutral-700 p-5 flex justify-center items-center rounded-full cursor-pointer hover:bg-white hover:text-black transition-colors duration-500 ease-in-out" onClick={()=>{window.open("https://x.com")}}>
                            <FaXTwitter className="text-lg sm:text-2xl" />
                        </div>
                        <div className="bg-neutral-700 p-5 flex justify-center items-center rounded-full cursor-pointer hover:bg-white hover:text-black transition-colors duration-500 ease-in-out" onClick={()=>{window.open("https://youtube.com")}}>
                            <FaYoutube className="text-lg sm:text-2xl" />
                        </div>
                    </div>
                    <p className="text-gray-500">© 2025 The Fade Hub is proudly powered by <span className="text-white underline underline-offset-4">Yeoh Jeh Herne</span></p>
                </div>
                <SuccessModal type={successModalType} successModalOpen={successModalOpen} setSuccessModalOpen={setSuccessModalOpen} />
                <ErrorModal type="error" errorModalOpen={errorModalOpen} setErrorModalOpen={setErrorModalOpen} />
            </div> }
        </>
    )
}