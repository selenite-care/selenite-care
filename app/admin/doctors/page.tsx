"use client";

import {
  FormEvent,
  type MutableRefObject,
  useEffect,
  useRef,
  useState,
} from "react";
import FileUploadButton from "@/components/ui/FileUploadButton";

type Doctor = {
  id: string;
  name: string;
  designation: string;
  specialization: "AESTHETICIAN" | "NUTRITIONIST" | "PSYCHIATRIST";
  availability: string;
  bio: string | null;
  image: string | null;
  isActive: boolean;
};

type DoctorFormState = {
  name: string;
  email: string;
  designation: string;
  specialization: "AESTHETICIAN" | "NUTRITIONIST" | "PSYCHIATRIST";
  selectedDays: string[];
  startTime: string;
  endTime: string;
  bio: string;
};

type DoctorCredentials = {
  name: string;
  email: string;
  temporaryPassword: string;
};

const emptyForm: DoctorFormState = {
  name: "",
  email: "",
  designation: "",
  specialization: "AESTHETICIAN",
  selectedDays: ["Wed", "Thu", "Fri"],
  startTime: "1PM",
  endTime: "5PM",
  bio: "",
};

const dayOptions = [
  { value: "Sun", label: "Sunday" },
  { value: "Mon", label: "Monday" },
  { value: "Tue", label: "Tuesday" },
  { value: "Wed", label: "Wednesday" },
  { value: "Thu", label: "Thursday" },
  { value: "Fri", label: "Friday" },
  { value: "Sat", label: "Saturday" },
] as const;
const specializationOptions = [
  { value: "AESTHETICIAN", label: "Aesthetician" },
  { value: "NUTRITIONIST", label: "Nutritionist" },
  { value: "PSYCHIATRIST", label: "Psychiatrist" },
] as const;

const timeOptions = [
  "6AM",
  "7AM",
  "8AM",
  "9AM",
  "10AM",
  "11AM",
  "12PM",
  "1PM",
  "2PM",
  "3PM",
  "4PM",
  "5PM",
  "6PM",
  "7PM",
  "8PM",
  "9PM",
  "10PM",
];

const inputClassName =
  "mt-2 h-11 w-full rounded-md border bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#B87B68] focus:ring-1 focus:ring-[#B87B68] dark:border-[#3D3530] dark:bg-[#1E1C1A] dark:text-[#F0EDE8]";
const textareaClassName =
  "mt-2 w-full resize-none rounded-md border bg-white px-3 py-3 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#B87B68] focus:ring-1 focus:ring-[#B87B68] dark:border-[#3D3530] dark:bg-[#1E1C1A] dark:text-[#F0EDE8]";

function isDayOption(value: string): value is (typeof dayOptions)[number]["value"] {
  return dayOptions.some((day) => day.value === value);
}

function expandDayToken(token: string) {
  const normalizedToken = token.replaceAll("Ã¢â‚¬â€œ", "–").replaceAll("-", "–");
  const orderedDays = dayOptions.map((day) => day.value);

  if (!normalizedToken.includes("–")) {
    return isDayOption(normalizedToken) ? [normalizedToken] : [];
  }

  const [startDay, endDay] = normalizedToken.split("–").map((part) => part.trim());

  if (!isDayOption(startDay) || !isDayOption(endDay)) {
    return [];
  }

  const startIndex = orderedDays.indexOf(startDay);
  const endIndex = orderedDays.indexOf(endDay);

  if (startIndex === -1 || endIndex === -1) {
    return [];
  }

  if (startIndex <= endIndex) {
    return orderedDays.slice(startIndex, endIndex + 1);
  }

  return [...orderedDays.slice(startIndex), ...orderedDays.slice(0, endIndex + 1)];
}

