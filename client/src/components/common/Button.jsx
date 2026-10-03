import { clsx } from 'clsx';

const Button = ({ 
  children, 
  variant = 'primary', 
  className, 
  type = 'button', 
  ...props 
}) => {
  const base = "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0B0E1A] disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";

  const variants = {
    primary: "bg-gradient-to-r from-violet-600 to-cyan-600 text-white hover:from-violet-700 hover:to-cyan-700 focus:ring-violet-500 shadow-lg",
    secondary: "bg-white/10 text-white hover:bg-white/20 focus:ring-white/30 border border-white/10",
    outline: "border border-white/20 text-slate-300 hover:bg-white/10 hover:text-white focus:ring-white/30",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
  };

  return (
    <button 
      type={type}
      className={clsx(base, variants[variant], className)} 
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;