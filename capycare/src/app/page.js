import Timer from "@/components/timer/timer";
import { NavBar } from "@/components/navBar/navbar";
import { ChatButton } from "@/components/chatButton/chatbutton";

export default function Home() {
  return (
    <div>
      <NavBar/>
      <Timer/>
      <ChatButton/>
    </div>
  );
}
