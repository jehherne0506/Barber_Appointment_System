import { GrNext } from "react-icons/gr";
import { GrPrevious } from "react-icons/gr";
import { FaUser } from "react-icons/fa";
import { FaDice } from "react-icons/fa";
import check from "../public/check.png";

export default function AppointmentStep2({ modalPage, setModalPage, allServices, serviceIdSelected, staffIdSelected, setStaffIdSelected }){
    return(
        <div className='py-10 px-5 sm:px-20'>
            <div className='text-white text-left'>
                <div className='flex gap-3'>
                    <FaUser className="h-10 w-10 text-yellow-600" />
                    <h1 className='text-3xl font-geom mb-10'>Choose Your Barber</h1>
                </div>
                <div className='flex flex-wrap justify-center gap-20 mb-10'>
                    {allServices?.find(service => service._id === serviceIdSelected)?.staff.map((staff, idx)=>(
                        <div key={idx} onClick={()=>{setStaffIdSelected(staff._id)}} className='relative cursor-pointer flex flex-col gap-4 justify-center items-center'>
                            <img className={`rounded-full w-32 aspect-square border-4 hover:scale-105 transition-all duration-300 ease-in-out ${staffIdSelected === staff._id ? "border-yellow-600 scale-110" : "border-gray-600"}`} src={staff.avatar} alt='Staff Avatar' />
                            <img className={`absolute w-[40px] bottom-8 right-3 p-2 rounded-full bg-yellow-600 ${staffIdSelected !== staff._id ? "hidden" : null}`} src={check} alt='Check Icon' />
                            <h1 className={`font-geom text-lg ${staffIdSelected === staff._id ? "text-yellow-600" : null}`}>{staff.username}</h1>
                        </div>
                    ))}
                    <div onClick={()=>{setStaffIdSelected("any")}} className='relative cursor-pointer flex flex-col gap-4 justify-center items-center'>
                        <div className={`rounded-full w-32 h-32 flex justify-center items-center bg-neutral-800 border-4 transition-all duration-300 ease-in-out group-hover:scale-105 
                            ${staffIdSelected === "any" ? "border-yellow-600 scale-110 text-yellow-600" : "border-gray-600 text-gray-400"}`}>
                            <FaDice className="text-6xl" /> 
                        </div>
                        <img className={`absolute w-[40px] bottom-8 right-3 p-2 rounded-full bg-yellow-600 ${staffIdSelected !== "any" ? "hidden" : null}`} src={check} alt='Check Icon' />
                        <h1 className={`font-geom text-lg ${staffIdSelected === "any"? "text-yellow-600" : null}`}>Any Staff</h1>
                    </div>
                </div>
                <div className='flex justify-between font-geom'>
                    <button className={`flex gap-2 justify-center items-center p-4 sm:px-8 rounded-lg cursor-pointer ${modalPage===1 ? "bg-neutral-700 opacity-50" : "bg-yellow-600 text-black"}`} disabled={modalPage===1} onClick={()=>{setModalPage(prevPage => prevPage - 1)}}>
                        <GrPrevious />
                        <span>Previous</span>
                    </button>
                    <button className={`flex gap-2 justify-center items-center p-4 sm:px-8 rounded-lg cursor-pointer ${modalPage===5 || staffIdSelected === null ? "bg-neutral-700 opacity-50" : "bg-yellow-600 text-black"}`} disabled={modalPage===5 || staffIdSelected === null} onClick={()=>{setModalPage(prevPage => prevPage + 1)}}>
                        <span>Next</span>
                        <GrNext />
                    </button>
                </div>
            </div>
        </div>
    )
}