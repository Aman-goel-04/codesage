import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div>
      <button onClick={() => {
        router.push("http://localhost:3001/auth/github");
      }}>
        Connect Github 
      </button>
    </div>
  );
}