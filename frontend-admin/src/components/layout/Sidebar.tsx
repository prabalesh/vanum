import React from "react";
import { href, NavLink, useLocation } from "react-router-dom";
import { clsx } from "clsx";
import {
  HomeIcon,
  BuildingOfficeIcon,
  FilmIcon,
  CalendarIcon,
  TicketIcon,
  XMarkIcon,
  UserGroupIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: HomeIcon },
  {name: "Roles", href: "/roles", icon: UserGroupIcon},
  {name: "Users", href: "/users", icon: UsersIcon},
  { name: "Theaters", href: "/theaters", icon: BuildingOfficeIcon },
  { name: "Movies", href: "/movies", icon: FilmIcon },
  { name: "Screenings", href: "/screenings", icon: CalendarIcon },
  { name: "Bookings", href: "/bookings", icon: TicketIcon },
];

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  isMobile,
}) => {
  const location = useLocation();

  const sidebarClasses = clsx(
    "fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 transition-transform duration-300 ease-in-out",
    {
      "transform translate-x-0": isOpen,
      "transform -translate-x-full": !isOpen,
    },
  );

  const desktopSidebarClasses = clsx(
    "hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:block lg:w-64 lg:bg-gray-900",
  );

  const SidebarContent = () => (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4">
        <h2 className="text-lg font-semibold text-white">Admin Panel</h2>
        {isMobile && (
          <button
            type="button"
            className="text-gray-300 hover:text-white focus:outline-none"
            onClick={onClose}
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 pb-4">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={isMobile ? onClose : undefined}
              className={clsx(
                "group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors",
                {
                  "bg-gray-800 text-white": isActive,
                  "text-gray-300 hover:bg-gray-800 hover:text-white": !isActive,
                },
              )}
            >
              <item.icon
                className={clsx("mr-3 h-5 w-5 flex-shrink-0", {
                  "text-white": isActive,
                  "text-gray-400 group-hover:text-white": !isActive,
                })}
              />
              {item.name}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile sidebar */}
      {isMobile && (
        <>
          {/* Backdrop */}
          {isOpen && (
            <div
              className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
              onClick={onClose}
            />
          )}
          {/* Sidebar */}
          <div className={sidebarClasses}>
            <SidebarContent />
          </div>
        </>
      )}

      {/* Desktop sidebar */}
      <div className={desktopSidebarClasses}>
        <SidebarContent />
      </div>
    </>
  );
};
