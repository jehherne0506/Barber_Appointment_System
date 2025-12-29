import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import checkAuthenticated from './checkAuthenticated';
import fetchWithRateLimit from './fetchWithRateLimit';
import { MdEmail } from 'react-icons/md';
import API_URL from './config';

export default function ChangeEmailModal({ changeEmailModalOpen, setChangeEmailModalOpen, setProfileData, setSuccessModalOpen }){
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [duplicateEmailAddress, setDuplicateEmailAddress] = useState(false);
    const [email, setEmail] = useState("");
    const userRef = useRef(null);
    
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
    
        async function handleChangeEmail(e){
            e.preventDefault();
            const response = await fetchWithRateLimit(`${API_URL}/changeEmail`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({email: email})
            });
    
            const result = await response.json();
            if(result.status === "success"){ 
                if(setProfileData){
                    setProfileData(prevProfileData => ({...prevProfileData, email: email, emailVerified: false}));
                }
                setChangeEmailModalOpen(false);
                setSuccessModalOpen();
            } else if(result.status === "fail" && result.message === "auth"){
                navigate("/auth/login", {state: {errorModalOpen: true}});
            } else if(result.status === "fail" && result.message === "duplicate"){
                setDuplicateEmailAddress(true)
            } else{
                setChangeEmailModalOpen(false);
                navigate("/profile", {state: {errorModalOpen: true}})
            }
        };
    
        return(
            <>
                {isAuthenticated &&
                    <Dialog open={changeEmailModalOpen} onClose={() => { }} className="relative z-50">
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
                                            onClick={() => setChangeEmailModalOpen(false)}
                                            className="rounded-md bg-neutral-900 text-neutral-400 hover:text-white focus:outline-none"
                                        >
                                            <span className="sr-only">Close</span>
                                            <XMarkIcon aria-hidden="true" className="h-6 w-6" />
                                        </button>
                                    </div>
    
                                    <form onSubmit={(e) => handleChangeEmail(e)}>
                                        <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                            <div className="sm:flex sm:items-start">
    
                                                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-yellow-600/20 sm:mx-0 sm:h-10 sm:w-10">
                                                    <MdEmail aria-hidden="true" className="h-6 w-6 text-yellow-600" />
                                                </div>
    
                                                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                                    <DialogTitle as="h3" className="text-xl font-geom font-semibold leading-6 text-white tracking-wide">
                                                        Change Email
                                                    </DialogTitle>
                                                    
                                                    <div className="mt-2">
                                                        <p className="text-sm text-neutral-400 font-robotoCondensed mb-4">
                                                            We need your email address to send appointment notifications. Rest Assure, We won't send you other messages.
                                                        </p>
    
                                                        <div className="text-black">
                                                            <input className="p-2 bg-black/60 w-full rounded-lg border border-gray-600 text-white" value={email} onChange={(e)=>{setEmail(e.target.value)}} type='email' onFocus={()=>{setDuplicateEmailAddress(false)}}/>
                                                        </div>

                                                        {duplicateEmailAddress && (
                                                        <p className="mt-2 text-sm text-red-500 font-bold animate-pulse">
                                                            This email is already in used.
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
                                                disabled={!email || email === ""}
                                            >
                                                Save Email
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setChangeEmailModalOpen(false)}
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