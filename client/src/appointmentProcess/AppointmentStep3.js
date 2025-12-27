import { GrNext } from "react-icons/gr";
import { GrPrevious } from "react-icons/gr";
import { FaClock } from "react-icons/fa";
import { FaCalendarDays } from "react-icons/fa6";

export default function AppointmentStep3({ modalPage, setModalPage, dateSelected, setDateSelected, allTimeslot, timeslotSelected, setTimeslotSelected, type="make" }){
    let monthCalendar = [];
    const dateAdd = new Date();
    const dayArray = ["Sun", "Mon", "Tue", "Wed", "Thur", "Fri", "Sat"];
    const monthArray = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    for(let i=0; i<31; i++){
        const dayName = dayArray[dateAdd.getDay()];
        const day = dateAdd.getDate();
        const month = monthArray[dateAdd.getMonth()];
        monthCalendar.push({dayName, day, month, date:new Date(dateAdd)});
        dateAdd.setDate(dateAdd.getDate() + 1);
    }

    return(
        <div>
            <div className='py-10 px-5 sm:px-20'>
                <div className='text-white text-left'>
                    <div className='flex gap-3'>
                        <FaCalendarDays className="h-10 w-10 text-yellow-600" />
                        <h1 className='text-3xl font-geom mb-10'>Select Date</h1>
                    </div>
                    <div className='flex gap-5 mb-10 overflow-scroll custom-scrollbar p-4'>
                        {monthCalendar.map((date, idx) => (
                            <div key={idx} className={`flex flex-col justify-center items-center gap-1 cursor-pointer font-robotoCondensed px-8 py-2 rounded-lg border-2 border-transparent hover:scale-105 hover:border-yellow-600 transition-all duration-200 ease-in-out ${date.date.toDateString() === dateSelected?.toDateString() ? "bg-yellow-600" : "bg-neutral-700"}`} onClick={()=>{setDateSelected(date.date)}}>
                                <p className='text-lg'>{date.dayName}</p>
                                <p className='text-xl font-bold'>{date.day}</p>
                                <p>{date.month}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {dateSelected && allTimeslot &&
                    <div className='py-10 px-5 sm:px-20'>
                    <div className='text-white text-left'>
                        <div className='flex gap-3'>
                            <FaClock className="h-10 w-10 text-yellow-600" />
                            <h1 className='text-3xl font-geom mb-10'>Select Time</h1>
                        </div>
                        <div className='flex flex-wrap justify-center items-center gap-5 mb-10 p-4'>
                            {allTimeslot.map((timeslot, idx) => (
                                <div key={idx} className={`cursor-pointer font-robotoCondensed px-8 py-4 rounded-lg border-2 border-transparent hover:scale-105 hover:border-yellow-600 transition-all duration-200 ease-in-out ${timeslot === timeslotSelected ? "bg-yellow-600" : "bg-neutral-700"}`} onClick={()=>{setTimeslotSelected(timeslot)}}>
                                    <p className='text-lg'>{timeslot.time}</p>
                                </div>
                            ))}
                            {allTimeslot.length === 0 && 
                                <div className="font-robotoCondensed px-8 py-4 rounded-lg border-2  bg-neutral-700">
                                        <p className='text-lg'>No Timeslot Available</p>
                                </div>
                            }
                        </div>
                    </div>
                </div>
            }
            <div className='flex justify-between font-geom py-10 px-5 sm:px-20'>
                <button className="flex gap-2 justify-center items-center p-4 sm:px-8 rounded-lg cursor-pointer bg-yellow-600 text-black disabled:text-white disabled:bg-neutral-700 disabled:opacity-50" disabled={modalPage===1 || type !== "make"} onClick={()=>{setModalPage(prevPage => prevPage - 1)}}>
                    <GrPrevious />
                    <span>Previous</span>
                </button>
                <button className="flex gap-2 justify-center items-center p-4 sm:px-8 rounded-lg cursor-pointer bg-yellow-600 text-black disabled:text-white disabled:bg-neutral-700 disabled:opacity-50" disabled={modalPage===5 || dateSelected === null} onClick={()=>{setModalPage(prevPage => prevPage + 1)}}>
                    <span>Finalise</span>
                    <GrNext />
                </button>
            </div>
        </div>
    )
}