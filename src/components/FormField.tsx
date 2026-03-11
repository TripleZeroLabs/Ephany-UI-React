import { type ReactNode } from "react";

const inputClass =
  "w-full border border-slate-300 dark:border-slate-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500";

type BaseProps = {
  label: string;
  required?: boolean;
  error?: string;
};

type InputProps = BaseProps & React.InputHTMLAttributes<HTMLInputElement> & { as?: "input" };
type TextareaProps = BaseProps & React.TextareaHTMLAttributes<HTMLTextAreaElement> & { as: "textarea" };
type SelectProps = BaseProps & React.SelectHTMLAttributes<HTMLSelectElement> & {
  as: "select";
  children: ReactNode;
};

type FormFieldProps = InputProps | TextareaProps | SelectProps;

export function FormField(props: FormFieldProps) {
  const { label, required, error, as = "input", ...rest } = props;

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {as === "textarea" ? (
        <textarea
          {...(rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          className={`${inputClass} resize-y min-h-[80px]`}
        />
      ) : as === "select" ? (
        <select
          {...(rest as React.SelectHTMLAttributes<HTMLSelectElement>)}
          className={inputClass}
        >
          {(rest as SelectProps).children}
        </select>
      ) : (
        <input
          {...(rest as React.InputHTMLAttributes<HTMLInputElement>)}
          className={inputClass}
        />
      )}

      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
