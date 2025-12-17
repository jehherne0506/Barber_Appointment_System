import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleUser, faCalendar, faClock, faMoneyBill1 } from "@fortawesome/free-solid-svg-icons";
import { io } from 'socket.io-client';
import toast, { Toaster } from 'react-hot-toast';

import checkAuthenticated from './checkAuthenticated';
import fetchWithRateLimit from './fetchWithRateLimit';
import AddPhoneNumberModal from './AddPhoneNumberModal';
import MakeAppointmentModal from './MakeAppointmentModal';
import RescheduleAppointmentModal from './RescheduleAppointmentModal';
import CancelAppointmentModal from './CancelAppointmentModal';
import SuccessModal from './SuccessModal';
import Header from './Header';

import appointmentPage1 from "./public/appointmentPage1.jpg";
import calendar from "./public/calendar.png";

export default function Appointment(){
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [havePhoneNumber, setHavePhoneNumber] = useState(false);
    const [phoneNumberModalOpen, setPhoneNumberModalOpen] = useState(false);
    const [appointmentStats, setAppointmentStats] = useState(null);

    const [upcomingAppointments, setUpcomingAppointments] = useState(null);
    const [pastAppointments, setPastAppointments] = useState(null);
    const [liveQueue, setLiveQueue] = useState(null);

    const userRef = useRef(null);

    const navigate = useNavigate();
    const location = useLocation();

    const [successModalOpen, setSuccessModalOpen] = useState(false);
    const [successModalType, setSuccessModalType] = useState("");

    const [view, setView] = useState(1);
    
    const [makeAppointmentModalOpen, setMakeAppointmentModalOpen] = useState(false);
    const [rescheduleAppointmentModalOpen, setRescheduleAppointmentModalOpen] = useState(false);
    const [cancelAppointmentModalOpen, setCancelAppointmentModalOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);

    const [isOpenHamburgerMenu, setOpenHamburgerMenu] = useState(false);

    useEffect(()=>{
        async function checkAuth() {
            const { authenticated } = await checkAuthenticated(setIsAuthenticated, userRef);console.log(authenticated)
            if (!authenticated) {
                // auth modal
                navigate("/auth/login");
            }
        }
        checkAuth();
    }, [navigate]);

    
    useEffect(()=>{
        const socket = io("http://localhost:5000", {
            withCredentials: true
        });
        
        socket.emit("join", "customer");

        socket.on("newAppointment", function(appointment){
            if(appointment.customerId._id === userRef.current.id){
                setUpcomingAppointments((upcomingAppointments)=>{
                    if(!upcomingAppointments){
                        return [
                            appointment
                        ];
                    };
                    let newUpcomingAppointments = [...upcomingAppointments, appointment];
                    return newUpcomingAppointments.sort((a,b)=>{
                        const dateA = new Date(a.date);
                        const dateB = new Date(b.date);
                        const dateDiff = dateA - dateB;
                        if(dateDiff !== 0){
                            return dateDiff;
                        } return a.queueMin - b.queueMin;
                    });
                });
            }

            if(appointment.date === new Date(new Date().toISOString().split("T")[0] + 'T00:00:00.000Z')){
                setLiveQueue((currentQueue)=>{
                    if(!currentQueue){
                        return [
                            {
                                appointments: [
                                    appointment
                                ],
                                _id: appointment.staffId._id,
                                username: appointment.staffId.username,
                            }
                        ];
                    };

                    const staffIdx = currentQueue.findIndex(queue => queue._id === appointment.staffId._id);console.log(staffIdx);console.log(currentQueue)
                    if(staffIdx!==-1){
                        const appointmentAlreadyInList = currentQueue[staffIdx].appointments.some(queueAppointment => queueAppointment._id === appointment._id);
                        if(!appointmentAlreadyInList){
                            return currentQueue.map(queue => {
                                if(queue._id === appointment.staffId._id){
                                    return {
                                        ...queue,
                                        appointments: [
                                            ...queue.appointments,
                                            appointment
                                        ]
                                    }
                                } return queue;
                            });
                        } return currentQueue
                    } else{
                        return [
                            ...currentQueue,
                            {
                                appointments: [
                                    appointment
                                ],
                                _id: appointment.staffId._id,
                                username: appointment.staffId.username,
                            }
                        ]
                    }
                })
            }
        })

        socket.on("appointmentInProgress", function(appointment){console.log(appointment)
            if(!userRef.current.id){
                return
            }
            if(appointment.customerId._id === userRef.current.id){
                setUpcomingAppointments((upcomingAppointments)=>{
                    if(!upcomingAppointments){
                        return upcomingAppointments;
                    };
                    let newUpcomingAppointments = [...upcomingAppointments];
                    for(let upcomingAppointment of newUpcomingAppointments){
                        if(upcomingAppointment._id === appointment._id){
                            upcomingAppointment.status = "IN PROGRESS";
                        };
                    };
                    return newUpcomingAppointments;
                });
                toast.success("Appointment is in progress!");
            }

            setLiveQueue((currentQueue) => {console.log(currentQueue)
                if(!currentQueue){
                    return currentQueue;
                };
                return currentQueue.map(queue => {
                    if(queue._id === appointment.staffId._id){
                        return {
                            ...queue,
                            appointments: queue.appointments.map(queueAppointment => {
                                if(queueAppointment._id === appointment._id){
                                    return {...queueAppointment, status: "IN PROGRESS"};
                                } return queueAppointment;
                            })
                        }
                    } return queue;
                })
            });
        });

        socket.on("appointmentCompleted", function(appointment){
            console.log(appointment)
            if(!userRef.current.id){console.log("return")
                return
            }
            if(appointment.customerId._id === userRef.current.id){
                setUpcomingAppointments((upcomingAppointments)=>{
                    if(!upcomingAppointments){console.log("server")
                        return upcomingAppointments;
                    };
                    let newUpcomingAppointments = [...upcomingAppointments];console.log("socket")
                    for(let upcomingAppointment of newUpcomingAppointments){
                        if(upcomingAppointment._id === appointment._id){
                            upcomingAppointment.status = "COMPLETED";
                            upcomingAppointment.queueMin = 1021 // 5:01pm placed in last queue
                        };
                    };
                    toast.success("Appointment is completed!");
                    return newUpcomingAppointments.sort((a,b)=> a.queueMin - b.queueMin);
                });
            };

            setLiveQueue((currentQueue) => {
                if(!currentQueue){
                    return currentQueue;
                };console.log(currentQueue)
                return currentQueue.map(queue => {console.log(queue)
                    if(queue._id === appointment.staffId._id){
                        return{
                            ...queue,
                            appointments: queue.appointments.map(queueAppointment => {
                                if(queueAppointment._id === appointment._id){
                                    return {...queueAppointment, status: "COMPLETED"};
                                } return queueAppointment;
                            })
                        }
                    } return queue;
                })
            });
        });

        socket.on("rescheduleAppointment", function(appointmentData){
            if(appointmentData.customerId._id === userRef.current.id){
                setUpcomingAppointments(upcomingAppointments => {
                    const newUpcomingAppointments = upcomingAppointments.map(upcomingAppointment => {
                        if(upcomingAppointment._id === appointmentData._id){
                            return {
                                ...upcomingAppointment,
                                date: appointmentData.date,
                                startedAt: appointmentData.startedAt,
                                endedAt: appointmentData.endedAt,
                                startedAtDate: appointmentData.startedAtDate,
                                endedAtDate: appointmentData.endedAtDate
                            }
                        };
                        return upcomingAppointment;
                    });
                    return newUpcomingAppointments.sort((a,b)=>{
                        const dateA = new Date(a.date);
                        const dateB = new Date(b.date);
                        if(dateA !== dateB){
                            return dateA - dateB;
                        };
                        return a.queueMin - b.queueMin;
                    })
                })
            }
        });

        socket.on("cancelAppointment", function(appointmentData){
            if(appointmentData.customerId._id === userRef.current.id){
                setUpcomingAppointments(upcomingAppointments => {
                    return upcomingAppointments.filter(upcomingAppointment => upcomingAppointment._id !== appointmentData._id);
                })
            }
        });

        return ()=>{socket.disconnect()};
    }, []);

    useEffect(()=>{
        async function fetchPhoneNumberStatus(){
            const response = await fetchWithRateLimit("http://localhost:5000/havePhoneNumber", {
                method: "GET",
                credentials: "include"
            });
            const result = await response.json();
            if(result.status === "success"){
                setHavePhoneNumber(result.message);
            } else if(result.status === "fail" && result.message === "auth"){
                // auth modal
                navigate("/auth/login");
            } else{
                // error modal
            }
        };

        fetchPhoneNumberStatus();
    }, [])

    useEffect(()=>{
        async function fetchAppointmentData(){
            const response = await fetchWithRateLimit("http://localhost:5000/AppointmentStats", {
                method: "GET",
                credentials: "include"
            });
            const result = await response.json();
            if(result.status === "success"){
                setAppointmentStats(result.message);
            } else if(result.status === "fail" && result.message === "auth"){
                // auth modal
                navigate("/auth/login");
            } else{
                // error modal
            }
        };

        fetchAppointmentData();
    }, [])
    

    useEffect(()=>{
        async function retrieveAppointments(){
            const response = await fetchWithRateLimit("http://localhost:5000/appointment", {
                method: "GET",
                credentials: "include"
            });
            const result = await response.json();
            if(result.status === "success"){
                const today = new Date().toISOString().split("T")[0];
                const upcoming = result.message.filter(appointment => appointment.date.split("T")[0] >= today);
                const past = result.message.filter(appointment => appointment.date.split("T")[0] < today);

                setUpcomingAppointments(upcoming);
                setPastAppointments(past);
            } else if(result.status === "fail" && result.message === "auth"){
                // auth modal
                navigate("/auth/login");
            } else{
                // error modal
            }
        };

        async function retrieveLiveQueue(){
            const response = await fetchWithRateLimit("http://localhost:5000/liveQueue", {
                method: "GET",
                credentials: "include"
            });

            const result = await response.json();
            if(result.status === "success"){console.log(result.message)
                setLiveQueue(result.message);
            } else if(result.status === "fail" && result.message === "auth"){
                // auth modal
                navigate("/auth/login");
            } else{
                // error modal
            }
        }

        if(isAuthenticated){
            retrieveAppointments();
            retrieveLiveQueue();
        };
    }, [isAuthenticated]);

    useEffect(()=>{
        if(location.state?.successModalOpen){
            setSuccessModalOpen(true);
            setSuccessModalType("makeAppointment");
            navigate(location.pathName, {replace: true, state: {}}); // clear state
        }
    }, [location.state]);

    function BarberQueue({ barberLiveQueue }){console.log(barberLiveQueue)
        const { inProgressQueue, scheduledQueue } = useMemo(()=>{
            const inProgress = [];
            const scheduled = [];

            if(barberLiveQueue?.appointments){
                barberLiveQueue.appointments.forEach(appointment => {
                    if(appointment.status === "IN PROGRESS"){
                        inProgress.push(appointment);
                    } else if(appointment.status === "SCHEDULED"){
                        scheduled.push(appointment);
                    }
                })
            };

            scheduled.sort((a,b)=> a.queueMin - b.queueMin);
            return {inProgressQueue: inProgress, scheduledQueue: scheduled}
        }, [barberLiveQueue?.appointments])

        return (
            <div className="bg-white rounded-lg shadow-xl mx-auto w-full max-w-md relative overflow-hidden border border-gray-200">
                {/* Decorative Top Gold Bar */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-yellow-600"></div>

                <div className="p-6">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-8 border-b border-gray-100 pb-4">
                        <div className='flex gap-4 items-center flex-1 min-w-0 mr-4'>
                            <div className='relative shrink-0'>
                                {barberLiveQueue.avatar ? (
                                    <img className='h-8 w-8 lg:h-12 lg:w-12 rounded-full object-cover border-2 border-yellow-600 p-[2px]' src={barberLiveQueue.avatar} alt="Barber" />
                                ) : (
                                    <div className='h-8 w-8 lg:h-12 lg:w-12 rounded-full bg-gray-200 border-2 border-yellow-600'></div>
                                )}
                                {/* Status Dot */}
                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                            </div>
                            <div className='min-w-0 flex-1'>
                                <h3 className="font-geom md:font-bartle lg:text-xl text-black leading-tight break-all">{barberLiveQueue?.username || "Barber"}</h3>
                            </div>
                        </div>
                        
                        <div className={`p-1 lg:px-3 lg:py-1 rounded-sm border ${inProgressQueue.length > 0 ? "bg-black border-yellow-600" : "bg-gray-50 border-gray-200"}`}>
                            <span className={`font-geom text-xs font-bold uppercase tracking-widest ${inProgressQueue.length > 0 ? "text-white" : "text-gray-400"}`}>
                                {inProgressQueue.length > 0 ? "BUSY" : "OPEN"}
                            </span>
                        </div>
                    </div>

                    {/* Active Chair Section */}
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="h-px w-4 bg-yellow-600"></div>
                            <p className="font-geom text-sm font-bold text-black uppercase tracking-wider">Currently Serving</p>
                        </div>

                        {inProgressQueue.length > 0 ? (
                            inProgressQueue.map(app => (
                                <div key={app._id} className="relative p-4 bg-yellow-50 border border-yellow-200/60 rounded-md flex items-center justify-between">
                                    {/* Left Gold accent */}
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-600 rounded-l-md"></div>
                                    
                                    <div className="pl-3">
                                        <p className="font-bartle text-lg text-black">
                                            {app.customerId === userRef.current.id ? "You" : "Customer #" + app.queueMin}
                                        </p>
                                        <p className="font-robotoCondensed text-sm text-yellow-800/80 uppercase tracking-tight font-bold">
                                            {app.service?.name || "Haircut Service"}
                                        </p>
                                    </div>

                                    {/* Animated Pulse */}
                                    <div className="flex flex-col items-end">
                                        <span className="relative flex h-3 w-3">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-500 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-600"></span>
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-4 bg-gray-50 border border-dashed border-gray-300 rounded-md text-center">
                                <p className="font-bartle text-gray-400">Chair is Empty</p>
                                <p className="font-robotoCondensed text-xs text-gray-400 uppercase">Ready for next client</p>
                            </div>
                        )}
                    </div>

                    {/* Waiting List */}
                    <div>
                        <div className="flex justify-between items-end mb-4">
                            <div className="flex items-center gap-2">
                                <div className="h-px w-4 bg-gray-300"></div>
                                <p className="font-geom text-sm font-bold text-gray-500 uppercase tracking-wider">Up Next</p>
                            </div>
                            <span className="font-robotoCondensed text-xs font-bold text-white bg-black px-2 py-1 rounded-sm">
                                {scheduledQueue.length} WAITING
                            </span>
                        </div>
                        
                        <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-2 custom-scrollbar">
                            {scheduledQueue.length > 0 ? (
                                scheduledQueue.map((app, idx) => (
                                    <div key={app._id} className="group p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            {/* Vintage Number Style */}
                                            <span className="font-bartle text-xl text-gray-300 group-hover:text-yellow-600 transition-colors">
                                                {idx + 1}
                                            </span>
                                            <div>
                                                <span className="font-robotoCondensed font-bold text-gray-800 text-lg block leading-none">
                                                    {app.customerId === userRef.current.id ? "You" : "Customer #" + app.queueMin}
                                                </span>
                                                <span className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                                                    {app.queueMin - (new Date().getHours() * 60 + new Date().getMinutes()) > 0 
                                                        ? `Wait: ~${app.queueMin - (new Date().getHours() * 60 + new Date().getMinutes())}m`
                                                        : "Serving Soon"
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm font-robotoCondensed text-gray-400 italic text-center py-4">NO APPOINTMENTS IN QUEUE</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    
    return(
        <>
            {isAuthenticated && appointmentStats &&
                <div className="appointment">
                    <Toaster position='top-right' />
                    <div className='flex flex-col min-h-screen'>
                        <Header isOpenHamburgerMenu={isOpenHamburgerMenu} setOpenHamburgerMenu={setOpenHamburgerMenu} />
                        <div className='px-5 py-20 sm:p-28 text-white bg-cover flex flex-col flex-1 gap-14' style={{backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${appointmentPage1})`}}>
                            <div className='text-left'>
                                <h1 className='text-xl sm:text-4xl font-bartle mb-2'>My Appointments</h1>
                                <p className='text-lg sm:text-xl font-geom mb-10 opacity-80'>Manage your bookings and view your appointment history</p>
                                <button className="group relative overflow-hidden w-fit bg-amber-500 hover:bg-amber-400 text-black hover:scale-105 font-sans gap-2 font-bold rounded-lg" onClick={()=>{havePhoneNumber ? setMakeAppointmentModalOpen(prevState => !prevState) : setPhoneNumberModalOpen(true)}}>
                                        <div className="flex items-center gap-2 transition-transform duration-500 ease-in-out p-4 sm:px-6 py-4 group-hover:-translate-y-full">
                                            <img className="w-5" src={calendar} alt="Calendar Icon" />
                                            <p>Online Appointment</p>
                                        </div>
                                        <div className="absolute inset-0 flex items-center justify-center gap-2 translate-y-full transition-transform duration-500 ease-in-out px-6 py-4 group-hover:translate-y-0">
                                            <img className="w-5 group-hover:translate-y-0" src={calendar} alt="Calendar Icon" />
                                            <p>Online Appointment</p>
                                        </div>
                                </button>
                            </div>
                            <div className='grid grid-cols-2 lg:grid-cols-4 w-full gap-5 lg:gap-32 text-black'>
                                <div className='relative flex flex-col justify-center items-center aspect-square p-[2px] rounded-xl overflow-hidden shadow-lg hover:scale-105 transition-transform duration-300'>
                                    <div className='absolute inset-[-50%] animate-gradientSpin bg-[conic-gradient(from_var(--border-angle),var(--tw-gradient-stops))]
                                    from-black via-amber-400 to-black'></div>
                                        <div className='relative z-10 h-full w-full flex flex-col gap-2 justify-center items-center bg-zinc-900/90 backdrop-blur-md rounded-xl'>
                                            <h1 className='relative z-10 font-hegarty font-bold text-4xl sm:text-6xl text-amber-400'>
                                                {appointmentStats.upcomingAppointmentsCount}
                                            </h1>
                                            <h1 className='font-robotoCondensed text-sm text-white uppercase tracking-widest opacity-80 text-center'>
                                                Upcoming
                                            </h1>
                                        </div>
                                </div>
                                <div className='relative flex flex-col justify-center items-center aspect-square p-[2px] rounded-xl overflow-hidden shadow-lg hover:scale-105 transition-transform duration-300'>
                                    <div className='absolute inset-[-50%] animate-gradientSpin bg-[conic-gradient(from_var(--border-angle),var(--tw-gradient-stops))]
                                    from-black via-gray-300 to-black'></div>
                                        <div className='relative z-10 h-full w-full flex flex-col gap-2 justify-center items-center bg-zinc-900/90 backdrop-blur-md rounded-xl'>
                                            <h1 className='relative z-10 font-hegarty font-bold text-4xl sm:text-6xl text-gray-300'>
                                                {appointmentStats.pastAppointmentsCount}
                                            </h1>
                                            <h1 className='font-robotoCondensed text-sm text-white uppercase tracking-widest opacity-80 text-center'>
                                                Completed
                                            </h1>
                                        </div>
                                </div>
                                <div className='relative flex flex-col justify-center items-center aspect-square p-[2px] rounded-xl overflow-hidden shadow-lg hover:scale-105 transition-transform duration-300'>
                                    <div className='absolute inset-[-50%] animate-gradientSpin bg-[conic-gradient(from_var(--border-angle),var(--tw-gradient-stops))]
                                    from-black via-green-400 to-black'></div>
                                        <div className='relative z-10 h-full w-full flex flex-col gap-2 justify-center items-center bg-zinc-900/90 backdrop-blur-md rounded-xl'>
                                            <h1 className='relative z-10 font-hegarty font-bold text-2xl sm:text-4xl text-green-400'>
                                                <span className="text-xl sm:text-2xl align-top mr-1">RM</span>{appointmentStats.totalMoneySpent}
                                            </h1>
                                            <h1 className='font-robotoCondensed text-sm text-white uppercase tracking-widest opacity-80 text-center'>
                                                Invested in Style
                                            </h1>
                                        </div>
                                </div>
                                <div className='relative flex flex-col justify-center items-center aspect-square p-[2px] rounded-xl overflow-hidden shadow-lg hover:scale-105 transition-transform duration-300'>
                                    <div className='absolute inset-[-50%] animate-gradientSpin bg-[conic-gradient(from_var(--border-angle),var(--tw-gradient-stops))]
                                    from-black via-blue-400 to-black'></div>
                                        <div className='relative z-10 h-full w-full flex flex-col gap-2 justify-center items-center bg-zinc-900/90 backdrop-blur-md rounded-xl'>
                                            <h1 className='relative z-10 font-hegarty font-bold text-4xl sm:text-6xl text-blue-400'>
                                                {appointmentStats.lastAppointmentDate}
                                            </h1>
                                            <div className='text-center'>
                                               <h1 className='font-robotoCondensed text-sm text-white uppercase tracking-widest opacity-80'>
                                                    Days Ago
                                                </h1>
                                                {appointmentStats.lastAppointmentDate !== "-" && (
                                                    <p className='text-[10px] text-white mt-2 font-sans'>
                                                        {appointmentStats.lastAppointmentDate > 14 ? "We miss you!" : "See you soon!"}
                                                    </p>
                                                )} 
                                            </div>      
                                        </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className='bg-gray-800 px-5 py-20 sm:p-28 flex gap-10 flex-col lg:flex-row'>
                        <div className='bg-gray-600 p-5 lg:p-10 rounded-lg text-center lg:text-left text-white flex-1 min-w-0'>
                            <div className='flex flex-col gap-5 lg:flex-row lg:gap-0 justify-between items-center mx-2'>
                                <div className='flex flex-col gap-5'>
                                    <h1 className='text-2xl font-geom md:font-bartle'>Live Queue Status</h1>
                                    <p className=' text-sm sm:text-lg opacity-80 font-geom'>Real Time Barber Availability and Wait Times</p>
                                </div>
                                <div className='flex gap-2 items-center p-3 rounded-3xl bg-red-500/15 border-red-500 border-2'>
                                    <div className='w-3 h-3 rounded-full bg-red-500 animate-livePop'></div>
                                    <h1 className='text-red-600 font-geom font-bold'>LIVE</h1>
                                </div>
                            </div>
                            <div className='flex flex-col gap-5 mt-10'>
                                {liveQueue?.length > 0 ? 
                                    liveQueue.map(queue=>(
                                        <BarberQueue barberLiveQueue={queue} /> 
                                    ))

                                : <h1>No Live Queue Available Currently</h1>}
                            </div>
                        </div>
                        <div className='bg-gray-600 p-5 lg:p-10 rounded-lg text-center lg:text-right text-white flex-1 min-w-0'>
                            <div className='flex flex-col gap-5 mb-10'>
                                <h1 className='font-geom text-2xl md:font-bartle'>Appointment's Details</h1>
                                <p className='sm:text-lg opacity-80 font-geom'>View All Your Upcoming and Past Appointments</p>
                            </div>
                            <div className='w-full mx-2 mb-10 flex justify-around items-center bg-gray-400 rounded-lg p-1 md:p-2 text-center font-geom font-bold'>
                                    <h1 className={`w-full cursor-pointer p-1 text-sm sm:text-[1rem] sm:p-2 ${view===1 ? 'bg-yellow-600 rounded-lg' : null}`} onClick={()=>{setView(1)}}>Recent Appointments</h1>
                                    <h1 className={`w-full cursor-pointer p-1 text-sm sm:text-[1rem] sm:p-2 ${view===2 ? 'bg-yellow-600 rounded-lg' : null}`} onClick={()=>{setView(2)}}>Past Appointments</h1>
                            </div>

                            <div className='text-center grid grid-cols-1 lg:grid-cols-2 gap-5'>
                                {view === 1 && (upcomingAppointments?.length > 0 ? (
                                        upcomingAppointments.map((appointment, idx) => 
                                            appointment.date.split("T")[0] >= new Date().toISOString().split("T")[0] && (
                                                <div key={idx} className='group bg-black/15 p-4 rounded-lg border-2 border-yellow-600'>
                                                    <div className='flex gap-2 md:gap-0 md:flex-col items-center justify-center bg-yellow-600 text-black rounded-md p-3 min-w-[80px] text-center shrink-0'>
                                                        <FontAwesomeIcon icon={faCalendar} className="text-xl mb-1 hidden md:block" />
                                                        <p className='font-bold font-geom text-lg leading-none'>
                                                            {new Date(appointment.date).getDate()}
                                                        </p>
                                                        <p className='font-robotoCondensed text-sm uppercase font-bold opacity-80'>
                                                            {new Date(appointment.date).toLocaleString('default', { month: 'short' })}
                                                        </p>
                                                    </div>

                                                {/* Center: Details */}
                                                <div className='flex-1 flex flex-col gap-2'>
                                                    <div className='flex justify-between md:justify-start items-center gap-4 mt-2'>
                                                        <h2 className='font-geom md:font-bartle text-lg md:text-sm text-white tracking-wide'>
                                                            {appointment.serviceId.name}
                                                        </h2>
                                                        {/* Status Badge */}
                                                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-sm border ${
                                                            appointment.status === "SCHEDULED" ? "border-green-500 text-green-400 bg-green-500/10" : 
                                                            appointment.status === "IN PROGRESS" ? "border-blue-500 text-blue-400 bg-blue-500/10" : 
                                                            "border-gray-500 text-gray-400 bg-gray-500/10"
                                                        }`}>
                                                            {appointment.status}
                                                        </span>
                                                    </div>

                                                    <div className='flex flex-col gap-y-2 text-gray-300 font-robotoCondensed text-sm'>
                                                        <div className='flex items-center gap-2'>
                                                            <FontAwesomeIcon icon={faClock} className="text-yellow-600" />
                                                            <p>{appointment.startedAt} - {appointment.endedAt}</p>
                                                        </div>
                                                        <div className='flex items-center gap-2'>
                                                            <FontAwesomeIcon icon={faCircleUser} className="text-yellow-600" />
                                                            <p className="capitalize">{appointment.staffId.username}</p>
                                                        </div>
                                                        <div className='flex items-center gap-2'>
                                                        <FontAwesomeIcon icon={faMoneyBill1} className="text-yellow-600" />
                                                        <p className={`capitalize ${appointment.paymentStatus === "PAID" ? "text-green-400" : "text-red-400"}`}>{appointment.paymentStatus.toLowerCase()}</p>
                                                    </div>
                                                    </div>
                                                </div>

                                                {/* Right: Actions */}
                                                <div className='w-full md:w-auto flex md:flex-col gap-2 shrink-0 mt-2'>
                                                    <button 
                                                        onClick={() => { setRescheduleAppointmentModalOpen(true); setSelectedAppointment(appointment); }}
                                                        className='flex-1 md:flex-none p-2 md:px-4 md:py-2 bg-white text-black font-bold font-geom text-xs uppercase hover:bg-yellow-600 transition-colors rounded-sm'
                                                    >
                                                        Reschedule
                                                    </button>
                                                    <button 
                                                        onClick={() => { setCancelAppointmentModalOpen(true); setSelectedAppointment(appointment); }}
                                                        className='flex-1 md:flex-none p-2 md:px-4 md:py-2 border border-gray-600 text-gray-400 font-bold font-geom text-xs uppercase hover:border-red-500 hover:text-red-500 transition-colors rounded-sm'
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                            )
                                        )
                                    ) : (
                                            <h1>No Recent Appointment Found</h1>
                                        ))
                                    }
                            </div>

                            <div className='text-center grid grid-cols-1 lg:grid-cols-2 gap-5'>
                                {view === 2 && (pastAppointments?.length > 0 ? (
                                    [...pastAppointments].reverse().map((appointment, idx) => 
                                        appointment.date.split("T")[0] < new Date().toISOString().split("T")[0] && (
                                            <div key={idx} className='group bg-black/15 p-4 rounded-lg border-2 border-yellow-600'>
                                                <div className='flex md:flex-col items-center justify-center bg-yellow-600 text-black rounded-md p-3 min-w-[80px] text-center shrink-0'>
                                                    <FontAwesomeIcon icon={faCalendar} className="text-xl mb-1 hidden md:block" />
                                                    <p className='font-bold font-geom text-lg leading-none'>
                                                        {new Date(appointment.date).getDate()}
                                                    </p>
                                                    <p className='font-robotoCondensed text-sm uppercase font-bold opacity-80'>
                                                        {new Date(appointment.date).toLocaleString('default', { month: 'short' })}
                                                    </p>
                                                </div>

                                            {/* Center: Details */}
                                            <div className='flex-1 flex flex-col gap-2'>
                                                <div className='flex justify-between md:justify-start items-center gap-4 mt-2'>
                                                    <h2 className='text-2xl font-geom text-white tracking-wide'>
                                                        {appointment.serviceId.name}
                                                    </h2>
                                                    {/* Status Badge */}
                                                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-sm border ${
                                                        appointment.status === "SCHEDULED" ? "border-green-500 text-green-400 bg-green-500/10" : 
                                                        appointment.status === "IN PROGRESS" ? "border-blue-500 text-blue-400 bg-blue-500/10" : 
                                                        "border-gray-500 text-gray-400 bg-gray-500/10"
                                                    }`}>
                                                        {appointment.status}
                                                    </span>
                                                </div>

                                                <div className='flex flex-col gap-y-2 text-gray-300 font-robotoCondensed text-sm'>
                                                    <div className='flex items-center gap-2'>
                                                        <FontAwesomeIcon icon={faClock} className="text-yellow-600" />
                                                        <p>{appointment.startedAt} - {appointment.endedAt}</p>
                                                    </div>
                                                    <div className='flex items-center gap-2'>
                                                        <FontAwesomeIcon icon={faCircleUser} className="text-yellow-600" />
                                                        <p className="capitalize">{appointment.staffId.username}</p>
                                                    </div>
                                                    <div className='flex items-center gap-2'>
                                                        <FontAwesomeIcon icon={faMoneyBill1} className="text-yellow-600" />
                                                        <p className="capitalize">RM{appointment.serviceId.price}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        )
                                    )
                                ) : (
                                        <h1>No Recent Appointment Found</h1>
                                    ))
                                }
                            </div>
                        </div>
                    </div>


                    {makeAppointmentModalOpen &&
                        <MakeAppointmentModal makeAppointmentModalOpen={makeAppointmentModalOpen} setMakeAppointmentModalOpen={setMakeAppointmentModalOpen} setSuccessModalOpen={()=>{setSuccessModalOpen(true); setSuccessModalType("makeAppointment")}} setUpcomingAppointments={setUpcomingAppointments} setLiveQueue={setLiveQueue} />
                    }

                    {rescheduleAppointmentModalOpen && selectedAppointment !== null &&
                        <RescheduleAppointmentModal rescheduleAppointmentModalOpen={rescheduleAppointmentModalOpen} setRescheduleAppointmentModalOpen={setRescheduleAppointmentModalOpen} selectedAppointment={selectedAppointment} setSuccessModalOpen={()=>{setSuccessModalOpen(true); setSuccessModalType("rescheduleAppointment")}} />
                    }

                    {cancelAppointmentModalOpen && selectedAppointment !== null &&
                        <CancelAppointmentModal CancelAppointmentModalOpen={cancelAppointmentModalOpen} setCancelAppointmentModalOpen={setCancelAppointmentModalOpen} selectedAppointment={selectedAppointment} setSuccessModalOpen={()=>{setSuccessModalOpen(true); setSuccessModalType("cancelAppointment")}} />
                    }
                    <AddPhoneNumberModal phoneNumberModalOpen={phoneNumberModalOpen} setPhoneNumberModalOpen={setPhoneNumberModalOpen} setHavePhoneNumber={setHavePhoneNumber} setSuccessModalOpen={()=>{setSuccessModalOpen(true); setSuccessModalType("addPhoneNumber")}} />
                    <SuccessModal type={successModalType} successModalOpen={successModalOpen} setSuccessModalOpen={setSuccessModalOpen} email={userRef.current.email} />
                </div>
            }       
        </>
    )
};