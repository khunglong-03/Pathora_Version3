"use client";

import NextImage, { type ImageProps } from "next/image";

type LandingImageProps = ImageProps & {
  suppressHydrationWarning?: boolean;
};

const LandingImage = ({
  suppressHydrationWarning = true,
  ...props
}: LandingImageProps) => {
  return <NextImage suppressHydrationWarning={suppressHydrationWarning} {...props} />;
};

export default LandingImage;
