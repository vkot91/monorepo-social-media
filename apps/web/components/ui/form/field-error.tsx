export const FieldError = ({ message }: { message?: string }) => {
  if (!message) {
    return null;
  }

  return <span className="text-sm font-bold text-red-700">{message}</span>;
};