function parseAvailability(availability: string) {
  const defaults = {
    selectedDays: [...emptyForm.selectedDays],
    startTime: emptyForm.startTime,
    endTime: emptyForm.endTime,
  };

  const normalized = availability
    .replaceAll("Ã¢â‚¬â€œ", "–")
    .replaceAll("-", "–")
    .trim();
  const segments = normalized
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const timeSegmentIndex = segments.findLastIndex(
    (segment) => /(?:AM|PM)/i.test(segment) && segment.includes("–"),
  );

  if (timeSegmentIndex === -1) {
    return defaults;
  }

  const dayTokens = segments.slice(0, timeSegmentIndex);
  const timesPart = segments[timeSegmentIndex];
  const [startTime, endTime] = timesPart.split("–").map((part) => part.trim());
  const selectedDays = Array.from(
    new Set(dayTokens.flatMap((token) => expandDayToken(token))),
  );

  return {
    selectedDays: selectedDays.length > 0 ? selectedDays : defaults.selectedDays,
    startTime: timeOptions.includes(startTime) ? startTime : defaults.startTime,
    endTime: timeOptions.includes(endTime) ? endTime : defaults.endTime,
  };
}

function formatStructuredAvailability(form: DoctorFormState) {
  return `${form.selectedDays.join(", ")}, ${form.startTime}\u2013${form.endTime}`;
}

