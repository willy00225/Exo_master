import { clsx } from 'clsx';

const Card = ({ children, className, hover = false }) => {
  return (
    <div
      className={clsx(
        "bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-6 shadow-lg",
        hover && "hover:bg-white/10 transition-colors",
        className
      )}
    >
      {children}
    </div>
  );
};

export default Card;