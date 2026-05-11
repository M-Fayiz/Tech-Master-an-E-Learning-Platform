import React, { useState, useEffect } from "react";
import { X, Menu, Code2 } from "lucide-react";
import { A_tag } from "../../ui/Elements";
import { Link } from "react-router-dom";
import { useAuth } from "../../../context/auth.context";
import { User } from "lucide-react";
import { AuthStatus } from "@/types/auth.types";
const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, status } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled ? "bg-white/95 backdrop-blur-md shadow-lg" : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-2">
            {/* <div className="w-10 h-10  rounded-sm flex items-center justify-center"> */}
            <Code2 className="w-8 h-8  text-orange-500" />
            {/* </div> */}
            <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-400 bg-clip-text text-transparent">
              CodeAspire
            </span>
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            {/* <A_tag href="#courses" label="Courses" /> */}
            <Link
              to={"/courses"}
              className="text-gray-700 hover:text-orange-600 transition-colors font-medium"
            >
              Course
            </Link>

            <A_tag href="#about" label="About" />
            {/* <A_tag href="#about" label="About"/> */}

            {status === AuthStatus.CHECKING ? (
              <div className="w-12 h-6" />
            ) : user?.role ? (
              <Link to={`/${user.role}/dashboard`}>
                <User />
              </Link>
            ) : (
              <Link to="/auth/login">
                <button className="text-gray-700 hover:text-orange-600 transition-colors font-medium">
                  Login
                </button>
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 py-4">
            <nav className="flex flex-col space-y-4">
              <Link
                to="/courses"
                className="text-gray-700 hover:text-orange-600 transition-colors font-medium"
              >
                Courses
              </Link>

              <a
                href="#about"
                className="text-gray-700 hover:text-orange-600 transition-colors font-medium"
              >
                About
              </a>

              {status === AuthStatus.CHECKING ? (
                <div className="w-12 h-6" />
              ) : user?.role ? (
                <Link to={`/${user.role}/dashboard`}>
                  <User />
                </Link>
              ) : (
                <Link to="/auth/login">
                  <button className="text-gray-700 hover:text-orange-600 transition-colors font-medium">
                    Login
                  </button>
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
