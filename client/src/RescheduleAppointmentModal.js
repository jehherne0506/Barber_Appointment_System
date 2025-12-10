import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import checkAuthenticated from './checkAuthenticated';

export default function RescheduleAppointmentModal({ rescheduleAppointmentModalOpen, setRescheduleAppointmentModalOpen, selectedAppointment, setSuccessModalOpen }){
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState({id: null, username: null, email: null, role: null, avatar: null});
    const [modalPage, setModalPage] = useState(1);
    const [dateSelected, setDateSelected] = useState(selectedAppointment?.date.split("T")[0]);
    const [allTimeslot, setAllTimeslot] = useState(null);
    const [timeslotSelectedIdx, setTimeslotSelectedIdx] = useState(null);

    const navigate = useNavigate();

    useEffect(()=>{
        async function checkAuth() {
            const { authenticated } = await checkAuthenticated(setIsAuthenticated, setUser);
            if (!authenticated) {
                navigate("/auth/login");
            }
        }

        checkAuth();

        const today = new Date();
        const appointmentDate = new Date(selectedAppointment.date);
        const diffDay = Math.floor((appointmentDate - today) / (1000 * 60 * 60 * 24));
        if(diffDay < 1){
            setModalPage(0);
        };
    }, [navigate]);

    useEffect(()=>{
            async function fetchStaffTimeslot(){
                const response = await fetch("http://localhost:5000/appointment/timeslot", {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({staffId: selectedAppointment?.staffId, date: dateSelected, serviceDuration: selectedAppointment?.serviceId.durationBlock})
                });
    
                const result = await response.json();
                if(result.status === "success"){
                    if(dateSelected === selectedAppointment.date.split("T")[0]){
                        result.message.push({time: selectedAppointment?.startedAt + " - " + selectedAppointment?.endedAt, queueMin: ""});
                        setTimeslotSelectedIdx(result.message.length - 1);
                    }
                    setAllTimeslot(result.message);
                } else if(result.status === "fail" && result.message === "auth"){
                    // auth modal
                    navigate("/auth/login");
                } else{
                    setRescheduleAppointmentModalOpen(false);
                    // error modal
                }
            };

            if(isAuthenticated){
                setAllTimeslot(null);
                fetchStaffTimeslot();
            }
        }, [dateSelected, isAuthenticated]);

        async function handleRescheduleAppointment(e){
            e.preventDefault();
            const response = await fetch("http://localhost:5000/appointment/rescheduleAppointment", {
                method: "PUT",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({id: selectedAppointment._id, date: dateSelected, timeslot: allTimeslot[timeslotSelectedIdx]})
            });

            const result = await response.json();
            if(result.status === "success"){ 
                setRescheduleAppointmentModalOpen(false)
                setSuccessModalOpen();
            } else if(result.status === "fail" && result.message === "auth"){
                // auth modal
                navigate("/auth/login");
            } else if(result.status === "fail" && result.message === "duplicate"){
                // duplicate modal
            } else{
                // error modal
            }
        };

    return(
        <>
            {isAuthenticated && modalPage === 0 &&
                <Dialog open={rescheduleAppointmentModalOpen} onClose={()=>{}} className="relative z-10">
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
                            onClick={()=>{setRescheduleAppointmentModalOpen(false)}}
                            className="absolute top-3 right-3 p-1 rounded-full hover:bg-blue-600 transition"
                        >
                            <XMarkIcon className="w-5 h-5 text-white" />
                        </button>

                        <form onSubmit={()=>{setRescheduleAppointmentModalOpen(false)}}>
                            <div className="bg-blue-500 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-white sm:mx-0 sm:size-10">
                                    <InformationCircleIcon aria-hidden="true" className="size-6 text-black" />
                                </div>
                                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                    <DialogTitle as="h3" className="text-base font-semibold text-white">
                                        Reschedule Appointment
                                    </DialogTitle>
                                    <div className="mt-2">
                                        <div>
                                            <p>You cannot reschedule this appointment as it is less than 24 hours away.</p>
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
                                I Understand
                                </button>
                            </div>
                        </form>
                        </DialogPanel>
                    </div>
                    </div>
                </Dialog>
            }

            {isAuthenticated && selectedAppointment && modalPage === 1 && timeslotSelectedIdx &&
                <Dialog open={rescheduleAppointmentModalOpen} onClose={()=>{}} className="relative z-10">
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
                            onClick={()=>{setRescheduleAppointmentModalOpen(false)}}
                            className="absolute top-3 right-3 p-1 rounded-full hover:bg-blue-600 transition"
                        >
                            <XMarkIcon className="w-5 h-5 text-white" />
                        </button>

                        <form onSubmit={(e)=>{e.preventDefault(); setModalPage(2)}}>
                            <div className="bg-blue-500 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-white sm:mx-0 sm:size-10">
                                    <InformationCircleIcon aria-hidden="true" className="size-6 text-black" />
                                </div>
                                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                    <DialogTitle as="h3" className="text-base font-semibold text-white">
                                        Reschedule Appointment
                                    </DialogTitle>
                                    <div className="mt-2">
                                        <div>
                                            <p>Service: {selectedAppointment.serviceId.name}</p>
                                        </div>
                                        <div>
                                            <p>Barber: {selectedAppointment.staffId.username}</p>
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
                                className={
                                    `mt-3 inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold sm:mt-0 sm:w-auto 
                                    ${dateSelected === selectedAppointment.date.split("T")[0] && allTimeslot[timeslotSelectedIdx].time === selectedAppointment.startedAt + " - " + selectedAppointment.endedAt 
                                    ? "bg-gray-400 cursor-not-allowed text-gray-700" 
                                    : "bg-blue-600 text-white hover:bg-blue-700"}`
                                }
                                disabled={dateSelected === selectedAppointment.date.split("T")[0] && allTimeslot[timeslotSelectedIdx].time === selectedAppointment.startedAt + " - " + selectedAppointment.endedAt}
                                >
                                Proceed to Appointment Details
                                </button>
                            </div>
                        </form>
                        </DialogPanel>
                    </div>
                    </div>
                </Dialog>
            }
            
            {isAuthenticated && selectedAppointment && modalPage === 2 && timeslotSelectedIdx &&
                <Dialog open={rescheduleAppointmentModalOpen} onClose={()=>{}} className="relative z-10">
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
                            onClick={()=>{setRescheduleAppointmentModalOpen(false)}}
                            className="absolute top-3 right-3 p-1 rounded-full hover:bg-blue-600 transition"
                        >
                            <XMarkIcon className="w-5 h-5 text-white" />
                        </button>

                        <form onSubmit={(e)=>{handleRescheduleAppointment(e)}}>
                            <div className="bg-blue-500 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-white sm:mx-0 sm:size-10">
                                    <InformationCircleIcon aria-hidden="true" className="size-6 text-black" />
                                </div>
                                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                    <DialogTitle as="h3" className="text-base font-semibold text-white">
                                        Reschedule Appointment
                                    </DialogTitle>
                                    <div className="mt-2">
                                        <div>
                                            <p>Your appointment for {selectedAppointment.serviceId.name} that is originially at {selectedAppointment.date.split("T")[0]} from {selectedAppointment.startedAt} to {selectedAppointment.endedAt} will be reschedule to {dateSelected} from {allTimeslot[timeslotSelectedIdx].time}</p>
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
                                Confirm Reschedule Appointment
                                </button>
                            </div>
                        </form>
                        </DialogPanel>
                    </div>
                    </div>
                </Dialog>
            }
        </>
    )
}