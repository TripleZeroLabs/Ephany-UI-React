import { FormField } from "../FormField";

export type VendorFormValues = {
  name: string;
  website: string;
  contact_email: string;
};

type Props = {
  values: VendorFormValues;
  onChange: (field: keyof VendorFormValues, value: string) => void;
  errors: Record<string, string>;
};

export function VendorForm({ values, onChange, errors }: Props) {
  return (
    <div className="space-y-4">
      <FormField
        label="Name"
        required
        value={values.name}
        onChange={(e) => onChange("name", e.target.value)}
        error={errors.name}
        placeholder="e.g. Sysco"
      />
      <FormField
        label="Website"
        type="url"
        value={values.website}
        onChange={(e) => onChange("website", e.target.value)}
        error={errors.website}
        placeholder="https://example.com"
      />
      <FormField
        label="Contact Email"
        type="email"
        value={values.contact_email}
        onChange={(e) => onChange("contact_email", e.target.value)}
        error={errors.contact_email}
        placeholder="contact@example.com"
      />
    </div>
  );
}
