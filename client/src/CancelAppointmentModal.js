import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import checkAuthenticated from './checkAuthenticated';

export default function CancelAppointmentModal({ cancelAppointmentModalOpen, setCancelAppointmentModalOpen, handleSubmit}){
    const [isAuthenticated, setIsAuthenticated] = useState(false);
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
            {isAuthenticated &&
                <Dialog open={cancelAppointmentModalOpen} onClose={() => setCancelAppointmentModalOpen(false)} className="relative z-50">
                    <DialogBackdrop
                        transition
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
                    />

                    <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                            
                            <DialogPanel
                                transition
                                className="relative transform overflow-hidden rounded-2xl bg-neutral-900 border border-neutral-700 text-left shadow-2xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg data-closed:sm:translate-y-0 data-closed:sm:scale-95"
                            >
                                <div className="absolute top-0 right-0 hidden pt-4 pr-4 sm:block">
                                    <button
                                        type="button"
                                        onClick={() => setCancelAppointmentModalOpen(false)}
                                        className="rounded-md bg-neutral-900 text-gray-400 hover:text-white focus:outline-none"
                                    >
                                        <span className="sr-only">Close</span>
                                        <XMarkIcon aria-hidden="true" className="h-6 w-6" />
                                    </button>
                                </div>

                                <form onSubmit={(e) => { setCancelAppointmentModalOpen(false); handleSubmit(e) }}>
                                    <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                        <div className="sm:flex sm:items-start">
                                            <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-900/30 sm:mx-0 sm:h-10 sm:w-10">
                                                <ExclamationTriangleIcon aria-hidden="true" className="h-6 w-6 text-red-500" />
                                            </div>

                                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                                <DialogTitle as="h3" className="text-xl font-geom font-semibold leading-6 text-white tracking-wide">
                                                    Cancel Appointment
                                                </DialogTitle>
                                                <div className="mt-2">
                                                    <p className="text-sm text-gray-400 font-robotoCondensed">
                                                        Are you sure you want to cancel this booking? This slot will be released immediately and <span className='text-red-400 font-bold'>this action cannot be undone.</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-neutral-800/50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-neutral-800">
                                        <button
                                            type="submit"
                                            className="inline-flex w-full justify-center rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto transition-colors"
                                        >
                                            Yes, Cancel It
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setCancelAppointmentModalOpen(false)}
                                            className="mt-3 inline-flex w-full justify-center rounded-lg bg-neutral-700 px-3 py-2 text-sm font-semibold text-gray-300 shadow-sm ring-1 ring-inset ring-neutral-600 hover:bg-neutral-600 sm:mt-0 sm:w-auto transition-colors"
                                        >
                                            Nevermind
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