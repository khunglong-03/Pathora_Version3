import React from "react";

type ImageProps = {
  wrapperClass?: string;
  src?: string;
  className?: string;
  alt?: string;
  width?: number;
  height?: number;
};

const Image = ({
  wrapperClass = "custom-class",
  src,
  className,
  alt = "image-title",
  width,
  height,
}: ImageProps) => {
  return (
    <div className={`relative ${wrapperClass}`}>
      {src ? (
        <img
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={`max-w-full block ${className}`}
        />
      ) : (
        <div className="bg-neutral-300 w-full h-50 flex flex-col items-center justify-center font-medium rounded-md text-xl text-slate-900 capitalize">
          Please Set Image
          <code className="text-sm text-primary-500 lowercase mt-3">
            [src=&quot;images/all-img/image-1.png&quot;]
          </code>
        </div>
      )}
    </div>
  );
};

export default Image;
