import React from "react";

interface BannerProps {
  title: string;
  description: string;
  imageUrl: string;
}

import { OrderService } from "@/service/order.service";
import { useAuth } from "@/context/auth.context";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router";
import { Badge } from "@/components/ui/shadcn-io/ThemeBadge";
import { StarRating } from "@/pages/course-page/Rating";
import { Users2 } from "lucide-react";
import { ApiError } from "@/utility/apiError.util";

interface BannerProps {
  courseId: string;
  title: string;
  description: string;
  imageUrl: string;
  price?: number;
  enrolledId: string | null;
  level: string;
  rating?: number;
  totalStudent?: number;
  category?: string;
  onEnrolledPage: boolean;
}

const Banner: React.FC<BannerProps> = ({
  title,
  description,
  imageUrl,
  courseId,
  level,
  enrolledId,
  price,
  rating,
  totalStudent,
  onEnrolledPage,
  category,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate()
  const handlePaymentPage = async () => {
    try {
      if(!user){
        navigate('/auth/login')
      }
      const result = await OrderService.createPayment(courseId, user!.id);

      if (result) {
        window.location.href = result.checkoutURL;
      }
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.message);
      }
    }
  };
  console.log(category);
  return (
    <div className="relative w-full py-5 px-6 md:px-16 lg:px-24">
      {level && <Badge label={level} type="info" />}

      <div className="flex flex-col md:flex-row justify-between items-center relative gap-10">
        <div className="relative flex-1 p-5">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-800 mb-6 leading-snug">
            {title}
          </h1>
          <p className="text-lg text-gray-600 mb-2">{description}</p>
          <span className="bg-orange-200 mb-6 text-orange-600 px-2 py-1 rounded text-xs font-medium">
            {category}
          </span>
          {!onEnrolledPage && (
            <div>
              <div>
                <p className="text-3xl font-bold text-gray-900">₹{price}</p>
                <p className="text-sm text-gray-500">
                  One-time payment • Lifetime access
                </p>
              </div>

              <div className="flex gap-4 pt-5">
                <StarRating rating={rating as number} />
                <div className="flex gap-3">
                  <Users2 size={20} className="text-gray-500  " />
                  {totalStudent}
                </div>
              </div>
            </div>
          )}
          <div className="absolute bottom-3 left-3"></div>
          <div className="mt-5">
             {!user && (
                <button
                  onClick={handlePaymentPage}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition"
                >
                  Enroll Now
                </button>
              )}
            {user?.role == "learner" && (
              <>
                {user?.role === "learner" && (
                  <>
                    {enrolledId ? (
                      !onEnrolledPage && (
                        <Link
                          to={`/learner/enrolled-courses/${enrolledId}`}
                          className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition"
                        >
                          Continue Learning
                        </Link>
                      )
                    ) : (
                      <button
                        onClick={handlePaymentPage}
                        className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition"
                      >
                        Enroll Now
                      </button>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>

        <div className="relative flex-1 max-w-md">
          <img
            src={imageUrl}
            alt="Course preview"
            className="w-full object-cover rounded-lg shadow-lg relative z-10"
          />
        </div>
      </div>
    </div>
  );
};

export default Banner;
