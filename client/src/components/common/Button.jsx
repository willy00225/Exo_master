import { clsx } from 'clsx';

const Button = ({ children, variant = 'primary', className, ...props }) => {
  const base = "px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary: "bg-violet-600 text-white hover:bg-violet-700 focus:ring-violet-500",
    outline: "border border-slate-300 text-slate-700 hover:bg-slate-100 focus:ring-slate-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
  };
  return (
    <button className={clsx(base, variants[variant], className)} {...props}>
      {children}
    </button>
  );
};

export default Button;