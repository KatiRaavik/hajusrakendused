import { Result } from "antd";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import useLocalStorage from "use-local-storage";

export default function Logout() {
  const [accessToken, setAccessToken] = useLocalStorage("accessToken", "");
  const navigate = useNavigate();

  useEffect(() => {
    setAccessToken(response.access_token);
    navigate("/login");
  }, [navigate]);

  return null;
}