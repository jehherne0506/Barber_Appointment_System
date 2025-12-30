import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import toast, { Toaster } from 'react-hot-toast';
import { io } from 'socket.io-client';
import { PieChart, pieArcLabelClasses } from '@mui/x-charts/PieChart';
import { LineChart } from '@mui/x-charts/LineChart';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock } from '@fortawesome/free-solid-svg-icons';
import { CiCircleRemove } from "react-icons/ci";

import API_URL from '../config';
import checkAuthenticated from "../checkAuthenticated";
import fetchWithRateLimit from "../fetchWithRateLimit";
import ConfirmPaymentModal from "./ConfirmPaymentModal";
import ErrorModal from "../ErrorModal";
import UnavailableTimeslot from "./UnavailableTimeslot";
import SuccessModal from "../SuccessModal";
import logoTransparent from "../public/logoTransparent.png"
import completed from "../public/completed.png";
import pending from "../public/pending.png";
import dateJoinCalendar from "../public/dateJoinCalendar.png";
import ConfirmRemoveUnavailableSlotModal from "./ConfirmRemoveUnavailableSlotModal";

const dateToDay = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

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
    const [unavailableTimeslotOpen, setUnavailableTimeslotOpen] = useState(false);
    const [successModalOpen, setSuccessModalOpen] = useState(false);
    const [successModalType, setSuccessModalType] = useState("");
    const [staffData, setStaffData] = useState(null);
    const [confirmRemoveUnavailableSlotOpen, setConfirmRemoveUnavailableSlotOpen] = useState(false);
    const [unavailableTimeslotIdx, setUnavailableTimeslotIdx] = useState(null);

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
        const newSocket = io(API_URL, {
            withCredentials: true
        });

        setSocket(newSocket);
        
        newSocket.emit("join", "staff");

        newSocket.on("newAppointment", function(appointmentData){
            console.log(appointmentData);
            if(appointmentData.staffId === userRef.current.id && new Date(appointmentData.date.toDateString()) === new Date().toDateString()){
                setPendingAppointments((pendingAppointments)=>{
                    let allPendingAppointments = [
                        ...pendingAppointments,
                        appointmentData
                    ];
                    allPendingAppointments.sort((a,b)=> a.queueMin - b.queueMin);
                    toast.success('An appointment has arrived!');
                    return allPendingAppointments;
                });
            }
        });

        return ()=>{newSocket.disconnect()};
    }, []);

    useEffect(()=>{
        async function fetchStaffData(){
            const response = await fetchWithRateLimit(`${API_URL}/staff`, {
                method: "GET",
                credentials: "include"
            });

            const result = await response.json();
            if(result.status === "success"){
                setStaffData(result.message);
            } else if(result.status === "fail" && result.message === "auth"){
                navigate("/auth/login", {state: {errorModalOpen: true}});
            } else{
                setErrorModalOpen(true);
            }
        }
        
        fetchStaffData();
    }, [navigate])

    useEffect(()=>{
        if(pendingAppointments){
            pendingAppointments.forEach(appointment => {
                if(timeMin >= appointment.queueMin && !notifiedIds.includes(appointment._id)){
                    setNotifiedIds((allNotifiedIds)=>{
                        return [
                            ...allNotifiedIds,
                            appointment._id
                        ]
                    })
                    toast.success("An appointment can start to be service!");  
                };
            })
        };
    }, [timeMin, pendingAppointments, notifiedIds]);

    useEffect(()=>{
        async function fetchAppointmentsToday(){
            const response = await fetchWithRateLimit(`${API_URL}/staff/appointments`, {
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
    }, [isAuthenticated, navigate]);

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
            const response = await fetchWithRateLimit(`${API_URL}/staff/appointments/updateStatus`, {
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
            const response = await fetchWithRateLimit(`${API_URL}/staff/appointments/updateStatus`, {
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

    async function handleRemoveUnavailableTimeslot(e){
        e.preventDefault();
        const response = await fetchWithRateLimit(`${API_URL}/staff/removeUnavailableTimeslot`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({unavailableTimeslotId: staffData.allUnavailableTimeslot[unavailableTimeslotIdx]._id})
        });

        const result = await response.json();
        if(result.status === "success"){console.log(socket)
                setSuccessModalOpen(true);
                setSuccessModalType("unavailableTimeslotRemove")
                setStaffData(staffData => ({...staffData, allUnavailableTimeslot: staffData.allUnavailableTimeslot.filter((timeslot, idx) => idx !==  unavailableTimeslotIdx)}));
            } else if(result.status === "fail" && result.message === "auth"){
                navigate("/auth/login", {state: {errorModalOpen: true}});
            } else{
                setErrorModalOpen(true);
            }
    }

    return(
        <>
            {isAuthenticated && staffData &&
                <div>
                    <Toaster position="top-right" />
                    <div className="flex justify-between bg-gray-600 p-5 text-white">
                        <div className="flex items-center gap-2">
                            <img className="w-16 sm:w-24" src={logoTransparent} alt="Logo" />
                            <h1 className="font-geom text-sm lg:text-lg lg:font-bartle">Staff Dashboard</h1>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-2">
                            <img className="w-10 rounded-full" src={staffData.avatar} referrerPolicy="no-referrer" alt="Logo" />
                            <h1 className="font-geom text-xs lg:text-lg">{staffData.username}</h1>
                        </div>
                    </div>

                    <div>
                        <div className="flex flex-col lg:flex-row p-2 sm:p-5 gap-5">
                            <div className="w-full lg:w-2/3">
                                <div className="flex justify-between gap-10">
                                    <div className="flex flex-col sm:flex-row justify-around px-2 lg:px-10 items-center w-1/3 gap-4 text-left py-2 border border-gray-200 shadow-md rounded-lg hover:shadow-lg">
                                        <img src={completed} className="w-10" alt="Completed Icon" />
                                        <div className="flex flex-col">
                                            <h1 className="font-robotoCondensed text-sm lg:text-lg">COMPLETED</h1>
                                            <p className="text-gray-600 font-dela text-lg">{staffData.completedAppointmentCount}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row justify-around px-2 lg:px-10 items-center w-1/3 gap-4 text-left py-2 border border-gray-200 shadow-md rounded-lg hover:shadow-lg">
                                        <img src={pending} className="w-10" alt="Pending Icon" />
                                        <div className="flex flex-col">
                                            <h1 className="font-robotoCondensed text-sm lg:text-lg">PENDING</h1>
                                            <p className="text-gray-600 font-dela text-lg">{staffData.pendingAppointmentCount}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:flex-row justify-around px-2 lg:px-10 items-center w-1/3 gap-4 text-left py-2 border border-gray-200 shadow-md rounded-lg hover:shadow-lg">
                                        <img src={dateJoinCalendar} className="w-10" alt="Calendar Icon" />
                                        <div className="flex flex-col">
                                            <h1 className="font-robotoCondensed text-sm lg:text-lg">DAYS AS A STAFF</h1>
                                            <p className="text-gray-600 font-dela text-lg">{staffData.daysStaff}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="max-w-full flex flex-col lg:flex-row mt-5 justify-between px-2 lg:px-10 gap-4 text-left py-5 border border-gray-200 shadow-md rounded-lg hover:shadow-lg">
                                    <div className="text-center flex-1">
                                        {inProgressAppointments && <h1 className="font-bartle">In Progress ({inProgressAppointments.length})</h1>}
                                        {inProgressAppointments && inProgressAppointments.length > 0 &&
                                            inProgressAppointments.map(appointment => (
                                                <div className="px-2 lg:px-5 text-left flex flex-col gap-2 py-5 m-5 border border-gray-200 shadow-md rounded-lg hover:shadow-lg">
                                                    <div className="flex gap-2 justify-end items-center">
                                                        <h2 className="font-robotoCondensed">{appointment.customerId.username}</h2>
                                                        <img className="w-8 rounded-full" referrerPolicy="no-referrer" src={appointment.customerId.avatar} alt="Customer Avatar" />
                                                    </div>
                                                    
                                                    <div>
                                                        <p>Hair Type: {appointment.customerId.styleProfile?.hairType || "-"}</p>
                                                        <p>Notes to You: {appointment.customerId.styleProfile?.barberNotes || "-"}</p>
                                                    </div>

                                                    <div>
                                                        <p>Service: {appointment.serviceId.name}</p>
                                                        <p>Payment Status: {appointment.paymentStatus}</p>
                                                    </div>

                                                    <div className="flex items-center gap-1">
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
                                                        onClick={()=>{appointment.paymentStatus === "PAID" ? handleAppointmentToCompleted(appointment) : setConfirmPaymentModalOpen(true); setConfirmPaymentAppointment(appointment);}}>Mark as Completed</button>
                                                    </div>
                                                </div>
                                            ))
                                        }
                                        {inProgressAppointments && inProgressAppointments.length === 0 &&
                                            <h1 className="font-geom">No Appointment in Progress</h1>
                                        }
                                    </div>

                                    <div className="text-center flex-1">
                                        {pendingAppointments && <h1 className="font-bartle">Scheduled ({pendingAppointments.length})</h1>}
                                        {pendingAppointments && pendingAppointments.length > 0 &&
                                            pendingAppointments.map(appointment => (
                                                <div className="px-2 lg:px-5 text-left flex flex-col gap-2 py-5 m-5 border border-gray-200 shadow-md rounded-lg hover:shadow-lg">
                                                    <div className="flex gap-2 justify-end items-center">
                                                        <h2 className="font-robotoCondensed">{appointment.customerId.username}</h2>
                                                        <img className="w-8 rounded-full" referrerPolicy="no-referrer" src={appointment.customerId.avatar} alt="Customer Avatar" />
                                                    </div>

                                                    <div>
                                                        <p>Hair Type: {appointment.customerId.styleProfile?.hairType || "-"}</p>
                                                        <p>Notes to You: {appointment.customerId.styleProfile?.barberNotes || "-"}</p>
                                                    </div>

                                                    <div>
                                                        <p>Service: {appointment.serviceId.name}</p>
                                                    </div>

                                                    <div className="flex items-center gap-1">
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
                                            <h1 className="font-geom">No Scheduled Appointment</h1>
                                        }
                                    </div>

                                    <div className="text-center flex-1">
                                        {completedAppointments && <h1 className="font-bartle">Completed ({completedAppointments.length})</h1>}
                                        {completedAppointments && completedAppointments.length > 0 &&
                                            completedAppointments.map(appointment => (
                                                <div className="px-2 lg:px-5 text-left flex flex-col gap-2 py-5 m-5 border border-gray-200 shadow-md rounded-lg hover:shadow-lg">
                                                    <div className="flex gap-2 justify-end items-center">
                                                        <h2>{appointment.customerId.username}</h2>
                                                        <img className="w-8 rounded-full" referrerPolicy="no-referrer" src={appointment.customerId.avatar} alt="Customer Avatar" />
                                                    </div>

                                                    <div>
                                                        <p>Hair Type: {appointment.customerId.styleProfile?.hairType || "-"}</p>
                                                        <p>Notes to You: {appointment.customerId.styleProfile?.barberNotes || "-"}</p>
                                                    </div>

                                                    <div>
                                                        <p>Service: {appointment.serviceId.name}</p>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <FontAwesomeIcon icon={faClock} />
                                                        <p>{appointment.startedAt} - {appointment.endedAt}</p>
                                                    </div>
                                                    <div>
                                                        <button className="px-4 py-2 rounded font-semibold transition bg-gray-400 text-gray-700 cursor-not-allowed" disabled>Completed</button>
                                                    </div>
                                                </div>
                                            ))
                                        }
                                        {completedAppointments && completedAppointments.length === 0 &&
                                            <h1>No Completed Appointment</h1>
                                        }
                                    </div>
                                </div>

                                <div className="max-w-full flex flex-col mt-5 justify-between px-2 lg:px-10 gap-4 text-left py-5 border border-gray-200 shadow-md rounded-lg hover:shadow-lg"> 
                                    <div className="flex flex-col sm:flex-row gap-5 justify-between">
                                        <h1 className="font-bartle">Unavailable Timeslot</h1>
                                        <button className="bg-yellow-600 text-black px-4 py-2 rounded-lg font-geom uppercase hover:bg-yellow-500 transition-colors shadow-md" onClick={()=>{setUnavailableTimeslotOpen(true)}}>Add Unavailable Slot</button>
                                    </div>
                                    <div className="flex flex-row gap-5 flex-wrap">
                                        {staffData.allUnavailableTimeslot.length > 0 ? staffData.allUnavailableTimeslot.map((unavailableTimeslot, idx)=>(
                                            <div key={idx} className="relative border border-gray-200 shadow-md rounded-lg hover:shadow-lg p-4">
                                                <h1>Reason: {unavailableTimeslot.reason}</h1>
                                                <h1>Date: {unavailableTimeslot.date?.split("T")[0]}</h1>
                                                <p>Time: {unavailableTimeslot.startedAt} - {unavailableTimeslot.endedAt}</p>
                                                <CiCircleRemove className="absolute top-2 right-2 text-xl text-red-500 cursor-pointer" onClick={()=>{setConfirmRemoveUnavailableSlotOpen(true); setUnavailableTimeslotIdx(idx)}} />
                                            </div>
                                        )):
                                            <h1 className="font-geom">No Unavailable Timeslot</h1>
                                        }
                                    </div>
                                </div>

                                <div className="max-w-full flex flex-col mt-5 justify-between px-2 lg:px-10 gap-4 text-left py-5 border border-gray-200 shadow-md rounded-lg hover:shadow-lg"> 
                                    <div className="flex flex-col sm:flex-row gap-5 justify-between">
                                        <h1 className="font-bartle">Upcoming Appointments</h1>
                                    </div>
                                    <div className="flex flex-row gap-5 flex-wrap">
                                        {staffData.allUpomingAppointments.length > 0 ? staffData.allUpomingAppointments.map((appointment, idx)=>(
                                            <div key={idx} className="flex flex-col gap-2 border border-gray-200 shadow-md rounded-lg hover:shadow-lg p-4">
                                                <p>Service: {appointment.serviceId.name}</p>
                                                <p>Date: {appointment.date.split("T")[0]}</p>
                                                <p>Time: {appointment.startedAt} - {appointment.endedAt}</p>
                                                <p>Customer: {appointment.customerId.username}</p>
                                            </div>
                                        )):
                                            <h1 className="font-geom">No Upcoming Appointments</h1>
                                        }
                                    </div>
                                </div>
                            </div>

                            <div className="w-full lg:w-1/3 flex flex-col gap-10">
                                <div className="px-2 lg:px-1 gap-4 text-left py-4 border border-gray-200 shadow-md rounded-lg hover:shadow-lg">
                                    <h3 className="font-geom text-lg font-bold text-gray-700 mb-2 pl-2 border-l-4 border-yellow-600">
                                        Appointments Comparison
                                    </h3>
                                    <PieChart
                                        height={250}
                                        series={[
                                            {
                                            arcLabel: (item) => {
                                                const percent = staffData.totalNumberAppointments > 0 ? (item.value / staffData.totalNumberAppointments) * 100 : 0;
                                                return `${percent.toFixed(0)}%`
                                            },
                                            arcLabelMinAngle: 35,
                                            arcLabelRadius: '50%',
                                            data: [
                                                    { id: 0, value: staffData.totalNumberAppointments - staffData.staffNumberAppointments, label: "Other Staff's Appointment", color: '#E5E7EB' },
                                                    { id: 1, value: staffData.staffNumberAppointments, label: 'My Appointment', color: '#EAB308' },
                                                ],
                                            highlightScope: { fade: 'global', highlight: 'item' },
                                            faded: { innerRadius: 60, additionalRadius: -100, color: 'gray' },
                                            },
                                        ]}
                                        sx={{
                                            [`& .${pieArcLabelClasses.root}`]: {
                                            fontWeight: 'bold',
                                            },
                                        }}
                                    />
                                </div>

                                <div className="px-2 lg:px-1 gap-4 text-left py-4 border border-gray-200 shadow-md rounded-lg hover:shadow-lg">
                                    <h3 className="font-geom text-lg font-bold text-gray-700 mb-2 pl-2 border-l-4 border-yellow-600">
                                        Customer Familiarity
                                    </h3>
                                    <PieChart
                                        height={250}
                                        series={[
                                            {
                                            arcLabel: (item) => {
                                                const percent = staffData.totalNumberCustomer > 0 ? (item.value / staffData.totalNumberCustomer) * 100 : 0;
                                                return `${percent.toFixed(0)}%`
                                            },
                                            arcLabelMinAngle: 20,
                                            arcLabelRadius: '50%',
                                            data: [
                                                    { id: 0, value: staffData.totalNumberCustomer - staffData.staffNumberCustomer, label: "Unfamiliar Customer", color: '#E5E7EB' },
                                                    { id: 1, value: staffData.staffNumberCustomer, label: 'Familiar Customer', color: '#CC5500' },
                                                ],
                                            highlightScope: { fade: 'global', highlight: 'item' },
                                            faded: { innerRadius: 80, color: 'gray' },
                                            },
                                        ]}
                                        sx={{
                                            [`& .${pieArcLabelClasses.root}`]: {
                                            fontWeight: 'bold',
                                            },
                                        }}
                                    />
                                </div>

                                <div className="px-2 lg:px-1 gap-4 text-left py-4 border border-gray-200 shadow-md rounded-lg hover:shadow-lg">
                                    <h3 className="font-geom text-lg font-bold text-gray-700 mb-2 pl-2 border-l-4 border-yellow-600">
                                        Weekly Appointments
                                    </h3>
                                    <LineChart
                                    children={
                                        <defs>
                                            <linearGradient id="goldArea" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#EAB308" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="#EAB308" stopOpacity={0.05} />
                                            </linearGradient>
                                        </defs>
                                    }
                                        xAxis={[{ label: "Day of the Week", scaleType: "band", data: staffData.week.map(day => dateToDay[new Date(day).getDay()] + ` (${new Date(day).getMonth() + 1}/${new Date(day).getDate()})`) }]}
                                        series={[
                                            {
                                            data: staffData.appointmentWeekStats,
                                            color: '#EAB308', 
                                            area: true,
                                            showMark: false,
                                            label: "Number of Appointments"
                                            },
                                        ]}
                                        height={250}
                                        sx={{
                                            '& .MuiAreaElement-root': {
                                                fill: 'url(#goldArea)',
                                            },
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            }

            {confirmPaymentModalOpen && confirmPaymentAppointment &&
                <ConfirmPaymentModal confirmPaymentModalOpen={confirmPaymentModalOpen} setConfirmPaymentModalOpen={setConfirmPaymentModalOpen} appointment={confirmPaymentAppointment} handleAppointmentToCompleted={handleAppointmentToCompleted} />
            }

            {staffData &&
                <UnavailableTimeslot unavailableTimeslotOpen={unavailableTimeslotOpen} setUnavailableTimeslotOpen={setUnavailableTimeslotOpen} setErrorModalOpen={setErrorModalOpen} setSuccessModalOpen={setSuccessModalOpen} setSuccessModalType={setSuccessModalType} setStaffData={setStaffData} />
            }

            {staffData && unavailableTimeslotIdx !== null &&
                <ConfirmRemoveUnavailableSlotModal confirmRemoveUnavailableSlotOpen={confirmRemoveUnavailableSlotOpen} setConfirmRemoveUnavailableSlotOpen={setConfirmRemoveUnavailableSlotOpen} unavailableSlot={staffData.allUnavailableTimeslot[unavailableTimeslotIdx]} handleRemoveUnavailableTimeslot={handleRemoveUnavailableTimeslot} />
            }

            <ErrorModal type="error" errorModalOpen={errorModalOpen} setErrorModalOpen={setErrorModalOpen} />
            <SuccessModal type={successModalType} successModalOpen={successModalOpen} setSuccessModalOpen={setSuccessModalOpen} />
        </>
    )
};