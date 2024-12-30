import { toast } from "react-toastify";

export const handleError = (error: any) => {
    toast.warning("Error Occured." + error.status)
};