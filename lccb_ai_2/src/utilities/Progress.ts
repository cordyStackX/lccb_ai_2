import NProgress from "nprogress";
import "nprogress/nprogress.css";

NProgress.configure({ showSpinner: false });

export default function Progress(status: boolean) { 
    if (status) {
        NProgress.start();
    } else {
        NProgress.done();
    }
  return null; // important
    
 }