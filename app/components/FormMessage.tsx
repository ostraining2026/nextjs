type Props = { message: string | null; tone?: "error" | "success" };

export default function FormMessage({ message, tone = "error" }: Props) {
  if (!message) return null;
  const colors =
    tone === "error"
      ? "border-red-700 bg-red-50 text-red-800"
      : "border-green-700 bg-green-50 text-green-900";
  return (
    <p role={tone === "error" ? "alert" : "status"} className={`mb-4 rounded-md border px-3 py-2 text-sm ${colors}`}>
      {message}
    </p>
  );
}