function toggleSelectedDay(selectedDays: string[], dayValue: string) {
  if (selectedDays.includes(dayValue)) {
    return selectedDays.filter((day) => day !== dayValue);
  }

  return dayOptions
    .map((day) => day.value)
    .filter((day) => [...selectedDays, dayValue].includes(day));
}
export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [form, setForm] = useState<DoctorFormState>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const imagePreviewRef = useRef("");
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [editForm, setEditForm] = useState<DoctorFormState>(emptyForm);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState("");
  const editImagePreviewRef = useRef("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [updatingDoctorId, setUpdatingDoctorId] = useState<string | null>(null);
  const [doctorCredentials, setDoctorCredentials] =
    useState<DoctorCredentials | null>(null);
  const [isPasswordCopied, setIsPasswordCopied] = useState(false);

  async function loadDoctors() {
    setError("");

    try {
      const doctorsRes = await fetch("/api/admin/doctors");

      if (!doctorsRes.ok) {
        throw new Error("Unable to load doctors.");
      }

      const doctorsJson = (await doctorsRes.json().catch(() => null)) as
        | { doctors?: Doctor[]; error?: string }
        | null;

      setDoctors(doctorsJson?.doctors ?? []);
    } catch {
      setError("Unable to load doctors right now.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadDoctors();
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreviewRef.current) {
        URL.revokeObjectURL(imagePreviewRef.current);
      }

      if (editImagePreviewRef.current) {
        URL.revokeObjectURL(editImagePreviewRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!successMessage) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setSuccessMessage("");
    }, 3000);

    return () => window.clearTimeout(timeout);
  }, [successMessage]);

  function updateImageFile(
    file: File | null,
    options: {
      setFile: (file: File | null) => void;
      setPreview: (value: string) => void;
      previewRef: MutableRefObject<string>;
    },
  ) {
    if (options.previewRef.current) {
      URL.revokeObjectURL(options.previewRef.current);
      options.previewRef.current = "";
    }

    options.setFile(file);

    if (!file) {
      options.setPreview("");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    options.previewRef.current = previewUrl;
    options.setPreview(previewUrl);
  }

  function resetAddForm() {
    setForm(emptyForm);
    updateImageFile(null, {
      setFile: setImageFile,
      setPreview: setImagePreview,
      previewRef: imagePreviewRef,
    });
  }

  function closeEditModal() {
    setEditingDoctor(null);
    setEditForm(emptyForm);
    updateImageFile(null, {
      setFile: setEditImageFile,
      setPreview: setEditImagePreview,
      previewRef: editImagePreviewRef,
    });
  }

  function openEditModal(doctor: Doctor) {
    const availability = parseAvailability(doctor.availability);

    setEditForm({
      name: doctor.name,
      email: "",
      designation: doctor.designation,
      specialization: doctor.specialization,
      selectedDays: availability.selectedDays,
      startTime: availability.startTime,
      endTime: availability.endTime,
      bio: doctor.bio ?? "",
    });
    updateImageFile(null, {
      setFile: setEditImageFile,
      setPreview: setEditImagePreview,
      previewRef: editImagePreviewRef,
    });
    setEditingDoctor(doctor);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (form.selectedDays.length === 0) {
      setError("Please select at least one available day.");
      return;
    }

    setIsSubmitting(true);

    let image = "";

    try {
      if (imageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", imageFile);

        const uploadResponse = await fetch("/api/admin/upload", {
          method: "POST",
          body: uploadFormData,
        });

        const uploadData = (await uploadResponse.json().catch(() => null)) as
          | {
              secure_url?: string;
              error?: string;
            }
          | null;

        if (!uploadResponse.ok || !uploadData?.secure_url) {
          throw new Error(uploadData?.error ?? "Unable to upload doctor image.");
        }

        image = uploadData.secure_url;
      }

      const response = await fetch("/api/admin/doctors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          designation: form.designation,
          specialization: form.specialization,
          availability: formatStructuredAvailability(form),
          bio: form.bio,
          image,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | {
            credentials?: DoctorCredentials;
            error?: string;
          }
        | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to save doctor.");
      }

      if (data?.credentials) {
        setDoctorCredentials(data.credentials);
        setIsPasswordCopied(false);
      }

      resetAddForm();
      setSuccessMessage("Doctor added successfully.");
      await loadDoctors();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save doctor.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingDoctor) {
      return;
    }

    setError("");
    setSuccessMessage("");

    if (editForm.selectedDays.length === 0) {
      setError("Please select at least one available day.");
      return;
    }

    setIsEditSubmitting(true);

    let image = editingDoctor.image ?? "";

    try {
      if (editImageFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", editImageFile);

        const uploadResponse = await fetch("/api/admin/upload", {
          method: "POST",
          body: uploadFormData,
        });

        const uploadData = (await uploadResponse.json().catch(() => null)) as
          | {
              secure_url?: string;
              error?: string;
            }
          | null;

        if (!uploadResponse.ok || !uploadData?.secure_url) {
          throw new Error(uploadData?.error ?? "Unable to upload doctor image.");
        }

        image = uploadData.secure_url;
      }

      const response = await fetch(`/api/admin/doctors/${editingDoctor.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editForm.name,
          designation: editForm.designation,
          specialization: editForm.specialization,
          availability: formatStructuredAvailability(editForm),
          bio: editForm.bio,
          image,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | {
            error?: string;
          }
        | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "Unable to update doctor.");
      }

      closeEditModal();
      setSuccessMessage("Doctor updated successfully.");
      await loadDoctors();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update doctor.");
    } finally {
      setIsEditSubmitting(false);
    }
  }

  async function handleStatusToggle(doctorId: string, isActive: boolean) {
    setError("");
    setSuccessMessage("");
    setUpdatingDoctorId(doctorId);

    const response = await fetch(`/api/admin/doctors/${doctorId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ isActive }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as
        | {
            error?: string;
          }
        | null;

      setError(data?.error ?? "Unable to update doctor status.");
      setUpdatingDoctorId(null);
      return;
    }

    await loadDoctors();
    setUpdatingDoctorId(null);
  }

  async function copyTemporaryPassword() {
    if (!doctorCredentials?.temporaryPassword) {
      return;
    }

    try {
      await navigator.clipboard.writeText(doctorCredentials.temporaryPassword);
      setIsPasswordCopied(true);
    } catch {
      setError("Unable to copy password. Please select and copy it manually.");
    }
  }

  return (
    <section className="min-h-screen space-y-8 bg-[#F8F5F0] px-6 py-10 dark:bg-[#1A1814]">
      {editingDoctor ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-doctor-title"
          className="modal-overlay fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
          style={{ backgroundColor: "rgba(43, 43, 43, 0.72)" }}
        >
          <div
            className="modal-card max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-[#EADDCD] bg-white p-6 shadow-2xl dark:border-[#3D3530] dark:bg-[#242220]"
            style={{
              boxShadow: "0 24px 80px rgba(43, 43, 43, 0.28)",
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="edit-doctor-title"
                  className="text-xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
                  style={{
                    fontFamily: "Playfair Display, serif",
                  }}
                >
                  Edit Doctor
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#884F38] dark:text-[#8A7D75]">
                  Update the doctor&apos;s profile, availability, specialization,
                  and image.
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className="inline-flex h-10 items-center justify-center rounded-md border border-[#EADDCD] bg-white px-4 text-sm font-medium text-[#2B2B2B] transition-colors hover:bg-[#B87B68]/10 dark:border-[#3D3530] dark:bg-[#242220] dark:text-[#F0EDE8]"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="mt-6 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                <div>
                  <label htmlFor="edit-name" className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                    Name
                  </label>
                  <input
                    id="edit-name"
                    value={editForm.name}
                    onChange={(event) =>
                      setEditForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    required
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label htmlFor="edit-designation" className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                    Designation
                  </label>
                  <input
                    id="edit-designation"
                    value={editForm.designation}
                    onChange={(event) =>
                      setEditForm((current) => ({
                        ...current,
                        designation: event.target.value,
                      }))
                    }
                    required
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label htmlFor="edit-specialization" className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                    Specialization
                  </label>
                  <select
                    id="edit-specialization"
                    value={editForm.specialization}
                    onChange={(event) =>
                      setEditForm((current) => ({
                        ...current,
                        specialization:
                          event.target.value as DoctorFormState["specialization"],
                      }))
                    }
                    required
                    className={inputClassName}
                  >
                    {specializationOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <p className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                  Availability
                </p>
                <div
                  className="mt-2 rounded-lg border border-[#EADDCD] bg-[#F8F5F0] p-4 dark:border-[#3D3530] dark:bg-[#2A2724]"
                >
                  <p className="text-sm font-medium text-[#884F38] dark:text-[#8A7D75]">
                    Available Days
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {dayOptions.map((day) => (
                      <label
                        key={day.value}
                        className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm transition-colors"
                        style={{
                          borderColor: editForm.selectedDays.includes(day.value)
                            ? "#B87B68"
                            : "#EADDCD",
                          backgroundColor: editForm.selectedDays.includes(day.value)
                            ? "#FFF8EC"
                            : "#FFFFFF",
                          color: "#2B2B2B",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={editForm.selectedDays.includes(day.value)}
                          onChange={() =>
                            setEditForm((current) => ({
                              ...current,
                              selectedDays: toggleSelectedDay(
                                current.selectedDays,
                                day.value,
                              ),
                            }))
                          }
                          className="h-4 w-4 accent-[#B87B68]"
                        />
                        <span>{day.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="edit-startTime" className="block text-sm font-medium text-[#884F38] dark:text-[#8A7D75]">
                      Start Time
                    </label>
                    <select
                      id="edit-startTime"
                      value={editForm.startTime}
                      onChange={(event) =>
                        setEditForm((current) => ({
                          ...current,
                          startTime: event.target.value,
                        }))
                      }
                      required
                      className={inputClassName}
                    >
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="edit-endTime" className="block text-sm font-medium text-[#884F38] dark:text-[#8A7D75]">
                      End Time
                    </label>
                    <select
                      id="edit-endTime"
                      value={editForm.endTime}
                      onChange={(event) =>
                        setEditForm((current) => ({
                          ...current,
                          endTime: event.target.value,
                        }))
                      }
                      required
                      className={inputClassName}
                    >
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {editForm.selectedDays.length === 0 ? (
                  <p className="mt-2 text-sm text-red-600">
                    Please select at least one available day.
                  </p>
                ) : null}
                <p className="mt-2 text-sm text-[#884F38] dark:text-[#8A7D75]">
                  Preview: {formatStructuredAvailability(editForm)}
                </p>
              </div>

              <div>
                <label htmlFor="edit-bio" className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                  Bio
                </label>
                <textarea
                  id="edit-bio"
                  value={editForm.bio}
                  onChange={(event) =>
                    setEditForm((current) => ({
                      ...current,
                      bio: event.target.value,
                    }))
                  }
                  rows={4}
                  className={textareaClassName}
                />
              </div>

              <div>
                <label htmlFor="edit-doctor-image" className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                  Profile Image
                </label>
                <div className="mt-2">
                  <FileUploadButton
                    onFileSelected={(file) =>
                      updateImageFile(file, {
                        setFile: setEditImageFile,
                        setPreview: setEditImagePreview,
                        previewRef: editImagePreviewRef,
                      })
                    }
                    label="Choose Image"
                    accept="image/*"
                    currentPreviewUrl={editImagePreview || editingDoctor.image || undefined}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="inline-flex h-11 items-center justify-center rounded-md border border-[#EADDCD] bg-white px-5 text-sm font-medium text-[#2B2B2B] transition-colors hover:bg-[#F8F5F0] dark:border-[#3D3530] dark:bg-[#242220] dark:text-[#F0EDE8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditSubmitting || editForm.selectedDays.length === 0}
                  className="inline-flex h-11 items-center justify-center rounded-md bg-[#2B2B2B] px-5 text-sm font-medium text-[#F8F5F0] transition-colors hover:bg-[#884F38] disabled:cursor-not-allowed disabled:opacity-70 dark:bg-[#B87B68] dark:text-[#141210]"
                >
                  {isEditSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {doctorCredentials ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="doctor-created-title"
          className="modal-overlay fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
          style={{ backgroundColor: "rgba(43, 43, 43, 0.72)" }}
        >
          <div
            className="modal-card max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-[#EADDCD] bg-white p-6 shadow-2xl dark:border-[#3D3530] dark:bg-[#242220]"
            style={{
              boxShadow: "0 24px 80px rgba(43, 43, 43, 0.28)",
            }}
          >
            <h2
              id="doctor-created-title"
              className="text-xl font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
              style={{
                fontFamily: "Playfair Display, serif",
              }}
            >
              Doctor Added Successfully
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#884F38] dark:text-[#8A7D75]">
              Share these credentials with the doctor securely. This password will
              not be shown again after closing this dialog.
            </p>

            <div
              className="mt-5 space-y-4 rounded-lg border border-[#EADDCD] bg-[#F8F5F0] p-4 dark:border-[#3D3530] dark:bg-[#2A2724]"
            >
              <div>
                <p
                  className="text-xs font-medium uppercase tracking-wide text-[#884F38] dark:text-[#8A7D75]"
                >
                  Doctor Name
                </p>
                <p
                  className="mt-1 break-all font-mono text-sm text-[#2B2B2B] dark:text-[#F0EDE8]"
                >
                  {doctorCredentials.name}
                </p>
              </div>

              <div>
                <p
                  className="text-xs font-medium uppercase tracking-wide text-[#884F38] dark:text-[#8A7D75]"
                >
                  Email
                </p>
                <p
                  className="mt-1 break-all font-mono text-sm text-[#2B2B2B] dark:text-[#F0EDE8]"
                >
                  {doctorCredentials.email}
                </p>
              </div>

              <div>
                <p
                  className="text-xs font-medium uppercase tracking-wide text-[#884F38] dark:text-[#8A7D75]"
                >
                  Temporary Password
                </p>
                <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <code
                    className="flex-1 rounded-md border border-[#EADDCD] bg-white px-3 py-2 text-sm font-semibold text-[#2B2B2B] dark:border-[#3D3530] dark:bg-[#1E1C1A] dark:text-[#F0EDE8]"
                  >
                    {doctorCredentials.temporaryPassword}
                  </code>
                  <button
                    type="button"
                    onClick={copyTemporaryPassword}
                    className="inline-flex h-10 items-center justify-center rounded-md bg-[#2B2B2B] px-4 text-sm font-medium text-[#F8F5F0] transition-colors hover:opacity-90 dark:bg-[#B87B68] dark:text-[#141210]"
                  >
                    {isPasswordCopied ? "Copied" : "Copy Password"}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setDoctorCredentials(null)}
                className="inline-flex h-10 items-center justify-center rounded-md border border-[#B87B68] bg-white px-4 text-sm font-medium text-[#2B2B2B] transition-colors hover:bg-[#B87B68]/10 dark:bg-[#242220] dark:text-[#F0EDE8]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div>
        <h1
          className="text-3xl font-semibold tracking-tight text-[#2B2B2B] dark:text-[#F0EDE8]"
          style={{
            fontFamily: "Playfair Display, serif",
          }}
        >
          Doctors
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#884F38] dark:text-[#8A7D75]">
          Manage doctor profiles and keep their availability up to date.
        </p>
        {successMessage ? (
          <p className="mt-3 text-sm text-green-700">{successMessage}</p>
        ) : null}
      </div>

      {isLoading ? (
        <p className="text-sm text-[#884F38] dark:text-[#8A7D75]">
          Loading doctors...
        </p>
      ) : (
        <>
          <div className="rounded-2xl border border-themed bg-card shadow-sm">
            <div className="border-b border-[#EADDCD] bg-[#F4ECE3] px-6 py-4 dark:border-[#3D3530] dark:bg-[#2A2724]">
              <h2
                className="text-lg font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                All Doctors
              </h2>
            </div>

            {doctors.length === 0 ? (
              <p className="px-6 py-6 text-sm text-[#884F38] dark:text-[#8A7D75]">
                No doctors added yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table-themed w-full min-w-[820px] text-left text-sm">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 font-medium">Name</th>
                      <th className="px-6 py-3 font-medium">Designation</th>
                      <th className="px-6 py-3 font-medium">Specialization</th>
                      <th className="px-6 py-3 font-medium">Availability</th>
                      <th className="px-6 py-3 font-medium">Bio</th>
                      <th className="px-6 py-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctors.map((doctor) => (
                      <tr key={doctor.id}>
                        <td className="px-6 py-4 font-medium">
                          <div className="flex items-center gap-3">
                            <span>{doctor.name}</span>
                            {!doctor.isActive ? (
                              <span
                                className="inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]"
                                style={{
                                  backgroundColor: "rgba(239, 68, 68, 0.12)",
                                  color: "#B91C1C",
                                }}
                              >
                                Inactive
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="cell-muted px-6 py-4">
                          {doctor.designation}
                        </td>
                        <td className="cell-muted px-6 py-4">
                          {specializationOptions.find(
                            (option) => option.value === doctor.specialization,
                          )?.label ?? doctor.specialization}
                        </td>
                        <td className="cell-muted px-6 py-4">
                          {doctor.availability}
                        </td>
                        <td className="cell-muted max-w-sm px-6 py-4">
                          {doctor.bio ?? "Not provided"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => openEditModal(doctor)}
                              className="inline-flex h-9 items-center justify-center rounded-md border border-[#EADDCD] bg-white px-3 text-sm font-medium text-[#2B2B2B] transition-colors hover:bg-[#F8F5F0] dark:border-[#3D3530] dark:bg-[#242220] dark:text-[#F0EDE8]"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleStatusToggle(doctor.id, !doctor.isActive)
                              }
                              disabled={updatingDoctorId === doctor.id}
                              className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                              style={{
                                borderColor: doctor.isActive ? "#E5B4B4" : "#B87B68",
                                color: doctor.isActive ? "#B91C1C" : "#2B2B2B",
                                backgroundColor: doctor.isActive ? "#FFF7F7" : "#FFFFFF",
                              }}
                            >
                              {updatingDoctorId === doctor.id
                                ? "Updating..."
                                : doctor.isActive
                                  ? "Deactivate"
                                  : "Reactivate"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div
            className="rounded-2xl border border-[#EADDCD] bg-white p-6 shadow-sm dark:border-[#3D3530] dark:bg-[#242220]"
          >
            <h2
              className="text-lg font-semibold text-[#2B2B2B] dark:text-[#F0EDE8]"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Add Doctor
            </h2>
            <form onSubmit={handleSubmit} className="mt-5 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                    Name
                  </label>
                  <input
                    id="name"
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    required
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    required
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label htmlFor="designation" className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                    Designation
                  </label>
                  <input
                    id="designation"
                    value={form.designation}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        designation: event.target.value,
                      }))
                    }
                    required
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label htmlFor="specialization" className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                    Specialization
                  </label>
                  <select
                    id="specialization"
                    value={form.specialization}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        specialization: event.target.value as DoctorFormState["specialization"],
                      }))
                    }
                    required
                    className={inputClassName}
                  >
                    {specializationOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <p className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                  Availability
                </p>
                <div
                  className="mt-2 rounded-lg border border-[#EADDCD] bg-[#F8F5F0] p-4 dark:border-[#3D3530] dark:bg-[#2A2724]"
                >
                  <p className="text-sm font-medium text-[#884F38] dark:text-[#8A7D75]">
                    Available Days
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {dayOptions.map((day) => (
                      <label
                        key={day.value}
                        className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-sm transition-colors"
                        style={{
                          borderColor: form.selectedDays.includes(day.value)
                            ? "#B87B68"
                            : "#EADDCD",
                          backgroundColor: form.selectedDays.includes(day.value)
                            ? "#FFF8EC"
                            : "#FFFFFF",
                          color: "#2B2B2B",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={form.selectedDays.includes(day.value)}
                          onChange={() =>
                            setForm((current) => ({
                              ...current,
                              selectedDays: toggleSelectedDay(
                                current.selectedDays,
                                day.value,
                              ),
                            }))
                          }
                          className="h-4 w-4 accent-[#B87B68]"
                        />
                        <span>{day.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mt-5 grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="startTime" className="block text-sm font-medium text-[#884F38] dark:text-[#8A7D75]">
                      Start Time
                    </label>
                    <select
                      id="startTime"
                      value={form.startTime}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          startTime: event.target.value,
                        }))
                      }
                      required
                      className={inputClassName}
                    >
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="endTime" className="block text-sm font-medium text-[#884F38] dark:text-[#8A7D75]">
                      End Time
                    </label>
                    <select
                      id="endTime"
                      value={form.endTime}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          endTime: event.target.value,
                        }))
                      }
                      required
                      className={inputClassName}
                    >
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {form.selectedDays.length === 0 ? (
                  <p className="mt-2 text-sm text-red-600">
                    Please select at least one available day.
                  </p>
                ) : null}
                <p className="mt-2 text-sm text-[#884F38] dark:text-[#8A7D75]">
                  Preview: {formatStructuredAvailability(form)}
                </p>
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                  Bio
                </label>
                <textarea
                  id="bio"
                  value={form.bio}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      bio: event.target.value,
                    }))
                  }
                  rows={4}
                  className={textareaClassName}
                />
              </div>

              <div>
                <label htmlFor="doctor-image" className="block text-sm font-medium text-[#2B2B2B] dark:text-[#F0EDE8]">
                  Image
                </label>
                <div className="mt-2">
                  <FileUploadButton
                    onFileSelected={(file) =>
                      updateImageFile(file, {
                        setFile: setImageFile,
                        setPreview: setImagePreview,
                        previewRef: imagePreviewRef,
                      })
                    }
                    label="Choose Image"
                    accept="image/*"
                    currentPreviewUrl={imagePreview || undefined}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div>
                  {error ? <p className="text-sm text-red-600">{error}</p> : null}
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || form.selectedDays.length === 0}
                  className="inline-flex h-11 items-center justify-center rounded-md bg-[#2B2B2B] px-5 text-sm font-medium text-[#F8F5F0] transition-colors hover:bg-[#884F38] disabled:cursor-not-allowed disabled:opacity-70 dark:bg-[#B87B68] dark:text-[#141210]"
                >
                  {isSubmitting ? "Saving..." : "Add Doctor"}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </section>
  );
}

