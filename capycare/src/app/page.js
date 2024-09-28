import Timer from "@/components/timer/timer";
import { NavBar } from "@/components/navBar/navbar";
import { ChatButton } from "@/components/chatButton/chatbutton";
import { NavButtons } from "@/components/mainPage/navButtons";
import { Title } from "@/components/mainPage/title";

export default function Home() {
  return (
    <div>
      <NavBar/>
        <div className="min-h-screen flex flex-col items-center justify-center space-y-8">
          <Title/>
          <NavButtons/>
        </div>
      </div>
  );
}
