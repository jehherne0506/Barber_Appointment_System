import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

export default function ErrorModal({ errorModalOpen, setErrorModalOpen, type }){
    return (
        <Dialog open={errorModalOpen} onClose={() => setErrorModalOpen(false)} className="relative z-50">
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
                                onClick={() => setErrorModalOpen(false)}
                                className="rounded-md bg-neutral-900 text-neutral-400 hover:text-white focus:outline-none"
                            >
                                <span className="sr-only">Close</span>
                                <XMarkIcon aria-hidden="true" className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                            <div className="sm:flex sm:items-start">
                                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-900/30 sm:mx-0 sm:h-10 sm:w-10">
                                    <CheckCircleIcon aria-hidden="true" className="h-6 w-6 text-red-500" />
                                </div>

                                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                    <DialogTitle as="h3" className="text-xl font-geom font-semibold leading-6 text-white tracking-wide">
                                       {type === "auth" && "You are Not Authenticated."}
                                       {type === "error" && "An Error has Occured."}
                                       {type === "emailNotVerified" && "Email not Verified."}
                                       {type === "notMatch" && "Incorrect Credentials."}
                                       {type === "duplicate" && "Duplicate Booking Occured."}
                                       {type === "emailRegistered" && "Email is Registered"}
                                       {type === "emailVerifiedFail" && "Email Fail to Verify"}
                                    </DialogTitle>
                                    
                                    <div className="mt-2">
                                        <p className="text-sm text-neutral-400 font-robotoCondensed leading-relaxed">
                                            {type === "auth" && "Please login again."}
                                            {type === "error" && "Please try again as our server face an unexpected Error."}
                                            {type === "emailNotVerified" && "This email is still not verified. Please click on the link sent to your gmail."}
                                            {type === "notMatch" && "Your credentials doesn't match. Please try again."}
                                            {type === "duplicate" && "Your timeslot had been booked. Please try again with another timeslot."}
                                            {type === "emailRegistered" && "Please login with this gmail instead."}
                                            {type === "emailVerifiedFail" && "We have fail to verify your gmail. Please Register again."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-neutral-800/50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-neutral-800">
                            <button
                                type="button"
                                onClick={() => setErrorModalOpen(false)}
                                className="inline-flex w-full justify-center rounded-lg bg-yellow-600 px-3 py-2 text-sm font-bold text-black shadow-sm hover:bg-yellow-500 sm:ml-3 sm:w-auto transition-colors"
                            >
                                OK
                            </button>
                        </div>
                    </DialogPanel>
                </div>
            </div>
        </Dialog>
    )
}