import toast from 'react-hot-toast';
import { GrPrevious } from "react-icons/gr";
import { FaStripe } from "react-icons/fa";
import { FaFileSignature } from "react-icons/fa";
import { BsCash } from "react-icons/bs";
import { FaDice } from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendar, faCalendarXmark } from "@fortawesome/free-solid-svg-icons";
import { useState, useRef, useEffect } from 'react';
import { BiSolidCoupon } from "react-icons/bi";
import { IoMdArrowDropdown } from "react-icons/io";
import ErrorModal from '../ErrorModal';
import { useNavigate } from 'react-router-dom';
import checkAuthenticated from '../checkAuthenticated';
import fetchWithRateLimit from '../fetchWithRateLimit';
import API_URL from '../config';

export default function AppointmentStep4({ modalPage, setModalPage, handleSubmit, appointmentId=null, serviceName, serviceIdSelected, staff, total, staffIdSelected, dateSelected, timeslotSelected, type="make" }){
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [selectedVoucher, setSelectedVoucher] = useState(null);
    const [selectVoucherDropdown, setSelectVoucherDropdown] = useState(false);
    const [errorModalOpen, setErrorModalOpen] = useState(false);
    const [myVouchers, setMyVouchers] = useState(null);

    const userRef = useRef(null);
    const navigate = useNavigate();

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
        async function fetchUserVoucher(){
            const response = await fetchWithRateLimit(`${API_URL}/userVoucher/service`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({serviceId: serviceIdSelected})
            });

            const result = await response.json();
            if(result.status === "success"){console.log(result.message.availableVouchers)
                setMyVouchers(result.message.availableVouchers);
            } else if(result.status === "fail" && result.message === "auth"){
                navigate("/auth/login", {state: {errorModalOpen: true}});
            } else{
                setErrorModalOpen(true);
            }
        }

        if(type === "make"){
            fetchUserVoucher();
        }
    }, [])

    useEffect(()=>{
        async function fetchVoucherSelected(){
            const response = await fetchWithRateLimit(`${API_URL}/voucherSelected`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({appointmentId: appointmentId})
            });

            const result = await response.json();
            if(result.status === "success"){
                if(result.message){
                    if(result.message.voucherId){
                        setSelectedVoucher(result.message);console.log(result.message)
                    }
                }
            } else if(result.status === "fail" && result.message === "auth"){
                navigate("/auth/login", {state: {errorModalOpen: true}});
            } else{
                setErrorModalOpen(true);
            }
        }

        if(type === "reschedule" || type === "cancel"){
            fetchVoucherSelected();
        }
    })

    function processVoucherPrice(){
        const discountType = selectedVoucher.voucherId.discountType;
        const discountValue = selectedVoucher.voucherId.discountValue;
        if(discountType === "PERCENTAGE"){console.log(discountValue)
            return (Number(total) * (100 - Number(discountValue)) / 100).toFixed(2);
        } return (Number(total) - Number(discountValue)).toFixed(2);
    }
    
    return(
        <>
            {isAuthenticated && 
                <form onSubmit={(e)=>{e.nativeEvent.submitter.value === "stripe" ? toast.promise(handleSubmit(e, selectedVoucher?.voucherId?._id || null), {loading: "Redirecting to Payment Gateway...", success: "Redirect Successfully", error: "Redirect Failed. Please Try Again."}) : handleSubmit(e, selectedVoucher?.voucherId?._id || null);}}>
                    <div className='py-10 px-5 sm:px-20'>
                        <div className='text-white text-center mb-10'>
                            <div className='flex gap-3'>
                                <FaFileSignature className="h-10 w-10 text-yellow-600" />
                                <h1 className='text-3xl font-geom mb-10'>{type === "cancel" ? "Cancel Booking" : "Finalise Booking Details"}</h1>
                            </div>

                            <div className='bg-neutral-800 p-8 rounded-2xl border border-neutral-700 shadow-2xl text-left'>
                                <div className='flex justify-between items-center mb-6 pb-6 border-b border-neutral-700/50'>
                                    <div>
                                        <p className='text-neutral-400 text-sm uppercase tracking-wider mb-1'>Service</p>
                                        <p className='text-xl font-bold text-white'>{serviceName}</p>
                                    </div>
                                    <p className='text-xl font-bold text-yellow-600'>RM{selectedVoucher !== null ? processVoucherPrice().toString() : total}</p>
                                </div>

                                <div className='space-y-5'>
                                    <div className='flex justify-between items-center'>
                                        <p className='text-neutral-400'>Barber</p>
                                        <div className='flex items-end sm:items-center gap-2 flex-col sm:flex-row'>
                                            <p className='text-neutral-400 text-sm break-words sm:text-lg'>{staffIdSelected === "any" ? staff : staff.username}</p>
                                            {staffIdSelected === "any" ? 
                                            <FaDice className="w-6 h-6" />:
                                            <img className="w-6 h-6 rounded-full bg-neutral-600" src={staff.avatar} ></img> }
                                        </div>
                                    </div>

                                    {/* Date */}
                                    <div className='flex justify-between items-center'>
                                        <p className='text-neutral-400'>Date</p>
                                        <p className='font-medium'>{dateSelected?.toDateString()}</p>
                                    </div>

                                    {/* Time */}
                                    <div className='flex justify-between items-center'>
                                        <p className='text-neutral-400'>Time</p>
                                        <span className='px-3 py-1 bg-yellow-600/20 text-yellow-500 rounded text-sm font-bold border border-yellow-600/30'>
                                            {timeslotSelected?.time}
                                        </span>
                                    </div>

                                </div>

                                <div className='mt-8 pt-6 border-t border-dashed border-neutral-600 flex justify-end'>
                                    <div className={`bg-black/30 border border-gray-500 hover:border-yellow-500 transition-all duration-300 ease-in-out w-full md:w-1/2 xl:w-1/4 p-4 rounded-lg flex flex-col gap-2 ${(type==="cancel" || type === "reschedule") && "hidden"}`}>
                                        <div className='flex gap-2 items-center'>
                                            <div className='p-2 rounded-full bg-yellow-800/20 border border-yellow-600 text-yellow-600'>
                                                <BiSolidCoupon className='text-xl' />
                                            </div>
                                            <p className='font-robotoCondensed text-sm font-bold text-white uppercase'>Apply Voucher</p>
                                        </div>
                                        <div className="relative">
                                            <div className="cursor-pointer" onClick={(()=>{setSelectVoucherDropdown(prevState => !prevState)})}>
                                                <p className="p-2 bg-black/60 flex-1 rounded-lg border border-gray-600">{selectedVoucher !== null ? selectedVoucher?.voucherId?.name : "Select Voucher"}</p>
                                                <IoMdArrowDropdown className="text-2xl absolute right-2 top-1/2 -translate-y-1/2" />
                                            </div>                                                  
                                        {selectVoucherDropdown && myVouchers &&
                                                <div className="absolute z-10 bg-black p-2 w-full border border-t-0 border-gray-600 rounded-lg flex flex-col gap-2">
                                                    {myVouchers.map(voucher => (
                                                        <p className="cursor-pointer" onClick={()=>{setSelectedVoucher(voucher); setSelectVoucherDropdown(false)}}>{voucher.voucherId.name}</p>
                                                    ))}
                                                    <p className="cursor-pointer" onClick={()=>{setSelectedVoucher(null); setSelectVoucherDropdown(false)}}>No Voucher</p>
                                                </div>
                                            }
                                        </div>
                                    </div>
                                </div>

                                <div className='pt-6 flex justify-between items-end'>
                                    <div>
                                        <p className='text-neutral-400 mb-1'>Total</p>
                                        <p className='p-2 bg-yellow-600/40 text-sm rounded-lg font-robotoCondensed border border-yellow-300'>+ {total} Points</p>
                                    </div>
                                    <p className='text-xl sm:text-3xl font-bold text-white'>RM{selectedVoucher !== null ? processVoucherPrice().toString() : total}</p>
                                </div>
                            </div>
                        </div>
                        <div className='flex flex-col lg:flex-row gap-5 lg:gap-0 justify-between'>
                            <button className="flex gap-2 justify-center items-center py-4 px-2 sm:px-8 sm:py-4 rounded-lg cursor-pointer bg-yellow-600 text-black disabled:text-white disabled:bg-neutral-700 disabled:opacity-50" disabled={modalPage===1 || type !== "make"} onClick={()=>{setModalPage(prevPage => prevPage - 1)}}>
                                <GrPrevious />
                                <span className='text-sm lg:text-lg'>Previous</span>
                            </button>

                            
                                {type === "make" &&
                                    <div className='flex flex-col lg:flex-row gap-5'>
                                        <button
                                            type="submit"
                                            name='paymentMethod'
                                            value="store"
                                            data-autofocus
                                            className="flex gap-2 justify-center items-center py-4 px-2 sm:px-8 sm:py-4 rounded-lg cursor-pointer bg-yellow-600 text-black disabled:text-white disabled:bg-neutral-700 disabled:opacity-50 text-sm lg:text-lg" disabled={modalPage===1}
                                        >
                                            <BsCash />
                                            Pay in Store
                                        </button>
                                        <button
                                            type="submit"
                                            name='paymentMethod'
                                            value="stripe"
                                            data-autofocus
                                            className="flex gap-2 justify-center items-center py-4 px-2 sm:px-8 sm:py-4 rounded-lg cursor-pointer bg-yellow-600 text-black disabled:bg-neutral-700 disabled:opacity-50 text-sm lg:text-lg" disabled={modalPage===1}

                                        >
                                            <FaStripe />
                                            Pay Now with Stripe
                                        </button>
                                    </div>
                                }
                                {
                                    type === "reschedule" &&
                                    <div className='flex gap-2 justify-center items-center py-4 px-2 sm:px-8 sm:py-4 rounded-lg cursor-pointer bg-yellow-600 text-black disabled:text-white disabled:bg-neutral-700 disabled:opacity-50'>
                                        <button
                                            type="submit"
                                            name='paymentMethod'
                                            value="paid"
                                            data-autofocus
                                            className={`flex gap-2 justify-center items-center py-4 px-2 sm:px-8 sm:py-4 rounded-lg cursor-pointer ${modalPage===1 ? "bg-neutral-700 opacity-50" : "bg-yellow-600 text-black"}`} disabled={modalPage===1}

                                        >
                                            <FontAwesomeIcon icon={faCalendar} className="text-xl" />
                                            Reschedule
                                        </button>
                                    </div>
                                }
                                {
                                    type === "cancel" &&
                                    <div className='flex gap-2 justify-center items-center py-4 px-2 sm:px-8 sm:py-4 rounded-lg cursor-pointer bg-yellow-600 text-black disabled:text-white disabled:bg-neutral-700 disabled:opacity-50'>
                                        <button
                                            type="submit"
                                            name='paymentMethod'
                                            value="paid"
                                            data-autofocus
                                            className={`flex gap-2 justify-center items-center py-4 px-2 sm:px-8 sm:py-4 rounded-lg cursor-pointer ${modalPage===1 ? "bg-neutral-700 opacity-50" : "bg-yellow-600 text-black"}`} disabled={modalPage===1}

                                        >
                                            <FontAwesomeIcon icon={faCalendarXmark} className="text-xl" />
                                            Cancel
                                        </button>
                                    </div>
                                }
                        </div>
                    </div>
                    <ErrorModal type="error" errorModalOpen={errorModalOpen} setErrorModalOpen={setErrorModalOpen} />
                </form>
            }
        </>
    )
}