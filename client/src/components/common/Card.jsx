import { clsx } from 'clsx';

const Card = ({ children, className }) => {
  return (
    <div className={clsx("bg-white rounded-xl shadow-sm border border-slate-200 p-6", className)}>
      {children}
    </div>
  );
};
export default Card;