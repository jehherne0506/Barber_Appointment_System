import { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Header from './Header';
import close from "./public/close.png";
import check from "./public/check.png";
import AppointmentStep4 from './appointmentProcess/AppointmentStep4';
import checkAuthenticated from './checkAuthenticated';
import makeAppointmentPage1 from "./public/makeAppointmentPage1.avif";
import fetchWithRateLimit from './fetchWithRateLimit';
import CancelAppointmentModal from './CancelAppointmentModal';
import ErrorModal from './ErrorModal';

export default function CancelAppointment(){
    const navigate = useNavigate();
    const location = useLocation();

    const passedData = location.state || {};

    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [modalPage, setModalPage] = useState(4);
    const userRef = useRef(null);

    const [appointmentId, setAppointmentId] = useState(passedData.appointmentIdSelected || null);
    const [allServices, setAllServices] = useState(null);
    const [serviceIdSelected, setServiceIdSelected] = useState(passedData.serviceIdSelected || null);
    const [staffIdSelected, setStaffIdSelected] = useState(passedData.staffIdSelected || null);
    const [dateSelected, setDateSelected] = useState(new Date(passedData.dateSelected) || null);
    const [timeslotSelected, setTimeslotSelected] = useState(passedData.timeslotSelected || null);
    const [reloadServicesTrigger, setReloadServicesTrigger] = useState(0);

    const [cancelAppointmentModalOpen, setCancelAppointmentModalOpen] = useState(false);

    const [errorModalOpen, setErrorModalOpen] = useState(false);

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
        async function fetchServices(){
            const response = await fetchWithRateLimit("http://localhost:5000/appointment/services", {
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
            }
        };

        if(isAuthenticated){
            fetchServices();
        }
    }, [reloadServicesTrigger, isAuthenticated, navigate]);

    const {service, staff, total} = useMemo(()=>{
        if(!allServices || allServices.length === 0 || !serviceIdSelected || !staffIdSelected){
            return {service: null, staff: null, total: null}
        };
                
        const selectedService = allServices.find(service => service._id === serviceIdSelected);
        console.log(serviceIdSelected)
        const selectedServiceName = selectedService.name;
        const selectedStaffName = staffIdSelected === "any" ? "Any Staff" : selectedService.staff.find(staff => staff._id === staffIdSelected);
        const selectedTotal = selectedService.price;
        return {service: selectedServiceName, staff: selectedStaffName, total: selectedTotal}
    }, [serviceIdSelected, staffIdSelected, allServices])

    async function handleSubmit(e){
        e.preventDefault();
        setCancelAppointmentModalOpen(false);
        const response = await fetch("http://localhost:5000/appointment/cancelAppointment", {
            method: "DELETE",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({id: appointmentId})
        });

        const result = await response.json();console.log(result)
        if(result.status === "success"){ 
            navigate("/appointment", {state: {successModalOpen: true, successModalType: "cancelAppointment"}})
        } else if(result.status === "fail" && result.message === "auth"){
            navigate("/auth/login", {state: {errorModalOpen: true}});
        } else if(result.status === "fail" && result.message === "duplicate"){
            navigate("/appointment", {state: {errorModalOpen: true, errorModalType: "duplicate"}});
        } else{
            navigate("/appointment", {state: {errorModalOpen: true, errorModalType: "error"}});
        }
    }

    return(
        <>
            {isAuthenticated &&
                <>
                    <Toaster position='top-right' />
                    <Header />
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
                            service && staff && total && dateSelected && timeslotSelected &&
                            <AppointmentStep4 modalPage={modalPage} setModalPage={setModalPage} handleSubmit={(e)=>{e.preventDefault(); setCancelAppointmentModalOpen(true)}} service={service} staff={staff} total={total} staffIdSelected={staffIdSelected} dateSelected={dateSelected} timeslotSelected={timeslotSelected} type="cancel" />
                        }

                        {cancelAppointmentModalOpen &&
                            <CancelAppointmentModal cancelAppointmentModalOpen={cancelAppointmentModalOpen} setCancelAppointmentModalOpen={setCancelAppointmentModalOpen} handleSubmit={(e)=>{handleSubmit(e)}} />
                        }
                        
                        <ErrorModal type="error" errorModalOpen={errorModalOpen} setErrorModalOpen={setErrorModalOpen} />
                    </div>
                </>
            }
        </>
    )
}