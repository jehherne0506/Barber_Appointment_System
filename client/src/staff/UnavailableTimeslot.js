import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from "react-router-dom";

import checkAuthenticated from '../checkAuthenticated';
import fetchWithRateLimit from '../fetchWithRateLimit';

export default function UnavailableTimeslot({ unavailableTimeslotOpen, setUnavailableTimeslotOpen, setErrorModalOpen, setSuccessModalOpen, setSuccessModalType, setStaffData }){
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [modalPage, setModalPage] = useState(1);
    const [dateSelected, setDateSelected] = useState(new Date().toISOString().split("T")[0]);
    const [allTimeslot, setAllTimeslot] = useState([]);
    const [timeslotStart, setTimeslotStart] = useState(null);
    const [timeslotEnd, setTimeslotEnd] = useState(null);
    const [reason, setReason] = useState(null);

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
        async function fetchTimeslot(){
            const response = await fetchWithRateLimit("http://localhost:5000/staff/timeslot", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({dateSelected})
            });

            const result = await response.json();
            if(result.status === "success"){
                console.log(result.message);
                setAllTimeslot(result.message);
                if(result.message.length > 0){
                    setTimeslotStart({idx: 0, time: result.message[0].time.split("-")[0].trim()})
                }
            } else if(result.status === "fail" && result.message === "auth"){
                navigate("/auth/login", {state: {errorModalOpen: true}});
            } else{
                setErrorModalOpen(true);
                setUnavailableTimeslotOpen(false);
            }
        }

        fetchTimeslot();
    }, [dateSelected])

    async function handleAddUnavailableTimeslot(e){
        e.preventDefault();
        const response = await fetchWithRateLimit("http://localhost:5000/staff/unavailableTimeslot", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({dateSelected, startedAt: timeslotStart.time, endedAt: timeslotEnd.time, reason})
        });

        const result = await response.json();
        if(result.status === "success"){
            const newUnavailableTimeslot = result.message;
            const newSlot = {_id: newUnavailableTimeslot._id, date: new Date(newUnavailableTimeslot.date).toISOString().split("T")[0] + 'T00:00:00.000Z', startedAt: timeslotStart.time, endedAt: timeslotEnd.time, reason};
            setStaffData(prevStaffData => {return {...prevStaffData, allUnavailableTimeslot: [
                ...(prevStaffData.allUnavailableTimeslot || []),
                newSlot
            ]}})
            setModalPage(1);
            setDateSelected(new Date().toISOString().split("T")[0]);
            setTimeslotStart(null);
            setTimeslotEnd(null);
            setReason(null);
            setUnavailableTimeslotOpen(false);
            setSuccessModalOpen(true);
            setSuccessModalType("unavailableTimeslot");
        } else if(result.status === "fail" && result.message === "auth"){
            navigate("/auth/login", {state: {errorModalOpen: true}});
        } else{
            setErrorModalOpen(true);
            setUnavailableTimeslotOpen(false);
        }
    }

    return (
    <>
        {isAuthenticated && (
            <Dialog open={unavailableTimeslotOpen} onClose={() => {}} className="relative z-50">
                <DialogBackdrop
                    transition
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
                />

                <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <DialogPanel
                            transition
                            className="relative transform overflow-hidden rounded-lg bg-zinc-900 border border-yellow-600 text-left shadow-2xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg"
                        >
                            <button
                                onClick={() => { setUnavailableTimeslotOpen(false) }}
                                className="absolute top-4 right-4 text-gray-400 hover:text-yellow-600 transition-colors"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>

                            <form onSubmit={(e) => {e.preventDefault(); setModalPage(2);}}>
                                <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="sm:flex sm:items-start">

                                        <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-yellow-600/10 sm:mx-0 sm:size-10">
                                            <InformationCircleIcon aria-hidden="true" className="size-6 text-yellow-600" />
                                        </div>

                                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                            <DialogTitle as="h3" className="text-2xl font-dela text-white leading-6">
                                                Add Unavailable Timeslot
                                            </DialogTitle>
                                            
                                            <div className="mt-10">
                                                <div className="text-black font-robotoCondensed text-base flex flex-col gap-5">
                                                    <div className='flex items-center'>
                                                        <label className='text-white flex-1'>Date: </label>
                                                        <input className='p-2 rounded-lg flex-1' type='date' value={dateSelected} onChange={(e)=>{setDateSelected(e.target.value)}} required min={new Date().toISOString().split("T")[0]} />
                                                    </div>
                                                    <div className='flex items-center'>
                                                        <label className='text-white flex-1'>Start Time: </label>
                                                        <select className='p-2 rounded-lg flex-1' required value={timeslotStart?.time || ""} onChange={(e)=>{
                                                            const selectedIdx = allTimeslot.findIndex(timeslot => timeslot.time === e.target.value);
                                                            setTimeslotStart({idx: selectedIdx, time: e.target.value})
                                                        }}>
                                                            <option value="" disabled>Select Start Time</option>
                                                            {allTimeslot.length > 0 ? allTimeslot.map((timeslot, idx)=>(
                                                                <option key={idx} value={timeslot.time?.split("-")[0].trim()}>{timeslot.time?.split("-")[0].trim()}</option>
                                                            )) :
                                                                <option disabled>No Timeslot Available</option>}
                                                        </select>
                                                    </div>
                                                    <div className='flex items-center'>
                                                        <label className='text-white flex-1'>End Time: </label>
                                                        <select className='p-2 rounded-lg flex-1' required value={timeslotEnd?.time || ""} onChange={(e)=>{
                                                            const selectedIdx = allTimeslot.findIndex(timeslot => timeslot.time === e.target.value);
                                                            setTimeslotEnd({idx: selectedIdx, time: e.target.value})
                                                        }}>
                                                            <option value="" disabled>Select End Time</option>
                                                            {allTimeslot.length > 0 ? allTimeslot.map((timeslot, idx)=>(
                                                                idx >= timeslotStart?.idx && <option key={idx} value={timeslot.time?.split("-")[1].trim()}>{timeslot.time?.split("-")[1].trim()}</option>
                                                            )) : 
                                                                <option disabled>No Timeslot Available</option>}
                                                        </select>
                                                    </div>
                                                    <div className='flex items-center'>
                                                        <label className='text-white flex-1'>Whole Day Off</label>
                                                        <input className="w-5 h-5 flex-1 rounded-lg" type="checkbox" disabled={allTimeslot.length < 1} onChange={(e)=>{
                                                            if(e.target.checked){
                                                                setTimeslotStart({idx: 0, time: allTimeslot[0].time.split("-")[0].trim()}); 
                                                                setTimeslotEnd({idx: allTimeslot.length - 1, time: allTimeslot[allTimeslot.length - 1].time.split("-")[1].trim()})
                                                            } else{
                                                                setTimeslotStart("");
                                                                setTimeslotEnd("");
                                                            }
                                                        }}></input>
                                                    </div>
                                                    <div className='flex items-center'>
                                                        <label className='text-white flex-1'>Reason: </label>
                                                        <input className='p-2 flex-1 rounded-lg' value={reason} onChange={(e)=>{setReason(e.target.value)}} type='text' required minLength={2} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-black/20 px-4 py-4 sm:flex sm:flex-row-reverse sm:px-6 gap-3">
                                    <button
                                        type="submit"
                                        className="inline-flex w-full sm:w-auto justify-center rounded-md bg-yellow-600 px-6 py-2 text-sm font-bold font-geom text-black uppercase tracking-wide hover:bg-white hover:scale-105 transition-all duration-200"
                                    >
                                        Add
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setUnavailableTimeslotOpen(false)}
                                        className="mt-3 sm:mt-0 inline-flex w-full sm:w-auto justify-center rounded-md border border-zinc-700 bg-transparent px-6 py-2 text-sm font-bold font-geom text-gray-400 uppercase tracking-wide hover:text-white hover:border-gray-500 transition-all duration-200"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </DialogPanel>
                    </div>
                </div>
            </Dialog>
        )}

        {isAuthenticated && modalPage === 2 && (
            <Dialog open={unavailableTimeslotOpen} onClose={() => {}} className="relative z-50">
                <DialogBackdrop
                    transition
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
                />

                <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <DialogPanel
                            transition
                            className="relative transform overflow-hidden rounded-lg bg-zinc-900 border border-green-600/50 text-left shadow-2xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg"
                        >
                            <button
                                onClick={() => { setUnavailableTimeslotOpen(false) }}
                                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>

                            <form onSubmit={(e) => { e.preventDefault(); handleAddUnavailableTimeslot(e) }}>
                                <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="sm:flex sm:items-start">
                                        <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-green-900/30 sm:mx-0 sm:size-10">
                                            <InformationCircleIcon aria-hidden="true" className="size-6 text-green-500" />
                                        </div>

                                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                            <DialogTitle as="h3" className="text-xl font-bartle text-white leading-6">
                                                Confirm Unavailable Timeslot
                                            </DialogTitle>
                                            <div className="mt-2">
                                                <p className="text-gray-300 font-robotoCondensed">
                                                    <p>Date: {dateSelected}</p>
                                                    <p>Start Time: {timeslotStart.time}</p>
                                                    <p>End Time: {timeslotEnd.time}</p>
                                                    <p>Reason: {reason}</p>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-black/20 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                                    <button
                                        type="submit"
                                        className="inline-flex w-full sm:w-auto justify-center rounded-md bg-white px-6 py-2 text-sm font-bold font-geom text-black uppercase tracking-wide hover:bg-gray-200 transition-all duration-200"
                                    >
                                        Done
                                    </button>
                                </div>
                            </form>
                        </DialogPanel>
                    </div>
                </div>
            </Dialog>
        )}
    </>
)}