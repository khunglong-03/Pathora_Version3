import React from "react";
import {
  ArrowBendUpLeft, ArrowCounterClockwise, ArrowDown, ArrowLeft, ArrowRight, ArrowSquareOut, Bell, Bookmark,
  Buildings, Calendar, CalendarBlank, CaretDoubleLeft, CaretDoubleRight,
  CaretDown, CaretLeft, CaretRight, CaretUp, ChartBar, Chat, ChatCircle,
  ChatCircleDots, Check, CheckCircle, Certificate, ClipboardText, CheckSquare, Clock,
  Calculator, CreditCard, Cube, CurrencyDollar, CurrencyDollarSimple, Desktop, DeviceMobile, Envelope,
  Eye, EyeSlash, File, FileText, Funnel, Gear, Globe, GraduationCap, Heart,
  Image, Info, Key, List, MagnifyingGlass, MapPin, MapTrifold, Minus, Money, Moon, Note,
  PaperPlaneTilt, PencilSimple, Percent, Phone, Plus, PuzzlePiece, Question,
  QrCode, Receipt, ShareNetwork, ShieldCheck, SignOut, Sparkle, SquaresFour, Star, Sun,
  Tag, Ticket, Trash, Truck, User, UserCircle, UserCircleGear, Users, UsersThree,
  Wallet, Warning, WarningCircle, Wrench, X, XCircle,
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
  "bi:check-lg": Check,
  "heroicons-outline:adjustments-horizontal": List,
  "heroicons-outline:arrow-left": ArrowLeft,
  "heroicons-outline:arrow-path": ArrowCounterClockwise,
  "heroicons-outline:arrow-right": ArrowRight,
  "heroicons-outline:bars-3": List,
  "heroicons-outline:calendar": Calendar,
  "heroicons-outline:calendar-days": CalendarBlank,
  "heroicons-outline:chat-bubble-oval-left": ChatCircle,
  "heroicons-outline:check": Check,
  "heroicons-outline:chevron-down": CaretDown,
  "heroicons-outline:chevron-left": CaretLeft,
  "heroicons-outline:chevron-right": CaretRight,
  "heroicons-outline:clipboard-document-list": Note,
  "heroicons-outline:clock": Clock,
  "heroicons-outline:exclamation-circle": WarningCircle,
  "heroicons-outline:eye": Eye,
  "heroicons-outline:eye-off": EyeSlash,
  "heroicons-outline:home": Buildings,
  "heroicons-outline:information-circle": Info,
  "heroicons-outline:key": Key,
  "heroicons-outline:magnifying-glass": MagnifyingGlass,
  "heroicons-outline:map-pin": MapPin,
  "heroicons-outline:menu": List,
  "heroicons-outline:moon": Moon,
  "heroicons-outline:phone": Phone,
  "heroicons-outline:photo": Image,
  "heroicons-outline:search": MagnifyingGlass,
  "heroicons-outline:sparkles": Sparkle,
  "heroicons-outline:squares-2x2": SquaresFour,
  "heroicons-outline:sun": Sun,
  "heroicons-outline:trophy": Star,
  "heroicons-outline:user-group": Users,
  "heroicons-outline:x": X,
  "heroicons-outline:x-mark": X,
  "heroicons-solid:map-pin": MapPin,
  "heroicons-solid:star": Star,
  "heroicons-solid:user-circle": UserCircle,
  "heroicons:arrow-down-tray": ArrowDown,
  "heroicons:arrow-left": ArrowLeft,
  "heroicons:arrow-path": ArrowCounterClockwise,
  "heroicons:arrow-small-right": ArrowRight,
  "heroicons:arrow-top-right-on-square": ArrowSquareOut,
  "heroicons:arrow-right": ArrowRight,
  "heroicons:arrow-right-on-rectangle": SignOut,
  "heroicons:arrow-uturn-left": ArrowBendUpLeft,
  "heroicons:banknotes": Money,
  "heroicons:bars-3": List,
  "heroicons:bell": Bell,
  "heroicons:bookmark": Bookmark,
  "heroicons:building-library": Buildings,
  "heroicons:building-office": Buildings,
  "heroicons:calculator": Calculator,
  "heroicons:calendar": Calendar,
  "heroicons:calendar-days": CalendarBlank,
  "heroicons:chart-bar": ChartBar,
  "heroicons:chat-bubble-bottom-center-text": Chat,
  "heroicons:chat-bubble-oval-left": ChatCircle,
  "heroicons:chat-bubble-oval-left-ellipsis": ChatCircleDots,
  "heroicons:check": Check,
  "heroicons:check-badge": Certificate,
  "heroicons:check-circle": CheckCircle,
  "heroicons:check-circle-solid": CheckCircle,
  "heroicons:chevron-double-left": CaretDoubleLeft,
  "heroicons:chevron-double-right": CaretDoubleRight,
  "heroicons:chevron-down": CaretDown,
  "heroicons:chevron-left": CaretLeft,
  "heroicons:chevron-right": CaretRight,
  "heroicons:chevron-up": CaretUp,
  "heroicons:clipboard-document": ClipboardText,
  "heroicons:clipboard-document-check": CheckSquare,
  "heroicons:clipboard-document-list": Note,
  "heroicons:clock": Clock,
  "heroicons:cog-6-tooth": Gear,
  "heroicons:computer-desktop": Desktop,
  "heroicons:credit-card": CreditCard,
  "heroicons:cube": Cube,
  "heroicons:currency-dollar": CurrencyDollar,
  "heroicons:device-phone-mobile": DeviceMobile,
  "heroicons:document": File,
  "heroicons:document-currency-dollar": CurrencyDollarSimple,
  "heroicons:document-text": FileText,
  "heroicons:envelope": Envelope,
  "heroicons:exclamation-circle": WarningCircle,
  "heroicons:exclamation-triangle": Warning,
  "heroicons:eye": Eye,
  "heroicons:funnel": Funnel,
  "heroicons:globe-alt": Globe,
  "heroicons:heart": Heart,
  "heroicons:home": Buildings,
  "heroicons:home-modern": Buildings,
  "heroicons:information-circle": Info,
  "heroicons:magnifying-glass": MagnifyingGlass,
  "heroicons:map": MapTrifold,
  "heroicons:map-pin": MapPin,
  "heroicons:minus": Minus,
  "heroicons:paper-airplane": PaperPlaneTilt,
  "heroicons:pencil-square": PencilSimple,
  "heroicons:percent-badge": Percent,
  "heroicons:phone": Phone,
  "heroicons:photo": Image,
  "heroicons:plus": Plus,
  "heroicons:puzzle-piece": PuzzlePiece,
  "heroicons:qr-code": QrCode,
  "heroicons:receipt": Receipt,
  "heroicons:share": ShareNetwork,
  "heroicons:shield-check": ShieldCheck,
  "heroicons:sparkles": Sparkle,
  "heroicons:star": Star,
  "heroicons:star-solid": Star,
  "heroicons:tag": Tag,
  "heroicons:ticket": Ticket,
  "heroicons:trash": Trash,
  "heroicons:truck": Truck,
  "heroicons:user": User,
  "heroicons:user-circle": UserCircle,
  "heroicons:user-group": Users,
  "heroicons:users": UsersThree,
  "heroicons:wallet": Wallet,
  "heroicons:wrench-screwdriver": Wrench,
  "heroicons:x-circle": XCircle,
  "heroicons:x-mark": X,
  "mdi:android": DeviceMobile,
  "mdi:apple": GraduationCap,
  "mdi:facebook": Buildings,
  "ri:facebook-fill": Buildings,
  "ph:question": Question,
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
  const IconComponent = iconMap[icon] || Question;

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
