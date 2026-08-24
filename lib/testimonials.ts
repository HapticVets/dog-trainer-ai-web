export type TestimonialStatus = "pending" | "approved" | "rejected";

export type Testimonial = {
  id: string;
  client_name: string;
  dog_name: string | null;
  rating: number | null;
  testimonial: string;
  status: TestimonialStatus;
  is_featured: boolean;
  source: string | null;
  client_email: string | null;
  photo_path: string | null;
  admin_notes: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  updated_at: string;
};

const optionalText = (value: unknown, limit: number) =>
  typeof value === "string" && value.trim() ? value.trim().slice(0, limit) : null;

export const testimonialColumns = "id, client_name, dog_name, rating, testimonial, status, is_featured, source, client_email, photo_path, admin_notes, submitted_at, reviewed_at, updated_at";

export const parseTestimonialFields = (body: Record<string, unknown>) => {
  const clientName = optionalText(body.clientName, 120);
  const testimonial = optionalText(body.testimonial, 2000);
  const ratingValue = body.rating;
  const rating = ratingValue === null || ratingValue === "" || typeof ratingValue === "undefined"
    ? null
    : Number(ratingValue);

  if (!clientName) throw new Error("Client name is required.");
  if (!testimonial) throw new Error("Testimonial text is required.");
  if (rating !== null && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
    throw new Error("Rating must be between 1 and 5.");
  }

  const clientEmail = optionalText(body.clientEmail, 254);
  return {
    client_name: clientName,
    dog_name: optionalText(body.dogName, 120),
    rating,
    testimonial,
    source: optionalText(body.source, 120),
    client_email: clientEmail?.toLowerCase() ?? null,
    admin_notes: optionalText(body.adminNotes, 2000),
  };
};
