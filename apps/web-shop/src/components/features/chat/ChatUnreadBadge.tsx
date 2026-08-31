interface ChatUnreadBadgeProps {
  count: number;
}

export function ChatUnreadBadge({ count }: ChatUnreadBadgeProps) {
  if (count <= 0) return null;

  return (
    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm">
      {count > 9 ? "9+" : count}
    </span>
  );
}
