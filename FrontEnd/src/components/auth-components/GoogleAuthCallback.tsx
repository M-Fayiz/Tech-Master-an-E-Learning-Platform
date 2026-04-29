import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Spinner } from "../templates/Spinner";
import { useAuth } from "../../context/auth.context";
import { AuthStatus } from "@/types/auth.types";

const GoogleAuthCallback = () => {
  const navigate = useNavigate();
  const { user, status, checkAuth } = useAuth();
  const hasStartedRef = useRef(false);
  const [callbackResolved, setCallbackResolved] = useState(false);

  useEffect(() => {
    if (hasStartedRef.current) {
      return;
    }

    hasStartedRef.current = true;

    (async () => {
      await checkAuth();
      setCallbackResolved(true);
    })();
  }, [checkAuth, navigate]);

  useEffect(() => {
    if (!user?.role) {
      if (callbackResolved && status !== AuthStatus.CHECKING) {
        navigate("/auth/login", { replace: true });
      }
      return;
    }

    navigate("/", { replace: true });
  }, [callbackResolved, navigate, status, user]);

  return <Spinner fullScreen size="large" variant="theme" />;
};

export default GoogleAuthCallback;
