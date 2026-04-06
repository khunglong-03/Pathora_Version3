"use client";

import {
  Menu,
  MenuButton,
  MenuItems,
  MenuItem,
  Transition,
} from "@headlessui/react";
import { Fragment } from "react";
import Link from "next/link";
import Icon from "@/components/ui/Icon";

interface DropdownItem {
  label: string;
  link?: string;
  icon?: string;
  hasDivider?: boolean;
  onClick?: () => void;
}

const Dropdown = ({
  label,
  wrapperClass = "inline-block",
  labelClass = "",
  children,
  anchor = "bottom start" as const,
  classMenuItems = "mt-2 w-50",
  items = [
    { label: "Action", link: "#" },
    { label: "Another action", link: "#" },
    { label: "Something else here", link: "#" },
  ] as DropdownItem[],
  classItem = "px-4 py-2",
  className = "",
}) => {
  const handleOpenDropdown = () => {
    if (typeof window !== "undefined") {
      document.documentElement.style.paddingRight = "0px";
    }
  };

  return (
    <div className={`relative ${wrapperClass}`}>
      <Menu>
        <MenuButton
          className={`block w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded ${labelClass}`}
          onClick={handleOpenDropdown}
        >
          {label}
        </MenuButton>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <MenuItems
            anchor={anchor}
            className={`absolute z-9999 origin-top-right rounded border border-slate-100 bg-white shadow-sm focus:outline-none dark:border-slate-700 dark:bg-slate-800 ${classMenuItems}`}
          >
            <div>
              {children
                ? children
                : items.map((item, index) => (
                    <MenuItem key={index}>
                      {({ focus }) => (
                        <div
                          className={`${
                            focus
                              ? "bg-slate-100 text-slate-900 dark:bg-slate-600/50 dark:text-slate-300"
                              : "text-slate-600 dark:text-slate-300"
                          } block ${
                            item.hasDivider
                              ? "border-t border-slate-100 dark:border-slate-700"
                              : ""
                          }`}
                        >
                          {item.link ? (
                            <Link
                              href={item.link}
                              className={`block focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500 ${classItem}`}
                            >
                              {item.icon ? (
                                <span className="flex items-center">
                                  <Icon
                                    icon={item.icon}
                                    className="block text-xl ltr:mr-3 rtl:ml-3"
                                    aria-hidden="true"
                                  />
                                  <span className="block text-sm">{item.label}</span>
                                </span>
                              ) : (
                                <span className="block text-sm">{item.label}</span>
                              )}
                            </Link>
                          ) : (
                            <button
                              type="button"
                              onClick={item.onClick}
                              className={`block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-500 ${classItem}`}
                            >
                              {item.icon ? (
                                <span className="flex items-center">
                                  <Icon
                                    icon={item.icon}
                                    className="block text-xl ltr:mr-3 rtl:ml-3"
                                    aria-hidden="true"
                                  />
                                  <span className="block text-sm">{item.label}</span>
                                </span>
                              ) : (
                                <span className="block text-sm">{item.label}</span>
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </MenuItem>
                  ))}
            </div>
          </MenuItems>
        </Transition>
      </Menu>
    </div>
  );
};

export default Dropdown;
