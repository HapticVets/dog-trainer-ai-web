import { redirect } from "next/navigation";
import { AdminAuthorizationError, requireAdmin } from "@/lib/admin";
import AdminLitterCaseFile from "@/components/AdminLitterCaseFile";
export default async function Page({params}:{params:Promise<{id:string}>}){try{await requireAdmin();}catch(e){if(e instanceof AdminAuthorizationError)redirect(e.status===401?"/sign-in":"/dashboard");throw e;}const{id}=await params;return <AdminLitterCaseFile litterId={id}/>;}
