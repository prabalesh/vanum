import React from "react";
import { Bars3Icon, UserCircleIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../ui/Button";

interface HeaderProps {
  onMenuClick: () => void;
  isMobile: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, isMobile }) => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 sm:px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {isMobile && (
            <button
              type="button"
              className="text-gray-500 hover:text-gray-600 focus:outline-none focus:text-gray-600"
              onClick={onMenuClick}
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
          )}
          <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">
            Theater Management
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <UserCircleIcon className="h-6 w-6 text-gray-400" />
            <span className="text-sm font-medium text-gray-700 hidden sm:block">
              {user?.first_name} {user?.last_name}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-gray-600 hover:text-gray-800"
          >
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
};
