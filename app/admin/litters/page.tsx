import { redirect } from "next/navigation";
import { AdminAuthorizationError, requireAdmin } from "@/lib/admin";
import AdminLitters from "@/components/AdminLitters";
export default async function Page(){try{await requireAdmin();}catch(e){if(e instanceof AdminAuthorizationError)redirect(e.status===401?"/sign-in":"/dashboard");throw e;}return <AdminLitters/>;}
