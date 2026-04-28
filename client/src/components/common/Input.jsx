const Input = ({ label, error, ...props }) => {
  return (
    <div className="mb-4">
      {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
      <input
        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};
export default Input;