import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleUser, faCalendar, faClock } from "@fortawesome/free-solid-svg-icons";
import { io } from 'socket.io-client';
import toast, { Toaster } from 'react-hot-toast';

import checkAuthenticated from './checkAuthenticated';
import fetchWithRateLimit from './fetchWithRateLimit';
import AddPhoneNumberModal from './AddPhoneNumberModal';
import MakeAppointmentModal from './MakeAppointmentModal';
import RescheduleAppointmentModal from './RescheduleAppointmentModal';
import CancelAppointmentModal from './CancelAppointmentModal';
import SuccessModal from './SuccessModal';

export default function Appointment(){
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState({id: null, username: null, email: null, role: null, avatar: null});
    const [havePhoneNumber, setHavePhoneNumber] = useState(false);
    const [phoneNumberModalOpen, setPhoneNumberModalOpen] = useState(false);

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
    const [cancelAppointmentModalOpen, setCancelAppointmentOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);

    useEffect(()=>{
        async function checkAuth() {
            const { authenticated } = await checkAuthenticated(setIsAuthenticated, setUser);console.log(authenticated)
            if (!authenticated) {
                // auth modal
                navigate("/auth/login");
            }
        }
        checkAuth();
    }, [navigate]);

    useEffect(()=>{
        userRef.current = user;
    }, [user])

    
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

    function BarberQueue({ barberLiveQueue }){
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
            <div className="border border-gray-200 p-4 rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
                {/* Header */}
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h3 className="font-bold text-lg text-gray-800">{barberLiveQueue?.username}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${inProgressQueue.length > 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {inProgressQueue.length > 0 ? "BUSY" : "AVAILABLE"}
                    </span>
                </div>

                {/* Active Chair */}
                <div className="mb-4">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">In Chair</p>
                    {inProgressQueue.length > 0 ? (
                        inProgressQueue.map(app => (
                            <div key={app._id} className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                                <div>
                                    <p className="font-bold text-blue-900 text-sm">{app.customerId._id === userRef.current.id ? "Me" : "Customer #" +  app.queueMin}</p>
                                    <p className="text-xs text-blue-600">{app.service?.name || "Service"}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-3 bg-gray-50 border border-dashed border-gray-300 rounded-lg text-center">
                            <p className="text-xs text-gray-400">Chair Empty</p>
                        </div>
                    )}
                </div>

                {/* Waiting List */}
                <div>
                    <div className="flex justify-between items-end mb-2">
                        <p className="text-xs font-bold text-gray-400 uppercase">Queue</p>
                        <span className="text-xs text-gray-400">{scheduledQueue.length} waiting</span>
                    </div>
                    
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                        {scheduledQueue.length > 0 ? (
                            scheduledQueue.map((app, idx) => (
                                <div key={app._id} className="p-2 border border-gray-100 rounded bg-white flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-600">
                                        {idx + 1}. {app.customerId._id === userRef.current.id ? "Me" : "Customer #" +  app.queueMin}
                                    </span>
                                    <span className="text-xs text-gray-400 bg-gray-100 px-1 rounded">
                                        {app.queueMin - (new Date().getHours() * 60 + new Date().getMinutes()) > 0 ? 
                                           "~ " + (app.queueMin - (new Date().getHours() * 60 + new Date().getMinutes())) + " m"
                                        :
                                            "Serving Soon..."
                                        }
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-xs text-gray-400 italic">No one in line</p>
                        )}
                    </div>
                </div>
            </div>
        );
    }
    
    return(
        <>
            {isAuthenticated &&
                <div className="appointment">
                    <Toaster position='top-right' />
                    <button onClick={()=>{havePhoneNumber ? setMakeAppointmentModalOpen(prevState => !prevState) : setPhoneNumberModalOpen(true)}}>Make Appointment</button>
                    
                    <div>
                        <button onClick={()=>{setView(1)}}>Recent Appointments</button>
                        <button onClick={()=>{setView(2)}}>Live Queue</button>
                        <button onClick={()=>{setView(3)}}>Past Appointments</button>
                    </div>

                    <div>
                        {view === 1 && (upcomingAppointments?.length > 0 ? (
                                upcomingAppointments.map((appointment, idx) => 
                                     appointment.date.split("T")[0] >= new Date().toISOString().split("T")[0] && (
                                        <div>
                                            <div>
                                                <h2>{appointment.serviceId.name}</h2>
                                                <p>{appointment.status === "SCHEDULED" ? "Scheduled" : appointment.status === "IN PROGRESS" ? "In Progress" : "Completed"}</p>
                                            </div>
                                            <div>
                                                <FontAwesomeIcon icon={faCircleUser} />
                                                <p>{appointment.staffId.username}</p>
                                            </div>
                                            <div>
                                                <FontAwesomeIcon icon={faCalendar} />
                                                <p>{appointment.date.split("T")[0]}</p>
                                            </div>
                                            <div>
                                                <FontAwesomeIcon icon={faClock} />
                                                <p>{appointment.startedAt} - {appointment.endedAt}</p>
                                            </div>
                                            <div>
                                                <button onClick={()=>{setRescheduleAppointmentModalOpen(true); setSelectedAppointment(appointment);}}>Reschedule</button>
                                                <button onClick={()=>{setCancelAppointmentOpen(true); setSelectedAppointment(appointment);}}>Cancel</button>
                                            </div>
                                        </div>
                                    )
                                )
                            ) : (
                                    <h1>No Recent Appointment Found</h1>
                                ))
                            }
                    </div>

                    <div>
                        {view === 2 && (liveQueue?.length > 0 ? 
                            liveQueue.map(queue=>(
                                <BarberQueue barberLiveQueue={queue} /> 
                            ))

                        : <h1>No Live Queue Available Currently</h1>)}
                    </div>

                    <div>
                        {view === 3 && (pastAppointments?.length > 0 ? 
                        [...pastAppointments].reverse().map(appointment => (
                            appointment.date.split("T")[0] <= new Date().toISOString().split("T")[0] && 
                                <div>
                                    <div>
                                        <h2>{appointment.serviceId.name}</h2>
                                        <p>{appointment.status === "SCHEDULED" ? "Scheduled" : appointment.status === "IN PROGRESS" ? "In Progress" : "Completed"}</p>
                                    </div>
                                    <div>
                                        <FontAwesomeIcon icon={faCircleUser} />
                                        <p>{appointment.staffId.username}</p>
                                    </div>
                                    <div>
                                        <FontAwesomeIcon icon={faCalendar} />
                                        <p>{appointment.date.split("T")[0]}</p>
                                    </div>
                                    <div>
                                        <FontAwesomeIcon icon={faClock} />
                                        <p>{appointment.startedAt} - {appointment.endedAt}</p>
                                    </div>
                                </div>
                        )) :
                            <h1>No Past Appointment Found</h1>
                        )}
                    </div>

                    {makeAppointmentModalOpen &&
                        <MakeAppointmentModal makeAppointmentModalOpen={makeAppointmentModalOpen} setMakeAppointmentModalOpen={setMakeAppointmentModalOpen} setSuccessModalOpen={()=>{setSuccessModalOpen(true); setSuccessModalType("makeAppointment")}} setUpcomingAppointments={setUpcomingAppointments} setLiveQueue={setLiveQueue} />
                    }

                    {rescheduleAppointmentModalOpen && selectedAppointment !== null &&
                        <RescheduleAppointmentModal rescheduleAppointmentModalOpen={rescheduleAppointmentModalOpen} setRescheduleAppointmentModalOpen={setRescheduleAppointmentModalOpen} selectedAppointment={selectedAppointment} setSuccessModalOpen={()=>{setSuccessModalOpen(true); setSuccessModalType("rescheduleAppointment")}} />
                    }

                    {cancelAppointmentModalOpen && selectedAppointment !== null &&
                        <CancelAppointmentModal CancelAppointmentModalOpen={cancelAppointmentModalOpen} setCancelAppointmentOpen={setCancelAppointmentOpen} selectedAppointment={selectedAppointment} setSuccessModalOpen={()=>{setSuccessModalOpen(true); setSuccessModalType("cancelAppointment")}} />
                    }
                    <AddPhoneNumberModal phoneNumberModalOpen={phoneNumberModalOpen} setPhoneNumberModalOpen={setPhoneNumberModalOpen} setHavePhoneNumber={setHavePhoneNumber} setSuccessModalOpen={()=>{setSuccessModalOpen(true); setSuccessModalType("addPhoneNumber")}} />
                    <SuccessModal type={successModalType} successModalOpen={successModalOpen} setSuccessModalOpen={setSuccessModalOpen} email={user.email} />
                </div>
            }       
        </>
    )
};