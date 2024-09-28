import Timer from "@/components/timer/timer";
import { NavBar } from "@/components/navBar/navbar";
import { NavButtons } from "@/components/mainPage/navButtons";
import { Title } from "@/components/mainPage/title";

export default function Home() {
  return (
    <div className="flex flex-col h-screen">
      <NavBar showSettings={false} />
      <div className="flex-grow flex flex-col items-center justify-center space-y-8">
        <Title />
        <NavButtons />
      </div>
    </div>
  );
}