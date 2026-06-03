import { Bell, ChevronDown, LogOut, Menu, User, X } from "lucide-react";
import React, { useState } from "react";
import type { IDecodedUserType } from "../../../types/auth.types";
import { useAuth } from "../../../context/auth.context";
import { Link } from "react-router";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import NotificationDropdown from "@/components/Notification/NotificationComponents";

import { useNotificationContext } from "@/context/notification.context";
dayjs.extend(relativeTime);

interface IHeaderProbs {
  user: IDecodedUserType;
  onMenuToggle: () => void;
  isSidebarOpen: boolean;
}

const Header: React.FC<IHeaderProbs> = ({
  user,
  onMenuToggle,
  isSidebarOpen,
}) => {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const { logout } = useAuth();
  const { count } = useNotificationContext();
  console.log("use from header :", user.id);
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center space-x-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
        >
          {isSidebarOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>

        <div className="hidden lg:block">
          <h1 className="text-xl font-bold text-gray-900">CodeAspire</h1>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div>
          <Link to={"/"}>Home</Link>
        </div>
        <div>
          <Link to={"/courses"}>Course</Link>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-md hover:bg-gray-100 transition-colors relative"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {count}
              </span>
            )}
          </button>

          {showNotifications && <NotificationDropdown />}
        </div>
        <div className="relative">
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            {user.profile ? (
              <img
                src={user.profile}
                alt={user.name}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <User className="w-1/2 h-1/2 text-gray-400" />
            )}
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-200">
                <p className="font-medium text-gray-900">{user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
              <div className="py-2">
                <Link
                  to={`/${user.role}/profile/u`}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <User className="w-4 h-4 mr-3" />
                  My Profile
                </Link>
              </div>
              <div className="border-t border-gray-200 py-2">
                <button
                  onClick={logout}
                  className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* {loading && <Spinner fullScreen variant="theme" />} */}
    </header>
  );
};

export default Header;
