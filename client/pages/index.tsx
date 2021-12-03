import type { NextPage } from "next";
import React from "react";
import Footer from "./components/Footer";

const HomePage: NextPage = () => {
  return (
    <div className="flex flex-col justify-start h-screen bg-black ">
      <img className="w-[800px] mx-auto" src="/home_splash.png" />
      <div className="flex flex-col items-center justify-start space-y-2">
        <a className="text-2xl text-white" href="/builder">
          Rocket Builder
        </a>
        <a className="text-2xl text-white" href="/launch">
          Launchpad
        </a>
        <a className="text-2xl text-white" href="/hanger">
          Rocket Hanger
        </a>
        <a className="text-2xl text-white" href="/marketplace">
          Rocket Marketplace
        </a>
        <a className="text-2xl text-white" href="/settings">
          Settings
        </a>
      </div>
      <div className="flex items-end justify-center flex-grow h-full">
        <Footer />
      </div>
    </div>
  );
};

export default HomePage;
