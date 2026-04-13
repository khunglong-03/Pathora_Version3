import React from "react";
import {
  ArrowBendUpLeftIcon, ArrowCounterClockwiseIcon, ArrowDownIcon, ArrowLeftIcon, ArrowRightIcon, ArrowSquareOutIcon, BellIcon, BookmarkIcon,
  BuildingsIcon, CalendarIcon, CalendarBlankIcon, CaretDoubleLeftIcon, CaretDoubleRightIcon,
  CaretDownIcon, CaretLeftIcon, CaretRightIcon, CaretUpIcon, ChartBarIcon, ChatIcon, ChatCircleIcon,
  ChatCircleDotsIcon, CheckIcon, CheckCircleIcon, CertificateIcon, ClipboardTextIcon, CheckSquareIcon, ClockIcon,
  CalculatorIcon, CreditCardIcon, CubeIcon, CurrencyDollarIcon, CurrencyDollarSimpleIcon, DesktopIcon, DeviceMobileIcon, EnvelopeIcon,
  EyeIcon, EyeSlashIcon, FileIcon, FileTextIcon, FunnelIcon, GearIcon, GlobeIcon, GraduationCapIcon, HeartIcon,
  ImageIcon, InfoIcon, KeyIcon, ListIcon, MagnifyingGlassIcon, MapPinIcon, MapTrifoldIcon, MinusIcon, MoneyIcon, MoonIcon, NoteIcon,
  PaperPlaneTiltIcon, PencilSimpleIcon, PercentIcon, PhoneIcon, PlusIcon, PuzzlePieceIcon, QuestionIcon,
  QrCodeIcon, ReceiptIcon, ShareNetworkIcon, ShieldCheckIcon, SignOutIcon, SparkleIcon, SquaresFourIcon, StarIcon, SunIcon,
  TagIcon, TicketIcon, TrashIcon, TruckIcon, UserIcon, UserCircleIcon, UserCircleGearIcon, UsersIcon, UsersThreeIcon,
  WalletIcon, WarningIcon, WarningCircleIcon, WrenchIcon, XIcon, XCircleIcon,
} from "@phosphor-icons/react";

type IconProps = {
  icon: string;
  className?: string;
  width?: number | string;
  rotate?: number;
  hFlip?: boolean;
  vFlip?: boolean;
  ariaHidden?: boolean;
  ariaLabel?: string;
  [key: string]: unknown;
};

