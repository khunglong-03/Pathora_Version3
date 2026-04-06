"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  MenuButton,
  MenuItems,
  MenuItem,
  Transition,
} from "@headlessui/react";
import Icon from "@/components/ui/Icon";

interface SplitDropdownItem {
  label: string;
  link?: string;
  icon?: string;
  hasDivider?: boolean;
}

const SplitDropdown = ({
  label = "Dropdown",
  wrapperClass = "inline-block",
  labelClass = "",
  children,
  classMenuItems = "mt-2 w-55",
  splitIcon = "heroicons-outline:chevron-down",
  items = [
    {
      label: "Action",
      link: "#",
    },
    {
      label: "Another action",
      link: "#",
    },
    {
      label: "Something else here",
      link: "#",
    },
  ] as SplitDropdownItem[],
  classItem = "px-4 py-2",
}) => {
  const pathname = usePathname();
  return (
    <div className={`relative ${wrapperClass}`}>
      <Menu as="div" className="block w-full">
        <div className="split-btngroup flex">
          <button type="button" className={`btn flex-1 ${labelClass}`}>
            {label}
          </button>
          <MenuButton className={`flex-0 px-3 ${labelClass}`}>
            <Icon icon={splitIcon} />
          </MenuButton>
        </div>

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
            className={`absolute z-9999 origin-top-right rounded border border-slate-100 bg-white shadow-sm ltr:right-0 rtl:left-0 dark:border-slate-700 dark:bg-slate-800 ${classMenuItems} `}
          >
            <div>
              {children
                ? children
                : items?.map((item, index) => (
                    <MenuItem key={index}>
                      {({ active }) => (
                        <div
                          className={`${
                            active
                              ? "dark:bg-opacity-50 bg-slate-100 text-slate-900 dark:bg-slate-600 dark:text-slate-300"
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
                              className={`block ${classItem} ${
                                pathname === item.link
                                  ? "dark:bg-opacity-50 bg-slate-100 text-slate-900 dark:bg-slate-600 dark:text-slate-300"
                                  : "text-slate-600 dark:text-slate-300"
                              }`}
                            >
                              {item.icon ? (
                                <div className="flex items-center">
                                  <span className="block text-xl ltr:mr-3 rtl:ml-3">
                                    <Icon icon={item.icon} />
                                  </span>
                                  <span className="block text-sm">
                                    {item.label}
                                  </span>
                                </div>
                              ) : (
                                <span className="block text-sm">
                                  {item.label}
                                </span>
                              )}
                            </Link>
                          ) : (
                            <div
                              className={`block cursor-pointer ${classItem}`}
                            >
                              {item.icon ? (
                                <div className="flex items-center">
                                  <span className="block text-xl ltr:mr-3 rtl:ml-3">
                                    <Icon icon={item.icon} />
                                  </span>
                                  <span className="block text-sm">
                                    {item.label}
                                  </span>
                                </div>
                              ) : (
                                <span className="block text-sm">
                                  {item.label}
                                </span>
                              )}
                            </div>
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

export default SplitDropdown;
