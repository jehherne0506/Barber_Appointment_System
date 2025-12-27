import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { XMarkIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import 'react-phone-number-input/style.css'
import PhoneInput from 'react-phone-number-input'
import { isValidPhoneNumber } from 'react-phone-number-input'

import checkAuthenticated from './checkAuthenticated';
import fetchWithRateLimit from './fetchWithRateLimit';

export default function AddPhoneNumberModal({ phoneNumberModalOpen, setPhoneNumberModalOpen, setHavePhoneNumber, setSuccessModalOpen, setProfileData=null }){
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const userRef = useRef(null);

    const [phoneNumber, setPhoneNumber] = useState("");
    const [validPhoneNumber, setValidPhoneNumber] = useState(true);

    const navigate = useNavigate();

    useEffect(()=>{
        async function checkAuth() {
            const { authenticated } = await checkAuthenticated(setIsAuthenticated, userRef);
            if (!authenticated) {
                navigate("/auth/login");
            }
        }

        checkAuth();
    }, [navigate]);

    async function handleAddPhoneNumber(e){
        e.preventDefault();

        if(!isValidPhoneNumber(phoneNumber)){
            setValidPhoneNumber(false);
            setPhoneNumber(null);
            return;
        }

        const response = await fetchWithRateLimit("http://localhost:5000/addPhoneNumber", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({phoneNumber: phoneNumber})
        });

        const result = await response.json();
        if(result.status === "success"){ 
            if(setProfileData){
                setProfileData(prevProfileData => ({...prevProfileData, phoneNumber: phoneNumber}));
            }
            setHavePhoneNumber(true);
            setPhoneNumberModalOpen(false);
            setSuccessModalOpen();
        } else if(result.status === "fail" && result.message === "auth"){
            navigate("/auth/login", {state: {errorModalOpen: true}});
        } else{
            setPhoneNumberModalOpen(false);
            if(setProfileData){
                navigate("/profile", {state: {errorModalOpen: true, errorModalType: "error"}})
            } else{
                navigate("/appointment", {state: {errorModalOpen: true, errorModalType: "error"}})
            }
        }
    };

    return(
        <>
            {isAuthenticated &&
                <Dialog open={phoneNumberModalOpen} onClose={() => { }} className="relative z-50">
                    <DialogBackdrop
                        transition
                        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
                    />

                    <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
                            <DialogPanel
                                transition
                                className="relative transform overflow-hidden rounded-2xl bg-neutral-900 border border-neutral-700 text-left shadow-2xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-md data-closed:sm:translate-y-0 data-closed:sm:scale-95"
                            >
                                <div className="absolute top-0 right-0 hidden pt-4 pr-4 sm:block">
                                    <button
                                        type="button"
                                        onClick={() => setPhoneNumberModalOpen(false)}
                                        className="rounded-md bg-neutral-900 text-neutral-400 hover:text-white focus:outline-none"
                                    >
                                        <span className="sr-only">Close</span>
                                        <XMarkIcon aria-hidden="true" className="h-6 w-6" />
                                    </button>
                                </div>

                                <form onSubmit={(e) => handleAddPhoneNumber(e)}>
                                    <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                        <div className="sm:flex sm:items-start">

                                            <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-yellow-600/20 sm:mx-0 sm:h-10 sm:w-10">
                                                <PhoneIcon aria-hidden="true" className="h-6 w-6 text-yellow-600" />
                                            </div>

                                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                                <DialogTitle as="h3" className="text-xl font-geom font-semibold leading-6 text-white tracking-wide">
                                                    {setProfileData ? "Change" : "Add"} Phone Number
                                                </DialogTitle>
                                                
                                                <div className="mt-2">
                                                    <p className="text-sm text-neutral-400 font-robotoCondensed mb-4">
                                                        We need your phone number to send appointment reminders. Rest Assure, We won't send you other messages.
                                                    </p>

                                                    <div className="text-black">
                                                        <PhoneInput
                                                            placeholder="Enter phone number"
                                                            value={phoneNumber}
                                                            onChange={setPhoneNumber}
                                                            className="bg-neutral-800 text-white border border-neutral-600 rounded-lg p-3 w-full focus:outline-none focus:border-yellow-600 transition-colors [&_.PhoneInputInput]:bg-transparent [&_.PhoneInputInput]:text-white [&_.PhoneInputInput]:placeholder-neutral-500 [&_.PhoneInputCountrySelect]:text-black"
                                                        />
                                                    </div>

                                                    {!validPhoneNumber && (
                                                        <p className="mt-2 text-sm text-red-500 font-bold animate-pulse">
                                                            Please enter a valid phone number.
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-neutral-800/50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-neutral-800">
                                        <button
                                            type="submit"
                                            className="inline-flex w-full justify-center rounded-lg bg-yellow-600 px-3 py-2 text-sm font-bold text-black shadow-sm hover:bg-yellow-500 sm:ml-3 sm:w-auto transition-colors disabled:bg-neutral-800 disabled:text-neutral-500 disabled:cursor-not-allowed"
                                            disabled={!phoneNumber || phoneNumber === ""}
                                        >
                                            Save Number
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPhoneNumberModalOpen(false)}
                                            className="mt-3 inline-flex w-full justify-center rounded-lg bg-neutral-700 px-3 py-2 text-sm font-semibold text-gray-300 shadow-sm hover:bg-neutral-600 sm:mt-0 sm:w-auto transition-colors"
                                        >
                                            Cancel
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