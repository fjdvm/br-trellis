export interface ContactFieldErrors {
  name?: string;
  email?: string;
  phone?: string;
}

export function validateContactFields(fields: {
  name: string;
  email: string;
  phone: string;
}): ContactFieldErrors {
  const errors: ContactFieldErrors = {};

  // Name: required, min 2 chars
  if (!fields.name.trim()) {
    errors.name = "Name is required.";
  } else if (fields.name.trim().length < 2) {
    errors.name = "Name must be at least 2 characters.";
  } else if (fields.name.trim().length > 100) {
    errors.name = "Name must be 100 characters or less.";
  }

  // Email: required, valid format
  if (!fields.email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email.trim())) {
    errors.email = "Please enter a valid email address.";
  }

  // Phone: optional, but if provided must be valid
  if (fields.phone.trim() && !/^[+]?[\d\s\-().]{7,20}$/.test(fields.phone.trim())) {
    errors.phone = "Please enter a valid phone number.";
  }

  return errors;
}

export function hasErrors(errors: ContactFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
