import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from 'react-hot-toast';

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock } from "@fortawesome/free-solid-svg-icons";
import { io } from 'socket.io-client';

import checkAuthenticated from "../checkAuthenticated";
import fetchWithRateLimit from "../fetchWithRateLimit";
import ConfirmPaymentModal from "./ConfirmPaymentModal";
import ErrorModal from "../ErrorModal";

export default function StaffHome(){
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [inProgressAppointments, setInProgressApointments] = useState(null);
    const [pendingAppointments, setPendingAppointments] = useState(null);
    const [completedAppointments, setCompletedAppointments] = useState(null);
    const [timeMin, setTimeMin] = useState(new Date().getHours() * 60 + new Date().getMinutes());
    const [notifiedIds, setNotifiedIds] = useState([]);
    const [socket, setSocket] = useState(null);
    const [confirmPaymentModalOpen, setConfirmPaymentModalOpen] = useState(false);
    const [confirmPaymentAppointment, setConfirmPaymentAppointment] = useState(null);
    const [errorModalOpen, setErrorModalOpen] = useState(false);

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
        const newSocket = io("http://localhost:5000", {
            withCredentials: true
        });

        setSocket(newSocket);
        
        newSocket.emit("join", "staff");

        newSocket.on("newAppointment", function(appointmentData){
            console.log(appointmentData);
            setPendingAppointments((pendingAppointments)=>{
                let allPendingAppointments = [
                    ...pendingAppointments,
                    appointmentData
                ];
                allPendingAppointments.sort((a,b)=> a.queueMin - b.queueMin);
                toast.success('An appointment has arrived!');
                return allPendingAppointments;
            });
        });

        return ()=>{newSocket.disconnect()};
    }, []);

    useEffect(()=>{
        if(pendingAppointments){
            pendingAppointments.forEach(appointment => {
                if(timeMin >= appointment.queueMin && !notifiedIds.includes(appointment._id)){
                    setNotifiedIds((allNotifiedIds)=>{
                        return [
                            ...notifiedIds,
                            appointment._id
                        ]
                    })
                    toast.success("An appointment can start to be service!");  
                };
            })
        };
    }, [timeMin, pendingAppointments]);

    useEffect(()=>{
        async function fetchAppointmentsToday(){
            const response = await fetchWithRateLimit("http://localhost:5000/staff/appointments", {
                method: "GET",
                credentials: "include",
            });

            const result = await response.json();
            if(result.status === "success"){
                const allAppointments = result.message;
                const allInProgressAppointments = allAppointments.filter(appointment => appointment.status === "IN PROGRESS");
                setInProgressApointments(allInProgressAppointments);
                const allPendingAppointments = allAppointments.filter(appointment => appointment.status === "SCHEDULED");console.log(allPendingAppointments)
                setPendingAppointments(allPendingAppointments);
                const allCompletedAppointments = allAppointments.filter(appointment => appointment.status === "COMPLETED");
                setCompletedAppointments(allCompletedAppointments);
            } else if(result.status === "fail" && result.message === "auth"){
                navigate("/auth/login", {state: {errorModalOpen: true}});
            } else{
                setErrorModalOpen(true);
            }
        };

        if(isAuthenticated){
            fetchAppointmentsToday();
        };
    }, [isAuthenticated]);

    useEffect(()=>{
        const intervalId = setInterval(()=>{
            const HOUR = new Date().getHours();
            const MIN = new Date().getMinutes();
            let time = HOUR * 60 + MIN;
            setTimeMin(time); console.log(time)
        }, 60 * 1000); 

        return(()=>{
            clearInterval(intervalId);
        })
    }, []);

    async function handleAppointmentToInProgress(appointment){
        try{
            const response = await fetchWithRateLimit("http://localhost:5000/appointment/updateStatus", {
                method: "PUT",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({id: appointment._id, status: "IN PROGRESS"})
            });

            const result = await response.json();
            if(result.status === "success"){
                const updatedAppointment = result.message;
                if(socket){console.log("emit")
                    socket.emit("appointmentInProgress", updatedAppointment);
                };
                setPendingAppointments(pendingAppointments => {
                    return pendingAppointments.filter(eachAppointment => eachAppointment._id !== updatedAppointment._id);
                });
                setInProgressApointments(inProgressAppointments => {
                    return [
                        ...inProgressAppointments,
                        updatedAppointment
                    ]
                });
                toast.success("Appointment is in progress!");
            } else if(result.status === "fail" && result.message === "auth"){
                navigate("/auth/login", {state: {errorModalOpen: true}});
            } else{
                setErrorModalOpen(true);
            }
        } catch(err){
            console.log(err);
            setErrorModalOpen(true);
        }
    };

    async function handleAppointmentToCompleted(appointment){
        try{
            const response = await fetchWithRateLimit("http://localhost:5000/appointment/updateStatus", {
                method: "PUT",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({id: appointment._id, status: "COMPLETED"})
            });

            const result = await response.json();
            if(result.status === "success"){console.log(socket)
                const updatedAppointment = result.message;
                if(socket){console.log("emit")
                    socket.emit("appointmentCompleted", updatedAppointment);
                };
                setInProgressApointments(inProgressAppointments => {
                    return inProgressAppointments.filter(eachAppointment => eachAppointment._id !== updatedAppointment._id);
                });
                setCompletedAppointments(completedAppointments => {
                    return [
                        ...completedAppointments,
                        updatedAppointment
                    ]
                });
                toast.success("Appointment is completed!");
            } else if(result.status === "fail" && result.message === "auth"){
                navigate("/auth/login", {state: {errorModalOpen: true}});
            } else{
                setErrorModalOpen(true);
            }
        } catch(err){
            console.log(err);
            setErrorModalOpen(true);
        }
    };

    return(
        <>
            {isAuthenticated &&
                <div>
                    <Toaster position="top-right" />
                    <h1>Staff Dashboard</h1>
                    <div>
                        {inProgressAppointments && <h1>In Progress {inProgressAppointments.length}</h1>}
                        {inProgressAppointments && inProgressAppointments.length > 0 &&
                            inProgressAppointments.map(appointment => (
                                <div>
                                    <div>
                                        <h2>{appointment.customerId.username}</h2>
                                        <p>In Progress</p>
                                    </div>
                                    <div>
                                        <p>{appointment.serviceId.name}</p>
                                    </div>
                                    <div>
                                        <FontAwesomeIcon icon={faClock} />
                                        <p>{appointment.startedAt} - {appointment.endedAt}</p>
                                    </div><p>{appointment.paymentStatus}</p>
                                    <div>
                                        <button className={`
                                            px-4 py-2 rounded font-semibold transition 
                                            ${timeMin < appointment.queueMin
                                            ? "bg-gray-400 text-gray-700 cursor-not-allowed" 
                                            : "bg-blue-600 text-white hover:bg-blue-700"}
                                        `}
                                        disabled={timeMin < appointment.queueMin} 
                                        onClick={()=>{appointment.paymentStatus === "PAID" ? handleAppointmentToCompleted(appointment) : setConfirmPaymentModalOpen(true); setConfirmPaymentAppointment(appointment);}}>Mark as Completed</button>
                                    </div>
                                </div>
                            ))
                        }
                        {inProgressAppointments && inProgressAppointments.length === 0 &&
                            <h1>No Appointment in Progress</h1>
                        }
                    </div>

                    <div>
                        {pendingAppointments && <h1>Scheduled {pendingAppointments.length}</h1>}
                        {pendingAppointments && pendingAppointments.length > 0 &&
                            pendingAppointments.map(appointment => (
                                <div>
                                    <div>
                                        <h2>{appointment.customerId.username}</h2>
                                        <p>{appointment.status}</p>
                                    </div>
                                    <div>
                                        <p>{appointment.serviceId.name}</p>
                                    </div>
                                    <div>
                                        <FontAwesomeIcon icon={faClock} />
                                        <p>{appointment.startedAt} - {appointment.endedAt}</p>
                                    </div>
                                    <div>
                                        <button className={`
                                            px-4 py-2 rounded font-semibold transition 
                                            ${timeMin < appointment.queueMin
                                            ? "bg-gray-400 text-gray-700 cursor-not-allowed" 
                                            : "bg-blue-600 text-white hover:bg-blue-700"}
                                        `}
                                        disabled={timeMin < appointment.queueMin}
                                        onClick={()=>{handleAppointmentToInProgress(appointment)}}
                                        >
                                        Start Service
                                        </button>
                                    </div>
                                </div>
                            ))
                        }
                        {pendingAppointments && pendingAppointments.length === 0 &&
                            <h1>No Scheduled Appointment</h1>
                        }
                    </div>

                    <div>
                        {completedAppointments && <h1>Completed {completedAppointments.length}</h1>}
                        {completedAppointments && completedAppointments.length > 0 &&
                            completedAppointments.map(appointment => (
                                <div>
                                    <div>
                                        <h2>{appointment.customerId.username}</h2>
                                        <p>{appointment.status}</p>
                                    </div>
                                    <div>
                                        <p>{appointment.serviceId.name}</p>
                                    </div>
                                    <div>
                                        <FontAwesomeIcon icon={faClock} />
                                        <p>{appointment.startedAt} - {appointment.endedAt}</p>
                                    </div>
                                    <div>
                                        <button disabled>Completed</button>
                                    </div>
                                </div>
                            ))
                        }
                        {completedAppointments && completedAppointments.length === 0 &&
                            <h1>No Completed Appointment</h1>
                        }
                    </div>
                </div>
            }

            {confirmPaymentModalOpen && confirmPaymentAppointment &&
                <ConfirmPaymentModal confirmPaymentModalOpen={confirmPaymentModalOpen} setConfirmPaymentModalOpen={setConfirmPaymentModalOpen} appointment={confirmPaymentAppointment} handleAppointmentToCompleted={handleAppointmentToCompleted} />
            }

            <ErrorModal type="error" errorModalOpen={errorModalOpen} setErrorModalOpen={setErrorModalOpen} />
        </>
    )
};