import { ScissorsIcon } from '@heroicons/react/24/solid'
import { GrNext } from "react-icons/gr";
import { GrPrevious } from "react-icons/gr";

export default function AppointmentStep1({ modalPage, setModalPage, allServices, serviceIdSelected, setServiceIdSelected }){
    return(
        <div className='py-10 px-5 sm:px-20'>
            <div className='text-white text-left'>
                <div className='flex gap-3'>
                    <ScissorsIcon className="h-10 w-10 text-yellow-600" />
                    <h1 className='text-3xl font-geom mb-10'>Select Service</h1>
                </div>
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10'>
                    {allServices.map((service, idx)=>(
                        <div key={idx} className={`bg-white/5 flex flex-col p-5 items-start w-full gap-5 rounded-lg hover:scale-105 transition-all duration-300 ease-in-out cursor-pointer ${serviceIdSelected === service._id ? "border-2 border-yellow-600 shadow-[5px_15px_20px_-10px_rgba(202,138,4,0.7)]" : null}`} onClick={()=>{setServiceIdSelected(service._id)}}>
                            <h1 className='font-geom text-2xl'>{service.name}</h1>
                            <div className='font-robotoCondensed flex justify-between w-full'>
                                <p className='font-hegarty text-yellow-600'>RM {service.price}</p>
                                <p>{service.durationMin} min</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className='flex justify-between font-geom'>
                    <button className={`flex gap-2 justify-center items-center p-4 sm:px-8 rounded-lg cursor-pointer ${modalPage===1 ? "bg-neutral-700 opacity-50" : "bg-yellow-600 text-black"}`} disabled={modalPage===1} onClick={()=>{setModalPage(prevPage => prevPage - 1)}}>
                        <GrPrevious />
                        <span>Previous</span>
                    </button>
                    <button className={`flex gap-2 justify-center items-center p-4 sm:px-8 rounded-lg cursor-pointer ${modalPage===5 || serviceIdSelected === null ? "bg-neutral-700 opacity-50" : "bg-yellow-600 text-black"}`} disabled={modalPage===5 || serviceIdSelected === null} onClick={()=>{setModalPage(prevPage => prevPage + 1)}}>
                        <span>Next</span>
                        <GrNext />
                    </button>
                </div>
            </div>
        </div>
    )
}