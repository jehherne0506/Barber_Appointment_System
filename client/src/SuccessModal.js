import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react'
import { InformationCircleIcon } from '@heroicons/react/24/outline'

export default function SuccessModal({ type, successModalOpen, setSuccessModalOpen, email=null }){
  return (
    <div>
      <Dialog open={successModalOpen} onClose={()=>{}} className="relative z-10">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-900/50 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
        />

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full justify-center p-4 text-center items-center sm:p-0">
            <DialogPanel
              transition
              className="relative transform overflow-hidden rounded-lg bg-green-700 text-left shadow-xl outline -outline-offset-1 outline-white/10 transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg data-closed:sm:translate-y-0 data-closed:sm:scale-95"
            >
              <div className="bg-green-700 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex size-12 shrink-0 items-center justify-center rounded-full bg-white sm:mx-0 sm:size-10">
                    <InformationCircleIcon aria-hidden="true" className="size-6 text-black" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <DialogTitle as="h3" className="text-base font-semibold text-white">
                      {type === "emailVerification" && "Email Confirmation"}
                      {type === "loginSuccess" && "Login Success"}
                      {type === "makeAppointment" && "Appointment Made Successfully"}
                      {type === "rescheduleAppointment" && "Appointment Reschedule Successfully"}
                      {type === "cancelAppointment" && "Appointment Cancelled Successfully"}
                      {type === "addPhoneNumber" && "Phone Number added Successfully"}
                    </DialogTitle>
                    <div className="mt-2">
                      <p className="text-sm text-white">
                        {type === "emailVerification" && `We had sent an email to your email, ${email}. Please click on the "Verify" button to activate your account!`} 
                        {type === "loginSuccess" && "Welcome to ThinkTap — where your ideas spark conversations and every vote counts!"}
                        {type === "makeAppointment" && `We are delighted to confirm your recent booking. This confirmation signifies that your preferred time slot has been successfully reserved in our system, and all the specific appointment details have been sent to your email address, ${email}. `}
                        {type === "rescheduleAppointment" && `We are delighted to confirm your recent reschedule of appointment. This confirmation signifies that your preferred time slot has been successfully reserved in our system, and all the specific appointment details have been sent to your email address, ${email}. `}
                        {type === "cancelAppointment" && `Your appointment has been successfully cancelled. A confirmation email has been sent to your email address, ${email}, containing the details of the cancellation. If this cancellation was unintentional, you may book a new appointment at your convenience.`}
                        {type === "addPhoneNumber" && "Your phone number has been added successfully. Don't worry - it will only be used to send a reminder SMS one hour prior to your appointment.."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-700/25 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  onClick={()=>{setSuccessModalOpen(false)}}
                  data-autofocus
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white/10 px-3 py-2 text-sm font-semibold text-white inset-ring inset-ring-white/5 hover:bg-white/20 sm:mt-0 sm:w-auto"
                >
                  OK
                </button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </div>
  )
}