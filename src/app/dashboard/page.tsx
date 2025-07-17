"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "@/hooks/use-auth";

export default function Dashboard() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  useEffect(() => {
    if (!session && !isPending) {
      router.push("/auth/sign-in");
    }
  }, [session, isPending]);

  if (isPending) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome {session?.user.name}</p>
    </div>
  );
}
