import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from "react-router-dom";

import checkAuthenticated from '../checkAuthenticated';

export default function ConfirmPaymentModal({ confirmPaymentModalOpen, setConfirmPaymentModalOpen, appointment, handleAppointmentToCompleted }){
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [modalPage, setModalPage] = useState(1);
    
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

    return (
    <>
        {isAuthenticated && modalPage === 1 && (
            <Dialog open={confirmPaymentModalOpen} onClose={() => {}} className="relative z-50">
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
                                onClick={() => { setConfirmPaymentModalOpen(false) }}
                                className="absolute top-4 right-4 text-gray-400 hover:text-yellow-600 transition-colors"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>

                            <form onSubmit={() => { setModalPage(2); handleAppointmentToCompleted(appointment); }}>
                                <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="sm:flex sm:items-start">

                                        <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-yellow-600/10 sm:mx-0 sm:size-10">
                                            <InformationCircleIcon aria-hidden="true" className="size-6 text-yellow-600" />
                                        </div>

                                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                            <DialogTitle as="h3" className="text-2xl font-dela text-white leading-6">
                                                Confirm Payment
                                            </DialogTitle>
                                            
                                            <div className="mt-4">
                                                <div className="text-gray-300 font-robotoCondensed text-base">
                                                    <p>Please confirm that customer</p>
                                                    <p className="text-xl text-yellow-500 font-bold my-1">
                                                        {appointment.customerId.username}
                                                    </p>
                                                    <p>is making a payment of</p>
                                                    <p className="text-2xl text-white font-geom font-bold mt-1">
                                                        RM {appointment.serviceId.price}
                                                    </p>
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
                                        Confirm Payment
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setConfirmPaymentModalOpen(false)}
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
            <Dialog open={confirmPaymentModalOpen} onClose={() => {}} className="relative z-50">
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
                                onClick={() => { setConfirmPaymentModalOpen(false) }}
                                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>

                            <form onSubmit={(e) => { e.preventDefault(); setConfirmPaymentModalOpen(false) }}>
                                <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="sm:flex sm:items-start">
                                        <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-green-900/30 sm:mx-0 sm:size-10">
                                            <InformationCircleIcon aria-hidden="true" className="size-6 text-green-500" />
                                        </div>

                                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                            <DialogTitle as="h3" className="text-xl font-bartle text-white leading-6">
                                                Payment Successful
                                            </DialogTitle>
                                            <div className="mt-2">
                                                <p className="text-gray-300 font-robotoCondensed">
                                                    The appointment status has been successfully updated to <span className="text-green-500 font-bold">PAID</span>.
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