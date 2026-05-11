import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  AuthStatus,
  type AuthStatusType,
  type IDecodedUserType,
  type ILogin,
  type ISignUp,
} from "../types/auth.types";
import { AuthService } from "../service/auth.service";
import { HttpStatusCode } from "@/constants/statusCode";

interface User extends IDecodedUserType {}

interface AuthContextProps {
  user: User | null;
  status: AuthStatusType;
  login: (data: ILogin) => Promise<User>;
  signup: (
    data: ISignUp,
  ) => Promise<{ status: number; message: string; email: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  login: async () => {
    throw new Error("Login not completed");
  },
  logout: async () => {},
  signup: async () => {
    throw new Error("Signup not completed");
  },
  status: AuthStatus.CHECKING,
  checkAuth: async () => {},
});

interface AuthContext {
  children: ReactNode;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatusType>(AuthStatus.CHECKING);
  const authRequestIdRef = useRef(0);
  const isMountedRef = useRef(true);
  const pendingBootstrapRef = useRef<Promise<void> | null>(null);

  const bootstrapAuth = async () => {
    if (pendingBootstrapRef.current) {
      return pendingBootstrapRef.current;
    }

    const requestId = ++authRequestIdRef.current;

    let bootstrapPromise: Promise<void> | null = null;

    bootstrapPromise = (async () => {
      try {
        const user = await AuthService.restoreSession();

        if (!isMountedRef.current || requestId !== authRequestIdRef.current) {
          return;
        }

        setUser(user);
        setStatus(AuthStatus.AUTHENTICATED);
      } catch (error: any) {
        if (!isMountedRef.current || requestId !== authRequestIdRef.current) {
          return;
        }

        if (error?.status === HttpStatusCode.UNAUTHORIZED) {
          setUser(null);
          setStatus(AuthStatus.GUEST);
        } else if (error?.status === HttpStatusCode.LOCKED) {
          setUser(null);
          setStatus(AuthStatus.BLOCKED);
        } else {
          setUser(null);
          setStatus(AuthStatus.GUEST);
        }
      } finally {
        if (pendingBootstrapRef.current === bootstrapPromise) {
          pendingBootstrapRef.current = null;
        }
      }
    })();

    pendingBootstrapRef.current = bootstrapPromise;
    return bootstrapPromise;
  };

  useEffect(() => {
    isMountedRef.current = true;
    bootstrapAuth();
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const handleForceLogout = () => {
      AuthService.clearClientAuth();
      setUser(null);
      setStatus(AuthStatus.GUEST);
    };

    const handleForceBlock = () => {
      AuthService.clearClientAuth();
      setUser(null);
      setStatus(AuthStatus.BLOCKED);
    };

    window.addEventListener("force-logout", handleForceLogout);
    window.addEventListener("force-block", handleForceBlock);
    return () => {
      window.removeEventListener("force-logout", handleForceLogout);
      window.removeEventListener("force-block", handleForceBlock);
    };
  }, []);

  const login = async (data: ILogin) => {
    authRequestIdRef.current += 1;
    setStatus(AuthStatus.CHECKING);

    try {
      const response = await AuthService.login(data);
      const user = response.user;
      setUser(user);
      setStatus(AuthStatus.AUTHENTICATED);
      return user;
    } catch (error) {
      setUser(null);
      setStatus(AuthStatus.GUEST);
      throw error;
    }
  };

  const signup = async (data: ISignUp) => {
    return await AuthService.signUp(data);
  };

  const logout = async () => {
    authRequestIdRef.current += 1;
    await AuthService.logOut();
    setUser(null);
    setStatus(AuthStatus.GUEST);
  };

  return (
    <AuthContext.Provider
      value={{ user, status, login, signup, logout, checkAuth: bootstrapAuth }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("something went wrong");
  }
  return context;
};
