// import  SignupComponent  from '../../components/auth-components/SignUp';
import { LoginComponent } from "../../components/auth-components/Login";
import type { ISignUp, UserRoleType } from "../../types/auth.types";
import { AuthService } from "../../service/auth.service";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { Spinner } from "../../components/templates/Spinner";
import { useAuth } from "../../context/auth.context";
import { toast } from "sonner";
import { ApiError } from "@/utility/apiError.util";
import { UserRole } from "@/types/auth.types";

const LoginPage: React.FC = () => {
  const [isLoading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const { login } = useAuth();
  const handleAuthSubmit = async (data: ISignUp) => {
    try {
      setLoading(true);
      const user = await login(data);

      const roleDashboard =
        user.role === UserRole.ADMIN
          ? "/admin/dashboard"
          : user.role === UserRole.MENTOR
            ? "/mentor/dashboard"
            : "/learner/dashboard";

      const requestedPath = (location.state as { from?: { pathname?: string } } | null)
        ?.from?.pathname;
      const redirectPath = requestedPath || roleDashboard;

      navigate(redirectPath, { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async (role: UserRoleType) => {
    try {
      await AuthService.googleAuth(role);
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="">
      <LoginComponent
        onSubmit={(data) => handleAuthSubmit(data)}
        onGoogleAuth={handleGoogleAuth}
      />

      {isLoading && <Spinner fullScreen size="large" variant="theme" />}
    </div>
  );
};

export default LoginPage;
