declare module "cleave.js/react" {
  import { ComponentClass } from "react";

  interface CleaveOptions {
    creditCard?: boolean;
    creditCardStrictMode?: boolean;
    creditCardType?: (type: string) => void;
    date?: boolean;
    datePattern?: string[];
    delimiter?: string;
    delimiters?: string[];
    blocks?: number[];
    uppercase?: boolean;
    lowercase?: boolean;
    phone?: { countryCode: string };
    numeral?: boolean;
    numeralThousandsGroupStyle?: string;
    numeralIntegerScale?: number;
    numeralDecimalScale?: number;
    numeralDecimalMark?: string;
    numeralPositiveOnly?: boolean;
    stripLeadingZeroes?: boolean;
    prefix?: string;
    rawValueTrimPrefix?: boolean;
    tailPrefix?: boolean;
    signBeforePrefix?: boolean;
    onValueChanged?: (value: { target: { rawValue: string; value: string } }) => void;
  }

  interface CleaveProps {
    options?: CleaveOptions;
    value?: string;
    defaultValue?: string;
    placeholder?: string;
    name?: string;
    id?: string;
    className?: string;
    disabled?: boolean;
    readOnly?: boolean;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
    onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
    [key: string]: unknown;
  }

  const Cleave: ComponentClass<CleaveProps>;
  export default Cleave;
}

declare module "cleave.js/dist/addons/cleave-phone.us" {
  // Empty module for phone formatting addon
}
