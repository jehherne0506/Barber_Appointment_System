import toast from 'react-hot-toast';
import { GrPrevious } from "react-icons/gr";
import { FaStripe } from "react-icons/fa";
import { FaFileSignature } from "react-icons/fa";
import { BsCash } from "react-icons/bs";
import { FaDice } from "react-icons/fa";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendar, faCalendarXmark } from "@fortawesome/free-solid-svg-icons";

export default function AppointmentStep4({ modalPage, setModalPage, handleSubmit, service, staff, total, staffIdSelected, dateSelected, timeslotSelected, type="make" }){
    return(
        <form onSubmit={(e)=>{e.nativeEvent.submitter.value === "stripe" ? toast.promise(handleSubmit(e), {loading: "Redirecting to Payment Gateway...", success: "Redirect Successfully", error: "Redirect Failed. Please Try Again."}) : handleSubmit(e);}}>
            <div className='py-10 px-5 sm:px-20'>
                <div className='text-white text-center mb-10'>
                    <div className='flex gap-3'>
                        <FaFileSignature className="h-10 w-10 text-yellow-600" />
                        <h1 className='text-3xl font-geom mb-10'>{type === "cancel" ? "Cancel Booking" : "Finalise Booking Details"}</h1>
                    </div>

                    <div className='bg-neutral-800 p-8 rounded-2xl border border-neutral-700 shadow-2xl text-left'>
                        <div className='flex justify-between items-center mb-6 pb-6 border-b border-neutral-700/50'>
                            <div>
                                <p className='text-neutral-400 text-sm uppercase tracking-wider mb-1'>Service</p>
                                <p className='text-xl font-bold text-white'>{service}</p>
                            </div>
                            <p className='text-xl font-bold text-yellow-600'>RM{total}</p>
                        </div>

                        <div className='space-y-5'>
                            <div className='flex justify-between items-center'>
                                <p className='text-neutral-400'>Barber</p>
                                <div className='flex items-center gap-2'>
                                    <p className='text-neutral-400'>{staffIdSelected === "any" ? staff : staff.username}</p>
                                    {staffIdSelected === "any" ? 
                                    <FaDice className="w-6 h-6" />:
                                    <img className="w-6 h-6 rounded-full bg-neutral-600" src={staff.avatar} ></img> }
                                </div>
                            </div>

                            {/* Date */}
                            <div className='flex justify-between items-center'>
                                <p className='text-neutral-400'>Date</p>
                                <p className='font-medium'>{dateSelected?.toDateString()}</p>
                            </div>

                            {/* Time */}
                            <div className='flex justify-between items-center'>
                                <p className='text-neutral-400'>Time</p>
                                <span className='px-3 py-1 bg-yellow-600/20 text-yellow-500 rounded text-sm font-bold border border-yellow-600/30'>
                                    {timeslotSelected?.time}
                                </span>
                            </div>

                        </div>

                        <div className='mt-8 pt-6 border-t border-dashed border-neutral-600 flex justify-between items-end'>
                            <p className='text-neutral-400 mb-1'>Total</p>
                            <p className='text-3xl font-bold text-white'>RM{total}</p>
                        </div>
                    </div>
                </div>
                <div className='flex flex-col lg:flex-row gap-5 lg:gap-0 justify-between'>
                    <button className="flex gap-2 justify-center items-center py-4 px-2 sm:px-8 sm:py-4 rounded-lg cursor-pointer bg-yellow-600 text-black disabled:text-white disabled:bg-neutral-700 disabled:opacity-50" disabled={modalPage===1 || type !== "make"} onClick={()=>{setModalPage(prevPage => prevPage - 1)}}>
                        <GrPrevious />
                        <span className='text-sm lg:text-lg'>Previous</span>
                    </button>

                    
                        {type === "make" &&
                            <div className='flex flex-col lg:flex-row gap-5'>
                                <button
                                    type="submit"
                                    name='paymentMethod'
                                    value="store"
                                    data-autofocus
                                    className="flex gap-2 justify-center items-center py-4 px-2 sm:px-8 sm:py-4 rounded-lg cursor-pointer bg-yellow-600 text-black disabled:text-white disabled:bg-neutral-700 disabled:opacity-50 text-sm lg:text-lg" disabled={modalPage===1}
                                >
                                    <BsCash />
                                    Pay in Store
                                </button>
                                <button
                                    type="submit"
                                    name='paymentMethod'
                                    value="stripe"
                                    data-autofocus
                                    className="flex gap-2 justify-center items-center py-4 px-2 sm:px-8 sm:py-4 rounded-lg cursor-pointer bg-yellow-600 text-black disabled:bg-neutral-700 disabled:opacity-50 text-sm lg:text-lg" disabled={modalPage===1}

                                >
                                    <FaStripe />
                                    Pay Now with Stripe
                                </button>
                            </div>
                        }
                        {
                            type === "reschedule" &&
                            <div className='flex gap-5'>
                                <button
                                    type="submit"
                                    name='paymentMethod'
                                    value="paid"
                                    data-autofocus
                                    className={`flex gap-2 justify-center items-center py-4 px-2 sm:px-8 sm:py-4 rounded-lg cursor-pointer ${modalPage===1 ? "bg-neutral-700 opacity-50" : "bg-yellow-600 text-black"}`} disabled={modalPage===1}

                                >
                                    <FontAwesomeIcon icon={faCalendar} className="text-xl" />
                                    Reschedule
                                </button>
                            </div>
                        }
                        {
                            type === "cancel" &&
                            <div className='flex gap-5'>
                                <button
                                    type="submit"
                                    name='paymentMethod'
                                    value="paid"
                                    data-autofocus
                                    className={`flex gap-2 justify-center items-center py-4 px-2 sm:px-8 sm:py-4 rounded-lg cursor-pointer ${modalPage===1 ? "bg-neutral-700 opacity-50" : "bg-yellow-600 text-black"}`} disabled={modalPage===1}

                                >
                                    <FontAwesomeIcon icon={faCalendarXmark} className="text-xl" />
                                    Cancel
                                </button>
                            </div>
                        }
                </div>
            </div>
        </form>
    )
}