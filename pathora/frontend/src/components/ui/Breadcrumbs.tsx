"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import useMenuTranslation from "@/hooks/useMenuTranslation";
import Icon from "@/components/ui/Icon";

const Breadcrumbs = () => {
  const pathname = usePathname();
  const locationName = pathname.replace(/^\//, "");
  const { menuItems } = useMenuTranslation();

  const { isHide, groupTitle } = useMemo(() => {
    const currentMenuItem = menuItems.find(
      (item) => item.link === locationName
    );

    const currentChild = menuItems.find((item) =>
      item.child?.find((child) => child.childlink === locationName)
    );

    if (currentMenuItem) {
      return { isHide: currentMenuItem.isHide, groupTitle: "" };
    } else if (currentChild) {
      return {
        isHide: currentChild?.isHide || false,
        groupTitle: currentChild?.title || "",
      };
    }
    return { isHide: null, groupTitle: "" };
  }, [pathname, locationName, menuItems]);

  return (
    <>
      {!isHide ? (
        <div className="md:mb-6 mb-4 flex space-x-3 rtl:space-x-reverse">
          <ul className="breadcrumbs">
            <li className="text-primary-500">
              <Link href="/dashboard" className="text-lg">
                <Icon icon="heroicons-outline:home" />
              </Link>
              <span className="breadcrumbs-icon rtl:transform rtl:rotate-180">
                <Icon icon="heroicons:chevron-right" />
              </span>
            </li>
            {groupTitle && (
              <li className="text-primary-500">
                <button type="button" className="capitalize">
                  {groupTitle}
                </button>
                <span className="breadcrumbs-icon rtl:transform rtl:rotate-180">
                  <Icon icon="heroicons:chevron-right" />
                </span>
              </li>
            )}
            <li className="capitalize text-slate-500 dark:text-slate-400">
              {locationName}
            </li>
          </ul>
        </div>
      ) : null}
    </>
  );
};

export default Breadcrumbs;
