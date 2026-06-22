import Image from "next/image";

type SurveyProfileDetailsData = {
  name: string | null;
  age: string | null;
  phone: string | null;
  email: string | null;
  skinType: string | null;
  usesKoreanProducts: boolean;
  facingSkinIssues: boolean;
  skinIssues: string[];
  skinIssueDuration: string | null;
  currentProducts: string[];
  allergicIngredients: string[];
  doubleCleansePreference: string | null;
  sleepHours: string | null;
  waterIntake: string | null;
  appliesSunscreen: boolean;
  regularPeriodCycle: boolean;
  usedSteroidBasedNightCream: boolean;
  skinImages: string[];
  note: string | null;
  updatedAt?: Date;
  createdAt?: Date;
};

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="bg-card border-themed rounded-lg border p-4">
      <p className="text-muted text-sm font-medium">{label}</p>
      <div className="text-page mt-2 text-sm leading-6">{value}</div>
    </div>
  );
}

function joinValues(values?: string[]) {
  if (!values || values.length === 0) {
    return "None";
  }

  return values.join(", ");
}

function yesNo(value: boolean) {
  return value ? "Yes" : "No";
}

export default function SurveyProfileDetails({
  profile,
  emptyMessage = "No survey profile is available for this client.",
}: {
  profile: SurveyProfileDetailsData | null | undefined;
  emptyMessage?: string;
}) {
  if (!profile) {
    return <p className="text-muted mt-4 text-sm leading-6">{emptyMessage}</p>;
  }

  return (
    <>
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <DetailItem label="Name" value={profile.name ?? "Not provided"} />
        <DetailItem label="Age" value={profile.age ?? "Not provided"} />
        <DetailItem label="Phone" value={profile.phone ?? "Not provided"} />
        <DetailItem label="Email" value={profile.email ?? "Not provided"} />
        <DetailItem label="Skin Type" value={profile.skinType ?? "Not provided"} />
        <DetailItem
          label="Uses Korean Products"
          value={yesNo(profile.usesKoreanProducts)}
        />
        <DetailItem
          label="Facing Skin Issues"
          value={yesNo(profile.facingSkinIssues)}
        />
        <DetailItem label="Skin Issues" value={joinValues(profile.skinIssues)} />
        <DetailItem
          label="Issue Duration"
          value={profile.skinIssueDuration ?? "Not specified"}
        />
        <DetailItem
          label="Current Products"
          value={joinValues(profile.currentProducts)}
        />
        <DetailItem
          label="Allergic Ingredients"
          value={joinValues(profile.allergicIngredients)}
        />
        <DetailItem
          label="Double Cleanse Preference"
          value={profile.doubleCleansePreference ?? "Not specified"}
        />
        <DetailItem
          label="Sleep Hours"
          value={profile.sleepHours ?? "Not specified"}
        />
        <DetailItem
          label="Water Intake"
          value={profile.waterIntake ?? "Not specified"}
        />
        <DetailItem
          label="Applies Sunscreen"
          value={yesNo(profile.appliesSunscreen)}
        />
        <DetailItem
          label="Regular Period Cycle"
          value={yesNo(profile.regularPeriodCycle)}
        />
        <DetailItem
          label="Used Steroid Based Night Cream"
          value={yesNo(profile.usedSteroidBasedNightCream)}
        />
        <DetailItem
          label="Additional Notes"
          value={profile.note ?? "No additional notes"}
        />
        {profile.updatedAt ? (
          <DetailItem
            label="Last Updated"
            value={profile.updatedAt.toLocaleString()}
          />
        ) : null}
        {profile.createdAt ? (
          <DetailItem
            label="Created At"
            value={profile.createdAt.toLocaleString()}
          />
        ) : null}
      </div>

      {profile.skinImages.length > 0 ? (
        <div className="mt-8">
          <h3 className="text-page text-base font-semibold">
            Client Skin Photos
          </h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {profile.skinImages.map((imageUrl, index) => (
              <a
                key={imageUrl}
                href={imageUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-card border-themed block overflow-hidden rounded-lg border transition-opacity hover:opacity-90"
              >
                <div className="relative aspect-[4/3] w-full">
                  <Image
                    src={imageUrl}
                    alt={`Client skin profile photo ${index + 1}`}
                    fill
                    sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                </div>
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}
