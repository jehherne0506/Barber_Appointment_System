import { useRef, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import Header from "./Header"
import checkAuthenticated from "./checkAuthenticated";
import fetchWithRateLimit from "./fetchWithRateLimit";
import ProfilePage1 from "./public/profilePage1.avif";
import ErrorModal from "./ErrorModal";
import SuccessModal from "./SuccessModal";
import logoTransparent from "./public/logoTransparent.png";
import effect from "./public/effect.png";
import AddPhoneNumberModal from "./AddPhoneNumberModal";
import ChangeEmailModal from "./ChangeEmailModal";

import { GiPoliceBadge } from "react-icons/gi";
import { FaRegEdit } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { FaPen } from "react-icons/fa6";
import { IoMdArrowDropdown } from "react-icons/io";
import API_URL from "./config";
import ConfirmRedeemVoucherModal from "./ConfirmRedeemVoucherModal";

export default function Profile(){
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isOpenHamburgerMenu, setOpenHamburgerMenu] = useState(false);
    const [errorModalOpen, setErrorModalOpen] = useState(false);
    const [profileData, setProfileData] = useState(null);
    const [hairType, setHairType] = useState(null);
    const [barberNotes, setBarberNotes] = useState(null);
    const [hairTypeDropdown, setHairTypeDropdown] = useState(false);
    const [successModalOpen, setSuccessModalOpen] = useState(false);
    const [successModalType, setSuccessModalType] = useState(null);
    const [phoneNumberModalOpen, setPhoneNumberModalOpen] = useState(false);
    const [changeEmailModalOpen, setChangeEmailModalOpen] = useState(false);
    const [voucherRedeem, setVoucherRedeem] = useState(null);
    const [confirmRedeemVoucherModalOpen, setConfirmRedeemVoucherModalOpen] = useState(false);
    const [allVouchers, setAllVouchers] = useState(null);
    const [myVouchers, setMyVouchers] = useState(null);

    const userRef = useRef(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(()=>{
        if(location.state && Object.keys(location.state).length > 0){
            if(location.state.errorModalOpen){
                setErrorModalOpen(true);
            }
        }
    }, [location.state])

    useEffect(()=>{
        async function checkAuth() {
            const { authenticated } = await checkAuthenticated(setIsAuthenticated, userRef);
            if (!authenticated) {
                navigate("/auth/login", {state: {errorModalOpen: true}});
            }
        }
            
        checkAuth();
    }, [navigate]);

    useEffect(()=>{
        async function fetchProfile(){
            const response = await fetchWithRateLimit(`${API_URL}/profile`, {
                method: "GET",
                credentials: "include"
            });

            const result = await response.json();
            if(result.status === "success"){
                setProfileData(result.message);
                setHairType(result.message.styleProfile?.hairType || "Choose a Hair Type");
                setBarberNotes(result.message.styleProfile?.barberNotes);
            } else if(result.status === "fail" && result.message === "auth"){
                navigate("/auth/login", {state: {errorModalOpen: true}});
            } else{
                setErrorModalOpen(true);
            }
        }
        fetchProfile();
    }, [navigate])

    useEffect(()=>{
        async function fetchStoreVoucher(){
            const response = await fetchWithRateLimit(`${API_URL}/storeVoucher`, {
                method: "GET",
                credentials: "include"
            });

            const result = await response.json();
            if(result.status === "success"){
                setAllVouchers(result.message);
            } else if(result.status === "fail" && result.message === "auth"){
                navigate("/auth/login", {state: {errorModalOpen: true}});
            } else{
                setErrorModalOpen(true);
            }
        }
        fetchStoreVoucher();
    }, [navigate])

    useEffect(()=>{
        async function fetchUserVoucher(){
            const response = await fetchWithRateLimit(`${API_URL}/userVoucher`, {
                method: "GET",
                credentials: "include"
            });

            const result = await response.json();
            if(result.status === "success"){
                setMyVouchers(result.message);
            } else if(result.status === "fail" && result.message === "auth"){
                navigate("/auth/login", {state: {errorModalOpen: true}});
            } else{
                setErrorModalOpen(true);
            }
        }
        fetchUserVoucher();
    }, [])

    async function handleSubmitStyleProfile(){
        const response = await fetchWithRateLimit(`${API_URL}/styleProfile`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({hairType: hairType === "Choose a Hair Type" ? null : hairType, barberNotes})
        });

        const result = await response.json();
        if(result.status === "success"){
            setProfileData(prevProfileData => ({...prevProfileData, styleProfile: {...prevProfileData.styleProfile, barberNotes: barberNotes}}))
            setSuccessModalOpen(true);
            setSuccessModalType("styleProfile");
        } else if(result.status === "fail" && result.message === "auth"){
            navigate("/auth/login", {state: {errorModalOpen: true}});
        } else{
            setErrorModalOpen(true);
        }
    }

    async function handleRedeemVoucher(e, voucher){
        e.preventDefault();
        const response = await fetchWithRateLimit(`${API_URL}/redeemVoucher`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({voucherId: voucher._id})
        });

        const result = await response.json();
        if(result.status === "success"){
            setProfileData(prevProfileData => ({
                ...prevProfileData,
                points: prevProfileData.points - voucher.pointsRequired
            }))

            setMyVouchers(prevVouchers => {
                return {
                    usedVouchers: [...prevVouchers.usedVouchers],
                    availableVouchers: [
                        ...prevVouchers.availableVouchers,
                        {redeemedAt: new Date().toISOString(), voucherId: voucher}
                    ]
                }
            })

            if(voucher.limitCount){
                const newCount = voucher.limitCount - 1;
                setAllVouchers(prevVouchers => (
                    prevVouchers.map(prevVoucher => {
                        return prevVoucher._id === voucher._id ? {...prevVoucher, limitCount: newCount} : prevVoucher;
                    })
                ))
            }
            setSuccessModalOpen(true);
            setSuccessModalType("redeemVoucher");
        } else if(result.status === "fail" && result.message === "auth"){
            navigate("/auth/login", {state: {errorModalOpen: true}});
        } else{
            setErrorModalOpen(true);
        }
    }

    return(
        <>
            {isAuthenticated && profileData &&
                <>
                    <Header isOpenHamburgerMenu={isOpenHamburgerMenu} setOpenHamburgerMenu={setOpenHamburgerMenu} />
                    <div className='px-5 py-20 sm:p-28 text-white bg-cover flex flex-col flex-1 gap-14' style={{backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${ProfilePage1})`}}>
                        <div className='text-left'>
                            <div className="mb-10">
                                <h1 className='text-xl sm:text-4xl font-bartle mb-2'>My Profile</h1>
                                <p className='text-lg sm:text-xl font-geom opacity-80'>Manage your account settings</p>
                            </div>

                            <div className="flex flex-col xl:flex-row gap-10">
                                <div className="profile-card flex-1 bg-black/50 px-5 py-10 border-yellow-800 border-2 shadow-glow-yellow-before hover:shadow-glow-yellow-after transition-all duration-300 ease-in-out hover:scale-105 flex flex-col items-center rounded-lg">
                                    <img className="md:hidden w-40 mb-5" src={logoTransparent} alt="Logo" />
                                    <div className="relative flex justify-center md:justify-between w-full mb-10">
                                        <div className="flex flex-col text-center md:flex-row gap-5 items-center">
                                            <div className="relative group cursor-pointer">
                                                <img className="w-14 sm:w-24 rounded-full group-hover:opacity-50" src={profileData.avatar} alt="User Avatar" referrerPolicy="no-referrer" />
                                                <FaRegEdit className="hidden group-hover:block absolute top-1/2 right-1/2 -translate-y-1/2 translate-x-1/2 text-3xl text-white" />
                                            </div>
                                            <div className="flex flex-col gap-2 items-center md:items-start">
                                                <p className="text-2xl sm:text-2xl font-serif break-words">{profileData.username}</p>
                                                <div className="flex flex-col gap-2 items-center md:items-start">
                                                    <div className="flex items-center gap-2 text-yellow-600">
                                                        <GiPoliceBadge className="text-lg" />
                                                        <p className="font-geom font-bold sm:text-lg">{profileData.numberOfAppointments > 25 ? "VIP" : profileData.numberOfAppointments > 15 ? "Premium" : "Regular"} Member</p>
                                                    </div>
                                                    <div className="text-xs sm:text-sm font-robotoCondensed">
                                                        <p>Member Since: {new Date(profileData.date).toLocaleDateString("en-US", {year: "numeric", month: "long",day: "numeric",})}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <img className="hidden md:block absolute top-0 right-0 h-full object-contain" src={logoTransparent} alt="Logo" />
                                    </div>

                                    <hr className="w-full"></hr>

                                    <div className="flex flex-col sm:flex-row mt-10 gap-5 w-full">
                                        <div className="flex-1 flex flex-col gap-1 p-5 border border-gray-600 rounded-lg">
                                            <p className="text-sm font-robotoCondensed">Total Spent</p>
                                            <p className="text-lg font-dela">RM {profileData.totalSpent}</p>
                                        </div>

                                        <div className="flex-1 flex flex-col gap-1 p-5 border border-gray-600 rounded-lg">
                                            <p className="text-sm font-robotoCondensed">Booked</p>
                                            <p className="text-lg font-dela">{profileData.numberOfAppointments} Sessions</p>
                                        </div>
                                    </div>

                                    {profileData.appointmentPreferenceService && profileData.appointmentPreferenceStaff &&
                                        <div className="flex flex-col gap-1 p-5 border border-gray-600 rounded-lg w-full mt-10">
                                            <p className="text-sm">My Usual Preference</p>
                                            <p className="font-dela break-words">{profileData.appointmentPreferenceService} with {profileData.appointmentPreferenceStaff}</p>
                                        </div>
                                    }
                                </div>

                                <div className="flex-1 flex flex-col gap-5">
                                    <div className="bg-black/40 border border-gray-600 rounded-lg flex-1 p-4">
                                        <div className="flex gap-2 text-xl items-center">
                                            <MdEmail />
                                            <p className="font-geom font-bold text-xl">Contact Information</p>
                                        </div>
                                        <div className="mt-5">
                                            <p className="text-gray-300 text-sm font-robotoCondensed mb-2">Email Address</p>
                                            <div className="w-full flex gap-2">
                                                <input className="p-2 bg-black/60 w-1/2 rounded-lg border border-gray-600" placeholder={profileData.email} disabled/>
                                                <div className="flex-1 flex">
                                                    {(profileData.googleVerified || profileData.facebookVerified) ? (
                                                        <span className="w-full px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold uppercase tracking-widest flex justify-center items-center gap-1">
                                                            <span className="w-1.5 h-1.5 shrink-0 rounded-full bg-green-400 animate-pulse"></span>
                                                            {profileData.googleVerified ? "Google" : "Facebook"} Verified
                                                        </span>
                                                    ) : (profileData.emailVerified) ? (
                                                        <span className="w-full px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold uppercase tracking-widest flex justify-center items-center gap-1">
                                                            <span className="w-1.5 h-1.5 shrink-0 rounded-full bg-green-400 animate-pulse"></span>
                                                            Email Verified
                                                        </span>
                                                    ) : (
                                                        <span className="w-full px-3 py-1 rounded-full bg-red-500/10 border border-green-500/20 text-red-400 text-xs font-bold uppercase tracking-widest flex justify-center items-center gap-1">
                                                            <span className="w-1.5 h-1.5 shrink-0 rounded-full bg-red-400 animate-pulse"></span>
                                                            Not Verified
                                                        </span>
                                                    )}
                                                </div>
                                                <button className="w-10 h-10 flex justify-center items-center bg-yellow-600 border border-yellow-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-black" disabled={profileData.googleVerified || profileData.facebookVerified} onClick={()=>{setChangeEmailModalOpen(true)}}><FaPen /></button>
                                            </div>
                                        </div>
                                        <div className="mt-5">
                                            <p className="text-gray-300 text-sm font-robotoCondensed mb-2">Phone Number</p>
                                            <div className="w-full flex gap-2">
                                                <input className="p-2 bg-black/60 flex-1 rounded-lg border border-gray-600" placeholder={profileData.phoneNumber} disabled/>
                                                <button className="w-10 h-10 flex justify-center items-center bg-yellow-600 border border-yellow-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-black" onClick={()=>{setPhoneNumberModalOpen(true)}}><FaPen /></button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-black/40 border border-gray-600 rounded-lg flex-1 p-4">
                                        <div className="flex gap-2 text-xl items-center">
                                            <img className="w-[1.25rem]" src={effect} alt="Effect Icon" />
                                            <h1 className="font-geom font-bold">Style Profile</h1>
                                        </div>

                                        <div className="mt-5">
                                            <div className="">
                                                <p className="text-gray-300 text-sm font-robotoCondensed mb-2">Hair Type</p>
                                                <div className="relative w-full">
                                                    <div className="cursor-pointer" onClick={(()=>{setHairTypeDropdown(prevState => !prevState)})}>
                                                        <p className="p-2 bg-black/60 flex-1 rounded-lg border border-gray-600">{hairType}</p>
                                                        <IoMdArrowDropdown className="text-2xl absolute right-2 top-1/2 -translate-y-1/2" />
                                                    </div>                                                  
                                                {hairTypeDropdown &&
                                                        <div className="absolute z-10 bg-black p-2 w-full border border-t-0 border-gray-600 rounded-lg flex flex-col gap-2">
                                                            <p className="cursor-pointer" onClick={()=>{setHairType("Straight"); setHairTypeDropdown(false)}}>Straight</p>
                                                            <p className="cursor-pointer" onClick={()=>{setHairType("Wavy"); setHairTypeDropdown(false)}}>Wavy</p>
                                                            <p className="cursor-pointer" onClick={()=>{setHairType("Curly"); setHairTypeDropdown(false)}}>Curly</p>
                                                            <p className="cursor-pointer" onClick={()=>{setHairType("Coily"); setHairTypeDropdown(false)}}>Coily</p>
                                                            <p className="cursor-pointer" onClick={()=>{setHairType("Bald"); setHairTypeDropdown(false)}}>Bald</p>
                                                        </div>
                                                    }
                                                </div>
                                            </div>
                                            <div className="mt-5 w-full z-0">
                                                <p className="text-gray-300 text-sm font-robotoCondensed mb-2">Notes for Barber</p>
                                                <textarea className="w-full bg-black/60 border border-gray-600 rounded-lg p-2" placeholder={barberNotes} value={barberNotes} onChange={(e)=>{setBarberNotes(e.target.value)}}></textarea>
                                            </div>
                                            <div className="text-right mt-5 p-2">
                                                <button className="px-6 py-2 rounded-lg font-bold uppercase tracking-wider text-sm transition-all duration-300 bg-yellow-600 text-black hover:bg-yellow-500 hover:shadow-glow-yellow hover:-translate-y-0.5 disabled:bg-neutral-800 disabled:text-neutral-600 disabled:border disabled:border-neutral-700 disabled:shadow-none disabled:translate-y-0 disabled:cursor-not-allowed" 
                                                disabled={(profileData.styleProfile?.hairType || "Choose a Hair Type") === hairType && profileData.styleProfile?.barberNotes === barberNotes} onClick={handleSubmitStyleProfile}>Save Changes</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                           <div className="relative overflow-hidden bg-neutral-900/80 border border-yellow-600/30 rounded-xl p-6 mt-10 shadow-[0_0_15px_-5px_rgba(202,138,4,0.3)]">
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-600/10 rounded-full blur-2xl"></div>

                            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="text-center md:text-left">
                                    <h2 className="font-geom text-gray-400 uppercase tracking-[0.2em] text-sm md:text-base">
                                        Your Balance
                                    </h2>
                                    <h1 className="font-bartle text-white text-2xl md:text-3xl">
                                        Legacy Points
                                    </h1>
                                </div>

                                <div className="flex flex-col items-center md:items-end">
                                    <p className="font-hegarty text-5xl md:text-6xl text-yellow-500 drop-shadow-sm leading-none">
                                        {profileData.points || 0}
                                    </p>
                                    <p className="text-yellow-600/80 font-robotoCondensed text-xs uppercase tracking-widest mt-1">
                                        Available to redeem
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                                {allVouchers && allVouchers.map((voucher, idx) => (
                                    <div key={idx} className="group relative flex flex-col justify-between p-6 bg-neutral-900/80 border border-neutral-700 rounded-xl overflow-hidden hover:border-yellow-600/50 hover:shadow-[0_0_20px_-10px_rgba(202,138,4,0.3)] transition-all duration-300">

                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-600/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                        <div className="flex flex-col gap-1 mb-6">
                                            <div className="flex flex-row flex-wrap gap-x-5">
                                                <div className="w-fit mb-2 px-3 py-1 rounded-full bg-yellow-900/20 border border-yellow-700/50 transition-colors">
                                                    <p className="font-robotoCondensed text-xs font-bold text-yellow-600 uppercase tracking-widest">
                                                        {voucher.pointsRequired} PTS
                                                    </p>
                                                </div>
                                                {voucher.expiredAt &&
                                                    <div className="w-fit mb-2 px-3 py-1 rounded-full bg-orange-900/20 border border-orange-700/50">
                                                        <p className="font-robotoCondensed text-xs font-bold text-orange-500 uppercase tracking-widest">
                                                            Till {voucher.expiredAt.split("T")[0]}
                                                        </p>
                                                    </div>
                                                }
                                                {voucher.limitCount !== undefined ?
                                                    <div className="w-fit mb-2 px-3 py-1 rounded-full bg-emerald-900/20 border border-emerald-700/50">
                                                        <p className="font-robotoCondensed text-xs font-bold text-emerald-500 uppercase tracking-widest">
                                                            Limit: {voucher.limitCount}
                                                        </p>
                                                    </div>
                                                    :
                                                    <div className="w-fit mb-2 px-3 py-1 rounded-full bg-neutral-800 border border-neutral-600">
                                                        <p className="font-robotoCondensed text-xs font-bold text-gray-400 uppercase tracking-widest">
                                                            Unlimited
                                                        </p>
                                                    </div>
                                                }
                                            </div>

                                            <h1 className="font-geom xl:font-bartle text-xl text-white group-hover:text-yellow-500 transition-colors">
                                                {voucher.name}
                                            </h1>

                                            <p className="font-sans text-sm text-gray-400">
                                                {voucher.description}
                                            </p>
                                        </div>

                                        <button 
                                            disabled={(!profileData.points || profileData.points < voucher.pointRequired) || (voucher.limitCount !== undefined && voucher.limitCount <= 0)}
                                            className="w-full py-3 rounded-lg font-geom text-sm font-bold uppercase tracking-wider transition-all duration-300
                                                    enabled:bg-yellow-600 enabled:text-black enabled:hover:bg-yellow-400 enabled:hover:shadow-lg enabled:active:scale-95
                                                    disabled:bg-neutral-800 disabled:text-neutral-600 disabled:cursor-not-allowed disabled:border disabled:border-neutral-700"
                                            onClick={()=>{setConfirmRedeemVoucherModalOpen(true); setVoucherRedeem(voucher)}}
                                        >
                                            {(!profileData.points || profileData.points < voucher.pointRequired) 
                                                ? "Not Enough Points" 
                                                : "Redeem Now"
                                            }
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                    <div className="relative overflow-hidden bg-neutral-900/80 border border-yellow-600/30 rounded-xl p-6 mt-10 shadow-[0_0_15px_-5px_rgba(202,138,4,0.3)]">
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-600/10 rounded-full blur-2xl"></div>

                            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="text-center md:text-left">
                                    <h1 className="font-bartle text-white text-2xl md:text-3xl">
                                        Available Vouchers
                                    </h1>
                                </div>

                                <div className="flex flex-col items-center md:items-end">
                                    <p className="font-hegarty text-5xl md:text-6xl text-yellow-500 drop-shadow-sm leading-none">
                                        {myVouchers.availableVouchers.length || 0}
                                    </p>
                                    <p className="text-yellow-600/80 font-robotoCondensed text-xs uppercase tracking-widest mt-1">
                                        Available to Use
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
                                {myVouchers.availableVouchers && myVouchers.availableVouchers.map((voucher, idx) => (
                                    <div key={idx} className="group relative flex flex-col justify-between p-6 bg-neutral-900/80 border border-neutral-700 rounded-xl overflow-hidden hover:border-yellow-600/50 hover:shadow-[0_0_20px_-10px_rgba(202,138,4,0.3)] transition-all duration-300">

                                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-600/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                        <div className="flex flex-col gap-1 mb-6 text-left">
                                            <div className="flex flex-row flex-wrap gap-x-5">
                                                <div className="w-fit mb-2 px-3 py-1 rounded-full bg-yellow-900/20 border border-yellow-700/50 transition-colors">
                                                    <p className="font-robotoCondensed text-xs font-bold text-yellow-600 uppercase tracking-widest">
                                                        {voucher.voucherId.pointsRequired} PTS
                                                    </p>
                                                </div>
                                                {voucher.expiredAt &&
                                                    <div className="w-fit mb-2 px-3 py-1 rounded-full bg-orange-900/20 border border-orange-700/50">
                                                        <p className="font-robotoCondensed text-xs font-bold text-orange-500 uppercase tracking-widest">
                                                            Till {voucher.voucherId.expiredAt.split("T")[0]}
                                                        </p>
                                                    </div>
                                                }
                                                {voucher.limitCount !== undefined ?
                                                    <div className="w-fit mb-2 px-3 py-1 rounded-full bg-emerald-900/20 border border-emerald-700/50">
                                                        <p className="font-robotoCondensed text-xs font-bold text-emerald-500 uppercase tracking-widest">
                                                            Limit: {voucher.voucherId.limitCount}
                                                        </p>
                                                    </div>
                                                    :
                                                    <div className="w-fit mb-2 px-3 py-1 rounded-full bg-neutral-800 border border-neutral-600">
                                                        <p className="font-robotoCondensed text-xs font-bold text-gray-400 uppercase tracking-widest">
                                                            Unlimited
                                                        </p>
                                                    </div>
                                                }
                                            </div>

                                            <h1 className="font-geom xl:font-bartle text-xl text-white group-hover:text-yellow-500 transition-colors">
                                                {voucher.voucherId.name}
                                            </h1>

                                            <p className="font-sans text-sm text-gray-400">
                                                {voucher.voucherId.description}
                                            </p>

                                            <p className="font-sans text-sm text-gray-400">
                                                Redeemed At {voucher.redeemedAt.split("T")[0]}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                    {errorModalOpen && <ErrorModal type="error" errorModalOpen={errorModalOpen} setErrorModalOpen={setErrorModalOpen} />}
                    {successModalOpen && <SuccessModal type={successModalType} successModalOpen={successModalOpen} setSuccessModalOpen={setSuccessModalOpen} />}
                    {phoneNumberModalOpen && <AddPhoneNumberModal phoneNumberModalOpen={phoneNumberModalOpen} setPhoneNumberModalOpen={setPhoneNumberModalOpen} setSuccessModalOpen={()=>{setSuccessModalOpen(true); setSuccessModalType("addPhoneNumber")}} setHavePhoneNumber={()=>{}} setProfileData={setProfileData} />}
                    {changeEmailModalOpen && <ChangeEmailModal changeEmailModalOpen={changeEmailModalOpen} setChangeEmailModalOpen={setChangeEmailModalOpen} setProfileData={setProfileData} setSuccessModalOpen={()=>{setSuccessModalOpen(true); setSuccessModalType("changeEmail")}} />}
                    {confirmRedeemVoucherModalOpen && voucherRedeem !== null && <ConfirmRedeemVoucherModal confirmRedeemVoucherModalOpen={confirmRedeemVoucherModalOpen} setConfirmRedeemVoucherModalOpen={setConfirmRedeemVoucherModalOpen} voucherRedeem={voucherRedeem} handleRedeemVoucher={handleRedeemVoucher} />}
                </>
            }
        </>
    )
}