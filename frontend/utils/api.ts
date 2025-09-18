// utils/api.ts
import { BlogPost } from "../types/blogPost";
import axios from 'axios';

const accessToken=""
const axiosInstance=axios.create({
  baseURL:"https://t3pszf8w-8000.inc1.devtunnels.ms/api/"
})

const axiosInstance2=axios.create({
  baseURL:"https://t3pszf8w-8000.inc1.devtunnels.ms/api/",
  headers:{
    Authorization:`Bearer ${accessToken}`
  }
})



export async function fetchBlogPosts(){
    const response=await axiosInstance.get(`vlog/`)
    return response.data;
}
