import { FormField } from "../FormField";

export type CategoryFormValues = {
  name: string;
  description: string;
};

type Props = {
  values: CategoryFormValues;
  onChange: (field: keyof CategoryFormValues, value: string) => void;
  errors: Record<string, string>;
};

export function CategoryForm({ values, onChange, errors }: Props) {
  return (
    <div className="space-y-4">
      <FormField
        label="Name"
        required
        value={values.name}
        onChange={(e) => onChange("name", e.target.value)}
        error={errors.name}
        placeholder="e.g. Refrigeration"
      />
      <FormField
        as="textarea"
        label="Description"
        value={values.description}
        onChange={(e) => onChange("description", e.target.value)}
        error={errors.description}
        placeholder="Optional description"
      />
    </div>
  );
}
