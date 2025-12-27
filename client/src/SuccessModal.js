import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

export default function SuccessModal({ type, successModalOpen, setSuccessModalOpen, email=null }){
  return (
        <Dialog open={successModalOpen} onClose={() => setSuccessModalOpen(false)} className="relative z-50">
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
                                onClick={() => setSuccessModalOpen(false)}
                                className="rounded-md bg-neutral-900 text-neutral-400 hover:text-white focus:outline-none"
                            >
                                <span className="sr-only">Close</span>
                                <XMarkIcon aria-hidden="true" className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                            <div className="sm:flex sm:items-start">
                                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-green-900/30 sm:mx-0 sm:h-10 sm:w-10">
                                    <CheckCircleIcon aria-hidden="true" className="h-6 w-6 text-green-500" />
                                </div>

                                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                    <DialogTitle as="h3" className="text-xl font-geom font-semibold leading-6 text-white tracking-wide">
                                        {type === "emailVerification" && "Email Verification sent to your gmail."}
                                        {type === "emailVerified" && "Email Successfully Verified."}
                                        {type === "login" && "Welcome Back"}
                                        {type === "makeAppointment" && "Booking Confirmed"}
                                        {type === "rescheduleAppointment" && "Reschedule Successful"}
                                        {type === "cancelAppointment" && "Cancellation Confirmed"}
                                        {type === "addPhoneNumber" && "Phone Number Saved"}
                                        {type === "feedback" && "Thank You"}
                                        {type === "styleProfile" && "Style Profile Updated"}
                                        {type === "changeEmail" && "Email Changed Successfully"}
                                        {type === "changeEmailSuccess" && "Email Changed Successfully"}
                                        {type === "unavailableTimeslot" && "Timeslot Removed Successfully"}
                                        {type === "unavailableTimeslotRemove" && "Unavailable Timeslot Removed Successfully"}
                                    </DialogTitle>
                                    
                                    <div className="mt-2">
                                        <p className="text-sm text-neutral-400 font-robotoCondensed leading-relaxed">
                                            {type === "emailVerification" && (
                                                <>We have sent a verification link to <span className="text-white font-bold">{email}</span>. Please check your inbox to activate your account.</>
                                            )}
                                            {type === "emailVerified" && "Your email is verified. You may login now."}
                                            {type === "login" && "You have successfully logged in. Welcome to The Fade Hub."}
                                            {type === "makeAppointment" && (
                                                <>Your appointment has been successfully booked. A confirmation email has been sent to <span className="text-white">{email}</span>.</>
                                            )}
                                            {type === "rescheduleAppointment" && (
                                                <>Your appointment has been updated to the new time slot. Details have been sent to <span className="text-white">{email}</span>.</>
                                            )}
                                            {type === "cancelAppointment" && (
                                                <>Your appointment has been cancelled. A confirmation of this cancellation has been sent to <span className="text-white">{email}</span>.</>
                                            )}
                                            {type === "addPhoneNumber" && "Your phone number has been updated. You will now receive SMS reminders for your appointments."}
                                            {type === "feedback" && "We appreciate your feedback! Your comments have been submitted to our team."}
                                            {type === "styleProfile" && "Your Style Profile is successfully updated! Your barber will review it before your future appointment."}
                                            {type === "changeEmail" && "Your Email is changed successfully! Please click on the link sent to your new gmail to verify it."}
                                            {type === "changeEmailSuccess" && "Your Email is changed successfully! Please login again."}
                                            {type === "unavailableTimeslot" && "Your timeslot has been removed. Customer can no longer book appointment within that time frame."}
                                            {type === "unavailableTimeslotRemove" && "Your unavailable timeslot has been removed. Customer can now book appointment within that time frame."}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-neutral-800/50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 border-t border-neutral-800">
                            <button
                                type="button"
                                onClick={() => setSuccessModalOpen(false)}
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