declare module "react-date-range" {
  import { ComponentType } from "react";

  export interface Range {
    startDate?: Date;
    endDate?: Date;
    key?: string;
    color?: string;
  }

  export interface RangeKeyDict {
    [key: string]: Range;
  }

  export interface CalendarProps {
    locale?: object;
    showMonthAndYearPickers?: boolean;
    showMonthArrow?: boolean;
    showYearArrow?: boolean;
    showDateDisplay?: boolean;
    showPreview?: boolean;
    showSelectionPreview?: boolean;
    showHeading?: boolean;
    months?: number;
    color?: string;
    rangeColors?: string[];
    dateDisplayFormat?: string;
    monthDisplayFormat?: string;
    weekdayDisplayFormat?: string;
    direction?: string;
    minDate?: Date;
    maxDate?: Date;
    ranges?: Range[];
    focusedRange?: [number, number];
    onRangeFocusChange?: (focusedRange: [number, number]) => void;
    onChange?: (rangeByKey: RangeKeyDict) => void;
    onShownDateChange?: (date: Date) => void;
    shownDate?: Date;
    scroll?: { enabled?: boolean };
    className?: string;
    navigatorRenderer?: (props: Record<string, unknown>) => React.ReactNode;
    headerRenderer?: (props: Record<string, unknown>) => React.ReactNode;
    footerContent?: React.ReactNode;
    preview?: Range;
    drag?: { [key: string]: unknown };
    classNames?: { [key: string]: string };
  }

  export interface DateRangePickerProps extends CalendarProps {
    staticRanges?: { label: string; range: () => Range }[];
    inputRanges?: { label: string; range: (input: number) => Range }[];
    preventSnapRefocus?: boolean;
    dragSelectionEnabled?: boolean;
  }

  export const Calendar: ComponentType<CalendarProps>;
  export const DateRangePicker: ComponentType<DateRangePickerProps>;
  export const defaultStaticRanges: { label: string; range: () => Range }[];
  export const defaultInputRanges: {
    label: string;
    range: (input: number) => Range;
  }[];
  export const createStaticRanges: (
    ranges: { label: string; range: () => Range }[],
  ) => { label: string; range: () => Range }[];
}
