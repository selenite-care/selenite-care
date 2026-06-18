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
  startDay: string;
  endDay: string;
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
  startDay: "Wed",
  endDay: "Fri",
  startTime: "1PM",
  endTime: "5PM",
  bio: "",
};

const dayOptions = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
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
  "mt-2 h-11 w-full rounded-md border bg-white px-3 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B]";
const textareaClassName =
  "mt-2 w-full resize-none rounded-md border bg-white px-3 py-3 text-sm text-[#2B2B2B] outline-none transition-colors focus:border-[#C6A56B] focus:ring-1 focus:ring-[#C6A56B]";
const inputStyle = { borderColor: "#D8C7B5" } as const;

function formatAvailability(form: DoctorFormState) {
  return `${form.startDay}–${form.endDay}, ${form.startTime}–${form.endTime}`;
}

function parseAvailability(availability: string) {
  const defaults = {
    startDay: emptyForm.startDay,
    endDay: emptyForm.endDay,
    startTime: emptyForm.startTime,
    endTime: emptyForm.endTime,
  };

  const normalized = availability
    .replaceAll("â€“", "–")
    .replaceAll("-", "–")
    .trim();
  const [daysPart, timesPart] = normalized.split(",").map((part) => part.trim());

  if (!daysPart || !timesPart) {
    return defaults;
  }

  const [startDay, endDay] = daysPart.split("–").map((part) => part.trim());
  const [startTime, endTime] = timesPart.split("–").map((part) => part.trim());

  return {
    startDay: dayOptions.includes(startDay) ? startDay : defaults.startDay,
    endDay: dayOptions.includes(endDay) ? endDay : defaults.endDay,
    startTime: timeOptions.includes(startTime) ? startTime : defaults.startTime,
    endTime: timeOptions.includes(endTime) ? endTime : defaults.endTime,
  };
}

