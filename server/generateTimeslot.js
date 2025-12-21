



function generateTimeslot(date, appointments, unavailableTimeslots){
    let allTimeslots = generateOriginalTimeslot(date); 

    for(const appointment of appointments){
        allTimeslots = removeTimeslot(allTimeslots, appointment.startedAt, appointment.endedAt); 
    }

    for(const unavailableTimeslot of unavailableTimeslots){ 
        allTimeslots = removeTimeslot(allTimeslots, unavailableTimeslot.startedAt, unavailableTimeslot.endedAt);
    }

    return allTimeslots;
};

function generateOriginalTimeslot(date){

    const todayDate = new Date().toISOString().split("T")[0];

    let WORK_START = 9 * 60;
    const WORK_END = 17 * 60;
    const INTERVAL = 15;

    if(date.split("T")[0] === todayDate){console.log('same date')
        const HOUR = new Date().getHours();
        const MIN = new Date().getMinutes();
        let time = HOUR * 60 + MIN;
        if (time >= WORK_END) {
            WORK_START = WORK_END;
        } else {
            const nextSlot = Math.ceil(time / INTERVAL) * INTERVAL;
            WORK_START = Math.max(WORK_START, nextSlot);
        }
    }
    const allTimeslots = [];
    let currentTime = WORK_START;

    while(currentTime <= WORK_END){
        if(currentTime >= 720 && currentTime <= 780){
            currentTime += INTERVAL;
            allTimeslots.push({time: "", queueMin: ""});
            continue
        }
        const firstTime = getHourMin(currentTime);
        currentTime += INTERVAL;
        const secTime = getHourMin(currentTime);
        allTimeslots.push({time: `${firstTime} - ${secTime}`, queueMin: currentTime - INTERVAL});
    };
    return allTimeslots;
}

function removeTimeslot(allTimeslots, startedAt, endedAt){
    let idxStart = allTimeslots.findIndex(timeslot => {
        const startTime = timeslot.time !== "" ? timeslot.time.split("-")[0].trim() : "";
        return startTime === startedAt;
    });

    let idxEnd = allTimeslots.findIndex(timeslot => {
        const endTime = timeslot.time != "" ? timeslot.time.split("-")[1].trim() : "";
        return endTime === endedAt;
    })

    if(idxStart !== -1 && idxEnd !== -1){
        for(let i=idxStart; i<=idxEnd; i++){
            allTimeslots[i] = {time: "", queueMin: ""};
        }
    }
    
    return allTimeslots;
}

function getHourMin(currentTime){
    const currentHour = String(Math.floor((currentTime / 60))).padStart(2, "0");
    const currentMin = String((currentTime - (currentHour * 60))).padStart(2, "0");
    return `${currentHour}:${currentMin}`;
};

module.exports = generateTimeslot;