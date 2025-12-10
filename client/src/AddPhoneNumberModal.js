import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import 'react-phone-number-input/style.css'
import PhoneInput from 'react-phone-number-input'
import { isValidPhoneNumber } from 'react-phone-number-input'

import checkAuthenticated from './checkAuthenticated';
import fetchWithRateLimit from './fetchWithRateLimit';

export default function AddPhoneNumberModal({ phoneNumberModalOpen, setPhoneNumberModalOpen, setHavePhoneNumber, setSuccessModalOpen }){
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState({id: null, username: null, email: null, role: null, avatar: null});

    const [phoneNumber, setPhoneNumber] = useState("");
    const [validPhoneNumber, setValidPhoneNumber] = useState(true);

    const navigate = useNavigate();

    useEffect(()=>{
        async function checkAuth() {
            const { authenticated } = await checkAuthenticated(setIsAuthenticated, setUser);
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
            setHavePhoneNumber(true);
            setPhoneNumberModalOpen(false);
            setSuccessModalOpen();
        } else if(result.status === "fail" && result.message === "auth"){
            // auth modal
            navigate("/auth/login");
        } else{
            setPhoneNumberModalOpen(false);
            // error modal
        }
    };

    return(
        <>
            {isAuthenticated &&
                <Dialog open={phoneNumberModalOpen} onClose={()=>{}} className="relative z-10">
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
                            onClick={()=>{setPhoneNumberModalOpen(false)}}
                            className="absolute top-3 right-3 p-1 rounded-full hover:bg-blue-600 transition"
                        >
                            <XMarkIcon className="w-5 h-5 text-white" />
                        </button>

                        <form onSubmit={(e)=>{handleAddPhoneNumber(e)}}>
                            <div className="bg-blue-500 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-white sm:mx-0 sm:size-10">
                                    <InformationCircleIcon aria-hidden="true" className="size-6 text-black" />
                                </div>
                                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                    <DialogTitle as="h3" className="text-base font-semibold text-white">
                                        Add Phone Number
                                    </DialogTitle>
                                    <div className="mt-2">
                                        <div>
                                            <p>To make an appointment, you have to add your phone number.</p>
                                            <PhoneInput
                                            placeholder="Enter phone number"
                                            value={phoneNumber}
                                            onChange={setPhoneNumber}/>
                                            <p>{!validPhoneNumber  && "The phone number you enter is not valid, please enter a new one."}</p>
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
                                Submit
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