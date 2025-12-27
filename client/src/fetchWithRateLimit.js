async function attemptRefresh(){
    const response = await fetch("https://barber-appointment-system-g7f5.onrender.com/auth/refresh", {
        method: "POST",
        credentials: "include"
    });
    const result = await response.json();
    return result.status === "success";
}

async function fetchWithRateLimit(url, options, retries=3){
    for(let i=0; i<retries; i++){
        const response = await fetch(url, options);
        if(response.status === 429){
            console.log("Rate Limit: " + i+1);
            await new Promise(res => setTimeout(res, 900 * 1000));
            continue
        };

        if(!response.ok){
            throw new Error("An Error occured in the Server"); // add a dialog
        }

        const responseClone = response.clone();
        const resultClone = await responseClone.json();

        if(resultClone.status === "fail" && resultClone.message === "expired"){
            console.log("retry refresh")
            const refreshSuccess = await attemptRefresh();
            if(refreshSuccess){
                return await fetchWithRateLimit(url, options);
            }
        }

        return response;
    } throw new Error("Rate Limit Exceeded"); // add a dialog
}

export default fetchWithRateLimit;