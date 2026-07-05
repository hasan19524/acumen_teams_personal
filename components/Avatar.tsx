import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useAvatarStore } from "@/lib/stores/avatarStore";

const sizeMap: Record<string, { box: string; text: string }> = {
  xs: { box: "w-6 h-6", text: "text-[10px]" },
  sm: { box: "w-8 h-8", text: "text-xs" },
  md: { box: "w-10 h-10", text: "text-sm" },
  lg: { box: "w-24 h-24", text: "text-3xl" },
  chat: { box: "w-7 h-7", text: "text-[11px]" },
};

export default function Avatar({
  user,
  src,
  name,
  size = "md",
  className = "",
}: any) {
  const s = sizeMap[size] || sizeMap.md;
  const [imgError, setImgError] = useState(false);

  // 1. Try to resolve from global cache
  // FIX: Return the raw record object to maintain stable reference and prevent infinite loops
  const userId = user?.id || user?.user_id;
  const cached = useAvatarStore((state) =>
    userId ? state.users[userId] : null,
  );

  // 2. Fallback to props if not in cache, and check expiry safely
  const isCacheExpired = cached && cached.expiresAt < Date.now();
  let imageSrc =
    src ||
    (cached && !isCacheExpired ? cached.avatarUrl : null) ||
    user?.profile_image ||
    user?.avatar_url;
  let displayName = name || cached?.name || user?.full_name || "";

  useEffect(() => {
    setImgError(false);
  }, [imageSrc]);

  const getInitials = () => {
    let fullName = displayName;
    if (!fullName && user) {
      fullName = `${user.first_name || ""} ${user.last_name || ""}`.trim();
    }
    if (fullName) {
      const parts = fullName.split(/\s+/);
      if (parts.length >= 2 && parts[0] && parts[1])
        return (parts[0][0] + parts[1][0]).toUpperCase();
      if (parts.length === 1 && parts[0].length > 0)
        return parts[0][0].toUpperCase();
    }
    if (user?.username) return user.username.charAt(0).toUpperCase();
    return "U";
  };

  return (
    <div
      className={`relative flex items-center justify-center rounded-full font-bold text-white flex-shrink-0 overflow-hidden ${s.box} ${s.text} ${className}`}
      style={{ background: "linear-gradient(135deg, #4B1587, #5DADE2)" }}
    >
      {imageSrc && !imgError ? (
        <Image
          src={imageSrc}
          alt={displayName || "Avatar"}
          fill
          unoptimized // Required for S3 Presigned URLs
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        getInitials()
      )}
    </div>
  );
}
