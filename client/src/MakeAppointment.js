import { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Toaster } from 'react-hot-toast';
import makeAppointmentPage1 from "./public/makeAppointmentPage1.avif";
import close from "./public/close.png";
import check from "./public/check.png";

import checkAuthenticated from './checkAuthenticated';
import fetchWithRateLimit from './fetchWithRateLimit';

import Header from './Header';
import AppointmentStep1 from './appointmentProcess/AppointmentStep1';
import AppointmentStep2 from './appointmentProcess/AppointmentStep2';
import AppointmentStep3 from './appointmentProcess/AppointmentStep3';
import AppointmentStep4 from './appointmentProcess/AppointmentStep4';

import ErrorModal from './ErrorModal';
import API_URL from './config';

export default function MakeAppointment(){
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [allServices, setAllServices] = useState(null);
    const [allTimeslot, setAllTimeslot] = useState(null);
    const [serviceIdSelected, setServiceIdSelected] = useState(null);
    const [staffIdSelected, setStaffIdSelected] = useState(null);
    const [dateSelected, setDateSelected] = useState(null);
    const [timeslotSelected, setTimeslotSelected] = useState(null);
    const [reloadServicesTrigger, setReloadServicesTrigger] = useState(0);
    const [socket, setSocket] = useState(null);
    const [errorModalOpen, setErrorModalOpen] = useState(false);
    const [errorModalType, setErrorModalType] = useState("error");
    const [isOpenHamburgerMenu, setOpenHamburgerMenu] = useState(false);
    
    const userRef = useRef(null);

    const [modalPage, setModalPage] = useState(1);

    function resetState(){
        setAllTimeslot(null);
        setServiceIdSelected(null);
        setStaffIdSelected(null);
        setDateSelected(null);
        setTimeslotSelected(null);
        setReloadServicesTrigger(prev => prev + 1);
    }

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
        const newSocket = io(API_URL, {
            withCredentials: true
        });

        setSocket(newSocket);
        
        newSocket.emit("join", "customer");

        return ()=>{newSocket.disconnect()};
    }, []);

    useEffect(()=>{
        async function fetchServices(){
            const response = await fetchWithRateLimit(`${API_URL}/appointment/services`, {
                method: "GET",
                credentials: "include"
            });
            
            const result = await response.json();console.log(result)
            if(result.status === "success"){
                setAllServices(result.message);
            } else if(result.status === "fail" && result.message === "auth"){
                navigate("/auth/login", {state: {errorModalOpen: true}});
            } else{
                setErrorModalOpen(true);
                setErrorModalType("error");
            }
        };

        if(isAuthenticated){
            fetchServices();
        }
    }, [reloadServicesTrigger, isAuthenticated, navigate]);

    useEffect(()=>{
        async function fetchStaffTimeslot(){
            const response = await fetchWithRateLimit(`${API_URL}/appointment/timeslot`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({staffId: staffIdSelected, date: dateSelected, service: allServices.find(service => service._id === serviceIdSelected)})
            });

            const result = await response.json();
            if(result.status === "success"){
                const sortedTimeslot = result.message.sort((a,b)=> a.queueMin - b.queueMin);
                setAllTimeslot(sortedTimeslot);
            } else if(result.status === "fail" && result.message === "auth"){
                navigate("/auth/login", {state: {errorModalOpen: true}});
            } else{
                setErrorModalOpen(true);
                setErrorModalType("error");
            }
        };

        if(serviceIdSelected!==null && staffIdSelected!=="" && dateSelected!==null && isAuthenticated){
            setAllTimeslot(null);
            setTimeslotSelected(null);
            fetchStaffTimeslot();
        }
    }, [serviceIdSelected, staffIdSelected, dateSelected, isAuthenticated, navigate]);

    const {service, staff, total} = useMemo(()=>{
        if(!allServices || allServices.length === 0 || !serviceIdSelected || !staffIdSelected){
            return {service: null, staff: null, total: null}
        };
                
        const selectedService = allServices.find(service => service._id === serviceIdSelected);
        const selectedServiceName = selectedService.name;
        const selectedStaffName = staffIdSelected === "any" ? "Any Staff" : selectedService.staff.find(staff => staff._id === staffIdSelected);
        const selectedTotal = selectedService.price;
        return {service: selectedServiceName, staff: selectedStaffName, total: selectedTotal}
    }, [serviceIdSelected, staffIdSelected, allServices])

    console.log(service, staff, total)

    function handleSubmit(e, voucherId=null){ 
        e.preventDefault();
        const paymentMethod = e.nativeEvent.submitter.value;
        async function submitAppointment(){
            const response = await fetchWithRateLimit(`${API_URL}/appointment/makeAppointment`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({staffId: staffIdSelected, date: dateSelected, serviceId: serviceIdSelected, timeslot: timeslotSelected, paymentMethod: paymentMethod, voucherId})
            });

            const result = await response.json(); console.log(result)
            if(result.status === "success"){ 
                if(paymentMethod === "stripe"){
                    const stripeURL = result.message;
                    navigate(stripeURL);
                } else{
                    navigate("/appointment", {state: {successModalOpen: true, successModalType: "makeAppointment"}})
                }
                resetState();
                setModalPage(1);
                return true;
            } else if(result.status === "fail" && result.message === "auth"){
                navigate("/auth/login", {state: {errorModalOpen: true}});
            } else if(result.status === "fail" && result.message === "duplicate"){
                setErrorModalOpen(true);
                setErrorModalType("duplicate");
            } else{
                setErrorModalOpen(true);
                setErrorModalType("error");
            }
        };
        return submitAppointment();
    }

    return(
        <>
            {isAuthenticated &&
                <>
                    <Toaster position='top-right' />
                    <Header isOpenHamburgerMenu={isOpenHamburgerMenu} setOpenHamburgerMenu={setOpenHamburgerMenu} />
                    <div className='w-full bg-cover bg-center font-bartle py-32 px-10 flex flex-col gap-2 relative' style={{backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${makeAppointmentPage1})`}}>
                        <h1 className='text-white text-2xl break-words md:text-5xl'>Precision Cuts</h1>
                        <h2 className='text-yellow-600 text-xl break-words md:text-4xl'>& Classic Shaves</h2>
                        <div className="absolute top-5 right-5 cursor-pointer"><button onClick={()=>{navigate("/appointment")}} className="text-white w-[50px] h-[50px] bg-neutral-900 rounded-full flex justify-center items-center"><img className="w-4" src={close} alt="Close Make Appointment Button" /></button></div>
                    </div>
                    <div className='bg-neutral-900 px-10 py-20 sm:p-20 flex flex-col'>
                        <div className='font-geom text-gray-400 flex flex-row justify-center items-center gap-2'>
                            <div className={`w-[50px] h-[50px] rounded-full border-gray-600 border flex justify-center items-center ${modalPage >= 1 ? "text-black bg-yellow-600" : null}`}>
                                {modalPage <= 1 ? <p className='text-lg'>1</p> : <span><img className='w-[40px]' src={check} alt='Check Icon' /></span>}
                            </div>
                            <div className={`w-16 h-0.5 transition-all duration-300 ${modalPage > 1 ? "bg-yellow-600" : "bg-neutral-800"}`}></div>
                            <div className={`w-[50px] h-[50px] rounded-full border-gray-600 border flex justify-center items-center ${modalPage >= 2 ? "text-black bg-yellow-600" : null}`}>
                                {modalPage <= 2 ? <p className='text-lg'>2</p> : <span><img className='w-[40px]' src={check} alt='Check Icon' /></span>}
                            </div>
                            <div className={`w-16 h-0.5 transition-all duration-300 ${modalPage > 2 ? "bg-yellow-600" : "bg-neutral-800"}`}></div>
                            <div className={`w-[50px] h-[50px] rounded-full border-gray-600 border flex justify-center items-center ${modalPage >= 3 ? "text-black bg-yellow-600" : null}`}>
                                {modalPage <= 3 ? <p className='text-lg'>3</p> : <span><img className='w-[40px]' src={check} alt='Check Icon' /></span>}
                            </div>
                            <div className={`w-16 h-0.5 transition-all duration-300 ${modalPage > 3 ? "bg-yellow-600" : "bg-neutral-800"}`}></div>
                            <div className={`w-[50px] h-[50px] rounded-full border-gray-600 border flex justify-center items-center ${modalPage >= 4 ? "text-black bg-yellow-600" : null}`}>
                                {modalPage <= 4 ? <p className='text-lg'>4</p> : <span><img className='w-[40px]' src={check} alt='Check Icon' /></span>}
                            </div>
                        </div>
                        {
                            allServices && modalPage === 1 &&
                            <AppointmentStep1 modalPage={modalPage} setModalPage={setModalPage} allServices={allServices} serviceIdSelected={serviceIdSelected} setServiceIdSelected={setServiceIdSelected} />
                        }

                        {
                            serviceIdSelected && modalPage === 2 &&
                            <AppointmentStep2 modalPage={modalPage} setModalPage={setModalPage} allServices={allServices} serviceIdSelected={serviceIdSelected} staffIdSelected={staffIdSelected} setStaffIdSelected={setStaffIdSelected} />
                        }

                        {
                            serviceIdSelected && staffIdSelected && modalPage === 3 &&
                            <AppointmentStep3 modalPage={modalPage} setModalPage={setModalPage} dateSelected={dateSelected} setDateSelected={setDateSelected} allTimeslot={allTimeslot} timeslotSelected={timeslotSelected} setTimeslotSelected={setTimeslotSelected} />
                        }

                        {
                            service && staff && total && dateSelected && timeslotSelected && modalPage === 4 &&
                            <AppointmentStep4 modalPage={modalPage} setModalPage={setModalPage} handleSubmit={handleSubmit} serviceName={service} serviceIdSelected={serviceIdSelected} staff={staff} total={total} staffIdSelected={staffIdSelected} dateSelected={dateSelected} timeslotSelected={timeslotSelected} />
                        }
                    </div>
                </>
            }
            <ErrorModal type={errorModalType} errorModalOpen={errorModalOpen} setErrorModalOpen={setErrorModalOpen} />
        </>
    )
}