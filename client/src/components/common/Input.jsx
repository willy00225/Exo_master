import { clsx } from 'clsx';
import { useId } from 'react';

const Input = ({ label, error, className, id, ...props }) => {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className="mb-4">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-slate-300 mb-1"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={clsx(
          "w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-slate-500",
          "focus:outline-none focus:ring-2 focus:border-transparent transition-all",
          error
            ? "border-red-500/50 focus:ring-red-500"
            : "border-white/20 focus:ring-violet-500",
          className
        )}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="mt-1 text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
};

export default Input;