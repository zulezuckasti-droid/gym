import { BottomNav } from "@/components/bottom-nav";

export default function TabsLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-full flex-col pt-[var(--safe-area-top)]">
      <div className="flex flex-1 flex-col pb-[calc(3.5rem+var(--safe-area-bottom))]">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}
