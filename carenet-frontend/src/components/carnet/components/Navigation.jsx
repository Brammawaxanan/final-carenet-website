import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Heart, Users, Activity as ActivityIcon, Bell, Crown, ArrowRight } from "lucide-react";
import ApiService from "../services/api";

export default function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [userContext, setUserContext] = useState(null);

  const isActive = (path) => location.pathname.startsWith(path);

  useEffect(() => {
    (async () => {
      try {
        const data = await ApiService.getUserContext();
        setUserContext(data);
      } catch (e) { console.error("Failed to load user context:", e); }
    })();
  }, []);

  const role = (userContext?.role || "user").toLowerCase(); // "client"/"caregiver" from backend -> treat "client" as "user"
  const activityPath = role === "caregiver" ? "/caregiver-activity" : "/user-activity";

  return (
    <nav className="bg-white shadow-soft border-b border-pale-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-pale-900">CareNet</span>
          </div>

          {/* Links */}
          <div className="flex items-center space-x-8">
            <Link
              to="/service"
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                isActive("/service")
                  ? "bg-primary-50 text-primary-700 border border-primary-200"
                  : "text-pale-600 hover:text-primary-600 hover:bg-pale-50"
              }`}
            >
              <Users className="w-5 h-5" />
              <span>Service</span>
            </Link>

            <Link
              to={activityPath}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                isActive(activityPath)
                  ? "bg-primary-50 text-primary-700 border border-primary-200"
                  : "text-pale-600 hover:text-primary-600 hover:bg-pale-50"
              }`}
            >
              <ActivityIcon className="w-5 h-5" />
              <span>Activity</span>
            </Link>
          </div>

          {/* User + Subscribe */}
          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-pale-600 hover:text-primary-600 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary-500 rounded-full" />
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-400 to-primary-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {userContext?.name?.[0]?.toUpperCase() || "U"}
                </span>
              </div>
              <div className="flex flex-col items-start">
                <span className="text-pale-700 font-medium">{userContext?.name || "Loading..."}</span>
                {userContext && (
                  <span className={`flex items-center text-xs font-medium mt-0.5 px-2 py-0.5 rounded-full ${
                      userContext.isSubscribed
                        ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
                        : "bg-pale-100 text-pale-600 border border-pale-200"
                    }`}
                  >
                    <Crown className="w-3 h-3 mr-1" />
                    {userContext.isSubscribed ? "Premium" : "Free"}
                  </span>
                )}
              </div>
            </div>

            {userContext && !userContext.isSubscribed && (
              <button
                onClick={() => navigate("/subscribe")}
                className="ml-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-2 rounded-lg shadow-soft hover:from-primary-600 hover:to-primary-700 flex items-center space-x-2 transition-all duration-200"
              >
                <span>Subscribe Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}