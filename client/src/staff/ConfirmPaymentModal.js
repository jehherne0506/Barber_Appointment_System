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

    return(
        <>
            {isAuthenticated && modalPage === 1 &&
                <Dialog open={confirmPaymentModalOpen} onClose={()=>{}} className="relative z-10">
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
                            onClick={()=>{setConfirmPaymentModalOpen(false)}}
                            className="absolute top-3 right-3 p-1 rounded-full hover:bg-blue-600 transition"
                        >
                            <XMarkIcon className="w-5 h-5 text-white" />
                        </button>

                        <form onSubmit={()=>{setModalPage(2); handleAppointmentToCompleted(appointment);}}>
                            <div className="bg-blue-500 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-white sm:mx-0 sm:size-10">
                                    <InformationCircleIcon aria-hidden="true" className="size-6 text-black" />
                                </div>
                                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                    <DialogTitle as="h3" className="text-base font-semibold text-white">
                                        Confirm Customer Payment
                                    </DialogTitle>
                                    <div className="mt-2">
                                        <div>
                                            <p>Have the customer ({appointment.customerId.username}) pay the payment (RM{appointment.serviceId.price})?</p>
                                        </div>
                                    </div>
                                </div>
                                </div>
                            </div>
                            <div className="bg-gray-700/25 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 space-y-2 sm:space-y-0 sm:space-x-reverse sm:space-x-3">
                                <button
                                    type="submit"
                                    data-autofocus
                                    className="inline-flex w-full sm:w-auto justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                                >
                                    Yes
                                </button>

                                <button
                                    onClick={() => setConfirmPaymentModalOpen(false)}
                                    className="inline-flex w-full sm:w-auto justify-center rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
                                >
                                    No
                                </button>
                            </div>
                        </form>
                        </DialogPanel>
                    </div>
                    </div>
                </Dialog>
            }

            {isAuthenticated && modalPage === 2 &&
                <Dialog open={confirmPaymentModalOpen} onClose={()=>{}} className="relative z-10">
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
                            onClick={()=>{setConfirmPaymentModalOpen(false)}}
                            className="absolute top-3 right-3 p-1 rounded-full hover:bg-blue-600 transition"
                        >
                            <XMarkIcon className="w-5 h-5 text-white" />
                        </button>

                        <form onSubmit={(e)=>{e.preventDefault(); setConfirmPaymentModalOpen(false)}}>
                            <div className="bg-blue-500 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-white sm:mx-0 sm:size-10">
                                    <InformationCircleIcon aria-hidden="true" className="size-6 text-black" />
                                </div>
                                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                    <DialogTitle as="h3" className="text-base font-semibold text-white">
                                        Confirm Customer Payment
                                    </DialogTitle>
                                    <div className="mt-2">
                                        <p>Successfully updated the appointment status to "PAID"</p>
                                    </div>
                                </div>
                                </div>
                            </div>
                            <div className="bg-gray-700/25 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                                <button
                                type='submit'
                                data-autofocus
                                className="inline-flex rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                                >
                                Ok
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