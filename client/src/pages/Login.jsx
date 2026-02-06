import api from "../api/axios";

function Login() {
  const login = async () => {
    await api.post("/login", {
      username: "test",
      password: "1234"
    });
    window.location.href = "/dashboard";
  };

  return <button onClick={login}>Login</button>;
}

export default Login;
