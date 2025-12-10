import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import toast, { Toaster } from 'react-hot-toast';

import checkAuthenticated from './checkAuthenticated';
import fetchWithRateLimit from './fetchWithRateLimit';

export default function MakeAppointmentModal({makeAppointmentModalOpen, setMakeAppointmentModalOpen, setSuccessModalOpen}){
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState({id: null, username: null, email: null, role: null, avatar: null});
    const [allServices, setAllServices] = useState(null);
    const [allTimeslot, setAllTimeslot] = useState(null);
    const [serviceIdxSelected, setServiceIdxSelected] = useState(null);
    const [staffIdSelected, setStaffIdSelected] = useState(null);
    const [dateSelected, setDateSelected] = useState(null);
    const [timeslotSelectedIdx, setTimeslotSelectedIdx] = useState(null);
    const [reloadServicesTrigger, setReloadServicesTrigger] = useState(0);
    const [socket, setSocket] = useState(null);

    const [modalPage, setModalPage] = useState(1);

    function resetState(){
        setAllTimeslot(null);
        setServiceIdxSelected(null);
        setStaffIdSelected(null);
        setDateSelected(null);
        setTimeslotSelectedIdx(null);
        setReloadServicesTrigger(prev => prev + 1);
    }

    useEffect(()=>{
        async function checkAuth() {
            const { authenticated } = await checkAuthenticated(setIsAuthenticated, setUser);
            if (!authenticated) {
                navigate("/auth/login");
            }
        }
            
        checkAuth();
    }, []);

    useEffect(()=>{
        const newSocket = io("http://localhost:5000", {
            withCredentials: true
        });

        setSocket(newSocket);
        
        newSocket.emit("join", "customer");

        return ()=>{newSocket.disconnect()};
    }, []);

    useEffect(()=>{
        async function fetchServices(){
            const response = await fetchWithRateLimit("http://localhost:5000/appointment/services", {
                method: "GET",
                credentials: "include"
            });
            
            const result = await response.json();console.log(result)
            if(result.status === "success"){
                setAllServices(result.message);
                if (result.message?.length > 0) {
                    setServiceIdxSelected(0);
                    const firstStaff = result.message[0]?.staff[0]?._id;
                    if (firstStaff) {
                        setStaffIdSelected(firstStaff);
                    }
                }
            } else if(result.status === "fail" && result.message === "auth"){
                // auth modal
                navigate("/auth/login");
            } else{
                setMakeAppointmentModalOpen(false);
                // error modal
            }
        };

        if(isAuthenticated){
            fetchServices();
        }
    }, [reloadServicesTrigger, isAuthenticated]);

    useEffect(()=>{
        async function fetchStaffTimeslot(){
            const response = await fetchWithRateLimit("http://localhost:5000/appointment/timeslot", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({staffId: staffIdSelected, date: dateSelected, serviceDuration: allServices[serviceIdxSelected].durationBlock})
            });

            const result = await response.json();
            if(result.status === "success"){
                setAllTimeslot(result.message);
                if (result.message?.length > 0) {
                    setTimeslotSelectedIdx(0);
                }
            } else if(result.status === "fail" && result.message === "auth"){
                // auth modal
                navigate("/auth/login");
            } else{
                // error modal
            }
        };

        if(serviceIdxSelected!==null && staffIdSelected!=="" && dateSelected!==null && isAuthenticated){
            setAllTimeslot(null);
            setTimeslotSelectedIdx(null);
            fetchStaffTimeslot();
        }
    }, [serviceIdxSelected, staffIdSelected, dateSelected, isAuthenticated]);

    function handleSubmit(e){ 
        e.preventDefault();
        const paymentMethod = e.nativeEvent.submitter.value;
        async function submitAppointment(){
            const response = await fetchWithRateLimit("http://localhost:5000/appointment/makeAppointment", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({staffId: staffIdSelected, date: dateSelected, serviceId: allServices[serviceIdxSelected]?._id, timeslot: allTimeslot[timeslotSelectedIdx], paymentMethod: paymentMethod})
            });

            const result = await response.json();
            if(result.status === "success"){ 
                if(paymentMethod === "stripe"){
                    const stripeURL = result.message;
                    navigate(stripeURL);
                } else{
                    setSuccessModalOpen();
                }
                resetState();
                setModalPage(1);
                setMakeAppointmentModalOpen(false);
                return true;
            } else if(result.status === "fail" && result.message === "auth"){
                // auth modal
                navigate("/auth/login");
            } else if(result.status === "fail" && result.message === "duplicate"){
                // duplicate modal
            } else{
                // error modal
            }
            throw new Error("fail");
        };
        return submitAppointment();
    }

    return(
        <>
            <Toaster position='top-right' />
            {isAuthenticated && allServices && modalPage === 1 &&
                <Dialog open={makeAppointmentModalOpen} onClose={()=>{}} className="relative z-10">
                    <DialogBackdrop
                    transition
                    className="fixed inset-0 bg-gray-900/50 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
                    />

                    <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <DialogPanel
                        transition
                        className="relative transform overflow-hidden rounded-lg bg-blue-500 text-left shadow-xl outline -outline-offset-1 outline-white/10 transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg data-closed:sm:translate-y-0 data-closed:sm:scale-95"
                        >

                        <button
                            onClick={()=>{setMakeAppointmentModalOpen(false)}}
                            className="absolute top-3 right-3 p-1 rounded-full hover:bg-blue-600 transition"
                        >
                            <XMarkIcon className="w-5 h-5 text-white" />
                        </button>

                        <form onSubmit={()=>{setModalPage(2)}}>
                            <div className="bg-blue-500 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-white sm:mx-0 sm:size-10">
                                    <InformationCircleIcon aria-hidden="true" className="size-6 text-black" />
                                </div>
                                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                    <DialogTitle as="h3" className="text-base font-semibold text-white">
                                        Book Appointment
                                    </DialogTitle>
                                    <div className="mt-2">
                                        <div>
                                            <label>Service</label>
                                            <select value={allServices.length > 0 ? serviceIdxSelected : "none"} onChange={(e)=>{setServiceIdxSelected(e.target.value)}} required>
                                                {allServices.length > 0 && allServices.map((service, idx)=>{
                                                    return <option key={idx} value={idx}>{service.name} - RM{service.price} (eg: {service.durationMin}min~)</option>
                                                })}
                                                {allServices.length === 0 && <option disabled={true} value="none">No Service Available</option>}
                                            </select>
                                        </div>
                                        <div>
                                            <label>Barber</label>
                                            <select value={staffIdSelected} onChange={(e)=>{setStaffIdSelected(e.target.value)}} required>
                                                {allServices?.[serviceIdxSelected]?.staff ? allServices[serviceIdxSelected].staff.map((staff, idx) => (
                                                    <option key={idx} value={staff._id}>{staff.username}</option>
                                                )) :
                                                    <option disabled={true} value={null}>No Barber Available</option>    
                                                }
                                            </select>
                                        </div>
                                        <div>
                                            <label>Date</label>
                                            <input value={dateSelected} onChange={(e)=>{setDateSelected(e.target.value)}} type='date' min={new Date().toISOString().split("T")[0]} required />
                                        </div>
                                        <div>
                                            <label>Timeslot</label>
                                            <select value={timeslotSelectedIdx} onChange={(e)=>setTimeslotSelectedIdx(e.target.value)} required>
                                                {allTimeslot?.length > 0 ? 
                                                    allTimeslot.map((timeslot, idx)=>(
                                                        <option key={idx} value={idx}>{timeslot.time}</option>
                                                    )) :
                                                    <option disabled={true} value={null}>No Available Timeslot</option>
                                                }
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                </div>
                            </div>
                            <div className="bg-gray-700/25 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                                <button
                                type='submit'
                                data-autofocus
                                className="mt-3 inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white inset-ring inset-ring-white/5 hover:bg-blue-700 sm:mt-0 sm:w-auto"
                                >
                                Finalise Appointment Details
                                </button>
                            </div>
                        </form>
                        </DialogPanel>
                    </div>
                    </div>
                </Dialog>
            }
            {isAuthenticated && serviceIdxSelected != null && staffIdSelected && modalPage === 2 &&
            <Dialog open={makeAppointmentModalOpen} onClose={()=>{}} className="relative z-10">
                    <DialogBackdrop
                    transition
                    className="fixed inset-0 bg-gray-900/50 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
                    />

                    <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <DialogPanel
                        transition
                        className="relative transform overflow-hidden rounded-lg bg-blue-500 text-left shadow-xl outline -outline-offset-1 outline-white/10 transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg data-closed:sm:translate-y-0 data-closed:sm:scale-95"
                        >

                        <button
                            onClick={()=>{setMakeAppointmentModalOpen(false)}}
                            className="absolute top-3 right-3 p-1 rounded-full hover:bg-blue-600 transition"
                        >
                            <XMarkIcon className="w-5 h-5 text-white" />
                        </button>

                        <form onSubmit={()=>{setModalPage(3)}}>
                            <div className="bg-blue-500 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-white sm:mx-0 sm:size-10">
                                    <InformationCircleIcon aria-hidden="true" className="size-6 text-black" />
                                </div>
                                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                    <DialogTitle as="h3" className="text-base font-semibold text-white">
                                        Book Appointment
                                    </DialogTitle>
                                    <div className="mt-2">
                                        <div>
                                            <p>Service: {allServices[serviceIdxSelected].name}</p>
                                            <p>Price: RM{allServices[serviceIdxSelected].price}</p>
                                            <p>Duration: {allServices[serviceIdxSelected].durationMin}</p>
                                            <p>Barber: {allServices[serviceIdxSelected].staff.find(eachStaff => eachStaff._id === staffIdSelected).username}</p>
                                            <p>Date: {dateSelected}</p>
                                            <p>Time: {allTimeslot[timeslotSelectedIdx].time}</p>
                                        </div>
                                        <p>Please **verify all service and pricing details above** before proceeding to payment. We recommend arriving 5-10 minutes early for your appointment to ensure a timely start.</p>
                                    </div>
                                </div>
                                </div>
                            </div>
                            <div className="bg-gray-700/25 px-4 py-3 flex justify-between items-center sm:px-6">
                                <button
                                    type="button"
                                    className="inline-flex rounded-md bg-gray-400 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-500"
                                    onClick={()=>{setModalPage(1)}}
                                >
                                    Back
                                </button>

                                <button
                                    type="submit"
                                    data-autofocus
                                    className="inline-flex rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"

                                >
                                    Proceed to Payment
                                </button>
                            </div>
                        </form>
                        </DialogPanel>
                    </div>
                    </div>
                </Dialog>
            }
            {isAuthenticated && serviceIdxSelected != null && staffIdSelected && modalPage === 3 &&
                <Dialog open={makeAppointmentModalOpen} onClose={()=>{}} className="relative z-10">
                    <DialogBackdrop
                    transition
                    className="fixed inset-0 bg-gray-900/50 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
                    />

                    <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <DialogPanel
                        transition
                        className="relative transform overflow-hidden rounded-lg bg-blue-500 text-left shadow-xl outline -outline-offset-1 outline-white/10 transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg data-closed:sm:translate-y-0 data-closed:sm:scale-95"
                        >

                        <button
                            onClick={()=>{setMakeAppointmentModalOpen(false)}}
                            className="absolute top-3 right-3 p-1 rounded-full hover:bg-blue-600 transition"
                        >
                            <XMarkIcon className="w-5 h-5 text-white" />
                        </button>

                        <form onSubmit={(e)=>{e.nativeEvent.submitter.value === "stripe" ? toast.promise(handleSubmit(e), {loading: "Redirecting to Payment Gateway...", success: "Redirect Successfully", error: "Redirect Failed. Please Try Again."}) : handleSubmit(e);}}>
                            <div className="bg-blue-500 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-white sm:mx-0 sm:size-10">
                                    <InformationCircleIcon aria-hidden="true" className="size-6 text-black" />
                                </div>
                                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                    <DialogTitle as="h3" className="text-base font-semibold text-white">
                                        Book Appointment
                                    </DialogTitle>
                                    <div className="mt-2">
                                        <div>
                                            <p>We offer 2 payment types: </p>
                                            <div>
                                                <h1>Pay in Store (Cash / QR Pay)</h1>
                                                <p>Prefer paying later? Choose this method to reserve your appointment first and complete the payment when you arrive at the shop.
                                                Please note that your booking will remain pending until payment is made in-store. We recommend arriving a few minutes early to avoid delays.</p>
                                            </div>
                                            <div>
                                                <h1>Pay Now with Stripe (Debit/Credit Card)</h1>
                                                <p>Choose this option for a fast, guaranteed booking. Your payment will be processed securely through Stripe using your debit or credit card.
                                                Once your payment is successful, your appointment will be instantly confirmed and you will be redirected back to the app with a confirmation screen.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                </div>
                            </div>
                            <div className="bg-gray-700/25 px-4 py-3 flex justify-between items-center sm:px-6">
                                <button
                                    type="button"
                                    className="inline-flex rounded-md bg-gray-400 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-500"
                                    onClick={()=>{setModalPage(2)}}
                                >
                                    Back
                                </button>

                                <div className='flex gap-x-2'>
                                <button
                                    type="submit"
                                    name='paymentMethod'
                                    value="store"
                                    data-autofocus
                                    className="inline-flex rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"

                                >
                                    Pay in Store
                                </button>
                                <button
                                    type="submit"
                                    name='paymentMethod'
                                    value="stripe"
                                    data-autofocus
                                    className="inline-flex rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"

                                >
                                    Pay Now with Stripe
                                </button>
                                </div>
                            </div>
                        </form>
                        </DialogPanel>
                    </div>
                    </div>
                </Dialog>
            }
            {modalPage === "loading" &&
                <div>
                    <h1>Loading ...</h1>
                </div>
            }
        </>
    )
}