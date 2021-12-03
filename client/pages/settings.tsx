import React, { useState, useEffect, useRef } from "react";
import eth from "../support/eth";
import WalletConnectButton from "./components/WalletConnectButton";
import NavBar from "./components/NavBar";
import { Howl } from "howler";
import { useProcessingIndicator } from "../hooks/use-processing-indicator";

function Settings() {
  const [currentAccount, setCurrentAccount] = useState(null);
  const [soundEffects, setSoundEffects] = useState([]);
  const [selectedBackgroundSoundEffect, setSelectedBackgroundSoundEffect] =
    useState(0);
  const [selectedPingSoundEffect, setSelectedPingSoundEffect] = useState(0);
  const [selectedThrustSoundEffect, setSelectedThrustSoundEffect] = useState(0);
  const [selectedExplosionSoundEffect, setSelectedExplosionSoundEffect] =
    useState(0);
  const [isPlaying, setIsPlaying] = useState([]);
  const soundPlayer = useRef(null);

  const processingIndicator = useProcessingIndicator();

  useEffect(() => {
    const { ethereum } = window;
    eth.isWalletConnected(ethereum, currentAccount, setCurrentAccount);
  }, [currentAccount]);

  useEffect(() => {
    const { ethereum } = window;
    if (ethereum) {
      ethereum.on("accountsChanged", () => {
        eth.isWalletConnected(ethereum, currentAccount, setCurrentAccount);
      });
      getSoundEfffects();
    }
    soundPlayer.current = new Howl({
      src: [""],
      format: ["mp3"],
      loop: false,
      volume: 1,
    });
    setIsPlaying(Object.values(SoundEffectTypeEnum).map((x) => false));
    return () => {
      stopPlaying();
    };
  }, []);

  const SoundEffectTypeEnum = {
    background: 0,
    explosion: 1,
    thrust: 2,
    ping: 3,
  };

  const getSoundEfffects = async () => {
    try {
      processingIndicator.setProcessing(true);
      const { ethereum } = window;
      const soundEffectContract = eth.getSoundEffectContract(ethereum);
      if (soundEffectContract) {
        const soundEffects = await soundEffectContract.getSoundEffects();
        const soundEffectData = await Promise.all(
          soundEffects.map((soundEffect) => {
            const id = Number(soundEffect.id);
            const name = soundEffect.name;
            const type = soundEffect.audioType;
            const audioPath = eth.toIpfsGatewayURL(
              soundEffect.audioURI.toString()
            ).href;
            return {
              id,
              type,
              name,
              audioPath,
            };
          })
        );

        setSoundEffects(soundEffectData);

        let soundEffectsPack = await soundEffectContract.getSoundEffectsPack();
        console.log({ soundEffectsPack });
        if (soundEffectsPack.length === 0) {
          const soundEffects = await soundEffectContract.getSoundEffects();
          console.log({ soundEffects });
          const tempSoundPack = [];
          tempSoundPack.push(soundEffects.filter((f) => f.audioType === 0)[0]);
          tempSoundPack.push(soundEffects.filter((f) => f.audioType === 1)[0]);
          tempSoundPack.push(soundEffects.filter((f) => f.audioType === 2)[0]);
          tempSoundPack.push(soundEffects.filter((f) => f.audioType === 3)[0]);
          soundEffectsPack = tempSoundPack;
        }
        console.log({ soundEffectsPack });
        soundEffectsPack.map((soundEffect) => {
          switch (soundEffect.audioType) {
            case SoundEffectTypeEnum.background:
              setSelectedBackgroundSoundEffect(Number(soundEffect.id));
              break;
            case SoundEffectTypeEnum.ping:
              setSelectedPingSoundEffect(Number(soundEffect.id));
              break;
            case SoundEffectTypeEnum.thrust:
              setSelectedThrustSoundEffect(Number(soundEffect.id));
              break;
            case SoundEffectTypeEnum.explosion:
              setSelectedExplosionSoundEffect(Number(soundEffect.id));
              break;
          }
        });
      }
      processingIndicator.setProcessing(false);
    } catch (err) {
      processingIndicator.setProcessing(false);
      alert(err.message);
      console.log(err);
    }
  };

  const handleSaveSettings = async (e) => {
    try {
      processingIndicator.setProcessing(true);
      e.preventDefault();
      const { ethereum } = window;
      const soundEffectContract = eth.getSoundEffectContract(ethereum);
      if (soundEffectContract) {
        const chosenSoundEffects = [
          selectedBackgroundSoundEffect,
          selectedPingSoundEffect,
          selectedThrustSoundEffect,
          selectedExplosionSoundEffect,
        ];
        console.log(chosenSoundEffects);
        const tx = await soundEffectContract.setSoundEffectsPack(
          chosenSoundEffects
        );
        tx.wait();
      }
      processingIndicator.setProcessing(false);
    } catch (err) {
      processingIndicator.setProcessing(false);
      alert(err.message);
      console.log(err);
    }
  };

  const handleSelectedSoundEffectChange = (e, setSelectedSoundEffect) => {
    try {
      e.preventDefault();
      stopPlaying();
      setSelectedSoundEffect(Number(e.target.value));
    } catch (err) {
      alert(err.message);
      console.log(err);
    }
  };

  const startPlaying = (audioPath, soundEffectTypEnum) => {
    console.log(audioPath);
    soundPlayer.current.stop();
    soundPlayer.current = new Howl({
      src: [audioPath],
      format: ["mp3"],
      loop: true,
      volume: 1,
    });
    soundPlayer.current.play();
    const newIsPlaying = Object.keys(SoundEffectTypeEnum).map((x) => false);
    newIsPlaying[soundEffectTypEnum] = true;
    setIsPlaying(newIsPlaying);
  };

  const stopPlaying = () => {
    soundPlayer.current.stop();
    const newIsPlaying = Object.keys(SoundEffectTypeEnum).map((x) => false);
    setIsPlaying(newIsPlaying);
  };

  const renderSoundEffectSelector = (
    label,
    soundEffectTypEnum,
    handleSelectedChange,
    selected
  ) => {
    return (
      <div className="flex justify-between space-x-4">
        <div className="text-lg text-white">{label}</div>
        <div className="flex space-x-2">
          <div className="">
            <select
              className="px-2 py-1 text-lg "
              value={selected}
              onChange={handleSelectedChange}
            >
              {soundEffects
                .filter((f) => f.type === soundEffectTypEnum)
                .map((soundEffect, index) => {
                  return (
                    <option key={index} value={soundEffect.id}>
                      {`${soundEffect.name} #${index + 1}`}
                    </option>
                  );
                })}
            </select>
          </div>
          <div className="flex">
            {isPlaying[soundEffectTypEnum] ? (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  stopPlaying();
                }}
              >
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
                  ></path>
                </svg>
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  console.log({
                    soundEffects,
                    selectedPingSoundEffect,
                    selected,
                  });
                  const selectedSoundEffect = soundEffects.find(
                    (soundEffect) => soundEffect.id === selected
                  );
                  console.log({ selectedSoundEffect });
                  startPlaying(
                    selectedSoundEffect.audioPath,
                    soundEffectTypEnum
                  );
                }}
              >
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  ></path>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col items-center h-screen">
      <NavBar />
      <h1 className="py-4 text-5xl font-bold text-white">Settings</h1>
      {currentAccount === "" ? (
        <WalletConnectButton onConnect={onConnect} />
      ) : (
        <div className="flex flex-wrap justify-center">
          <form>
            <div className="pt-4 pb-6 text-xl text-center text-yellow-500 uppercase">
              Sound Effects
            </div>
            <div className="space-y-4 w-[400px]">
              <div>
                {renderSoundEffectSelector(
                  "Background Music",
                  SoundEffectTypeEnum.background,
                  (e) =>
                    handleSelectedSoundEffectChange(
                      e,
                      setSelectedBackgroundSoundEffect
                    ),
                  selectedBackgroundSoundEffect
                )}
              </div>
              <div>
                {renderSoundEffectSelector(
                  "Ping",
                  SoundEffectTypeEnum.ping,
                  (e) =>
                    handleSelectedSoundEffectChange(
                      e,
                      setSelectedPingSoundEffect
                    ),
                  selectedPingSoundEffect
                )}
              </div>
              <div>
                {renderSoundEffectSelector(
                  "Explosion",
                  SoundEffectTypeEnum.explosion,
                  (e) =>
                    handleSelectedSoundEffectChange(
                      e,
                      setSelectedExplosionSoundEffect
                    ),
                  selectedExplosionSoundEffect
                )}
              </div>
              <div>
                {renderSoundEffectSelector(
                  "Thrust",
                  SoundEffectTypeEnum.thrust,
                  (e) =>
                    handleSelectedSoundEffectChange(
                      e,
                      setSelectedThrustSoundEffect
                    ),
                  selectedThrustSoundEffect
                )}
              </div>
              <div className="flex justify-end w-full pt-4">
                <button
                  className="px-4 py-2 font-bold text-white bg-green-600 rounded-xl hover:bg-indigo-100 hover:text-indigo-600"
                  onClick={handleSaveSettings}
                >
                  SAVE
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default Settings;