function formatStructuredAvailability(form: DoctorFormState) {
  return `${form.startDay}\u2013${form.endDay}, ${form.startTime}\u2013${form.endTime}`;
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
      startDay: availability.startDay,
      endDay: availability.endDay,
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
    <section className="min-h-screen space-y-8 bg-[#F8F5F0] px-6 py-10">
      {editingDoctor ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-doctor-title"
          className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
          style={{ backgroundColor: "rgba(43, 43, 43, 0.72)" }}
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border p-6 shadow-2xl"
            style={{
              backgroundColor: "#FFFFFF",
              borderColor: "#D8C7B5",
              boxShadow: "0 24px 80px rgba(43, 43, 43, 0.28)",
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="edit-doctor-title"
                  className="text-xl font-semibold"
                  style={{
                    color: "#2B2B2B",
                    fontFamily: "Playfair Display, serif",
                  }}
                >
                  Edit Doctor
                </h2>
                <p className="mt-2 text-sm leading-6" style={{ color: "#B8A89A" }}>
                  Update the doctor&apos;s profile, availability, specialization,
                  and image.
                </p>
              </div>
              <button
                type="button"
                onClick={closeEditModal}
                className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium transition-colors hover:bg-[#C6A56B]/10"
                style={{
                  borderColor: "#D8C7B5",
                  color: "#2B2B2B",
                  backgroundColor: "#FFFFFF",
                }}
              >
                Close
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="mt-6 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                <div>
                  <label htmlFor="edit-name" className="block text-sm font-medium" style={{ color: "#2B2B2B" }}>
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
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label htmlFor="edit-designation" className="block text-sm font-medium" style={{ color: "#2B2B2B" }}>
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
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label htmlFor="edit-specialization" className="block text-sm font-medium" style={{ color: "#2B2B2B" }}>
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
                    style={inputStyle}
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
                <p className="block text-sm font-medium" style={{ color: "#2B2B2B" }}>
                  Availability
                </p>
                <div className="mt-2 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <label htmlFor="edit-startDay" className="block text-sm font-medium" style={{ color: "#6E6257" }}>
                      Start Day
                    </label>
                    <select
                      id="edit-startDay"
                      value={editForm.startDay}
                      onChange={(event) =>
                        setEditForm((current) => ({
                          ...current,
                          startDay: event.target.value,
                        }))
                      }
                      required
                      className={inputClassName}
                      style={inputStyle}
                    >
                      {dayOptions.map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="edit-endDay" className="block text-sm font-medium" style={{ color: "#6E6257" }}>
                      End Day
                    </label>
                    <select
                      id="edit-endDay"
                      value={editForm.endDay}
                      onChange={(event) =>
                        setEditForm((current) => ({
                          ...current,
                          endDay: event.target.value,
                        }))
                      }
                      required
                      className={inputClassName}
                      style={inputStyle}
                    >
                      {dayOptions.map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="edit-startTime" className="block text-sm font-medium" style={{ color: "#6E6257" }}>
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
                      style={inputStyle}
                    >
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="edit-endTime" className="block text-sm font-medium" style={{ color: "#6E6257" }}>
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
                      style={inputStyle}
                    >
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="mt-2 text-sm" style={{ color: "#8C7967" }}>
                  Preview: {formatStructuredAvailability(editForm)}
                </p>
              </div>

              <div>
                <label htmlFor="edit-bio" className="block text-sm font-medium" style={{ color: "#2B2B2B" }}>
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
                  style={inputStyle}
                />
              </div>

              <div>
                <label htmlFor="edit-doctor-image" className="block text-sm font-medium" style={{ color: "#2B2B2B" }}>
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
                  className="inline-flex h-11 items-center justify-center rounded-md border px-5 text-sm font-medium transition-colors hover:bg-[#F8F5F0]"
                  style={{
                    borderColor: "#D8C7B5",
                    color: "#2B2B2B",
                    backgroundColor: "#FFFFFF",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEditSubmitting}
                  className="inline-flex h-11 items-center justify-center rounded-md px-5 text-sm font-medium transition-colors hover:bg-[#B8A89A] disabled:cursor-not-allowed disabled:opacity-70"
                  style={{ backgroundColor: "#2B2B2B", color: "#F8F5F0" }}
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
          className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
          style={{ backgroundColor: "rgba(43, 43, 43, 0.72)" }}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border p-6 shadow-2xl"
            style={{
              backgroundColor: "#FFFFFF",
              borderColor: "#D8C7B5",
              boxShadow: "0 24px 80px rgba(43, 43, 43, 0.28)",
            }}
          >
            <h2
              id="doctor-created-title"
              className="text-xl font-semibold"
              style={{
                color: "#2B2B2B",
                fontFamily: "Playfair Display, serif",
              }}
            >
              Doctor Added Successfully
            </h2>
            <p className="mt-3 text-sm leading-6" style={{ color: "#B8A89A" }}>
              Share these credentials with the doctor securely. This password will
              not be shown again after closing this dialog.
            </p>

            <div
              className="mt-5 space-y-4 rounded-lg border p-4"
              style={{
                backgroundColor: "#F8F5F0",
                borderColor: "#D8C7B5",
              }}
            >
              <div>
                <p
                  className="text-xs font-medium uppercase tracking-wide"
                  style={{ color: "#B8A89A" }}
                >
                  Doctor Name
                </p>
                <p
                  className="mt-1 break-all font-mono text-sm"
                  style={{ color: "#2B2B2B" }}
                >
                  {doctorCredentials.name}
                </p>
              </div>

              <div>
                <p
                  className="text-xs font-medium uppercase tracking-wide"
                  style={{ color: "#B8A89A" }}
                >
                  Email
                </p>
                <p
                  className="mt-1 break-all font-mono text-sm"
                  style={{ color: "#2B2B2B" }}
                >
                  {doctorCredentials.email}
                </p>
              </div>

              <div>
                <p
                  className="text-xs font-medium uppercase tracking-wide"
                  style={{ color: "#B8A89A" }}
                >
                  Temporary Password
                </p>
                <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <code
                    className="flex-1 rounded-md border bg-white px-3 py-2 text-sm font-semibold"
                    style={{
                      borderColor: "#D8C7B5",
                      color: "#2B2B2B",
                    }}
                  >
                    {doctorCredentials.temporaryPassword}
                  </code>
                  <button
                    type="button"
                    onClick={copyTemporaryPassword}
                    className="inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium transition-colors hover:opacity-90"
                    style={{
                      backgroundColor: "#2B2B2B",
                      color: "#F8F5F0",
                    }}
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
                className="inline-flex h-10 items-center justify-center rounded-md border px-4 text-sm font-medium transition-colors hover:bg-[#C6A56B]/10"
                style={{
                  borderColor: "#C6A56B",
                  color: "#2B2B2B",
                  backgroundColor: "#FFFFFF",
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div>
        <h1
          className="text-3xl font-semibold tracking-tight"
          style={{
            color: "#2B2B2B",
            fontFamily: "Playfair Display, serif",
          }}
        >
          Doctors
        </h1>
        <p className="mt-3 text-sm leading-6" style={{ color: "#6E6257" }}>
          Manage doctor profiles and keep their availability up to date.
        </p>
        {successMessage ? (
          <p className="mt-3 text-sm text-green-700">{successMessage}</p>
        ) : null}
      </div>

      {isLoading ? (
        <p className="text-sm" style={{ color: "#6E6257" }}>
          Loading doctors...
        </p>
      ) : (
        <>
          <div
            className="rounded-2xl border bg-white shadow-sm"
            style={{ borderColor: "#D8C7B5" }}
          >
            <div
              className="border-b px-6 py-4"
              style={{ borderColor: "#D8C7B5", backgroundColor: "#F4ECE3" }}
            >
              <h2
                className="text-lg font-semibold"
                style={{ color: "#2B2B2B", fontFamily: "Playfair Display, serif" }}
              >
                All Doctors
              </h2>
            </div>

            {doctors.length === 0 ? (
              <p className="px-6 py-6 text-sm" style={{ color: "#6E6257" }}>
                No doctors added yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px] text-left text-sm">
                  <thead
                    className="border-b"
                    style={{ borderColor: "#D8C7B5", color: "#6E6257" }}
                  >
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
                      <tr
                        key={doctor.id}
                        className="border-b last:border-0"
                        style={{ borderColor: "#EFE4D8" }}
                      >
                        <td className="px-6 py-4 font-medium" style={{ color: "#2B2B2B" }}>
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
                        <td className="px-6 py-4" style={{ color: "#6E6257" }}>
                          {doctor.designation}
                        </td>
                        <td className="px-6 py-4" style={{ color: "#6E6257" }}>
                          {specializationOptions.find(
                            (option) => option.value === doctor.specialization,
                          )?.label ?? doctor.specialization}
                        </td>
                        <td className="px-6 py-4" style={{ color: "#6E6257" }}>
                          {doctor.availability}
                        </td>
                        <td className="max-w-sm px-6 py-4" style={{ color: "#6E6257" }}>
                          {doctor.bio ?? "Not provided"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => openEditModal(doctor)}
                              className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors hover:bg-[#F8F5F0]"
                              style={{
                                borderColor: "#D8C7B5",
                                color: "#2B2B2B",
                                backgroundColor: "#FFFFFF",
                              }}
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
                                borderColor: doctor.isActive ? "#E5B4B4" : "#C6A56B",
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
            className="rounded-2xl border bg-white p-6 shadow-sm"
            style={{ borderColor: "#D8C7B5" }}
          >
            <h2
              className="text-lg font-semibold"
              style={{ color: "#2B2B2B", fontFamily: "Playfair Display, serif" }}
            >
              Add Doctor
            </h2>
            <form onSubmit={handleSubmit} className="mt-5 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium" style={{ color: "#2B2B2B" }}>
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
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium" style={{ color: "#2B2B2B" }}>
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
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label htmlFor="designation" className="block text-sm font-medium" style={{ color: "#2B2B2B" }}>
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
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label htmlFor="specialization" className="block text-sm font-medium" style={{ color: "#2B2B2B" }}>
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
                    style={inputStyle}
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
                <p className="block text-sm font-medium" style={{ color: "#2B2B2B" }}>
                  Availability
                </p>
                <div className="mt-2 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <label htmlFor="startDay" className="block text-sm font-medium" style={{ color: "#6E6257" }}>
                      Start Day
                    </label>
                    <select
                      id="startDay"
                      value={form.startDay}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          startDay: event.target.value,
                        }))
                      }
                      required
                      className={inputClassName}
                      style={inputStyle}
                    >
                      {dayOptions.map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="endDay" className="block text-sm font-medium" style={{ color: "#6E6257" }}>
                      End Day
                    </label>
                    <select
                      id="endDay"
                      value={form.endDay}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          endDay: event.target.value,
                        }))
                      }
                      required
                      className={inputClassName}
                      style={inputStyle}
                    >
                      {dayOptions.map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="startTime" className="block text-sm font-medium" style={{ color: "#6E6257" }}>
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
                      style={inputStyle}
                    >
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="endTime" className="block text-sm font-medium" style={{ color: "#6E6257" }}>
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
                      style={inputStyle}
                    >
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <p className="mt-2 text-sm" style={{ color: "#8C7967" }}>
                  Preview: {formatStructuredAvailability(form)}
                </p>
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium" style={{ color: "#2B2B2B" }}>
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
                  style={inputStyle}
                />
              </div>

              <div>
                <label htmlFor="doctor-image" className="block text-sm font-medium" style={{ color: "#2B2B2B" }}>
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
                  disabled={isSubmitting}
                  className="inline-flex h-11 items-center justify-center rounded-md px-5 text-sm font-medium transition-colors hover:bg-[#B8A89A] disabled:cursor-not-allowed disabled:opacity-70"
                  style={{ backgroundColor: "#2B2B2B", color: "#F8F5F0" }}
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
