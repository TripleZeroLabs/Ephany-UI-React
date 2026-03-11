import { FormField } from "../FormField";

export type AttributeFormValues = {
  name: string;
  scope: "type" | "instance" | "both";
  data_type: "str" | "int" | "float" | "bool";
  unit_type: string;
};

type Props = {
  values: AttributeFormValues;
  onChange: (field: keyof AttributeFormValues, value: string) => void;
  errors: Record<string, string>;
};

const UNIT_TYPES = [
  { value: "none", label: "No Unit (Text / Bool / Int)" },
  { value: "autodesk.spec.aec:length-2.0.0", label: "Length" },
  { value: "autodesk.spec.aec:distance-1.0.0", label: "Distance" },
  { value: "autodesk.spec.aec:area-2.0.0", label: "Area" },
  { value: "autodesk.spec.aec:volume-2.0.0", label: "Volume" },
  { value: "autodesk.spec.aec:mass-2.0.0", label: "Mass / Weight" },
  { value: "autodesk.spec.aec:massDensity-2.0.0", label: "Density" },
  { value: "autodesk.spec.aec:angle-2.0.0", label: "Angle" },
  { value: "autodesk.spec.aec:slope-2.0.0", label: "Slope" },
  { value: "autodesk.spec.aec:number-2.0.0", label: "Number (Unitless)" },
];

export function AttributeForm({ values, onChange, errors }: Props) {
  return (
    <div className="space-y-4">
      <FormField
        label="Name"
        required
        value={values.name}
        onChange={(e) => onChange("name", e.target.value)}
        error={errors.name}
        placeholder="e.g. door_type (lowercase, underscores)"
      />
      <FormField
        as="select"
        label="Scope"
        required
        value={values.scope}
        onChange={(e) => onChange("scope", e.target.value)}
        error={errors.scope}
      >
        <option value="type">Asset Type (Catalog)</option>
        <option value="instance">Asset Instance (Project)</option>
        <option value="both">Both</option>
      </FormField>
      <FormField
        as="select"
        label="Data Type"
        required
        value={values.data_type}
        onChange={(e) => onChange("data_type", e.target.value)}
        error={errors.data_type}
      >
        <option value="str">Text</option>
        <option value="int">Whole Number</option>
        <option value="float">Decimal</option>
        <option value="bool">Yes / No</option>
      </FormField>
      <FormField
        as="select"
        label="Unit Type"
        required
        value={values.unit_type}
        onChange={(e) => onChange("unit_type", e.target.value)}
        error={errors.unit_type}
      >
        {UNIT_TYPES.map((u) => (
          <option key={u.value} value={u.value}>
            {u.label}
          </option>
        ))}
      </FormField>
    </div>
  );
}
