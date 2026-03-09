import { Puff } from "react-loader-spinner";

type StatusType = {
    status: string
}

export default function React_Spinners({status} : StatusType) {
    return(
        <div style={{ flexFlow: "column", padding: "3rem", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <Puff
            visible={true}
            height="80"
            width="80"
            color="#1A54B8"
            ariaLabel="puff-loading"
            wrapperStyle={{}}
            wrapperClass=""
            />
            <h3 className="blinkTwice" >{status}</h3>
        </div>
    );
}