// Map icon string names to Phosphor components
const iconMap: Record<string, React.ElementType> = {
  "bi:check-lg": CheckIcon,
  "heroicons-outline:adjustments-horizontal": ListIcon,
  "heroicons-outline:arrow-left": ArrowLeftIcon,
  "heroicons-outline:arrow-path": ArrowCounterClockwiseIcon,
  "heroicons-outline:arrow-right": ArrowRightIcon,
  "heroicons-outline:bars-3": ListIcon,
  "heroicons-outline:calendar": CalendarIcon,
  "heroicons-outline:calendar-days": CalendarBlankIcon,
  "heroicons-outline:chat-bubble-oval-left": ChatCircleIcon,
  "heroicons-outline:check": CheckIcon,
  "heroicons-outline:chevron-down": CaretDownIcon,
  "heroicons-outline:chevron-left": CaretLeftIcon,
  "heroicons-outline:chevron-right": CaretRightIcon,
  "heroicons-outline:clipboard-document-list": NoteIcon,
  "heroicons-outline:clock": ClockIcon,
  "heroicons-outline:exclamation-circle": WarningCircleIcon,
  "heroicons-outline:eye": EyeIcon,
  "heroicons-outline:eye-off": EyeSlashIcon,
  "heroicons-outline:home": BuildingsIcon,
  "heroicons-outline:information-circle": InfoIcon,
  "heroicons-outline:key": KeyIcon,
  "heroicons-outline:magnifying-glass": MagnifyingGlassIcon,
  "heroicons-outline:map-pin": MapPinIcon,
  "heroicons-outline:menu": ListIcon,
  "heroicons-outline:moon": MoonIcon,
  "heroicons-outline:phone": PhoneIcon,
  "heroicons-outline:photo": ImageIcon,
  "heroicons-outline:search": MagnifyingGlassIcon,
  "heroicons-outline:sparkles": SparkleIcon,
  "heroicons-outline:squares-2x2": SquaresFourIcon,
  "heroicons-outline:sun": SunIcon,
  "heroicons-outline:trophy": StarIcon,
  "heroicons-outline:user-group": UsersIcon,
  "heroicons-outline:x": XIcon,
  "heroicons-outline:x-mark": XIcon,
  "heroicons-solid:map-pin": MapPinIcon,
  "heroicons-solid:star": StarIcon,
  "heroicons-solid:user-circle": UserCircleIcon,
  "heroicons:arrow-down-tray": ArrowDownIcon,
  "heroicons:arrow-left": ArrowLeftIcon,
  "heroicons:arrow-path": ArrowCounterClockwiseIcon,
  "heroicons:arrow-small-right": ArrowRightIcon,
  "heroicons:arrow-top-right-on-square": ArrowSquareOutIcon,
  "heroicons:arrow-right": ArrowRightIcon,
  "heroicons:arrow-right-on-rectangle": SignOutIcon,
  "heroicons:arrow-uturn-left": ArrowBendUpLeftIcon,
  "heroicons:banknotes": MoneyIcon,
  "heroicons:bars-3": ListIcon,
  "heroicons:bell": BellIcon,
  "heroicons:bookmark": BookmarkIcon,
  "heroicons:building-library": BuildingsIcon,
  "heroicons:building-office": BuildingsIcon,
  "heroicons:calculator": CalculatorIcon,
  "heroicons:calendar": CalendarIcon,
  "heroicons:calendar-days": CalendarBlankIcon,
  "heroicons:chart-bar": ChartBarIcon,
  "heroicons:chat-bubble-bottom-center-text": ChatIcon,
  "heroicons:chat-bubble-oval-left": ChatCircleIcon,
  "heroicons:chat-bubble-oval-left-ellipsis": ChatCircleDotsIcon,
  "heroicons:check": CheckIcon,
  "heroicons:check-badge": CertificateIcon,
  "heroicons:check-circle": CheckCircleIcon,
  "heroicons:check-circle-solid": CheckCircleIcon,
  "heroicons:chevron-double-left": CaretDoubleLeftIcon,
  "heroicons:chevron-double-right": CaretDoubleRightIcon,
  "heroicons:chevron-down": CaretDownIcon,
  "heroicons:chevron-left": CaretLeftIcon,
  "heroicons:chevron-right": CaretRightIcon,
  "heroicons:chevron-up": CaretUpIcon,
  "heroicons:clipboard-document": ClipboardTextIcon,
  "heroicons:clipboard-document-check": CheckSquareIcon,
  "heroicons:clipboard-document-list": NoteIcon,
  "heroicons:clock": ClockIcon,
  "heroicons:cog-6-tooth": GearIcon,
  "heroicons:computer-desktop": DesktopIcon,
  "heroicons:credit-card": CreditCardIcon,
  "heroicons:cube": CubeIcon,
  "heroicons:currency-dollar": CurrencyDollarIcon,
  "heroicons:device-phone-mobile": DeviceMobileIcon,
  "heroicons:document": FileIcon,
  "heroicons:document-currency-dollar": CurrencyDollarSimpleIcon,
  "heroicons:document-text": FileTextIcon,
  "heroicons:envelope": EnvelopeIcon,
  "heroicons:exclamation-circle": WarningCircleIcon,
  "heroicons:exclamation-triangle": WarningIcon,
  "heroicons:eye": EyeIcon,
  "heroicons:funnel": FunnelIcon,
  "heroicons:globe-alt": GlobeIcon,
  "heroicons:heart": HeartIcon,
  "heroicons:home": BuildingsIcon,
  "heroicons:home-modern": BuildingsIcon,
  "heroicons:information-circle": InfoIcon,
  "heroicons:magnifying-glass": MagnifyingGlassIcon,
  "heroicons:map": MapTrifoldIcon,
  "heroicons:map-pin": MapPinIcon,
  "heroicons:minus": MinusIcon,
  "heroicons:paper-airplane": PaperPlaneTiltIcon,
  "heroicons:pencil-square": PencilSimpleIcon,
  "heroicons:percent-badge": PercentIcon,
  "heroicons:phone": PhoneIcon,
  "heroicons:photo": ImageIcon,
  "heroicons:plus": PlusIcon,
  "heroicons:puzzle-piece": PuzzlePieceIcon,
  "heroicons:qr-code": QrCodeIcon,
  "heroicons:receipt": ReceiptIcon,
  "heroicons:share": ShareNetworkIcon,
  "heroicons:shield-check": ShieldCheckIcon,
  "heroicons:sparkles": SparkleIcon,
  "heroicons:star": StarIcon,
  "heroicons:star-solid": StarIcon,
  "heroicons:tag": TagIcon,
  "heroicons:ticket": TicketIcon,
  "heroicons:trash": TrashIcon,
  "heroicons:truck": TruckIcon,
  "heroicons:user": UserIcon,
  "heroicons:user-circle": UserCircleIcon,
  "heroicons:user-group": UsersIcon,
  "heroicons:users": UsersThreeIcon,
  "heroicons:wallet": WalletIcon,
  "heroicons:wrench-screwdriver": WrenchIcon,
  "heroicons:x-circle": XCircleIcon,
  "heroicons:x-mark": XIcon,
  "mdi:android": DeviceMobileIcon,
  "mdi:apple": GraduationCapIcon,
  "mdi:facebook": BuildingsIcon,
  "ri:facebook-fill": BuildingsIcon,
  "ph:question": QuestionIcon,
};

export const Icon = ({
  icon,
  className,
  width,
  rotate,
  hFlip,
  vFlip,
  ariaHidden = true,
  ariaLabel,
  ...rest
}: IconProps) => {
  const IconComponent = iconMap[icon] || QuestionIcon;

  const style: React.CSSProperties = {};
  if (rotate) {
    style.transform = `rotate(${rotate}deg)`;
  }
  if (hFlip) {
    style.transform = `${style.transform || ""} scaleX(-1)`.trim();
  }
  if (vFlip) {
    style.transform = `${style.transform || ""} scaleY(-1)`.trim();
  }

  // Phosphor uses 'size' prop (number or string), falls back to class
  const iconSize = width ? (typeof width === "number" ? width : width) : undefined;

  const sanitizedStyle = style && Object.entries(style).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      acc[key] = value;
    }
    return acc;
  }, {} as Record<string, unknown>);

  return (
    <IconComponent
      className={className}
      style={Object.keys(sanitizedStyle || {}).length > 0 ? sanitizedStyle : undefined}
      size={iconSize}
      weight="regular"
      aria-hidden={ariaLabel ? false : ariaHidden}
      aria-label={ariaLabel}
      suppressHydrationWarning
      {...rest}
    />
  );
};

export default Icon;
