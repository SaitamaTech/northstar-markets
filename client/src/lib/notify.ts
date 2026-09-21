import { toast } from "sonner";

export function notify(message: string, type: "info" | "success" | "error" = "info") {
  if (type === "success") toast.success(message);
  else if (type === "error") toast.error(message);
  else toast.info(message);
}
