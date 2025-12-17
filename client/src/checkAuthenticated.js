import fetchWithRateLimit from "./fetchWithRateLimit";

export default async function checkAuthenticated(setIsAuthenticated, userRef){
    async function refreshToken(){
        console.log("refresh")
        const response = await fetchWithRateLimit("http://localhost:5000/auth/refresh",  {
            method: 'POST',
            credentials: "include"
        });

        const result = await response.json();

        if(result.status !== "success"){
            setIsAuthenticated(false);
            return false;
        };
        return true;
    }

    async function verifyToken(){
        const response = await fetchWithRateLimit("http://localhost:5000/auth/verify", {
            method: 'GET',
            credentials: "include"
        });

        const result = await response.json(); console.log(result)
        if(result.status === "success"){console.log("successVerify")
            setIsAuthenticated(true);
            const {id, username, email, avatar, role} = result.message;
            userRef.current = {id, username, email, avatar, role};
            return ({authenticated: true, id: id});
        } else if(result.status === "fail" && result.message === "expired"){
            console.log("again")
            const refreshSuccess = await refreshToken();
            if(refreshSuccess){console.log("successRefresh")
                return await verifyToken();
            };
            return ({authenticated: false, id: null}); 
        } else{console.log("fail")
            setIsAuthenticated(false);
            return ({authenticated: false, id: null});
        }
    }

    return await verifyToken();
}