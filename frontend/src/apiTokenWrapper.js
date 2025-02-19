import axios from "axios";


const api = axios.create({
    baseURL: "http://localhost:5173/",
})


api.interceptors.request.use(config => {
    const accessToken = sessionStorage.getItem("token")

    config.headers.Authorization = `Bearer ${accessToken}`;
    console.log(config)
    return config;
    
})

export default api;