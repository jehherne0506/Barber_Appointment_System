import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useEffect, useState, useRef } from 'react';
import { useNavigate } from "react-router-dom";

import checkAuthenticated from './checkAuthenticated';

export default function ConfirmRedeemVoucherModal({ confirmRedeemVoucherModalOpen, setConfirmRedeemVoucherModalOpen, voucherRedeem, handleRedeemVoucher }){
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

    return (
    <>
        {isAuthenticated && (
            <Dialog open={confirmRedeemVoucherModalOpen} onClose={() => {}} className="relative z-50">
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
                                onClick={() => { setConfirmRedeemVoucherModalOpen(false) }}
                                className="absolute top-4 right-4 text-gray-400 hover:text-yellow-600 transition-colors"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>

                            <form onSubmit={(e) => { setConfirmRedeemVoucherModalOpen(false); handleRedeemVoucher(e, voucherRedeem) }}>
                                <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="sm:flex sm:items-start">

                                        <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-yellow-600/10 sm:mx-0 sm:size-10">
                                            <InformationCircleIcon aria-hidden="true" className="size-6 text-yellow-600" />
                                        </div>

                                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                            <DialogTitle as="h3" className="text-2xl font-dela text-white leading-6">
                                                Confirm Redeem Voucher
                                            </DialogTitle>
                                            
                                            <div className="mt-4">
                                                <div className="text-gray-300 font-robotoCondensed text-base">
                                                    <p>Please confirm that you would like to redeem</p>
                                                    <p className="text-xl text-yellow-500 font-bold my-1">
                                                        {voucherRedeem.name}
                                                    </p>
                                                    <p>with</p>
                                                    <p className="text-2xl text-white font-geom font-bold mt-1">
                                                        {voucherRedeem.pointsRequired} Points
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
                                        Confirm Redeem
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setConfirmRedeemVoucherModalOpen(false)}
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
    </>
)}