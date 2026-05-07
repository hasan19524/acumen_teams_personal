import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function usePublicRoute() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.replace("/dashboard");
    }
  }, [router]);
}
