"use client";

type DoctorPhotoProps = {
  src: string;
  alt: string;
  className: string;
};

export default function DoctorPhoto({ src, alt, className }: DoctorPhotoProps) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(event) => {
        event.currentTarget.style.display = "none";
      }}
    />
  );
}
