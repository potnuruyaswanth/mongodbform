import { useEffect } from "react";
import api from "../api/axios";

function Dashboard() {
  useEffect(() => {
    api.get("/dashboard")
      .then(res => console.log(res.data))
      .catch(err => console.log(err));
  }, []);

  return <h1>Dashboard</h1>;
}

export default Dashboard;
