import { Ban, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Blocked = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FFF4E8] flex items-center justify-center px-6">
      <div className="max-w-lg w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-red-100 text-red-500 p-4 rounded-full">
            <Ban size={36} />
          </div>
        </div>

        <h1 className="text-4xl font-bold text-slate-900 mb-3">
          Account Blocked
        </h1>

        <p className="text-slate-600 mb-8 leading-relaxed">
          This account is currently blocked. If you believe this is a mistake,
          please contact support or try again later.
        </p>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-6 py-3 rounded-full border border-slate-300 text-slate-700 hover:bg-slate-100 transition"
          >
            <ArrowLeft size={18} />
            Go Back
          </button>

          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 rounded-full bg-orange-500 text-white font-medium hover:bg-orange-600 transition"
          >
            Home
          </button>
        </div>

        <p className="text-xs text-slate-400 mt-10">
          Error code: 423 • Account temporarily unavailable
        </p>
      </div>
    </div>
  );
};

export default Blocked;
