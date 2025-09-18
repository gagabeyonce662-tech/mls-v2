// utils/api.ts
import { BlogPost } from "../types/blogPost";
import axios from 'axios';

const accessToken=""
const axiosInstance=axios.create({
  baseURL:"http://localhost:8000/api/"
})

const axiosInstance2=axios.create({
  baseURL:"http://localhost:8000/api/",
  headers:{
    Authorization:`Bearer ${accessToken}`
  }
})



export async function fetchBlogPosts(){
    const response=await axiosInstance.get('vlog/')
    return response.data;
}
