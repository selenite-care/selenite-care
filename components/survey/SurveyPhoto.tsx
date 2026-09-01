"use client";

type SurveyPhotoProps = {
  src: string;
  alt: string;
  className: string;
};

export default function SurveyPhoto({ src, alt, className }: SurveyPhotoProps) {
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
